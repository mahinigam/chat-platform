import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AetherIntroProps {
    onComplete: () => void;
}

// Timing constants (in ms) - Total: 7 seconds
const STAGE_1_DURATION = 2000;   // Void: 0 - 2s
const STAGE_2_DURATION = 2300;  // Corruption: 2s - 4.3s
const STAGE_3_DURATION = 700;   // Revelation: 4.3s - 5s  
const STAGE_4_DURATION = 2000;  // Gravity: 5s - 7s
const TOTAL_DURATION = STAGE_1_DURATION + STAGE_2_DURATION + STAGE_3_DURATION + STAGE_4_DURATION;

type Stage = 'void' | 'corruption' | 'revelation' | 'gravity' | 'complete';

// Logo size to match login page (lg size = 150px width)
const LOGO_WIDTH = 150;
const LOGO_HEIGHT = 48;

// Particle component for the corruption effect
const GlitchParticle: React.FC<{ index: number }> = ({ index }) => {
    const angle = (index / 20) * Math.PI * 2;
    const radius = 120 + Math.random() * 80;
    const size = 2 + Math.random() * 3;
    const duration = 0.8 + Math.random() * 0.6;
    const delay = Math.random() * 0.3;

    return (
        <motion.div
            className="absolute rounded-full"
            style={{
                width: size,
                height: size,
                background: index % 3 === 0 ? '#ff0040' : index % 3 === 1 ? '#00ff88' : '#4080ff',
                boxShadow: `0 0 ${size * 2}px currentColor`,
                left: '50%',
                top: '50%',
            }}
            initial={{
                x: 0,
                y: 0,
                opacity: 0,
                scale: 0
            }}
            animate={{
                x: [0, Math.cos(angle) * radius * 0.5, Math.cos(angle) * radius],
                y: [0, Math.sin(angle) * radius * 0.5, Math.sin(angle) * radius],
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0]
            }}
            transition={{
                duration,
                delay,
                ease: 'easeOut',
                repeat: Infinity,
                repeatDelay: 0.2
            }}
        />
    );
};

const AetherIntro: React.FC<AetherIntroProps> = ({ onComplete }) => {
    const [stage, setStage] = useState<Stage>('void');
    const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });
    const [rgbSplit, setRgbSplit] = useState(0);
    const glitchIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Generate random glitch offsets during corruption stage
    const startGlitchEffect = useCallback(() => {
        glitchIntervalRef.current = setInterval(() => {
            setGlitchOffset({
                x: (Math.random() - 0.5) * 20,
                y: (Math.random() - 0.5) * 8
            });
            setRgbSplit(3 + Math.random() * 6);
        }, 50);
    }, []);

    const stopGlitchEffect = useCallback(() => {
        if (glitchIntervalRef.current) {
            clearInterval(glitchIntervalRef.current);
            glitchIntervalRef.current = null;
        }
        setGlitchOffset({ x: 0, y: 0 });
        setRgbSplit(0);
    }, []);

    // Stage progression
    useEffect(() => {
        const timers: NodeJS.Timeout[] = [];

        // Stage 1 → Stage 2 (Void → Corruption)
        timers.push(setTimeout(() => {
            setStage('corruption');
            startGlitchEffect();
        }, STAGE_1_DURATION));

        // Stage 2 → Stage 3 (Corruption → Revelation)
        timers.push(setTimeout(() => {
            stopGlitchEffect();
            setStage('revelation');
        }, STAGE_1_DURATION + STAGE_2_DURATION));

        // Stage 3 → Stage 4 (Revelation → Gravity)
        timers.push(setTimeout(() => {
            setStage('gravity');
        }, STAGE_1_DURATION + STAGE_2_DURATION + STAGE_3_DURATION));

        // Complete
        timers.push(setTimeout(() => {
            setStage('complete');
            onComplete();
        }, TOTAL_DURATION));

        return () => {
            timers.forEach(clearTimeout);
            stopGlitchEffect();
        };
    }, [onComplete, startGlitchEffect, stopGlitchEffect]);

    // Logo variants for different stages
    const logoVariants = {
        void: {
            opacity: 0,
            scale: 0.9,
            filter: 'brightness(10) blur(0px)'
        },
        voidVisible: {
            opacity: 1,
            scale: 1,
            filter: 'brightness(10) blur(0px)' // Pure white
        },
        corruption: {
            opacity: 1,
            scale: 1,
            filter: 'brightness(10) blur(0px)'
        },
        revelation: {
            opacity: 1,
            scale: 1,
            filter: 'brightness(1) blur(0px)' // Natural colors
        },
        gravity: {
            opacity: 1,
            scale: 1,
            filter: 'brightness(1) blur(0px)'
        }
    };

    // Container variants for gravity effect
    const containerVariants = {
        initial: {
            y: 0,
            scale: 1,
            opacity: 1
        },
        gravity: {
            y: '-100vh',
            scale: 2.5,
            opacity: 0,
            transition: {
                duration: STAGE_4_DURATION / 1000,
                ease: [0.55, 0.055, 0.675, 0.19] as const // Ease-in for acceleration feel
            }
        }
    };

    if (stage === 'complete') return null;

    return (
        <motion.div
            ref={containerRef}
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: '#000000' }}
            variants={containerVariants}
            initial="initial"
            animate={stage === 'gravity' ? 'gravity' : 'initial'}
        >
            {/* Scanline overlay for extra grit */}
            <div
                className="absolute inset-0 pointer-events-none opacity-5"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
                }}
            />

            {/* Screen shake wrapper */}
            <motion.div
                className="relative"
                animate={{
                    x: stage === 'corruption' ? glitchOffset.x : 0,
                    y: stage === 'corruption' ? glitchOffset.y : 0,
                }}
                transition={{ duration: 0.05 }}
            >
                {/* Particles during corruption */}
                <AnimatePresence>
                    {stage === 'corruption' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {Array.from({ length: 30 }).map((_, i) => (
                                <GlitchParticle key={i} index={i} />
                            ))}
                        </div>
                    )}
                </AnimatePresence>

                {/* RGB Split Red Channel */}
                {stage === 'corruption' && (
                    <motion.img
                        src="/src/assets/logo.svg"
                        alt=""
                        className="absolute"
                        style={{
                            width: LOGO_WIDTH,
                            height: LOGO_HEIGHT,
                            filter: 'brightness(10) hue-rotate(-60deg) saturate(5)',
                            mixBlendMode: 'screen',
                            transform: `translateX(${-rgbSplit}px)`,
                            opacity: 0.7
                        }}
                    />
                )}

                {/* RGB Split Blue Channel */}
                {stage === 'corruption' && (
                    <motion.img
                        src="/src/assets/logo.svg"
                        alt=""
                        className="absolute"
                        style={{
                            width: LOGO_WIDTH,
                            height: LOGO_HEIGHT,
                            filter: 'brightness(10) hue-rotate(180deg) saturate(5)',
                            mixBlendMode: 'screen',
                            transform: `translateX(${rgbSplit}px)`,
                            opacity: 0.7
                        }}
                    />
                )}

                {/* Main Logo */}
                <motion.img
                    src="/src/assets/logo.svg"
                    alt="Aether"
                    className="relative"
                    style={{
                        width: LOGO_WIDTH,
                        height: LOGO_HEIGHT,
                    }}
                    variants={logoVariants}
                    initial="void"
                    animate={
                        stage === 'void' ? 'voidVisible' :
                            stage === 'corruption' ? 'corruption' :
                                stage === 'revelation' ? 'revelation' :
                                    'gravity'
                    }
                    transition={{
                        duration: stage === 'void' ? 1.0 :
                            stage === 'revelation' ? 0.5 : 0.1,
                        ease: stage === 'revelation' ? [0.34, 1.56, 0.64, 1] : 'easeOut'
                    }}
                />

                {/* Glitch slices during corruption */}
                {stage === 'corruption' && (
                    <>
                        <motion.div
                            className="absolute inset-0 overflow-hidden"
                            style={{
                                clipPath: 'polygon(0 30%, 100% 30%, 100% 35%, 0 35%)',
                            }}
                            animate={{
                                x: [0, 15, -10, 5, 0],
                            }}
                            transition={{
                                duration: 0.15,
                                repeat: Infinity,
                                repeatType: 'mirror'
                            }}
                        >
                            <img
                                src="/src/assets/logo.svg"
                                alt=""
                                style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT, filter: 'brightness(10)' }}
                            />
                        </motion.div>
                        <motion.div
                            className="absolute inset-0 overflow-hidden"
                            style={{
                                clipPath: 'polygon(0 60%, 100% 60%, 100% 68%, 0 68%)',
                            }}
                            animate={{
                                x: [0, -12, 8, -3, 0],
                            }}
                            transition={{
                                duration: 0.12,
                                repeat: Infinity,
                                repeatType: 'mirror',
                                delay: 0.05
                            }}
                        >
                            <img
                                src="/src/assets/logo.svg"
                                alt=""
                                style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT, filter: 'brightness(10)' }}
                            />
                        </motion.div>
                    </>
                )}
            </motion.div>

            {/* Flash on revelation */}
            <AnimatePresence>
                {stage === 'revelation' && (
                    <motion.div
                        className="absolute inset-0 bg-white pointer-events-none"
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AetherIntro;
