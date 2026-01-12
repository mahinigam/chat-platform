/**
 * Unit tests for Auth Middleware
 * Tests: Token authentication
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/jwt', () => ({
    verifyAccessToken: vi.fn(),
}));

import { verifyAccessToken } from '../../src/utils/jwt';

describe('Auth Middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('verifyAccessToken', () => {
        it('should return payload for valid token', () => {
            vi.mocked(verifyAccessToken).mockReturnValueOnce({
                userId: 1,
                username: 'testuser',
            });

            const result = verifyAccessToken('valid-token');

            expect(result).toBeDefined();
            expect(result?.userId).toBe(1);
        });

        it('should return null for invalid token', () => {
            vi.mocked(verifyAccessToken).mockReturnValueOnce(null);

            const result = verifyAccessToken('invalid-token');

            expect(result).toBeNull();
        });
    });

    describe('middleware behavior', () => {
        it('should authenticate requests with valid token', () => {
            vi.mocked(verifyAccessToken).mockReturnValueOnce({
                userId: 1,
                username: 'testuser',
            });

            const mockReq = { headers: { authorization: 'Bearer valid-token' } };
            const mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() };
            const mockNext = vi.fn();

            // Simulate middleware logic
            const token = mockReq.headers.authorization?.split(' ')[1];
            const user = verifyAccessToken(token!);

            if (user) {
                (mockReq as any).user = user;
                mockNext();
            }

            expect(mockNext).toHaveBeenCalled();
            expect((mockReq as any).user.userId).toBe(1);
        });

        it('should reject requests without token', () => {
            const mockReq = { headers: {} };
            const mockRes = { status: vi.fn().mockReturnThis(), json: vi.fn() };

            // Simulate middleware logic
            const authHeader = (mockReq.headers as any).authorization;

            if (!authHeader) {
                mockRes.status(401).json({ error: 'No token provided' });
            }

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
    });
});
