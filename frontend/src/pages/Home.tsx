import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Video, Phone, Search, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import Composer from '../components/Composer';
import Modal from '../components/Modal';
import AudioRecorder from '../components/AudioRecorder';
import { useToast } from '../hooks/useToast';
import { useMessageDelete } from '../hooks/useMessageDelete';
import { cn } from '../utils/theme';
import socketService from '../services/socket';
import axios from 'axios';
import { uploadFile } from '../api/upload';
import { useNavigate } from 'react-router-dom';
import ToastContainer from '../components/Toast';
import ChromeButton from '../components/ChromeButton';

// Lazy load heavy components (code splitting)
const PollCreator = React.lazy(() => import('../components/PollCreator'));
const LocationPicker = React.lazy(() => import('../components/LocationPicker'));
const GifPicker = React.lazy(() => import('../components/GifPicker'));
const OrbitSearch = React.lazy(() => import('../components/OrbitSearch'));
const ChatSearch = React.lazy(() => import('../components/ChatSearch'));
import UndoToast from '../components/UndoToast';
import ScheduleModal from '../components/ScheduleModal';

// Loading fallback for lazy components
const LazyFallback = () => (
    <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-mono-muted animate-spin" />
    </div>
);


interface Room {
    id: number;
    name: string;
    room_type: 'direct' | 'group';
    last_message_content?: string;
    last_message_at?: string;
    last_sender_username?: string;
    isOnline?: boolean;
    unread?: number;
}

interface Message {
    id: string;
    roomId: number;
    sender: {
        id: number;
        name: string;
        avatar?: string;
    };
    content: string;
    messageType?: 'text' | 'image' | 'video' | 'audio' | 'file' | 'poll' | 'location' | 'gif' | 'sticker' | 'youtube';
    metadata?: any;
    timestamp: Date | string;
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    isOwn: boolean;
    tempId?: string;
    reactions?: Array<{
        emoji: string;
        count: number;
        by: string[];
    }>;
}

function Home() {
    const navigate = useNavigate();
    const [isConnected, setIsConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(() => {
        const stored = localStorage.getItem('token');
        return stored && stored !== 'null' && stored !== 'undefined' ? stored : null;
    });

    // Data state
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    // UI state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isPollCreatorOpen, setIsPollCreatorOpen] = useState(false);
    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
    const [isOrbitSearchOpen, setIsOrbitSearchOpen] = useState(false);
    const [isAudioRecording, setIsAudioRecording] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [activeSearchQuery, setActiveSearchQuery] = useState('');
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleContent, setScheduleContent] = useState('');


    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toasts, dismissToast, success, error: errorToast } = useToast();
    const { deleteForMe, deleteForEveryone, undoDelete, unhideForMe, pendingDelete, clearPendingDelete } = useMessageDelete();
    const [showUndoToast, setShowUndoToast] = useState(false);
    const [lastDeletedMessage, setLastDeletedMessage] = useState<Message | null>(null);
    const [lastDeleteMode, setLastDeleteMode] = useState<'me' | 'everyone'>('me');

    const API_URL = import.meta.env.VITE_API_URL || `http://localhost:3000/api`;

    // Logout Helper
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setCurrentUser(null);
        setIsConnected(false);
        socketService.disconnect();
        navigate('/login');
    }, [navigate]);

    // Socket connection
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const timeoutId = setTimeout(() => {
            if (!isConnected) {
                console.log('Connection timed out, logging out...');
                logout();
            }
        }, 5000);

        const socket = socketService.connect(token);

        if (socket.connected) {
            setIsConnected(true);
        }

        socket.on('connect', () => {
            setIsConnected(true);
            clearTimeout(timeoutId);
            console.log('Connected to chat server');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Disconnected from chat server');
        });

        socket.on('connect_error', (err) => {
            console.error('Connection error:', err);
            setIsConnected(false);
            if (err.message.includes('jwt') || err.message.includes('Authentication') || err.message.includes('token')) {
                logout();
            }
        });

        socket.on('auth_error', (err) => {
            console.error('Auth error:', err);
            logout();
        });

        // Decode token
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentUser({
                id: payload.userId,
                username: payload.username
            });
        } catch (e) {
            console.error('Invalid token', e);
            logout();
        }

        return () => {
            clearTimeout(timeoutId);
            socketService.disconnect();
        };
    }, [token, logout]);

    // Fetch rooms
    useEffect(() => {
        if (!token || !isConnected) return;

        const fetchRooms = async () => {
            try {
                const response = await axios.get(`${API_URL}/rooms`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRooms(response.data.rooms);
            } catch (err) {
                console.error('Failed to fetch rooms', err);
                errorToast('Failed to load rooms');
            }
        };

        fetchRooms();
    }, [token, isConnected, API_URL, errorToast]);

    // Fetch messages
    useEffect(() => {
        if (!selectedRoomId || !token) return;

        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const response = await axios.get(`${API_URL}/messages/room/${selectedRoomId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const loadedMessages = response.data.messages.map((msg: any) => ({
                    id: msg.id,
                    roomId: msg.room_id,
                    sender: {
                        id: msg.sender_id,
                        name: msg.sender_username || 'Unknown',
                        avatar: msg.sender_avatar
                    },
                    content: msg.content,
                    messageType: msg.message_type,
                    metadata: msg.metadata,
                    timestamp: msg.created_at,
                    status: 'read',
                    isOwn: msg.sender_id === currentUser?.id,
                    reactions: []
                }));

                setMessages(loadedMessages);
            } catch (err) {
                console.error('Failed to fetch messages', err);
                errorToast('Failed to load messages');
            } finally {
                setIsLoadingMessages(false);
            }
        };

        fetchMessages();
        socketService.joinRoom(selectedRoomId);

        return () => {
            if (selectedRoomId) {
                socketService.leaveRoom(selectedRoomId);
            }
        };
    }, [selectedRoomId, token, currentUser, API_URL, errorToast]);

    // Socket listeners
    useEffect(() => {
        if (!socketService.getSocket()) return;

        const handleNewMessage = (message: any) => {
            if (selectedRoomId && message.room_id === selectedRoomId) {
                const newMessage: Message = {
                    id: message.id,
                    roomId: message.room_id,
                    sender: {
                        id: message.sender.id,
                        name: message.sender.username,
                        avatar: message.sender.avatar
                    },
                    content: message.content,
                    messageType: message.message_type,
                    metadata: message.metadata,
                    timestamp: message.created_at,
                    status: 'delivered',
                    isOwn: message.sender.id === currentUser?.id,
                    reactions: []
                };

                setMessages(prev => {
                    if (prev.some(m => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });
            }

            setRooms(prev => prev.map(room => {
                if (room.id === message.room_id) {
                    return {
                        ...room,
                        last_message_content: message.message_type === 'text' ? message.content : `Sent a ${message.message_type}`,
                        last_message_at: message.created_at,
                        last_sender_username: message.sender.username
                    };
                }
                return room;
            }));
        };

        const handlePollUpdate = (data: any) => {
            if (selectedRoomId && data.roomId === selectedRoomId) {
                setMessages(prev => prev.map(msg => {
                    if (msg.id === data.pollId) {
                        return {
                            ...msg,
                            metadata: {
                                ...msg.metadata,
                                options: data.options
                            }
                        };
                    }
                    return msg;
                }));
            }
        }

        // Handle real-time reaction updates
        const handleReactionUpdate = (data: any) => {
            if (selectedRoomId && data.messageId) {
                setMessages(prev => prev.map(msg => {
                    if (msg.id === data.messageId) {
                        return {
                            ...msg,
                            reactions: data.reactions.map((r: any) => ({
                                emoji: r.emoji,
                                count: r.count,
                                by: r.users || []
                            }))
                        };
                    }
                    return msg;
                }));
            }
        };

        socketService.on('message:new', handleNewMessage);
        socketService.on('poll:updated', handlePollUpdate);
        socketService.on('reaction:update', handleReactionUpdate);

        return () => {
            socketService.off('message:new', handleNewMessage);
            socketService.off('poll:updated', handlePollUpdate);
            socketService.off('reaction:update', handleReactionUpdate);
        };
    }, [selectedRoomId, currentUser]);

    // Keyboard shortcut for search (Cmd+F / Ctrl+F)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'f' && selectedRoomId) {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedRoomId]);


    const handleSendMessage = useCallback(
        async (content: string, type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'poll' | 'location' | 'gif' | 'sticker' | 'youtube' = 'text', metadata?: any) => {
            if (!selectedRoomId || !currentUser) return;

            const tempId = Date.now().toString();

            const optimisticMessage: Message = {
                id: tempId,
                roomId: selectedRoomId,
                sender: { id: currentUser.id, name: currentUser.username },
                content,
                messageType: type,
                metadata,
                timestamp: new Date(),
                status: 'sending',
                isOwn: true,
                tempId
            };

            setMessages(prev => [...prev, optimisticMessage]);

            socketService.emit('message:send', {
                roomId: selectedRoomId,
                content,
                messageType: type,
                metadata,
                tempId
            }, (response: any) => {
                if (response.success) {
                    setMessages(prev => prev.map(msg =>
                        msg.tempId === tempId
                            ? { ...msg, id: response.message.id, status: 'sent', tempId: undefined }
                            : msg
                    ));
                } else {
                    setMessages(prev => prev.map(msg =>
                        msg.tempId === tempId
                            ? { ...msg, status: 'failed' }
                            : msg
                    ));
                    errorToast(response.error || 'Failed to send message');
                }
            });
        },
        [selectedRoomId, currentUser, errorToast]
    );

    const handleAttachmentSelect = (type: 'image' | 'video' | 'file' | 'poll' | 'location' | 'gif' | 'music' | 'schedule') => {
        switch (type) {
            case 'schedule':
                setIsScheduleModalOpen(true);
                break;
            case 'poll':
                setIsPollCreatorOpen(true);
                break;
            case 'location':
                setIsLocationPickerOpen(true);
                break;
            case 'gif':
                setIsGifPickerOpen(true);
                break;
            case 'music':
                setIsOrbitSearchOpen(true);
                break;
            case 'image':
            case 'video':
            case 'file':
                if (fileInputRef.current) {
                    fileInputRef.current.accept = type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : '*/*';
                    fileInputRef.current.click();
                }
                break;
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const uploaded = await uploadFile(file);
            let type: 'image' | 'video' | 'file' | 'audio' = 'file';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('video/')) type = 'video';
            else if (file.type.startsWith('audio/')) type = 'audio';

            handleSendMessage(uploaded.url, type, {
                url: uploaded.url,
                originalName: uploaded.filename,
                mimetype: uploaded.mimetype,
                size: uploaded.size
            });
        } catch (err: any) {
            console.error('Upload failed', err);
            const errorMessage = err.response?.data?.error || err.message || 'Failed to upload file';
            errorToast(errorMessage);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePollSubmit = (question: string, options: string[], allowMultiple: boolean) => {
        handleSendMessage('Poll: ' + question, 'poll', {
            question,
            options: options.map(opt => ({ text: opt, votes: 0 })),
            allowMultiple
        });
    };

    const handleLocationSelect = (location: { lat: number; lng: number }) => {
        handleSendMessage('Shared Location', 'location', location);
        setIsLocationPickerOpen(false);
    };

    const handleGifSelect = (gif: any) => {
        handleSendMessage(gif.images.fixed_height.url, 'gif', {
            url: gif.images.fixed_height.url,
            width: gif.images.fixed_height.width,
            height: gif.images.fixed_height.height
        });
        setIsGifPickerOpen(false);
    };

    const handleOrbitSelect = (video: { videoId: string, title: string, thumbnail: string, channel: string }) => {
        handleSendMessage(video.title, 'youtube', {
            videoId: video.videoId,
            title: video.title,
            thumbnail: video.thumbnail,
            channelTitle: video.channel
        });
        setIsOrbitSearchOpen(false);
    };

    const handleAudioComplete = async (audioBlob: Blob) => {
        const file = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' });
        try {
            const uploaded = await uploadFile(file);
            handleSendMessage(uploaded.url, 'audio', {
                url: uploaded.url,
                originalName: 'Voice Note',
                mimetype: 'audio/webm',
                size: file.size
            });
            setIsAudioRecording(false);
        } catch (err) {
            console.error('Audio upload failed', err);
            errorToast('Failed to send voice note');
        }
    };

    const handlePollVote = (pollId: string, optionIndex: number) => {
        socketService.emit('poll:vote', { pollId, optionIndex });
    };

    // Handle emoji reaction toggle
    const handleReaction = useCallback((messageId: string, emoji: string) => {
        if (!selectedRoomId) return;

        // Optimistically update UI
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                const existingReactions = msg.reactions || [];
                const existingReaction = existingReactions.find(r => r.emoji === emoji);

                let newReactions;
                if (existingReaction) {
                    // Toggle off if user already reacted (optimistic)
                    if (existingReaction.count === 1) {
                        newReactions = existingReactions.filter(r => r.emoji !== emoji);
                    } else {
                        newReactions = existingReactions.map(r =>
                            r.emoji === emoji ? { ...r, count: r.count - 1 } : r
                        );
                    }
                } else {
                    // Add new reaction
                    newReactions = [...existingReactions, { emoji, count: 1, by: [currentUser?.username || ''] }];
                }

                return { ...msg, reactions: newReactions };
            }
            return msg;
        }));

        // Send to server
        socketService.toggleReaction(messageId, selectedRoomId, emoji, (response) => {
            if (!response.success) {
                errorToast(response.error || 'Failed to update reaction');
                // TODO: Could revert optimistic update here if needed
            }
        });
    }, [selectedRoomId, currentUser, errorToast]);

    const handleRoomSelect = useCallback((roomId: string) => {
        setSelectedRoomId(parseInt(roomId));
        setIsMobileMenuOpen(false);
    }, []);

    const handleCreateRoom = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    const handleScheduleMessage = async (date: Date) => {
        if (!selectedRoomId || !scheduleContent) return;

        setIsScheduling(true);
        try {
            await axios.post(`${API_URL}/messages/schedule`, {
                roomId: selectedRoomId,
                content: scheduleContent,
                scheduledAt: date.toISOString()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            success(`Message scheduled for ${date.toLocaleString()}`);
            setIsScheduleModalOpen(false);
            setScheduleContent('');
        } catch (err) {
            console.error('Schedule error:', err);
            errorToast('Failed to schedule message');
        } finally {
            setIsScheduling(false);
        }
    };



    const createRoom = async (name: string) => {
        try {
            const response = await axios.post(`${API_URL}/rooms`, {
                name,
                roomType: 'group',
                members: []
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newRoom = response.data.room;
            setRooms(prev => [newRoom, ...prev]);
            setSelectedRoomId(newRoom.id);
            setIsModalOpen(false);
            success('Room created successfully!');
        } catch (err) {
            console.error('Create room error:', err);
            errorToast('Failed to create room');
        }
    };

    if (!isConnected || !currentUser) {
        return (
            <div className="h-screen text-mono-text flex items-center justify-center flex-col gap-4">
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-3 h-3 rounded-full bg-mono-muted/40"
                        />
                    ))}
                </div>
                <p className="text-mono-muted">Connecting...</p>
                <ChromeButton
                    onClick={logout}
                    className="mt-4 px-4 py-2 text-sm"
                >
                    Cancel
                </ChromeButton>
            </div>
        );
    }

    const currentRoom = rooms.find(r => r.id === selectedRoomId);

    const sidebarRooms = rooms.map(r => ({
        id: r.id.toString(),
        name: r.name || 'Direct Message',
        unread: r.unread || 0,
        snippet: r.last_message_content,
        timestamp: r.last_message_at ? new Date(r.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        isOnline: r.isOnline
    }));

    return (
        <div className="h-screen w-full flex overflow-hidden">
            {/* Sidebar - Collapsible with motion */}
            <motion.div
                initial={{ width: 320, opacity: 1 }}
                animate={{
                    width: isSidebarOpen ? 320 : 0,
                    opacity: isSidebarOpen ? 1 : 0
                }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className={cn(
                    'hidden md:flex flex-shrink-0 h-full overflow-hidden',
                    'bg-mono-bg/40 backdrop-blur-glass border-r border-mono-glass-border',
                    'flex-col'
                )}
            >
                <div className="w-80 h-full">
                    <Sidebar
                        rooms={sidebarRooms}
                        selectedRoomId={selectedRoomId?.toString()}
                        onRoomSelect={handleRoomSelect}
                        onCreateRoom={handleCreateRoom}
                        onToggleSidebar={() => setIsSidebarOpen(false)}
                    />
                </div>
            </motion.div>

            <div className="flex-1 flex flex-col min-w-0 h-full">
                <div
                    className={cn(
                        'flex-shrink-0 h-16 px-4 py-3',
                        'border-b border-mono-glass-border',
                        'flex items-center justify-between gap-2',
                        'bg-mono-bg/40 backdrop-blur-glass'
                    )}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        {/* Toggle Sidebar Button (Only visible when sidebar is closed) */}
                        {!isSidebarOpen && (
                            <ChromeButton
                                onClick={() => setIsSidebarOpen(true)}
                                variant="circle"
                                className="hidden md:flex p-2 min-h-[40px] min-w-[40px] items-center justify-center text-mono-text mr-2 animate-fade-in"
                                title="Open Sidebar"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </ChromeButton>
                        )}

                        {/* Mobile Menu Toggle */}
                        <ChromeButton
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={cn(
                                'md:hidden p-2 rounded-glass',
                                'bg-mono-surface hover:bg-mono-surface/80',
                                'border border-mono-glass-border hover:border-mono-glass-highlight',
                                'text-mono-text hover:text-mono-text',
                                'min-h-[40px] min-w-[40px] flex items-center justify-center'
                            )}
                            aria-label="Toggle menu"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </ChromeButton>

                        {/* Room Info */}
                        {currentRoom && (
                            <div className="flex items-center gap-3 min-w-0">
                                {/* <Avatar src={currentRoom.avatar} name={currentRoom.name} size="md" isOnline={currentRoom.isOnline} /> */}
                                {/* Keeping it simple as per original layout, just text? Or add helper? 
                                    MainLayout had Avatar. Let's just keep text if no avatar data readily available/matched.
                                    The original code just had text. 
                                */}
                                <div className="min-w-0">
                                    <h2 className="text-base font-semibold text-mono-text truncate">
                                        {currentRoom.name}
                                    </h2>
                                    <p className="text-xs text-mono-muted truncate">
                                        {currentRoom.isOnline ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Header Actions */}
                    {currentRoom && (
                        <div className="flex gap-2 flex-shrink-0">
                            <ChromeButton
                                variant="circle"
                                className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-mono-muted hover:text-mono-text"
                                aria-label="Video Call"
                            >
                                <Video className="w-5 h-5" />
                            </ChromeButton>
                            <ChromeButton
                                variant="circle"
                                className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-mono-muted hover:text-mono-text"
                                aria-label="Voice Call"
                            >
                                <Phone className="w-5 h-5" />
                            </ChromeButton>
                            <ChromeButton
                                variant="circle"
                                className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-mono-muted hover:text-mono-text"
                                aria-label="Search"
                                onClick={() => setIsSearchOpen(true)}
                            >
                                <Search className="w-5 h-5" />
                            </ChromeButton>
                        </div>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-hidden relative">
                    {/* Chat Search Overlay */}
                    {selectedRoomId && (
                        <Suspense fallback={null}>
                            <ChatSearch
                                roomId={selectedRoomId}
                                isOpen={isSearchOpen}
                                onClose={() => {
                                    setIsSearchOpen(false);
                                    setActiveSearchQuery('');
                                }}
                                onQueryChange={setActiveSearchQuery}
                                onNavigateToMessage={(messageId) => {
                                    // Scroll to message and briefly highlight
                                    const element = document.getElementById(`message-${messageId}`);
                                    if (element) {
                                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        element.classList.add('bg-mono-surface-2/50');
                                        setTimeout(() => element.classList.remove('bg-mono-surface-2/50'), 2000);
                                    }
                                }}
                            />
                        </Suspense>
                    )}

                    <MessageList
                        messages={messages.map(m => ({
                            ...m,
                            sender: {
                                ...m.sender,
                                id: m.sender.id.toString()
                            },
                            roomId: m.roomId.toString()
                        }))}
                        isLoading={isLoadingMessages}
                        roomName={currentRoom?.name}
                        className="h-full"
                        searchQuery={activeSearchQuery}
                        onPollVote={handlePollVote}
                        onReaction={handleReaction}
                        onDelete={async (messageId: string, mode: 'me' | 'everyone') => {
                            if (!selectedRoomId) return;
                            try {
                                // Store message before deleting (for undo)
                                const msgToDelete = messages.find(m => m.id === messageId);
                                if (msgToDelete) {
                                    setLastDeletedMessage(msgToDelete);
                                    setLastDeleteMode(mode);
                                }

                                if (mode === 'me') {
                                    await deleteForMe(messageId, selectedRoomId);
                                    setMessages(prev => prev.filter(m => m.id !== messageId));
                                    setShowUndoToast(true);
                                } else {
                                    await deleteForEveryone(messageId, selectedRoomId);
                                    setMessages(prev => prev.filter(m => m.id !== messageId));
                                    setShowUndoToast(true);
                                    // Socket will broadcast to others
                                    socketService.emit('message:delete', { messageId, roomId: selectedRoomId, mode: 'everyone' });
                                }
                            } catch (err) {
                                errorToast('Failed to delete message');
                            }
                        }}
                    />

                    {/* Audio Recorder Overlay */}
                    {isAudioRecording && (
                        <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-center">
                            <AudioRecorder
                                onRecordingComplete={handleAudioComplete}
                                onCancel={() => setIsAudioRecording(false)}
                            />
                        </div>
                    )}
                </div>

                {/* Composer */}
                {currentRoom && !isAudioRecording && (
                    <Composer
                        onSendMessage={(content) => {
                            if (isScheduleModalOpen) {
                                setScheduleContent(content);
                            } else {
                                handleSendMessage(content); // type defaults to 'text'
                            }
                        }}
                        onAttachmentSelect={handleAttachmentSelect}
                        placeholder="Type a message..."
                        isSidebarOpen={isSidebarOpen}
                    />
                )}
            </div>

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* Modals - Lazy loaded with Suspense */}
            <Suspense fallback={<LazyFallback />}>
                <PollCreator
                    isOpen={isPollCreatorOpen}
                    onClose={() => setIsPollCreatorOpen(false)}
                    onSubmit={handlePollSubmit}
                />
            </Suspense>

            {isLocationPickerOpen && (
                <Suspense fallback={<LazyFallback />}>
                    <LocationPicker
                        onLocationSelect={handleLocationSelect}
                        onCancel={() => setIsLocationPickerOpen(false)}
                    />
                </Suspense>
            )}

            {isGifPickerOpen && (
                <Suspense fallback={<LazyFallback />}>
                    <GifPicker
                        onSelect={handleGifSelect}
                        onClose={() => setIsGifPickerOpen(false)}
                    />
                </Suspense>
            )}

            {isOrbitSearchOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
                    onClick={() => setIsOrbitSearchOpen(false)}
                >
                    <div onClick={e => e.stopPropagation()} className="w-full max-w-2xl h-[70vh]">
                        <Suspense fallback={<LazyFallback />}>
                            <OrbitSearch
                                onSelect={handleOrbitSelect}
                                onClose={() => setIsOrbitSearchOpen(false)}
                            />
                        </Suspense>
                    </div>
                </div>
            )}

            {isMobileMenuOpen && (
                <div
                    className={cn(
                        'fixed inset-0 z-40 md:hidden',
                        'bg-mono-bg/80 backdrop-blur-glass',
                        'animate-fade-up'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <div
                        className={cn(
                            'absolute inset-y-0 left-0 w-80',
                            'bg-mono-bg border-r border-mono-glass-border',
                            'shadow-lg',
                            'animate-slide-right'
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Sidebar
                            rooms={sidebarRooms}
                            selectedRoomId={selectedRoomId?.toString()}
                            onRoomSelect={handleRoomSelect}
                        />
                    </div>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                title="Create New Room"
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => {
                    const input = document.getElementById('new-room-name') as HTMLInputElement;
                    if (input && input.value) {
                        createRoom(input.value);
                    }
                }}
                confirmText="Create"
                contentClassName="space-y-4"
            >
                <input
                    id="new-room-name"
                    type="text"
                    placeholder="Room Name"
                    className="input-glass w-full"
                    autoFocus
                />
            </Modal>
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            <UndoToast
                isVisible={showUndoToast && !!lastDeletedMessage}
                duration={7000}
                onUndo={async () => {
                    if (lastDeletedMessage) {
                        let restored = false;
                        if (lastDeleteMode === 'me') {
                            // Undo Delete for Me - unhide the message
                            restored = await unhideForMe(lastDeletedMessage.id);
                        } else if (pendingDelete) {
                            // Undo Delete for Everyone - use undo token
                            restored = await undoDelete(pendingDelete.undoToken);
                        }

                        if (restored) {
                            // Re-add message to local state
                            setMessages(prev => [...prev, lastDeletedMessage].sort((a, b) =>
                                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                            ));
                            success('Message restored');
                            setLastDeletedMessage(null);
                        }
                    }
                    setShowUndoToast(false);
                }}
                onExpire={() => {
                    setShowUndoToast(false);
                    clearPendingDelete();
                    setLastDeletedMessage(null);
                }}
                onDismiss={() => setShowUndoToast(false)}
            />
            <ScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSchedule={handleScheduleMessage}
                isLoading={isScheduling}
            />
        </div>
    );
}

export default Home;
