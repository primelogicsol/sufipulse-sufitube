"use client";
import { Shield, FileCheck, Building2, ArrowRight, CircleCheck as CheckCircle2, BookOpen, Scale, History, Gavel } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Badge } from '../../components/primitives/Badge';
import { Card } from '../../components/primitives/Card';
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
            icon: FileCheck,
            title: 'Respect for review',
            description: 'The editorial process is absolute and preserved throughout the lifecycle.'
        },
        {
            icon: Scale,
            title: 'Structured progression',
            description: 'The creative path follows institutional protocols without deviation.'
        },
        {
            icon: History,
            title: 'Identity verification',
            description: 'All contributors are documented and verified within the registry.'
        },
        {
            icon: Gavel,
            title: 'Institutional charter',
            description: 'Mission alignment is sustained through continuous oversight.'
        }
    ];

    return (
        <Layout>
            <Section background="midnight" spacing="spacious">
                <PageContainer>
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="mb-6">
                            <Badge variant="gold">Institutional Framework</Badge>
                        </div>
                        <h1 className="text-[var(--text-4xl)] md:text-[64px] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight">
                            Governance
                        </h1>
                        <p className="text-[var(--text-xl)] text-[var(--color-gold)] font-medium mb-10 tracking-wide uppercase">
                            Stewardship & Accountability
                        </p>
                        <p className="text-[var(--text-lg)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto">
                            SufiPulse operates through defined authority, documented process, and structured creative progression. Governance is not restriction. It is alignment with sacred tradition and institutional integrity.
                        </p>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-12 text-center md:text-left">
                            <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-4">
                                The Four Governing Layers
                            </h2>
                            <p className="text-[var(--color-text-secondary)] max-w-2xl">
                                Authority flows sequentially through four institutional layers. Each layer validates the previous and prepares for the next.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {governanceLayers.map((layer) => (
                                <Link key={layer.id} href={layer.link} className="group">
                                    <Card hoverable className="h-full bg-[var(--color-midnight)]/30 border-[var(--color-text-tertiary)]/10">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-gold)]/20 transition-colors">
                                                <layer.icon className="w-6 h-6 text-[var(--color-gold)]" />
                                            </div>
                                            <div>
                                                <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-gold)] transition-colors">
                                                    {layer.title}
                                                </h3>
                                                <p className="text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest mb-3 opacity-70">
                                                    {layer.subtitle}
                                                </p>
                                                <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed">
                                                    {layer.description}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-12 text-center">
                            <Badge variant="neutral" className="mb-4">Authority Sequence</Badge>
                            <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)]">
                                Institutional Workflow
                            </h2>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 md:gap-2">
                            {authorityFlow.map((stage, idx) => (
                                <div key={idx} className="flex items-center">
                                    <div className="flex flex-col items-center text-center p-4 bg-[var(--color-slate)]/30 border border-[var(--color-text-tertiary)]/10 rounded-lg min-w-[140px] md:min-w-[180px]">
                                        <div className="w-10 h-10 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center mb-3 text-[var(--color-gold)] font-bold text-sm">
                                            {idx + 1}
                                        </div>
                                        <p className="text-[var(--text-xs)] font-medium text-[var(--color-text-primary)] uppercase tracking-wider">
                                            {stage}
                                        </p>
                                    </div>
                                    {idx < authorityFlow.length - 1 && (
                                        <div className="hidden md:flex items-center px-2">
                                            <ArrowRight className="w-5 h-5 text-[var(--color-gold)]/20" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-6">
                                    Royalty & Credit Transparency
                                </h2>
                                <div className="space-y-6">
                                    <p className="text-[var(--text-base)] text-[var(--color-text-secondary)] leading-relaxed">
                                        Royalty participation is defined before release. Contributors review and acknowledge allocation structures. Registry confirmation precedes publication.
                                    </p>
                                    <p className="text-[var(--text-base)] text-[var(--color-text-secondary)] leading-relaxed">
                                        Documentation is preserved within the institutional archive. Transparency is procedural, not promotional, ensuring long-term accountability.
                                    </p>
                                    <div className="pt-4">
                                        <Link href="/governance/royalty-transparency" className="text-[var(--color-gold)] hover:underline font-medium inline-flex items-center gap-2">
                                            View Transparency Reports <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-2xl p-8">
                                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">
                                    Audit & Continuity
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-[var(--color-midnight)] border-l-2 border-[var(--color-gold)]">
                                        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] italic">
                                            "Each release passes through documented status transitions. No release appears within the archive without registry confirmation."
                                        </p>
                                    </div>
                                    <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                                        Institutional memory is maintained deliberately. Continuity ensures that what is created today remains accountable tomorrow.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal" className="pb-24">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-12 text-center">
                            <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-4">
                                Contributor Alignment
                            </h2>
                            <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                                Participation in SufiPulse implies acceptance of institutional standards and structured progression.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {alignmentRequirements.map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center text-center p-6 bg-[var(--color-slate)]/20 border border-[var(--color-text-tertiary)]/10 rounded-xl">
                                    <item.icon className="w-10 h-10 text-[var(--color-gold)] mb-4 opacity-80" />
                                    <h3 className="text-[var(--text-base)] font-bold text-[var(--color-text-primary)] mb-2 uppercase tracking-wide">
                                        {item.title}
                                    </h3>
                                    <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 bg-[var(--color-slate)]/10 border border-[var(--color-gold)]/10 p-6 rounded-lg text-center">
                            <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                                Alignment is not demanded. It is understood before entry.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}

