import React, { useRef, useState, useEffect } from 'react';
import { cn, focusElement } from '../utils/theme';
import AttachmentMenu from './AttachmentMenu';
import ChromeButton from './ChromeButton';

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

      // Cosmic Ripple Effect
      window.dispatchEvent(new CustomEvent('cosmic:input'));

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
      {/* Hint removed */}

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
        <ChromeButton
          onClick={() => { }} // Emoji picker logic to be implemented or if existing, use it. Wait, original didn't have onClick logic in snippet? 
          variant="circle"
          className="flex-shrink-0 min-h-[36px] min-w-[36px]"
          aria-label="Emoji picker"
          title="Emoji picker"
          disabled={isLoading}
        >
          <svg
            className="w-5 h-5"
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
        </ChromeButton>

        {/* Send Button - with mouse-tracking chrome rim */}
        <ChromeButton
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading}
          variant="circle"
          className="flex-shrink-0 min-h-[36px] min-w-[36px]"
          aria-label="Send message"
          title="Send message (Ctrl+Enter)"
        >
          {isLoading ? (
            <svg
              className="w-5 h-5 animate-spin"
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
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
        </ChromeButton>
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
