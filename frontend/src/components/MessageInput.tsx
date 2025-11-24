import React, { useState, useCallback, useRef } from 'react';
import { useMessageStore } from '../stores/messageStore';
import socketService from '../services/socket';
import { v4 as uuidv4 } from 'uuid';

interface MessageInputProps {
    roomId: number;
    currentUserId: number;
}

const MessageInput: React.FC<MessageInputProps> = ({ roomId, currentUserId }) => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const addOptimisticMessage = useMessageStore((state) => state.addOptimisticMessage);
    const confirmMessage = useMessageStore((state) => state.confirmMessage);
    const markMessageFailed = useMessageStore((state) => state.markMessageFailed);

    // Debounced typing indicator
    const handleTyping = useCallback(() => {
        if (!isTyping) {
            setIsTyping(true);
            socketService.startTyping(roomId);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socketService.stopTyping(roomId);
        }, 3000);
    }, [roomId, isTyping]);

    const handleSendMessage = useCallback(() => {
        if (!message.trim()) return;

        const tempId = uuidv4();
        const optimisticMessage = {
            id: tempId,
            tempId,
            room_id: roomId,
            sender_id: currentUserId,
            content: message.trim(),
            message_type: 'text',
            created_at: new Date(),
            status: 'sending' as const,
        };

        // Add optimistic message immediately (shown to user right away)
        addOptimisticMessage(optimisticMessage);

        // Clear input
        setMessage('');

        // Stop typing indicator
        if (isTyping) {
            setIsTyping(false);
            socketService.stopTyping(roomId);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }

        // Send to server
        socketService.sendMessage(roomId, optimisticMessage.content, tempId, (response) => {
            if (response.success) {
                // Confirm optimistic message with server data
                confirmMessage(tempId, response.message);
            } else {
                // Mark as failed
                markMessageFailed(tempId, response.error || 'Failed to send');
            }
        });
    }, [message, roomId, currentUserId, isTyping]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
        handleTyping();
    };

    return (
        <div className="flex items-end space-x-2 w-full">
            <button className="p-3 text-telegram-gray hover:text-telegram-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 2.25c.538.538.812 1.226.812 1.987 0 .76-.274 1.447-.812 1.987l-.94.94m-4.125 7.625l-2.578-2.578m0 0L3.75 20.25" />
                </svg>
            </button>
            <div className="flex-1 bg-white">
                <input
                    type="text"
                    value={message}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Write a message..."
                    className="w-full px-0 py-3 bg-transparent text-black placeholder-gray-400 focus:outline-none font-sans text-[15px]"
                />
            </div>
            <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className={`p-3 transition-all duration-200 flex items-center justify-center rounded-full ${message.trim()
                    ? 'text-telegram-primary hover:bg-telegram-primary/10'
                    : 'text-telegram-primary/50 cursor-default'
                    }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
            </button>
        </div>
    );
};

export default MessageInput;
