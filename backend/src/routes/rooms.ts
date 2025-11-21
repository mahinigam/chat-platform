import { Router, Request, Response } from 'express';
import { RoomRepository } from '../repositories/RoomRepository';

const router = Router();

// Simple auth middleware for REST API
const authMiddleware = (req: Request, res: Response, next: any): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    // JWT verification would go here
    next();
};

/**
 * Get all rooms for authenticated user
 */
router.get('/', authMiddleware, async (_req: Request, res: Response) => {
    try {
        // In production, extract userId from JWT
        const userId = 1; // Placeholder

        const rooms = await RoomRepository.getUserRooms(userId);

        res.json({ rooms });

    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

/**
 * Create a new room
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { roomType, name, members } = req.body;
        const userId = 1; // From JWT in production

        const room = await RoomRepository.createRoom(roomType, userId, name);

        // Add creator and members
        await RoomRepository.addUserToRoom(room.id, userId, 'admin');

        if (members && Array.isArray(members)) {
            for (const memberId of members) {
                await RoomRepository.addUserToRoom(room.id, memberId, 'member');
            }
        }

        res.status(201).json({ room });

    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

/**
 * Get room members
 */
router.get('/:roomId/members', authMiddleware, async (req: Request, res: Response) => {
    try {
        const roomId = parseInt(req.params.roomId);
        const members = await RoomRepository.getRoomMembers(roomId);

        res.json({ members });

    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

export default router;
