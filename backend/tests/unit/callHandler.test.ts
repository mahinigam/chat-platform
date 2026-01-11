/**
 * Unit tests for Call Handler
 * Tests: initiate call, accept, reject, end call
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import callHandler from '../../src/socket/handlers/callHandler';

// Mock dependencies
vi.mock('../../src/config/database', () => ({
    default: {
        query: vi.fn(),
    },
}));

vi.mock('../../src/repositories/CallRepository', () => ({
    CallRepository: {
        createCall: vi.fn(),
        updateCallStatus: vi.fn(),
        endCall: vi.fn(),
    },
}));

vi.mock('./presenceHandler', () => ({
    default: {
        getUserSocketIds: vi.fn().mockReturnValue(['socket-callee']),
    },
}));

import Database from '../../src/config/database';

describe('Call Handler', () => {
    let mockSocket: any;
    let mockIo: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockSocket = {
            id: 'socket-caller',
            userId: 1,
            username: 'caller',
            emit: vi.fn(),
            to: vi.fn().mockReturnThis(),
            join: vi.fn(),
            leave: vi.fn(),
        };

        mockIo = {
            to: vi.fn().mockReturnThis(),
            emit: vi.fn(),
        };

        // Initialize handler with mock IO
        callHandler.initialize(mockIo);
    });

    describe('handleInitiateCall', () => {
        it('should initiate a call successfully', async () => {
            vi.mocked(Database.query)
                .mockResolvedValueOnce({ rows: [] }) // Check for existing active call
                .mockResolvedValueOnce({
                    rows: [{ id: 1, username: 'callee' }],
                }) // Get callee info
                .mockResolvedValueOnce({
                    rows: [{ id: 100 }],
                }); // Create call record

            await callHandler.handleInitiateCall(mockSocket, {
                calleeId: 2,
                callType: 'voice',
            });

            expect(mockIo.to).toHaveBeenCalled();
        });

        it('should reject call if user is already in an active call', async () => {
            vi.mocked(Database.query).mockResolvedValueOnce({
                rows: [{ id: 99, caller_id: 1, status: 'active' }],
            });

            await callHandler.handleInitiateCall(mockSocket, {
                calleeId: 2,
                callType: 'voice',
            });

            expect(mockSocket.emit).toHaveBeenCalledWith(
                'call:error',
                expect.objectContaining({
                    error: expect.any(String),
                })
            );
        });
    });

    describe('handleAcceptCall', () => {
        it('should accept an incoming call', async () => {
            vi.mocked(Database.query)
                .mockResolvedValueOnce({
                    rows: [{ id: 100, caller_id: 1, status: 'ringing' }],
                })
                .mockResolvedValueOnce({ rowCount: 1 });

            await callHandler.handleAcceptCall(mockSocket, {
                callId: 100,
                callerId: 1,
            });

            expect(mockIo.to).toHaveBeenCalled();
        });
    });

    describe('handleRejectCall', () => {
        it('should reject an incoming call', async () => {
            vi.mocked(Database.query)
                .mockResolvedValueOnce({
                    rows: [{ id: 100, caller_id: 1, status: 'ringing' }],
                })
                .mockResolvedValueOnce({ rowCount: 1 });

            await callHandler.handleRejectCall(mockSocket, {
                callId: 100,
                callerId: 1,
            });

            expect(mockIo.to).toHaveBeenCalled();
        });
    });

    describe('handleEndCall', () => {
        it('should end an active call', async () => {
            vi.mocked(Database.query)
                .mockResolvedValueOnce({
                    rows: [{ id: 100, caller_id: 1, callee_id: 2, status: 'active' }],
                })
                .mockResolvedValueOnce({ rowCount: 1 });

            await callHandler.handleEndCall(mockSocket, {
                callId: 100,
                otherUserId: 2,
                duration: 120,
            });

            expect(mockIo.to).toHaveBeenCalled();
        });
    });

    describe('handleSignal', () => {
        it('should relay WebRTC signaling data', async () => {
            await callHandler.handleSignal(mockSocket, {
                targetUserId: 2,
                type: 'offer',
                payload: { sdp: 'test-sdp' },
            });

            // Signal should be relayed to target user
            expect(mockIo.to).toHaveBeenCalled();
        });
    });
});
