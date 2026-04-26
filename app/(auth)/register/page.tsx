"use client";
import { useState } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { Layout } from '../../components/layout/Layout';
import { UserPlus, Eye, EyeOff, Loader, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { storage } from "@/app/lib/storage";
import { useAuth } from '../../contexts/AuthContext';
import { registerSchema, validateSchema } from '../../lib/validation-schemas';
import { sanitizeEmail } from '../../lib/sanitize';

export default function SignUp() {
    const [form, setForm] = useState({ fullName: "", email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setFieldErrors({});

        const cleanEmail = sanitizeEmail(form.email);

        const { success: valid, errors } = validateSchema(registerSchema, {
            fullName: form.fullName,
            email: cleanEmail,
            password: form.password,
        });

        if (!valid && errors) {
            const formatted: Record<string, string> = {};
            errors.issues.forEach((issue: any) => {
                if (issue.path[0]) formatted[issue.path[0]] = issue.message;
            });
            setFieldErrors(formatted);
            setLoading(false);
            const first = errors.issues[0]?.path[0] as string;
            if (first) {
                setTimeout(() => {
                    const el = document.querySelector(`[name="${first}"]`) as HTMLElement;
                    el?.focus();
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
            return;
        }

        try {
            await storage.register(cleanEmail, form.password, form.fullName);
            setSuccess(true);
            setForm(prev => ({ ...prev, password: '' }));

            // Auto-login then redirect
            await login(cleanEmail, form.password);

            const returnUrl = searchParams.get('returnUrl');
            setTimeout(() => {
                router.push(returnUrl || '/');
            }, 1200);
        } catch (err: any) {
            setError(err.message || "Registration failed. Please try again.");
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
                            <UserPlus className="text-[#1a2332]" size={32} />
                        </div>
                        <h1 className="text-4xl font-serif text-[#D4AF37] mb-2">Join SufiPulse</h1>
                        <p className="text-gray-400">Create your account to get started</p>
                    </div>

                    <div className="bg-[#1a2332]/50 backdrop-blur-sm border border-[#2a3442] rounded-lg p-8 shadow-2xl">
                        {success && (
                            <div className="mb-6 flex items-center gap-3 p-4 bg-green-900/20 border border-green-700/40 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                                <p className="text-green-300 text-sm font-medium">
                                    Account created successfully. Redirecting…
                                </p>
                            </div>
                        )}

                        {error && !success && (
                            <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleRegister}>
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                                    Full Name
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    required
                                    disabled={loading || success}
                                    className={`w-full px-4 py-3 bg-[#0f1823] border-2 ${fieldErrors.fullName ? 'border-red-500' : 'border-[#3a4556]'} rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors disabled:opacity-60`}
                                    placeholder="Fayaz Khan"
                                />
                                {fieldErrors.fullName && (
                                    <p className="text-red-400 text-xs mt-1">{fieldErrors.fullName}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading || success}
                                    className={`w-full px-4 py-3 bg-[#0f1823] border-2 ${fieldErrors.email ? 'border-red-500' : 'border-[#3a4556]'} rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors disabled:opacity-60`}
                                    placeholder="your@email.com"
                                />
                                {fieldErrors.email && (
                                    <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                        disabled={loading || success}
                                        className={`w-full px-4 py-3 pr-12 bg-[#0f1823] border-2 ${fieldErrors.password ? 'border-red-500' : 'border-[#3a4556]'} rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors disabled:opacity-60`}
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
                                {fieldErrors.password ? (
                                    <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>
                                ) : (
                                    <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || success}
                                className="w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#D4AF37] to-[#aa8829] text-[#1a2332] py-3 rounded-md font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-6"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Creating account…
                                    </>
                                ) : 'Create Account'}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-[#2a3442] text-center">
                            <p className="text-sm text-gray-400">
                                Already have an account?{' '}
                                <Link href="/login" className="text-[#D4AF37] hover:text-[#e5c158] font-medium transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-500 mt-8">
                        By creating an account, you agree to our{' '}
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
