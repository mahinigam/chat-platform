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
                        className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-6 group`}
                    >
                        <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} max-w-xs md:max-w-md`}>
                            {/* Sender name for received messages */}
                            {!isSent && (
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 px-2 font-medium">
                                    {message.sender_username || 'Unknown'}
                                </span>
                            )}

                            {/* Message bubble */}
                            <div
                                className={`message-bubble ${isSent ? 'message-sent' : 'message-received'
                                    } transition-transform duration-200 hover:scale-[1.02]`}
                            >
                                <p className="text-sm leading-relaxed font-body">{message.content}</p>
                            </div>

                            {/* Message status and timestamp */}
                            <div className="flex items-center space-x-2 mt-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-[10px] text-gray-500">
                                    {message.created_at
                                        ? formatDistanceToNow(new Date(message.created_at), {
                                            addSuffix: true,
                                        })
                                        : 'Just now'}
                                </span>

                                {/* Status indicator for sent messages */}
                                {isSent && (
                                    <span className="text-[10px]">
                                        {message.status === 'sending' && (
                                            <span className="text-gray-500 italic">sending...</span>
                                        )}
                                        {message.status === 'sent' && (
                                            <span className="text-gray-400">sent</span>
                                        )}
                                        {message.status === 'delivered' && (
                                            <span className="text-gray-300">delivered</span>
                                        )}
                                        {message.status === 'read' && (
                                            <span className="text-primary-400 font-medium">read</span>
                                        )}
                                        {message.status === 'failed' && (
                                            <span className="text-red-400 font-medium" title={message.error}>
                                                failed
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
