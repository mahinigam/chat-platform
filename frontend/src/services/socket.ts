import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3000`;

class SocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;

    /**
     * Connect to WebSocket server
     * Implements exponential backoff with jittered delay (thundering herd protection)
     */
    connect(token: string): Socket {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000, // Start with 1s
            reconnectionDelayMax: 5000, // Max 5s
            // Add random jitter to prevent thundering herd
            randomizationFactor: 0.5, // Adds 0-50% random delay
        });

        // Connection event handlers
        this.socket.on('connect', () => {
            console.log('WebSocket connected:', this.socket?.id);
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error.message);
            this.reconnectAttempts++;

            // Exponential backoff with jitter
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                const baseDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
                const jitter = Math.random() * 5000; // 0-5s random jitter
                const delay = baseDelay + jitter;

                console.log(`Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts})`);
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`Reconnected after ${attemptNumber} attempts`);
        });

        this.socket.on('reconnect_failed', () => {
            console.error('Failed to reconnect after maximum attempts');
        });

        return this.socket;
    }

    /**
     * Disconnect from server
     */
    disconnect(): void {
        this.socket?.disconnect();
        this.socket = null;
    }

    /**
     * Get socket instance
     */
    getSocket(): Socket | null {
        return this.socket;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /**
     * Join a room
     */
    joinRoom(roomId: number): void {
        this.socket?.emit('room:join', { roomId });
    }

    /**
     * Leave a room
     */
    leaveRoom(roomId: number): void {
        this.socket?.emit('room:leave', { roomId });
    }

    /**
     * Send a message (with optimistic UI callback)
     */
    sendMessage(
        roomId: number,
        content: string,
        tempId: string,
        callback: (response: any) => void
    ): void {
        this.socket?.emit(
            'message:send',
            {
                roomId,
                content,
                messageType: 'text',
                tempId,
            },
            callback
        );
    }

    /**
     * Mark message as delivered
     */
    markMessageDelivered(messageId: string, roomId: number): void {
        this.socket?.emit('message:delivered', { messageId, roomId });
    }

    /**
     * Mark message as read
     */
    markMessageRead(messageId: string, roomId: number): void {
        this.socket?.emit('message:read', { messageId, roomId });
    }

    /**
     * Start typing indicator
     */
    startTyping(roomId: number): void {
        this.socket?.emit('typing:start', { roomId });
    }

    /**
     * Stop typing indicator
     */
    stopTyping(roomId: number): void {
        this.socket?.emit('typing:stop', { roomId });
    }

    /**
     * Listen to events
     */
    on(event: string, callback: (...args: any[]) => void): void {
        this.socket?.on(event, callback);
    }

    /**
     * Remove event listener
     */
    off(event: string, callback?: (...args: any[]) => void): void {
        this.socket?.off(event, callback);
    }
}

export default new SocketService();
