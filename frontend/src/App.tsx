import React, { useEffect, useState } from 'react';
import ChatRoom from './components/ChatRoom';
import socketService from './services/socket';
import './index.css';

function App() {
    const [isConnected, setIsConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        // For demo purposes, use a mock token
        // In production, get this from your auth system
        const token = 'demo-jwt-token';

        // Connect to WebSocket
        const socket = socketService.connect(token);

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('Connected to chat server');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Disconnected from chat server');
        });

        // Mock current user (replace with actual auth)
        setCurrentUser({
            id: 1,
            username: 'demo_user',
        });

        return () => {
            socketService.disconnect();
        };
    }, []);

    if (!isConnected || !currentUser) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Connecting to chat server...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen">
            <ChatRoom roomId={1} currentUserId={currentUser.id} />
        </div>
    );
}

export default App;
