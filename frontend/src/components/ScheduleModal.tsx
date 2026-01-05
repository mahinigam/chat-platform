import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import ChromeButton from './ChromeButton';
import { cn } from '../utils/theme';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (date: Date) => void;
    isLoading?: boolean;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
    isOpen,
    onClose,
    onSchedule,
    isLoading = false
}) => {
    // Get default datetime (5 minutes from now, rounded)
    const getDefaultDateTime = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + 5);
        // Format for datetime-local input: YYYY-MM-DDTHH:MM
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [dateTimeValue, setDateTimeValue] = useState(getDefaultDateTime());

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setDateTimeValue(getDefaultDateTime());
        }
    }, [isOpen]);

    const handleSubmit = () => {
        const selectedDate = new Date(dateTimeValue);
        console.log('[ScheduleModal] Submitting date:', selectedDate.toISOString());
        onSchedule(selectedDate);
    };

    // Get minimum datetime (now)
    const getMinDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={cn(
                            "relative w-full max-w-md overflow-hidden",
                            "bg-glass-panel border border-glass-border/30 rounded-2xl",
                            "shadow-2xl shadow-black/50"
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-accent-cyan" />
                                Schedule Message
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Date/Time Picker */}
                        <div className="p-6 bg-black/20">
                            <div className="flex flex-col gap-4">
                                <label className="text-sm text-white/60 uppercase tracking-wider">
                                    Select Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={dateTimeValue}
                                    onChange={(e) => {
                                        console.log('[ScheduleModal] Input changed to:', e.target.value);
                                        setDateTimeValue(e.target.value);
                                    }}
                                    min={getMinDateTime()}
                                    className={cn(
                                        "w-full px-4 py-3 rounded-xl",
                                        "bg-white/5 border border-white/10",
                                        "text-white text-lg font-medium",
                                        "focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/30",
                                        "transition-all duration-200",
                                        "[color-scheme:dark]"
                                    )}
                                />

                                {/* Preview */}
                                <div className="text-center text-sm text-white/40 mt-2">
                                    Scheduled for{' '}
                                    <span className="text-accent-cyan font-medium">
                                        {new Date(dateTimeValue).toLocaleString([], {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/5 flex gap-3">
                            <ChromeButton
                                type="button"
                                onClick={onClose}
                                className="flex-1 opacity-70 hover:opacity-100 bg-white/5 hover:bg-white/10"
                            >
                                Cancel
                            </ChromeButton>
                            <ChromeButton
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="flex-1 bg-accent-cyan/20 hover:bg-accent-cyan/30 text-accent-cyan border-accent-cyan/50"
                            >
                                {isLoading ? 'Scheduling...' : 'Confirm'}
                            </ChromeButton>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ScheduleModal;
