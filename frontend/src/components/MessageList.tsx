import React, { useEffect, useRef, useCallback } from 'react';
import { cn, smoothScroll, announceToScreenReader } from '../utils/theme';
import MessageItem from './MessageItem';

interface Message {
  id: string;
  roomId: string;
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
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  roomName?: string;
  className?: string;
}

const LOAD_MORE_THRESHOLD = 200; // pixels from top

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  roomName = 'Chat',
  className,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLUListElement>(null);
  const lastMessageRef = useRef<HTMLLIElement>(null);
  const isAutoScrolling = useRef(false);

  // Auto-scroll to latest message
  useEffect(() => {
    if (lastMessageRef.current && !isAutoScrolling.current) {
      isAutoScrolling.current = true;
      setTimeout(() => {
        smoothScroll(scrollContainerRef.current!, lastMessageRef.current!);
        isAutoScrolling.current = false;
      }, 100);
    }
  }, [messages.length]);

  // Intersection observer for loading more
  const handleLoadMore = useCallback(() => {
    if (onLoadMore && hasMore && !isLoading) {
      onLoadMore();
      announceToScreenReader('Loading earlier messages', true);
    }
  }, [onLoadMore, hasMore, isLoading]);

  // Infinite scroll on scroll up
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLUListElement>) => {
      const element = e.currentTarget;
      if (element.scrollTop < LOAD_MORE_THRESHOLD && hasMore && !isLoading) {
        handleLoadMore();
      }
    },
    [hasMore, isLoading, handleLoadMore]
  );

  return (
    <div
      className={cn(
        'flex flex-col h-full w-full bg-mono-bg',
        className
      )}
      ref={listRef}
    >
      {/* Header */}
      <div
        className={cn(
          'flex-shrink-0 px-4 py-3',
          'border-b border-mono-glass-border',
          'flex items-center justify-between'
        )}
      >
        <div>
          <h2 className="text-base font-semibold text-mono-text">
            {roomName}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            className={cn(
              'p-2 rounded-glass',
              'bg-mono-surface hover:bg-mono-surface/80',
              'border border-mono-glass-border hover:border-mono-glass-highlight',
              'text-mono-text hover:text-mono-text',
              'transition-all duration-fast ease-glass',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mono-text/50',
              'hover:translate-y-[-1px] active:scale-95',
              'min-h-[40px] min-w-[40px] flex items-center justify-center'
            )}
            aria-label="Room info"
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <ul
        ref={scrollContainerRef}
        className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden',
          'px-4 py-3 space-y-2',
          'scroll-smooth'
        )}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label={`Messages in ${roomName}`}
      >
        {/* Load More Indicator */}
        {hasMore && (
          <li className="flex justify-center py-2">
            {isLoading ? (
              <div
                className="text-xs text-mono-muted flex items-center gap-2"
                role="status"
              >
                <div className="inline-block w-3 h-3 rounded-full bg-mono-muted/40 animate-pulse" />
                Loading earlier messages...
              </div>
            ) : (
              <button
                onClick={handleLoadMore}
                className={cn(
                  'px-3 py-1 rounded-glass text-xs',
                  'bg-mono-surface hover:bg-mono-surface/80',
                  'border border-mono-glass-border hover:border-mono-glass-highlight',
                  'text-mono-muted hover:text-mono-text',
                  'transition-all duration-fast ease-glass',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mono-text/50',
                  'hover:translate-y-[-1px] active:scale-95'
                )}
              >
                Load earlier messages
              </button>
            )}
          </li>
        )}

        {/* Empty State */}
        {messages.length === 0 && !isLoading && (
          <li className="flex items-center justify-center h-full">
            <div className="text-center py-12">
              <div
                className={cn(
                  'w-16 h-16 mx-auto mb-4 rounded-glass',
                  'bg-mono-surface-2 border border-mono-glass-border',
                  'flex items-center justify-center'
                )}
              >
                <svg
                  className="w-8 h-8 text-mono-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-mono-muted text-sm">
                No messages yet. Start a conversation!
              </p>
            </div>
          </li>
        )}

        {/* Messages */}
        {messages.map((message, index) => (
          <li
            key={message.id}
            ref={index === messages.length - 1 ? lastMessageRef : undefined}
            role="listitem"
          >
            <MessageItem message={message} />
          </li>
        ))}

        {/* Loading State */}
        {isLoading && messages.length === 0 && (
          <li className="flex items-center justify-center h-full">
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-2 h-2 rounded-full bg-mono-muted/60',
                        'animate-pulse',
                        {
                          'animation-delay-0': i === 0,
                          'animation-delay-100': i === 1,
                          'animation-delay-200': i === 2,
                        }
                      )}
                      style={{
                        animationDelay: `${i * 100}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-mono-muted text-xs mt-2">
                Loading messages...
              </p>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
};

export default MessageList;
