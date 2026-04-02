"use client"
import { Mic, Music, Users, ArrowRight, Shield, CircleCheck as CheckCircle2, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
// import { roleDisplayMap } from '../../../lib/roleDisplayMap';
// import { Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { VocalistCredentialsForm } from '../../components/vocalists/VocalistCredentialsForm';
import Link from 'next/link';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';

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
      workflowScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollWorkflowRight = () => {
    if (workflowScrollRef.current) {
      workflowScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
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

  return (
    <Layout>
      <Section className="pt-24 pb-8">
        <PageContainer>
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold text-white mb-2">
              Vocalists
            </h1>
            <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
              {roleDisplayMap.vocalist.mystical}
            </p>

            <div className="mt-8 max-w-3xl">
              <p className="text-neutral-300 leading-relaxed">
                Vocalists interpret approved kalam within the SufiPulse production framework. Assignment follows editorial clearance and precedes musical structuring.
              </p>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section className="py-12">
        <PageContainer>
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              Vocalist Mandate & Role Definition
            </h2>

            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
              <p className="text-neutral-300 leading-relaxed mb-6">
                The Vocalist operates after editorial approval and before musical production. No vocal performance proceeds without documented kalam assignment and producer coordination.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {vocalistResponsibilities.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
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
                    Vocalists receive assigned kalam after editorial approval.
                  </p>
                  <p className="text-neutral-300 text-sm leading-relaxed mb-2">
                    Vocal interpretation respects textual integrity and thematic intent.
                  </p>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    Studio delivery operates within producer and engineer coordination.
                  </p>
                </div>

                <div>
                  <p className="text-white font-medium mb-3">Collaborative Position</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <p className="text-neutral-300 text-sm">Writers provide approved kalam</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <p className="text-neutral-300 text-sm">Editorial Council assigns vocalist</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <p className="text-neutral-300 text-sm">Vocalists deliver interpretation</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <p className="text-neutral-300 text-sm">Producers structure musically</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <p className="text-neutral-300 text-sm">Studio executes recording</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

              <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-4">
                <p className="text-neutral-300 text-sm leading-relaxed">
                  Vocalists do not independently select kalam, authorize production, or bypass studio protocol. Performance operates within assigned framework.
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
                <div className="min-w-[140px]">
                  <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                    <p className="text-neutral-300 text-xs font-medium">Kalam Submission</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400/30 flex-shrink-0" />
                <div className="min-w-[140px]">
                  <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                    <p className="text-neutral-300 text-xs font-medium">Editorial Review</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400/30 flex-shrink-0" />
                <div className="min-w-[140px]">
                  <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-3">
                    <p className="text-amber-400 text-xs font-semibold">Vocalist Assignment</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400/30 flex-shrink-0" />
                <div className="min-w-[140px]">
                  <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                    <p className="text-neutral-300 text-xs font-medium">Musical Structuring</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400/30 flex-shrink-0" />
                <div className="min-w-[140px]">
                  <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                    <p className="text-neutral-300 text-xs font-medium">Studio Recording</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400/30 flex-shrink-0" />
                <div className="min-w-[140px]">
                  <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                    <p className="text-neutral-300 text-xs font-medium">Master Validation</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400/30 flex-shrink-0" />
                <div className="min-w-[140px]">
                  <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                    <p className="text-neutral-300 text-xs font-medium">Registry Authorization</p>
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
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                <p className="text-neutral-300 text-xs font-medium">Kalam Submission</p>
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
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-3">
                <p className="text-amber-400 text-xs font-semibold">Vocalist Assignment</p>
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
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              Performance & Structural Alignment
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                <p className="text-white font-semibold mb-4">Role in Workflow</p>

                <p className="text-neutral-300 text-sm leading-relaxed mb-4">
                  Vocalists operate between editorial approval and musical production.
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <p className="text-neutral-300 text-sm">Vocal interpretation of assigned kalam</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <p className="text-neutral-300 text-sm">Spiritual and expressive delivery</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <p className="text-neutral-300 text-sm">Producer collaboration</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <p className="text-neutral-300 text-sm">Studio recording coordination</p>
                  </div>
                </div>

                <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-3 mt-4">
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    Performance integrity maintained through institutional oversight.
                  </p>
                </div>
              </div>

              <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                <p className="text-white font-semibold mb-4">Eligibility & Consideration</p>

                <p className="text-neutral-300 text-sm leading-relaxed mb-4">
                  Vocalists may request inclusion within the SufiPulse performance network. Admission is evaluated on vocal capability and governance alignment.
                </p>

                <p className="text-white text-xs font-medium mb-2">Requirements:</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <p className="text-neutral-300 text-sm">Demonstrated vocal proficiency</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <p className="text-neutral-300 text-sm">Understanding of devotional expression</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <p className="text-neutral-300 text-sm">Alignment with assigned kalam workflow</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <p className="text-neutral-300 text-sm">Acceptance of production governance</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowApplicationForm(!showApplicationForm)}
                  className="w-full bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  {showApplicationForm ? 'Hide Form' : 'Submit Vocalist Profile'}
                </button>
              </div>
            </div>

            {showApplicationForm && (
              <div id="apply-form" className="mt-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Vocalist Eligibility & Consideration
                </h3>
                <p className="text-lg text-amber-400 mb-4">Ahl-e-Sada</p>
                <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                  Vocalists may request consideration for inclusion within the SufiPulse performance structure.<br />
                  Submissions are reviewed for vocal competence and devotional alignment.
                </p>
                <VocalistCredentialsForm />
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
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <p className="text-neutral-300 text-sm">Assignment through editorial clearance</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <p className="text-neutral-300 text-sm">No independent kalam selection</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <p className="text-neutral-300 text-sm">Producer coordination required</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <p className="text-neutral-300 text-sm">No publication authorization</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <p className="text-neutral-300 text-sm">Studio protocol adherence</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <p className="text-neutral-300 text-sm">Governance alignment mandatory</p>
                </div>
              </div>

              <div className="border border-neutral-800/50 rounded-lg p-4 mb-4">
                <p className="text-neutral-300 text-sm leading-relaxed">
                  Performance does not equal publication. All vocal delivery operates within institutional oversight and production coordination.
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
