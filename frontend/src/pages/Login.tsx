import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import { useToast } from '../hooks/useToast';

import ToastContainer from '../components/Toast';
import ParticleBackground from '../components/ParticleBackground';
import CosmicLogo from '../components/CosmicLogo';
import ChromeButton from '../components/ChromeButton';

const Login: React.FC = () => {
    // Force rebuild
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
                    <CosmicLogo size="lg" />
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
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-glass pr-12"
                            placeholder="Password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-mono-muted hover:text-mono-text transition-colors p-1"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <ChromeButton
                        type="submit"
                        disabled={isLoading}
                        className="w-full min-h-[44px]"
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </ChromeButton>
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
