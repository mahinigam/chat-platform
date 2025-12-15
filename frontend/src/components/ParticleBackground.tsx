import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface Particle {
    x: number;
    y: number;
    z: number; // For depth/parallax
    size: number;
    baseX: number; // Original position for parallax
    baseY: number;
    vx: number;
    vy: number;
    opacity: number;
    baseOpacity: number;
    pulseSpeed: number;
    life?: number; // For transient particles
    type: 'star' | 'burst';
}

const ParticleBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const location = useLocation();
    const particles = useRef<Particle[]>([]);
    const animationFrameId = useRef<number>();

    // State for effects
    const isAwakening = useRef(false);
    const mouse = useRef({ x: 0, y: 0 });

    // Configuration
    const STAR_COUNT = window.innerWidth < 768 ? 15 : 35; // Very sparse
    const BASE_SPEED = 0.05; // Almost frozen
    const AWAKEN_SPEED_MULTIPLIER = 8;
    const PARALLAX_STRENGTH = 15; // How much mouse moves them

    const initParticles = (width: number, height: number) => {
        particles.current = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            const z = Math.random() * 0.5 + 0.5; // Depth factor 0.5 - 1.0
            particles.current.push({
                x: Math.random() * width,
                y: Math.random() * height,
                z,
                size: (Math.random() * 1.5 + 0.5) * z, // Smaller if further
                baseX: 0, // Set in loop
                baseY: 0,
                vx: (Math.random() - 0.5) * BASE_SPEED,
                vy: (Math.random() - 0.5) * BASE_SPEED,
                baseOpacity: Math.random() * 0.4 + 0.1, // Faint
                opacity: 0, // Start invisible, fade in
                pulseSpeed: Math.random() * 0.005 + 0.002, // Slow pulse
                type: 'star',
            });
            // Set initial base positions
            particles.current[i].baseX = particles.current[i].x;
            particles.current[i].baseY = particles.current[i].y;
        }
    };

    // "Awaken" - The Cosmic Dissolve Trigger
    useEffect(() => {
        isAwakening.current = true;
        const timer = setTimeout(() => {
            isAwakening.current = false;
        }, 800); // Duration of awakening
        return () => clearTimeout(timer);
    }, [location.pathname]);

    useEffect(() => {
        const handleCosmicInput = () => {
            // Ripple effect: add transient particles at bottom center
            const centerX = window.innerWidth / 2;
            const height = window.innerHeight;
            for (let i = 0; i < 5; i++) {
                particles.current.push({
                    x: centerX,
                    y: height - 50,
                    z: 1,
                    size: Math.random() * 2 + 1,
                    baseX: centerX,
                    baseY: height - 50,
                    vx: (Math.random() - 0.5) * 2, // Fast spread
                    vy: (Math.random() * -1) - 1, // Upwards
                    opacity: 0.8,
                    baseOpacity: 0,
                    pulseSpeed: 0,
                    type: 'burst',
                    life: 1.0
                });
            }
        };

        const handleClick = (e: MouseEvent) => {
            // Click burst
            for (let i = 0; i < 3; i++) {
                particles.current.push({
                    x: e.clientX,
                    y: e.clientY,
                    z: 1,
                    size: Math.random() * 2,
                    baseX: e.clientX,
                    baseY: e.clientY,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.5,
                    opacity: 0.8,
                    baseOpacity: 0,
                    pulseSpeed: 0,
                    type: 'burst',
                    life: 1.0
                });
            }
        };

        window.addEventListener('cosmic:input', handleCosmicInput);
        window.addEventListener('click', handleClick);
        return () => {
            window.removeEventListener('cosmic:input', handleCosmicInput);
            window.removeEventListener('click', handleClick);
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle Resolution
        const handleResize = () => {
            const dpr = window.devicePixelRatio || 1;
            // Set actual size in memory (scaled to account for extra pixel density)
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;

            // Normalize coordinate system to use css pixels
            ctx.scale(dpr, dpr);

            // Fix visual size
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;

            initParticles(window.innerWidth, window.innerHeight);
        };

        const handleMouseMove = (e: MouseEvent) => {
            // Normalize mouse -1 to 1
            mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        handleResize();

        let time = 0;
        const animate = () => {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            time += 0.01;

            particles.current.forEach((p) => {
                // 0. Context Awareness (Sidebar vs Chat)
                // Sidebar is typically < 320px logic, simplified here by x position
                const isSidebar = p.x < 320;

                // 1. Movement Logic
                let speedMultiplier = isAwakening.current ? AWAKEN_SPEED_MULTIPLIER : 1;

                // Sidebar: "Calmer, heavier" -> slower base speed, less vertical movement
                if (isSidebar) {
                    p.x += (p.vx * 0.5) * speedMultiplier;
                    p.y += (p.vy * 0.3) * speedMultiplier; // Very little vertical drift
                } else {
                    // Chat: "Freer" -> normal speed
                    p.x += p.vx * speedMultiplier;
                    p.y += p.vy * speedMultiplier;
                }

                // 2. Parallax (Gentle opposite movement based on depth)
                const targetX = p.x + (mouse.current.x * PARALLAX_STRENGTH * p.z);
                const targetY = p.y + (mouse.current.y * PARALLAX_STRENGTH * p.z);

                // 3. Screen Wrap
                if (p.x < -50) p.x = window.innerWidth + 50;
                if (p.x > window.innerWidth + 50) p.x = -50;
                if (p.y < -50) p.y = window.innerHeight + 50;
                if (p.y > window.innerHeight + 50) p.y = -50;

                // 4. Pulse
                if (p.type === 'star') {
                    p.opacity = p.baseOpacity + Math.sin(time * p.pulseSpeed * 100) * 0.05;
                } else if (p.type === 'burst' && p.life !== undefined) {
                    p.life -= 0.03; // Fade out faster
                    p.opacity = p.life;
                    p.x += p.vx;
                    p.y += p.vy;
                }

                if (p.opacity <= 0 && p.type === 'burst') return; // Skip drawing dead particles

                // Draw
                // Use targetX/Y for rendering to enable smooth parallax
                ctx.beginPath();
                ctx.fillStyle = `rgba(220, 230, 255, ${p.opacity})`;
                ctx.shadowBlur = p.size * 2;
                ctx.shadowColor = `rgba(220, 230, 255, ${p.opacity * 0.5})`;

                if (isAwakening.current) {
                    // Draw slight streak when awakening
                    ctx.ellipse(targetX, targetY, p.size * 3, p.size * 0.5, Math.atan2(p.vy, p.vx), 0, Math.PI * 2);
                } else {
                    ctx.arc(targetX, targetY, p.size, 0, Math.PI * 2);
                }
                ctx.fill();
            });

            // Cleanup dead particles
            particles.current = particles.current.filter(p => p.type === 'star' || (p.life !== undefined && p.life > 0));

            animationFrameId.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[-1]"
        />
    );
};

export default ParticleBackground;
