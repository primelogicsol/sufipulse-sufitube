"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/layout/Layout';
import { Lock, Eye, EyeOff, Loader, ChevronDown, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as api from "../../api/auth";
import { ENV } from '../../config/env';

import Link from 'next/link';

const DEMO_ACCOUNTS = [
    { label: 'Admin', email: 'fk.envcal@gmail.com', password: 'fayaz123', color: '#ef4444' },
    { label: 'Ahl-e-Qalam (Writer)', email: 'writer@sufipulse.local', password: 'demo123', color: '#10b981' },
    { label: 'Ahl-e-Sada (Vocalist)', email: 'vocalist@sufipulse.local', password: 'demo123', color: '#60a5fa' },
    { label: 'Ahl-e-Naghma (Producer)', email: 'producer@sufipulse.local', password: 'demo123', color: '#a78bfa' },
    { label: 'Ahl-e-Tahreer (Literary)', email: 'literary@sufipulse.local', password: 'demo123', color: '#f59e0b' },
];

const Login = () => {
    const [form, setForm] = useState({ email: "", password: "" });
    const [demoOpen, setDemoOpen] = useState(false);
    const BASE_URL = ENV.API_URL
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, user } = useAuth();
    const router = useRouter()
    // const navigate = useNavigate();
    // Role - aware redirect after successful login
    useEffect(() => {
        if (user) {
            if (user.role === 'admin') {
                router.push('/admin');
            } else if (user.role === 'writer') {
                router.push('/user/writer/dashboard');
            } else if (user.role === 'vocalist') {
                router.push('/user/vocalist/dashboard');
            } else if (user.role === 'producer') {
                router.push('/user/producer/dashboard');
            } else if (user.role === 'literary') {
                router.push('/user/literary-contributor/dashboard');
            } else if (user.role === 'studio') {
                router.push('/user/studio-engineer/dashboard');
            }
            // role === 'user' or unknown: stay on login so user can re-authenticate
        }
    }, [user]);
    const handleChange = (e: any) => {
        const { name, value } = e.target
        setForm(prev => ({
            ...prev,
            [name]: value
        }))
        console.log(form)
    }
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(form.email, form.password);
        } catch (err: any) {
            setError(err?.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    const handleGoogleLogin = async (e: any) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.googleLogin();
            alert("Login Successfull!");
        } catch (err: any) {
            alert(err.response?.data?.error || err.message);
        }
        finally {
            setLoading(false)
        }
    };
    return (
        <Layout>
            <div className="min-h-screen bg-linear-to-b from-[#1a2332] via-[#0f1419] to-[#0a0e13] flex items-center justify-center py-16 px-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-[#D4AF37] to-[#aa8829] mb-4">
                            <Lock className="text-[#1a2332]" size={32} />
                        </div>
                        <h1 className="text-4xl font-serif text-[#D4AF37] mb-2">Sign In</h1>
                        <p className="text-gray-400">Access your SufiPulse account</p>
                    </div>

                    <div className="bg-[#1a2332]/50 backdrop-blur-sm border border-[#2a3442] rounded-lg p-8 shadow-2xl">
                        {error && (
                            <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-md">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Demo Accounts Quick Fill */}
                        <div className="mb-6">
                            <button
                                type="button"
                                onClick={() => setDemoOpen(o => !o)}
                                className="cursor-pointer w-full flex items-center justify-between px-4 py-2.5 bg-amber-400/10 border border-amber-400/30 rounded-lg text-amber-400 text-sm font-medium hover:bg-amber-400/15 transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    Demo Accounts — Quick Fill
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${demoOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {demoOpen && (
                                <div className="mt-2 space-y-1.5 p-3 bg-[#0f1419]/80 border border-[#2a3442] rounded-lg">
                                    {DEMO_ACCOUNTS.map(acc => (
                                        <button
                                            key={acc.email}
                                            type="button"
                                            onClick={() => { setForm({ email: acc.email, password: acc.password }); setDemoOpen(false); }}
                                            className="cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/5 transition-colors text-left"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: acc.color }}>{acc.label}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{acc.email}</p>
                                            </div>
                                            <span className="text-xs text-gray-600 font-mono">{acc.password}</span>
                                        </button>
                                    ))}
                                    <div className="pt-2 border-t border-[#2a3442]">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm('Clear all local app data and start fresh?')) {
                                                    localStorage.clear();
                                                    window.location.reload();
                                                }
                                            }}
                                            className="cursor-pointer w-full text-center text-xs text-red-400/70 hover:text-red-400 py-1.5 transition-colors"
                                        >
                                            Reset App Data (fix stuck login)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form className="space-y-6" onSubmit={handleLogin}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-[#1a2332] border-2 border-[#3a4556] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all"
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        name="password"
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 pr-12 bg-[#1a2332] border-2 border-[#3a4556] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors focus:outline-none"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-[#2a3442] text-center">
                                <p className="text-sm text-gray-400">
                                    Forgot Password?{' '}
                                    <Link href="/forgot-password" className="text-[#D4AF37] hover:text-[#e5c158] font-medium transition-colors">
                                        Reset Password
                                    </Link>
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full cursor-pointer flex items-center justify-center bg-linear-to-r from-[#D4AF37] to-[#aa8829] text-[#1a2332] py-3 rounded-md font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Login'}
                            </button>
                            <button
                                type="button"
                                className="cursor-pointer w-full border flex items-center justify-center bg-linear-to-r border-[#D4AF37] text-[#D4AF37]! py-3 rounded-md font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                onClick={handleGoogleLogin}
                            >
                                Continue with google
                            </button>
                        </form>
                        <div className="mt-4 pt-4 border-t border-[#2a3442] text-center">
                            <p className="text-sm text-gray-400">
                                Don't have an account?{' '}
                                <Link href="/register" className="text-[#D4AF37] hover:text-[#e5c158] font-medium transition-colors">
                                    Create Account
                                </Link>
                            </p>
                        </div>

                    </div>

                    <p className="text-center text-xs text-gray-500 mt-8">
                        By signing in, you agree to our{' '}
                        <Link href="/terms-of-service" className="text-[#D4AF37] hover:text-[#e5c158]">
                            Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link href="/privacy-policy" className="text-[#D4AF37] hover:text-[#e5c158]">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </Layout>
    );
}
export default Login