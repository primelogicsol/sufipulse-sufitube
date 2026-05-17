"use client"
import { Mic, Music, Users, ArrowRight, Shield, CircleCheck as CheckCircle2, ChevronLeft, ChevronRight, Heart, FileCheck, Disc3, CheckCircle } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Badge } from '../../components/primitives/Badge';
import { PrimaryButton } from '../../components/primitives/PrimaryButton';
import { Card } from '../../components/primitives/Card';
import { roleDisplayMap } from '../../components/lib/roleDisplayMap';
import { useRef, useState, useEffect } from 'react';
import { VocalistCredentialsForm } from '../../components/vocalists/VocalistCredentialsForm';
import Link from 'next/link';

export default function Vocalists() {
  const workflowScrollRef = useRef<HTMLDivElement>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#apply') {
      setShowApplicationForm(true);
      setTimeout(() => {
        document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

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

  const vocalistResponsibilities = [
    {
      icon: Mic,
      title: 'Vocal Interpretation',
      description: 'Transforming approved kalam into expressive vocal performance.'
    },
    {
      icon: Heart,
      title: 'Spiritual Presence',
      description: 'Embodying devotional intent through disciplined vocal delivery.'
    },
    {
      icon: Music,
      title: 'Musical Collaboration',
      description: 'Working with producers to align vocal tone with compositional vision.'
    },
    {
      icon: CheckCircle2,
      title: 'Performance Integrity',
      description: 'Studio delivery aligned with assigned kalam and production framework.'
    }
  ];

  const workflowStages = [
    { id: 1, title: 'Kalam Submission', desc: 'Writers submit original works' },
    { id: 2, title: 'Editorial Review', desc: 'Thematic and linguistic alignment' },
    { id: 3, title: 'Vocalist Assignment', desc: 'Matching voice to sacred text' },
    { id: 4, title: 'Musical Structuring', desc: 'Thematic composition' },
    { id: 5, title: 'Studio Recording', desc: 'Master-grade capture' },
    { id: 6, title: 'Master Validation', desc: 'Technical quality check' },
    { id: 7, title: 'Registry Authorization', desc: 'Final institutional lock' }
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
              Vocalists
            </h1>
            <p className="text-[var(--text-xl)] text-[var(--color-gold)] font-medium mb-10 tracking-wide uppercase">
              {roleDisplayMap.vocalist.mystical}
            </p>
            <p className="text-[var(--text-lg)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto">
              Vocalists interpret approved kalam within the SufiPulse production framework. Assignment follows editorial clearance and precedes musical structuring.
            </p>
          </div>
        </PageContainer>
      </Section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <div className="mb-12 text-center md:text-left">
              <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-4">
                Vocalist Mandate & Role Definition
              </h2>
              <p className="text-[var(--color-text-secondary)] max-w-2xl">
                The Vocalist operates after editorial approval and before musical production. No vocal performance proceeds without documented kalam assignment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {vocalistResponsibilities.map((item, idx) => (
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
                Production Lifecycle Position
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
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 font-bold ${stage.id === 3 ? 'bg-[var(--color-gold)] text-[var(--color-midnight)]' : 'bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 text-[var(--color-gold)]'}`}>
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
                  <Mic className="w-5 h-5 text-[var(--color-gold)]" /> Structural Discipline
                </h3>
                <ul className="space-y-4">
                  {[
                    'Vocalists receive assigned kalam after editorial approval',
                    'Vocal interpretation respects textual integrity',
                    'Studio delivery operates within producer coordination'
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
                    { label: 'Writers', desc: 'Provide approved kalam' },
                    { label: 'Editorial Council', desc: 'Assigns Vocalist' },
                    { label: 'Vocalists', desc: 'Deliver Interpretation' },
                    { label: 'Studio', desc: 'Executes Recording' }
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
                "Vocalists do not independently select kalam, authorize production, or bypass studio protocol. Performance operates within assigned framework."
              </p>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section background="midnight" spacing="normal" className="pb-24">
        <PageContainer>
          <div className="max-w-4xl mx-auto">
            <div id="apply-form" className="text-center mb-12">
              <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-4">
                Institutional Access
              </h2>
              <p className="text-[var(--color-text-secondary)]">
                Vocalists may request inclusion within the SufiPulse performance network. Admission is evaluated on vocal capability and devotional alignment.
              </p>
            </div>

            <div className="flex flex-col items-center gap-8">
              <PrimaryButton 
                onClick={() => setShowApplicationForm(!showApplicationForm)}
                className="w-full md:w-auto min-w-[240px]"
              >
                {showApplicationForm ? 'Hide Application Form' : 'Apply as Vocalist'}
              </PrimaryButton>

              {showApplicationForm && (
                <Card className="w-full bg-[var(--color-slate)] border-[var(--color-border)] p-8">
                  <div className="mb-8 border-b border-[var(--color-border)] pb-6">
                    <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                      Vocalist Eligibility & Consideration
                    </h3>
                    <p className="text-[var(--color-gold)] font-medium">Ahl-e-Sada</p>
                  </div>
                  <VocalistCredentialsForm />
                </Card>
              )}
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

