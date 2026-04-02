"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/layout/Layout';
import { Lock } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { useRouter } from 'next/navigation';
import * as api from "../../api/auth";
import Link from 'next/link';
import { ENV } from '../../config/env';

export default function ForgotPassword() {
    const [email, setEmail] = useState("")
    const BASE_URL = ENV.API_URL
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter()
    // Role-aware redirect after successful login
    useEffect(() => {
        if (user) {
            if (user.role === "admin") {
                router.push('/admin');
            } else {
                router.push('/user/dashboard');
            }
        }
    }, [user]);
    const handleChange = (e: any) => {
        setEmail(e.target.value);
    }
    const handleLogin = async (e: any) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.resetPasswordSendOtp(email);
            alert("OTP Sent!");
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

                        <form className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-[#1a2332] border-2 border-[#3a4556] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all"
                                    placeholder="your@email.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                onClick={(e) => handleLogin(e)}
                                className="w-full cursor-pointer flex items-center justify-center bg-linear-to-r from-[#D4AF37] to-[#aa8829] text-[#1a2332] py-3 rounded-md font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {loading ? <Loader /> : 'Send OTP'}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-[#2a3442] text-center">
                            <p className="text-sm text-gray-400">
                                Remeber Password?{' '}
                                <Link href="/login" className="text-[#D4AF37] hover:text-[#e5c158] font-medium transition-colors">
                                    Login
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