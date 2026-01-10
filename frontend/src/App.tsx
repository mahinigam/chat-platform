import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageListSkeleton } from './components/Skeleton';

// Lazy load pages (code splitting)
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Home = React.lazy(() => import('./pages/Home'));
const AetherIntro = React.lazy(() => import('./components/AetherIntro'));

// Page loading fallback - uses skeleton for better perceived performance
const PageLoader = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-mono-bg">
        <MessageListSkeleton />
    </div>
);

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
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
                <Route
                    path="/"
                    element={
                        <PageWrapper>
                            {!!localStorage.getItem('token') ? <Home /> : <Navigate to="/login" />}
                        </PageWrapper>
                    }
                />
                <Route path="/call/:roomId" element={<CallRedirect />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </AnimatePresence>
    );
}

const CallRedirect = () => {
    const { roomId } = useParams();
    // Redirect to home with joinRoom param, preserving existing auth logic
    return <Navigate to={`/?joinRoom=${roomId}`} replace />;
};

function App() {
    const [showIntro, setShowIntro] = useState(false);

    useEffect(() => {
        const hasSeenIntro = sessionStorage.getItem('hasSeenAetherIntro');
        if (!hasSeenIntro) {
            setShowIntro(true);
        }
    }, []);

    const handleIntroComplete = () => {
        setShowIntro(false);
        sessionStorage.setItem('hasSeenAetherIntro', 'true');
    };

    return (
        <Router>
            {/* Static Background - Zero GPU Cost */}
            <div className="fixed inset-0 bg-gradient-to-br from-black via-[#0a0a0c] to-[#050508] z-[-1]" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900/10 via-transparent to-transparent z-[-1]" />

            {/* Main App - Wrapped in Suspense for lazy-loaded pages */}
            <Suspense fallback={<PageLoader />}>
                <AnimatedRoutes />
            </Suspense>

            {/* Intro Overlay - Lazy loaded, only shown once per session */}
            {showIntro && (
                <Suspense fallback={null}>
                    <AetherIntro onComplete={handleIntroComplete} />
                </Suspense>
            )}
        </Router>
    );
}

export default App;
