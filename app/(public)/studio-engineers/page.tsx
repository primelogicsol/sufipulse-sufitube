"use client";
import { Settings, FileSliders as Sliders, CircleCheck as CheckCircle2, Calendar, Mic as Mic2, Radio, Globe as Globe2, Sparkles, Award, Music, Shield } from 'lucide-react';
import Image from 'next/image';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Badge } from '../../components/primitives/Badge';
import { PrimaryButton } from '../../components/primitives/PrimaryButton';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function StudioEngineers() {
    const engineeringExpertise = [
        {
            icon: Mic2,
            title: 'Sacred Audio Engineering',
            description: 'Specialized techniques for capturing and enhancing spiritual music'
        },
        {
            icon: Globe2,
            title: 'Multi-Cultural Production',
            description: 'Expert coordination of diverse cultural and linguistic collaborations'
        },
        {
            icon: Sparkles,
            title: 'Spiritual Sound Design',
            description: 'Custom effects and processing that enhance mystical qualities'
        },
        {
            icon: Radio,
            title: 'Global Coordination',
            description: 'Seamless management of international recording sessions'
        }
    ];

    const engineeringTeam = [
        {
            name: 'Michael "SufiPulse" Hartman',
            role: 'Lead Engineer & Studio Director',
            experience: '15+ years',
            specialty: 'High-fidelity world-fusion soundscapes & spiritual vocal engineering',
            description: 'Master engineer specializing in high-fidelity world-fusion soundscapes and spiritual vocal engineering at SufiPulse Studio. Brings over 15 years of experience in sacred audio production.',
            philosophy: 'Every sacred recording is a prayer in frequencies, a bridge between the earthly and divine.',
            achievements: [
                'Grammy-nominated engineer for spiritual music',
                '500+ sacred recordings produced',
                'Pioneer in sacred audio technology',
                'Specialist in multi-cultural sound design'
            ],
            notableProjects: ['Ishq-e-Haqiqi', 'Wahdat Symphony', 'Path of Fanaa'],
            languages: ['English', 'Basic Arabic', 'Basic Urdu']
        },
        {
            name: 'Ryan Cole',
            role: 'Mixing Engineer & Sound Designer',
            experience: '8+ years',
            specialty: 'Audio Mixing & Spiritual Sound Design',
            description: 'Skilled mixing engineer ensuring every sacred kalam achieves perfect balance and spiritual resonance. Specializes in creating immersive soundscapes for spiritual enhancement.',
            philosophy: 'Mixing is the art of creating space for the Divine to breathe through sound.',
            achievements: [
                '200+ mixed tracks for SufiPulse',
                'Specialist in world music mixing',
                'Certified Pro Tools expert',
                'Sacred audio processing pioneer'
            ],
            notableProjects: ['Climate Awakening', 'Zikr of the Heart', 'Tawbah Gardens'],
            languages: ['English', 'Spanish']
        },
        {
            name: 'Lucas Ray',
            role: 'Vocal Recording Specialist',
            experience: '10+ years',
            specialty: 'Vocal Recording & Spiritual Voice Processing',
            description: 'Expert vocal technician capturing the pure essence of spiritual voices with precision and care. Developed unique techniques for recording sacred vocals authentically.',
            philosophy: 'The human voice is the most sacred instrument - our job is to capture its divine essence.',
            achievements: [
                'Vocal recording specialist for 300+ tracks',
                'Multi-language recording expert',
                'Sacred voice preservation techniques',
                'Whisper kalam recording pioneer'
            ],
            notableProjects: ['Kashmir\'s Call', 'Silent Dhikr', 'Unity in Silence'],
            languages: ['English', 'Basic Turkish', 'Basic Persian']
        },
        {
            name: 'Elijah James',
            role: 'Mastering Engineer & FX Designer',
            experience: '12+ years',
            specialty: 'Audio Mastering & Sacred Effects Design',
            description: 'Mastering engineer and FX designer bringing final polish and spiritual depth to every production. Creates custom effects that enhance mystical qualities of sacred music.',
            philosophy: 'Mastering is the final prayer - ensuring every frequency serves the sacred message.',
            achievements: [
                'Mastering specialist for all SufiPulse releases',
                'Custom sacred FX design',
                'Spiritual audio enhancement pioneer',
                'International mastering standards'
            ],
            notableProjects: ['All SufiPulse Productions', 'Sacred Frequency Research', 'Mystical Audio Enhancement'],
            languages: ['English', 'French']
        },
        {
            name: 'Arman Sayeed',
            role: 'Session Manager & Cultural Coordinator',
            experience: '6+ years',
            specialty: 'Production Coordination & Cultural Sensitivity',
            description: 'Session manager coordinating all aspects of production to ensure smooth spiritual collaborations. Specializes in cultural sensitivity and cross-cultural communication.',
            philosophy: 'Every session is a sacred gathering - coordination is the art of creating harmony.',
            achievements: [
                '300+ sessions successfully managed',
                'Multi-cultural coordination specialist',
                'Spiritual project coordination expert',
                'Global time zone management'
            ],
            notableProjects: ['Global Remote Sessions', 'Cultural Collaboration Projects', 'International Coordination'],
            languages: ['English', 'Urdu', 'Hindi', 'Arabic']
        }
    ];

    const engineeringRoles = [
        {
            icon: Settings,
            title: 'Lead Engineer — Studio Oversight',
            description: 'Ensures technical alignment across sessions.',
            detail: 'Specializes in high-fidelity world-fusion soundscapes and spiritual vocal engineering, maintaining sacred audio technology standards.'
        },
        {
            icon: Sliders,
            title: 'Mixing Engineer — Sonic Structuring',
            description: 'Balances instrumentation and vocal dynamics.',
            detail: 'Creates immersive spiritual soundscapes through advanced audio mixing and sound design techniques.'
        },
        {
            icon: CheckCircle2,
            title: 'Mastering Engineer — Final Validation',
            description: 'Confirms distribution-grade technical standards.',
            detail: 'Applies final polish and designs custom effects enhancing mystical qualities for publication-ready masters.'
        },
        {
            icon: Calendar,
            title: 'Session Coordination — Workflow Management',
            description: 'Schedules sessions and aligns distributed recording nodes.',
            detail: 'Manages production coordination with cultural sensitivity across global time zones and international teams.'
        }
    ];

    const teamStats = [
        { value: '300+', label: 'Sacred Collaborations' },
        { value: '25+', label: 'Languages Supported' },
        { value: '500+', label: 'Recordings Produced' },
        { value: '15+', label: 'Years Experience' }
    ];

    return (
        <>
            {/* Cinematic Hero Section with /banner10.png */}
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner10.png"
                        alt="SufiPulse Studio Engineers & Sound Architecture Console"
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
                                    SufiPulse USA — Sound Engineering Division
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Studio Engineers & Mastery<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    {roleDisplayMap.studio_engineer.mystical}
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                Studio Engineers operate within the defined production authority of Karkhana-e-Sada. Their role is custodial technical fidelity, acoustic calibration, and master validation for sacred works.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/studio">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        Studio Overview
                                    </PrimaryButton>
                                </Link>
                                <Link href="/inside-studio">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        Inside the Studio
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Expertise Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {engineeringExpertise.map((item, idx) => (
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
                            title="Engineering Excellence by Numbers"
                        />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {teamStats.map((stat, idx) => (
                                <div key={idx} className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-xl p-8 text-center">
                                    <div className="text-4xl font-bold text-amber-400 mb-2">{stat.value}</div>
                                    <div className="text-neutral-400 text-xs font-black uppercase tracking-widest">{stat.label}</div>
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
                            title="Our Expertise"
                            subtitle="Specialized skills that make SufiPulse productions world-class"
                        />

                        <StudioCardGrid cols={2}>
                            {engineeringExpertise.map((expertise, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={expertise.icon}
                                    title={expertise.title}
                                    description={expertise.description}
                                />
                            ))}
                        </StudioCardGrid>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Our Engineering Team"
                            subtitle="The masters behind every sacred production"
                        />

                        <div className="space-y-8">
                            {engineeringTeam.map((engineer, idx) => (
                                <div key={idx} className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-xl p-10 hover:border-amber-400/30 transition-colors shadow-2xl backdrop-blur-xl">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
                                        <div>
                                            <div className="flex items-center gap-4 mb-2">
                                                <h3 className="text-2xl font-bold text-white tracking-tight">{engineer.name}</h3>
                                                <span className="text-[10px] font-black text-amber-400 bg-amber-400/5 border border-amber-400/10 px-3 py-1 rounded-full uppercase tracking-widest">
                                                    {engineer.experience}
                                                </span>
                                            </div>
                                            <p className="text-amber-400 text-sm font-bold uppercase tracking-[0.2em]">{engineer.role}</p>
                                        </div>
                                        <p className="text-neutral-500 text-xs font-black uppercase tracking-widest">{engineer.specialty}</p>
                                    </div>

                                    <div className="grid lg:grid-cols-12 gap-10">
                                        <div className="lg:col-span-7 space-y-8">
                                            <p className="text-neutral-300 text-lg leading-relaxed font-light">
                                                {engineer.description}
                                            </p>

                                            <div className="bg-black/20 border-l-4 border-amber-400 p-6 rounded-r-2xl">
                                                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3">Custodial Philosophy</p>
                                                <p className="text-white text-lg leading-relaxed italic font-medium">
                                                    "{engineer.philosophy}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-5 space-y-8">
                                            <div>
                                                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Award className="w-4 h-4 text-amber-400" /> Key Achievements
                                                </p>
                                                <div className="space-y-3">
                                                    {engineer.achievements.map((achievement, aIdx) => (
                                                        <div key={aIdx} className="flex items-start gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                                                            <p className="text-neutral-300 text-xs font-bold uppercase tracking-wider">{achievement}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Music className="w-4 h-4 text-amber-400" /> Notable Projects
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {engineer.notableProjects.map((project, pIdx) => (
                                                        <span key={pIdx} className="text-[10px] text-amber-400/80 bg-amber-400/5 px-3 py-1 rounded border border-amber-400/10 uppercase font-black tracking-tighter">
                                                            {project}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4">Linguistic Capabilities</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {engineer.languages.map((lang, lIdx) => (
                                                        <span key={lIdx} className="text-[10px] text-neutral-400 bg-neutral-900 border border-white/5 px-3 py-1 rounded uppercase font-black tracking-widest">
                                                            {lang}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
                            title="Functional Roles"
                            subtitle="The distinct technical specializations within the engineering council"
                        />

                        <StudioCardGrid cols={2}>
                            {engineeringRoles.map((role, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={role.icon}
                                    title={role.title}
                                    description={role.description}
                                    subtitle={role.detail}
                                />
                            ))}
                        </StudioCardGrid>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Engineering Role in Production"
                        />

                        <div className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-xl p-10">
                            <div className="grid md:grid-cols-2 gap-12">
                                <div>
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-6">Custodial Responsibilities</p>
                                    <div className="space-y-4">
                                        {[
                                            'Recording capture precision',
                                            'Mix balance and sonic clarity',
                                            'Master-grade validation',
                                            'File conformity prior to registry submission'
                                        ].map((resp, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                <p className="text-neutral-300 text-sm font-bold uppercase tracking-widest">{resp}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-6">Structural Restrictions</p>
                                    <div className="space-y-4">
                                        {[
                                            'Editorial approval',
                                            'Royalty allocation',
                                            'Registry authority'
                                        ].map((rest, i) => (
                                            <div key={i} className="flex items-center gap-4 group">
                                                <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                                                <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest group-hover:text-neutral-400 transition-colors">{rest}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.2em] mt-8 pt-4 border-t border-white/5">
                                        This hierarchy preserves institutional governance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Technical Stewardship"
                description="Engineering within SufiPulse is custodial, not expressive. Decisions support institutional standards rather than individual creative expression."
                primaryCTA={{ label: "Studio Overview", href: "/studio" }}
                shieldText="Technical Fidelity Mandatory"
                background="midnight"
            />
        </>
    );
}
