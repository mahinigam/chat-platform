
import { useEffect, useState } from 'react';
import ChatRoom from './components/ChatRoom';
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
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
                {/* Enhanced Liquid Background Elements */}
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>

                <div className="relative w-full max-w-md">
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

                    <div className="glass-panel p-10 rounded-3xl relative z-10 backdrop-blur-3xl bg-black/40 border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
                        <div className="text-center mb-10">
                            <h1 className="text-6xl font-heading text-white mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] tracking-tighter">
                                Samvaad
                            </h1>
                            <p className="text-gray-400 font-light tracking-[0.3em] text-xs uppercase opacity-80">
                                Liquid Communication
                            </p>
                        </div>

                        <h2 className="text-xl font-heading text-white/90 mb-8 text-center tracking-wide">
                            {isRegistering ? 'Initiate Sequence' : 'Resume Session'}
                        </h2>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm backdrop-blur-md">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Identity</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl glass-input text-lg"
                                    placeholder="Username"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Secret</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl glass-input text-lg"
                                    placeholder="Password"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 rounded-2xl glass-button text-lg mt-4 hover:bg-white/10 hover:border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                            >
                                {isRegistering ? 'Create Account' : 'Enter Samvaad'}
                            </button>
                        </form>

                        <div className="mt-10 text-center text-xs text-gray-500 font-mono">
                            <button
                                onClick={() => setIsRegistering(!isRegistering)}
                                className="hover:text-white transition-colors duration-300 border-b border-transparent hover:border-white/50 pb-0.5"
                            >
                                {isRegistering ? 'Access Existing Account' : 'Initialize New Identity'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isConnected || !currentUser) {
        return (
            <div className="flex items-center justify-center h-screen bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="text-center relative z-10">
                    <div className="w-20 h-20 border-2 border-white/10 border-t-white rounded-full animate-spin mx-auto mb-8 shadow-[0_0_30px_rgba(255,255,255,0.1)]"></div>
                    <h2 className="text-2xl font-heading text-white mb-2 tracking-widest animate-pulse">CONNECTING</h2>
                    <p className="text-gray-600 font-mono text-xs">Establishing secure link...</p>
                    <button
                        onClick={logout}
                        className="mt-12 text-xs text-red-500/50 hover:text-red-400 transition-colors tracking-widest uppercase"
                    >
                        Abort
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-black relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] animate-float"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] animate-float animation-delay-2000"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

            <div className="glass-panel border-b border-white/5 p-5 flex justify-between items-center z-20 relative backdrop-blur-xl bg-black/20">
                <div className="flex items-center space-x-4">
                    <div className="relative group cursor-pointer">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                        <div className="relative w-10 h-10 rounded-full bg-black flex items-center justify-center border border-white/10">
                            <span className="font-heading text-white text-lg">S</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-heading text-white tracking-widest drop-shadow-lg">
                        Samvaad
                    </h1>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse"></div>
                        <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">
                            {currentUser.username}
                        </span>
                    </div>
                    <button
                        onClick={logout}
                        className="text-xs text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest hover:bg-white/5 px-4 py-2 rounded-lg"
                    >
                        Disconnect
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative z-10">
                <ChatRoom roomId={1} currentUserId={currentUser.id} />
            </div>
        </div>
    );
}

export default App;
