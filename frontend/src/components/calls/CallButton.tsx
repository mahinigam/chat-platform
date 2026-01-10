import React, { useState } from 'react';
import { Phone, Video, Loader2 } from 'lucide-react';
import socketService from '../../services/socket';
import { useToast } from '../../hooks/useToast';

interface CallButtonProps {
    calleeId: number;
    roomId?: number;
    type: 'voice' | 'video';
}

const CallButton: React.FC<CallButtonProps> = ({ calleeId, roomId, type }) => {
    const socket = socketService.getSocket();
    const [loading, setLoading] = useState(false);
    const { error: errorToast } = useToast();

    const handleCall = async () => {
        setLoading(true);

        // 1. Check permissions
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === 'video'
            });
            // Stop stream immediately, just checking permissions
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            console.error('Permission denied:', error);
            errorToast('Please allow microphone/camera access to call');
            setLoading(false);
            return;
        }

        // 2. Initiate call signaling
        socket?.emit('call:initiate', {
            calleeId,
            callType: type,
            roomId
        });

        // Loading state will be cleared when call actually starts or errors
        // For safe UX, clear after 5s if nothing happens
        setTimeout(() => setLoading(false), 5000);
    };

    return (
        <button
            onClick={handleCall}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors relative group"
            title={type === 'voice' ? 'Voice Call' : 'Video Call'}
        >
            {loading ? (
                <Loader2 size={20} className="animate-spin" />
            ) : type === 'voice' ? (
                <Phone size={20} />
            ) : (
                <Video size={20} />
            )}

            {/* Tooltip */}
            <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-black/90 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {type === 'voice' ? 'Voice Call' : 'Video Call'}
            </span>
        </button>
    );
};

export default CallButton;
