"use client";
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { Globe, BookOpen, Shield, Users, GraduationCap, Building2, Zap, Handshake } from 'lucide-react';
import Image from 'next/image';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function InstitutionalPartners() {
    const alignmentPrinciples = [
        {
            icon: Shield,
            title: 'Ethical Framework',
            description: 'Partnerships are rooted in a shared commitment to spiritual integrity and devotional preservation.'
        },
        {
            icon: BookOpen,
            title: 'Scholarly Alignment',
            description: 'Collaborations support traditional Islamic scholarship and cultural heritage documentation.'
        },
        {
            icon: Users,
            title: 'Governance Respect',
            description: 'Select institutions must align with and respect SufiPulse\'s documented governance structures.'
        },
        {
            icon: Handshake,
            title: 'Long-term Service',
            description: 'Engagement is focused on sustainable, non-commercial institutional service across generations.'
        }
    ];

    const partnerCategories = [
        {
            icon: GraduationCap,
            title: 'Academic & Research',
            description: 'Institutions supporting interdisciplinary dialogue between spirituality, ethics, and contemporary inquiry.',
            tags: ['Theology', 'Philosophy', 'Research']
        },
        {
            icon: Globe,
            title: 'Cultural & Heritage',
            description: 'Organizations engaged in the preservation and documentation of spiritual, literary, and artistic traditions.',
            tags: ['Archival', 'Tradition', 'Preservation']
        },
        {
            icon: Building2,
            title: 'Technical Infrastructure',
            description: 'Entities providing specialized support in recording technology, digital archives, and distribution.',
            tags: ['Engineering', 'Digital', 'Systems']
        },
        {
            icon: Users,
            title: 'Regional Collaborators',
            description: 'Local institutional bodies assisting in the structured execution of regional production programs.',
            tags: ['Regional', 'Execution', 'Coordination']
        }
    ];

    const engagementNodes = [
        {
            title: 'Joint Initiatives',
            description: 'Collaborative projects focused on sacred music production and thematic cultural exchange.'
        },
        {
            title: 'Research Exchange',
            description: 'Scholarly sharing and interdisciplinary dialogue between spiritual and academic domains.'
        },
        {
            title: 'Content Preservation',
            description: 'Partnered digitization and documentation projects for traditional Sufi Kalam and sacred literature.'
        },
        {
            title: 'Educational Programs',
            description: 'Structured pathways for knowledge transmission and spiritual awakening through curated curriculum.'
        }
    ];

    return (
        <>
            {/* Cinematic Hero Section with /banner23.png */}
            <section className="relative w-full min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[var(--color-midnight)] pb-16 md:pb-24 border-b border-[var(--color-border)] hero-bleed">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner23.png"
                        alt="SufiPulse Institutional Partners & Strategic Academic Alliance"
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
                                    SufiPulse USA — Institutional Engagement
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Institutional Partners & Alliances<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    {roleDisplayMap.institutional_partners.mystical}
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                SufiPulse engages with select academic institutions, cultural preservation bodies, and research affiliates whose values align with its constitutional charter and sacred mission.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/about/our-network">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        Our Global Network
                                    </PrimaryButton>
                                </Link>
                                <Link href="/governance/mithaq">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        Constitutional Mithaq
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Alignment Principles Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {alignmentPrinciples.map((item, idx) => (
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
                            title="Alignment Over Sponsorship"
                            subtitle="SufiPulse does not operate on commercial sponsorship models. Partnership is structural alignment, not promotional exchange."
                        />

                        <StudioCardGrid cols={4}>
                            {alignmentPrinciples.map((item, idx) => (
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
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Categories of Engagement"
                            subtitle="Documented alignment across spiritual, technical, and scholarly domains"
                        />

                        <StudioCardGrid cols={2}>
                            {partnerCategories.map((item, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={item.icon}
                                    title={item.title}
                                    description={item.description}
                                    footerTags={item.tags}
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
                            title="Partner Engagement Model"
                            subtitle="Structured collaboration pathways within the institutional framework"
                        />

                        <div className="grid md:grid-cols-2 gap-8">
                            {engagementNodes.map((node, idx) => (
                                <div key={idx} className="elite-card p-10 group hover:border-amber-400/30 transition-all shadow-2xl">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        <h3 className="text-white font-bold text-xl tracking-tight">{node.title}</h3>
                                    </div>
                                    <p className="text-neutral-400 text-base leading-relaxed">{node.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Structural Principle"
                description="Partnership within SufiPulse operates under charter-defined governance. Institutional collaboration enhances capacity without altering structural authority or editorial independence."
                primaryCTA={{ label: "View Governance Charter", href: "/governance/mithaq" }}
                secondaryCTA={{ label: "Collaboration Portal", href: "/collaboration" }}
                shieldText="Governed Partnership Framework"
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
