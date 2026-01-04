import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.99 }} // Removed filter: blur(10px) to prevent GPU layer promotion
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.99 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full"
    >
        {children}
    </motion.div>
);

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
                {/* 
                  Home usually has its own layout which shouldn't re-render fully on internal child routes,
                  but here Home is a single page. If Home has internal sub-routes, this might be abrupt.
                  Assuming Home is the main chat view.
                */}
                <Route
                    path="/"
                    element={
                        <PageWrapper>
                            {/* We check auth inside Home or separate guard, but duplicating logic here for now */}
                            {!!localStorage.getItem('token') ? <Home /> : <Navigate to="/login" />}
                        </PageWrapper>
                    }
                />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </AnimatePresence>
    );
}

import ParticleBackground from './components/ParticleBackground';
import CosmicIntro from './components/CosmicIntro';
import { useState, useEffect } from 'react';

function App() {
    const [showIntro, setShowIntro] = useState(false);

    useEffect(() => {
        const hasSeenIntro = sessionStorage.getItem('hasSeenCosmicIntro');
        if (!hasSeenIntro) {
            setShowIntro(true);
        }
    }, []);

    const handleIntroComplete = () => {
        setShowIntro(false);
        sessionStorage.setItem('hasSeenCosmicIntro', 'true');
    };

    return (
        <Router>
            {/* Static Background - Zero GPU Cost */}
            <div className="fixed inset-0 bg-gradient-to-br from-black via-[#0a0a0c] to-[#050508] z-[-1]" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent z-[-1]" />

            {/* <div className="cosmic-noise" /> */}
            {/* <ParticleBackground /> */}

            {/* Main App - Always rendered, visible underneath intro */}
            <AnimatedRoutes />

            {/* Intro Overlay - Fades out to reveal app */}
            {showIntro && <CosmicIntro onComplete={handleIntroComplete} />}
        </Router>
    );
}

export default App;
