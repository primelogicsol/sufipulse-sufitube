"use client";
import { Music2, Layers, Users, ArrowRight, Shield, CircleCheck as CheckCircle2, ChevronLeft, ChevronRight, Disc3, FileCheck, Mic, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Badge } from '../../components/primitives/Badge';
import { PrimaryButton } from '../../components/primitives/PrimaryButton';
import { Card } from '../../components/primitives/Card';
import { roleDisplayMap } from '../../components/lib/roleDisplayMap';
import { useRef, useState, useEffect } from 'react';
import { ProducerCredentialsForm } from '../../components/producers/ProducerCredentialsForm';
import Link from 'next/link';

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
            workflowScrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
        }
    };

    const scrollWorkflowRight = () => {
        if (workflowScrollRef.current) {
            workflowScrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
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
        <>
            {/* Cinematic Hero Section with /banner6.png */}
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner6.png"
                        alt="SufiPulse Producers & Sound Architecture Session"
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
                                    SufiPulse USA — Sound Architecture
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Producers & Composition<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    {roleDisplayMap.engineer.mystical}
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                Producers operate as musical architects within the SufiPulse framework. They structure composition, direct sonic development, and ensure rigorous alignment with approved kalam before master studio capture.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/producers/apply">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        Apply as Producer
                                    </PrimaryButton>
                                </Link>
                                <Link href="/governance">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        Production Governance
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Responsibilities Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {producerResponsibilities.map((item, idx) => (
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
                                Producer Mandate & Role Definition
                            </h2>
                            <p className="text-[var(--color-text-secondary)] max-w-2xl">
                                The Producer operates after kalam approval and before studio recording. No musical structure proceeds without documented alignment.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {producerResponsibilities.map((item, idx) => (
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
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 font-bold ${stage.id === 4 ? 'bg-[var(--color-gold)] text-[var(--color-midnight)]' : 'bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 text-[var(--color-gold)]'}`}>
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
                                    <Disc3 className="w-5 h-5 text-[var(--color-gold)]" /> Structural Discipline
                                </h3>
                                <ul className="space-y-4">
                                    {[
                                        'Producers receive approved kalam with assigned vocalist',
                                        'Musical composition respects textual integrity',
                                        'Instrumentation decisions operate within documented guidelines'
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
                                        { label: 'Vocalists', desc: 'Provide interpretive direction' },
                                        { label: 'Producers', desc: 'Structure musical framework' },
                                        { label: 'Studio', desc: 'Executes recording' }
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
                                "Producers do not independently select content or authorize publication. Musical direction operates within institutional oversight."
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
                                Producers may request consideration for inclusion within the SufiPulse creative structure. Admission is evaluated on musical competence and governance alignment.
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-8">
                            <Link href="/producers/apply" className="w-full md:w-auto">
                                <PrimaryButton className="w-full md:w-auto min-w-[240px]">
                                    Apply as Producer
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
        </>
    );
}
