import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

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
     * Create a new Shared Space
     */
    createSpace(
        data: { name: string; description: string; tone: string; initialMembers: number[] },
        callback: (response: any) => void
    ): void {
        this.socket?.emit('space:create', data, callback);
    }

    /**
     * Invite a user to a space
     */
    inviteToSpace(
        spaceId: number,
        userId: number,
        callback: (response: any) => void
    ): void {
        this.socket?.emit('space:invite', { spaceId, userId }, callback);
    }

    /**
     * Leave a space
     */
    leaveSpace(spaceId: number, callback?: (response: any) => void): void {
        this.socket?.emit('space:leave', { spaceId }, callback);
    }

    /**
     * Update space settings
     */
    updateSpace(
        spaceId: number,
        updates: { name?: string; description?: string; tone?: string; settings?: any },
        callback: (response: any) => void
    ): void {
        this.socket?.emit('space:update', { spaceId, ...updates }, callback);
    }

    /**
     * Get space members
     */
    getSpaceMembers(spaceId: number, callback: (response: any) => void): void {
        this.socket?.emit('space:members', { spaceId }, callback);
    }

    /**
     * Toggle reaction on a message (add if not exists, remove if exists)
     */
    toggleReaction(
        messageId: string,
        roomId: number,
        emoji: string,
        callback: (response: { success: boolean; added?: boolean; reactions?: any[]; error?: string }) => void
    ): void {
        this.socket?.emit('reaction:toggle', { messageId, roomId, emoji }, callback);
    }

    /**
     * Pin a message
     */
    pinMessage(messageId: string, roomId: number, callback: (response: any) => void): void {
        this.socket?.emit('message:pin', { messageId, roomId }, callback);
    }

    /**
     * Unpin a message
     */
    unpinMessage(messageId: string, roomId: number, callback: (response: any) => void): void {
        this.socket?.emit('message:unpin', { messageId, roomId }, callback);
    }

    /**
     * Get pinned messages for a room
     */
    getPinnedMessages(roomId: number, callback: (response: any) => void): void {
        this.socket?.emit('message:get_pinned', { roomId }, callback);
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
    /**
     * Emit a custom event
     */
    emit(event: string, data: any, callback?: (response: any) => void): void {
        this.socket?.emit(event, data, callback);
    }
}

export default new SocketService();
