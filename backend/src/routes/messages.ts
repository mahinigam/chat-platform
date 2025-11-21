import { Router, Request, Response } from 'express';
import { MessageRepository } from '../repositories/MessageRepository';

const router = Router();

// Simple auth middleware for REST API (can be extracted to shared middleware)
const authMiddleware = (req: Request, res: Response, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // JWT verification would go here
    next();
};

/**
 * Get messages for a room with cursor-based pagination
 * GET /api/messages/room/:roomId?cursor=<messageId>&limit=50
 */
router.get('/room/:roomId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const roomId = parseInt(req.params.roomId);
        const cursor = req.query.cursor as string | undefined;
        const limit = parseInt(req.query.limit as string) || 50;

        const result = await MessageRepository.getMessagesByRoom(roomId, limit, cursor);

        res.json(result);

    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

/**
 * Get message receipts
 */
router.get('/:messageId/receipts', authMiddleware, async (req: Request, res: Response) => {
    try {
        const messageId = req.params.messageId;
        const receipts = await MessageRepository.getMessageReceipts(messageId);

        res.json({ receipts });

    } catch (error) {
        console.error('Get receipts error:', error);
        res.status(500).json({ error: 'Failed to fetch receipts' });
    }
});

export default router;
