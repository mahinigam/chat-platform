import { AuthenticatedSocket } from '../index';
import { MessageRepository } from '../../repositories/MessageRepository';
import { RoomRepository } from '../../repositories/RoomRepository';
import { RedisService } from '../../config/redis';
import { v4 as uuidv4 } from 'uuid';

interface SendMessageData {
    roomId: number;
    content: string;
    messageType?: 'text' | 'image' | 'file';
    metadata?: any;
    tempId?: string; // For optimistic UI matching
}

interface MessageDeliveredData {
    messageId: string;
    roomId: number;
}

interface MessageReadData {
    messageId: string;
    roomId: number;
}

class MessageHandler {
    /**
     * Handle sending a new message
     * This is the core message flow:
     * 1. Validate input
     * 2. Check rate limit
     * 3. Persist to database
     * 4. Emit to room (Redis will broadcast to other servers)
     * 5. Send acknowledgment to sender
     * 6. Queue for offline users
     */
    async handleSendMessage(
        socket: AuthenticatedSocket,
        data: SendMessageData,
        callback?: (response: any) => void
    ): Promise<void> {
        try {
            const { userId } = socket;
            const { roomId, content, messageType = 'text', metadata, tempId } = data;

            // Validation
            if (!content || content.trim().length === 0) {
                callback?.({ success: false, error: 'Message content is required' });
                return;
            }

            if (content.length > 10000) {
                callback?.({ success: false, error: 'Message too long (max 10,000 characters)' });
                return;
            }

            // Rate limiting: Max 10 messages per second per user
            const rateLimit = await RedisService.checkRateLimit(
                `ratelimit:message:${userId}`,
                10,
                1000
            );

            if (!rateLimit.allowed) {
                callback?.({
                    success: false,
                    error: 'Rate limit exceeded. Please slow down.',
                    retryAfter: 1000
                });
                return;
            }

            // Verify user is member of room
            const isMember = await RoomRepository.isUserMemberOfRoom(userId, roomId);
            if (!isMember) {
                callback?.({ success: false, error: 'You are not a member of this room' });
                return;
            }

            // Create message in database
            const messageId = uuidv4();
            const message = await MessageRepository.createMessage({
                id: messageId,
                roomId,
                senderId: userId,
                content,
                messageType,
                metadata,
            });

            // Get room members
            const members = await RoomRepository.getRoomMembers(roomId);
            const recipientIds = members
                .map(m => m.user_id)
                .filter(id => id !== userId);

            // Create message receipts for each recipient
            await MessageRepository.createMessageReceipts(messageId, recipientIds);

            // Cache message in Redis for fast retrieval
            await RedisService.cacheMessage(roomId, message);

            // ============================================
            // CRITICAL: Emit to room
            // ============================================
            // This uses Redis Adapter to broadcast across all server instances
            // If recipient is on a different server, Redis Pub/Sub handles it
            socket.to(`room:${roomId}`).emit('message:new', {
                ...message,
                sender: {
                    id: userId,
                    username: socket.username,
                },
            });

            // Stop typing indicator for this user
            await RedisService.removeTyping(roomId, userId);
            socket.to(`room:${roomId}`).emit('typing:stop', {
                roomId,
                userId,
                username: socket.username,
            });

            // Send acknowledgment to sender (optimistic UI confirmation)
            callback?.({
                success: true,
                message: {
                    ...message,
                    tempId, // Match with client's temporary ID
                },
            });

            // Check for offline users and queue messages
            await this.queueForOfflineUsers(messageId, recipientIds);

            console.log(`Message sent: ${messageId} in room ${roomId} by user ${userId}`);

        } catch (error) {
            console.error('Error handling send message:', error);
            callback?.({
                success: false,
                error: 'Failed to send message. Please try again.'
            });
        }
    }

    /**
     * Handle message delivered status
     * User has received the message on their device
     */
    async handleMessageDelivered(
        socket: AuthenticatedSocket,
        data: MessageDeliveredData
    ): Promise<void> {
        try {
            const { userId } = socket;
            const { messageId, roomId } = data;

            // Update delivery status in database
            await MessageRepository.markAsDelivered(messageId, userId);

            // Get message details to notify sender
            const message = await MessageRepository.getMessageById(messageId);
            if (!message) return;

            // Notify sender about delivery (via Redis to any server)
            socket.to(`room:${roomId}`).emit('message:status', {
                messageId,
                userId,
                status: 'delivered',
                deliveredAt: new Date(),
            });

            console.log(`Message ${messageId} delivered to user ${userId}`);

        } catch (error) {
            console.error('Error handling message delivered:', error);
        }
    }

    /**
     * Handle message read status
     * User has actually read/viewed the message
     */
    async handleMessageRead(
        socket: AuthenticatedSocket,
        data: MessageReadData
    ): Promise<void> {
        try {
            const { userId } = socket;
            const { messageId, roomId } = data;

            // Update read status in database
            await MessageRepository.markAsRead(messageId, userId);

            // Notify sender about read status (via Redis to any server)
            socket.to(`room:${roomId}`).emit('message:status', {
                messageId,
                userId,
                status: 'read',
                readAt: new Date(),
            });

            console.log(`Message ${messageId} read by user ${userId}`);

        } catch (error) {
            console.error('Error handling message read:', error);
        }
    }

    /**
     * Queue messages for offline users
     * Messages will be delivered when they come online
     */
    private async queueForOfflineUsers(
        messageId: string,
        recipientIds: number[]
    ): Promise<void> {
        try {
            for (const recipientId of recipientIds) {
                const isOnline = await RedisService.isUserOnline(recipientId);
                if (!isOnline) {
                    // Message is already in DB with delivered_at = NULL
                    // It will be fetched when user connects
                    console.log(`Message ${messageId} queued for offline user ${recipientId}`);
                }
            }
        } catch (error) {
            console.error('Error queuing for offline users:', error);
        }
    }
}

export default new MessageHandler();
