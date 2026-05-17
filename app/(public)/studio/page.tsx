"use client"
import { Mic as Mic2, Radio, CircleCheck as CheckCircle2, ArrowRight, Shield, MapPin, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Badge } from '../../components/primitives/Badge';
import { PrimaryButton } from '../../components/primitives/PrimaryButton';
import { Card } from '../../components/primitives/Card';
import { useState, useRef } from 'react';
import StudioCredentialsForm from '../../components/studio/StudioCredentialsForm';
import Link from 'next/link';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';

export default function Studio() {
    const [expandedStage, setExpandedStage] = useState<string | null>(null);
    const [showCredentialsForm, setShowCredentialsForm] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
        }
    };

    const productionPath = [
        { id: 'approval', title: 'Approved Kalam', description: 'Editorial council authorization' },
        { id: 'alignment', title: 'Vocalist Alignment', description: 'Matching voice to sacred text' },
        { id: 'composition', title: 'Composition', description: 'Thematic musical structuring' },
        { id: 'recording', title: 'Recording', description: 'Master-grade capture' },
        { id: 'mixing', title: 'Mixing', description: 'Technical element balancing' },
        { id: 'mastering', title: 'Mastering', description: 'Final sonic validation' },
        { id: 'registry', title: 'Registry', description: 'Institutional authorization' }
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
            title: 'Quality Control',
            description: 'Ensuring audio integrity, format compatibility, and sonic consistency.'
        },
        {
            icon: Shield,
            title: 'Metadata Integrity',
            description: 'Supporting Registry with technical documentation and file specifications.'
        }
    ];

    return (
        <Layout>
            <Section background="midnight" spacing="spacious">
                <PageContainer>
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="mb-6">
                            <Badge variant="gold">Institutional Division</Badge>
                        </div>
                        <h1 className="text-[var(--text-4xl)] md:text-[64px] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight">
                            Studio
                        </h1>
                        <p className="text-[var(--text-xl)] text-[var(--color-gold)] font-medium mb-10 tracking-wide uppercase">
                            {roleDisplayMap.studio.mystical}
                        </p>
                        <p className="text-[var(--text-lg)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto">
                            The Studio operates after editorial approval and before registry authorization. It is responsible for recording, technical quality, and master validation across the SufiPulse network.
                        </p>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-12 text-center md:text-left">
                            <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-4">
                                Mandate & Responsibilities
                            </h2>
                            <p className="text-[var(--color-text-secondary)] max-w-2xl">
                                The Studio operates after editorial approval. No recording begins without structured assignment and institutional alignment.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {studioResponsibilities.map((item, idx) => (
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
                            <Badge variant="neutral" className="mb-4">Production Path</Badge>
                            <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)]">
                                Sequential Workflow
                            </h2>
                        </div>

                        <div className="relative group">
                            <div
                                ref={scrollContainerRef}
                                className="flex items-start gap-4 overflow-x-auto scrollbar-hide pb-8 px-4"
                            >
                                {productionPath.map((stage, idx) => (
                                    <div key={idx} className="flex items-center flex-shrink-0">
                                        <div className="flex flex-col items-center text-center w-[180px]">
                                            <div className="w-12 h-12 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center mb-4 text-[var(--color-gold)] font-bold">
                                                {idx + 1}
                                            </div>
                                            <h4 className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)] mb-1">
                                                {stage.title}
                                            </h4>
                                            <p className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
                                                {stage.description}
                                            </p>
                                        </div>
                                        {idx < productionPath.length - 1 && (
                                            <ArrowRight className="w-5 h-5 text-[var(--color-gold)]/20 mx-2 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={scrollLeft}
                                className="absolute left-0 top-6 -translate-x-4 w-10 h-10 rounded-full bg-[var(--color-slate)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={scrollRight}
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
                        <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-12 text-center">
                            Studio Network Architecture
                        </h2>

                        <div className="grid md:grid-cols-2 gap-8 mb-12">
                            <div className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-xl p-8">
                                <div className="flex items-center gap-3 mb-6 text-[var(--color-gold)]">
                                    <MapPin className="w-6 h-6" />
                                    <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Central Studio</h3>
                                </div>
                                <div className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-6 font-medium">
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
                                        <span key={c} className="text-[var(--text-xs)] px-2 py-0.5 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 text-[var(--color-gold)] rounded">
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

                        <div className="bg-[var(--color-midnight)] p-6 rounded-lg border border-[var(--color-gold)]/20 text-center max-w-3xl mx-auto">
                            <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed italic">
                                "Recording within the SufiPulse Studio Network is reserved for works authored by approved writers and performed by approved vocalists. Regional flexibility does not alter governance standards."
                            </p>
                        </div>
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
                                Studios may request inclusion within the SufiPulse production network. Admission is evaluated on technical readiness and governance alignment.
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-8">
                            <PrimaryButton 
                                onClick={() => setShowCredentialsForm(!showCredentialsForm)}
                                className="w-full md:w-auto min-w-[240px]"
                            >
                                {showCredentialsForm ? 'Hide Credentials Form' : 'Submit Studio Credentials'}
                            </PrimaryButton>

                            {showCredentialsForm && (
                                <Card className="w-full bg-[var(--color-slate)] border-[var(--color-border)] p-8">
                                    <div className="mb-8 border-b border-[var(--color-border)] pb-6">
                                        <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                                            Network Studio Eligibility
                                        </h3>
                                        <p className="text-[var(--color-gold)] font-medium">Karkhana-e-Sada</p>
                                    </div>
                                    <StudioCredentialsForm />
                                </Card>
                            )}
                        </div>

                        <div className="mt-16 pt-8 border-t border-[var(--color-text-tertiary)]/10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-[var(--color-gold)]" />
                                <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">Final Registry Authorization Required</span>
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

