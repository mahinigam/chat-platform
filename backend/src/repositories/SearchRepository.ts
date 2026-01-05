import Database from '../config/database';

interface SearchResult {
    id: string;
    room_id: number;
    room_name: string | null;
    sender_id: number;
    sender_username: string;
    content: string;
    message_type: string;
    created_at: Date;
    match_snippet: string;
}

export class SearchRepository {
    /**
     * Search messages within a specific room
     * Supports filters: sender (username), before (date), after (date)
     */
    static async searchInRoom(
        roomId: number,
        query: string,
        limit: number = 20,
        offset: number = 0,
        filters?: { sender?: string; before?: string; after?: string }
    ): Promise<{ results: SearchResult[]; total: number }> {
        // Convert query to tsquery format
        const tsQuery = query.split(' ').filter(Boolean).join(' & ');

        // Build dynamic WHERE conditions
        let whereConditions = `m.room_id = $1 AND m.deleted_at IS NULL`;
        const params: any[] = [roomId];
        let paramIndex = 2;

        if (query.trim()) {
            whereConditions += ` AND m.search_vector @@ to_tsquery('english', $${paramIndex})`;
            params.push(tsQuery);
            paramIndex++;
        }

        if (filters?.sender) {
            whereConditions += ` AND u.username ILIKE $${paramIndex}`;
            params.push(`%${filters.sender}%`);
            paramIndex++;
        }

        if (filters?.before) {
            whereConditions += ` AND m.created_at < $${paramIndex}::date`;
            params.push(filters.before);
            paramIndex++;
        }

        if (filters?.after) {
            whereConditions += ` AND m.created_at >= $${paramIndex}::date`;
            params.push(filters.after);
            paramIndex++;
        }

        const countResult = await Database.query(
            `SELECT COUNT(*) as total
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE ${whereConditions}`,
            params
        );

        // Add limit and offset params
        const selectParams = [...params, limit, offset];

        const result = await Database.query(
            `SELECT 
                m.id,
                m.room_id,
                r.name as room_name,
                m.sender_id,
                u.username as sender_username,
                m.content,
                m.message_type,
                m.created_at,
                ${query.trim()
                ? `ts_headline('english', m.content, to_tsquery('english', $2), 
                        'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20') as match_snippet`
                : `m.content as match_snippet`}
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             JOIN rooms r ON m.room_id = r.id
             WHERE ${whereConditions}
             ORDER BY ${query.trim() ? `ts_rank(m.search_vector, to_tsquery('english', $2)) DESC,` : ''} m.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            selectParams
        );

        return {
            results: result.rows,
            total: parseInt(countResult.rows[0].total, 10)
        };
    }

    /**
     * Global search across all rooms the user has access to
     */
    static async searchGlobal(
        userId: number,
        query: string,
        limit: number = 20,
        offset: number = 0
    ): Promise<{ results: SearchResult[]; total: number }> {
        const tsQuery = query.split(' ').filter(Boolean).join(' & ');

        const countResult = await Database.query(
            `SELECT COUNT(*) as total
             FROM messages m
             JOIN room_members rm ON m.room_id = rm.room_id
             WHERE rm.user_id = $1
               AND rm.left_at IS NULL
               AND m.deleted_at IS NULL
               AND m.search_vector @@ to_tsquery('english', $2)`,
            [userId, tsQuery]
        );

        const result = await Database.query(
            `SELECT 
                m.id,
                m.room_id,
                r.name as room_name,
                m.sender_id,
                u.username as sender_username,
                m.content,
                m.message_type,
                m.created_at,
                ts_headline('english', m.content, to_tsquery('english', $2), 
                    'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20') as match_snippet
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             JOIN rooms r ON m.room_id = r.id
             JOIN room_members rm ON m.room_id = rm.room_id
             WHERE rm.user_id = $1
               AND rm.left_at IS NULL
               AND m.deleted_at IS NULL
               AND m.search_vector @@ to_tsquery('english', $2)
             ORDER BY ts_rank(m.search_vector, to_tsquery('english', $2)) DESC, m.created_at DESC
             LIMIT $3 OFFSET $4`,
            [userId, tsQuery, limit, offset]
        );

        return {
            results: result.rows,
            total: parseInt(countResult.rows[0].total, 10)
        };
    }

    /**
     * Search with a simpler ILIKE fallback (for when FTS index doesn't exist yet)
     */
    static async searchSimple(
        roomId: number,
        query: string,
        limit: number = 20
    ): Promise<SearchResult[]> {
        const result = await Database.query(
            `SELECT 
                m.id,
                m.room_id,
                r.name as room_name,
                m.sender_id,
                u.username as sender_username,
                m.content,
                m.message_type,
                m.created_at,
                m.content as match_snippet
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             JOIN rooms r ON m.room_id = r.id
             WHERE m.room_id = $1 
               AND m.deleted_at IS NULL
               AND m.content ILIKE $2
             ORDER BY m.created_at DESC
             LIMIT $3`,
            [roomId, `%${query}%`, limit]
        );

        return result.rows;
    }
}
