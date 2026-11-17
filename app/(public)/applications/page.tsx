import { Suspense } from 'react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { RegistryStatusMonitoring } from '../../components/ui/RegistryStatusMonitoring';
import { Shield, Sparkles, BookOpen, Music, Mic, Building2, FileText } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Application Registry & Status Lookup | SufiPulse USA',
  description: 'Track the status of your contributor application or access the SufiPulse institutional registry for writers, vocalists, producers, and studios.',
};

export default function ApplicationsIndexPage() {
  const intakeSteps = [
    { label: 'Initial Submission', desc: 'Secure submission of portfolio, samples, and identity credentials.' },
    { label: 'Editorial & Technical Review', desc: 'Evaluation by the respective Diwan according to SufiPulse governance.' },
    { label: 'Credential Verification', desc: 'Verification of artistic credentials and governance attestation.' },
    { label: 'Registry Activation', desc: 'Final accessioning into the SufiPulse Contributor Registry.' },
  ];

  const portals = [
    { label: 'Writers (Ahl-e-Qalam)', href: '/writers/apply', icon: FileText, desc: 'Original mystical and sacred poetry submissions' },
    { label: 'Vocalists (Ahl-e-Sada)', href: '/vocalists/apply', icon: Mic, desc: 'Vocal performance and sacred recitation registry' },
    { label: 'Producers (Ahl-e-Naghma)', href: '/producers/apply', icon: Music, desc: 'Acoustic production and sound engineering' },
    { label: 'Literary Journal', href: '/literary-contributors/apply', icon: BookOpen, desc: 'Ahl-e-Tahreer research and literary discourse' },
    { label: 'Studios (Karkhana-e-Sada)', href: '/studio/apply', icon: Building2, desc: 'Recording studio facility accreditation' },
  ];

  return (
    <Layout>
      <Section className="py-16 border-b border-white/5 bg-gradient-to-b from-neutral-950 to-neutral-900/50">
        <PageContainer>
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>SufiPulse Contributor Registry</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Application Status & Intake Portal
            </h1>
            <p className="text-sm md:text-base text-neutral-400 leading-relaxed">
              Track the review and credential verification status of your submission using your Reference ID and Tracking Token, or explore contributor application portals.
            </p>
          </div>
        </PageContainer>
      </Section>

      <Section className="py-16">
        <PageContainer>
          <Suspense fallback={<div className="p-12 text-center text-neutral-500 text-xs">Loading status tracker...</div>}>
            <RegistryStatusMonitoring 
              division="studio"
              title="Contributor Application Tracking"
              mysticalName="Diwan-e-Khidmat"
              steps={intakeSteps}
            />
          </Suspense>
        </PageContainer>
      </Section>

      <Section className="py-16 border-t border-white/5 bg-black/40">
        <PageContainer>
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Contributor Application Portals</h2>
              <p className="text-xs text-neutral-400">Apply for accreditation across SufiPulse creative disciplines.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portals.map((p) => {
                const Icon = p.icon;
                return (
                  <Link 
                    key={p.href} 
                    href={p.href}
                    className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-400/30 transition-all group space-y-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {p.label}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </PageContainer>
      </Section>
    </Layout>
  );
}
