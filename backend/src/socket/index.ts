import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server as HTTPServer } from 'http';
import { redisPubClient, redisSubClient } from '../config/redis';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimiter';
import messageHandler from './handlers/messageHandler';
import typingHandler from './handlers/typingHandler';
import presenceHandler from './handlers/presenceHandler';
import roomHandler from './handlers/roomHandler';

export interface AuthenticatedSocket extends Socket {
    userId: number;
    username: string;
}

export function initializeSocket(httpServer: HTTPServer): Server {
    // Initialize Socket.io with CORS configuration
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
            credentials: true,
        },
        // Connection settings optimized for high-scale
        pingTimeout: 60000, // 60s before considering connection dead
        pingInterval: 25000, // Send ping every 25s
        upgradeTimeout: 10000,
        maxHttpBufferSize: 1e6, // 1MB max message size
        transports: ['websocket', 'polling'], // Prefer WebSocket
    });

    // ============================================
    // CRITICAL: Redis Adapter for Horizontal Scaling
    // ============================================
    // This enables multiple server instances to communicate
    // When User A on Server 1 sends a message to User B on Server 2,
    // the message goes through Redis Pub/Sub
    io.adapter(createAdapter(redisPubClient, redisSubClient));

    console.log('✓ Socket.io Redis Adapter initialized - Horizontal scaling enabled');

    // ============================================
    // Middleware Stack
    // ============================================

    // 1. Authentication - Verify JWT token
    io.use(authMiddleware);

    // 2. Rate limiting - Prevent connection flooding (thundering herd protection)
    io.use(rateLimitMiddleware);

    // ============================================
    // Connection Handler
    // ============================================
    io.on('connection', async (socket: Socket) => {
        const authSocket = socket as AuthenticatedSocket;
        const { userId, username } = authSocket;

        console.log(`✓ User connected: ${username} (ID: ${userId}, Socket: ${socket.id})`);

        try {
            // Track user session and mark as online
            await presenceHandler.handleConnection(authSocket);

            // ============================================
            // Event Handlers
            // ============================================

            // Room Management
            socket.on('room:join', (data) => roomHandler.handleJoinRoom(authSocket, data));
            socket.on('room:leave', (data) => roomHandler.handleLeaveRoom(authSocket, data));

            // Messaging
            socket.on('message:send', (data, callback) =>
                messageHandler.handleSendMessage(authSocket, data, callback)
            );
            socket.on('message:delivered', (data) =>
                messageHandler.handleMessageDelivered(authSocket, data)
            );
            socket.on('message:read', (data) =>
                messageHandler.handleMessageRead(authSocket, data)
            );

            // Typing Indicators
            socket.on('typing:start', (data) =>
                typingHandler.handleTypingStart(authSocket, data)
            );
            socket.on('typing:stop', (data) =>
                typingHandler.handleTypingStop(authSocket, data)
            );

            // Heartbeat for presence
            socket.on('heartbeat', () =>
                presenceHandler.handleHeartbeat(authSocket)
            );

            // ============================================
            // Disconnection Handler
            // ============================================
            socket.on('disconnect', async (reason) => {
                console.log(`✗ User disconnected: ${username} (Reason: ${reason})`);
                await presenceHandler.handleDisconnection(authSocket, reason);
            });

            // Error handling
            socket.on('error', (error) => {
                console.error(`Socket error for user ${username}:`, error);
            });

        } catch (error) {
            console.error('Error in connection handler:', error);
            socket.disconnect(true);
        }
    });

    // ============================================
    // Server-level Events
    // ============================================

    // Monitor adapter events (for debugging)
    if (process.env.NODE_ENV === 'development') {
        io.of('/').adapter.on('create-room', (room) => {
            console.log(`Room created: ${room}`);
        });

        io.of('/').adapter.on('join-room', (room, id) => {
            console.log(`Socket ${id} joined room: ${room}`);
        });

        io.of('/').adapter.on('leave-room', (room, id) => {
            console.log(`Socket ${id} left room: ${room}`);
        });
    }

    return io;
}

export default initializeSocket;
