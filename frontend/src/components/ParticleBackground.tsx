import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    baseOpacity: number;
    opacity: number;
    pulseSpeed: number;
}

const ParticleBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const location = useLocation();
    const particles = useRef<Particle[]>([]);
    const animationFrameId = useRef<number>();
    const isWarping = useRef(false);

    // Mouse interaction
    const mouse = useRef({ x: 0, y: 0 });
    const mouseActive = useRef(false);

    // Configuration
    const STAR_COUNT = window.innerWidth < 768 ? 60 : 120; // Reduced for mobile
    const BASE_SPEED = 0.2;
    const WARP_SPEED = 8;
    const WARP_DURATION = 600; // ms

    // Initialize Particles (Universe Creation)
    const initParticles = (width: number, height: number) => {
        particles.current = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            particles.current.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2 + 0.5, // 0.5px to 2.5px
                speedX: (Math.random() - 0.5) * BASE_SPEED,
                speedY: (Math.random() - 0.5) * BASE_SPEED,
                baseOpacity: Math.random() * 0.5 + 0.1, // 0.1 to 0.6
                opacity: Math.random() * 0.5 + 0.1,
                pulseSpeed: Math.random() * 0.02 + 0.005,
            });
        }
    };

    // Warp Drive Effect on Route Change
    useEffect(() => {
        isWarping.current = true;
        const timer = setTimeout(() => {
            isWarping.current = false;
        }, WARP_DURATION);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles(canvas.width, canvas.height);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.current = { x: e.clientX, y: e.clientY };
            mouseActive.current = true;
        };

        const handleMouseLeave = () => {
            mouseActive.current = false;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseLeave);

        // Initial setup
        handleResize();

        // Animation Loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Deep Space Gradient (optional, can be done in CSS for perf)
            // We rely on CSS background-color: #000000 for the void.

            particles.current.forEach((p) => {
                // Physics
                let currentSpeedX = p.speedX;
                let currentSpeedY = p.speedY;

                // Warp Logic
                if (isWarping.current) {
                    // Stars stretch towards user (simulate by expanding outward from center)
                    const centerX = canvas.width / 2;
                    const centerY = canvas.height / 2;
                    const dx = p.x - centerX;
                    const dy = p.y - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Move away from center
                    currentSpeedX += (dx / dist) * WARP_SPEED * 0.5;
                    currentSpeedY += (dy / dist) * WARP_SPEED * 0.5;

                    // Elongate stars during warp (visual effect handled in draw)
                }

                // Mouse Repulsion (Liquid feel)
                if (mouseActive.current && !isWarping.current) {
                    const dx = p.x - mouse.current.x;
                    const dy = p.y - mouse.current.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const force = 100; // Radius of influence

                    if (dist < force) {
                        const angle = Math.atan2(dy, dx);
                        const push = (force - dist) * 0.02; // Gentle push
                        currentSpeedX += Math.cos(angle) * push;
                        currentSpeedY += Math.sin(angle) * push;
                    }
                }

                p.x += currentSpeedX;
                p.y += currentSpeedY;

                // Twinkle
                p.opacity += Math.sin(Date.now() * p.pulseSpeed) * 0.01;
                // Clamp opacity
                if (p.opacity < 0.1) p.opacity = 0.1;
                if (p.opacity > p.baseOpacity + 0.2) p.opacity = p.baseOpacity + 0.2;

                // Wrap around screen
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Draw Star
                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;

                if (isWarping.current) {
                    // Draw streaks
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x - currentSpeedX * 2, p.y - currentSpeedY * 2);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity})`;
                    ctx.stroke();
                } else {
                    // Draw soft dots
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            animationFrameId.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseLeave);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, []); // Re-run if Warp logic needs to be bound, but refs handle it.

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[-1]"
            style={{ background: 'transparent' }} // Let CSS handle base color
        />
    );
};

export default ParticleBackground;
