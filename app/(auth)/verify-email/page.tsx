"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as api from "../../api/auth";
import { Layout } from "../../components/layout/Layout";
import { Loader, Lock } from "lucide-react";

const VerifyOtpPage = () => {
    const router = useRouter()
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [email, setEmail] = useState<string>("");
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        const storedEmail = localStorage.getItem("email");
        if (storedEmail) {
            setEmail(storedEmail);
        }
    }, [])
    const handleSubmit = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true)
        try {
            await api.verifyEmail(email, otp); // your backend API
            router.push("/email-verified"); // redirect after success
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid OTP");
        } finally {
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
                        <h1 className="text-4xl font-serif text-[#D4AF37] mb-2">Verify OTP</h1>
                        <p className="text-gray-400">Verify your SufiPulse account</p>
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
                                    Please enter the OTP, You received on your email.
                                </label>
                                <input
                                    id="otp"
                                    type="otp"
                                    name="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-[#1a2332] border-2 border-[#3a4556] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all"
                                    placeholder="123456"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || otp.length < 6}
                                onClick={(e) => handleSubmit(e)}
                                className="w-full flex justify-center items-center bg-linear-to-r from-[#D4AF37] to-[#aa8829] text-[#1a2332] py-3 rounded-md font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {loading ? <Loader /> : 'Verify Email'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default VerifyOtpPage;