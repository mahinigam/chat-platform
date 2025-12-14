import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import { cn } from '../utils/theme';
import { useToast } from '../hooks/useToast';

import ToastContainer from '../components/Toast';

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toasts, dismissToast, error: errorToast, success } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await register(username, email, password);
            // Auto login after register
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            success('Account created successfully!');
            navigate('/');
        } catch (err: any) {
            console.error(err);
            errorToast(err.response?.data?.error || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mono-bg text-mono-text flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">Samvaad</h1>
                    <p className="text-mono-muted">Create your account</p>
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
                        placeholder="Username"
                        required
                    />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={cn(
                            'w-full px-4 py-2 rounded-glass',
                            'bg-mono-surface border border-mono-glass-border',
                            'text-mono-text placeholder-mono-muted',
                            'focus:outline-none focus:ring-2 focus:ring-mono-glass-highlight/50 focus:border-mono-glass-highlight',
                            'transition-all duration-fast ease-glass'
                        )}
                        placeholder="Email"
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
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link
                        to="/login"
                        className="text-mono-muted hover:text-mono-text text-sm transition-colors"
                    >
                        Already have an account?
                    </Link>
                </div>
            </div>
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
    );
};

export default Register;
