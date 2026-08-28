"use client";
import { useState } from 'react';
import { ArrowDown, Shield, FileCheck, Building2, Archive, Scale, Users, BookOpen, Lock, CircleCheck as CheckCircle, ScrollText, ChevronDown, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

interface ExpandableSection {
    title: string;
    content: string[];
}

function ExpandableContent({ title, content }: ExpandableSection) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="elite-card overflow-hidden transition-all duration-500">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-6 px-8 py-7 text-left bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
                <h3 className="flex-1 text-lg md:text-xl font-bold text-white text-left tracking-tight leading-relaxed">
                    {title}
                </h3>
                <div className={`shrink-0 p-2 rounded-full bg-amber-400/5 border border-amber-400/10 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-amber-400" />
                </div>
            </button>
            {isOpen && (
                <div className="px-8 pb-10 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="pl-6 md:pl-10 border-l-2 border-amber-400/20 space-y-6">
                        {content.map((paragraph, idx) => (
                            <p key={idx} className="text-neutral-400 leading-relaxed text-base md:text-lg font-light">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Mithaq() {
    const constitutionalPillars = [
        {
            icon: Scale,
            title: 'Justice in Attribution',
            description: 'Every creative contribution is documented, validated, and attributed permanently through Diwan-e-Amanat registry.'
        },
        {
            icon: Users,
            title: 'Collective Stewardship',
            description: 'Authority is distributed across institutional bodies. No individual holds unilateral power over creative or economic decisions.'
        },
        {
            icon: BookOpen,
            title: 'Transparency by Design',
            description: 'All governance decisions, editorial processes, and economic distributions are documented and accessible to stakeholders.'
        },
        {
            icon: Lock,
            title: 'Immutable Standards',
            description: 'Core principles cannot be altered by convenience. Constitutional amendments require formal institutional consensus.'
        }
    ];

    const hierarchyLayers = [
        { icon: Shield, title: 'Mithaq', desc: 'Constitutional Foundation' },
        { icon: FileCheck, title: 'Majlis-e-Nazr', desc: 'Editorial Authorization' },
        { icon: Building2, title: 'Production Oversight', desc: 'Execution Governance' },
        { icon: Archive, title: 'Diwan-e-Amanat', desc: 'Registry Validation' }
    ];

    const accountabilityMechanisms = [
        {
            layer: 'Editorial Layer',
            body: 'Majlis-e-Nazr',
            accountability: 'Reviews all submitted kalams against orthodox criteria. Publishes rejection rationale for accountability.'
        },
        {
            layer: 'Production Layer',
            body: 'Production Oversight',
            accountability: 'Ensures studio bookings, performance assignments, and resource allocation follow established protocols.'
        },
        {
            layer: 'Registry Layer',
            body: 'Diwan-e-Amanat',
            accountability: 'Maintains immutable records of all contributions, preventing retroactive attribution disputes.'
        },
        {
            layer: 'Economic Layer',
            body: 'Royalty Framework',
            accountability: 'Transparent distribution logic ensures contributors receive their agreed share without negotiation friction.'
        }
    ];

    const contextualSections: ExpandableSection[] = [
        {
            title: 'Understanding Sufi Kalam: Sacred Poetry in Islamic Tradition',
            content: [
                'Sufi Kalam represents a centuries-old tradition of devotional poetry within Islamic spirituality. Rooted in the teachings of Sufism, these compositions express love for the Divine, spiritual longing, and mystical experiences while remaining firmly grounded in Islamic orthodoxy.',
                'Unlike secular poetry, Sufi Kalam serves as a vehicle for spiritual awakening and religious devotion. Masters like Rumi, Hafiz, Bulleh Shah, and Amir Khusro used poetic language to convey profound theological truths in forms accessible to both scholars and laypeople.',
                'Traditional Sufi Kalam adheres to Islamic principles, drawing from Quranic verses, Hadith, and teachings of recognized Sufi orders (tariqas). The poetry often explores themes of divine love (ishq-e-haqiqi), spiritual purification (tazkiyah), and the seeker\'s journey toward proximity to Allah.'
            ]
        },
        {
            title: 'Why SufiPulse Exists: Addressing Modern Challenges',
            content: [
                'The digital age has democratized content creation, but this freedom comes with significant challenges for sacred artistic traditions. Anyone can now produce and distribute content labeled as "Sufi" or "Islamic," often without proper knowledge, editorial oversight, or accountability.',
                'This has led to theological inaccuracies, commercialization of sacred content, and the dilution of centuries-old traditions. Content that contradicts Islamic principles or misrepresents Sufi teachings spreads rapidly, causing confusion among seekers.',
                'SufiPulse was established to preserve the integrity of Sufi Kalam in the modern era by creating an institutional framework that ensures all content undergoes rigorous theological review, maintains attribution standards, and operates with transparent governance.'
            ]
        },
        {
            title: 'The Crisis of Attribution in Digital Media',
            content: [
                'Traditional artistic communities operated with clear attribution practices, where teachers, students, and patrons all received recognition. The digital economy has disrupted these norms, with content frequently shared without proper credit.',
                'Musicians, poets, and producers often see their work distributed across platforms with no compensation or recognition. Streaming services and social media algorithms prioritize engagement over attribution, and contractual disputes leave artists powerless.',
                'Mithaq establishes Diwan-e-Amanat as the constitutional authority for attribution. Every contribution is recorded immutably, ensuring that writers, vocalists, producers, and studios receive permanent recognition and economic rights.'
            ]
        },
        {
            title: 'Governance as Protection, Not Control',
            content: [
                'SufiPulse\'s governance model is not about centralized control but distributed accountability. Mithaq establishes multiple institutional layers, each with defined authority and clear boundaries.',
                'Majlis-e-Nazr ensures theological accuracy, Production Oversight manages creative execution, and Diwan-e-Amanat validates all records. No single body can override the others, creating a system of checks and balances.',
                'This structure protects contributors from arbitrary decisions, ensures content remains aligned with Islamic principles, and provides a transparent framework that can be audited and trusted by the community.'
            ]
        },
        {
            title: 'Economic Justice in Creative Work',
            content: [
                'Mithaq recognizes that creative work has both spiritual and economic dimensions. While Sufi Kalam is sacred, those who dedicate time and skill to its production deserve fair compensation.',
                'Traditional patronage models are no longer viable at scale. SufiPulse implements a royalty system where all contributors receive transparent revenue shares based on documented roles.',
                'This economic layer is governed by the same constitutional principles as editorial and production layers, ensuring that financial decisions cannot compromise artistic integrity or theological standards.'
            ]
        },
        {
            title: 'Why Constitutional Documentation Matters',
            content: [
                'Institutions without documented governance often fail when founders leave, circumstances change, or disputes arise. Mithaq exists as a written constitutional charter to prevent mission drift and ensure continuity.',
                'By documenting principles, authority structures, and amendment processes, SufiPulse creates institutional permanence. Future generations inherit a clear framework rather than vague intentions.',
                'This document is not symbolic. It is operational, referenced in decision-making, and enforced through the institutional hierarchy it establishes.'
            ]
        },
        {
            title: 'SufiPulse\'s Scope and Limitations',
            content: [
                'SufiPulse focuses specifically on Sufi Kalam that aligns with Islamic orthodoxy and traditional Sufi teachings. It does not claim authority over all Islamic content or all Sufi traditions globally.',
                'The platform serves artists, producers, and audiences who value editorial rigor, attribution integrity, and governance transparency. It is not positioned as the only way to engage with Sufi content but as one institutional model.',
                'Mithaq acknowledges that other approaches exist and may be valid within their own contexts. SufiPulse\'s contribution is to demonstrate that institutional rigor and sacred art can coexist in the digital age.'
            ]
        }
    ];

    return (
        <>
            {/* Cinematic Hero Section with /banner13.png */}
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner13.png"
                        alt="SufiPulse Constitutional Mithaq & Institutional Covenant"
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
                                    SufiPulse USA — Institutional Constitution
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Constitutional Covenant<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    Al-Mithaq (The Supreme Charter)
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                Mithaq establishes the governing principles, authority boundaries, attribution protections, and structural continuity of SufiPulse. All institutional functions derive legitimacy from this covenant.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/governance">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        Governance Framework
                                    </PrimaryButton>
                                </Link>
                                <Link href="/governance/diwan-e-amanat">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        Diwan-e-Amanat Registry
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* 4 Pillars Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {constitutionalPillars.map((item, idx) => (
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
                            title="Essential Context"
                            subtitle="To understand Mithaq's role, it's important to understand the broader context of Sufi Kalam and why institutional governance is necessary for its preservation."
                        />
                        <div className="space-y-6">
                            {contextualSections.map((section, idx) => (
                                <ExpandableContent key={idx} title={section.title} content={section.content} />
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Foundational Authority"
                            subtitle="Mithaq defines foundational principles and governance hierarchy. It does not operate daily workflows; it defines who has the authority to operate them."
                        />

                        <div className="elite-card p-10 md:p-12 mb-12">
                            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                                {[
                                    'Institutional purpose',
                                    'Structural sequencing',
                                    'Governance hierarchy',
                                    'Continuity across generations'
                                ].map((principle, idx) => (
                                    <div key={idx} className="flex items-center gap-4 group">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:shadow-[0_0_10px_rgba(212,175,55,0.5)] transition-all" />
                                        <p className="text-neutral-200 text-sm font-bold uppercase tracking-widest">{principle}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <StudioSectionHeader 
                            title="Institutional Hierarchy"
                            subtitle="Authority flows vertically through defined institutional layers"
                        />

                        <StudioCardGrid cols={4}>
                            {hierarchyLayers.map((layer, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={layer.icon}
                                    title={layer.title}
                                    description={layer.desc}
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
                            title="Constitutional Pillars"
                            subtitle="The core architectural principles that ensure institutional integrity and contributor protection"
                        />

                        <StudioCardGrid cols={2}>
                            {constitutionalPillars.map((pillar, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={pillar.icon}
                                    title={pillar.title}
                                    description={pillar.description}
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
                            title="Accountability Mechanisms"
                            subtitle="Documented distribution of authority and cross-layer validation"
                        />

                        <div className="elite-card overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/[0.03] border-b border-white/5">
                                        <tr>
                                            <th className="px-8 py-6 text-amber-400 text-[10px] font-black uppercase tracking-[0.3em]">Layer</th>
                                            <th className="px-8 py-6 text-amber-400 text-[10px] font-black uppercase tracking-[0.3em]">Governing Body</th>
                                            <th className="px-8 py-6 text-amber-400 text-[10px] font-black uppercase tracking-[0.3em]">Accountability</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {accountabilityMechanisms.map((m, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                                                <td className="px-8 py-6 text-white text-xs font-black uppercase tracking-widest">{m.layer}</td>
                                                <td className="px-8 py-6 text-amber-400/90 text-sm font-bold">{m.body}</td>
                                                <td className="px-8 py-6 text-neutral-400 text-sm leading-relaxed font-light">{m.accountability}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12">
                            <div>
                                <StudioSectionHeader 
                                    title="Authority Boundaries"
                                    subtitle="Non-negotiable constraints to prevent procedural bypass"
                                />
                                <div className="space-y-4">
                                    {[
                                        'No creative function bypasses editorial authorization.',
                                        'No production function bypasses structured workflow.',
                                        'No release occurs without registry confirmation.',
                                        'Authority is sequential.'
                                    ].map((b, i) => (
                                        <div key={i} className="flex items-center gap-4 p-5 elite-card border-none bg-white/[0.02]">
                                            <Shield className="w-4 h-4 text-amber-400/50 shrink-0" />
                                            <p className="text-neutral-300 text-sm font-medium">{b}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <StudioSectionHeader 
                                    title="Constitutional Protection"
                                    subtitle="Structural friction to ensure continuity and prevent arbitrary drift"
                                />
                                <div className="elite-card p-8 bg-gradient-to-br from-amber-400/5 to-transparent">
                                    <div className="flex items-start gap-4 mb-6">
                                        <ScrollText className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
                                        <div>
                                            <p className="text-white font-bold text-lg mb-4 tracking-tight">Amendment Process</p>
                                            <ul className="space-y-4">
                                                {[
                                                    'Written proposal to all governing bodies',
                                                    'Unanimous approval from Majlis-e-Nazr',
                                                    'Production oversight verification',
                                                    'Permanent record in Diwan-e-Amanat'
                                                ].map((item, i) => (
                                                    <li key={i} className="flex items-center gap-3">
                                                        <div className="w-1 h-1 rounded-full bg-amber-400/60" />
                                                        <span className="text-neutral-400 text-xs font-bold uppercase tracking-widest">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em] mt-8 pt-6 border-t border-white/5 text-center italic">
                                        Friction is a governance feature, not a technical limitation.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Institutional Permanence"
                description="Expansion does not dilute governance—it extends institutional authority into new domains under the same constitutional framework. Mithaq outlasts individuals and market shifts."
                shieldText="Governed Institutional Charter"
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
