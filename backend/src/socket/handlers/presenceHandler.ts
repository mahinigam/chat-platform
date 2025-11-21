import { AuthenticatedSocket } from '../index';
import Database from '../../config/database';
import { RedisService } from '../../config/redis';
import { MessageRepository } from '../../repositories/MessageRepository';
import { RoomRepository } from '../../repositories/RoomRepository';
import typingHandler from './typingHandler';

class PresenceHandler {
    /**
     * Handle user connection
     * - Store session in database
     * - Mark user as online in Redis
     * - Join user to their rooms
     * - Deliver offline messages
     */
    async handleConnection(socket: AuthenticatedSocket): Promise<void> {
        try {
            const { userId, username } = socket;
            const serverInstanceId = process.env.SERVER_INSTANCE_ID || 'unknown';

            // Store session in database
            await Database.query(
                `INSERT INTO user_sessions (user_id, socket_id, server_instance, user_agent, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
                [
                    userId,
                    socket.id,
                    serverInstanceId,
                    socket.handshake.headers['user-agent'],
                    socket.handshake.address,
                ]
            );

            // Mark user as online in Redis
            await RedisService.setUserOnline(userId, socket.id);

            // Join user to their rooms
            await this.joinUserRooms(socket);

            // Deliver offline messages
            await this.deliverOfflineMessages(socket);

            // Broadcast user online status to their contacts
            await this.broadcastPresence(socket, 'online');

            console.log(`✓ Presence initialized for user ${username} on ${serverInstanceId}`);

        } catch (error) {
            console.error('Error handling connection:', error);
            throw error;
        }
    }

    /**
     * Handle user disconnection
     * - Remove session from database
     * - Update online status in Redis
     * - Update last_seen timestamp
     * - Cleanup typing indicators
     */
    async handleDisconnection(
        socket: AuthenticatedSocket,
        reason: string
    ): Promise<void> {
        try {
            const { userId } = socket;

            // Remove session from database
            await Database.query(
                `DELETE FROM user_sessions WHERE socket_id = $1`,
                [socket.id]
            );

            // Update online status in Redis
            await RedisService.setUserOffline(userId, socket.id);

            // Update user's last_seen
            await Database.query(
                `UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = $1`,
                [userId]
            );

            // Cleanup typing indicators
            typingHandler.cleanupUserTyping(userId);

            // Check if user still has other active sessions
            const isStillOnline = await RedisService.isUserOnline(userId);

            if (!isStillOnline) {
                // Broadcast user offline status
                await this.broadcastPresence(socket, 'offline');
            }

            console.log(`✗ User ${userId} disconnected (${reason}). Still online: ${isStillOnline}`);

        } catch (error) {
            console.error('Error handling disconnection:', error);
        }
    }

    /**
     * Handle heartbeat to keep connection alive
     */
    async handleHeartbeat(socket: AuthenticatedSocket): Promise<void> {
        try {
            await Database.query(
                `UPDATE user_sessions 
         SET last_heartbeat = CURRENT_TIMESTAMP 
         WHERE socket_id = $1`,
                [socket.id]
            );
        } catch (error) {
            console.error('Error handling heartbeat:', error);
        }
    }

    /**
     * Join user to all their active rooms
     */
    private async joinUserRooms(socket: AuthenticatedSocket): Promise<void> {
        try {
            const { userId } = socket;
            const rooms = await RoomRepository.getUserRooms(userId);

            for (const room of rooms) {
                socket.join(`room:${room.id}`);
            }

            console.log(`✓ User ${userId} joined ${rooms.length} rooms`);

        } catch (error) {
            console.error('Error joining user rooms:', error);
        }
    }

    /**
     * Deliver offline messages in batches
     * This prevents thundering herd when user reconnects
     */
    private async deliverOfflineMessages(socket: AuthenticatedSocket): Promise<void> {
        try {
            const { userId } = socket;

            // Fetch offline messages (messages with delivered_at = NULL)
            const offlineMessages = await MessageRepository.getOfflineMessages(userId);

            if (offlineMessages.length === 0) {
                return;
            }

            console.log(`📬 Delivering ${offlineMessages.length} offline messages to user ${userId}`);

            // Deliver in batches of 50 to prevent overwhelming the client
            const BATCH_SIZE = 50;
            for (let i = 0; i < offlineMessages.length; i += BATCH_SIZE) {
                const batch = offlineMessages.slice(i, i + BATCH_SIZE);

                socket.emit('messages:offline', {
                    messages: batch,
                    total: offlineMessages.length,
                    delivered: i + batch.length,
                });

                // Mark messages as delivered
                const messageIds = batch.map(m => m.id);
                await MessageRepository.markMessagesAsDelivered(messageIds, userId);

                // Small delay between batches to prevent overwhelming
                if (i + BATCH_SIZE < offlineMessages.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

        } catch (error) {
            console.error('Error delivering offline messages:', error);
        }
    }

    /**
     * Broadcast presence status to user's contacts
     */
    private async broadcastPresence(
        socket: AuthenticatedSocket,
        status: 'online' | 'offline'
    ): Promise<void> {
        try {
            const { userId, username } = socket;

            // Get user's rooms to broadcast presence
            const rooms = await RoomRepository.getUserRooms(userId);

            for (const room of rooms) {
                socket.to(`room:${room.id}`).emit('presence:change', {
                    userId,
                    username,
                    status,
                    timestamp: new Date(),
                });
            }

        } catch (error) {
            console.error('Error broadcasting presence:', error);
        }
    }
}

export default new PresenceHandler();
