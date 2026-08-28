"use client";
import { Shield, BookOpen, Users, Globe, CircleHelp as HelpCircle, ChevronDown, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { useState } from 'react';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
    return (
        <div className="elite-card overflow-hidden transition-all duration-500">
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between gap-6 px-8 py-7 text-left hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-start gap-4 flex-1">
                    <HelpCircle className="w-5 h-5 text-amber-400/60 mt-1 flex-shrink-0" />
                    <p className="text-white font-bold text-lg tracking-tight leading-relaxed text-left">
                        {question}
                    </p>
                </div>
                <div className={`shrink-0 p-2 rounded-full bg-amber-400/5 border border-amber-400/10 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-amber-400" />
                </div>
            </button>

            {isOpen && (
                <div className="px-8 pb-10 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="pl-6 md:pl-10 border-l-2 border-amber-400/20">
                        <p className="text-neutral-400 text-base md:text-lg leading-relaxed font-light">
                            {answer}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AboutSufiPulse() {
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
    const identityPoints = [
        { title: 'Content Institution', desc: 'A devotional content institution preserving sacred art through structured oversight.' },
        { title: 'Production Framework', desc: 'A disciplined technical framework that transforms creative intent into master recordings.' },
        { title: 'Registry Release', desc: 'A governed release system ensuring permanent documentation and verified attribution.' },
        { title: 'Global Network', desc: 'A multi-regional network of studios and contributors aligned under a single charter.' }
    ];

    const missionPoints = [
        'Protect thematic coherence',
        'Maintain technical excellence',
        'Ensure contributor recognition',
        'Preserve institutional continuity'
    ];

    const structuralComponents = [
        {
            title: 'Editorial Authorization',
            icon: BookOpen,
            description: 'Majlis-e-Nazr reviews all kalam for spiritual and linguistic alignment.'
        },
        {
            title: 'Production Oversight',
            icon: Users,
            description: 'Structured studio coordination and technical quality validation.'
        },
        {
            title: 'Registry Validation',
            icon: Shield,
            description: 'Diwan-e-Amanat ensures metadata lock and attribution integrity.'
        }
    ];

    const faqItems = [
        {
            question: 'What is SufiPulse?',
            answer: 'SufiPulse is a structured devotional production institution integrating editorial governance, studio infrastructure, and registry documentation under a unified charter. It operates as a constitutional framework for preserving devotional expression.'
        },
        {
            question: 'Is SufiPulse a record label?',
            answer: 'No. SufiPulse is not a label or a collective. It is an institutional structure operating under documented governance with editorial authorization, production oversight, and registry validation.'
        },
        {
            question: 'Who can contribute to SufiPulse?',
            answer: 'Contributions are governed by role-based participation. Writers (Ahl-e-Qalam) submit through editorial review. Vocalists (Ahl-e-Sada) and Producers (Ahl-e-Tarannum) are assigned after approval. All contributors operate within the documented governance framework.'
        },
        {
            question: 'How does editorial review work?',
            answer: 'Majlis-e-Nazr (Editorial Council) reviews all submissions for thematic coherence, spiritual alignment, and institutional compatibility. Approved works enter the production queue under documented workflow.'
        },
        {
            question: 'Where are releases recorded?',
            answer: 'Recording occurs within the SufiPulse Studio Network: Central Studio (USA - Virginia) and Network Studios (Canada, UAE, India). All recordings follow centralized production oversight and master validation before registry authorization.'
        },
        {
            question: 'How are releases published?',
            answer: 'All releases follow Release Protocol. After editorial approval, studio production, and technical validation, the Registry (Diwan-e-Amanat) authorizes publication. No independent publication occurs outside this sequence.'
        },
        {
            question: 'What is the Mithaq?',
            answer: 'Mithaq is the Constitutional Charter establishing SufiPulse\'s institutional framework, governance structure, role definitions, and operational principles. All participants operate under its documented authority.'
        },
        {
            question: 'How does royalty distribution work?',
            answer: 'Economic distribution follows documented templates managed by Diwan-e-Amanat. All revenue, allocations, and payouts are transparently recorded in the royalty transparency system. Contributors receive allocation based on their documented roles.'
        }
    ];

    return (
        <Layout>
            {/* Cinematic Hero Section with /banner20.png */}
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner20.png"
                        alt="What is SufiPulse - Devotional Production Institution"
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
                                    SufiPulse USA — Institutional Purpose
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                What is SufiPulse?<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    {roleDisplayMap.what_is_sufipulse.mystical}
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                SufiPulse is a structured devotional production institution integrating editorial governance, studio infrastructure, and registry documentation under a unified constitutional charter.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/governance/mithaq">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        Constitutional Mithaq
                                    </PrimaryButton>
                                </Link>
                                <Link href="/studio">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        Studio Network
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Identity Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {identityPoints.map((item, idx) => (
                                    <div key={idx} className="text-center p-2">
                                        <Globe className="w-7 h-7 text-[var(--color-gold)] mx-auto mb-2 opacity-90" />
                                        <div className="text-sm md:text-base font-bold text-[var(--color-text-primary)] mb-1">
                                            {item.title}
                                        </div>
                                        <div className="text-[11px] text-[var(--color-text-tertiary)] leading-snug line-clamp-2">
                                            {item.desc}
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
                        <StudioSectionHeader 
                            title="Institutional Identity"
                            subtitle="Defining our position as a custodial authority for sacred music preservation"
                        />

                        <StudioCardGrid cols={2}>
                            {identityPoints.map((item, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={Globe}
                                    title={item.title}
                                    description={item.desc}
                                />
                            ))}
                        </StudioCardGrid>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <StudioSectionHeader 
                                    title="Our Mission"
                                    subtitle="Structural focus beyond individual expression"
                                />
                                <div className="space-y-6">
                                    {missionPoints.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 group">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:shadow-[0_0_10px_rgba(212,175,55,0.6)] transition-all" />
                                            <p className="text-neutral-300 text-sm font-black uppercase tracking-[0.2em]">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="elite-card p-10 bg-gradient-to-br from-amber-400/5 to-transparent">
                                <p className="text-white text-xl font-light leading-relaxed italic">
                                    "To preserve devotional expression through structured governance, disciplined production, and documented release integrity."
                                </p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Structural Components"
                            subtitle="The integrated layers of institutional authority"
                        />

                        <StudioCardGrid cols={3}>
                            {structuralComponents.map((item, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={item.icon}
                                    title={item.title}
                                    description={item.description}
                                />
                            ))}
                        </StudioCardGrid>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-4xl mx-auto">
                        <StudioSectionHeader 
                            title="Frequently Asked Questions"
                            subtitle="Essential institutional knowledge for contributors and partners"
                            centered
                        />

                        <div className="space-y-6">
                            {faqItems.map((item, idx) => (
                                <FAQItem 
                                    key={idx} 
                                    question={item.question} 
                                    answer={item.answer} 
                                    isOpen={expandedQuestion === idx}
                                    onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
                                />
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Sacred Stewardship"
                description="SufiPulse is not a label or a collective. It is a constitutional framework designed for institutional permanence and doctrinal fidelity."
                primaryCTA={{ label: "View Constitutional Charter", href: "/governance/mithaq" }}
                secondaryCTA={{ label: "Contributor Policy", href: "/contributor-policy" }}
                shieldText="Governed Institutional Division"
                background="slate"
            />

            <style jsx global>{`
                .elite-card {
                    background: rgba(18, 18, 18, 0.4);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    border-radius: 32px;
                    box-shadow: 
                        0 20px 40px rgba(0,0,0,0.4),
                        inset 0 1px 1px rgba(255,255,255,0.02);
                }
            `}</style>
        </Layout>
    );
}
