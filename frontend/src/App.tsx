
import { useEffect, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import Composer from './components/Composer';
import Modal from './components/Modal';
import ToastContainer from './components/Toast';
import { useToast } from './hooks/useToast';
import { cn } from './utils/theme';
import socketService from './services/socket';
import axios from 'axios';
import './index.css';

interface Room {
  id: string;
  name: string;
  avatar?: string;
  unread: number;
  snippet?: string;
  timestamp?: string;
  isOnline?: boolean;
}

interface Message {
  id: string;
  roomId: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: Date | string;
  status?: 'sent' | 'delivered' | 'read';
  isOwn: boolean;
  reactions?: Array<{
    emoji: string;
    count: number;
    by: string[];
  }>;
}

function App() {
    const [isConnected, setIsConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(() => {
        const stored = localStorage.getItem('token');
        return stored && stored !== 'null' && stored !== 'undefined' ? stored : null;
    });
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { toasts, dismissToast, success, error: errorToast } = useToast();

    // Mock rooms data
    const mockRooms: Room[] = [
        {
            id: 'room-1',
            name: 'Design Team',
            unread: 3,
            snippet: 'Let me review the designs...',
            timestamp: '2:45 PM',
            isOnline: true,
        },
        {
            id: 'room-2',
            name: 'Frontend Dev',
            unread: 0,
            snippet: 'Great work on the component refactor!',
            timestamp: 'Yesterday',
            isOnline: true,
        },
        {
            id: 'room-3',
            name: 'General',
            unread: 12,
            snippet: 'Anyone free for a quick sync?',
            timestamp: '10:30 AM',
            isOnline: false,
        },
    ];

    const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

    useEffect(() => {
        if (!token) return;

        // Connection timeout safety
        const timeoutId = setTimeout(() => {
            if (!isConnected) {
                console.log('Connection timed out, logging out...');
                logout();
            }
        }, 5000);

        // Connect to WebSocket with real token
        const socket = socketService.connect(token);

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
            setError('Failed to connect to chat server');
            setIsConnected(false);

            // Auto-logout on auth error
            if (err.message.includes('jwt') || err.message.includes('Authentication') || err.message.includes('token')) {
                logout();
            }
        });

        // Decode token to get user info (simplified)
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
    }, [token, isConnected]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const endpoint = isRegistering ? '/auth/register' : '/auth/login';
            const payload = isRegistering
                ? { username, password, email: `${username}@example.com` }
                : { email: `${username}@example.com`, password }; // Using username as email prefix for simplicity in demo

            const response = await axios.post(`${API_URL}${endpoint}`, payload);

            const newToken = response.data.token;
            const user = response.data.user;

            localStorage.setItem('token', newToken);
            setToken(newToken);
            setCurrentUser(user);
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.response?.data?.error || 'Authentication failed');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setCurrentUser(null);
        setIsConnected(false);
        socketService.disconnect();
    };

    const handleSendMessage = useCallback(
        async (content: string) => {
          if (!selectedRoomId) return;
          try {
            // Send message via API
            const response = await axios.post(
              `${API_URL}/messages`,
              { roomId: selectedRoomId, content },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            success('Message sent');
            // Add to local messages
            const newMessage: Message = {
              id: response.data.id,
              roomId: selectedRoomId,
              sender: { id: currentUser.id, name: currentUser.username },
              content,
              timestamp: new Date(),
              status: 'sent',
              isOwn: true,
            };
            setMessages((prev) => [...prev, newMessage]);
          } catch (err) {
            errorToast('Failed to send message');
            console.error(err);
          }
        },
        [selectedRoomId, token, currentUser, API_URL, success, errorToast]
      );

    const handleRoomSelect = useCallback((roomId: string) => {
        setSelectedRoomId(roomId);
        setIsMobileMenuOpen(false);
    }, []);

    const handleCreateRoom = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    if (!token) {
        return (
            <div className="min-h-screen bg-mono-bg text-mono-text flex items-center justify-center p-4">
                <div className="w-full max-w-sm">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-2">Samvaad</h1>
                        <p className="text-mono-muted">Connect with clarity</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className={cn(
                            'mb-6 px-4 py-3 rounded-glass',
                            'bg-red-500/20 border border-red-500/30',
                            'text-red-200 text-sm text-center'
                        )}>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handleAuth(e);
                    }} className="space-y-4">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={cn(
                                'w-full px-4 py-2 rounded-glass',
                                'bg-mono-surface border border-mono-glass-border',
                                'text-mono-text placeholder-mono-muted',
                                'focus:outline-none focus:ring-2 focus:ring-mono-glass-highlight/50 focus:border-mono-glass-highlight',
                                'transition-all duration-fast ease-glass'
                            )}
                            placeholder="Username"
                            required
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={cn(
                                'w-full px-4 py-2 rounded-glass',
                                'bg-mono-surface border border-mono-glass-border',
                                'text-mono-text placeholder-mono-muted',
                                'focus:outline-none focus:ring-2 focus:ring-mono-glass-highlight/50 focus:border-mono-glass-highlight',
                                'transition-all duration-fast ease-glass'
                            )}
                            placeholder="Password"
                            required
                        />
                        <button
                            type="submit"
                            className={cn(
                                'w-full px-4 py-2 rounded-glass font-medium',
                                'bg-mono-surface hover:bg-mono-surface/80',
                                'border border-mono-glass-border hover:border-mono-glass-highlight',
                                'text-mono-text',
                                'transition-all duration-fast ease-glass',
                                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-mono-text/50',
                                'active:scale-95 hover:translate-y-[-1px]',
                                'min-h-[44px]'
                            )}
                        >
                            {isRegistering ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>

                    {/* Toggle Register */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-mono-muted hover:text-mono-text text-sm transition-colors"
                        >
                            {isRegistering ? 'Already have an account?' : 'Need an account?'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!isConnected || !currentUser) {
        return (
            <div className="h-screen bg-mono-bg text-mono-text flex items-center justify-center flex-col gap-4">
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-3 h-3 rounded-full bg-mono-muted/60 animate-pulse"
                            style={{ animationDelay: `${i * 100}ms` }}
                        />
                    ))}
                </div>
                <p className="text-mono-muted">Connecting...</p>
                <button
                    onClick={logout}
                    className={cn(
                        'mt-4 px-4 py-2 rounded-glass text-sm',
                        'bg-red-500/20 hover:bg-red-500/30',
                        'border border-red-500/30 hover:border-red-500/50',
                        'text-red-300 hover:text-red-200',
                        'transition-all duration-fast ease-glass'
                    )}
                >
                    Cancel
                </button>
            </div>
        );
    }

    const currentRoom = mockRooms.find((r: Room) => r.id === selectedRoomId);

    return (
        <div className="h-screen w-full bg-mono-bg flex overflow-hidden">
            {/* Sidebar */}
            <div
                className={cn(
                    'hidden md:flex w-80 flex-shrink-0 h-full',
                    'bg-mono-bg border-r border-mono-glass-border',
                    'flex-col'
                )}
            >
                <Sidebar
                    rooms={mockRooms}
                    selectedRoomId={selectedRoomId || undefined}
                    onRoomSelect={handleRoomSelect}
                    onCreateRoom={handleCreateRoom}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                {/* Header */}
                <div
                    className={cn(
                        'flex-shrink-0 h-16 px-4 py-3',
                        'border-b border-mono-glass-border',
                        'flex items-center justify-between gap-2',
                        'bg-mono-bg'
                    )}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={cn(
                                'md:hidden p-2 rounded-glass',
                                'bg-mono-surface hover:bg-mono-surface/80',
                                'border border-mono-glass-border hover:border-mono-glass-highlight',
                                'text-mono-text hover:text-mono-text',
                                'transition-all duration-fast ease-glass',
                                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mono-text/50',
                                'active:scale-95',
                                'min-h-[40px] min-w-[40px] flex items-center justify-center'
                            )}
                            aria-label="Toggle menu"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>

                        {/* Room Name */}
                        <div className="min-w-0">
                            <h2 className="text-base font-semibold text-mono-text truncate">
                                {currentRoom?.name || 'Select a room'}
                            </h2>
                            <p className="text-xs text-mono-muted truncate">
                                {currentRoom?.isOnline ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </div>

                    {/* Header Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={logout}
                            className={cn(
                                'p-2 rounded-glass',
                                'bg-red-500/20 hover:bg-red-500/30',
                                'border border-red-500/30 hover:border-red-500/50',
                                'text-red-300 hover:text-red-200',
                                'transition-all duration-fast ease-glass',
                                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mono-text/50',
                                'active:scale-95',
                                'min-h-[40px] min-w-[40px] flex items-center justify-center'
                            )}
                            aria-label="Logout"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <MessageList
                    messages={messages}
                    roomName={currentRoom?.name}
                    className="flex-1"
                />

                {/* Composer */}
                <Composer
                    onSendMessage={handleSendMessage}
                    placeholder="Type a message..."
                />
            </div>

            {/* Mobile Sidebar Overlay */}
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
                            rooms={mockRooms}
                            selectedRoomId={selectedRoomId || undefined}
                            onRoomSelect={handleRoomSelect}
                            onCreateRoom={handleCreateRoom}
                        />
                    </div>
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                title="Create New Room"
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => {
                    setIsModalOpen(false);
                    success('Room created successfully!');
                }}
                confirmText="Create"
                contentClassName="space-y-4"
            >
                <input
                    type="text"
                    placeholder="Room name"
                    className={cn(
                        'w-full px-3 py-2 rounded-glass',
                        'bg-mono-surface-2 border border-mono-glass-border',
                        'text-mono-text placeholder-mono-muted',
                        'focus:outline-none focus:ring-2 focus:ring-mono-glass-highlight/50 focus:border-mono-glass-highlight',
                        'transition-all duration-fast ease-glass'
                    )}
                />
                <textarea
                    placeholder="Room description (optional)"
                    rows={3}
                    className={cn(
                        'w-full px-3 py-2 rounded-glass resize-none',
                        'bg-mono-surface-2 border border-mono-glass-border',
                        'text-mono-text placeholder-mono-muted',
                        'focus:outline-none focus:ring-2 focus:ring-mono-glass-highlight/50 focus:border-mono-glass-highlight',
                        'transition-all duration-fast ease-glass'
                    )}
                />
            </Modal>

            {/* Toast Container */}
            <ToastContainer
                toasts={toasts}
                onDismiss={dismissToast}
                position="top-right"
            />
        </div>
    );
}

export default App;
