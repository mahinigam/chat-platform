import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import { useToast } from '../hooks/useToast';

import ToastContainer from '../components/Toast';
import ParticleBackground from '../components/ParticleBackground';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toasts, dismissToast, error: errorToast, success } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Updated to send raw username/email input, supported by backend now
            const data = await login(username, password);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            success('Login successful!');
            navigate('/');
        } catch (err: any) {
            console.error(err);
            errorToast(err.response?.data?.error || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-mono-text flex items-center justify-center p-4 relative overflow-hidden">
            <div className="w-full max-w-sm relative z-10">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-borel font-normal mb-2 bg-gradient-to-r from-white via-white/80 to-white/50 bg-clip-text text-transparent">Aether</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="input-glass"
                        placeholder="Email or Username"
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-glass"
                        placeholder="Password"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-glass w-full min-h-[44px]"
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link
                        to="/register"
                        className="text-mono-muted hover:text-mono-text text-sm transition-colors"
                    >
                        Need an account?
                    </Link>
                </div>
            </div>
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            <div className="fixed inset-0 pointer-events-none z-0">
                <ParticleBackground />
            </div>
        </div>
    );
};

export default Login;
