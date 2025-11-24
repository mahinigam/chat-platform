
import { useEffect, useState } from 'react';
import ChatRoom from './components/ChatRoom';
import Sidebar from './components/Sidebar';
import socketService from './services/socket';
import axios from 'axios';
import './index.css';

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

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
    }, [token]);

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

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-full max-w-sm p-8">
                    <div className="text-center mb-10">
                        <div className="w-32 h-32 bg-telegram-primary rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-telegram-primary/30">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-white ml-[-4px] mt-[2px]">
                                <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-black mb-2">Samvaad</h1>
                        <p className="text-gray-500 text-sm">Please log in to continue.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm border border-red-100 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-1">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-telegram-primary focus:ring-2 focus:ring-telegram-primary/20 outline-none transition-all text-black placeholder-gray-400"
                                placeholder="Username"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-telegram-primary focus:ring-2 focus:ring-telegram-primary/20 outline-none transition-all text-black placeholder-gray-400"
                                placeholder="Password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3.5 rounded-xl bg-telegram-primary text-white font-medium text-lg hover:bg-telegram-primary/90 transition-colors shadow-lg shadow-telegram-primary/30"
                        >
                            {isRegistering ? 'Start Messaging' : 'Log in'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-telegram-primary hover:underline text-sm font-medium"
                        >
                            {isRegistering ? 'Already have an account?' : 'Register new account'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!isConnected || !currentUser) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-telegram-primary/20 border-t-telegram-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Connecting...</p>
                    <button
                        onClick={logout}
                        className="mt-8 text-sm text-red-500 hover:underline"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex bg-white overflow-hidden">
            {/* Sidebar */}
            <Sidebar currentUser={currentUser} onLogout={logout} />

            {/* Main Chat Area */}
            <div className="flex-1 relative bg-telegram-bg bg-chat-pattern bg-repeat">
                <div className="absolute inset-0 bg-black/5 pointer-events-none"></div> {/* Pattern overlay */}
                <div className="relative z-10 h-full">
                    <ChatRoom roomId={1} currentUserId={currentUser.id} />
                </div>
            </div>
        </div>
    );
}

export default App;
