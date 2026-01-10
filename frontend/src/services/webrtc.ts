import { Socket } from 'socket.io-client';

export interface CallConfig {
    iceServers: RTCIceServer[];
}

export type CallEvent = 'localStream' | 'remoteStream' | 'connectionState' | 'error';
export type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

type EventHandler = (data: any) => void;

class WebRTCService {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private socket: Socket | null = null;
    private remoteUserId: number | null = null;
    private eventListeners: Map<CallEvent, EventHandler[]> = new Map();

    // Google's free STUN servers
    private config: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
        ]
    };

    initialize(socket: Socket) {
        this.socket = socket;
        this.setupSocketListeners();
    }

    on(event: CallEvent, handler: EventHandler) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)?.push(handler);
    }

    off(event: CallEvent, handler: EventHandler) {
        const handlers = this.eventListeners.get(event);
        if (handlers) {
            this.eventListeners.set(event, handlers.filter(h => h !== handler));
        }
    }

    private emit(event: CallEvent, data: any) {
        this.eventListeners.get(event)?.forEach(handler => handler(data));
    }

    async startCall(targetUserId: number, video: boolean = false): Promise<MediaStream> {
        this.remoteUserId = targetUserId;
        await this.createPeerConnection(targetUserId);
        const stream = await this.getLocalStream(video);

        try {
            const offer = await this.peerConnection!.createOffer();
            await this.peerConnection!.setLocalDescription(offer);

            this.socket?.emit('call:signal', {
                targetUserId,
                type: 'offer',
                payload: offer
            });

            return stream;
        } catch (error) {
            console.error('Error starting call:', error);
            this.emit('error', error);
            throw error;
        }
    }

    async handleIncomingCall(callerId: number, offer: RTCSessionDescriptionInit, video: boolean = false): Promise<MediaStream> {
        this.remoteUserId = callerId;
        await this.createPeerConnection(callerId);
        const stream = await this.getLocalStream(video);

        try {
            await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await this.peerConnection!.createAnswer();
            await this.peerConnection!.setLocalDescription(answer);

            this.socket?.emit('call:signal', {
                targetUserId: callerId,
                type: 'answer',
                payload: answer
            });

            return stream;
        } catch (error) {
            console.error('Error answering call:', error);
            this.emit('error', error);
            throw error;
        }
    }

    async endCall() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
            });
            this.localStream = null;
        }

        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        this.emit('connectionState', 'closed');
        // socket emit 'call:end' should be handled by the UI component
    }

    async toggleMute(enabled: boolean) {
        // enabled = microphone is ON (unmuted)
        // false = microphone is OFF (muted)

        if (enabled) {
            // Unmute: Get new stream and replace track
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const newTrack = stream.getAudioTracks()[0];

                if (this.peerConnection) {
                    const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'audio');
                    if (sender) {
                        await sender.replaceTrack(newTrack);
                    }
                }

                // Update local stream reference
                if (this.localStream) {
                    const oldTrack = this.localStream.getAudioTracks()[0];
                    if (oldTrack) {
                        this.localStream.removeTrack(oldTrack);
                        oldTrack.stop(); // Ensure old is stopped
                    }
                    this.localStream.addTrack(newTrack);
                } else {
                    this.localStream = stream;
                    this.emit('localStream', stream);
                }
            } catch (err) {
                console.error('Failed to unmute (re-acquire mic):', err);
            }
        } else {
            // Mute: Stop track (releases hardware)
            if (this.localStream) {
                this.localStream.getAudioTracks().forEach(track => {
                    track.stop(); // True mute
                    // We don't remove it yet, or we assume stopped track sends silence?
                    // actually stopped track ends. RtcSender might need handling?
                    // replaceTrack(null) stops sending.
                    track.enabled = false; // Just to be sure state is off before stop
                    track.stop();
                });

                // Also tell sender?
                // If track is stopped, standard says it sends silence (black/silence).
                // However, replaceTrack(null) is more explicit for "no audio".
                // But we want to keep the "Muted" state.
            }
        }
    }



    // Private helpers

    private async setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('call:signal', async (data: { senderId: number; type: string; payload: any }) => {
            if (!this.peerConnection) return;

            try {
                if (data.type === 'answer') {
                    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.payload));
                } else if (data.type === 'ice-candidate') {
                    if (data.payload) {
                        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.payload));
                    }
                }
            } catch (error) {
                console.error('Error handling signal:', error);
            }
        });
    }

    private async createPeerConnection(targetUserId: number) {
        if (this.peerConnection) {
            this.peerConnection.close();
        }

        this.peerConnection = new RTCPeerConnection(this.config);

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket?.emit('call:signal', {
                    targetUserId,
                    type: 'ice-candidate',
                    payload: event.candidate
                });
            }
        };

        this.peerConnection.ontrack = (event) => {
            this.emit('remoteStream', event.streams[0]);
        };

        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection?.connectionState;
            this.emit('connectionState', state);

            if (state === 'failed') {
                // Auto-reconnect (ICE restart)
                console.log('Connection failed, attempting ICE restart...');
                this.restartIce();
            }
        };
    }

    async restartIce() {
        if (!this.peerConnection) return;

        try {
            const offer = await this.peerConnection.createOffer({ iceRestart: true });
            await this.peerConnection.setLocalDescription(offer);

            // Re-signal offer
            if (this.remoteUserId) {
                this.socket?.emit('call:signal', {
                    targetUserId: this.remoteUserId,
                    type: 'offer',
                    payload: offer
                });
            }
        } catch (e) {
            console.error('ICE restart failed', e);
            this.emit('error', new Error('Reconnection failed'));
        }
    }

    async toggleVideo(enabled: boolean) {
        if (!this.localStream) return;

        const videoTrack = this.localStream.getVideoTracks()[0];

        if (enabled) {
            if (videoTrack) {
                videoTrack.enabled = true;
            } else {
                // Upgrade: Add video track
                try {
                    const videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                    const newTrack = videoStream.getVideoTracks()[0];

                    this.localStream.addTrack(newTrack);

                    if (this.peerConnection) {
                        this.peerConnection.addTrack(newTrack, this.localStream);

                        // Negotiate
                        const offer = await this.peerConnection.createOffer();
                        await this.peerConnection.setLocalDescription(offer);

                        if (this.remoteUserId) {
                            this.socket?.emit('call:signal', {
                                targetUserId: this.remoteUserId,
                                type: 'offer',
                                payload: offer
                            });
                        }
                    }
                } catch (err) {
                    console.error('Failed to enable video:', err);
                    this.emit('error', new Error('Could not enable camera'));
                }
            }
        } else {
            if (videoTrack) {
                videoTrack.enabled = false;
                videoTrack.stop();
                this.localStream.removeTrack(videoTrack);

                if (this.peerConnection) {
                    const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        this.peerConnection.removeTrack(sender);
                    }
                }
            }
        }
    }

    private async getLocalStream(video: boolean): Promise<MediaStream> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: video ? { facingMode: 'user' } : false
            });

            this.localStream = stream;
            this.emit('localStream', stream);

            if (this.peerConnection) {
                stream.getTracks().forEach(track => {
                    this.peerConnection!.addTrack(track, stream);
                });
            }

            return stream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw error;
        }
    }

    async getConnectionQuality(): Promise<'good' | 'fair' | 'poor' | 'unknown'> {
        if (!this.peerConnection) return 'unknown';

        try {
            const stats = await this.peerConnection.getStats();
            let rtt = 0;
            let candidatePairFound = false;

            stats.forEach(report => {
                if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.currentRoundTripTime) {
                    rtt = report.currentRoundTripTime * 1000;
                    candidatePairFound = true;
                }
            });

            if (!candidatePairFound) return 'unknown';

            if (rtt < 100) return 'good';
            if (rtt < 300) return 'fair';
            return 'poor';

        } catch (e) {
            console.error('Error getting stats:', e);
            return 'unknown';
        }
    }
}

export default new WebRTCService();
