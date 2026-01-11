/**
 * Unit tests for Message Repository
 * Tests: CRUD operations for messages
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageRepository } from '../../src/repositories/MessageRepository';

// Mock database
vi.mock('../../src/config/database', () => ({
    default: {
        query: vi.fn(),
    },
}));

import Database from '../../src/config/database';

describe('Message Repository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new message', async () => {
            const mockMessage = {
                id: 'uuid-123',
                sender_id: 1,
                room_id: 1,
                content: 'Hello!',
                message_type: 'text',
                created_at: new Date(),
            };

            vi.mocked(Database.query).mockResolvedValueOnce({
                rows: [mockMessage],
            });

            const result = await MessageRepository.create({
                senderId: 1,
                roomId: 1,
                content: 'Hello!',
                messageType: 'text',
            });

            expect(result).toEqual(mockMessage);
            expect(Database.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT'),
                expect.arrayContaining([1, 1, 'Hello!', 'text'])
            );
        });
    });

    describe('getById', () => {
        it('should return message by ID', async () => {
            const mockMessage = {
                id: 'uuid-123',
                content: 'Hello!',
            };

            vi.mocked(Database.query).mockResolvedValueOnce({
                rows: [mockMessage],
            });

            const result = await MessageRepository.getById('uuid-123');

            expect(result).toEqual(mockMessage);
        });

        it('should return null for non-existent message', async () => {
            vi.mocked(Database.query).mockResolvedValueOnce({ rows: [] });

            const result = await MessageRepository.getById('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('getByRoom', () => {
        it('should return messages for a room with pagination', async () => {
            const mockMessages = [
                { id: 'msg-1', content: 'First' },
                { id: 'msg-2', content: 'Second' },
            ];

            vi.mocked(Database.query).mockResolvedValueOnce({
                rows: mockMessages,
            });

            const result = await MessageRepository.getByRoom(1, 50, 0);

            expect(result).toEqual(mockMessages);
            expect(Database.query).toHaveBeenCalledWith(
                expect.stringContaining('room_id'),
                expect.arrayContaining([1, 50, 0])
            );
        });
    });

    describe('markAsDelivered', () => {
        it('should mark message as delivered', async () => {
            vi.mocked(Database.query).mockResolvedValueOnce({ rowCount: 1 });

            const result = await MessageRepository.markAsDelivered('msg-123', 1);

            expect(result).toBe(true);
        });
    });

    describe('markAsRead', () => {
        it('should mark message as read', async () => {
            vi.mocked(Database.query).mockResolvedValueOnce({ rowCount: 1 });

            const result = await MessageRepository.markAsRead('msg-123', 1);

            expect(result).toBe(true);
        });
    });

    describe('delete', () => {
        it('should soft delete a message', async () => {
            vi.mocked(Database.query).mockResolvedValueOnce({ rowCount: 1 });

            const result = await MessageRepository.delete('msg-123', 1);

            expect(result).toBe(true);
            expect(Database.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE'),
                expect.arrayContaining(['msg-123', 1])
            );
        });
    });
});
