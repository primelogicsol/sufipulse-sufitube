"use client";
import { FileCheck, ArrowRight, Shield, Database, ShieldCheck, History, Archive, Lock } from 'lucide-react';
import Image from 'next/image';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioWorkflowRoadmap, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function DiwanEAmanat() {
    const mandatePoints = [
        {
            icon: ShieldCheck,
            title: 'Credit Confirmation',
            description: 'Permanent documentation and verification of all contributor credits prior to release.'
        },
        {
            icon: Database,
            title: 'Royalty Documentation',
            description: 'Formal recording of economic allocation structures within the institutional registry.'
        },
        {
            icon: Lock,
            title: 'Metadata Locking',
            description: 'Ensuring all technical and creative metadata is immutably locked before publication.'
        },
        {
            icon: Shield,
            title: 'Structured Verification',
            description: 'Authorized validation sequence that must be traversed for every release record.'
        }
    ];

    const responsibilityAreas = [
        {
            label: 'Master Confirmation',
            description: 'Final validation that production output meets institutional registry standards.'
        },
        {
            label: 'Identity Verification',
            description: 'Documented confirmation of all participating writers, vocalists, and producers.'
        },
        {
            label: 'Rights Documentation',
            description: 'Formalization of allocation structures and agreement records for all stakeholders.'
        },
        {
            label: 'Institutional Archive',
            description: 'Permanent record entry ensuring long-term preservation of release documentation.'
        }
    ];

    const finalizationSteps = [
        { id: 1, title: 'Master Confirm', icon: FileCheck, desc: 'Production validation' },
        { id: 2, title: 'Credit Verify', icon: Shield, desc: 'Identity documentation' },
        { id: 3, title: 'Royalty Logic', icon: Database, desc: 'Economic recording' },
        { id: 4, title: 'Metadata Lock', icon: Lock, desc: 'Immutable record entry' },
        { id: 5, title: 'Release Clear', icon: FileCheck, desc: 'Publication authorized' }
    ];

    const authorityBoundaries = [
        {
            action: 'No Creative Evaluation',
            clarification: 'Thematic and artistic decisions remain with editorial authority'
        },
        {
            action: 'No Studio Management',
            clarification: 'Production execution is governed by Production Oversight'
        },
        {
            action: 'No Content Modification',
            clarification: 'Authority over approved kalam resides with Majlis-e-Nazr'
        },
        {
            action: 'No Charter Overriding',
            clarification: 'All authority derives from and remains bound by Mithaq'
        }
    ];

    return (
        <Layout>
            {/* Cinematic Hero Section with /banner17.png */}
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner17.png"
                        alt="SufiPulse Diwan-e-Amanat Registry Authority & Archive Vault"
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
                                    SufiPulse USA — Registry Authority
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Registry & Custodial Trust<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    {roleDisplayMap.diwan_e_amanat.mystical}
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                The Registry Authority governs final validation, permanent contributor documentation, metadata locking, and release authorization. No work is published under SufiPulse without registry confirmation.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/governance/release-protocol">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        Release Protocol
                                    </PrimaryButton>
                                </Link>
                                <Link href="/governance/royalty-transparency">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        Royalty Framework
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
                            title="Mandate & Validation Authority"
                            subtitle="Transforming production output into institutional record through immutable documentation"
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
                            title="Scope of Responsibility"
                            subtitle="Supervising the transition from production to permanent archive"
                        />

                        <StudioCardGrid cols={2}>
                            {responsibilityAreas.map((area, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={Archive}
                                    title={area.label}
                                    description={area.description}
                                />
                            ))}
                        </StudioCardGrid>

                        <div className="mt-12 bg-[var(--color-midnight)]/30 border border-[var(--color-gold)]/20 rounded-xl p-8 text-center max-w-3xl mx-auto shadow-2xl">
                            <p className="text-[var(--text-sm)] text-neutral-400 leading-relaxed font-medium">
                                "Registry formalizes what production completes. It serves as the final seal of institutional approval."
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioWorkflowRoadmap 
                title="Finalization Sequence"
                badge="Registry Pipeline"
                steps={finalizationSteps}
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Authority Boundaries"
                            subtitle="Defined limitations to ensure registry independence and procedural integrity"
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
                                Authority begins after production confirmation and concludes at publication authorization.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Institutional Record"
                description="Release is not a technical toggle; it is a recorded institutional act. Every authorized release contains confirmed contributor attribution and archived metadata traceable across institutional continuity."
                primaryCTA={{ label: "Release Protocol", href: "/governance/release-protocol" }}
                secondaryCTA={{ label: "Royalty Framework", href: "/governance/royalty-transparency" }}
                shieldText="Governed Registry Authority"
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
        </Layout>
    );
}
