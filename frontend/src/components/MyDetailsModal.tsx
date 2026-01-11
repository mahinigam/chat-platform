import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, AtSign } from 'lucide-react';
import ChromeButton from './ChromeButton';
import Avatar from './Avatar';

interface MyDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        name: string;
        username: string;
        email?: string;
        avatar?: string;
    };
}

const MyDetailsModal: React.FC<MyDetailsModalProps> = ({ isOpen, onClose, user }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-mono-bg border border-mono-glass-border rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-mono-glass-border">
                            <h2 className="text-lg font-semibold text-mono-text">My Details</h2>
                            <button
                                onClick={onClose}
                                className="p-2 text-mono-muted hover:text-mono-text transition-colors rounded-full hover:bg-mono-surface"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            <div className="flex flex-col items-center justify-center text-center">
                                <Avatar src={user.avatar} name={user.name} size="xl" className="mb-4" />
                                <h3 className="text-xl font-bold text-mono-text">{user.name}</h3>
                                <p className="text-mono-muted">@{user.username}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-mono-muted uppercase tracking-wider">Display Name</label>
                                    <div className="flex items-center gap-3 p-3 bg-mono-surface rounded-xl border border-mono-glass-border text-mono-text">
                                        <User className="w-5 h-5 text-mono-muted" />
                                        <span>{user.name}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-mono-muted uppercase tracking-wider">Username</label>
                                    <div className="flex items-center gap-3 p-3 bg-mono-surface rounded-xl border border-mono-glass-border text-mono-text">
                                        <AtSign className="w-5 h-5 text-mono-muted" />
                                        <span>{user.username}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-mono-muted uppercase tracking-wider">Email Address</label>
                                    <div className="flex items-center gap-3 p-3 bg-mono-surface rounded-xl border border-mono-glass-border text-mono-text">
                                        <Mail className="w-5 h-5 text-mono-muted" />
                                        <span>{user.email || 'No email provided'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-mono-surface/30 border-t border-mono-glass-border">
                            <ChromeButton onClick={onClose} className="w-full">
                                Close
                            </ChromeButton>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MyDetailsModal;
