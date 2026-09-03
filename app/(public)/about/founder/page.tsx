"use client";

import type { Metadata } from 'next';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { ExternalLink, Award, Music, Shield, BookOpen, Globe, Heart, Leaf, Zap, GraduationCap, Scale, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';

export default function Founder() {
    const teachingDomains = [
        {
            icon: Heart,
            title: 'Divine Healing',
            description: 'Wholeness in healing that addresses body, mind, and spirit as integrated realities.'
        },
        {
            icon: Leaf,
            title: 'Environmental Stewardship',
            description: 'Reverence for the natural world as spiritually significant sacred responsibility.'
        },
        {
            icon: Search,
            title: 'Rigorous Inquiry',
            description: 'Synthesis of contemplative insight with rational exploration and scientific methodology.'
        },
        {
            icon: GraduationCap,
            title: 'Education as Awakening',
            description: 'Education as a pathway to expanded consciousness, not merely information transfer.'
        },
        {
            icon: Zap,
            title: 'Mindful Presence',
            description: 'Cultivating awareness and inner peace through disciplined meditative silence.'
        },
        {
            icon: Scale,
            title: 'Transcendent Truth',
            description: 'Universal spiritual principles that transcend sectarian boundaries and cultural limitations.'
        }
    ];

    const legacyInitiatives = [
        {
            title: 'Sufi Science Center',
            subtitle: 'Institutional Extension',
            description: 'Interdisciplinary platform preserving Kashmiri Sufi wisdom through research and digital archiving.',
            url: 'https://sufisciencecenter.info/',
            tags: ['Research', 'Digital Preservation', 'Archives']
        },
        {
            title: 'Dr. Kumar Foundation USA',
            subtitle: 'International Extension',
            description: 'Global impact extender focusing on consciousness research and environmental preservation.',
            url: 'https://dkf.sufisciencecenter.info/',
            tags: ['Global Outreach', 'Scholarship', 'Kashmir Projects']
        }
    ];

    return (
        <>
            {/* Cinematic Hero Section with /banner21.png */}
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pb-16 md:pb-24 border-b border-[var(--color-border)] hero-bleed">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner21.png"
                        alt="The Founding Vision - Dr. Ghulam Mohammad Kumar"
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
                                    SufiPulse USA — Founding Vision
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                The Founding Vision<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    {roleDisplayMap.founder.mystical}
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                SufiPulse stands upon the founding vision of Dr. Ghulam Mohammad Kumar — a spiritual guide, physician, and Sufi master whose life bridged medicine, mysticism, and structured institutional awakening.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/governance/mithaq">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        Constitutional Mithaq
                                    </PrimaryButton>
                                </Link>
                                <Link href="/about/zarf-e-noori">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        Representative Founder
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Teaching Domains Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {teachingDomains.map((item, idx) => (
                                    <div key={idx} className="text-center p-2">
                                        <item.icon className="w-6 h-6 text-[var(--color-gold)] mx-auto mb-2 opacity-90" />
                                        <div className="text-xs md:text-sm font-bold text-[var(--color-text-primary)] mb-1">
                                            {item.title}
                                        </div>
                                        <div className="text-[10px] text-[var(--color-text-tertiary)] leading-snug line-clamp-2">
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
                            title="Bani — The Originator"
                            subtitle="Representative stewardship and institutional development are guided by Dr. Zarf-e-Noori under the framework of Mithaq."
                        />

                        <div className="elite-card p-10 md:p-16 mb-12 shadow-2xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Award size={200} className="text-amber-400" />
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative z-10">
                                <div className="lg:col-span-4">
                                    <div className="aspect-[4/5] rounded-[32px] overflow-hidden border-2 border-amber-400/20 shadow-[0_0_50px_rgba(212,175,55,0.15)] group-hover:border-amber-400/40 transition-all duration-700">
                                        <Image
                                            src="/dr-kumar-photo.png"
                                            alt="Dr. Ghulam Mohammad Kumar"
                                            width={400}
                                            height={500}
                                            className="w-full h-full object-cover object-top scale-105 group-hover:scale-100 transition-transform duration-1000"
                                        />
                                    </div>
                                    <div className="mt-8 text-center lg:text-left">
                                        <p className="text-white font-bold text-2xl tracking-tight">Dr. Ghulam Mohammad Kumar</p>
                                        <p className="text-amber-400 font-black uppercase tracking-[0.3em] text-xs mt-1">Founder — Bani</p>
                                    </div>
                                </div>
                                
                                <div className="lg:col-span-8 space-y-8">
                                    <p className="text-white text-xl leading-relaxed font-medium tracking-tight">
                                        Spiritual guide, physician, and Sufi master whose life bridged medicine, mysticism, and structured institutional awakening.
                                    </p>
                                    
                                    <div className="space-y-6 text-neutral-400 text-lg leading-relaxed font-light">
                                        <p>
                                            Dr. Ghulam Mohammad Kumar's journey began within a Kashmiri heritage grounded in scholarly and spiritual traditions. Born in 1957 into a family rooted in learning and healing, he demonstrated exceptional contemplative nature and profound inner sensitivity from his earliest years.
                                        </p>
                                        <p>
                                            He trained in modern medicine at Government Medical College Srinagar and practiced as a Medical Officer. Yet instinctively drawn deeper into inner inquiry, he transitioned from clinical practice toward a life devoted to spiritual depth and the pursuit of universal truth.
                                        </p>
                                        <p>
                                            His formative years in Kashmir's rich spiritual landscape shaped a disposition that would ultimately bridge conventional medical training with the ancient wisdom traditions of Kashmiri Sufism. Fourteen years of contemplative retreat in the forests of Ganderbal shaped a vision that transcends individual legacy.
                                        </p>
                                    </div>
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
                            title="Spiritual Transformation"
                            subtitle="Detachment, realization, and the emergence of institutional vision"
                        />

                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-8">
                                <div className="bg-black/20 border-l-4 border-amber-400 p-10 rounded-r-3xl shadow-xl">
                                    <p className="text-white text-2xl leading-relaxed italic font-light tracking-tight">
                                        "Silence is not the absence of sound, but the presence of the Divine."
                                    </p>
                                </div>
                                <div className="space-y-6 text-neutral-400 text-lg leading-relaxed font-light">
                                    <p>
                                        His path reflects the classical Sufi journey of detachment and inner realization. Withdrawal from public life led to fourteen years in contemplative retreat — a period marked by muraqaba (meditation) and profound spiritual discipline.
                                    </p>
                                    <p>
                                        This transformation shaped his emergence as a spiritual guide — one rooted in truth rather than title, in presence rather than proclamation. Healing, in his framework, emerges from within rather than through external intervention.
                                    </p>
                                </div>
                            </div>
                            <div className="elite-card p-10 bg-gradient-to-br from-amber-400/5 to-transparent flex flex-col items-center justify-center text-center py-20">
                                <Shield size={80} className="text-amber-400/20 mb-8" />
                                <h3 className="text-white font-bold text-xl mb-4">Constitutional Order</h3>
                                <p className="text-neutral-500 text-sm leading-relaxed uppercase tracking-widest font-black max-w-xs mx-auto">
                                    Translating vision into operational systems and institutional permanence.
                                </p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Core Teaching Domains"
                            subtitle="A structured philosophical framework synthesizing classical insight with contemporary inquiry"
                        />

                        <StudioCardGrid cols={3}>
                            {teachingDomains.map((domain, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={domain.icon}
                                    title={domain.title}
                                    description={domain.description}
                                />
                            ))}
                        </StudioCardGrid>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div>
                                <StudioSectionHeader 
                                    title="Founding Vision for SufiPulse"
                                    subtitle="Structural focus beyond individual expression"
                                />
                                <div className="space-y-6 text-neutral-400 text-lg leading-relaxed font-light">
                                    <p>
                                        The founding vision established a structured devotional institution integrating editorial authority, production discipline, and registry validation under a unified charter.
                                    </p>
                                    <p>
                                        The foundational philosophy centers on constitutional order: creative energy operates within documented frameworks, editorial oversight ensures spiritual alignment, and registry documentation maintains perpetual accountability.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <StudioSectionHeader 
                                    title="Banday Bagh"
                                    subtitle="Spiritual Station in Ganderbal, Kashmir"
                                />
                                <div className="elite-card p-8 space-y-6">
                                    {[
                                        'Meditation space for Zikr and reflection',
                                        'Langar offering unconditional hospitality',
                                        'Lodging for spiritual travelers',
                                        'Station for direct guidance and transmission'
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 group">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60 group-hover:bg-amber-400 transition-colors" />
                                            <p className="text-neutral-300 text-xs font-bold uppercase tracking-widest">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Legacy & Stewardship Structures"
                            subtitle="Dr. Kumar's legacy is institutional, not individualistic. It is anchored in global research and outreach."
                        />

                        <div className="grid md:grid-cols-2 gap-8">
                            {legacyInitiatives.map((item, idx) => (
                                <div key={idx} className="elite-card p-10 flex flex-col h-full group hover:border-amber-400/30 transition-all shadow-2xl">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-2xl font-bold text-white tracking-tight">{item.title}</h3>
                                            <div className="p-3 bg-amber-400/5 rounded-2xl border border-amber-400/10 group-hover:bg-amber-400/10 transition-colors">
                                                <Globe className="w-5 h-5 text-amber-400" />
                                            </div>
                                        </div>
                                        <p className="text-amber-400/80 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{item.subtitle}</p>
                                        <p className="text-neutral-400 text-base leading-relaxed mb-10">{item.description}</p>
                                        <div className="flex flex-wrap gap-2 mb-10">
                                            {item.tags.map((tag, tIdx) => (
                                                <span key={tIdx} className="text-[9px] font-black uppercase tracking-widest text-neutral-600 bg-black/40 px-3 py-1 rounded-full border border-white/5">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <a 
                                        href={item.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-full py-4 bg-white/[0.03] hover:bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 hover:text-white transition-all shadow-xl"
                                    >
                                        Visit Official Site <ExternalLink size={14} />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Representative Stewardship"
                            subtitle="Guiding institutional development under the constitutional framework of Mithaq"
                        />

                        <div className="elite-card p-10 md:p-16 shadow-2xl overflow-hidden relative group">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative z-10">
                                <div className="lg:col-span-4">
                                    <div className="aspect-[4/5] rounded-[32px] overflow-hidden border-2 border-amber-400/20 shadow-2xl group-hover:border-amber-400/40 transition-all duration-700">
                                        <Image
                                            src="/dr-fayaz-photo.jpg"
                                            alt="Dr. Zarf-e-Noori"
                                            width={400}
                                            height={500}
                                            className="w-full h-full object-cover object-top scale-105 group-hover:scale-100 transition-transform duration-1000"
                                        />
                                    </div>
                                    <div className="mt-8 text-center lg:text-left">
                                        <Link href="/about/zarf-e-noori" className="group/link inline-block">
                                            <p className="text-white font-bold text-2xl tracking-tight group-hover/link:text-amber-400 transition-colors">Dr. Zarf-e-Noori</p>
                                            <p className="text-amber-400 font-black uppercase tracking-[0.3em] text-xs mt-1 group-hover/link:text-amber-300 transition-colors">Representative Founder</p>
                                        </Link>
                                    </div>
                                </div>
                                
                                <div className="lg:col-span-8 space-y-8">
                                    <p className="text-white text-xl leading-relaxed font-medium tracking-tight">
                                        Overseeing structural development, institutional governance integration, and digital expansion aligned with the founding charter.
                                    </p>
                                    
                                    <div className="space-y-6 text-neutral-400 text-lg leading-relaxed font-light">
                                        <p>
                                            The representative role focuses on architectural design: translating constitutional principles into operational systems, integrating editorial processes with production workflows, and establishing technological infrastructure that serves institutional permanence.
                                        </p>
                                        <p>
                                            Structural development includes the construction of multi-layered governance systems, role-based participation frameworks, registry documentation protocols, and economic transparency mechanisms that reinforce charter authority.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Institutional Continuity"
                description="Founding and representative leadership operate within the framework of Mithaq. The institution transcends its founders, ensuring perpetual operation through documented standards and governed protocols."
                primaryCTA={{ label: "View Governance Charter", href: "/governance/mithaq" }}
                shieldText="Governed Institutional Continuity"
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
