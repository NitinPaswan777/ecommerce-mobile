'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '@/lib/api';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            router.push('/');
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await loginAdmin({ email, password });
            localStorage.setItem('admin_token', data.token);
            localStorage.setItem('admin_user', JSON.stringify(data.user));
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <style jsx>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: radial-gradient(circle at top right, #1a1a2e, #16213e, #0f3460);
                    font-family: inherit;
                }
                .login-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 2.5rem;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 400px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .login-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .logo-icon {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1rem;
                    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
                }
                .login-title {
                    color: white;
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.025em;
                }
                .login-subtitle {
                    color: #94a3b8;
                    font-size: 0.875rem;
                }
                .form-group {
                    margin-bottom: 1.25rem;
                }
                .label {
                    display: block;
                    color: #cbd5e1;
                    font-size: 0.875rem;
                    margin-bottom: 0.5rem;
                }
                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .input-icon {
                    position: absolute;
                    left: 12px;
                    color: #64748b;
                }
                .input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    padding: 0.75rem 1rem 0.75rem 2.5rem;
                    color: white;
                    font-size: 0.875rem;
                    outline: none;
                    transition: all 0.2s;
                }
                .input:focus {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }
                .submit-btn {
                    width: 100%;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    padding: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }
                .submit-btn:hover:not(:disabled) {
                    background: #2563eb;
                    transform: translateY(-1px);
                }
                .submit-btn:active:not(:disabled) {
                    transform: translateY(0);
                }
                .submit-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .error-alert {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #f87171;
                    padding: 0.75rem;
                    border-radius: 10px;
                    font-size: 0.8125rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1.5rem;
                }
                .footer-text {
                    text-align: center;
                    margin-top: 2rem;
                    color: #64748b;
                    font-size: 0.75rem;
                }
            `}</style>

            <div className="login-card">
                <div className="login-header">
                    <div className="logo-icon">
                        <Lock size={24} color="white" />
                    </div>
                    <h1 className="login-title">Admin Access</h1>
                    <p className="login-subtitle">Please enter your credentials to continue</p>
                </div>

                {error && (
                    <div className="error-alert">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="label">Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                className="input"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <p className="footer-text">
                    &copy; 2026 instalook Administrative Portal. <br/>
                    All rights reserved.
                </p>
            </div>
        </div>
    );
}
