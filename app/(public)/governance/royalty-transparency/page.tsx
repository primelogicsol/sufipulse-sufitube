"use client";
import { Users, ArrowRight, FileText, Lock, Database, ShieldCheck, Scale, DollarSign } from 'lucide-react';
import Image from 'next/image';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioWorkflowRoadmap, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function RoyaltyTransparency() {
    const allocationPrinciples = [
        {
            icon: Users,
            title: 'Role Recording',
            description: 'Contributor roles are formally recorded and validated prior to any economic discussion.'
        },
        {
            icon: Scale,
            title: 'Pre-Release Lock',
            description: 'Allocation percentages are confirmed and locked before the release enters the registry.'
        },
        {
            icon: Lock,
            title: 'Agreed Distribution',
            description: 'Distribution structures are agreed upon prior to publication through documented institutional protocols.'
        },
        {
            icon: Database,
            title: 'Registry Alignment',
            description: 'Final economic structures are immutably reflected within the Diwan-e-Amanat registry records.'
        }
    ];

    const eligibleRoles = [
        {
            role: 'Approved writers',
            mystical: 'Ahl-e-Qalam'
        },
        {
            role: 'Approved vocalists',
            mystical: 'Ahl-e-Sada'
        },
        {
            role: 'Approved producers',
            mystical: 'Ahl-e-Naghma'
        }
    ];

    const documentationSteps = [
        { id: 1, title: 'Contributor Confirm', icon: Users, desc: 'Identity verification' },
        { id: 2, title: 'Allocation Agreement', icon: FileText, desc: 'Economic structuring' },
        { id: 3, title: 'Registry Recording', icon: Database, desc: 'Immutable lock' },
        { id: 4, title: 'Registry Lock', icon: Lock, desc: 'Technical validation' },
        { id: 5, title: 'Release Auth', icon: FileText, desc: 'Publication clear' }
    ];

    const recordPrinciples = [
        {
            title: 'Pre-Publication Record',
            description: 'The economic structure of every release is defined and recorded before publication occurs.'
        },
        {
            title: 'Registry Traceability',
            description: 'Documentation remains permanently accessible through the institutional contributor registry.'
        },
        {
            title: 'Confirmed Allocations',
            description: 'The registry reflects final, confirmed allocations aligned with documented institutional agreements.'
        },
        {
            title: 'Immutable Status',
            description: 'Allocations cannot be altered post-publication without a formal, documented institutional review.'
        }
    ];

    const authorityBoundaries = [
        {
            action: 'No Creative Approval',
            clarification: 'Editorial authority remains strictly with Majlis-e-Nazr'
        },
        {
            action: 'No Studio Management',
            clarification: 'Production oversight governs technical and studio workflows'
        },
        {
            action: 'No Registry Overriding',
            clarification: 'Economic documentation follows institutional registry validation'
        }
    ];

    return (
        <>
            {/* Cinematic Hero Section with /banner18.png */}
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner18.png"
                        alt="SufiPulse Royalty Transparency & Economic Governance"
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
                                    SufiPulse USA — Economic Governance
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Royalty Transparency & Justice<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    {roleDisplayMap.royalty_transparency.mystical}
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                Royalty allocation within SufiPulse follows documented institutional protocols. All economic distributions are locked prior to publication and recorded immutably through registry validation.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/governance/diwan-e-amanat">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        Registry Authority
                                    </PrimaryButton>
                                </Link>
                                <Link href="/governance/mithaq">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        Constitutional Mithaq
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Allocation Principles Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {allocationPrinciples.map((item, idx) => (
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
                            title="Allocation Principles"
                            subtitle="Governing economic clarity and institutional fairness through documented protocol"
                        />

                        <StudioCardGrid cols={4}>
                            {allocationPrinciples.map((item, idx) => (
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
                            title="Eligible Roles"
                            subtitle="SufiPulse contributors eligible for royalty consideration within the institutional framework"
                        />

                        <div className="grid md:grid-cols-3 gap-8">
                            {eligibleRoles.map((item, idx) => (
                                <div key={idx} className="elite-card p-10 text-center hover:border-amber-400/30 transition-all">
                                    <div className="w-16 h-16 rounded-3xl bg-amber-400/5 border border-amber-400/10 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                        <Users className="text-amber-400 w-8 h-8" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg mb-2">{item.role}</h3>
                                    <p className="text-amber-400/80 text-[10px] font-black uppercase tracking-[0.2em]">{item.mystical}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 bg-black/20 border border-white/5 rounded-xl p-8 text-center max-w-3xl mx-auto">
                            <p className="text-[var(--text-sm)] text-neutral-500 leading-relaxed italic">
                                "Studio infrastructure operates under service governance unless otherwise contractually defined."
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioWorkflowRoadmap 
                title="Documentation Sequence"
                badge="Economic Pipeline"
                steps={documentationSteps}
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Transparency & Record"
                            subtitle="Immutable documentation of economic rights and institutional commitments"
                        />

                        <StudioCardGrid cols={2}>
                            {recordPrinciples.map((item, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={FileText}
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
                            title="Authority Boundaries"
                            subtitle="Defined limitations to ensure economic independence and procedural separation"
                        />

                        <div className="elite-card p-10 md:p-12">
                            <div className="grid md:grid-cols-3 gap-12">
                                {authorityBoundaries.map((boundary, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <p className="text-white text-sm font-bold uppercase tracking-wider">{boundary.action}</p>
                                        <p className="text-neutral-500 text-[11px] leading-relaxed font-medium uppercase tracking-widest">{boundary.clarification}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em] mt-12 pt-6 border-t border-white/5 text-center italic">
                                Framework governs economic clarity prior to release activation.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Economic Justice"
                description="Transparency protects contributors and the institution equally. By locking allocation structures in the registry, SufiPulse ensures that spiritual art remains untainted by commercial disputes."
                primaryCTA={{ label: "Registry Authority", href: "/governance/diwan-e-amanat" }}
                secondaryCTA={{ label: "Constitutional Mithaq", href: "/governance/mithaq" }}
                shieldText="Governed Royalty Framework"
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
        </>
    );
}
