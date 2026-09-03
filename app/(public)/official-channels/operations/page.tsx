"use client";
import { MonitorPlay, Search, Subtitles, ListMusic, BarChart, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function PlatformDistributionOperations() {
    const functions = [
        {
            title: 'Video Publishing & Channel Operations',
            icon: MonitorPlay,
            description: 'Managing the ingestion, scheduling, and publication logic for YouTube and authorized endpoints.'
        },
        {
            title: 'Metadata & Discoverability',
            icon: Search,
            description: 'SEO optimization, tagging, structured data, and search-demand capture for Sufi culture.'
        },
        {
            title: 'Caption & Localization Delivery',
            icon: Subtitles,
            description: 'Applying synchronized SRT/VTT/ASS tracks and translated metadata for global reach.'
        },
        {
            title: 'Playlist & Catalog Distribution',
            icon: ListMusic,
            description: 'Structuring public catalog access through curated channels and sequential playlists.'
        },
        {
            title: 'Audience Analytics & Performance',
            icon: BarChart,
            description: 'Tracking viewership, engagement vectors, and geographic penetration.'
        },
        {
            title: 'Delivery Synchronization & Verification',
            icon: CheckCircle2,
            description: 'Verifying successful ingestion and aligning external platform states with internal canonical records.'
        }
    ];

    return (
        <>
            <section className="relative w-full min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[var(--color-midnight)] pb-16 md:pb-24 border-b border-[var(--color-border)] hero-bleed">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner24.png"
                        alt="Platform & Video Distribution Operations"
                        fill
                        priority
                        quality={95}
                        className="object-cover object-center scale-105 transform motion-safe:animate-fade-in"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-midnight)]/90 via-[var(--color-midnight)]/75 to-[var(--color-midnight)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[var(--color-midnight)]/70 to-[var(--color-midnight)]" />
                </div>

                <div className="relative z-10 pt-20 md:pt-32">
                    <PageContainer>
                        <div className="max-w-5xl mx-auto text-center">
                            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
                                <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
                                <span className="text-[11px] md:text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold">
                                    SufiPulse USA — Platform & Video Distribution Operations
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Platform & Video <br className="hidden md:block" />
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    Distribution Operations
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                Managing the complex interface between the canonical studio release and global distribution platforms, specifically YouTube and official channels.
                            </p>
                        </div>
                    </PageContainer>
                </div>
            </section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-xl p-10 mb-12">
                            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">The Distribution Relationship</h2>
                            <p className="text-neutral-300 leading-relaxed mb-6">
                                The flow of authority is strictly unidirectional:
                            </p>
                            <div className="flex flex-col md:flex-row items-center gap-4 text-center">
                                <div className="flex-1 bg-black/40 p-6 rounded-xl border border-white/5">
                                    <h3 className="text-amber-400 font-bold uppercase tracking-widest text-sm mb-2">Source of Truth</h3>
                                    <p className="text-neutral-400 text-xs">SufiPulse Studio USA<br/>(Approved Canonical Release)</p>
                                </div>
                                <div className="text-amber-400">→</div>
                                <div className="flex-1 bg-black/40 p-6 rounded-xl border border-white/5">
                                    <h3 className="text-amber-400 font-bold uppercase tracking-widest text-sm mb-2">Routing</h3>
                                    <p className="text-neutral-400 text-xs">Platform & Video<br/>Distribution Operations</p>
                                </div>
                                <div className="text-amber-400">→</div>
                                <div className="flex-1 bg-black/40 p-6 rounded-xl border border-white/5">
                                    <h3 className="text-amber-400 font-bold uppercase tracking-widest text-sm mb-2">Endpoint</h3>
                                    <p className="text-neutral-400 text-xs">YouTube &<br/>Authorized Channels</p>
                                </div>
                            </div>
                            <p className="text-neutral-500 text-xs mt-6 text-center uppercase tracking-widest">
                                External platforms are distribution endpoints, NOT the source of truth. They report video identity, publication state, and analytics back to the Studio.
                            </p>
                        </div>

                        <StudioSectionHeader 
                            title="Distribution Functions"
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
                title="Distribution Integrity"
                description="Distribution channels are amplifiers, not architects. Our external presence is perfectly synchronized with our internal canonical identity."
                primaryCTA={{ label: "View Official Channels", href: "/official-channels" }}
                shieldText="Endpoint Verification Mandatory"
                background="midnight"
            />
        </>
    );
}
