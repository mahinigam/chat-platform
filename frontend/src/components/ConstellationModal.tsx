import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Trash2, Edit2, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '../utils/theme';
import socketService from '../services/socket';
import ChromeButton from './ChromeButton';
import Avatar from './Avatar';
import { useToast } from '../hooks/useToast';

interface Constellation {
    id: number;
    name: string;
    description?: string;
    message_count: number;
    created_at: string;
}

interface ConstellationMessage {
    message_id: string;
    content: string;
    message_type: string;
    message_created_at: string;
    sender_id: number;
    sender_username: string;
    sender_display_name?: string;
    room_id: number;
    room_name?: string;
    room_type: string;
    added_at: string;
}

interface ConstellationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigateToMessage?: (roomId: number, messageId: string) => void;
}

const ConstellationModal: React.FC<ConstellationModalProps> = ({
    isOpen,
    onClose,
    onNavigateToMessage,
}) => {
    const [constellations, setConstellations] = useState<Constellation[]>([]);
    const [selectedConstellation, setSelectedConstellation] = useState<Constellation | null>(null);
    const [messages, setMessages] = useState<ConstellationMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const { addToast } = useToast();

    const loadConstellations = useCallback(() => {
        setLoading(true);
        socketService.getConstellations((response) => {
            if (response.constellations) {
                setConstellations(response.constellations);
            }
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadConstellations();
            setSelectedConstellation(null);
            setMessages([]);
        }
    }, [isOpen, loadConstellations]);

    const loadMessages = (constellation: Constellation) => {
        setSelectedConstellation(constellation);
        setLoadingMessages(true);
        socketService.getConstellationMessages(constellation.id, (response) => {
            if (response.messages) {
                setMessages(response.messages);
            }
            setLoadingMessages(false);
        });
    };

    const handleDeleteConstellation = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this constellation? Messages will not be deleted.')) return;

        socketService.deleteConstellation(id, (response) => {
            if (response.success) {
                setConstellations(prev => prev.filter(c => c.id !== id));
                if (selectedConstellation?.id === id) {
                    setSelectedConstellation(null);
                    setMessages([]);
                }
                addToast('Constellation deleted', 'success');
            } else {
                addToast(response.error || 'Failed to delete', 'error');
            }
        });
    };

    const handleRenameConstellation = (id: number) => {
        if (!editName.trim()) return;
        socketService.updateConstellation(id, { name: editName.trim() }, (response) => {
            if (response.success) {
                setConstellations(prev => prev.map(c =>
                    c.id === id ? { ...c, name: editName.trim() } : c
                ));
                if (selectedConstellation?.id === id) {
                    setSelectedConstellation(prev => prev ? { ...prev, name: editName.trim() } : null);
                }
                setEditingId(null);
            }
        });
    };

    const handleRemoveMessage = (messageId: string) => {
        if (!selectedConstellation) return;
        socketService.removeFromConstellation(selectedConstellation.id, messageId, (response) => {
            if (response.success) {
                setMessages(prev => prev.filter(m => m.message_id !== messageId));
                // Update count
                setConstellations(prev => prev.map(c =>
                    c.id === selectedConstellation.id
                        ? { ...c, message_count: c.message_count - 1 }
                        : c
                ));
            }
        });
    };

    const handleGoToMessage = (msg: ConstellationMessage) => {
        onNavigateToMessage?.(msg.room_id, msg.message_id);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        'w-full max-w-2xl h-[70vh] bg-mono-bg rounded-2xl shadow-2xl overflow-hidden',
                        'border border-mono-glass-border flex'
                    )}
                >
                    {/* Sidebar - Constellation List */}
                    <div className="w-1/3 border-r border-mono-glass-border flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-mono-glass-border">
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-400" />
                                <h2 className="font-semibold text-mono-text">Constellations</h2>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-5 h-5 animate-spin text-mono-muted" />
                                </div>
                            ) : constellations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-mono-muted text-center p-4">
                                    <Star className="w-10 h-10 mb-2 opacity-30" />
                                    <p className="text-sm">No constellations yet</p>
                                    <p className="text-xs mt-1">Add messages from chat to create one</p>
                                </div>
                            ) : (
                                constellations.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => loadMessages(c)}
                                        className={cn(
                                            'group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
                                            selectedConstellation?.id === c.id
                                                ? 'bg-amber-500/20'
                                                : 'hover:bg-mono-surface'
                                        )}
                                    >
                                        {editingId === c.id ? (
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onBlur={() => handleRenameConstellation(c.id)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleRenameConstellation(c.id)}
                                                autoFocus
                                                className="flex-1 bg-transparent border-b border-amber-400 text-mono-text text-sm focus:outline-none"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-mono-text truncate">{c.name}</p>
                                                <p className="text-xs text-mono-muted">{c.message_count} messages</p>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingId(c.id);
                                                    setEditName(c.name);
                                                }}
                                                className="p-1 hover:bg-mono-glass-highlight rounded"
                                            >
                                                <Edit2 className="w-3 h-3 text-mono-muted" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteConstellation(c.id, e)}
                                                className="p-1 hover:bg-red-500/20 rounded"
                                            >
                                                <Trash2 className="w-3 h-3 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main Content - Messages */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-mono-glass-border">
                            <h3 className="font-medium text-mono-text">
                                {selectedConstellation?.name || 'Select a constellation'}
                            </h3>
                            <ChromeButton variant="circle" onClick={onClose} className="p-2">
                                <X className="w-4 h-4" />
                            </ChromeButton>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {!selectedConstellation ? (
                                <div className="flex flex-col items-center justify-center h-full text-mono-muted">
                                    <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                                    <p>Select a constellation to view messages</p>
                                </div>
                            ) : loadingMessages ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-6 h-6 animate-spin text-mono-muted" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-mono-muted">
                                    <Star className="w-10 h-10 mb-2 opacity-30" />
                                    <p>No messages in this constellation</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.message_id}
                                            className="group p-3 rounded-lg bg-mono-surface/50 hover:bg-mono-surface transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <Avatar name={msg.sender_username} size="sm" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-medium text-mono-text">
                                                            {msg.sender_display_name || msg.sender_username}
                                                        </span>
                                                        <span className="text-xs text-mono-muted">
                                                            in {msg.room_name || 'DM'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-mono-text/80 break-words">
                                                        {msg.content}
                                                    </p>
                                                    <p className="text-xs text-mono-muted mt-1">
                                                        {new Date(msg.message_created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleGoToMessage(msg)}
                                                        className="p-1.5 hover:bg-mono-glass-highlight rounded text-mono-muted hover:text-mono-text"
                                                        title="Go to message"
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveMessage(msg.message_id)}
                                                        className="p-1.5 hover:bg-red-500/20 rounded text-mono-muted hover:text-red-400"
                                                        title="Remove from constellation"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ConstellationModal;
