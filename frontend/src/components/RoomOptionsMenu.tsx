import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, VolumeX, Volume2, Ban, UserCheck } from 'lucide-react';
import { cn } from '../utils/theme';
import ChromeButton from './ChromeButton';
import MuteModal from './MuteModal';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface RoomOptionsMenuProps {
    roomId: number;
    userId?: number;
    roomName: string;
    isMuted?: boolean;
    isBlocked?: boolean;
    token: string;
    onMuteChange?: (muted: boolean) => void;
    onBlockChange?: (blocked: boolean) => void;
    className?: string;
}

const RoomOptionsMenu: React.FC<RoomOptionsMenuProps> = ({
    roomId,
    userId,
    roomName,
    isMuted = false,
    isBlocked = false,
    token,
    onMuteChange,
    onBlockChange,
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
    const [localMuted, setLocalMuted] = useState(isMuted);
    const [localBlocked, setLocalBlocked] = useState(isBlocked);
    const [isLoading, setIsLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMuteWithDuration = async (until?: Date) => {
        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/rooms/${roomId}/mute`,
                { until: until?.toISOString() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLocalMuted(true);
            onMuteChange?.(true);
        } catch (error) {
            console.error('Mute room error:', error);
        } finally {
            setIsLoading(false);
            setIsMuteModalOpen(false);
        }
    };

    const handleUnmute = async () => {
        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/rooms/${roomId}/unmute`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLocalMuted(false);
            onMuteChange?.(false);
        } catch (error) {
            console.error('Unmute room error:', error);
        } finally {
            setIsLoading(false);
            setIsOpen(false);
        }
    };

    const handleBlockUser = async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            if (localBlocked) {
                await axios.post(`${API_URL}/users/${userId}/unblock`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLocalBlocked(false);
                onBlockChange?.(false);
            } else {
                await axios.post(`${API_URL}/users/${userId}/block`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLocalBlocked(true);
                onBlockChange?.(true);
            }
        } catch (error) {
            console.error('Block user error:', error);
        } finally {
            setIsLoading(false);
            setIsOpen(false);
        }
    };

    return (
        <>
            <div className={cn("relative", className)} ref={menuRef}>
                <ChromeButton
                    variant="circle"
                    className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-mono-muted hover:text-mono-text"
                    aria-label="More options"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <MoreVertical className="w-5 h-5" />
                </ChromeButton>

                {isOpen && (
                    <div
                        className={cn(
                            "absolute top-full right-0 mt-2 w-56",
                            "bg-mono-bg/95 backdrop-blur-xl border border-mono-glass-border",
                            "rounded-2xl shadow-2xl overflow-hidden z-[100] p-1"
                        )}
                    >
                        {/* Mute Option */}
                        <button
                            onClick={() => {
                                if (localMuted) {
                                    handleUnmute();
                                } else {
                                    setIsOpen(false);
                                    setIsMuteModalOpen(true);
                                }
                            }}
                            disabled={isLoading}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5",
                                "text-sm text-mono-text hover:bg-mono-surface",
                                "rounded-xl transition-colors text-left group",
                                isLoading && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {localMuted ? (
                                <>
                                    <Volume2 className="w-4 h-4 text-mono-muted group-hover:text-mono-text" />
                                    <span>Unmute {roomName}</span>
                                </>
                            ) : (
                                <>
                                    <VolumeX className="w-4 h-4 text-mono-muted group-hover:text-mono-text" />
                                    <span>Mute {roomName}</span>
                                </>
                            )}
                        </button>

                        {/* Block Option */}
                        {userId && (
                            <button
                                onClick={handleBlockUser}
                                disabled={isLoading}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5",
                                    "text-sm hover:bg-mono-surface",
                                    "rounded-xl transition-colors text-left group",
                                    localBlocked ? "text-green-400 hover:text-green-300" : "text-red-400 hover:text-red-300",
                                    isLoading && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {localBlocked ? (
                                    <>
                                        <UserCheck className="w-4 h-4" />
                                        <span>Unblock User</span>
                                    </>
                                ) : (
                                    <>
                                        <Ban className="w-4 h-4" />
                                        <span>Block User</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Mute Duration Modal */}
            <MuteModal
                isOpen={isMuteModalOpen}
                onClose={() => setIsMuteModalOpen(false)}
                onMute={handleMuteWithDuration}
                targetName={roomName}
                isLoading={isLoading}
            />
        </>
    );
};

export default RoomOptionsMenu;
