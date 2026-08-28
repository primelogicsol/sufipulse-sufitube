"use client";
import { Mic as Mic2, Radio, CircleCheck as CheckCircle2, ArrowRight, Shield, MapPin, ChevronLeft, ChevronRight, Play, Settings, HardDrive, Activity, Compass, Database } from 'lucide-react';
import Image from 'next/image';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Badge } from '../../components/primitives/Badge';
import { PrimaryButton } from '../../components/primitives/PrimaryButton';
import { Card } from '../../components/primitives/Card';
import { RegistryStatusMonitoring } from '../../components/ui/RegistryStatusMonitoring';
import { StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioWorkflowRoadmap, StudioGovernancePanel } from '../../components/studio/StudioLayoutComponents';
import { useRef, useState } from 'react';
import Link from 'next/link';

export default function Studio() {
  const studioResponsibilities = [
    {
      icon: Mic2,
      title: 'Recording Sessions',
      description: 'Capturing vocal performances with technical precision and creative support.'
    },
    {
      icon: Radio,
      title: 'Mixing & Mastering',
      description: 'Balancing elements and preparing final masters for distribution.'
    },
    {
      icon: CheckCircle2,
      title: 'Quality Control',
      description: 'Ensuring audio integrity, format compatibility, and sonic consistency.'
    },
    {
      icon: Shield,
      title: 'Metadata Integrity',
      description: 'Supporting Registry with technical documentation and file specifications.'
    }
  ];

  const productionPath = [
    { id: 1, title: 'Approved Kalam', desc: 'Editorial council authorization' },
    { id: 2, title: 'Vocalist Alignment', desc: 'Matching voice to sacred text' },
    { id: 3, title: 'Composition', desc: 'Thematic musical structuring' },
    { id: 4, title: 'Recording', desc: 'Master-grade capture' },
    { id: 5, title: 'Mixing & Mastering', desc: 'Technical validation' },
    { id: 6, title: 'Registry Authorization', desc: 'Final record entry' }
  ];

  return (
    <Layout>
      {/* Cinematic Hero Section with /banner8.png */}
      <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
        {/* Cinematic Background Banner */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/banner8.png"
            alt="SufiPulse Studio & Master Recording Facility"
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
                  SufiPulse USA — Institutional Studio
                </span>
              </div>

              <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                Studio & Master Capture<br className="hidden md:block" />{" "}
                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                  Karkhana-e-Sada
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                The Studio operates after editorial clearance and before registry authorization. It is responsible for master-grade audio capture, technical sound engineering, and final master validation across the global SufiPulse network.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                <Link href="/studio/apply">
                  <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                    Submit Studio Credentials
                  </PrimaryButton>
                </Link>
                <Link href="/governance">
                  <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                    Studio Governance
                  </PrimaryButton>
                </Link>
              </div>

              {/* Responsibilities Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                {studioResponsibilities.map((item, idx) => (
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
                title="Mandate & Responsibilities"
                subtitle="The Studio operates after editorial approval. No recording begins without structured assignment and institutional alignment."
            />

            <StudioCardGrid cols={4}>
              {studioResponsibilities.map((item, idx) => (
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

      <StudioWorkflowRoadmap 
        title="Sequential Workflow"
        badge="Production Path"
        steps={productionPath}
        activeId={4}
      />

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <StudioSectionHeader 
                title="Studio Network Architecture"
            />

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6 text-[var(--color-gold)]">
                  <MapPin className="w-6 h-6" />
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Central Studio</h3>
                </div>
                <div className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6 font-medium uppercase tracking-widest">
                  USA — Virginia
                </div>
                <ul className="space-y-4">
                  {[
                    'Primary production oversight',
                    'Final master validation authority',
                    'Direct Registry coordination'
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] mt-2" />
                      <span className="text-[var(--text-base)] text-[var(--color-text-secondary)]">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6 text-[var(--color-gold)]">
                  <MapPin className="w-6 h-6" />
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Remote Studios</h3>
                </div>
                <div className="flex gap-2 mb-6">
                  {['Canada', 'UAE', 'India'].map((c) => (
                    <span key={c} className="text-[var(--text-xs)] px-2 py-0.5 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 text-[var(--color-gold)] rounded font-bold uppercase tracking-widest">
                      {c}
                    </span>
                  ))}
                </div>
                <ul className="space-y-4">
                  {[
                    'Regional recording environments',
                    'Localized vocalist coordination',
                    'Centralized review alignment'
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] mt-2" />
                      <span className="text-[var(--text-base)] text-[var(--color-text-secondary)]">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-[var(--color-midnight)] p-6 rounded-lg border border-[var(--color-gold)]/20 text-center max-w-3xl mx-auto shadow-2xl">
              <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed italic font-medium">
                "Recording within the SufiPulse Studio Network is reserved for works authored by approved writers and performed by approved vocalists. Regional flexibility does not alter governance standards."
              </p>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto shadow-2xl rounded-3xl overflow-hidden">
            <RegistryStatusMonitoring 
              division="studio"
              title="Studio Network"
              mysticalName="Karkhana-e-Sada"
              steps={[
                { label: 'Credentials Intake', desc: 'Initial technical verification of facility and equipment specifications.' },
                { label: 'Facility Audit', desc: 'Technical review of acoustic environment and recording chain specifications.' },
                { label: 'Master Validation Review', desc: 'Centralized review of regional master quality and technical alignment.' },
                { label: 'Network Integration', desc: 'Operational alignment with centralized SufiPulse production standards.' },
                { label: 'Production Authorization', desc: 'Formal institutional clearance to host SufiPulse sessions.' }
              ]}
            />
          </div>
        </PageContainer>
      </Section>

      <StudioGovernancePanel 
        title="Institutional Access"
        description="Studios may request inclusion within the SufiPulse production network. Admission is evaluated on technical readiness and governance alignment."
        primaryCTA={{ label: "Submit Studio Credentials", href: "/studio/apply" }}
        secondaryCTA={{ label: "View Framework", href: "/governance" }}
        shieldText="Final Registry Authorization Required"
        background="midnight"
      />
    </Layout>
  );
}
