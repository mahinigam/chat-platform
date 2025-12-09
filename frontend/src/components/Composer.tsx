import React, { useRef, useState, useEffect } from 'react';
import { cn, focusElement } from '../utils/theme';
import AttachmentMenu from './AttachmentMenu';

interface ComposerProps {
  onSendMessage: (content: string) => void;
  onAttachmentSelect: (type: 'image' | 'video' | 'file' | 'poll' | 'location' | 'gif') => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  onAttachmentSelect,
  isLoading = false,
  placeholder = 'Type a message...',
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [content]);

  const handleSubmit = () => {
    if (content.trim() && !isLoading) {
      onSendMessage(content.trim());
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        focusElement(textareaRef.current);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    // Allow Shift + Enter for newline
    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      const start = textareaRef.current?.selectionStart || 0;
      const end = textareaRef.current?.selectionEnd || 0;
      const newContent = content.substring(0, start) + '\n' + content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
        }
      }, 0);
    }
  };

  return (
    <div
      className={cn(
        'flex-shrink-0 p-4',
        'border-t border-mono-glass-border',
        'bg-mono-bg',
        className
      )}
      role="region"
      aria-label="Message composer"
    >
      {/* Hint */}
      {isFocused && (
        <div className="text-xs text-mono-muted mb-2 px-1 animate-fade-up">
          Press <kbd className="px-1.5 py-0.5 rounded bg-mono-surface border border-mono-glass-border text-mono-text text-xs">Ctrl+Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-mono-surface border border-mono-glass-border text-mono-text text-xs">Shift+Enter</kbd> for new line
        </div>
      )}

      {/* Composer Container */}
      <div
        className={cn(
          'flex gap-2 items-end',
          'px-3 py-2 rounded-glass',
          'backdrop-blur-glass bg-mono-surface border',
          'transition-all duration-normal ease-glass',
          isFocused
            ? 'border-mono-glass-highlight shadow-glass-sm'
            : 'border-mono-glass-border hover:border-mono-glass-border'
        )}
      >
        {/* Attachment Menu */}
        <AttachmentMenu onSelect={onAttachmentSelect} className="flex-shrink-0" />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className={cn(
            'flex-1 bg-transparent text-mono-text placeholder-mono-muted',
            'border-0 outline-0 resize-none',
            'text-sm leading-normal',
            'max-h-[120px] min-h-[36px]',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Message content"
          aria-describedby="composer-hint"
        />

        {/* Emoji Button */}
        <button
          className={cn(
            'p-2 rounded-glass flex-shrink-0',
            'bg-mono-surface-2 hover:bg-mono-surface/40',
            'border border-transparent hover:border-mono-glass-border',
            'text-mono-muted hover:text-mono-text',
            'transition-all duration-fast ease-glass',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mono-text/50',
            'active:scale-95 hover:translate-y-[-1px]',
            'min-h-[36px] min-w-[36px] flex items-center justify-center'
          )}
          aria-label="Emoji picker"
          title="Emoji picker"
          disabled={isLoading}
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

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading}
          className={cn(
            'p-2 rounded-glass flex-shrink-0',
            'bg-mono-surface-2 hover:bg-mono-surface/40',
            'border border-transparent hover:border-mono-glass-highlight',
            'text-mono-muted hover:text-mono-text',
            'transition-all duration-fast ease-glass',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mono-text/50',
            'active:scale-95 hover:translate-y-[-1px]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
            'min-h-[36px] min-w-[36px] flex items-center justify-center'
          )}
          aria-label="Send message"
          title="Send message (Ctrl+Enter)"
        >
          {isLoading ? (
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z" />
            </svg>
          )}
        </button>
      </div>

      {/* Character Counter (Optional) */}
      {content.length > 0 && (
        <div className="text-xs text-mono-muted mt-1 px-1">
          {content.length} character{content.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default Composer;
