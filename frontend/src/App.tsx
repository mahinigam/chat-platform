
import { useEffect, useState } from 'react';
import ChatRoom from './components/ChatRoom';
import socketService from './services/socket';
import axios from 'axios';
import './index.css';

function App() {
    const [isConnected, setIsConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    useEffect(() => {
        if (!token) return;

        // Connect to WebSocket with real token
        const socket = socketService.connect(token);

        socket.on('connect', () => {
            setIsConnected(true);
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
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md w-96">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                        {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </h2>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Enter username"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Enter password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 transition-colors font-medium"
                        >
                            {isRegistering ? 'Sign Up' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-4 text-center text-sm text-gray-600">
                        {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-primary-600 hover:underline font-medium"
                        >
                            {isRegistering ? 'Sign In' : 'Sign Up'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!isConnected || !currentUser) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Connecting to chat server...</p>
                    <button
                        onClick={logout}
                        className="mt-4 text-sm text-red-500 hover:underline"
                    >
                        Cancel & Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            <div className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
                <h1 className="text-xl font-bold text-gray-800">High-Scale Chat</h1>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-600">Connected as <strong>{currentUser.username}</strong></span>
                    </div>
                    <button
                        onClick={logout}
                        className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <ChatRoom roomId={1} currentUserId={currentUser.id} />
            </div>
        </div>
    );
}

export default App;
