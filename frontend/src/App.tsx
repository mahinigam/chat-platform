import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.3, ease: [0.2, 0.9, 0.2, 1] }} // smooth glass ease
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

function App() {
    return (
        <Router>
            <AnimatedRoutes />
        </Router>
    );
}

export default App;
