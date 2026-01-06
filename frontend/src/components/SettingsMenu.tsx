import React, { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, User, Ban } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '../utils/theme';
import ChromeButton from './ChromeButton';
import Avatar from './Avatar';
import BlockedUsersModal from './BlockedUsersModal';

interface SettingsMenuProps {
    user?: {
        name: string;
        avatar?: string;
        email?: string;
    };
    token?: string;
    onLogout: () => void;
    className?: string;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ user, token, onLogout, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isBlockedUsersOpen, setIsBlockedUsersOpen] = useState(false);
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

    // Animation Variants
    const menuVariants: Variants = {
        hidden: {
            opacity: 0,
            scale: 0.98,
            transition: {
                duration: 0.15,
                ease: "easeOut" as const
            }
        },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 34,
                mass: 1,
                staggerChildren: 0.08,
                delayChildren: 0.05
            }
        },
        exit: {
            opacity: 0,
            scale: 0.98,
            transition: {
                duration: 0.15,
                ease: "easeIn" as const
            }
        }
    };

    const itemVariants: Variants = {
        hidden: {
            opacity: 0,
            y: 8,
            filter: "blur(5px)"
        },
        visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
                duration: 0.3,
                ease: [0.2, 0.65, 0.3, 0.9] as const
            }
        }
    };

    return (
        <>
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

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            variants={menuVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className={cn(
                                "absolute bottom-full right-0 mb-3 w-64",
                                "bg-mono-bg/90 border border-mono-glass-border",
                                "rounded-2xl shadow-2xl overflow-hidden",
                                "z-50",
                                "divide-y divide-mono-glass-border"
                            )}
                            style={{ transformOrigin: "bottom right" }}
                        >
                            {/* User Info Header */}
                            <motion.div variants={itemVariants} className="p-4 flex items-center gap-3 bg-mono-surface/30">
                                <Avatar src={user?.avatar} name={user?.name} size="md" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-mono-text truncate">
                                        {user?.name || 'User'}
                                    </p>
                                </div>
                            </motion.div>

                            {/* Menu Items */}
                            <div className="p-1">
                                <motion.button
                                    variants={itemVariants}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-mono-text hover:bg-mono-surface rounded-xl transition-colors text-left"
                                >
                                    <User className="w-4 h-4 text-mono-muted" />
                                    <span>Edit Profile</span>
                                </motion.button>

                                <motion.button
                                    variants={itemVariants}
                                    onClick={() => {
                                        setIsOpen(false);
                                        setIsBlockedUsersOpen(true);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-mono-text hover:bg-mono-surface rounded-xl transition-colors text-left"
                                >
                                    <Ban className="w-4 h-4 text-mono-muted" />
                                    <span>Blocked Users</span>
                                </motion.button>
                            </div>

                            {/* Logout Section */}
                            <div className="p-1">
                                <motion.button
                                    variants={itemVariants}
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors text-left font-medium"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Log Out</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Blocked Users Modal */}
            <BlockedUsersModal
                isOpen={isBlockedUsersOpen}
                onClose={() => setIsBlockedUsersOpen(false)}
                token={token || localStorage.getItem('token') || ''}
            />
        </>
    );
};

export default SettingsMenu;
