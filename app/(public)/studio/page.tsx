"use client"
import { Mic as Mic2, Radio, CircleCheck as CheckCircle2, ArrowRight, Shield, MapPin, Building2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { DualNameHero } from '../../components/primitives/DualNameHero';
// import { roleDisplayMap } from '../../lib/roleDisplayMap';
import { useState, useRef } from 'react';
// import { Link } from 'react-router-dom';
import StudioCredentialsForm from '../../components/studio/StudioCredentialsForm';
import Link from 'next/link';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';

export default function Studio() {
    const [expandedStage, setExpandedStage] = useState<string | null>(null);
    const [networkApplicationExpanded, setNetworkApplicationExpanded] = useState(false);
    const [showCredentialsForm, setShowCredentialsForm] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const toggleStage = (stage: string) => {
        setExpandedStage(expandedStage === stage ? null : stage);
    };

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    const operationalScrollRef = useRef<HTMLDivElement>(null);

    const scrollOperationalLeft = () => {
        if (operationalScrollRef.current) {
            operationalScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollOperationalRight = () => {
        if (operationalScrollRef.current) {
            operationalScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    const productionPath = [
        { id: 'approval', title: 'Approved Kalam' },
        { id: 'alignment', title: 'Vocalist Alignment' },
        { id: 'composition', title: 'Composition Structuring' },
        { id: 'recording', title: 'Recording' },
        { id: 'mixing', title: 'Mixing' },
        { id: 'mastering', title: 'Mastering' },
        { id: 'registry', title: 'Registry Confirmation' }
    ];

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
            title: 'Technical Quality Control',
            description: 'Ensuring audio integrity, format compatibility, and sonic consistency.'
        },
        {
            icon: Shield,
            title: 'Metadata Preparation',
            description: 'Supporting Registry with technical documentation and file specifications.'
        }
    ];

    return (
        <Layout>
            <Section className="pt-24 pb-8">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Studio
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
                            {roleDisplayMap.studio.mystical}
                        </p>

                        <div className="mt-8 max-w-3xl">
                            <p className="text-neutral-300 leading-relaxed">
                                The Studio operates after editorial approval and before registry authorization. It is responsible for recording, technical quality, and master validation across the SufiPulse network.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Studio Mandate & Production Path
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 leading-relaxed mb-6">
                                The Studio operates after editorial approval. No recording begins without structured assignment.
                            </p>

                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                {studioResponsibilities.map((item, idx) => {
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

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <div className="hidden lg:block">
                                <div
                                    ref={scrollContainerRef}
                                    className="flex items-start gap-2 overflow-x-auto scrollbar-hide mb-3"
                                >
                                    {productionPath.map((stage, idx) => (
                                        <div key={idx} className="flex items-center">
                                            <button
                                                onClick={() => toggleStage(stage.id)}
                                                className="flex flex-col items-start group cursor-pointer min-w-[120px]"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mb-2 group-hover:bg-amber-400/20 transition-colors">
                                                    <span className="text-amber-400 font-bold text-sm">{idx + 1}</span>
                                                </div>
                                                <p className="text-left text-xs text-neutral-300 leading-tight group-hover:text-amber-400 transition-colors">
                                                    {stage.title}
                                                </p>
                                            </button>

                                            {idx < productionPath.length - 1 && (
                                                <ArrowRight className="w-4 h-4 text-amber-400/30 mx-1 flex-shrink-0 mt-4" />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={scrollLeft}
                                        className="w-8 h-8 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 transition-colors"
                                        aria-label="Scroll left"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-neutral-400" />
                                    </button>
                                    <button
                                        onClick={scrollRight}
                                        className="w-8 h-8 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 transition-colors"
                                        aria-label="Scroll right"
                                    >
                                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="lg:hidden space-y-2">
                                {productionPath.map((stage, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => toggleStage(stage.id)}
                                        className="flex items-start gap-3 w-full text-left group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-400/20 transition-colors">
                                            <span className="text-amber-400 font-bold text-xs">{idx + 1}</span>
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <p className="text-neutral-300 text-sm font-medium group-hover:text-amber-400 transition-colors">
                                                {stage.title}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Operational Discipline
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-white font-medium mb-3">Scheduling Principles</p>
                                    <p className="text-neutral-300 text-sm leading-relaxed mb-2">
                                        Studio time is allocated based on approved queue.
                                    </p>
                                    <p className="text-neutral-300 text-sm leading-relaxed mb-2">
                                        Sessions follow structured scheduling.
                                    </p>
                                    <p className="text-neutral-300 text-sm leading-relaxed">
                                        Revisions are documented before final mastering.
                                    </p>
                                </div>

                                <div>
                                    <p className="text-white font-medium mb-3">Collaboration Chain</p>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                            {/* <p className="text-neutral-300 text-sm">Writers ({roleDisplayMap.writer.mystical})</p> */}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                            {/* <p className="text-neutral-300 text-sm">Vocalists ({roleDisplayMap.vocalist.mystical})</p> */}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                            {/* <p className="text-neutral-300 text-sm">Producers ({roleDisplayMap.engineer.mystical})</p> */}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                            {/* <p className="text-neutral-300 text-sm">Studio ({roleDisplayMap.studio.mystical})</p> */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Studio Network Architecture
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <MapPin className="w-5 h-5 text-amber-400" />
                                    <p className="text-white font-semibold">Central Studio</p>
                                </div>
                                <p className="text-neutral-400 text-sm mb-4">USA — Virginia</p>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Production oversight</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Final master validation</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Registry coordination</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <MapPin className="w-5 h-5 text-amber-400" />
                                    <p className="text-white font-semibold">Remote Studios</p>
                                </div>
                                <div className="flex gap-3 mb-4">
                                    <span className="text-neutral-400 text-xs">Canada</span>
                                    <span className="text-neutral-600">•</span>
                                    <span className="text-neutral-400 text-xs">UAE</span>
                                    <span className="text-neutral-600">•</span>
                                    <span className="text-neutral-400 text-xs">India</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Regional recording</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Centralized review</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Governance alignment</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-6">
                            <p className="text-neutral-300 text-sm leading-relaxed mb-2">
                                Recording within the SufiPulse Studio Network is reserved for works authored by approved writers (Ahl-e-Qalam) and performed by approved vocalists (Ahl-e-Sada).
                            </p>
                            <p className="text-neutral-400 text-sm leading-relaxed">
                                Regional flexibility does not alter governance standards.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Operational Workflow & Network Participation
                        </h2>

                        <div className="hidden lg:block">
                            <div
                                ref={operationalScrollRef}
                                className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-2 mb-3"
                            >
                                <div className="min-w-[140px]">
                                    <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                        <p className="text-neutral-300 text-xs font-medium">Approved Kalam</p>
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
                                    <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                        <p className="text-neutral-300 text-xs font-medium">Network Allocation</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-amber-400/30 flex-shrink-0" />
                                <div className="min-w-[140px]">
                                    <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                        <p className="text-neutral-300 text-xs font-medium">Recording</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-amber-400/30 flex-shrink-0" />
                                <div className="min-w-[140px]">
                                    <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-3">
                                        <p className="text-amber-400 text-xs font-semibold">Central Review</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-amber-400/30 flex-shrink-0" />
                                <div className="min-w-[140px]">
                                    <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                        <p className="text-neutral-300 text-xs font-medium">Master Confirmation</p>
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
                                    onClick={scrollOperationalLeft}
                                    className="w-8 h-8 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 transition-colors"
                                    aria-label="Scroll left"
                                >
                                    <ChevronLeft className="w-4 h-4 text-neutral-400" />
                                </button>
                                <button
                                    onClick={scrollOperationalRight}
                                    className="w-8 h-8 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 transition-colors"
                                    aria-label="Scroll right"
                                >
                                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                                </button>
                            </div>
                        </div>

                        <div className="lg:hidden space-y-2">
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                <p className="text-neutral-300 text-xs font-medium">Approved Kalam</p>
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
                                <p className="text-neutral-300 text-xs font-medium">Network Allocation</p>
                            </div>
                            <div className="flex">
                                <ArrowRight className="w-4 h-4 text-amber-400/30 rotate-90" />
                            </div>
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                <p className="text-neutral-300 text-xs font-medium">Recording</p>
                            </div>
                            <div className="flex">
                                <ArrowRight className="w-4 h-4 text-amber-400/30 rotate-90" />
                            </div>
                            <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-3">
                                <p className="text-amber-400 text-xs font-semibold">Central Review</p>
                            </div>
                            <div className="flex">
                                <ArrowRight className="w-4 h-4 text-amber-400/30 rotate-90" />
                            </div>
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                <p className="text-neutral-300 text-xs font-medium">Master Confirmation</p>
                            </div>
                            <div className="flex">
                                <ArrowRight className="w-4 h-4 text-amber-400/30 rotate-90" />
                            </div>
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                <p className="text-neutral-300 text-xs font-medium">Registry Authorization</p>
                            </div>
                        </div>

                        <p className="text-neutral-400 text-xs mt-4">
                            All stages operate within coordinated oversight.
                        </p>

                        <div className="mt-8">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Network Studio Participation
                            </h3>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-5">
                                    <p className="text-white font-medium text-sm mb-3">Role in Workflow</p>
                                    <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                                        Network studios provide:
                                    </p>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-start gap-2">
                                            <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                            <p className="text-neutral-300 text-sm">Recording environment for assigned vocalists</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                            <p className="text-neutral-300 text-sm">Session execution under central scheduling</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                            <p className="text-neutral-300 text-sm">File delivery aligned with production protocol</p>
                                        </div>
                                    </div>

                                    <p className="text-white font-medium text-sm mb-2 mt-4">Operational Boundaries</p>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                            <p className="text-neutral-300 text-sm">No independent mixing or mastering</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                            <p className="text-neutral-300 text-sm">No direct publication authority</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                            <p className="text-neutral-300 text-sm">Central review precedes registry authorization</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-5">
                                    <p className="text-white font-medium text-sm mb-3">Network Studio Eligibility & Onboarding</p>
                                    <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                                        Studios may request inclusion within the SufiPulse production network. Admission is evaluated on technical readiness and governance alignment.
                                    </p>
                                    <p className="text-white font-medium text-sm mb-2 mt-4">Requirements</p>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                            <p className="text-neutral-300 text-sm">Demonstrated professional recording capability</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                            <p className="text-neutral-300 text-sm">Acoustic standards appropriate for master-grade capture</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                            <p className="text-neutral-300 text-sm">Alignment with documented production protocol</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                            <p className="text-neutral-300 text-sm">Acceptance of centralized review and validation process</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowCredentialsForm(!showCredentialsForm)}
                                className="w-full bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                            >
                                {showCredentialsForm ? 'Hide Form' : 'Submit Studio Credentials'}
                            </button>
                        </div>

                        {showCredentialsForm && (
                            <div className="mt-8">
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    Network Studio Eligibility & Consideration
                                </h3>
                                <p className="text-lg text-amber-400 mb-4">Karkhana-e-Sada</p>
                                <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                                    Studios may request inclusion within the SufiPulse production network.<br />
                                    Submissions are reviewed for technical readiness and governance alignment.
                                </p>
                                <StudioCredentialsForm />
                            </div>
                        )}
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 pb-20">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Final Compliance Statement
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Master format compliance</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Contributor confirmation</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Metadata verification</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Registry clearance</p>
                                </div>
                            </div>

                            <div className="border border-neutral-800/50 rounded-lg p-4 mb-4">
                                <p className="text-neutral-300 text-sm leading-relaxed">
                                    Network studios do not independently publish under the SufiPulse name. All recordings must originate from approved writers and approved vocalists and follow documented workflow before registry authorization.
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
