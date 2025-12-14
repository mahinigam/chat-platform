import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CosmicIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [stage, setStage] = useState(0);

    useEffect(() => {
        // 1. Black Screen (Start)
        const t1 = setTimeout(() => setStage(1), 500);
        // 2. Galaxy Appears
        const t2 = setTimeout(() => setStage(2), 2000); // Hold for 1.5s
        // 3. Zoom/Fade out
        const t3 = setTimeout(() => {
            onComplete();
        }, 2800);

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
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
                {/* Galaxy Sphere */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                        opacity: stage === 1 ? 1 : 0,
                        scale: stage === 1 ? 1 : 1.5, // Zoom in
                    }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="w-32 h-32 rounded-full relative"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(220, 230, 255, 0.8) 0%, rgba(220, 230, 255, 0.1) 40%, transparent 70%)',
                        boxShadow: '0 0 40px rgba(220, 230, 255, 0.2)'
                    }}
                >
                    {/* Core */}
                    <div className="absolute inset-0 rounded-full bg-white blur-xl opacity-20 animate-pulse" />
                </motion.div>

                {/* Text */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: stage === 1 ? 1 : 0, y: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="absolute bottom-1/3 text-white/50 text-sm tracking-[0.3em] font-light"
                >
                    ENTERING THE VOID
                </motion.p>
            </motion.div>
        </AnimatePresence>
    );
};

export default CosmicIntro;
