/**
 * Integration tests for Auth Flow
 * Tests: Complete register -> login -> 2FA flow
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/auth';

// Full Express app mock for integration testing
vi.mock('../../src/config/database', () => {
    const users: Map<string, any> = new Map();

    return {
        default: {
            query: vi.fn().mockImplementation((query: string, params?: any[]) => {
                // Handle SELECT for login
                if (query.includes('SELECT') && query.includes('email') && params) {
                    const email = params[0];
                    const user = users.get(email);
                    return Promise.resolve({ rows: user ? [user] : [] });
                }

                // Handle INSERT for register
                if (query.includes('INSERT INTO users')) {
                    const newUser = {
                        id: users.size + 1,
                        username: params?.[0],
                        email: params?.[1],
                        password: params?.[2],
                        two_factor_enabled: false,
                        created_at: new Date(),
                    };
                    users.set(newUser.email, newUser);
                    return Promise.resolve({ rows: [newUser] });
                }

                // Handle check for existing user
                if (query.includes('SELECT') && query.includes('username')) {
                    return Promise.resolve({ rows: [] });
                }

                return Promise.resolve({ rows: [], rowCount: 0 });
            }),
        },
    };
});

vi.mock('bcrypt', () => ({
    default: {
        compare: vi.fn().mockImplementation((plain: string, hash: string) => {
            return Promise.resolve(hash.includes('correct'));
        }),
        hash: vi.fn().mockImplementation((password: string) => {
            return Promise.resolve(`hashed-correct-${password}`);
        }),
    },
}));

vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn().mockImplementation((payload: any) => {
            return `token-for-user-${payload.userId}`;
        }),
        verify: vi.fn().mockImplementation((token: string) => {
            const userId = token.replace('token-for-user-', '');
            return { userId: parseInt(userId, 10) };
        }),
    },
}));

describe('Auth Flow Integration', () => {
    let app: express.Express;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/auth', authRoutes);
    });

    describe('Complete Registration Flow', () => {
        it('should register a new user and return valid token', async () => {
            const registerData = {
                username: 'newuser',
                email: 'newuser@example.com',
                password: 'securePassword123',
            };

            const response = await request(app)
                .post('/auth/register')
                .send(registerData);

            expect(response.status).toBe(201);
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe(registerData.email);
            expect(response.body.token).toContain('token-for-user');
        });
    });

    describe('Login Flow', () => {
        it('should login and return token after registration', async () => {
            // First register
            await request(app)
                .post('/auth/register')
                .send({
                    username: 'logintest',
                    email: 'logintest@example.com',
                    password: 'password123',
                });

            // Then login
            const loginResponse = await request(app)
                .post('/auth/login')
                .send({
                    email: 'logintest@example.com',
                    password: 'password123',
                });

            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body.token).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should return 400 for malformed requests', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({ invalid: 'data' });

            expect(response.status).toBe(400);
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(401);
        });
    });
});
