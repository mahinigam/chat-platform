import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Database from '../config/database';
import { tokenService } from '../services/TokenService';
import { authenticateTokenHTTP } from '../middleware/auth';
import { logInfo, logWarn } from '../config/logger';

const router = Router();

/**
 * Register new user
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password, displayName } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user exists
        const existingUser = await Database.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password with cost factor 12
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const result = await Database.query(
            `INSERT INTO users (username, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, display_name, avatar_url, created_at`,
            [username, email, passwordHash, displayName || username]
        );

        const user = result.rows[0];

        // Add user to default room (ID: 1)
        try {
            await Database.query(
                `INSERT INTO room_members (room_id, user_id, role)
                 VALUES (1, $1, 'member')
                 ON CONFLICT DO NOTHING`,
                [user.id]
            );
        } catch (err) {
            console.error('Failed to add user to default room:', err);
        }

        // Generate token pair
        const tokens = await tokenService.generateTokenPair(user.id, user.username);

        logInfo('User registered', { userId: user.id, username: user.username });

        return res.status(201).json({
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
        });

    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * Login
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }

        // Find user by email or username
        const result = await Database.query(
            'SELECT * FROM users WHERE email = $1 OR username = $1',
            [email]
        );

        if (result.rows.length === 0) {
            logWarn('Login failed - user not found', { identifier: email });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            logWarn('Login failed - invalid password', { userId: user.id });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token pair
        const tokens = await tokenService.generateTokenPair(user.id, user.username);

        logInfo('User logged in', { userId: user.id, username: user.username });

        return res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.display_name,
                avatarUrl: user.avatar_url,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const tokens = await tokenService.refreshTokens(refreshToken);

        if (!tokens) {
            logWarn('Token refresh failed - invalid token');
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        logInfo('Tokens refreshed');

        return res.json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
        });

    } catch (error) {
        console.error('Refresh error:', error);
        return res.status(500).json({ error: 'Token refresh failed' });
    }
});

/**
 * Logout - invalidate current session
 */
router.post('/logout', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await tokenService.invalidateRefreshToken(refreshToken);
        }

        return res.json({ message: 'Logged out successfully' });

    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ error: 'Logout failed' });
    }
});

/**
 * Logout everywhere - invalidate all sessions
 */
router.post('/logout-all', authenticateTokenHTTP, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const count = await tokenService.invalidateAllSessions(userId);

        logInfo('User logged out everywhere', { userId, sessionsInvalidated: count });

        return res.json({
            message: 'All sessions invalidated',
            sessionsInvalidated: count,
        });

    } catch (error) {
        console.error('Logout all error:', error);
        return res.status(500).json({ error: 'Failed to invalidate sessions' });
    }
});

/**
 * Get active session count
 */
router.get('/sessions', authenticateTokenHTTP, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const count = await tokenService.getActiveSessionCount(userId);

        return res.json({ activeSessions: count });

    } catch (error) {
        console.error('Sessions error:', error);
        return res.status(500).json({ error: 'Failed to get sessions' });
    }
});

export default router;
