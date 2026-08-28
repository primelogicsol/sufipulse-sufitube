"use client";
import { FileCheck, ArrowRight, Mic, Shield, Database, Lock, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioWorkflowRoadmap, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function ReleaseProtocol() {
    const purposePoints = [
        {
            icon: ShieldCheck,
            title: 'Sequential Respect',
            description: 'Ensuring all levels of institutional authority are respected prior to publication.'
        },
        {
            icon: FileCheck,
            title: 'Output Validation',
            description: 'Confirming that all production outputs meet documented technical and spiritual standards.'
        },
        {
            icon: Database,
            title: 'Registry Integrity',
            description: 'Ensuring registry documentation is 100% complete and verified before release.'
        },
        {
            icon: Shield,
            title: 'Mission Preservation',
            description: 'Maintaining the long-term institutional integrity of the SufiPulse platform.'
        }
    ];

    const sequentialSteps = [
        { id: 1, title: 'Editorial Auth', icon: FileCheck, desc: 'Majlis-e-Nazr approval' },
        { id: 2, title: 'Production Clear', icon: Mic, desc: 'Technical execution lock' },
        { id: 3, title: 'Master Confirm', icon: Shield, desc: 'Central studio validation' },
        { id: 4, title: 'Registry Verify', icon: Database, desc: 'Diwan-e-Amanat audit' },
        { id: 5, title: 'Royalty Logic', icon: FileCheck, desc: 'Economic allocation lock' },
        { id: 6, title: 'Metadata Lock', icon: Lock, desc: 'Immutable record entry' },
        { id: 7, title: 'Publication Clear', icon: FileCheck, desc: 'Final release activation' }
    ];

    const nonBypassRequirements = [
        { title: 'Editorial Gate', desc: 'No release occurs without formal theological and thematic approval.' },
        { title: 'Production Gate', desc: 'No release occurs without traversing the structured production workflow.' },
        { title: 'Registry Gate', desc: 'No release occurs without immutable confirmation of all registry data.' },
        { title: 'Economic Gate', desc: 'No release occurs without documented and agreed royalty allocation.' }
    ];

    const irreversibilityPrinciples = [
        { title: 'Locked Credits', desc: 'Attribution data cannot be altered after registry finalization.' },
        { title: 'Immutable Metadata', desc: 'Technical specifications are permanently recorded in the archive.' },
        { title: 'Registry Finality', desc: 'Entry becomes a permanent part of the institutional record.' },
        { title: 'Fixed Allocation', desc: 'Economic distribution structures are set prior to publication.' }
    ];

    const authorityBoundaries = [
        {
            action: 'No Creative Evaluation',
            clarification: 'Thematic and artistic decisions remain strictly with editorial authority'
        },
        {
            action: 'No Studio Execution',
            clarification: 'Production execution is governed strictly by Production Oversight'
        },
        {
            action: 'No Charter Redefinition',
            clarification: 'All authority derives from and remains bound by Mithaq'
        }
    ];

    return (
        <Layout>
            {/* Cinematic Hero Section with /banner16.png */}
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner16.png"
                        alt="SufiPulse Release Protocol & Publication Authorization Chamber"
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
                                    SufiPulse USA — Publication Governance
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Release Protocol & Activation<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    {roleDisplayMap.release_protocol.mystical}
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                The Release Protocol defines the mandatory sequence required before any sacred work is published. Publication is a governed institutional act, ensuring full attribution, technical validation, and immutable registry lock.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/releases">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        Browse Public Releases
                                    </PrimaryButton>
                                </Link>
                                <Link href="/governance/diwan-e-amanat">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        Diwan-e-Amanat
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Purpose Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {purposePoints.map((item, idx) => (
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
                            title="Purpose"
                            subtitle="Safeguarding institutional standards through rigorous pre-publication verification"
                        />

                        <StudioCardGrid cols={4}>
                            {purposePoints.map((item, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={item.icon}
                                    title={item.title}
                                    description={item.description}
                                />
                            ))}
                        </StudioCardGrid>

                        <div className="mt-12 bg-[var(--color-midnight)]/30 border border-[var(--color-gold)]/20 rounded-xl p-8 text-center max-w-3xl mx-auto shadow-2xl">
                            <p className="text-[var(--text-sm)] text-neutral-400 leading-relaxed font-medium">
                                "Release follows authorization; it does not initiate it. No parallel shortcuts or procedural bypasses are permitted."
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioWorkflowRoadmap 
                title="Sequential Requirements"
                badge="Verification Pipeline"
                steps={sequentialSteps}
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12">
                            <div>
                                <StudioSectionHeader 
                                    title="Non-Bypass Principle"
                                    subtitle="Structural gates that prevent unverified publication"
                                />
                                <div className="space-y-4">
                                    {nonBypassRequirements.map((item, i) => (
                                        <div key={i} className="flex items-start gap-4 p-6 elite-card border-none bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-1.5 shrink-0" />
                                            <div>
                                                <p className="text-white font-bold uppercase tracking-widest text-xs mb-1">{item.title}</p>
                                                <p className="text-neutral-500 text-xs leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <StudioSectionHeader 
                                    title="Irreversibility Principle"
                                    subtitle="The finality of authorized publication records"
                                />
                                <div className="space-y-4">
                                    {irreversibilityPrinciples.map((item, i) => (
                                        <div key={i} className="flex items-start gap-4 p-6 elite-card border-none bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50 mt-1.5 shrink-0" />
                                            <div>
                                                <p className="text-white font-bold uppercase tracking-widest text-xs mb-1">{item.title}</p>
                                                <p className="text-neutral-500 text-xs leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Authority Boundaries"
                            subtitle="Defined limitations to ensure cross-layer accountability"
                        />

                        <div className="elite-card p-10 md:p-12">
                            <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                                {authorityBoundaries.map((boundary, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <p className="text-white text-sm font-bold uppercase tracking-wider">{boundary.action}</p>
                                        <p className="text-neutral-500 text-[11px] leading-relaxed font-medium uppercase tracking-widest">{boundary.clarification}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em] mt-12 pt-6 border-t border-white/5 text-center italic">
                                Protocol governs the formal act of publication.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Institutional Permanence"
                description="Authorized release is a recorded institutional moment, not a technical toggle. Once verified, the release record enters the Diwan-e-Amanat registry as a permanent documentation of sacred art."
                primaryCTA={{ label: "Registry Authority", href: "/governance/diwan-e-amanat" }}
                shieldText="Governed Release Protocol"
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
