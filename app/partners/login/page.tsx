"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '@/app/components/layout/PageContainer';
import { Compass, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

export default function PartnerLoginPage() {
  const router = useRouter();
  const [partnerCode, setPartnerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/kashmir-reach?q=${encodeURIComponent(partnerCode.trim())}`);
      const data = await res.json();
      if (data.success && data.partners?.length > 0) {
        const matched = data.partners.find(
          (p: any) =>
            p.trackingCode.toLowerCase() === partnerCode.trim().toLowerCase() ||
            p.id.toLowerCase() === partnerCode.trim().toLowerCase() ||
            p.name.toLowerCase().includes(partnerCode.trim().toLowerCase())
        );

        if (matched) {
          localStorage.setItem('kpn_partner_id', matched.id);
          router.push(`/partners/dashboard?id=${matched.id}`);
          return;
        }
      }

      setError('Partner identifier not recognized. Please check your assigned tracking code or contact SufiPulse admin.');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-midnight,#0B0F17)] text-white min-h-screen py-24 flex items-center justify-center">
      <PageContainer>
        <div className="max-w-md mx-auto space-y-6">
          <Link
            href="/network/kashmir-partners"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Network Overview
          </Link>

          <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl space-y-6 shadow-2xl">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[var(--color-gold,#D4AF37)]" />
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--color-gold,#D4AF37)]">
                  Cultural Partner Portal
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Partner Login</h1>
              <p className="text-xs text-neutral-400">
                Access your organization’s active campaign kits, unique referral links, and Kashmir listening telemetry.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-bold mb-1">Partner Identifier / Tracking Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ecowatch or dekoshur"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-[var(--color-gold,#D4AF37)]"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  Provided in your official partner verification confirmation.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[var(--color-gold,#D4AF37)] hover:bg-[#FDE68A] text-black font-black text-xs uppercase tracking-widest rounded-lg transition-all shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Enter Partner Dashboard'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-4 border-t border-white/5 text-center text-xs text-neutral-400">
              Not a registered partner yet?{' '}
              <Link href="/network/kashmir-partners/apply" className="text-[var(--color-gold,#D4AF37)] hover:underline font-bold">
                Apply for verification
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
