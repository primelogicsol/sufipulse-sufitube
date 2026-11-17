import Link from 'next/link';
import { PageContainer } from '@/app/components/layout/PageContainer';
import { Section } from '@/app/components/layout/Section';
import { Compass, ShieldCheck, ArrowLeft, ArrowRight, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Cultural Partner Guidelines & Code of Conduct | SufiPulse USA',
  description: 'Ethical guidelines, content permissions, and non-commercial standards for SufiPulse Cultural Partner Network members.',
};

export default function KashmirPartnersGuidelinesPage() {
  return (
    <div className="bg-[var(--color-midnight,#0B0F17)] text-white min-h-screen py-20">
      <PageContainer>
        <div className="max-w-3xl mx-auto space-y-10">
          <Link
            href="/network/kashmir-partners"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Network Overview
          </Link>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-gold,#D4AF37)]" />
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--color-gold,#D4AF37)]">
                Governance & Standards
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Cultural Partner Network Guidelines
            </h1>
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
              Ethical standards, copyright permissions, and disclosure requirements for verified organizations participating in voluntary release distribution.
            </p>
          </div>

          <div className="space-y-8 text-sm text-neutral-300 leading-relaxed border-t border-white/10 pt-8">
            {/* Section 1 */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                1. Voluntary Cultural Stewardship
              </h2>
              <p>
                Participation in the SufiPulse Cultural Partner Network (CPN) is strictly voluntary and non-commercial. Partners are cultural stewards sharing sacred spiritual poetry, artisan heritage tributes, and environmental reflections with their own existing, opt-in audiences.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                2. Integrity of Authorship & Canonical Lyrics
              </h2>
              <p>
                Partners must never alter, misattribute, or truncate the official literary and vocal credits of any SufiPulse release. All social posts and community broadcasts must accurately cite the author (e.g. <em>Dr. Zarf-e-Noori</em> or traditional Reshi-Sufi authors) and the accredited vocalists.
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                3. Mandatory Destination Binding
              </h2>
              <p>
                SufiPulse.com is the permanent archive and full-length listening destination. Partner promotional materials (WhatsApp broadcasts, Reels, Facebook posts) must direct listeners to the canonical release page using their assigned non-sensitive partner referral link. Partners may not re-upload full master audio files to third-party monetized channels without explicit written agreement.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                4. Strictly Prohibited Outreach Tactics
              </h2>
              <p className="text-neutral-400">
                To protect the spiritual dignity of Sufism and prevent platform sanctions, network members must never:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-neutral-400">
                <li>Send unsolicited bulk messages or cold messages to individuals who have not consented to receive community updates.</li>
                <li>Engage in artificial playback manipulation, engagement pods, or simulated view generation.</li>
                <li>Misrepresent partnership as formal institutional governance or doctrinal endorsement of SufiPulse.</li>
              </ul>
            </div>

            {/* Section 5 */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                5. Mandatory Attribution & Disclaimer Notice
              </h2>
              <p>
                Every campaign kit generated by SufiPulse includes a standardized disclaimer:  
                <span className="block mt-2 p-3 bg-black/40 border border-white/5 rounded-lg font-mono text-xs text-neutral-300">
                  “Distributed voluntarily by [Partner Name] as an approved cultural partner of SufiPulse.com. Non-commercial distribution preserving sacred Kashmiri spiritual and living heritage.”
                </span>
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center justify-between">
            <Link
              href="/network/kashmir-partners/apply"
              className="px-6 py-3 bg-[var(--color-gold,#D4AF37)] text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#FDE68A] transition-all shadow-xl flex items-center gap-2"
            >
              Accept Guidelines & Apply <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
