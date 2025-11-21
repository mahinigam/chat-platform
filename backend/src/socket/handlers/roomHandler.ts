import { AuthenticatedSocket } from '../index';
import { RoomRepository } from '../../repositories/RoomRepository';

interface JoinRoomData {
    roomId: number;
}

interface LeaveRoomData {
    roomId: number;
}

class RoomHandler {
    /**
     * Handle user joining a room
     */
    async handleJoinRoom(
        socket: AuthenticatedSocket,
        data: JoinRoomData
    ): Promise<void> {
        try {
            const { userId, username } = socket;
            const { roomId } = data;

            // Verify user is a member of the room
            const isMember = await RoomRepository.isUserMemberOfRoom(userId, roomId);

            if (!isMember) {
                socket.emit('error', {
                    code: 'ROOM_ACCESS_DENIED',
                    message: 'You are not a member of this room',
                });
                return;
            }

            // Join the Socket.io room
            socket.join(`room:${roomId}`);

            // Notify other room members
            socket.to(`room:${roomId}`).emit('room:user_joined', {
                roomId,
                userId,
                username,
            });

            console.log(`User ${username} joined room ${roomId}`);

        } catch (error) {
            console.error('Error handling join room:', error);
            socket.emit('error', {
                code: 'ROOM_JOIN_ERROR',
                message: 'Failed to join room',
            });
        }
    }

    /**
     * Handle user leaving a room
     */
    async handleLeaveRoom(
        socket: AuthenticatedSocket,
        data: LeaveRoomData
    ): Promise<void> {
        try {
            const { userId, username } = socket;
            const { roomId } = data;

            // Leave the Socket.io room
            socket.leave(`room:${roomId}`);

            // Notify other room members
            socket.to(`room:${roomId}`).emit('room:user_left', {
                roomId,
                userId,
                username,
            });

            console.log(`User ${username} left room ${roomId}`);

        } catch (error) {
            console.error('Error handling leave room:', error);
        }
    }
}

export default new RoomHandler();
