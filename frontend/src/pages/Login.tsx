import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import { cn } from '../utils/theme';
import { useToast } from '../hooks/useToast';

import ToastContainer from '../components/Toast';

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
            // Using username as part of email per original logic: email = username@example.com
            // Or if user typed email, use it. But existing app used username->email logic.
            // Let's support both or just stick to the existing logic for now to minimize friction.
            // The prompt said "register using email, then create a username".
            // But the Login API expects email.
            // Let's assume user enters Email for login based on backend auth.ts router.post('/login', { email, password }).
            const emailToUse = username.includes('@') ? username : `${username}@example.com`;

            const data = await login(emailToUse, password);
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
        <div className="min-h-screen bg-mono-bg text-mono-text flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">Samvaad</h1>
                    <p className="text-mono-muted">Connect with clarity</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={cn(
                            'w-full px-4 py-2 rounded-glass',
                            'bg-mono-surface border border-mono-glass-border',
                            'text-mono-text placeholder-mono-muted',
                            'focus:outline-none focus:ring-2 focus:ring-mono-glass-highlight/50 focus:border-mono-glass-highlight',
                            'transition-all duration-fast ease-glass'
                        )}
                        placeholder="Email or Username"
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={cn(
                            'w-full px-4 py-2 rounded-glass',
                            'bg-mono-surface border border-mono-glass-border',
                            'text-mono-text placeholder-mono-muted',
                            'focus:outline-none focus:ring-2 focus:ring-mono-glass-highlight/50 focus:border-mono-glass-highlight',
                            'transition-all duration-fast ease-glass'
                        )}
                        placeholder="Password"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                            'w-full px-4 py-2 rounded-glass font-medium',
                            'bg-mono-surface hover:bg-mono-surface/80',
                            'border border-mono-glass-border hover:border-mono-glass-highlight',
                            'text-mono-text',
                            'transition-all duration-fast ease-glass',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-mono-text/50',
                            'active:scale-95 hover:translate-y-[-1px]',
                            'min-h-[44px]',
                            'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
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
        </div>
    );
};

export default Login;
