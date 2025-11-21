import React from 'react';
import { Message } from '../stores/messageStore';
import { formatDistanceToNow } from 'date-fns';

interface MessageListProps {
    messages: Message[];
    currentUserId: number;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
    return (
        <>
            {messages.map((message) => {
                const isSent = message.sender_id === currentUserId;

                return (
                    <div
                        key={message.id || message.tempId}
                        className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                        <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} max-w-xs`}>
                            {/* Sender name for received messages */}
                            {!isSent && (
                                <span className="text-xs text-gray-600 mb-1 px-2">
                                    {message.sender_username || 'Unknown'}
                                </span>
                            )}

                            {/* Message bubble */}
                            <div
                                className={`message-bubble ${isSent ? 'message-sent' : 'message-received'
                                    }`}
                            >
                                <p className="text-sm">{message.content}</p>
                            </div>

                            {/* Message status and timestamp */}
                            <div className="flex items-center space-x-2 mt-1 px-2">
                                <span className="text-xs text-gray-500">
                                    {message.created_at
                                        ? formatDistanceToNow(new Date(message.created_at), {
                                            addSuffix: true,
                                        })
                                        : 'Just now'}
                                </span>

                                {/* Status indicator for sent messages */}
                                {isSent && (
                                    <span className="text-xs">
                                        {message.status === 'sending' && (
                                            <span className="text-gray-400">⏱️</span>
                                        )}
                                        {message.status === 'sent' && (
                                            <span className="text-gray-500">✓</span>
                                        )}
                                        {message.status === 'delivered' && (
                                            <span className="text-gray-600">✓✓</span>
                                        )}
                                        {message.status === 'read' && (
                                            <span className="text-primary-500">✓✓</span>
                                        )}
                                        {message.status === 'failed' && (
                                            <span className="text-red-500" title={message.error}>
                                                ⚠️
                                            </span>
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export default MessageList;
