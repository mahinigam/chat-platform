import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff } from 'lucide-react';
import { motion } from 'framer-motion';
import webrtcService from '../../services/webrtc';

interface CallScreenProps {
    visible: boolean;
    remoteStream: MediaStream | null;
    localStream: MediaStream | null;
    status: string; // connecting, connected, failed
    callType: 'voice' | 'video';
    onEndCall: () => void;
}

const CallScreen: React.FC<CallScreenProps> = ({
    visible,
    remoteStream,
    localStream,
    status,
    callType,
    onEndCall
}) => {
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [muted, setMuted] = useState(false);
    const [cameraOff, setCameraOff] = useState(callType === 'voice');
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Format call duration if needed, or status text

    const toggleMute = () => {
        webrtcService.toggleMute(!muted);
        setMuted(!muted);
    };

    const toggleCamera = () => {
        webrtcService.toggleVideo(cameraOff); // if currently off, enable it (true)
        setCameraOff(!cameraOff);
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            await webrtcService.startScreenShare();
            setIsScreenSharing(true);
            setCameraOff(true); // Camera is implicitly off
        } else {
            await webrtcService.stopScreenShare();
            setIsScreenSharing(false);
            setCameraOff(false); // Camera explicitly back on
        }
    };

    const showControls = () => {
        setControlsVisible(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            setControlsVisible(false);
        }, 3000);
    };

    const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor' | 'unknown'>('unknown');

    useEffect(() => {
        if (status === 'connected') {
            const interval = setInterval(async () => {
                const quality = await webrtcService.getConnectionQuality();
                setConnectionQuality(quality);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [status]);

    const getQualityColor = () => {
        switch (connectionQuality) {
            case 'good': return 'text-green-400 border-green-400/20 bg-green-900/20';
            case 'fair': return 'text-yellow-400 border-yellow-400/20 bg-yellow-900/20';
            case 'poor': return 'text-red-400 border-red-400/20 bg-red-900/20';
            default: return 'text-zinc-400 border-white/5 bg-black/30';
        }
    };

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[70] bg-black flex items-center justify-center overflow-hidden"
            onMouseMove={showControls}
            onTouchStart={showControls}
        >
            {/* Remote Video (Full Screen) */}
            <div className="absolute inset-0 flex items-center justify-center">
                {status === 'connected' && remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                        <div className="w-24 h-24 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                            <span className="text-3xl">👤</span>
                        </div>
                        <p className="text-zinc-400 font-mono tracking-wider">{status}...</p>
                    </div>
                )}
            </div>

            {/* Local Video (PiP) - Only if video call */}
            {callType === 'video' && localStream && (
                <div className="absolute top-6 right-6 w-32 md:w-48 aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-white/10 shadow-xl">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${cameraOff && !isScreenSharing ? 'hidden' : ''}`}
                    />
                    {cameraOff && (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                            <VideoOff size={20} />
                        </div>
                    )}
                </div>
            )}

            {/* Controls */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: controlsVisible ? 1 : 0, y: controlsVisible ? 0 : 50 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-4 bg-black/50 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-6"
            >
                <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-all ${muted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    {muted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                {callType === 'video' && (
                    <>
                        <button
                            onClick={toggleCamera}
                            disabled={isScreenSharing}
                            className={`p-4 rounded-full transition-all ${cameraOff ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'} ${isScreenSharing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {cameraOff ? <VideoOff size={24} /> : <Video size={24} />}
                        </button>

                        <button
                            onClick={toggleScreenShare}
                            className={`p-4 rounded-full transition-all ${isScreenSharing ? 'bg-blue-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
                        </button>
                    </>
                )}

                <button
                    onClick={onEndCall}
                    className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all transform hover:scale-105"
                >
                    <PhoneOff size={24} />
                </button>
            </motion.div>

            {/* Connection Quality / Status Overlay */}
            <div className="absolute top-6 left-6 flex flex-col gap-2 items-start">
                <div className="px-3 py-1 bg-black/30 backdrop-blur rounded text-xs text-zinc-400 font-mono border border-white/5">
                    {status.toUpperCase()}
                </div>
                {status === 'connected' && (
                    <div className={`px-3 py-1 backdrop-blur rounded text-xs font-mono border flex items-center gap-2 ${getQualityColor()}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${connectionQuality === 'good' ? 'bg-green-400' : connectionQuality === 'fair' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                        {connectionQuality.toUpperCase()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallScreen;
