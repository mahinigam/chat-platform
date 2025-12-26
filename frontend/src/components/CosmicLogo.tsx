import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import logoSvg from '../assets/logo.svg';

interface CosmicLogoProps {
    /** Size variant: 'sm' for sidebar, 'md' for headers, 'lg' for login/register */
    size?: 'sm' | 'md' | 'lg';
    /** Optional className for additional styling */
    className?: string;
    /** Enable distortion animation */
    distortion?: boolean;
}

/**
 * CosmicLogo - Displays the Aether logo with optional space distortion effect
 * Uses SVG displacement mapping to create a gravitational lensing illusion
 */
const CosmicLogo: React.FC<CosmicLogoProps> = ({
    size = 'md',
    className = '',
    distortion = true,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Size configurations (maintaining 116:37 aspect ratio)
    const sizeConfig = {
        sm: { height: 24, width: 75 },   // Sidebar
        md: { height: 32, width: 100 },  // General headers
        lg: { height: 48, width: 150 },  // Login/Register pages
    };

    const { height, width } = sizeConfig[size];

    // Unique filter ID to avoid conflicts when multiple logos are rendered
    const filterId = `cosmic-distortion-${size}`;

    return (
        <div
            ref={containerRef}
            className={`relative inline-flex items-center justify-center ${className}`}
            style={{ width, height }}
        >
            {/* SVG Filter Definition for Gravitational Distortion */}
            {distortion && (
                <svg
                    className="absolute w-0 h-0 overflow-hidden"
                    aria-hidden="true"
                >
                    <defs>
                        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                            {/* Turbulence for organic distortion pattern */}
                            <feTurbulence
                                type="fractalNoise"
                                baseFrequency="0.025"
                                numOctaves="3"
                                result="turbulence"
                            >
                                {/* Animate the turbulence for visible movement */}
                                <animate
                                    attributeName="baseFrequency"
                                    values="0.02;0.04;0.02"
                                    dur="6s"
                                    repeatCount="indefinite"
                                />
                            </feTurbulence>
                            {/* Displacement mapping - warps pixels based on turbulence */}
                            <feDisplacementMap
                                in="SourceGraphic"
                                in2="turbulence"
                                scale="8"
                                xChannelSelector="R"
                                yChannelSelector="G"
                            />
                        </filter>
                    </defs>
                </svg>
            )}

            {/* Outer Glow - Event Horizon Effect */}
            <motion.div
                className="absolute inset-0 rounded-full opacity-30"
                style={{
                    background: `radial-gradient(ellipse at center, rgba(240, 240, 240, 0.15) 0%, transparent 70%)`,
                    filter: 'blur(8px)',
                    transform: 'scale(2)',
                }}
                animate={{
                    opacity: [0.2, 0.35, 0.2],
                    scale: [1.8, 2.1, 1.8],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* The Logo Image */}
            <motion.img
                src={logoSvg}
                alt="Aether"
                className="relative z-10"
                style={{
                    width,
                    height,
                    filter: distortion ? `url(#${filterId})` : undefined,
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.2, 0.9, 0.2, 1] }}
            />
        </div>
    );
};

export default CosmicLogo;
