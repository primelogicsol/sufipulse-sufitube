"use client";
import { useState } from 'react';
import { useRouter } from "next/navigation";
import { Layout } from '../../components/layout/Layout';
import { UserPlus, Eye, EyeOff, Loader } from 'lucide-react';
import Link from 'next/link';
import { storage } from "@/app/lib/storage";
import { registerSchema, validateSchema } from '../../lib/validation-schemas';
import { sanitizeEmail } from '../../lib/sanitize';
export default function SignUp() {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
    })
    const [otp, setOtp] = useState("")
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);
    //   const { signUp, user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();

    const handleChange = (e: any) => {
        const { name, value } = e.target
        setForm(prev => ({
            ...prev,
            [name]: value
        }))
    }
    // const handleRegister = async (e: any) => {
    //     e.preventDefault()
    //     try {
    //         await api.register(form.fullName, form.email, form.password);
    //         localStorage.setItem("email", form.email)
    //         alert("OTP sent! Check your email.");
    //         router.push("/verify-email");
    //     } catch (err: any) {
    //         alert(err.response?.data?.error || err.message);
    //     }
    // };

    // Role-aware redirect after successful signup
    //   useEffect(() => {
    //     if (!authLoading && user) {
    //       if (isAdmin) {
    //         router.push('/admin');
    //       } else {
    //         router.push('/user/dashboard');
    //       }
    //     }
    //   }, [user, isAdmin, authLoading, navigate]);

    const handleRegister = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setFieldErrors({});

        const cleanEmail = sanitizeEmail(form.email);
        
        const { success, errors } = validateSchema(registerSchema, { 
            fullName: form.fullName, 
            email: cleanEmail, 
            password: form.password 
        });
        
        if (!success && errors) {
            const formattedErrors: any = {};
            errors.issues.forEach((issue: any) => {
                formattedErrors[issue.path[0]] = issue.message;
            });
            setFieldErrors(formattedErrors);
            setLoading(false);

            const firstErrorField = errors.issues[0]?.path[0] as string;
            if (firstErrorField) {
                setTimeout(() => {
                    const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
                    if (element) {
                        element.focus();
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
            return;
        }

        try {
            await storage.register(cleanEmail, form.password, form.fullName);
            alert("Registration successful!");
            router.push("/");
        } catch (err: any) {
            setError(err.message || "Registration failed");
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
                        {error && (
                            <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-md">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <form className="space-y-5">
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
                                    className={`w-full px-4 py-3 bg-[#1a2332] border-2 ${fieldErrors.fullName ? 'border-red-500' : 'border-[#3a4556]'} rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all`}
                                    placeholder="John Doe"
                                />
                                {fieldErrors.fullName && <p className="text-red-500 text-sm mt-1">{fieldErrors.fullName}</p>}
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
                                    onChange={(e) => handleChange(e)}
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
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={handleChange}
                                        required
                                        className={`w-full px-4 py-3 pr-12 bg-[#1a2332] border-2 ${fieldErrors.password ? 'border-red-500' : 'border-[#3a4556]'} rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all`}
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
                                {fieldErrors.password ? <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p> : <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>}
                            </div>

                            {/* <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 pr-12 bg-[#1a2332] border-2 border-[#3a4556] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors focus:outline-none"
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div> */}

                            <button
                                onClick={(e) => handleRegister(e)}
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center bg-linear-to-r from-[#D4AF37] to-[#aa8829] text-[#1a2332] py-3 rounded-md font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-6"
                            >
                                {loading ? <Loader /> : 'Create Account'}

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
