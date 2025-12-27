import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/theme';
import { Image, FileText, BarChart2, MapPin, FileImage } from 'lucide-react';

import ChromeButton from './ChromeButton';

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
        { type: 'image', label: 'Photos & Videos', icon: <Image className="w-6 h-6" /> },
        { type: 'file', label: 'Document', icon: <FileText className="w-6 h-6" /> },
        { type: 'poll', label: 'Poll', icon: <BarChart2 className="w-6 h-6" /> },
        { type: 'location', label: 'Location', icon: <MapPin className="w-6 h-6" /> },
        { type: 'gif', label: 'GIF', icon: <FileImage className="w-6 h-6" /> },
    ] as const;

    return (
        <div className={cn('relative', className)} ref={menuRef}>
            <ChromeButton
                onClick={() => setIsOpen(!isOpen)}
                variant="circle"
                className={cn(
                    'flex-shrink-0 min-w-[36px] min-h-[36px]',
                    isOpen && 'text-mono-text'
                )}
                aria-label="Attach"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
            </ChromeButton>

            {isOpen && (
                <div className={cn(
                    'absolute bottom-full left-0 mb-2 w-56',
                    'bg-mono-surface border border-mono-glass-border rounded-glass',
                    'shadow-lg backdrop-blur-glass',
                    'animate-fade-up origin-bottom-left',
                    'flex flex-col py-2 z-50'
                )}>
                    {options.map((option) => (
                        <ChromeButton
                            key={option.type}
                            onClick={() => {
                                onSelect(option.type);
                                setIsOpen(false);
                            }}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 text-left w-full',
                                'text-mono-text hover:bg-mono-surface-2',
                                'transition-colors duration-fast rounded-none first:rounded-t-glass last:rounded-b-glass'
                            )}
                        >
                            <span className="text-accent-primary">{option.icon}</span>
                            <span className="text-sm font-medium">{option.label}</span>
                        </ChromeButton>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AttachmentMenu;
