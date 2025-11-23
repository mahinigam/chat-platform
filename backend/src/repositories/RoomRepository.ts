import Database from '../config/database';

interface Room {
    id: number;
    name: string | null;
    room_type: 'direct' | 'group';
    created_by: number | null;
    created_at: Date;
}

interface RoomMember {
    id: number;
    room_id: number;
    user_id: number;
    role: string;
    joined_at: Date;
}

export class RoomRepository {
    /**
     * Create a new room
     */
    static async createRoom(
        roomType: 'direct' | 'group',
        createdBy: number,
        name?: string
    ): Promise<Room> {
        const result = await Database.query(
            `INSERT INTO rooms (room_type, created_by, name)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [roomType, createdBy, name || null]
        );

        return result.rows[0];
    }

    /**
     * Add user to room
     */
    static async addUserToRoom(
        roomId: number,
        userId: number,
        role: string = 'member'
    ): Promise<RoomMember> {
        const result = await Database.query(
            `INSERT INTO room_members (room_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (room_id, user_id) 
       DO UPDATE SET left_at = NULL
       RETURNING *`,
            [roomId, userId, role]
        );

        return result.rows[0];
    }

    /**
     * Remove user from room (soft delete)
     */
    static async removeUserFromRoom(roomId: number, userId: number): Promise<void> {
        await Database.query(
            `UPDATE room_members 
       SET left_at = CURRENT_TIMESTAMP
       WHERE room_id = $1 AND user_id = $2`,
            [roomId, userId]
        );
    }

    /**
     * Check if user is a member of a room
     */
    static async isUserMemberOfRoom(userId: number, roomId: number): Promise<boolean> {
        const result = await Database.query(
            `SELECT 1 FROM room_members 
       WHERE user_id = $1 AND room_id = $2 AND left_at IS NULL`,
            [userId, roomId]
        );

        return result.rows.length > 0;
    }

    /**
     * Get all rooms a user is a member of
     */
    static async getUserRooms(userId: number): Promise<any[]> {
        const result = await Database.query(
            `SELECT r.*, 
              m_last.content as last_message_content,
              m_last.created_at as last_message_at,
              u_last.username as last_sender_username
       FROM rooms r
       JOIN room_members rm ON r.id = rm.room_id
       LEFT JOIN LATERAL (
         SELECT m.content, m.created_at, m.sender_id
         FROM messages m
         WHERE m.room_id = r.id AND m.deleted_at IS NULL
         ORDER BY m.created_at DESC
         LIMIT 1
       ) m_last ON true
       LEFT JOIN users u_last ON m_last.sender_id = u_last.id
       WHERE rm.user_id = $1 AND rm.left_at IS NULL
       ORDER BY COALESCE(m_last.created_at, r.created_at) DESC`,
            [userId]
        );

        return result.rows;
    }

    /**
     * Get room members
     */
    static async getRoomMembers(roomId: number): Promise<any[]> {
        const result = await Database.query(
            `SELECT rm.*, u.username, u.display_name, u.avatar_url, u.last_seen
       FROM room_members rm
       JOIN users u ON rm.user_id = u.id
       WHERE rm.room_id = $1 AND rm.left_at IS NULL`,
            [roomId]
        );

        return result.rows;
    }

    /**
     * Get room by ID
     */
    static async getRoomById(roomId: number): Promise<Room | null> {
        const result = await Database.query(
            `SELECT * FROM rooms WHERE id = $1`,
            [roomId]
        );

        return result.rows[0] || null;
    }

    /**
     * Find or create direct message room between two users
     */
    static async findOrCreateDirectRoom(userId1: number, userId2: number): Promise<Room> {
        // Check if DM already exists
        const existing = await Database.query(
            `SELECT r.* FROM rooms r
       JOIN room_members rm1 ON r.id = rm1.room_id AND rm1.user_id = $1
       JOIN room_members rm2 ON r.id = rm2.room_id AND rm2.user_id = $2
       WHERE r.room_type = 'direct'
         AND rm1.left_at IS NULL 
         AND rm2.left_at IS NULL
       LIMIT 1`,
            [userId1, userId2]
        );

        if (existing.rows.length > 0) {
            return existing.rows[0];
        }

        // Create new DM room
        const room = await this.createRoom('direct', userId1);
        await this.addUserToRoom(room.id, userId1, 'member');
        await this.addUserToRoom(room.id, userId2, 'member');

        return room;
    }
}
