import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CosmicIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [stage, setStage] = useState(0);

    useEffect(() => {
        // 1. Black Screen (Start)
        const t1 = setTimeout(() => setStage(1), 200);
        // 2. Galaxy Appears & Text
        const t2 = setTimeout(() => setStage(2), 1200); // Shorter hold
        // 3. Complete
        const t3 = setTimeout(() => {
            onComplete();
        }, 1600); // ~1.5s total duration

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[99999] bg-black flex items-center justify-center pointer-events-none"
                initial={{ opacity: 1 }}
                animate={{ opacity: stage >= 2 ? 0 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            >
                {/* Galaxy Sphere */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                        opacity: stage === 1 ? 1 : 0,
                        scale: stage === 1 ? 1 : 1.2, // Gentle zoom inward (0.8 -> 1.2)
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="w-40 h-40 rounded-full relative"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.1) 40%, transparent 70%)',
                        boxShadow: '0 0 50px rgba(255, 255, 255, 0.15)'
                    }}
                >
                    {/* Core */}
                    <div className="absolute inset-0 rounded-full bg-white blur-xl opacity-30 animate-pulse" />
                </motion.div>

                {/* Text */}
                <motion.p
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: stage === 1 ? 1 : 0, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="absolute bottom-1/3 text-white/40 text-xs tracking-[0.4em] font-light uppercase"
                >
                    Entering the Void
                </motion.p>
            </motion.div>
        </AnimatePresence>
    );
};

export default CosmicIntro;
