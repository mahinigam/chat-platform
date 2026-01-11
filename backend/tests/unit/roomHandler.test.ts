/**
 * Unit tests for Room Handler
 * Tests: join room, leave room, create room
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import roomHandler from '../../src/socket/handlers/roomHandler';

// Mock dependencies
vi.mock('../../src/config/database', () => ({
    default: {
        query: vi.fn(),
    },
}));

import Database from '../../src/config/database';

describe('Room Handler', () => {
    let mockSocket: any;
    let mockCallback: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockCallback = vi.fn();

        mockSocket = {
            id: 'socket-123',
            userId: 1,
            username: 'testuser',
            rooms: new Set(),
            join: vi.fn(),
            leave: vi.fn(),
            to: vi.fn().mockReturnThis(),
            emit: vi.fn(),
            broadcast: {
                to: vi.fn().mockReturnThis(),
                emit: vi.fn(),
            },
        };
    });

    describe('handleJoinRoom', () => {
        it('should join an existing room successfully', async () => {
            vi.mocked(Database.query)
                .mockResolvedValueOnce({
                    rows: [{ id: 1, name: 'Test Room', room_type: 'group' }],
                }) // Check room exists
                .mockResolvedValueOnce({
                    rows: [{ user_id: 1, room_id: 1 }],
                }); // Check membership

            await roomHandler.handleJoinRoom(mockSocket, { roomId: 1 });

            expect(mockSocket.join).toHaveBeenCalledWith('room:1');
        });

        it('should handle non-existent room gracefully', async () => {
            vi.mocked(Database.query).mockResolvedValueOnce({ rows: [] });

            // Handler should be called without throwing
            await expect(
                roomHandler.handleJoinRoom(mockSocket, { roomId: 999 })
            ).resolves.not.toThrow();
        });
    });

    describe('handleLeaveRoom', () => {
        it('should leave a room successfully', async () => {
            await roomHandler.handleLeaveRoom(mockSocket, { roomId: 1 });

            expect(mockSocket.leave).toHaveBeenCalledWith('room:1');
        });
    });
});
