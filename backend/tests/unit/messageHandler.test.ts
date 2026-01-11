/**
 * Unit tests for Socket Message Handler
 * Tests: send message, receive message, reactions, typing indicators
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import messageHandler from '../../src/socket/handlers/messageHandler';
import { Server } from 'socket.io';

// Mock dependencies
vi.mock('../../src/config/database', () => ({
    default: {
        query: vi.fn(),
    },
}));

vi.mock('../../src/repositories/MessageRepository', () => ({
    MessageRepository: {
        create: vi.fn(),
        getById: vi.fn(),
        markAsDelivered: vi.fn(),
        markAsRead: vi.fn(),
    },
}));

import { MessageRepository } from '../../src/repositories/MessageRepository';
import Database from '../../src/config/database';

describe('Message Handler', () => {
    let mockSocket: any;
    let mockIo: any;
    let mockCallback: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockCallback = vi.fn();

        mockSocket = {
            id: 'socket-123',
            userId: 1,
            username: 'testuser',
            rooms: new Set(['room:1']),
            join: vi.fn(),
            leave: vi.fn(),
            to: vi.fn().mockReturnThis(),
            emit: vi.fn(),
            broadcast: {
                to: vi.fn().mockReturnThis(),
                emit: vi.fn(),
            },
        };

        mockIo = {
            to: vi.fn().mockReturnThis(),
            emit: vi.fn(),
            in: vi.fn().mockReturnThis(),
        };
    });

    describe('handleSendMessage', () => {
        it('should send a text message successfully', async () => {
            const messageData = {
                roomId: 1,
                content: 'Hello, World!',
                messageType: 'text',
                tempId: 'temp-123',
            };

            vi.mocked(Database.query).mockResolvedValueOnce({
                rows: [{ id: 1, name: 'Test Room', room_type: 'group' }],
            });

            vi.mocked(MessageRepository.create).mockResolvedValueOnce({
                id: 'msg-uuid-123',
                sender_id: 1,
                room_id: 1,
                content: 'Hello, World!',
                message_type: 'text',
                created_at: new Date(),
            });

            await messageHandler.handleSendMessage(mockSocket, messageData, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: expect.objectContaining({
                        content: 'Hello, World!',
                    }),
                })
            );
        });

        it('should reject empty message content', async () => {
            const messageData = {
                roomId: 1,
                content: '',
                messageType: 'text',
                tempId: 'temp-123',
            };

            await messageHandler.handleSendMessage(mockSocket, messageData, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String),
                })
            );
        });

        it('should reject message to non-existent room', async () => {
            vi.mocked(Database.query).mockResolvedValueOnce({ rows: [] });

            const messageData = {
                roomId: 999,
                content: 'Hello!',
                messageType: 'text',
                tempId: 'temp-123',
            };

            await messageHandler.handleSendMessage(mockSocket, messageData, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String),
                })
            );
        });

        it('should handle different message types', async () => {
            const messageTypes = ['text', 'image', 'file', 'audio'];

            for (const msgType of messageTypes) {
                vi.clearAllMocks();

                vi.mocked(Database.query).mockResolvedValueOnce({
                    rows: [{ id: 1, name: 'Test Room', room_type: 'group' }],
                });

                vi.mocked(MessageRepository.create).mockResolvedValueOnce({
                    id: `msg-${msgType}`,
                    sender_id: 1,
                    room_id: 1,
                    content: 'content',
                    message_type: msgType,
                    created_at: new Date(),
                });

                const messageData = {
                    roomId: 1,
                    content: 'content',
                    messageType: msgType,
                    tempId: `temp-${msgType}`,
                };

                await messageHandler.handleSendMessage(mockSocket, messageData, mockCallback);

                expect(mockCallback).toHaveBeenCalledWith(
                    expect.objectContaining({ success: true })
                );
            }
        });
    });

    describe('handleMarkDelivered', () => {
        it('should mark message as delivered', async () => {
            vi.mocked(MessageRepository.markAsDelivered).mockResolvedValueOnce(true);

            await messageHandler.handleMarkDelivered(mockSocket, {
                messageId: 'msg-123',
                roomId: 1,
            });

            expect(MessageRepository.markAsDelivered).toHaveBeenCalledWith('msg-123', 1);
        });
    });

    describe('handleMarkRead', () => {
        it('should mark message as read', async () => {
            vi.mocked(MessageRepository.markAsRead).mockResolvedValueOnce(true);

            await messageHandler.handleMarkRead(mockSocket, {
                messageId: 'msg-123',
                roomId: 1,
            });

            expect(MessageRepository.markAsRead).toHaveBeenCalledWith('msg-123', 1);
        });
    });
});
