import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, PanInfo, animate } from 'framer-motion';
import { cn } from '../utils/theme';

interface CosmicWheelProps {
    items: { label: string; value: string | number }[];
    value: string | number;
    onChange: (value: string | number) => void;
    label?: string;
    height?: number;
    itemHeight?: number;
    className?: string;
}

const CosmicWheel: React.FC<CosmicWheelProps> = ({
    items,
    value,
    onChange,
    label,
    height = 200,
    itemHeight = 40,
    className
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Virtual scroll position
    const scrollY = useMotionValue(0);
    const springY = useSpring(scrollY, {
        stiffness: 400,
        damping: 40,
        mass: 1
    });

    const maxScroll = (items.length - 1) * -itemHeight;

    // Find index of current value
    useEffect(() => {
        const index = items.findIndex(item => item.value === value);
        if (index !== -1 && !isDragging) {
            scrollY.set(index * -itemHeight);
        }
    }, [value, items, itemHeight, isDragging]);

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsDragging(false);
        const currentY = scrollY.get();
        const velocity = info.velocity.y;

        // Calculate projected stopping point with inertia
        let targetY = currentY + velocity * 0.2;

        // Snap to nearest item
        const snapIndex = Math.round(targetY / -itemHeight);
        const clampedIndex = Math.max(0, Math.min(items.length - 1, snapIndex));

        const finalY = clampedIndex * -itemHeight;

        animate(scrollY, finalY, {
            type: "spring",
            stiffness: 400,
            damping: 40,
            onComplete: () => {
                const selectedItem = items[clampedIndex];
                if (selectedItem && selectedItem.value !== value) {
                    onChange(selectedItem.value);
                }
            }
        });
    };

    return (
        <div className={cn("relative flex flex-col items-center", className)} style={{ height }} >
            {/* Label */}
            {label && (
                <div className="absolute -top-6 text-xs font-medium text-accent-cyan/60 uppercase tracking-widest">
                    {label}
                </div>
            )}

            {/* Selection Highlight (Lens) */}
            <div
                className="absolute w-full border-y border-accent-cyan/30 bg-accent-cyan/5 pointer-events-none z-10"
                style={{
                    height: itemHeight,
                    top: (height - itemHeight) / 2
                }}
            />

            {/* Gradient Masks for 3D Cylinder Effect */}
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-glass-panel to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-glass-panel to-transparent z-20 pointer-events-none" />

            {/* Scrollable Container */}
            <div
                ref={containerRef}
                className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing touch-none"
            >
                <motion.div
                    className="w-full"
                    style={{
                        y: springY,
                        paddingTop: (height - itemHeight) / 2
                    }}
                    drag="y"
                    dragConstraints={{ top: maxScroll, bottom: 0 }}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={handleDragEnd}
                >
                    {items.map((item, index) => {
                        // Create transforms for 3D effect based on distance from center
                        const distanceFromCenter = useTransform(springY, (currentY) => {
                            const itemY = index * -itemHeight;
                            const diff = Math.abs(currentY - itemY);
                            return diff;
                        });

                        const rotateX = useTransform(distanceFromCenter, [0, height / 2], [0, 45]);
                        const opacity = useTransform(distanceFromCenter, [0, height / 2], [1, 0.3]);
                        const scale = useTransform(distanceFromCenter, [0, height / 2], [1, 0.8]);
                        const zIndex = useTransform(distanceFromCenter, (d) => d < itemHeight / 2 ? 10 : 1);

                        // Highlight active item
                        const color = useTransform(distanceFromCenter, (d) =>
                            d < itemHeight / 2 ? 'rgba(0, 240, 255, 1)' : 'rgba(255, 255, 255, 0.4)'
                        );

                        return (
                            <motion.div
                                key={index}
                                style={{
                                    height: itemHeight,
                                    rotateX,
                                    opacity,
                                    scale,
                                    color,
                                    zIndex
                                }}
                                className="flex items-center justify-center text-sm font-medium perspective-500"
                            >
                                {item.label}
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
};

export default CosmicWheel;
