/**
 * Unit tests for Authentication Routes
 * Tests: login, register, 2FA setup/verify, token validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/auth';

// Mock dependencies
vi.mock('../../src/config/database', () => ({
    default: {
        query: vi.fn(),
    },
}));

vi.mock('bcrypt', () => ({
    default: {
        compare: vi.fn(),
        hash: vi.fn(),
    },
}));

vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn().mockReturnValue('mock-token'),
        verify: vi.fn(),
    },
}));

import Database from '../../src/config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Auth Routes', () => {
    let app: express.Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/auth', authRoutes);
        vi.clearAllMocks();
    });

    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            vi.mocked(Database.query)
                .mockResolvedValueOnce({ rows: [] }) // Check existing user
                .mockResolvedValueOnce({
                    rows: [{ id: 1, username: 'testuser', email: 'test@example.com' }]
                }); // Insert user

            vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed-password' as never);

            const response = await request(app)
                .post('/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(201);
            expect(response.body.user).toBeDefined();
            expect(response.body.token).toBe('mock-token');
        });

        it('should reject duplicate username', async () => {
            vi.mocked(Database.query).mockResolvedValueOnce({
                rows: [{ id: 1, username: 'testuser' }],
            });

            const response = await request(app)
                .post('/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('already');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({ username: 'test' });

            expect(response.status).toBe(400);
        });

        it('should enforce password minimum length', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: '123',
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /auth/login', () => {
        it('should login with valid credentials', async () => {
            vi.mocked(Database.query).mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'hashed-password',
                    two_factor_enabled: false,
                }],
            });
            vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(200);
            expect(response.body.token).toBe('mock-token');
            expect(response.body.user).toBeDefined();
        });

        it('should reject invalid password', async () => {
            vi.mocked(Database.query).mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    username: 'testuser',
                    password: 'hashed-password',
                }],
            });
            vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(401);
        });

        it('should reject non-existent user', async () => {
            vi.mocked(Database.query).mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'notexist@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(401);
        });

        it('should trigger 2FA challenge when enabled', async () => {
            vi.mocked(Database.query)
                .mockResolvedValueOnce({
                    rows: [{
                        id: 1,
                        username: 'testuser',
                        password: 'hashed-password',
                        two_factor_enabled: true,
                        two_factor_method: 'email',
                        email: 'test@example.com',
                    }],
                })
                .mockResolvedValueOnce({ rows: [] }); // Update 2FA secret

            vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(200);
            expect(response.body.requires2FA).toBe(true);
            expect(response.body.method).toBe('email');
        });
    });

    describe('POST /auth/logout', () => {
        it('should logout successfully', async () => {
            const response = await request(app).post('/auth/logout');
            expect(response.status).toBe(200);
            expect(response.body.message).toContain('success');
        });
    });
});
