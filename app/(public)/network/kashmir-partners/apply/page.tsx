"use client";

import { useState } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/app/components/layout/PageContainer';
import { Section } from '@/app/components/layout/Section';
import { Compass, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

export default function KashmirPartnersApplyPage() {
  const [formData, setFormData] = useState({
    name: '',
    pillar: 'ecological_conservation',
    district: 'srinagar',
    organizationType: 'conservation_ngo',
    locationDetails: '',
    primaryHandle: '',
    contactPerson: '',
    contactChannel: 'whatsapp',
    contactValue: '',
    estimatedCommunityReach: 5000,
    notes: '',
  });

  const [consentChecked, setConsentChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) {
      setError('Please accept the voluntary distribution covenant before submitting.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/public/kpn-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-midnight,#0B0F17)] text-white min-h-screen py-20">
      <PageContainer>
        <div className="max-w-2xl mx-auto space-y-8">
          <Link
            href="/network/kashmir-partners"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Network Overview
          </Link>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Compass className="w-4 h-4 text-[var(--color-gold,#D4AF37)]" />
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--color-gold,#D4AF37)]">
                Partner Intake & Verification
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Apply to the Kashmir Cultural Partner Network
            </h1>
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
              Open to recognized environmental societies, artisan guilds, literary forums, and university student circles operating within the Kashmir Valley.
            </p>
          </div>

          {success ? (
            <div className="p-8 bg-white/[0.03] border border-emerald-500/30 rounded-2xl space-y-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">Application Received</h2>
              <p className="text-xs text-neutral-300 leading-relaxed max-w-md mx-auto">
                Thank you for applying to the SufiPulse Cultural Partner Network. Your submission has entered our administrative review queue. A member of the SufiPulse cultural secretariat will review your organization’s public profile and contact you via your specified channel within 48 hours.
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <Link
                  href="/network/kashmir-partners/directory"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Browse Approved Directory
                </Link>
                <Link
                  href="/releases"
                  className="px-4 py-2 bg-[var(--color-gold,#D4AF37)] text-black rounded-lg text-xs font-bold transition-colors"
                >
                  Explore Current Releases
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl space-y-6">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1">Organization / Collective Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kashmir EcoWatch or Zadibal Pashmina Weavers"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--color-gold,#D4AF37)]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neutral-300 font-bold mb-1">Strategic Pillar *</label>
                    <select
                      value={formData.pillar}
                      onChange={(e) => setFormData({ ...formData, pillar: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none"
                    >
                      <option value="ecological_conservation">🌿 Ecological & Water Conservation</option>
                      <option value="artisan_craft_heritage">✨ Artisan & Craft Heritage</option>
                      <option value="sacred_literature_sufi">📜 Sacred Literature & Reshi-Sufi</option>
                      <option value="youth_academic_thinkers">🎓 Youth, Universities & Thinkers</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-bold mb-1">Kashmir District *</label>
                    <select
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none"
                    >
                      <option value="srinagar">Srinagar</option>
                      <option value="budgam">Budgam</option>
                      <option value="ganderbal">Ganderbal</option>
                      <option value="anantnag">Anantnag (Islamabad)</option>
                      <option value="pulwama">Pulwama</option>
                      <option value="shopian">Shopian</option>
                      <option value="kulgam">Kulgam</option>
                      <option value="baramulla">Baramulla</option>
                      <option value="kupwara">Kupwara</option>
                      <option value="bandipora">Bandipora</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">Location Details (Town / Area / Campus) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Srinagar (Downtown / Zadibal) or Awantipora (IUST)"
                    value={formData.locationDetails}
                    onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--color-gold,#D4AF37)]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neutral-300 font-bold mb-1">Public Handle / Channel Page *</label>
                    <input
                      type="text"
                      required
                      placeholder="@handle, FB Page, or Telegram Channel"
                      value={formData.primaryHandle}
                      onChange={(e) => setFormData({ ...formData, primaryHandle: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--color-gold,#D4AF37)]"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-bold mb-1">Estimated Community Size *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 10000"
                      value={formData.estimatedCommunityReach}
                      onChange={(e) => setFormData({ ...formData, estimatedCommunityReach: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white font-mono focus:outline-none focus:border-[var(--color-gold,#D4AF37)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neutral-300 font-bold mb-1">Authorized Contact Person *</label>
                    <input
                      type="text"
                      required
                      placeholder="Name of authorized representative"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--color-gold,#D4AF37)]"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-bold mb-1">Contact Phone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91-94190..."
                      value={formData.contactValue}
                      onChange={(e) => setFormData({ ...formData, contactValue: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--color-gold,#D4AF37)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">Brief Description of Your Community Work</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your organization's cultural, ecological, artisan, or student activities in the Valley."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--color-gold,#D4AF37)]"
                  />
                </div>

                {/* Consent Covenant */}
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[var(--color-gold,#D4AF37)] focus:ring-0 bg-black/60 border-white/20"
                    />
                    <span className="text-xs text-neutral-300 leading-relaxed">
                      We confirm that we represent a legitimate cultural, ecological, artisan, or student collective in Kashmir. We voluntarily agree to receive verified release packages and understand that participation is non-commercial and strictly preserves our independent cultural identity.
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[var(--color-gold,#D4AF37)] hover:bg-[#FDE68A] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? 'Submitting Application...' : 'Submit Application for Review'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
