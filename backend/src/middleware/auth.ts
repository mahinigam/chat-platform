import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthenticatedSocket } from '../socket';

interface JWTPayload {
    userId: number;
    username: string;
}

/**
 * Authentication middleware for Socket.io
 * Verifies JWT token from handshake auth or query params
 */
export const authMiddleware = async (
    socket: Socket,
    next: (err?: Error) => void
): Promise<void> => {
    try {
        // Get token from handshake auth or query
        const token =
            socket.handshake.auth.token ||
            socket.handshake.query.token as string;

        if (!token) {
            return next(new Error('Authentication token missing'));
        }

        // Verify JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET not configured');
        }

        const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

        // Attach user info to socket
        (socket as AuthenticatedSocket).userId = decoded.userId;
        (socket as AuthenticatedSocket).username = decoded.username;

        next();

    } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
    }
};
