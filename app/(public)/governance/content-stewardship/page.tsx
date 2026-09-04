"use client";
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { FileText, Globe, Shield, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Languages, Search, Sparkles, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioWorkflowRoadmap, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function ContentStewardship() {
    const languages = [
        'Roman Urdu', 'Urdu', 'Hindi', 'Arabic', 'Turkish', 'Persian (Farsi)',
        'Punjabi', 'Indonesian', 'Spanish', 'Portuguese', 'French', 'German',
        'Russian', 'Bengali', 'Chinese', 'Japanese', 'English'
    ];

    const stewardshipMandates = [
        {
            icon: Globe,
            title: '17-Language Discipline',
            description: 'Standardized multilingual distribution with native-script preservation across all releases.'
        },
        {
            icon: Shield,
            title: 'Source Integrity',
            description: 'Original linguistic nuance protected through authorized translation and scholarly review.'
        },
        {
            icon: FileText,
            title: 'Thematic Coherence',
            description: 'Unified interpretive framework maintained across all global translations and variants.'
        },
        {
            icon: CheckCircle,
            title: 'Doctrinal Alignment',
            description: 'Interpretation verified against institutional doctrine and traditional sacred literature.'
        }
    ];

    const subtitlePrinciples = [
        { title: 'RTL Positioning', desc: 'Arabic, Urdu, and Persian scripts maintain directional integrity.' },
        { title: 'Native-Script Preservation', desc: 'No romanization of non-Latin scripts unless mandated.' },
        { title: 'Pronunciation Integrity', desc: 'Transliteration follows scholarly conventions, not phonetic convenience.' },
        { title: 'Conceptual Precision', desc: 'Technical terms retain doctrinal meaning across all target languages.' }
    ];

    const interpretivePrinciples = [
        { title: 'Doctrinal Clarity', desc: 'Alignment with institutional understanding of text and tradition.' },
        { title: 'Theological Neutrality', desc: 'Avoiding sectarian bias or doctrinal deviation in framing.' },
        { title: 'Non-Commercial Tone', desc: 'Avoiding sensationalism or entertainment-driven narratives.' },
        { title: 'Cultural Nuance', desc: 'Respecting linguistic context without compromising core meaning.' }
    ];

    const reviewSteps = [
        { id: 1, title: 'Language Approval', icon: Languages, desc: 'Source text accuracy check' },
        { id: 2, title: 'Alignment Review', icon: Search, desc: 'Semantic consistency verify' },
        { id: 3, title: 'Thematic Documentation', icon: BookOpen, desc: 'Interpretive guidance lock' },
        { id: 4, title: 'Technical Verification', icon: FileText, desc: 'Subtitle timing and RTL check' },
        { id: 5, title: 'Clearance Issued', icon: CheckCircle, desc: 'Final publication authorization' }
    ];

    const structuralBoundaries = [
        {
            action: 'No External Editing',
            clarification: 'Translation modifications require formal institutional review'
        },
        {
            action: 'No Post-Release Alteration',
            clarification: 'Interpretive framing remains immutable after registry lock'
        },
        {
            action: 'No Unauthorized Additions',
            clarification: 'The 17-language framework is standardized globally'
        },
        {
            action: 'Charter Compliance',
            clarification: 'All decisions must conform to institutional Mithaq provisions'
        }
    ];

    return (
        <>
            {/* Cinematic Hero Section with /banner19.png */}
            <section className="relative w-full min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[var(--color-midnight)] pb-16 md:pb-24 border-b border-[var(--color-border)] hero-bleed">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner19.png"
                        alt="SufiPulse Content Stewardship & Multilingual Sacred Oversight"
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
                <div className="relative z-10 pt-20 md:pt-32">
                    <PageContainer>
                        <div className="max-w-5xl mx-auto text-center">
                            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
                                <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
                                <span className="text-[11px] md:text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold">
                                    SufiPulse USA — Linguistic & Thematic Alignment
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Content Stewardship & Alignment<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    {roleDisplayMap.content_stewardship.mystical}
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                All releases undergo rigorous linguistic review, doctrinal verification, and 17-language subtitle standardization prior to publication to preserve sacred meaning across global cultures.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/governance/majlis-e-nazr">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        Editorial Council
                                    </PrimaryButton>
                                </Link>
                                <Link href="/governance/mithaq">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        Constitutional Mithaq
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Stewardship Mandates Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {stewardshipMandates.map((item, idx) => (
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
                        <StudioSectionHeader 
                            title="Stewardship Mandate"
                            subtitle="Safeguarding the sacredness of sound and meaning through disciplined linguistic oversight"
                        />

                        <StudioCardGrid cols={4}>
                            {stewardshipMandates.map((item, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={item.icon}
                                    title={item.title}
                                    description={item.description}
                                />
                            ))}
                        </StudioCardGrid>

                        <div className="mt-12 bg-neutral-950/50 border border-amber-500/20 rounded-xl p-8 text-center max-w-3xl mx-auto shadow-2xl">
                            <div className="flex items-center justify-center gap-4 text-amber-400 mb-2">
                                <AlertTriangle size={20} />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Critical Responsibility</p>
                            </div>
                            <p className="text-neutral-300 text-sm font-medium">
                                "Translation is not localization. It is doctrinal responsibility. We preserve the essence, not just the word."
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Global Subtitle Framework"
                            subtitle="SufiPulse operates under a standardized 17-language subtitle sequence with RTL alignment protocols and linguistic integrity rules."
                        />

                        <div className="elite-card p-10 md:p-12 mb-12 shadow-inner">
                            <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.4em] text-center mb-10">Supported Institutional Languages</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-4">
                                {languages.map((lang, idx) => (
                                    <div key={idx} className="flex items-center gap-3 group">
                                        <div className="w-1 h-1 rounded-full bg-amber-400/40 group-hover:bg-amber-400 transition-colors" />
                                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest group-hover:text-white transition-colors">{lang}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <StudioCardGrid cols={2}>
                            {subtitlePrinciples.map((item, idx) => (
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

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Interpretive Integrity"
                            subtitle="Thematic framing must preserve doctrinal clarity and avoid theological distortion"
                        />

                        <StudioCardGrid cols={2}>
                            {interpretivePrinciples.map((item, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={Shield}
                                    title={item.title}
                                    description={item.desc}
                                />
                            ))}
                        </StudioCardGrid>
                    </div>
                </PageContainer>
            </Section>

            <StudioWorkflowRoadmap 
                title="Editorial Review Sequence"
                badge="Linguistic Pipeline"
                steps={reviewSteps}
                description="Linguistic precision and thematic consistency verification."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Structural Boundaries"
                            subtitle="Non-negotiable constraints to preserve institutional content integrity"
                        />

                        <div className="elite-card p-10 md:p-12">
                            <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                                {structuralBoundaries.map((boundary, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <p className="text-white text-sm font-bold uppercase tracking-wider">{boundary.action}</p>
                                        <p className="text-neutral-500 text-[11px] leading-relaxed font-medium uppercase tracking-widest">{boundary.clarification}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em] mt-12 pt-6 border-t border-white/5 text-center italic">
                                Stewardship ensures clarity serves the sacred message.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Linguistic Stewardship"
                description="Content stewardship at SufiPulse is custodial, not creative. All translations and interpretive framing must align with the institutional charter to ensure that spiritual art transcends linguistic barriers without losing its doctrinal essence."
                primaryCTA={{ label: "Editorial Council", href: "/governance/majlis-e-nazr" }}
                secondaryCTA={{ label: "Constitutional Mithaq", href: "/governance/mithaq" }}
                shieldText="Governed Content Stewardship"
                background="midnight"
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
        </>
    );
}
