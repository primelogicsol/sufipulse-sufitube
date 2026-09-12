"use client";
import { Video, Paintbrush, Package, Image as ImageIcon, Film } from 'lucide-react';
import Image from 'next/image';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function CreativeAssets() {
    const subdivisions = [
        {
            title: 'Music Video Production',
            icon: Video,
            description: 'Scene concepts, video sequencing, footage selection, visual storytelling, motion/pacing, audio-to-picture synchronization',
            responsibilities: 'Translating audio emotion into a cohesive visual sequence.'
        },
        {
            title: 'Visual Direction & Art Design',
            icon: Paintbrush,
            description: 'Visual concept, art direction, color, typography, symbolism, imagery, mood',
            responsibilities: 'Establishing the foundational visual identity for each release.'
        },
        {
            title: 'Branding & Release Packaging',
            icon: Package,
            description: 'SufiPulse identity, title treatments, logo use, opening/ending cards, credits, release artwork, cover assets',
            responsibilities: 'Ensuring absolute consistency with SufiPulse institutional branding guidelines.'
        },
        {
            title: 'Thumbnail & Promotional Creative',
            icon: ImageIcon,
            description: 'YouTube thumbnails, teaser graphics, promotional visuals, announcement assets, banners, campaign creative',
            responsibilities: 'Crafting visually arresting assets designed for search and discoverability without compromising artistic integrity.'
        },
        {
            title: 'Video Post-Production & Mastering',
            icon: Film,
            description: 'Final edit, transitions, timing, resolution, export profiles, format QC, delivery master',
            responsibilities: 'Rendering the final canonical visual asset ready for distribution.'
        }
    ];

    return (
        <>
            <section className="relative w-full min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[var(--color-midnight)] pb-16 md:pb-24 border-b border-[var(--color-border)] hero-bleed">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner8.png"
                        alt="Creative Asset Production Division"
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
                                    SufiPulse USA — Creative Asset Production Division
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Creative Asset & <br className="hidden md:block" />
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    Visual Production
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                Transforming sonic architecture into cohesive visual experiences. This division governs all release artwork, music video sequences, and promotional packaging.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/studio/operations">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        Studio Operations
                                    </PrimaryButton>
                                </Link>
                                <Link href="/studio">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        ← SufiPulse Studio USA
                                    </PrimaryButton>
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {[
                                    { label: 'Music Video Production', sub: 'Scene concepts & visual storytelling' },
                                    { label: 'Visual Direction & Art Design', sub: 'Color, typography & mood' },
                                    { label: 'Branding & Release Packaging', sub: 'Identity & release artwork' },
                                    { label: 'Video Post-Production', sub: 'Final edit, export & delivery master' },
                                ].map((item, idx) => (
                                    <div key={idx} className="text-center p-2">
                                        <div className="text-sm md:text-base font-bold text-[var(--color-text-primary)] mb-1">{item.label}</div>
                                        <div className="text-[11px] text-[var(--color-text-tertiary)] leading-snug line-clamp-2">{item.sub}</div>
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
                            title="Divisional Operations"
                            subtitle="The creative units responsible for the visual identity of every SufiPulse release"
                        />

                        <StudioCardGrid cols={2}>
                            {subdivisions.map((sub, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={sub.icon}
                                    title={sub.title}
                                    description={sub.description}
                                    subtitle={sub.responsibilities}
                                />
                            ))}
                        </StudioCardGrid>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Visual Integrity"
                description="All creative assets are designed to elevate the sacred text without obscuring its meaning. We maintain a strict visual grammar across all platforms."
                primaryCTA={{ label: "View Studio Overview", href: "/studio" }}
                shieldText="Brand Consistency Mandatory"
                background="midnight"
            />
        </>
    );
}
