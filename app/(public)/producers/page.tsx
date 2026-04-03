"use client";
import { Music2, Layers, Users, ArrowRight, Shield, CircleCheck as CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
// import { roleDisplayMap } from '../../../lib/roleDisplayMap';
// import { Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { ProducerCredentialsForm } from '../../components/producers/ProducerCredentialsForm';
import Link from 'next/link';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';

export default function Producers() {
    const workflowScrollRef = useRef<HTMLDivElement>(null);
    const [showCredentialsForm, setShowCredentialsForm] = useState(false);

    useEffect(() => {
        if (window.location.hash === '#apply') {
            setShowCredentialsForm(true);
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
    const producerResponsibilities = [
        {
            icon: Music2,
            title: 'Musical Structuring',
            description: 'Composition architecture aligned with approved kalam and vocal interpretation.'
        },
        {
            icon: Layers,
            title: 'Sonic Direction',
            description: 'Instrumentation, arrangement, and tonal balance under centralized oversight.'
        },
        {
            icon: Users,
            title: 'Collaborative Alignment',
            description: 'Coordination with vocalists and studio to maintain production integrity.'
        },
        {
            icon: CheckCircle2,
            title: 'Pre-Production Review',
            description: 'Structural validation before studio scheduling and recording allocation.'
        }
    ];

    return (
        <Layout>
            <Section className="pt-24 pb-8">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Producers
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
                            {roleDisplayMap.engineer.mystical}
                        </p>

                        <div className="mt-8 max-w-3xl">
                            <p className="text-neutral-300 leading-relaxed">
                                Producers operate as musical architects within the SufiPulse framework. They structure composition, direct sonic development, and ensure alignment with approved kalam before studio execution.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Producer Mandate & Role Definition
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 leading-relaxed mb-6">
                                The Producer operates after kalam approval and before studio recording. No musical structure proceeds without documented alignment with approved content and assigned vocalists.
                            </p>

                            <div className="grid md:grid-cols-2 gap-4">
                                {producerResponsibilities.map((item, idx) => {
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
                                        Producers receive approved kalam with assigned vocalist information.
                                    </p>
                                    <p className="text-neutral-300 text-sm leading-relaxed mb-2">
                                        Musical composition respects textual integrity and interpretive direction.
                                    </p>
                                    <p className="text-neutral-300 text-sm leading-relaxed">
                                        Instrumentation and arrangement decisions operate within documented guidelines.
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
                                            <p className="text-neutral-300 text-sm">Vocalists provide interpretive direction</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                            <p className="text-neutral-300 text-sm">Producers structure musical framework</p>
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
                                    Producers do not independently select content, assign vocalists, or authorize publication. Musical direction operates within approved assignments and institutional oversight.
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
                                        <p className="text-neutral-300 text-xs font-medium">Kalam Approval</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-amber-400/30 flex-shrink-0" />
                                <div className="min-w-[140px]">
                                    <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                        <p className="text-neutral-300 text-xs font-medium">Vocalist Assignment</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-amber-400/30 flex-shrink-0" />
                                <div className="min-w-[140px]">
                                    <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-3">
                                        <p className="text-amber-400 text-xs font-semibold">Musical Structuring</p>
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
                                <p className="text-neutral-300 text-xs font-medium">Kalam Approval</p>
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
                            <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-3">
                                <p className="text-amber-400 text-xs font-semibold">Musical Structuring</p>
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
                            Each stage operates under documented coordination.
                        </p>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Production Role & Structural Alignment
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <p className="text-white font-semibold mb-4">Role in Workflow</p>

                                <p className="text-neutral-300 text-sm leading-relaxed mb-4">
                                    Producers operate between approved kalam and studio execution.
                                </p>

                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Musical structuring</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Arrangement design</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Vocal direction coordination</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Composition framework prior to recording</p>
                                    </div>
                                </div>

                                <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-3 mt-4">
                                    <p className="text-neutral-400 text-xs leading-relaxed">
                                        Final mixing and mastering remain under studio oversight.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <p className="text-white font-semibold mb-4">Eligibility & Onboarding</p>

                                <p className="text-neutral-300 text-sm leading-relaxed mb-4">
                                    Producers may request inclusion within the SufiPulse creative structure. Admission is evaluated on musical competence and governance alignment.
                                </p>

                                <p className="text-white text-xs font-medium mb-2">Requirements:</p>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Demonstrated compositional capability</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Structural understanding of vocal arrangement</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Alignment with approved kalam workflow</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Acceptance of collaborative production model</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowCredentialsForm(!showCredentialsForm)}
                                    className="w-full bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                                >
                                    {showCredentialsForm ? 'Hide Application Form' : 'Apply as Producer'}
                                </button>
                            </div>
                        </div>

                        {showCredentialsForm && (
                            <div id="apply-form" className="mt-8">
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    Producer Eligibility & Consideration
                                </h3>
                                <p className="text-lg text-amber-400 mb-4">Ahl-e-Naghma</p>
                                <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                                    Producers may request consideration for inclusion within the SufiPulse production structure.<br />
                                    Submissions are reviewed for musical competence and governance alignment.
                                </p>
                                <ProducerCredentialsForm />
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
                                    <p className="text-neutral-300 text-sm">Musical alignment with approved kalam</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Coordination with assigned vocalist</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Pre-studio structural validation</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Documented production decisions</p>
                                </div>
                            </div>

                            <div className="border border-neutral-800/50 rounded-lg p-4 mb-4">
                                <p className="text-neutral-300 text-sm leading-relaxed">
                                    Producers do not independently commission content, select vocalists, or authorize releases. All musical direction operates within assigned workflow and institutional governance.
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
