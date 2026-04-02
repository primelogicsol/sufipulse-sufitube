"use client";
import { Shield, FileCheck, Building2, ArrowRight, CircleCheck as CheckCircle2, BookOpen } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { useRef } from 'react';
import Link from 'next/link';

export default function GovernanceOverview() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const governanceLayers = [
        {
            id: 'mithaq',
            icon: BookOpen,
            title: 'Mithaq',
            subtitle: 'Constitutional Charter',
            description: 'Foundational document defining institutional purpose, ethical alignment, and long-term continuity.',
            link: '/governance/mithaq'
        },
        {
            id: 'editorial',
            icon: FileCheck,
            title: 'Majlis-e-Nazr',
            subtitle: 'Editorial Council',
            description: 'Content authorization. Governs kalam review, thematic coherence, and approval for production.',
            link: '/governance/majlis-e-nazr'
        },
        {
            id: 'production',
            icon: Building2,
            title: 'Production Oversight',
            subtitle: 'Studio Integration',
            description: 'Technical compliance oversight, validation authority, and structured production sequencing.',
            link: '/governance/production-oversight'
        },
        {
            id: 'registry',
            icon: Shield,
            title: 'Diwan-e-Amanat',
            subtitle: 'Registry Authority',
            description: 'Final institutional lock. Credit confirmation, royalty allocation, and publication authorization.',
            link: '/governance/diwan-e-amanat'
        }
    ];

    const authorityFlow = [
        'Mithaq Foundation',
        'Editorial Approval',
        'Production Oversight',
        'Registry Authorization',
        'Public Release'
    ];

    const alignmentRequirements = [
        {
            title: 'Respect for review',
            description: 'Editorial process is preserved'
        },
        {
            title: 'Acceptance of structured progression',
            description: 'Creative path is followed'
        },
        {
            title: 'Identity verification',
            description: 'Contributors are documented'
        },
        {
            title: 'Adherence to institutional charter',
            description: 'Mission alignment is sustained'
        }
    ];

    return (
        <Layout>
            <Section className="pt-24 pb-8">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Governance
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
                            Institutional Framework
                        </p>

                        <div className="mt-8 max-w-3xl">
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse operates through defined authority, documented process, and structured creative progression. Governance is not restriction. It is alignment.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            The Four Governing Layers
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 leading-relaxed mb-6">
                                Authority flows sequentially through four institutional layers. Each layer validates the previous and prepares for the next.
                            </p>

                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                {governanceLayers.map((layer) => {
                                    const Icon = layer.icon;
                                    return (
                                        <Link
                                            key={layer.id}
                                            href={layer.link}
                                            className="flex items-start gap-3 group"
                                        >
                                            <Icon className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-white font-medium text-sm mb-0.5 group-hover:text-amber-400 transition-colors">
                                                    {layer.title}
                                                </p>
                                                <p className="text-amber-400/70 text-xs mb-1">
                                                    {layer.subtitle}
                                                </p>
                                                <p className="text-neutral-400 text-xs leading-relaxed">
                                                    {layer.description}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <div className="hidden lg:block">
                                <div
                                    ref={scrollContainerRef}
                                    className="flex items-start gap-2 overflow-x-auto scrollbar-hide"
                                >
                                    {authorityFlow.map((stage, idx) => (
                                        <div key={idx} className="flex items-center">
                                            <div className="flex flex-col items-start min-w-[140px]">
                                                <div className="w-10 h-10 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mb-2">
                                                    <span className="text-amber-400 font-bold text-sm">{idx + 1}</span>
                                                </div>
                                                <p className="text-left text-xs text-neutral-300 leading-tight">
                                                    {stage}
                                                </p>
                                            </div>

                                            {idx < authorityFlow.length - 1 && (
                                                <ArrowRight className="w-4 h-4 text-amber-400/40 mx-1 flex-shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:hidden space-y-2">
                                {authorityFlow.map((stage, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                                            <span className="text-amber-400 font-bold text-xs">{idx + 1}</span>
                                        </div>
                                        <p className="text-neutral-300 text-sm">{stage}</p>
                                    </div>
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
                            Royalty & Credit Transparency
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 leading-relaxed mb-4">
                                Royalty participation is defined before release. Contributors review and acknowledge allocation structures. Registry confirmation precedes publication.
                            </p>
                            <p className="text-neutral-300 leading-relaxed">
                                Documentation is preserved within the archive. Transparency is procedural, not promotional.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Contributor Alignment
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 leading-relaxed mb-6">
                                Participation in SufiPulse implies:
                            </p>

                            <div className="grid md:grid-cols-2 gap-4">
                                {alignmentRequirements.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-white font-medium text-sm mb-1">{item.title}</p>
                                            <p className="text-neutral-400 text-xs leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 leading-relaxed text-sm">
                                Alignment is not demanded. It is understood before entry.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 pb-24">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Audit & Continuity
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 leading-relaxed mb-4">
                                Each release passes through documented status transitions. No release appears within the archive without registry confirmation.
                            </p>
                            <p className="text-neutral-300 leading-relaxed">
                                Institutional memory is maintained deliberately. Continuity ensures that what is created today remains accountable tomorrow.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
