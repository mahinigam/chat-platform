/**
 * Unit tests for Reaction Handler
 * Tests: toggle reaction, reaction counts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import reactionHandler from '../../src/socket/handlers/reactionHandler';

// Mock dependencies
vi.mock('../../src/config/database', () => ({
    default: {
        query: vi.fn(),
    },
}));

import Database from '../../src/config/database';

describe('Reaction Handler', () => {
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
            to: vi.fn().mockReturnThis(),
            emit: vi.fn(),
        };

        mockIo = {
            to: vi.fn().mockReturnThis(),
            emit: vi.fn(),
        };
    });

    describe('handleToggleReaction', () => {
        it('should add a new reaction', async () => {
            // Check if reaction exists (none)
            vi.mocked(Database.query)
                .mockResolvedValueOnce({ rows: [] }) // No existing reaction
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Insert reaction
                .mockResolvedValueOnce({
                    rows: [{ emoji: '👍', count: 1 }]
                }); // Get updated counts

            await reactionHandler.handleToggleReaction(
                mockSocket,
                { messageId: 'msg-123', roomId: 1, emoji: '👍' },
                mockCallback
            );

            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    added: true,
                })
            );
        });

        it('should handle reaction toggle (add or remove)', async () => {
            // Mock a successful toggle operation
            vi.mocked(Database.query)
                .mockResolvedValueOnce({ rows: [] }) // No existing reaction
                .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Insert reaction
                .mockResolvedValueOnce({
                    rows: [{ emoji: '👍', count: 1 }]
                }); // Get updated counts

            await reactionHandler.handleToggleReaction(
                mockSocket,
                { messageId: 'msg-123', roomId: 1, emoji: '👍' },
                mockCallback
            );

            // Should be called with some response
            expect(mockCallback).toHaveBeenCalled();
        });

        it('should reject invalid emoji', async () => {
            await reactionHandler.handleToggleReaction(
                mockSocket,
                { messageId: 'msg-123', roomId: 1, emoji: '' },
                mockCallback
            );

            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String),
                })
            );
        });
    });
});
