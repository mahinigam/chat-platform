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
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        addOptimisticMessage(roomId, optimisticMessage);

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
        <div className="flex items-center space-x-3">
            <input
                type="text"
                value={message}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className={`px-6 py-3 rounded-full font-medium transition-all ${message.trim()
                        ? 'bg-primary-500 text-white hover:bg-primary-600 active:scale-95'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
            >
                Send
            </button>
        </div>
    );
};

export default MessageInput;
