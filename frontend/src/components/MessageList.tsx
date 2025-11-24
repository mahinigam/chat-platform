import React from 'react';
import { Message } from '../stores/messageStore';

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
                        className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2 group px-2`}
                    >
                        <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} max-w-[460px]`}>
                            {/* Message bubble */}
                            <div
                                className={`message-bubble ${isSent ? 'message-sent' : 'message-received'
                                    } text-left`}
                            >
                                {/* Sender name for received messages in groups */}
                                {!isSent && (
                                    <div className="text-[13px] font-medium text-telegram-primary mb-1 cursor-pointer hover:underline">
                                        {message.sender_username || 'Unknown'}
                                    </div>
                                )}

                                <span className="text-[15px] text-black whitespace-pre-wrap leading-snug">
                                    {message.content}
                                    {/* Spacer for timestamp */}
                                    <span className="inline-block w-12"></span>
                                </span>

                                {/* Timestamp & Status (Inside Bubble, Bottom Right) */}
                                <div className={`float-right flex items-center space-x-1 ml-2 mt-1 select-none ${isSent ? 'text-[#59a648]' : 'text-[#a0a0a0]'
                                    }`}>
                                    <span className="text-[11px]">
                                        {message.created_at
                                            ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>

                                    {/* Status indicator for sent messages */}
                                    {isSent && (
                                        <span className="text-[14px]">
                                            {message.status === 'sending' && (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 animate-pulse">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                            {(message.status === 'sent' || message.status === 'delivered') && (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                            )}
                                            {message.status === 'read' && (
                                                <div className="flex -space-x-1.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-[#53b33e]">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                    </svg>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-[#53b33e]">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                    </svg>
                                                </div>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export default MessageList;
