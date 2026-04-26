"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layout } from '../../components/layout/Layout';
import { Lock, Loader, CheckCircle, Eye, EyeOff } from 'lucide-react';
import * as api from '../../api/auth';
import Link from 'next/link';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const [step, setStep] = useState<'otp' | 'password' | 'done'>('otp');
    const [otp, setOtp] = useState('');
    const [tempToken, setTempToken] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email) router.replace('/forgot-password');
    }, [email, router]);

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.resetPasswordVerifyOtp(email, otp.trim());
            const data = await res.json();
            if (!data.success) throw new Error(data.error?.message || data.message || 'Invalid OTP');
            setTempToken(data.tempToken);
            setStep('password');
        } catch (err: any) {
            setError(err.message || 'Failed to verify OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== passwordConfirm) {
            setError("Passwords don't match");
            return;
        }
        setLoading(true);
        try {
            const res = await api.resetPasswordViaOtp(email, password, tempToken);
            const data = await res.json();
            if (!data.success) throw new Error(data.error?.message || data.message || 'Failed to reset password');
            setStep('done');
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. Please try again.');
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
                        <h1 className="text-4xl font-serif text-[#D4AF37] mb-2">Reset Password</h1>
                        <p className="text-gray-400">
                            {step === 'otp' ? `Enter the 6-digit code sent to ${email}` : step === 'password' ? 'Set your new password' : ''}
                        </p>
                    </div>

                    <div className="bg-[#1a2332]/50 backdrop-blur-sm border border-[#2a3442] rounded-lg p-8 shadow-2xl">
                        {step === 'done' ? (
                            <div className="flex flex-col items-center gap-4 py-4 text-center">
                                <CheckCircle className="w-12 h-12 text-green-400" />
                                <div>
                                    <p className="text-green-300 font-semibold text-lg mb-1">Password updated!</p>
                                    <p className="text-gray-400 text-sm">You can now sign in with your new password.</p>
                                </div>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="mt-2 w-full bg-linear-to-r from-[#D4AF37] to-[#aa8829] text-[#1a2332] py-3 rounded-md font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all duration-300"
                                >
                                    Sign In
                                </button>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                {step === 'otp' && (
                                    <form className="space-y-6" onSubmit={handleVerifyOtp}>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Reset Code
                                            </label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={otp}
                                                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                                required
                                                disabled={loading}
                                                className="w-full px-4 py-3 bg-[#0f1823] border-2 border-[#3a4556] rounded-md text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors disabled:opacity-60"
                                                placeholder="------"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading || otp.length < 6}
                                            className="w-full flex items-center justify-center gap-2 cursor-pointer bg-linear-to-r from-[#D4AF37] to-[#aa8829] text-[#1a2332] py-3 rounded-md font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                        >
                                            {loading ? <><Loader className="w-4 h-4 animate-spin" /> Verifying…</> : 'Verify Code'}
                                        </button>
                                        <p className="text-center text-sm text-gray-400">
                                            Didn't receive a code?{' '}
                                            <Link href="/forgot-password" className="text-[#D4AF37] hover:text-[#e5c158] transition-colors">
                                                Resend
                                            </Link>
                                        </p>
                                    </form>
                                )}

                                {step === 'password' && (
                                    <form className="space-y-6" onSubmit={handleResetPassword}>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    required
                                                    disabled={loading}
                                                    className="w-full px-4 py-3 bg-[#0f1823] border-2 border-[#3a4556] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors disabled:opacity-60 pr-12"
                                                    placeholder="Min 8 chars, upper, lower, number"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(v => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={passwordConfirm}
                                                onChange={e => setPasswordConfirm(e.target.value)}
                                                required
                                                disabled={loading}
                                                className="w-full px-4 py-3 bg-[#0f1823] border-2 border-[#3a4556] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-colors disabled:opacity-60"
                                                placeholder="Repeat new password"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading || password.length < 8}
                                            className="w-full flex items-center justify-center gap-2 cursor-pointer bg-linear-to-r from-[#D4AF37] to-[#aa8829] text-[#1a2332] py-3 rounded-md font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                        >
                                            {loading ? <><Loader className="w-4 h-4 animate-spin" /> Saving…</> : 'Set New Password'}
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
}
