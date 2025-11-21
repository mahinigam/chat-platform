import { create } from 'zustand';
import axios from 'axios';

export interface Message {
    id: string;
    room_id: number;
    sender_id: number;
    content: string;
    message_type: string;
    created_at: Date;
    sender_username?: string;
    sender_avatar?: string;

    // Optimistic UI fields
    tempId?: string; // Temporary ID before server confirms
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    error?: string;
}

interface MessageState {
    messages: Record<number, Message[]>; // roomId -> messages
    typingUsers: Record<number, Set<number>>; // roomId -> Set of userIds

    // Actions
    addOptimisticMessage: (roomId: number, message: Message) => void;
    confirmMessage: (tempId: string, serverMessage: Message) => void;
    markMessageFailed: (tempId: string, error: string) => void;
    addMessage: (roomId: number, message: Message) => void;
    updateMessageStatus: (messageId: string, status: string, userId: number) => void;
    loadMessages: (roomId: number, messages: Message[], append?: boolean) => void;
    setTyping: (roomId: number, userId: number, isTyping: boolean) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
    messages: {},
    typingUsers: {},

    /**
     * Add optimistic message (shown immediately before server confirmation)
     */
    addOptimisticMessage: (roomId, message) => {
        set((state) => ({
            messages: {
                ...state.messages,
                [roomId]: [
                    ...(state.messages[roomId] || []),
                    { ...message, status: 'sending' },
                ],
            },
        }));
    },

    /**
     * Confirm message from server (replace optimistic with real message)
     */
    confirmMessage: (tempId, serverMessage) => {
        set((state) => {
            const { messages } = state;
            const roomId = serverMessage.room_id;
            const roomMessages = messages[roomId] || [];

            const updatedMessages = roomMessages.map((msg) =>
                msg.tempId === tempId
                    ? { ...serverMessage, status: 'sent' }
                    : msg
            );

            return {
                messages: {
                    ...messages,
                    [roomId]: updatedMessages,
                },
            };
        });
    },

    /**
     * Mark optimistic message as failed
     */
    markMessageFailed: (tempId, error) => {
        set((state) => {
            const { messages } = state;
            const newMessages = { ...messages };

            // Find and update the failed message
            for (const roomId in newMessages) {
                newMessages[roomId] = newMessages[roomId].map((msg) =>
                    msg.tempId === tempId
                        ? { ...msg, status: 'failed', error }
                        : msg
                );
            }

            return { messages: newMessages };
        });
    },

    /**
     * Add message from server (new message received)
     */
    addMessage: (roomId, message) => {
        set((state) => {
            const roomMessages = state.messages[roomId] || [];

            // Check if message already exists (avoid duplicates)
            const exists = roomMessages.some((m) => m.id === message.id);
            if (exists) return state;

            return {
                messages: {
                    ...state.messages,
                    [roomId]: [...roomMessages, { ...message, status: 'delivered' }],
                },
            };
        });
    },

    /**
     * Update message status (delivered/read receipts)
     */
    updateMessageStatus: (messageId, status, userId) => {
        set((state) => {
            const { messages } = state;
            const newMessages = { ...messages };

            // Find and update the message
            for (const roomId in newMessages) {
                newMessages[roomId] = newMessages[roomId].map((msg) =>
                    msg.id === messageId
                        ? { ...msg, status: status as any }
                        : msg
                );
            }

            return { messages: newMessages };
        });
    },

    /**
     * Load messages from API (for pagination)
     */
    loadMessages: (roomId, messages, append = false) => {
        set((state) => ({
            messages: {
                ...state.messages,
                [roomId]: append
                    ? [...messages, ...(state.messages[roomId] || [])]
                    : messages,
            },
        }));
    },

    /**
     * Set typing indicator
     */
    setTyping: (roomId, userId, isTyping) => {
        set((state) => {
            const roomTypers = new Set(state.typingUsers[roomId] || []);

            if (isTyping) {
                roomTypers.add(userId);
            } else {
                roomTypers.delete(userId);
            }

            return {
                typingUsers: {
                    ...state.typingUsers,
                    [roomId]: roomTypers,
                },
            };
        });
    },
}));

// API helper for loading message history with cursor pagination
export async function loadMessageHistory(
    roomId: number,
    cursor?: string,
    limit: number = 50
): Promise<{ messages: Message[]; nextCursor: string | null }> {
    try {
        const params = new URLSearchParams();
        if (cursor) params.append('cursor', cursor);
        params.append('limit', limit.toString());

        const response = await axios.get(
            `/api/messages/room/${roomId}?${params.toString()}`
        );

        return response.data;
    } catch (error) {
        console.error('Failed to load message history:', error);
        throw error;
    }
}
