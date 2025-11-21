import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useMessageStore, loadMessageHistory, Message } from '../stores/messageStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import socketService from '../services/socket';

interface ChatRoomProps {
    roomId: number;
    currentUserId: number;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, currentUserId }) => {
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const messages = useMessageStore((state) => state.messages[roomId] || []);
    const typingUsers = useMessageStore((state) => state.typingUsers[roomId] || new Set());

    const addMessage = useMessageStore((state) => state.addMessage);
    const updateMessageStatus = useMessageStore((state) => state.updateMessageStatus);
    const loadMessages = useMessageStore((state) => state.loadMessages);
    const setTyping = useMessageStore((state) => state.setTyping);

    const messageListRef = useRef<HTMLDivElement>(null);

    // Intersection observer for infinite scroll
    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0,
    });

    // Initial message load
    useEffect(() => {
        loadInitialMessages();

        // Join room
        socketService.joinRoom(roomId);

        // Set up event listeners
        const handleNewMessage = (message: Message) => {
            if (message.room_id === roomId) {
                addMessage(roomId, message);

                // Auto-mark as delivered
                if (message.sender_id !== currentUserId) {
                    setTimeout(() => {
                        socketService.markMessageDelivered(message.id, roomId);
                    }, 100);
                }

                // Scroll to bottom
                scrollToBottom();
            }
        };

        const handleMessageStatus = (data: any) => {
            updateMessageStatus(data.messageId, data.status, data.userId);
        };

        const handleTypingStart = (data: any) => {
            if (data.roomId === roomId && data.userId !== currentUserId) {
                setTyping(roomId, data.userId, true);
            }
        };

        const handleTypingStop = (data: any) => {
            if (data.roomId === roomId) {
                setTyping(roomId, data.userId, false);
            }
        };

        socketService.on('message:new', handleNewMessage);
        socketService.on('message:status', handleMessageStatus);
        socketService.on('typing:start', handleTypingStart);
        socketService.on('typing:stop', handleTypingStop);

        return () => {
            socketService.off('message:new', handleNewMessage);
            socketService.off('message:status', handleMessageStatus);
            socketService.off('typing:start', handleTypingStart);
            socketService.off('typing:stop', handleTypingStop);
            socketService.leaveRoom(roomId);
        };
    }, [roomId]);

    // Load more when scrolling to top
    useEffect(() => {
        if (inView && hasMore && !isLoadingMore) {
            loadMoreMessages();
        }
    }, [inView]);

    const loadInitialMessages = async () => {
        try {
            const { messages: newMessages, nextCursor: cursor } = await loadMessageHistory(roomId);
            loadMessages(roomId, newMessages, false);
            setNextCursor(cursor);
            setHasMore(cursor !== null);

            // Scroll to bottom after initial load
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Failed to load initial messages:', error);
        }
    };

    const loadMoreMessages = async () => {
        if (!nextCursor || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const { messages: newMessages, nextCursor: cursor } = await loadMessageHistory(
                roomId,
                nextCursor
            );

            loadMessages(roomId, newMessages, true); // Append to beginning
            setNextCursor(cursor);
            setHasMore(cursor !== null);
        } catch (error) {
            console.error('Failed to load more messages:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const scrollToBottom = () => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-primary-600 text-white px-6 py-4 shadow-md">
                <h2 className="text-xl font-semibold">Chat Room #{roomId}</h2>
            </div>

            {/* Message List */}
            <div
                ref={messageListRef}
                className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
            >
                {/* Load more trigger */}
                {hasMore && (
                    <div ref={loadMoreRef} className="text-center py-2">
                        {isLoadingMore ? (
                            <span className="text-gray-500">Loading more messages...</span>
                        ) : (
                            <span className="text-gray-400 text-sm">Scroll up to load more</span>
                        )}
                    </div>
                )}

                <MessageList messages={messages} currentUserId={currentUserId} />

                {/* Typing Indicator */}
                {typingUsers.size > 0 && <TypingIndicator />}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 px-4 py-4 bg-gray-50">
                <MessageInput roomId={roomId} currentUserId={currentUserId} />
            </div>
        </div>
    );
};

export default ChatRoom;
