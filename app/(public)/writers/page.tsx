"use client";
import { Feather, BookOpen, Users, ArrowRight, Shield, CircleCheck as CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { roleDisplayMap } from '../../components/lib/roleDisplayMap';
// import { Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { WriterCredentialsForm } from '../../components/writers/WriterCredentialsForm';
import Link from 'next/link';

export default function Writers() {
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
      workflowScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollWorkflowRight = () => {
    if (workflowScrollRef.current) {
      workflowScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const writerResponsibilities = [
    {
      icon: Feather,
      title: 'Text Origination',
      description: 'Original composition aligned with institutional ethos.'
    },
    {
      icon: BookOpen,
      title: 'Thematic Integrity',
      description: 'Conceptual coherence and disciplined expression.'
    },
    {
      icon: Users,
      title: 'Structural Readiness',
      description: 'Clear stanza flow suitable for vocal assignment.'
    },
    {
      icon: CheckCircle2,
      title: 'Editorial Alignment',
      description: 'Pre-production review under Majlis-e-Nazr oversight.'
    }
  ];

  return (
    <Layout>
      <Section className="pt-48 pb-8">
        <PageContainer>
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold text-white mb-2">
              Writers
            </h1>
            <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
              {roleDisplayMap.writer.mystical}
            </p>

            <div className="mt-8 max-w-3xl">
              <p className="text-neutral-300 leading-relaxed">
                Writers originate kalam within the SufiPulse institutional framework. All submissions enter structured editorial review before production consideration.
              </p>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section className="py-12">
        <PageContainer>
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              Writer Mandate & Role Definition
            </h2>

            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
              <p className="text-neutral-300 leading-relaxed mb-6">
                The Writer operates before musical structuring and studio allocation. No kalam enters production without documented editorial alignment.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {writerResponsibilities.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-white font-medium text-sm mb-1">{item.title}</p>
                        <p className="text-neutral-400 text-xs leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section className="py-12">
        <PageContainer>
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              Operational Framework
            </h2>

            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-white font-medium mb-3">Structural Discipline</p>
                  <p className="text-neutral-300 text-sm leading-relaxed mb-2">
                    Writers submit original kalam for documented review.
                  </p>
                  <p className="text-neutral-300 text-sm leading-relaxed mb-2">
                    Textual structure respects linguistic precision and clarity.
                  </p>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    Submission format follows institutional guidelines.
                  </p>
                </div>

                <div>
                  <p className="text-white font-medium mb-3">Collaborative Position</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <p className="text-neutral-300 text-sm">Writers originate kalam</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <p className="text-neutral-300 text-sm">Editorial Council reviews</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <p className="text-neutral-300 text-sm">Vocalists interpret</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <p className="text-neutral-300 text-sm">Producers structure musically</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <p className="text-neutral-300 text-sm">Studio executes recording</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-linear-to-r from-transparent via-amber-400/20 to-transparent my-6" />

              <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-4">
                <p className="text-neutral-300 text-sm leading-relaxed">
                  Writers do not independently assign vocalists, authorize publication, or enter production without editorial clearance.
                </p>
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section className="py-12">
        <PageContainer>
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              Production Workflow Position
            </h2>

            <div className="hidden lg:block">
              <div
                ref={workflowScrollRef}
                className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-2 mb-3"
              >
                <div className="min-w-35">
                  <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-3">
                    <p className="text-amber-400 text-xs font-semibold">Kalam Submission</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400/30 shrink-0" />
                <div className="min-w-35">
                  <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                    <p className="text-neutral-300 text-xs font-medium">Editorial Review</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400/30 shrink-0" />
                <div className="min-w-35">
                  <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                    <p className="text-neutral-300 text-xs font-medium text-nowrap">Vocalist Assignment</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400/30 shrink-0" />
                <div className="min-w-35">
                  <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                    <p className="text-neutral-300 text-xs font-medium">Musical Structuring</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400/30 shrink-0" />
                <div className="min-w-35">
                  <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                    <p className="text-neutral-300 text-xs font-medium">Studio Recording</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400/30 shrink-0" />
                <div className="min-w-35">
                  <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                    <p className="text-neutral-300 text-xs font-medium">Master Validation</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400/30 shrink-0" />
                <div className="min-w-35">
                  <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                    <p className="text-neutral-300 text-xs font-medium text-nowrap">Registry Authorization</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={scrollWorkflowLeft}
                  className="w-8 h-8 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4 text-neutral-400" />
                </button>
                <button
                  onClick={scrollWorkflowRight}
                  className="w-8 h-8 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
            </div>

            <div className="lg:hidden space-y-2">
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-3">
                <p className="text-amber-400 text-xs font-semibold">Kalam Submission</p>
              </div>
              <div className="flex">
                <ArrowRight className="w-4 h-4 text-amber-400/30 rotate-90" />
              </div>
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                <p className="text-neutral-300 text-xs font-medium">Editorial Review</p>
              </div>
              <div className="flex">
                <ArrowRight className="w-4 h-4 text-amber-400/30 rotate-90" />
              </div>
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                <p className="text-neutral-300 text-xs font-medium">Vocalist Assignment</p>
              </div>
              <div className="flex">
                <ArrowRight className="w-4 h-4 text-amber-400/30 rotate-90" />
              </div>
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                <p className="text-neutral-300 text-xs font-medium">Musical Structuring</p>
              </div>
              <div className="flex">
                <ArrowRight className="w-4 h-4 text-amber-400/30 rotate-90" />
              </div>
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                <p className="text-neutral-300 text-xs font-medium">Studio Recording</p>
              </div>
              <div className="flex">
                <ArrowRight className="w-4 h-4 text-amber-400/30 rotate-90" />
              </div>
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                <p className="text-neutral-300 text-xs font-medium">Master Validation</p>
              </div>
              <div className="flex">
                <ArrowRight className="w-4 h-4 text-amber-400/30 rotate-90" />
              </div>
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                <p className="text-neutral-300 text-xs font-medium">Registry Authorization</p>
              </div>
            </div>

            <p className="text-neutral-400 text-xs mt-4">
              Each stage operates under documented institutional coordination.
            </p>
          </div>
        </PageContainer>
      </Section>

      <Section className="py-12">
        <PageContainer>
          <div id="submission" className="max-w-4xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              Submission & Structural Alignment
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                <p className="text-white font-semibold mb-4">Role in Workflow</p>

                <p className="text-neutral-300 text-sm leading-relaxed mb-4">
                  Writers operate at the origin of the production chain.
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <p className="text-neutral-300 text-sm">Original kalam composition</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <p className="text-neutral-300 text-sm">Thematic coherence</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <p className="text-neutral-300 text-sm">Linguistic discipline</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <p className="text-neutral-300 text-sm">Structured stanza integrity</p>
                  </div>
                </div>

                <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-3 mt-4">
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    Editorial review precedes all production allocation.
                  </p>
                </div>
              </div>

              <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                <p className="text-white font-semibold mb-4">Eligibility & Submission</p>

                <p className="text-neutral-300 text-sm leading-relaxed mb-4">
                  Writers may request institutional consideration through formal submission.
                </p>

                <p className="text-white text-xs font-medium mb-2">Requirements:</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <p className="text-neutral-300 text-sm">Original authorship</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <p className="text-neutral-300 text-sm">Structured format</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <p className="text-neutral-300 text-sm">Linguistic precision</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <p className="text-neutral-300 text-sm">Alignment with charter principles</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <p className="text-neutral-300 text-sm">Acceptance of editorial governance</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowApplicationForm(!showApplicationForm)}
                  className="w-full bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  {showApplicationForm ? 'Hide Application Form' : 'Apply as Writer'}
                </button>
              </div>
            </div>

            {showApplicationForm && (
              <div id="apply-form" className="mt-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Writer Eligibility & Consideration
                </h3>
                <p className="text-lg text-amber-400 mb-4">Ahl-e-Qalam</p>
                <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                  Writers may request consideration for inclusion within the SufiPulse editorial structure.<br />
                  Submissions are reviewed for thematic alignment and structural readiness.
                </p>
                <WriterCredentialsForm />
              </div>
            )}
          </div>
        </PageContainer>
      </Section>

      <Section className="py-12 pb-20">
        <PageContainer>
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              Structural Boundaries
            </h2>

            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <p className="text-neutral-300 text-sm">Editorial clearance required</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <p className="text-neutral-300 text-sm">No self-publication authority</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <p className="text-neutral-300 text-sm">Textual integrity verification</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <p className="text-neutral-300 text-sm">No production bypass</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <p className="text-neutral-300 text-sm">Documented revision cycle</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <p className="text-neutral-300 text-sm">Governance alignment mandatory</p>
                </div>
              </div>

              <div className="border border-neutral-800/50 rounded-lg p-4 mb-4">
                <p className="text-neutral-300 text-sm leading-relaxed">
                  Origination does not equal publication. All kalam operates within institutional review.
                </p>
              </div>

              <div className="mt-6">
                <Link
                  href="/governance"
                  className="inline-flex items-center gap-2 text-neutral-300 hover:text-amber-400 transition-colors text-xs"
                >
                  <Shield className="w-3.5 h-3.5" />
                  View Governance Framework
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>
    </Layout>
  );
}
