"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/layout/Layout';
import { Lock, Eye, EyeOff, Loader, ChevronDown, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as api from "../../api/auth";
import { ENV } from '../../config/env';
import Link from 'next/link';
import { loginSchema, validateSchema } from '../../lib/validation-schemas';
import { sanitizeEmail } from '../../lib/sanitize';



const Login = () => {
    const [form, setForm] = useState({ email: "", password: "" });
    const BASE_URL = ENV.API_URL
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const { login, googleLogin, user } = useAuth();
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
            } else {
                router.push('/user/profile');
            }
        }
    }, [user]);
    const handleChange = (e: any) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }));
    }
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setFieldErrors({});

        const cleanEmail = sanitizeEmail(form.email);
        
        const { success, errors } = validateSchema(loginSchema, { email: cleanEmail, password: form.password });
        
        if (!success && errors) {
            const formattedErrors: any = {};
            errors.issues.forEach((issue: any) => {
                formattedErrors[issue.path[0]] = issue.message;
            });
            setFieldErrors(formattedErrors);
            setLoading(false);
            return;
        }

        try {
            await login(cleanEmail, form.password);
        } catch (err: any) {
            setError(err?.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    const handleGoogleLogin = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await googleLogin();
        } catch (err: any) {
            setError(err?.message || 'Google sign-in is not available yet.');
        } finally {
            setLoading(false);
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
                                    className={`w-full px-4 py-3 bg-[#1a2332] border-2 ${fieldErrors.email ? 'border-red-500' : 'border-[#3a4556]'} rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all`}
                                    placeholder="your@email.com"
                                />
                                {fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
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
                                {fieldErrors.password && <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>}
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
                                Continue with Google
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