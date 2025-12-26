import React, { useRef, useState, useCallback, useEffect } from 'react';
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
 * ChromeButton - A button with a chrome rim effect that follows the mouse cursor.
 * The prismatic/chromatic edge dynamically rotates based on mouse position.
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
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [gradientAngle, setGradientAngle] = useState(180);

    // Smoothing refs
    const targetAngleRef = useRef(180);
    const currentAngleRef = useRef(180);
    const animationFrameRef = useRef<number>();
    const isHoveringRef = useRef(false);
    const [isHovering, setIsHovering] = useState(false);

    // LERP damping factor - lower is slower/smoother (0.05 - 0.1 is good)
    const SMOOTHING = 0.08;

    const updateAngle = useCallback(() => {
        if (!isHoveringRef.current) return;

        const target = targetAngleRef.current;
        let current = currentAngleRef.current;

        // Calculate shortest path interpolation (handle 0/360 wrap)
        const diff = target - current;
        const delta = ((diff + 540) % 360) - 180;

        // If we're close enough, stop animating to save resources
        if (Math.abs(delta) < 0.5) {
            currentAngleRef.current = target;
            setGradientAngle(target);
            animationFrameRef.current = requestAnimationFrame(updateAngle);
            return;
        }

        // Interpolate
        current += delta * SMOOTHING;

        // Normalize current angle
        current = (current + 360) % 360;

        currentAngleRef.current = current;
        setGradientAngle(current);

        animationFrameRef.current = requestAnimationFrame(updateAngle);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate angle from center to mouse position
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const degrees = (angle * 180) / Math.PI + 90; // +90 to start from top

        // Update target immediately
        targetAngleRef.current = (degrees + 360) % 360;

        // Ensure loop is running if it stopped
        if (!animationFrameRef.current && isHoveringRef.current) {
            updateAngle();
        }
    }, [updateAngle]);

    const handleMouseEnter = () => {
        isHoveringRef.current = true;
        setIsHovering(true);
        updateAngle();
    };

    const handleMouseLeave = () => {
        isHoveringRef.current = false;
        setIsHovering(false);
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
        }
        // Optional: Smoothly return to top or just stop? 
        // Let's just stop to keep position for next enter creates continuity
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    const isCircle = variant === 'circle';

    return (
        <button
            ref={buttonRef}
            type={type}
            onClick={onClick}
            disabled={disabled}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            aria-label={ariaLabel}
            title={title}
            className={cn(
                'relative transition-all duration-200 ease-out',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'active:scale-95',
                isCircle ? 'rounded-full' : 'rounded-xl',
                className
            )}
            style={{
                // CSS custom property for the dynamic angle
                '--chrome-angle': `${gradientAngle}deg`,
            } as React.CSSProperties}
        >
            {/* Shiny White Metallic Rim - High Contrast & Mouse Tracking */}
            <span
                className={cn(
                    'absolute pointer-events-none',
                    isCircle ? 'rounded-full' : 'rounded-xl',
                )}
                style={{
                    inset: '-2px',
                    padding: '1.5px',
                    background: `conic-gradient(from ${gradientAngle}deg,
            #fff 0deg,           /* White Head at Mouse Pos */
            #aaa 15deg,          /* Silver fade */
            #333 30deg,          /* Dark fade */
            #111 60deg,          /* Track start */
            #0a0a0a 180deg,      /* Deep track */
            #111 300deg,         /* Track end */
            #333 330deg,         /* Dark fade incoming */
            #aaa 345deg,         /* Silver fade incoming */
            #fff 360deg          /* White Head wrap */
          )`,
                    // Using a mask to show only the border (rim) area
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    zIndex: 0,
                }}
            />

            {/* Outer Glow/Shadow for depth */}
            <span
                className={cn(
                    'absolute inset-0 rounded-full opacity-50',
                    isHovering ? 'opacity-60' : 'opacity-20'
                )}
                style={{
                    boxShadow: `
                0 0 12px rgba(255, 255, 255, 0.1), 
                inset 0 0 12px rgba(0,0,0,0.8)
            `,
                    zIndex: 1
                }}
            />

            {/* Button face */}
            <span
                className={cn(
                    'relative flex items-center justify-center text-mono-text font-medium z-10',
                    isCircle ? 'rounded-full aspect-square' : 'rounded-xl',
                    isCircle ? 'w-full h-full' : 'px-4 py-2'
                )}
                style={{
                    background: 'linear-gradient(145deg, #1e1e20, #0d0d0f)',
                    boxShadow: `
            inset 0 1px 1px rgba(255, 255, 255, 0.15),
            inset 0 -2px 5px rgba(0, 0, 0, 0.5)
          `,
                }}
            >
                {children}
            </span>
        </button>
    );
};

export default ChromeButton;
