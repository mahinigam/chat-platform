import React, { useRef } from 'react';
import { cn } from '../utils/theme';

interface ChromeButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    variant?: 'default' | 'circle';
    'aria-label'?: string;
    title?: string;
    type?: 'button' | 'submit' | 'reset';
}

/**
 * AetherButton (formerly ChromeButton)
 * Design Philosophy: "Cosmic Liquid Glass with Metallic Memory"
 * Behavior: Quiet, heavy, machined. No bounce. No glow.
 * Performance: Optimized (Opacities only, no live blur interpolation).
 */
const ChromeButton: React.FC<ChromeButtonProps> = ({
    children,
    onClick,
    disabled = false,
    className,
    variant = 'default',
    'aria-label': ariaLabel,
    title,
    type = 'button',
}) => {
    const isCircle = variant === 'circle';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            title={title}
            className={cn(
                // Base Layout
                'relative overflow-hidden isolate',
                isCircle ? 'rounded-full aspect-square' : 'rounded-xl',
                isCircle ? 'p-0' : 'px-4 py-2',

                // 1. CORE MATERIAL IDENTITY (Default State)
                // Glass-first, metallic undertone. Quiet.
                'bg-mono-surface/5', // Very faint glass base
                'backdrop-blur-[4px]', // Static gentle blur (Performance: Low cost if static)
                'border border-white/5', // Faint edge memory

                // Text
                'text-mono-text font-medium text-sm',

                // 5. TRANSITION TIMING
                // Slow, smooth, restrained.
                'transition-all duration-300 ease-out',

                // 2. DEFAULT STATE (Continued)
                // No strong shadows. Appears floating.
                'shadow-sm',

                // 3. HOVER (Space Bending)
                // "Space bends slightly around the object"
                // No scale. No bounce.
                'hover:bg-mono-surface/10', // Slight opacity increase
                'hover:border-white/10', // Edge catches slight light
                'hover:shadow-md', // Very subtle depth increase

                // 4. CLICK / ACTIVE (Pressure)
                // "Pressed into glass"
                // No spring. No ripple.
                'active:bg-mono-surface/15', // Darker/Denser
                'active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]', // Inner shadow simulates pressure
                'active:border-white/5', // Border dims slightly
                'active:translate-y-[0px]', // STRICTLY NO MOTION

                // Disabled state
                'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',

                className
            )}
        >
            {/* 
               Subtle Metallic Gradient Overlay (Static) 
               Adds the "machined" feel without being "shiny".
            */}
            <div
                className="absolute inset-0 z-[-1] opacity-5 pointer-events-none"
                style={{
                    background: `linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)`
                }}
            />

            {/* Content Content centered */}
            <span className={cn(
                "relative z-10 flex items-center justify-center gap-2",
                isCircle ? "w-full h-full" : ""
            )}>
                {children}
            </span>
        </button>
    );
};

export default ChromeButton;
