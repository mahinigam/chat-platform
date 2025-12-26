import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import introVideo from '../assets/videos/intro.mp4';

interface CosmicIntroProps {
    onComplete: () => void;
}

const CosmicIntro: React.FC<CosmicIntroProps> = ({ onComplete }) => {
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        // At 4 seconds, start the fade + zoom
        const fadeTimer = setTimeout(() => {
            setIsFading(true);
        }, 4000);

        // At 6 seconds (video end), complete and unmount
        const completeTimer = setTimeout(() => {
            onComplete();
        }, 6000);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden pointer-events-none"
            initial={{ opacity: 1, scale: 1 }}
            animate={{
                opacity: isFading ? 0 : 1,
                scale: isFading ? 1.15 : 1, // Subtle zoom in as it fades
            }}
            transition={{
                duration: 2, // 2 seconds to fade from 4s to 6s
                ease: [0.4, 0, 0.2, 1] // Smooth easing
            }}
        >
            <video
                src={introVideo}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
            />
        </motion.div>
    );
};

export default CosmicIntro;
