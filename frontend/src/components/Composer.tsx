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
        'flex-shrink-0 p-4 pb-6', /* Added padding bottom for spacing */
        'bg-mono-bg',
        className
      )}
      role="region"
      aria-label="Message composer"
    >
      {/* Hint */}
      {/* Hint removed */}

      {/* Floating Composer Container */}
      <div className="flex gap-4 items-end max-w-4xl mx-auto w-full">
        {/* The Pill: Attachment + Input + Emoji */}
        <div
          className={cn(
            'flex-1 flex gap-2 items-end',
            'px-3 py-1.5 rounded-3xl', /* Reduced padding to match 48px height */
            'backdrop-blur-glass bg-mono-surface border',
            'transition-all duration-normal ease-glass',
            isFocused
              ? 'border-mono-glass-highlight shadow-glass-md'
              : 'border-mono-glass-border hover:border-mono-glass-highlight/50'
          )}
        >
          {/* Attachment Menu (Left) */}
          <AttachmentMenu onSelect={onAttachmentSelect} className="flex-shrink-0" />

          {/* Textarea (Center) */}
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
              'max-h-[120px] min-h-[36px] py-2', /* Added py-2 for alignment */
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-label="Message content"
            aria-describedby="composer-hint"
          />

          {/* Emoji Button (Right inside pill) */}
          <ChromeButton
            onClick={() => { }}
            variant="circle"
            className="flex-shrink-0 min-h-[36px] min-w-[36px] text-mono-muted hover:text-mono-text"
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
        </div>

        {/* Send Button (Floating Outside Right) */}
        <ChromeButton
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading}
          variant="circle"
          className={cn(
            "flex-shrink-0 min-h-[48px] min-w-[48px] rounded-full", /* Bigger send button */
            "shadow-glass-lg"
          )}
          aria-label="Send message"
          title="Send message (Ctrl+Enter)"
        >
          {isLoading ? (
            <svg
              className="w-6 h-6 animate-spin"
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
              className="w-6 h-6" /* Bigger Icon */
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

      {/* Character Counter Removed */}
    </div>
  );
};

export default Composer;
