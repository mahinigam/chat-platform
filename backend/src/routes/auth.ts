import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Database from '../config/database';

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

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

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
            // We import RoomRepository dynamically to avoid circular dependency if any, 
            // though here it's fine. Or better, add import at top.
            // But since I can't see imports easily in this chunk, I'll assume I need to add the import or use a raw query.
            // To be safe and consistent, I'll use a raw query here to avoid import issues in this specific file 
            // or just add the import in a separate step if needed. 
            // Actually, I'll add the import in a separate edit if it's missing, but let's check if I can just use Database.query directly for simplicity here.

            await Database.query(
                `INSERT INTO room_members (room_id, user_id, role)
                 VALUES (1, $1, 'member')
                 ON CONFLICT DO NOTHING`,
                [user.id]
            );
        } catch (err) {
            console.error('Failed to add user to default room:', err);
            // Continue anyway, don't fail registration
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET as string,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
        );

        return res.status(201).json({
            user,
            token,
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

        // Find user
        const result = await Database.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET as string,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
        );

        return res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.display_name,
                avatarUrl: user.avatar_url,
            },
            token,
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Login failed' });
    }
});

export default router;
