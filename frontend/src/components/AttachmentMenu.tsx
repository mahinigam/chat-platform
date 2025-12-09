import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/theme';

interface AttachmentMenuProps {
    onSelect: (type: 'image' | 'video' | 'file' | 'poll' | 'location' | 'gif') => void;
    className?: string;
}

const AttachmentMenu: React.FC<AttachmentMenuProps> = ({ onSelect, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const options = [
        { type: 'image', label: 'Photos & Videos', icon: '🖼️' },
        { type: 'file', label: 'Document', icon: '📄' },
        { type: 'poll', label: 'Poll', icon: '📊' },
        { type: 'location', label: 'Location', icon: '📍' },
        { type: 'gif', label: 'GIF', icon: '👾' },
    ] as const;

    return (
        <div className={cn('relative', className)} ref={menuRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'p-2 rounded-full transition-colors',
                    'text-mono-muted hover:text-mono-text hover:bg-mono-surface',
                    isOpen && 'text-mono-text bg-mono-surface'
                )}
                aria-label="Attach"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
            </button>

            {isOpen && (
                <div className={cn(
                    'absolute bottom-full left-0 mb-2 w-48',
                    'bg-mono-surface border border-mono-glass-border rounded-glass',
                    'shadow-lg backdrop-blur-glass',
                    'animate-fade-up origin-bottom-left',
                    'flex flex-col py-2 z-50'
                )}>
                    {options.map((option) => (
                        <button
                            key={option.type}
                            onClick={() => {
                                onSelect(option.type);
                                setIsOpen(false);
                            }}
                            className={cn(
                                'flex items-center gap-3 px-4 py-2 text-left',
                                'text-mono-text hover:bg-mono-surface-2',
                                'transition-colors duration-fast'
                            )}
                        >
                            <span className="text-xl">{option.icon}</span>
                            <span className="text-sm font-medium">{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AttachmentMenu;
