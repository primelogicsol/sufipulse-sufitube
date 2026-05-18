"use client";
import { Pen, BookOpen, Users, ArrowRight, Shield, CircleCheck as CheckCircle2, ChevronLeft, ChevronRight, FileText, Compass, Sparkles, Library } from 'lucide-react';
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
      <Section background="midnight" spacing="spacious">
        <PageContainer>
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <Badge variant="gold">Creative Division</Badge>
            </div>
            <h1 className="text-[var(--text-4xl)] md:text-[64px] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight">
              Literary Contributors
            </h1>
            <p className="text-[var(--text-xl)] text-[var(--color-gold)] font-medium mb-10 tracking-wide uppercase">
              Ahl-e-Tahreer
            </p>
            <p className="text-[var(--text-lg)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto">
              Ahl-e-Tahreer represents contributors who engage through reflective writing, essays, spiritual commentary, and analytical discourse independent of musical production.
            </p>
          </div>
        </PageContainer>
      </Section>

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
                <button className="w-full md:w-auto min-w-[240px] px-8 py-3.5 border-2 border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold-muted)] rounded-[var(--radius-sm)] transition-all font-medium uppercase tracking-wider">
                  View Literary Journal
                </button>
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
