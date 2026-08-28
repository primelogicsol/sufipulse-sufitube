"use client";
import { Pen, BookOpen, Users, ArrowRight, Shield, CircleCheck as CheckCircle2, ChevronLeft, ChevronRight, FileText, Compass, Sparkles, Library } from 'lucide-react';
import Image from 'next/image';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Badge } from '../../components/primitives/Badge';
import { PrimaryButton } from '../../components/primitives/PrimaryButton';
import { Card } from '../../components/primitives/Card';
import { RegistryStatusMonitoring } from '../../components/ui/RegistryStatusMonitoring';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

export default function LiteraryContributors() {
  const workflowScrollRef = useRef<HTMLDivElement>(null);

  const scrollWorkflowLeft = () => {
    if (workflowScrollRef.current) {
      workflowScrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const scrollWorkflowRight = () => {
    if (workflowScrollRef.current) {
      workflowScrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const contributorResponsibilities = [
    {
      icon: Pen,
      title: 'Reflective Writing',
      description: 'Original essays and spiritual commentary aligned with institutional ethos.'
    },
    {
      icon: BookOpen,
      title: 'Analytical Discourse',
      description: 'Structured intellectual engagement with Sufi thought and contemporary issues.'
    },
    {
      icon: Compass,
      title: 'Institutional Alignment',
      description: 'Content aligned with charter-defined principles and sacred literature.'
    },
    {
      icon: Shield,
      title: 'Editorial Oversight',
      description: 'Structured review and validation under the Majlis-e-Nazr board.'
    }
  ];

  const workflowStages = [
    { id: 1, title: 'Literary Submission', desc: 'Contributors submit original work' },
    { id: 2, title: 'Editorial Review', desc: 'Thematic and intellectual screening' },
    { id: 3, title: 'Revision Cycle', desc: 'Refining work for journal standards' },
    { id: 4, title: 'Journal Publication', desc: 'Authorized entry into the Journal' },
    { id: 5, title: 'Archival Documentation', desc: 'Final record preservation' }
  ];

  return (
    <Layout>
      {/* Cinematic Hero Section with /banner7.png */}
      <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
        {/* Cinematic Background Banner */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/banner7.png"
            alt="SufiPulse Literary Contributors & Discourse Session"
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
                  SufiPulse USA — Literary Division
                </span>
              </div>

              <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                Literary Contributors<br className="hidden md:block" />{" "}
                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                  Ahl-e-Tahreer
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                Ahl-e-Tahreer represents contributors who engage through reflective writing, essays, spiritual commentary, and analytical discourse. All contributions undergo editorial review for publication in the Literary Journal.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                <Link href="/literary-contributors/apply">
                  <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                    Apply as Ahl-e-Tahreer
                  </PrimaryButton>
                </Link>
                <Link href="/literary-journal">
                  <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                    View Literary Journal
                  </PrimaryButton>
                </Link>
              </div>

              {/* Responsibilities Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                {contributorResponsibilities.map((item, idx) => (
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
            <div className="mb-12 text-center md:text-left">
              <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-4">
                Literary Mandate & Role Definition
              </h2>
              <p className="text-[var(--color-text-secondary)] max-w-2xl">
                The Literary Contributor operates within the institutional journal and reflection framework. Their work undergoes editorial review before publication in the Literary Journal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contributorResponsibilities.map((item, idx) => (
                <Card key={idx} className="bg-[var(--color-midnight)]/30 border-[var(--color-text-tertiary)]/10">
                  <item.icon className="w-8 h-8 text-[var(--color-gold)] mb-4" />
                  <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-text-primary)] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed">
                    {item.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <div className="mb-12 text-center">
              <Badge variant="neutral" className="mb-4">Institutional Workflow</Badge>
              <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)]">
                Publication Workflow Position
              </h2>
            </div>

            <div className="relative group">
              <div
                ref={workflowScrollRef}
                className="flex items-start gap-4 overflow-x-auto scrollbar-hide pb-8 px-4"
              >
                {workflowStages.map((stage) => (
                  <div key={stage.id} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center text-center w-[180px]">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 font-bold ${stage.id === 1 ? 'bg-[var(--color-gold)] text-[var(--color-midnight)]' : 'bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 text-[var(--color-gold)]'}`}>
                        {stage.id}
                      </div>
                      <h4 className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)] mb-1">
                        {stage.title}
                      </h4>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
                        {stage.desc}
                      </p>
                    </div>
                    {stage.id < workflowStages.length && (
                      <ArrowRight className="w-5 h-5 text-[var(--color-gold)]/20 mx-2 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={scrollWorkflowLeft}
                className="absolute left-0 top-6 -translate-x-4 w-10 h-10 rounded-full bg-[var(--color-slate)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={scrollWorkflowRight}
                className="absolute right-0 top-6 translate-x-4 w-10 h-10 rounded-full bg-[var(--color-slate)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            <p className="text-neutral-500 text-sm text-center mt-4">
              Literary Contributors operate within the institutional journal and reflection framework. Their work undergoes editorial review before publication in the Literary Journal.
            </p>
          </div>
        </PageContainer>
      </Section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-10 text-center md:text-left">
              Operational Framework
            </h2>

            <div className="grid md:grid-cols-2 gap-12 mb-12">
              <div className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-xl p-8">
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-3">
                  <Library className="w-5 h-5 text-[var(--color-gold)]" /> Structural Discipline
                </h3>
                <ul className="space-y-4">
                  {[
                    'Submissions must demonstrate clarity and intellectual integrity',
                    'Content is subject to deep editorial review and revision',
                    'Tone must align with SufiPulse institutional standards'
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] mt-2" />
                      <span className="text-[var(--text-base)] text-[var(--color-text-secondary)]">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-xl p-8">
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-3">
                  <Users className="w-5 h-5 text-[var(--color-gold)]" /> Collaborative Position
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Literary Contributors', desc: 'Submit Reflective Work' },
                    { label: 'Editorial Council', desc: 'Reviews & Authorizes' },
                    { label: 'Literary Journal', desc: 'Publishes Approved Work' },
                    { label: 'Institutional Archive', desc: 'Preserves Documentation' }
                  ].map((step, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-[var(--text-sm)] text-[var(--color-text-primary)] font-medium">{step.label}</span>
                      <span className="text-[var(--text-xs)] text-[var(--color-gold)] opacity-70 uppercase tracking-widest">{step.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-midnight)] p-6 rounded-lg border border-[var(--color-gold)]/20 text-center max-w-3xl mx-auto">
              <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed italic">
                "Literary contribution does not initiate musical production unless separately submitted under Ahl-e-Qalam."
              </p>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <RegistryStatusMonitoring 
              division="literary"
              title="Literary Contributors"
              mysticalName="Ahl-e-Tahreer"
              steps={[
                { label: 'Literary Submission', desc: 'Initial record entry into the Ahl-e-Tahreer intake registry.' },
                { label: 'Editorial Screening', desc: 'Thematic evaluation of submitted literary material.' },
                { label: 'Linguistic Review', desc: 'Deep assessment of writing quality and intellectual integrity.' },
                { label: 'Governance Evaluation', desc: 'Institutional alignment review under Majlis-e-Nazr oversight.' },
                { label: 'Journal Decision', desc: 'Formal determination of eligibility for Literary Journal publication.' }
              ]}
            />
          </div>
        </PageContainer>
      </Section>

      <Section background="midnight" spacing="normal" className="pb-24">
        <PageContainer>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-4">
                Institutional Access
              </h2>
              <p className="text-[var(--color-text-secondary)]">
                Literary Contributors may request consideration for inclusion within the SufiPulse editorial structure. Admission is evaluated on thematic alignment and intellectual depth.
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Link href="/literary-contributors/apply" className="w-full md:w-auto">
                <PrimaryButton className="w-full md:w-auto min-w-[240px]">
                  Apply as Ahl-e-Tahreer
                </PrimaryButton>
              </Link>
              <Link href="/literary-journal" className="w-full md:w-auto">
                <PrimaryButton variant="outline" className="w-full md:w-auto min-w-[240px]">
                  View Literary Journal
                </PrimaryButton>
              </Link>
            </div>

            <div className="mt-16 pt-8 border-t border-[var(--color-text-tertiary)]/10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[var(--color-gold)]" />
                <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">Constitutional Alignment Mandatory</span>
              </div>
              <Link href="/governance" className="text-[var(--text-sm)] text-[var(--color-gold)] hover:underline font-medium">
                View Governance Framework →
              </Link>
            </div>
          </div>
        </PageContainer>
      </Section>
    </Layout>
  );
}
