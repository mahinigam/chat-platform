import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
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
                        className="input-glass"
                        placeholder="Username"
                        required
                    />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-glass"
                        placeholder="Email"
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
