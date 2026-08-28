"use client";
import { FileCheck, ArrowRight, Shield, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioWorkflowRoadmap, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function MajlisENazr() {
  const responsibilities = [
    {
      icon: FileCheck,
      title: 'Theological Review',
      description: 'Reviewing submitted kalam for theological and thematic consistency with traditional Sufi thought.'
    },
    {
      icon: Shield,
      title: 'Institutional Alignment',
      description: 'Confirming that all content aligns with the core purpose and values defined in Mithaq.'
    },
    {
      icon: CheckCircle,
      title: 'Production Authorization',
      description: 'Formal clearance of approved work to enter the structured production and recording workflow.'
    },
    {
      icon: AlertCircle,
      title: 'Revision Stewardship',
      description: 'Providing authoritative guidance for thematic or linguistic refinements when required.'
    }
  ];

  const reviewCriteria = [
    {
      title: 'Thematic Clarity',
      description: 'Content purpose and devotional focus are coherent and technically sound.'
    },
    {
      title: 'Devotional Integrity',
      description: 'Alignment with traditional Islamic principles and Sufi teachings from recognized orders.'
    },
    {
      title: 'Linguistic Coherence',
      description: 'Language quality, structural readability, and semantic precision of the text.'
    },
    {
      title: 'Structural Readiness',
      description: 'Suitability for musical adaptation, recording, and institutional distribution.'
    }
  ];

  const reviewSteps = [
    { id: 1, title: 'Submission', icon: FileCheck, desc: 'Contributor record entry' },
    { id: 2, title: 'Editorial Review', icon: Shield, desc: 'Thematic screening' },
    { id: 3, title: 'Determination', icon: AlertCircle, desc: 'Approval or Revision' },
    { id: 4, title: 'Production Clear', icon: CheckCircle, desc: 'Final authorization' }
  ];

  const authorityBoundaries = [
    {
      action: 'No Studio Execution',
      clarification: 'Production scheduling falls under Production Oversight'
    },
    {
      action: 'No Royalty Assignment',
      clarification: 'Economic distribution is handled by the royalty framework'
    },
    {
      action: 'No Metadata Locking',
      clarification: 'Registry validation is performed by Diwan-e-Amanat'
    },
    {
      action: 'No Publication Authority',
      clarification: 'Release activation requires registry confirmation'
    }
  ];

  return (
    <>
      {/* Cinematic Hero Section with /banner14.png */}
      <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
        {/* Cinematic Background Banner */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/banner14.png"
            alt="SufiPulse Majlis-e-Nazr Editorial Council & Oversight Chamber"
            fill
            priority
            quality={95}
            className="object-cover object-center scale-105 transform motion-safe:animate-fade-in"
          />
          {/* Layered brand gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-midnight)]/90 via-[var(--color-midnight)]/75 to-[var(--color-midnight)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[var(--color-midnight)]/70 to-[var(--color-midnight)]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10">
          <PageContainer>
            <div className="max-w-5xl mx-auto text-center">
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
                <span className="text-[11px] md:text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold">
                  SufiPulse USA — Editorial Authority
                </span>
              </div>

              <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                Editorial Review & Clearance<br className="hidden md:block" />{" "}
                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                  {roleDisplayMap.editor.mystical}
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                The Editorial Council governs content authorization within SufiPulse. No kalam enters musical production or recording without formal theological review and institutional clearance under Mithaq standards.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                <Link href="/governance/mithaq">
                  <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                    Constitutional Mithaq
                  </PrimaryButton>
                </Link>
                <Link href="/governance">
                  <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                    Governance Framework
                  </PrimaryButton>
                </Link>
              </div>

              {/* Responsibilities Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                {responsibilities.map((item, idx) => (
                  <div key={idx} className="text-center p-2">
                    <item.icon className="w-7 h-7 text-[var(--color-gold)] mx-auto mb-2 opacity-90" />
                    <div className="text-sm md:text-base font-bold text-[var(--color-text-primary)] mb-1">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)] leading-snug line-clamp-2">
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PageContainer>
        </div>
      </section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <StudioSectionHeader 
                title="Mandate & Review Authority"
                subtitle="Majlis-e-Nazr safeguards thematic coherence and institutional alignment. The Council does not modify creative content; it authorizes its progression."
            />

            <StudioCardGrid cols={4}>
              {responsibilities.map((item, idx) => (
                <StudioLinkCard 
                    key={idx}
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                />
              ))}
            </StudioCardGrid>
          </div>
        </PageContainer>
      </Section>

      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <StudioSectionHeader 
                title="Scope of Review"
                subtitle="Editorial evaluation assesses fundamental pillars of integrity and readiness"
            />

            <StudioCardGrid cols={2}>
              {reviewCriteria.map((criterion, idx) => (
                <StudioLinkCard 
                    key={idx}
                    icon={FileCheck}
                    title={criterion.title}
                    description={criterion.description}
                />
              ))}
            </StudioCardGrid>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="elite-card p-8 border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-4 mb-4">
                        <CheckCircle className="text-emerald-500 w-6 h-6" />
                        <h4 className="text-white font-bold uppercase tracking-widest text-sm">Outcome: Approved</h4>
                    </div>
                    <p className="text-neutral-400 text-sm leading-relaxed">Authorized entry into production assignment and vocalist coordination.</p>
                </div>
                <div className="elite-card p-8 border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-center gap-4 mb-4">
                        <AlertCircle className="text-amber-500 w-6 h-6" />
                        <h4 className="text-white font-bold uppercase tracking-widest text-sm">Outcome: Returned</h4>
                    </div>
                    <p className="text-neutral-400 text-sm leading-relaxed">Requires thematic or linguistic revision prior to further consideration.</p>
                </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      <StudioWorkflowRoadmap 
        title="Review Sequence"
        badge="Editorial Pipeline"
        steps={reviewSteps}
      />

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <StudioSectionHeader 
                title="Authority Boundaries"
                subtitle="Defined limitations to ensure cross-layer checks and balances"
            />

            <div className="elite-card p-10 md:p-12">
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                {authorityBoundaries.map((boundary, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-white text-sm font-bold uppercase tracking-wider">{boundary.action}</p>
                    <p className="text-neutral-500 text-[11px] leading-relaxed font-medium uppercase tracking-widest">{boundary.clarification}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em] mt-12 pt-6 border-t border-white/5 text-center italic">
                Authority concludes at production authorization.
              </p>
            </div>
          </div>
        </PageContainer>
      </Section>

      <StudioGovernancePanel 
        title="Institutional Integrity"
        description="Review protects mission before momentum. Editorial council decisions are documented to preserve institutional continuity and thematic coherence across all releases."
        primaryCTA={{ label: "Constitutional Mithaq", href: "/governance/mithaq" }}
        shieldText="Governed Editorial Review"
        background="midnight"
      />

      <style jsx global>{`
          .elite-card {
              background: rgba(18, 18, 18, 0.4);
              backdrop-filter: blur(12px);
              border: 1px solid rgba(255, 255, 255, 0.04);
              border-radius: 32px;
              box-shadow: 
                  0 20px 40px rgba(0,0,0,0.4),
                  inset 0 1px 1px rgba(255,255,255,0.02);
          }
      `}</style>
    </>
  );
}
