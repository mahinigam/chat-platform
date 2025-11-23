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
        <div className="flex items-center space-x-3 w-full">
            <input
                type="text"
                value={message}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="Type message..."
                className="flex-1 px-6 py-3.5 bg-transparent text-white placeholder-gray-700 focus:placeholder-gray-500 focus:outline-none font-body text-sm tracking-wide"
            />
            <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className={`p-3.5 rounded-full transition-all duration-500 flex items-center justify-center ${message.trim()
                    ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-white/15 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transform hover:scale-110'
                    : 'bg-white/[0.02] text-gray-700 cursor-not-allowed'
                    }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
            </button>
        </div>
    );
};

export default MessageInput;
