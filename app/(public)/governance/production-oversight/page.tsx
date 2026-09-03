"use client";
import { Settings, ArrowRight, Mic, Network, Headphones, FileCheck, Database, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioWorkflowRoadmap, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function ProductionOversight() {
    const mandatePoints = [
        {
            icon: FileCheck,
            title: 'Structured Entry',
            description: 'Ensuring only approved kalam from the Majlis-e-Nazr enters the production pipeline.'
        },
        {
            icon: Settings,
            title: 'Workflow Sequencing',
            description: 'Maintaining strict adherence to the documented studio and production sequence.'
        },
        {
            icon: ShieldCheck,
            title: 'Technical Standards',
            description: 'Consistent application of high-fidelity audio standards across the global network.'
        },
        {
            icon: Database,
            title: 'Registry Handoff',
            description: 'Validating technical documentation and master quality prior to registry entry.'
        }
    ];

    const supervisionAreas = [
        {
            label: 'Recording Sessions',
            description: 'Vocalist performance capture and quality verification in regional studios.'
        },
        {
            label: 'Network Coordination',
            description: 'Managing distributed studio execution within centralized institutional standards.'
        },
        {
            label: 'Sonic Alignment',
            description: 'Supervising mixing and mastering to ensure thematic and technical consistency.'
        },
        {
            label: 'Metadata Readiness',
            description: 'Confirming technical documentation is complete for final registry Handover.'
        }
    ];

    const executionSteps = [
        { id: 1, title: 'Approved Kalam', icon: FileCheck, desc: 'Editorial council authorization' },
        { id: 2, title: 'Talent Assignment', icon: Mic, desc: 'Vocalist and producer matching' },
        { id: 3, title: 'Network Allocation', icon: Network, desc: 'Studio resource scheduling' },
        { id: 4, title: 'Recording', icon: Headphones, desc: 'Master-grade capture' },
        { id: 5, title: 'Central Review', icon: Settings, desc: 'Technical and thematic audit' },
        { id: 6, title: 'Master Confirmation', icon: FileCheck, desc: 'Final production lock' },
        { id: 7, title: 'Registry Handoff', icon: Database, desc: 'Institutional record entry' }
    ];

    const authorityBoundaries = [
        {
            action: 'No Publication Authority',
            clarification: 'Release activation requires registry confirmation by Diwan-e-Amanat'
        },
        {
            action: 'No Thematic Approval',
            clarification: 'Editorial authority remains strictly with Majlis-e-Nazr'
        },
        {
            action: 'No Royalty Modification',
            clarification: 'Economic distribution follows the constitutional framework'
        },
        {
            action: 'No Charter Alteration',
            clarification: 'All authority derives from and remains bound by Mithaq'
        }
    ];

    return (
        <>
            {/* Cinematic Hero Section with /banner15.png */}
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pb-16 md:pb-24 border-b border-[var(--color-border)] hero-bleed">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner15.png"
                        alt="SufiPulse Production Oversight & Execution Governance Chamber"
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
                <div className="relative z-10" style={{ paddingTop: 'var(--hero-content-top)' }}>
                    <PageContainer>
                        <div className="max-w-5xl mx-auto text-center">
                            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
                                <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
                                <span className="text-[11px] md:text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold">
                                    SufiPulse USA — Execution Governance
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Production Oversight & Standards<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    {roleDisplayMap.production_oversight.mystical}
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                Production Oversight governs the structured execution of approved works, ensuring that recording, mixing, mastering, and technical validation strictly adhere to documented institutional standards.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/studio">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        Studio Network
                                    </PrimaryButton>
                                </Link>
                                <Link href="/governance/majlis-e-nazr">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        Editorial Council
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Mandate Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {mandatePoints.map((item, idx) => (
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
                            title="Mandate & Operational Control"
                            subtitle="Governing process integrity and technical fidelity throughout the production lifecycle"
                        />

                        <StudioCardGrid cols={4}>
                            {mandatePoints.map((item, idx) => (
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
                            title="Scope of Oversight"
                            subtitle="Supervisory authority across regional and centralized production nodes"
                        />

                        <StudioCardGrid cols={2}>
                            {supervisionAreas.map((area, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={Settings}
                                    title={area.label}
                                    description={area.description}
                                />
                            ))}
                        </StudioCardGrid>

                        <div className="mt-12 bg-[var(--color-midnight)]/30 border border-[var(--color-gold)]/20 rounded-xl p-8 text-center max-w-3xl mx-auto shadow-2xl">
                            <p className="text-[var(--text-sm)] text-neutral-400 leading-relaxed font-medium">
                                "Execution remains centralized through defined authority. Regional network participation does not alter or dilute institutional standards."
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioWorkflowRoadmap 
                title="Execution Flow"
                badge="Production Sequence"
                steps={executionSteps}
                description="No step is optional. Technical compliance and registry adherence is mandatory."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Authority Boundaries"
                            subtitle="Defined limitations to ensure procedural integrity and separation of powers"
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
                                Authority concludes at registry handoff.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Centralized Validation Principle"
                description="Distributed execution operates within centralized governance. All recording sessions and masters are subject to final technical validation by the SufiPulse Central Studio."
                primaryCTA={{ label: "Studio Network", href: "/studio" }}
                secondaryCTA={{ label: "Majlis-e-Nazr", href: "/governance/majlis-e-nazr" }}
                shieldText="Governed Production Oversight"
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
