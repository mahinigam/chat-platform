import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import ChromeButton from './ChromeButton';
import { cn } from '../utils/theme';
import CosmicWheel from './CosmicWheel';

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
    // Initialize with current time rounded to next 5 minutes
    const getInitialDate = () => {
        const d = new Date();
        const coeff = 1000 * 60 * 5;
        return new Date(Math.ceil(d.getTime() / coeff) * coeff);
    };

    const [selectedDate, setSelectedDate] = useState(getInitialDate());

    // Memoized data generation helpers
    const years = React.useMemo(() => Array.from({ length: 5 }, (_, i) => {
        const y = new Date().getFullYear() + i;
        return { label: y.toString(), value: y };
    }), []);

    const months = React.useMemo(() => [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ].map((m, i) => ({ label: m, value: i })), []);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const days = React.useMemo(() => {
        const count = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());
        return Array.from({ length: count }, (_, i) => ({
            label: (i + 1).toString().padStart(2, '0'),
            value: i + 1
        }));
    }, [selectedDate.getFullYear(), selectedDate.getMonth()]);

    const hours = React.useMemo(() => Array.from({ length: 24 }, (_, i) => ({
        label: i.toString().padStart(2, '0'),
        value: i
    })), []);

    const minutes = React.useMemo(() => Array.from({ length: 12 }, (_, i) => ({
        label: (i * 5).toString().padStart(2, '0'),
        value: i * 5
    })), []);

    // Update handlers
    const updateDate = (field: 'year' | 'month' | 'date' | 'hours' | 'minutes', value: number) => {
        const newDate = new Date(selectedDate);

        if (field === 'year') newDate.setFullYear(value);
        if (field === 'month') newDate.setMonth(value);
        if (field === 'date') newDate.setDate(value);
        if (field === 'hours') newDate.setHours(value);
        if (field === 'minutes') newDate.setMinutes(value);

        setSelectedDate(newDate);
    };

    // Ensure date is valid when month changes (e.g., sticking to 31st when moving to Feb)
    useEffect(() => {
        const daysInMonth = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());
        if (selectedDate.getDate() > daysInMonth) {
            updateDate('date', daysInMonth);
        }
    }, [selectedDate.getMonth(), selectedDate.getFullYear()]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSchedule(selectedDate);
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

                        {/* Cosmic Wheels Container */}
                        <div className="p-6 bg-black/20">
                            <div className="flex justify-center gap-2 h-48 relative">
                                {/* Date Section */}
                                <div className="flex gap-1">
                                    <CosmicWheel
                                        items={months}
                                        value={selectedDate.getMonth()}
                                        onChange={(v) => updateDate('month', Number(v))}
                                        label="MON"
                                        className="w-16"
                                    />
                                    <CosmicWheel
                                        items={days}
                                        value={selectedDate.getDate()}
                                        onChange={(v) => updateDate('date', Number(v))}
                                        label="DAY"
                                        className="w-16"
                                    />
                                    <CosmicWheel
                                        items={years}
                                        value={selectedDate.getFullYear()}
                                        onChange={(v) => updateDate('year', Number(v))}
                                        label="YEAR"
                                        className="w-20"
                                    />
                                </div>

                                {/* Divider */}
                                <div className="w-px bg-white/10 mx-2 self-center h-24" />

                                {/* Time Section */}
                                <div className="flex gap-1">
                                    <CosmicWheel
                                        items={hours}
                                        value={selectedDate.getHours()}
                                        onChange={(v) => updateDate('hours', Number(v))}
                                        label="HR"
                                        className="w-16"
                                    />
                                    <CosmicWheel
                                        items={minutes}
                                        value={selectedDate.getMinutes() - (selectedDate.getMinutes() % 5)}
                                        onChange={(v) => updateDate('minutes', Number(v))}
                                        label="MIN"
                                        className="w-16"
                                    />
                                </div>
                            </div>

                            {/* Info Text */}
                            <div className="text-center mt-6 text-sm text-white/40">
                                Scheduled for <span className="text-accent-cyan">{selectedDate.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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
                                onClick={(e?: any) => {
                                    if (e && e.preventDefault) e.preventDefault();
                                    handleSubmit(e || { preventDefault: () => { } });
                                }}
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

