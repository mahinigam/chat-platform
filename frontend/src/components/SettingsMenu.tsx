import React, { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, User } from 'lucide-react';
import { cn } from '../utils/theme';
import ChromeButton from './ChromeButton';
import Avatar from './Avatar';

interface SettingsMenuProps {
    user?: {
        name: string;
        avatar?: string;
        email?: string;
    };
    onLogout: () => void;
    className?: string;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ user, onLogout, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={cn("relative", className)} ref={menuRef}>
            <ChromeButton
                variant="circle"
                className={cn(
                    "p-2 min-h-[36px] min-w-[36px] flex items-center justify-center",
                    isOpen ? "text-mono-text bg-mono-surface" : "text-mono-muted"
                )}
                title="Settings"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Settings className="w-5 h-5" />
            </ChromeButton>

            {isOpen && (
                <div className={cn(
                    "absolute bottom-full right-0 mb-3 w-64",
                    "bg-mono-bg/95 backdrop-blur-xl border border-mono-glass-border",
                    "rounded-2xl shadow-2xl overflow-hidden",
                    "animate-scale-up origin-bottom-right z-50",
                    "divide-y divide-mono-glass-border"
                )}>
                    {/* User Info Header */}
                    <div className="p-4 flex items-center gap-3 bg-mono-surface/30">
                        <Avatar src={user?.avatar} name={user?.name} size="md" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-mono-text truncate">
                                {user?.name || 'User'}
                            </p>
                            {/* Email removed for privacy */}
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-1">
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-mono-text hover:bg-mono-surface rounded-xl transition-colors text-left">
                            <User className="w-4 h-4 text-mono-muted" />
                            <span>Edit Profile</span>
                        </button>
                    </div>

                    {/* Logout Section */}
                    <div className="p-1">
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors text-left font-medium"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsMenu;
