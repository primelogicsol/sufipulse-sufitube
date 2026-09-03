"use client";
import { Music, Radio, Mic2, Settings, Waves } from 'lucide-react';
import Image from 'next/image';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function MusicProduction() {
    const subdivisions = [
        {
            title: 'Composition & Song Development',
            icon: Music,
            description: 'Song architecture, hooks, sections, melodic direction, production concept, and musical interpretation of approved lyrical material.',
            leadLabel: 'Led by',
            lead: 'Michael "SufiPulse" Hartman · Arman Sayeed'
        },
        {
            title: 'Arrangement & Sound Design',
            icon: Waves,
            description: 'Instrumentation, tempo, sonic architecture, texture, dynamics, spatial production, and sound design.',
            leadLabel: 'Led by',
            lead: 'Ryan Cole'
        },
        {
            title: 'Vocal Production',
            icon: Mic2,
            description: 'Vocal character, performance direction, pronunciation, phrasing, interpretation, vocal processing, and voice-to-composition alignment.',
            leadLabel: 'Led by',
            lead: 'Lucas Ray'
        },
        {
            title: 'Audio Production & Mastering',
            icon: Settings,
            description: 'Production engineering, mixing, final technical processing, format validation, distribution-ready mastering, and quality control.',
            leadLabel: 'Technical Leads',
            lead: 'Michael "SufiPulse" Hartman · Elijah James'
        },
        {
            title: 'Lyrics Alignment & Audio Intelligence',
            icon: Radio,
            description: 'Lyric-line timing, word-level alignment, waveform analysis, synchronization, caption timing preparation, and master lyric-to-audio timeline.',
            leadLabel: 'Technical Unit',
            lead: 'Studio Audio Intelligence'
        }
    ];

    return (
        <>
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner10.png"
                        alt="Music Production & Audio Engineering Division"
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
                                    SufiPulse USA — Music Production & Audio Engineering Division
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Music Production & <br className="hidden md:block" />
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    Audio Engineering
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                The architectural foundation of all SufiPulse releases, where sacred lyrics are musically interpreted, arranged, and sonically perfected for global distribution.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/studio-engineers">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        View Studio Engineers
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
                                    { label: 'Composition & Song Development', sub: 'Song architecture & direction' },
                                    { label: 'Arrangement & Sound Design', sub: 'Instrumentation & sonic architecture' },
                                    { label: 'Vocal Production', sub: 'Performance & vocal processing' },
                                    { label: 'Audio Production & Mastering', sub: 'Mixing, mastering & QC' },
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
                            subtitle="The distinct functional units handling musical and technical architecture"
                        />

                        <StudioCardGrid cols={2}>
                            {subdivisions.map((sub, idx) => (
                                <StudioLinkCard
                                    key={idx}
                                    icon={sub.icon}
                                    title={sub.title}
                                    description={sub.description}
                                    subtitle={`${sub.leadLabel}: ${sub.lead}`}
                                />
                            ))}
                        </StudioCardGrid>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Engineering Custodianship"
                description="Technical mastery serving sacred expression. Every frequency and waveform is aligned to our core institutional standard before final master validation."
                primaryCTA={{ label: "View Studio Engineers", href: "/studio-engineers" }}
                shieldText="Production Standards Mandatory"
                background="midnight"
            />
        </>
    );
}
