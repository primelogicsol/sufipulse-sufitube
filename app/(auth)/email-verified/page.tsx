"use client";
import { CircleCheck as CheckCircle } from "lucide-react";
import { Layout } from "../../components/layout/Layout";
import Link from "next/link";

export default function EmailVerifiedPage() {
    return (
        <Layout>
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="rounded-2xl p-8 max-w-md w-full text-center">

                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <CheckCircle className="text-[#D4AF37] mb-3 w-16 h-16" />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-800 mb-3">
                        Email Verified Successfully
                    </h1>

                    {/* Description */}
                    <p className="text-gray-600 mb-6">
                        Your email has been verified successfully.
                        You can now log in to your account.
                    </p>

                    {/* Button */}
                    <Link
                        href={"/login"}
                        className="w-full px-6 py-2 bg-linear-to-r from-[#D4AF37] to-[#aa8829] !text-[#1a2332] py-3 rounded-md font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-6"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        </Layout>
    );
}