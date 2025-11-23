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
        <div className="flex flex-col h-full relative bg-black">
            {/* Header */}
            <div className="glass-panel border-b border-white/5 px-6 py-5 z-10 flex justify-between items-center backdrop-blur-2xl bg-black/20">
                <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse"></div>
                    <h2 className="text-lg font-heading text-white/90 tracking-widest uppercase text-xs">
                        General
                    </h2>
                </div>
                <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Room #{roomId}</div>
            </div>

            {/* Message List */}
            <div
                ref={messageListRef}
                className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scroll-smooth"
            >
                {/* Load more trigger */}
                {hasMore && (
                    <div ref={loadMoreRef} className="text-center py-4">
                        {isLoadingMore ? (
                            <div className="inline-block w-5 h-5 border border-white/10 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <span className="text-gray-700 text-[10px] uppercase tracking-[0.2em] opacity-40">↑ History</span>
                        )}
                    </div>
                )}

                <MessageList messages={messages} currentUserId={currentUserId} />

                {/* Typing Indicator */}
                {typingUsers.size > 0 && (
                    <div className="animate-fade-in">
                        <TypingIndicator />
                    </div>
                )}
            </div>

            {/* Message Input */}
            <div className="p-6 relative z-20 border-t border-white/5">
                <div className="glass-panel rounded-full p-1.5 bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.02)]">
                    <MessageInput roomId={roomId} currentUserId={currentUserId} />
                </div>
            </div>
        </div>
    );
};

export default ChatRoom;
