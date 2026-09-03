"use client";
import { Music, Radio, Sparkles, Waves, Users, Mic as Mic2, Music2, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { useState } from 'react';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function MusicStyleSelection() {
    const [activeTab, setActiveTab] = useState('fundamentals');

    const tabs = [
        { id: 'fundamentals', label: 'Sacred Fundamentals', icon: BookOpen },
        { id: 'maqam', label: 'Maqam & Spiritual Modes', icon: Music },
        { id: 'rhythms', label: 'Sacred Rhythms & Dhikr', icon: Radio },
        { id: 'acoustics', label: 'Sacred Acoustics', icon: Waves }
    ];

    const sacredFundamentals = {
        overview: 'Sufi music theory transcends conventional musical analysis, incorporating spiritual dimensions that transform sound into a vehicle for divine connection.',
        corePrinciples: [
            {
                title: 'Intention (Niyyah)',
                description: 'The foundation of sacred sound',
                detail: 'Every note, every breath, every silence begins with conscious spiritual intention. Without pure niyyah, technical perfection remains spiritually hollow.'
            },
            {
                title: 'Breath (Nafas)',
                description: 'The source of spiritual vibration',
                detail: 'Breath is not merely a physiological function—it is the bridge between the physical and spiritual realms, the carrier of divine remembrance.'
            },
            {
                title: 'Rhythm (Wazn)',
                description: 'The heartbeat of divine remembrance',
                detail: 'Sacred rhythm mirrors the pulse of creation itself, synchronizing the human heart with cosmic rhythms and creating resonance with divine order.'
            },
            {
                title: 'Melody (Lahn)',
                description: 'The pathway to transcendence',
                detail: 'Melody in sacred music is not entertainment but elevation—a sonic ladder that guides the soul from earthly attachment toward divine presence.'
            }
        ],
        practicalApplications: [
            'Creating music that serves spiritual elevation rather than mere entertainment',
            'Balancing technical excellence with sacred purpose and intention',
            'Understanding the transformative role of silence in sacred composition',
            'Harmonizing traditional forms with contemporary expression while preserving authenticity'
        ]
    };

    const maqamSystem = {
        overview: 'The maqam system in Sufi music serves not just as a melodic framework, but as a spiritual technology for inducing specific states of consciousness.',
        corePrinciples: [
            {
                title: 'Spiritual State Correspondence',
                description: 'Each maqam corresponds to different spiritual states',
                detail: 'Maqam Rast evokes nobility and spiritual strength, Bayati conveys longing and devotion, Hijaz expresses spiritual intensity, while Saba embodies deep introspection and contemplation.'
            },
            {
                title: 'Modal Progression',
                description: 'Modal progression mirrors the journey of the soul',
                detail: 'Movement between maqamat represents spiritual transformation—the soul\'s journey from separation to union, from ignorance to enlightenment.'
            },
            {
                title: 'Microtonal Inflections',
                description: 'Microtonal inflections carry emotional and spiritual weight',
                detail: 'Quarter tones and subtle pitch variations express spiritual nuances beyond Western equal temperament, capturing states of yearning, ecstasy, and surrender.'
            },
            {
                title: 'Traditional Preservation',
                description: 'Traditional modes preserve centuries of spiritual wisdom',
                detail: 'Each maqam carries the prayers and spiritual experiences of countless seekers across centuries, making them vessels of accumulated sacred knowledge.'
            }
        ],
        practicalApplications: [
            'Selecting appropriate maqams for different kalam themes and spiritual intentions',
            'Using modal modulation to enhance spiritual narrative and emotional journey',
            'Preserving authentic traditional expressions while allowing creative innovation',
            'Adapting classical modes for contemporary productions without losing spiritual essence'
        ]
    };

    const sacredRhythms = {
        overview: 'Rhythm in Sufi music mirrors the natural rhythms of creation—the heartbeat, the breath, the cosmic cycles—creating resonance between the human soul and divine order.',
        corePrinciples: [
            {
                title: 'Natural Synchronization',
                description: 'Rhythmic patterns that synchronize with natural breathing',
                detail: 'Sacred rhythms align with the human breath cycle, allowing participants to enter meditative states naturally through rhythmic entrainment.'
            },
            {
                title: 'Cosmic Harmony',
                description: 'Polyrhythmic structures reflecting cosmic harmony',
                detail: 'Layered rhythms mirror the simultaneous cycles of creation—the rotation of planets, seasons, heartbeats—creating multi-dimensional spiritual experience.'
            },
            {
                title: 'Spiritual Acceleration',
                description: 'The role of acceleration in spiritual ecstasy',
                detail: 'Gradual rhythmic intensification (tarji) guides practitioners from contemplation through remembrance into states of spiritual ecstasy and divine connection.'
            },
            {
                title: 'Sacred Space',
                description: 'Silence and space as integral rhythmic elements',
                detail: 'The space between beats is as sacred as the beats themselves—silence allows divine presence to resonate and spiritual insights to crystallize.'
            }
        ],
        practicalApplications: [
            'Designing rhythms that support meditative states and spiritual concentration',
            'Creating polyrhythmic textures for group dhikr and collective spiritual practice',
            'Using tempo changes strategically to guide the spiritual journey',
            'Balancing rhythmic complexity with accessibility for diverse participants'
        ]
    };

    const sacredAcoustics = {
        overview: 'Sacred acoustics combines scientific understanding of sound with metaphysical principles, creating environments where the divine can resonate through physical space.',
        corePrinciples: [
            {
                title: 'Spiritual Frequencies',
                description: 'Frequency relationships that promote spiritual states',
                detail: 'Certain frequency ratios and harmonic relationships naturally induce contemplative states, opening channels for spiritual reception and divine connection.'
            },
            {
                title: 'Resonant Spaces',
                description: 'Acoustic spaces designed for sacred resonance',
                detail: 'Architecture and acoustic design that allows sound to reverberate in ways that enhance spiritual experience—from mosque domes to recording studios.'
            },
            {
                title: 'Overtone Spirituality',
                description: 'The role of overtones in mystical experience',
                detail: 'Natural overtones create invisible harmonies that resonate with spiritual centers, creating multi-dimensional listening experiences that transcend the fundamental.'
            },
            {
                title: 'Divine Order',
                description: 'Harmonic series as reflection of divine order',
                detail: 'The mathematical perfection of the harmonic series mirrors divine order in creation—each overtone a reflection of the One manifesting as many.'
            }
        ],
        practicalApplications: [
            'Studio design for optimal spiritual recording and sonic clarity',
            'Frequency selection for maximum spiritual impact and emotional resonance',
            'Creating acoustic environments for live performance that enhance sacred experience',
            'Understanding the physics of vocal projection in sacred space'
        ]
    };

    const roleApplications = [
        {
            role: 'For Composers',
            icon: Music2,
            description: 'Apply sacred principles to create spiritually resonant compositions',
            practices: [
                'Modal selection aligned with spiritual themes and intentions',
                'Rhythmic patterns designed for dhikr and spiritual practice',
                'Harmonic progressions that facilitate transcendence',
                'Silence and space as compositional elements'
            ]
        },
        {
            role: 'For Vocalists',
            icon: Mic2,
            description: 'Understand how vocal techniques serve spiritual expression',
            practices: [
                'Breath control for sustained dhikr and spiritual intention',
                'Microtonal inflection for emotional and spiritual depth',
                'Vocal projection in sacred space and resonant environments',
                'Timbral qualities that convey spiritual states'
            ]
        },
        {
            role: 'For Producers',
            icon: Sparkles,
            description: 'Technical approaches that honor sacred musical principles',
            practices: [
                'Frequency selection for spiritual impact and clarity',
                'Reverb design that creates sacred acoustic space',
                'Dynamic range that supports the spiritual journey',
                'Stereo imaging that enhances spatial spiritual experience'
            ]
        }
    ];

    const renderContent = () => {
        const contentMap: Record<string, any> = {
            fundamentals: sacredFundamentals,
            maqam: maqamSystem,
            rhythms: sacredRhythms,
            acoustics: sacredAcoustics
        };

        const data = contentMap[activeTab];

        if (!data) return null;

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-xl p-10 shadow-2xl">
                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Overview</h3>
                    <p className="text-neutral-300 text-lg leading-relaxed font-light">
                        {data.overview}
                    </p>
                </div>

                <div>
                    <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em] mb-8 text-center md:text-left">Core Principles</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        {data.corePrinciples.map((principle: any, idx: number) => (
                            <div key={idx} className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-xl p-8 hover:border-amber-400/30 transition-all group">
                                <div className="flex items-start gap-4">
                                    <div className="w-1 h-12 bg-amber-400/20 group-hover:bg-amber-400 transition-colors rounded-full flex-shrink-0" />
                                    <div>
                                        <h4 className="text-white font-bold text-lg mb-1">{principle.title}</h4>
                                        <p className="text-amber-400/80 text-xs font-black uppercase tracking-widest mb-4">{principle.description}</p>
                                        <p className="text-neutral-400 text-sm leading-relaxed">{principle.detail}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-black/20 border border-white/5 rounded-xl p-10">
                    <h3 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-amber-400" /> Practical Applications
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {data.practicalApplications.map((app: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                                <p className="text-neutral-300 text-sm font-medium leading-relaxed">{app}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Cinematic Hero Section with /banner12.png */}
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pb-16 md:pb-24 border-b border-[var(--color-border)] hero-bleed">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner12.png"
                        alt="SufiPulse Sacred Music Theory, Maqamat, & Compositional Architecture"
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
                                    SufiPulse USA — Compositional Theory
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Sacred Music Theory & Style<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    {roleDisplayMap.music_style_selection.mystical}
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                Comprehensive exploration of the spiritual principles, modal frameworks (Maqamat), sacred rhythms (Wazn), and acoustics that guide musical expression within SufiPulse productions.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/producers">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        Producers & Architecture
                                    </PrimaryButton>
                                </Link>
                                <Link href="/governance">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        Production Governance
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* 4 Pillars Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {sacredFundamentals.corePrinciples.map((item, idx) => (
                                    <div key={idx} className="text-center p-2">
                                        <Music className="w-7 h-7 text-[var(--color-gold)] mx-auto mb-2 opacity-90" />
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
                        <div className="bg-[var(--color-midnight)]/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden mb-12 shadow-2xl">
                            <div className="grid grid-cols-2 md:grid-cols-4">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`p-6 text-center border-b-2 transition-all group ${isActive
                                                ? 'border-amber-400 bg-amber-400/5'
                                                : 'border-transparent hover:bg-white/[0.02]'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-amber-400' : 'text-neutral-600 group-hover:text-neutral-400'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-white' : 'text-neutral-500'}`}>
                                                    {tab.label}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {renderContent()}
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Cross-Role Implementation"
                            subtitle="How sacred music theory translates into real-world spiritual practice across different contributor roles"
                            centered
                        />

                        <div className="space-y-12">
                            {roleApplications.map((roleApp, idx) => (
                                <div key={idx} className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-xl p-10 hover:border-amber-400/20 transition-all shadow-xl">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 border-b border-white/5 pb-8">
                                        <div className="p-4 bg-amber-400/5 rounded-2xl border border-amber-400/10">
                                            <roleApp.icon className="w-8 h-8 text-amber-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white tracking-tight">{roleApp.role}</h3>
                                            <p className="text-amber-400/80 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{roleApp.description}</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8 items-center">
                                        <div className="space-y-4">
                                            {roleApp.practices.map((practice, pIdx) => (
                                                <div key={pIdx} className="flex items-start gap-4 p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-black/40 transition-all group">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40 group-hover:bg-amber-400 mt-1.5 flex-shrink-0" />
                                                    <p className="text-neutral-300 text-sm font-medium leading-relaxed">{practice}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="hidden md:block opacity-20 hover:opacity-40 transition-opacity p-8">
                                            <roleApp.icon className="w-full h-auto text-amber-400 stroke-[0.5]" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Guiding Philosophy"
                description="Sacred music theory at SufiPulse is not academic exercise—it is lived spiritual practice. Every technical choice serves the ultimate purpose of divine connection."
                primaryCTA={{ label: "Production Overview", href: "/production" }}
                shieldText="Spiritual Integrity Mandatory"
                background="slate"
            />
        </>
    );
}
