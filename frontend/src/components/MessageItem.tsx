import React, { useState } from 'react';
import { cn, formatTimestamp, getStatusAriaLabel, getAriaLabel } from '../utils/theme';

interface MessageItemProps {
  message: {
    id: string;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
    content: string;
    timestamp: Date | string;
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    isOwn: boolean;
    reactions?: Array<{
      emoji: string;
      count: number;
      by: string[];
    }>;
  };
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const [showReactions, setShowReactions] = useState(false);

  const timestamp = formatTimestamp(message.timestamp);

  return (
    <div
      className={cn(
        'flex gap-2 group',
        message.isOwn && 'flex-row-reverse'
      )}
      role="article"
      aria-label={getAriaLabel(
        message.sender.name,
        timestamp,
        message.content
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8">
        {message.sender.avatar ? (
          <img
            src={message.sender.avatar}
            alt={`${message.sender.name}'s avatar`}
            className="w-full h-full rounded-glass object-cover border border-mono-glass-border"
          />
        ) : (
          <div
            className={cn(
              'w-full h-full rounded-glass',
              'bg-mono-surface-2 border border-mono-glass-border',
              'flex items-center justify-center',
              'text-mono-muted text-xs font-medium'
            )}
          >
            {message.sender.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className={cn('flex flex-col gap-1 max-w-[360px]', message.isOwn && 'items-end')}>
        {/* Sender name (for received messages) */}
        {!message.isOwn && (
          <div className="px-3 py-1 text-xs font-medium text-mono-muted">
            {message.sender.name}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            'px-3 py-2 rounded-glass',
            'backdrop-blur-glass border',
            'transition-all duration-normal ease-glass',
            'group-hover:shadow-glass-sm',
            message.isOwn
              ? 'bg-mono-surface border-mono-glass-highlight'
              : 'bg-mono-surface/50 border-mono-glass-border',
            message.status === 'failed' && 'border-red-500/50 bg-red-500/10'
          )}
        >
          <p className="text-sm text-mono-text whitespace-pre-wrap break-words leading-normal">
            {message.content}
          </p>

          {/* Timestamp and Status */}
          <div
            className={cn(
              'flex items-center gap-1 mt-1',
              'text-xs text-mono-muted'
            )}
          >
            <span>{timestamp}</span>
            {message.isOwn && message.status && (
              <div
                aria-label={getStatusAriaLabel(message.status)}
                title={getStatusAriaLabel(message.status)}
              >
                {message.status === 'sending' && (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {message.status === 'failed' && (
                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {message.status === 'sent' && (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {message.status === 'delivered' && (
                  <div className="flex gap-0.5">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <svg
                      className="w-3 h-3 -ml-1.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                {message.status === 'read' && (
                  <div className="flex gap-0.5 text-green-400">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <svg
                      className="w-3 h-3 -ml-1.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 flex-wrap px-1">
            {message.reactions.map((reaction, idx) => (
              <button
                key={idx}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  'bg-mono-surface/40 border border-mono-glass-border',
                  'hover:bg-mono-surface/60 hover:border-mono-glass-highlight',
                  'transition-all duration-fast ease-glass',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-mono-text/50',
                  'active:scale-95'
                )}
                title={`${reaction.count} people reacted with ${reaction.emoji}`}
                aria-label={`${reaction.count} people reacted with ${reaction.emoji}`}
              >
                <span>{reaction.emoji}</span>
                <span className="ml-1 text-mono-muted">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Hover Actions */}
        <div
          className={cn(
            'flex gap-1 opacity-0 group-hover:opacity-100',
            'transition-opacity duration-fast',
            'px-1'
          )}
        >
          <button
            className={cn(
              'p-1.5 rounded-glass text-xs',
              'bg-mono-surface hover:bg-mono-surface/80',
              'border border-mono-glass-border hover:border-mono-glass-highlight',
              'text-mono-muted hover:text-mono-text',
              'transition-all duration-fast ease-glass',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-mono-text/50',
              'active:scale-95 hover:translate-y-[-1px]',
              'min-h-[32px] min-w-[32px] flex items-center justify-center'
            )}
            aria-label="Add reaction"
            onClick={() => setShowReactions(!showReactions)}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          <button
            className={cn(
              'p-1.5 rounded-glass text-xs',
              'bg-mono-surface hover:bg-mono-surface/80',
              'border border-mono-glass-border hover:border-mono-glass-highlight',
              'text-mono-muted hover:text-mono-text',
              'transition-all duration-fast ease-glass',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-mono-text/50',
              'active:scale-95 hover:translate-y-[-1px]',
              'min-h-[32px] min-w-[32px] flex items-center justify-center'
            )}
            aria-label="More options"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M10.5 1.5H9.5V3h1V1.5zM10.5 9.5H9.5V11h1V9.5zM10.5 17.5H9.5V19h1v-1.5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
