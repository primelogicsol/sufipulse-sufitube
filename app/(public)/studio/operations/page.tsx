"use client";
import { Shield, FileCheck, Layers, FileDigit, Globe, Share2, Activity } from 'lucide-react';
import Image from 'next/image';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function StudioOperations() {
    const functions = [
        {
            title: 'Release & Catalog Management',
            icon: Layers,
            description: 'Governing the overarching lifecycle of a project from concept to canonical integration.'
        },
        {
            title: 'Metadata & Credits Administration',
            icon: FileCheck,
            description: 'Ensuring every contributor receives accurate, institutionally verified recognition across all platforms.'
        },
        {
            title: 'Lyrics, Translation & Caption Operations',
            icon: FileDigit,
            description: 'Managing multilingual accessibility, SRT/VTT/ASS asset creation, and strict translational accuracy.'
        },
        {
            title: 'Media Asset & Version Control',
            icon: Shield,
            description: 'Maintaining absolute control over canonical files versus stems, alternates, and working drafts.'
        },
        {
            title: 'Platform Integration & Distribution',
            icon: Globe,
            description: 'Routing canonical masters seamlessly to official delivery endpoints.'
        },
        {
            title: 'Publishing & Delivery Management',
            icon: Share2,
            description: 'Coordinating the timing and sequence of global release visibility.'
        },
        {
            title: 'Analytics & Delivery Assurance',
            icon: Activity,
            description: 'Tracking synchronization states, platform ingestion success, and post-release performance.'
        }
    ];

    return (
        <>
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner11.png"
                        alt="Studio Operations & Release Control"
                        fill
                        priority
                        quality={95}
                        className="object-cover object-center scale-105 transform motion-safe:animate-fade-in"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-midnight)]/90 via-[var(--color-midnight)]/75 to-[var(--color-midnight)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[var(--color-midnight)]/70 to-[var(--color-midnight)]" />
                </div>

                <div className="relative z-10">
                    <PageContainer>
                        <div className="max-w-5xl mx-auto text-center">
                            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
                                <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
                                <span className="text-[11px] md:text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold">
                                    SufiPulse Studio USA — Studio Operations & Release Control
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Studio Operations & <br className="hidden md:block" />
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    Release Control
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                The command center ensuring that production outputs coalesce into a single, unified canonical release record.
                            </p>
                        </div>
                    </PageContainer>
                </div>
            </section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-xl p-10 mb-12">
                            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">The Canonical Release Record</h2>
                            <p className="text-neutral-300 leading-relaxed mb-6">
                                Production systems create assets, but Studio Operations controls the <strong>canonical release</strong>. This record is the definitive source of truth encompassing:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                {[
                                    'Master Audio',
                                    'Master Video',
                                    'Approved Lyrics',
                                    'Translations',
                                    'Caption Tracks (SRT/VTT/ASS)',
                                    'Credits & Metadata',
                                    'Release Status & Media Versions',
                                    'YouTube Video ID & Public Identity',
                                    'Publication & Delivery Status'
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        <span className="text-sm font-bold uppercase tracking-widest text-neutral-400">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <StudioSectionHeader 
                            title="Operating Functions"
                            subtitle="Core responsibilities of Studio Operations"
                        />

                        <StudioCardGrid cols={3}>
                            {functions.map((sub, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={sub.icon}
                                    title={sub.title}
                                    description={sub.description}
                                />
                            ))}
                        </StudioCardGrid>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Control & Authority"
                description="Studio Operations guarantees that no asset reaches external distribution endpoints without rigorous internal validation and metadata lockdown."
                primaryCTA={{ label: "View Studio Overview", href: "/studio" }}
                shieldText="Release Governance Mandatory"
                background="midnight"
            />
        </>
    );
}
