"use client";
import { Mic as Mic2, Radio, Music2, HardDrive, Headphones, Waves, Volume2, Zap, Shield, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Badge } from '../../components/primitives/Badge';
import { PrimaryButton } from '../../components/primitives/PrimaryButton';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function InsideStudio() {
    const studioSpaces = [
        {
            name: 'Studio A',
            subtitle: 'Main Recording',
            icon: Mic2,
            features: [
                'Acoustically optimized vocal recording',
                'Professional isolation booth',
                'Live room with natural acoustics',
                'Control room with premium monitoring',
                'Advanced acoustic treatment'
            ],
            atmosphere: 'Designed for capturing the pure essence of sacred vocals with technical precision and spiritual focus.'
        },
        {
            name: 'Studio B',
            subtitle: 'Mixing Suite',
            icon: Radio,
            features: [
                '5.1 surround monitoring system',
                'Analog mixing console',
                'Industry-standard DAW stations',
                'Reference monitor array',
                'Hybrid analog-digital workflow'
            ],
            atmosphere: 'Where technical balance meets artistic vision, crafting cohesive sonic landscapes from recorded elements.'
        },
        {
            name: 'Studio C',
            subtitle: 'Mastering Room',
            icon: Volume2,
            features: [
                'Mastering-grade monitoring',
                'Analog processing chain',
                'Digital precision tools',
                'Quality assurance systems',
                'Format optimization capabilities'
            ],
            atmosphere: 'The final stage of refinement, ensuring sonic excellence and technical compliance for global distribution.'
        }
    ];

    const professionalEquipment = [
        {
            category: 'Microphones',
            icon: Mic2,
            items: ['Neumann U87 Ai', 'Shure SM7B', 'AKG C414', 'Rode NT1 / Procaster']
        },
        {
            category: 'Audio Interfaces',
            icon: HardDrive,
            items: ['Universal Audio Apollo X / Twin', 'RME Fireface', 'Focusrite Scarlett / Clarett', 'PreSonus Studio Series']
        },
        {
            category: 'Digital Audio Workstations',
            icon: Waves,
            items: ['Pro Tools', 'Logic Pro X', 'Ableton Live', 'Cubase']
        },
        {
            category: 'Monitoring & Headphones',
            icon: Headphones,
            items: ['Genelec 8030', 'Yamaha HS8', 'Adam Audio A8H', 'Beyerdynamic DT770/990']
        },
        {
            category: 'Acoustic Treatment',
            icon: Volume2,
            items: ['Vocal Isolation Booths', 'Acoustic Panels', 'Bass Traps', 'Diffusers']
        },
        {
            category: 'Recording & Production Tools',
            icon: Radio,
            items: ['Multi-track Recording', 'MIDI Controllers', 'Audio Plugins Suite', 'Backup Systems']
        },
        {
            category: 'Guitars & Bass',
            icon: Music2,
            items: ['Fender Stratocaster', 'Gibson Les Paul', 'Taylor Acoustic', 'Fender Precision Bass']
        },
        {
            category: 'Keyboards & Synths',
            icon: Music2,
            items: ['Nord Stage 3', 'Yamaha Montage', 'Roland Juno-DS', 'NI Komplete Kontrol']
        },
        {
            category: 'Drums, Piano & Percussion',
            icon: Music2,
            items: ['DW Collector\'s Series (acoustic)', 'Roland V-Drums TD-50X', 'Yamaha C7 Grand Piano', 'Tabla, Daf, Djembe, Cajón']
        }
    ];

    const serviceOfferings = [
        {
            title: 'Complete Music Production',
            icon: Music2,
            subtitle: 'Musical arrangement, Style selection, Translation services, Professional composition',
            description: 'We determine the best musical treatment (Qawwali, Chant, Anthem) and create professional compositions for your kalam in Urdu or English, with translation services available.'
        },
        {
            title: 'Vocalist Assignment',
            icon: Headphones,
            subtitle: 'Global talent pool, Perfect voice matching, Spiritual alignment, Professional vocalists',
            description: 'Our team selects the most suitable vocalist from our global talent pool based on language, emotion, and spiritual depth.'
        },
        {
            title: 'Global Distribution',
            icon: Zap,
            subtitle: 'YouTube publishing, Social media promotion, Global reach, Professional marketing',
            description: 'Professional marketing and publishing across YouTube, social media, and our sacred kalam library—all handled by SufiPulse.'
        },
        {
            title: 'Rights & Recognition',
            icon: Shield,
            subtitle: 'Full authorship credit, Rights protection, Prominent attribution, Legal safeguards',
            description: 'Writers retain full authorship while we handle all production. Your name is prominently credited across all platforms.'
        }
    ];

    const recordingOptions = [
        {
            title: 'In-Person Sessions',
            description: 'Full team collaboration with hands-on creative direction and real-time feedback.',
            benefits: ['Direct producer interaction', 'Immediate creative adjustments', 'Professional environment', 'Complete technical support']
        },
        {
            title: 'Remote Collaboration',
            description: 'Professional support for international contributors through coordinated remote recording.',
            benefits: ['Global accessibility', 'Flexible scheduling', 'Professional guidance', 'Network studio coordination']
        }
    ];

    const missionStatement = {
        title: 'Sacred Ceremony in Sound',
        quote: 'Every recording session is a sacred ceremony, every mix a prayer in frequencies.',
        description: 'SufiPulse operates as a non-monetized platform dedicated to amplifying sacred Sufi music globally. Our studio infrastructure serves spiritual expression through technical excellence.'
    };

    const networkStats = [
        { value: '300+', label: 'Sacred Collaborations' },
        { value: '89', label: 'Writers in Network' },
        { value: '43', label: 'Vocalists' },
        { value: '25+', label: 'Languages Supported' },
        { value: '127K+', label: 'Global Views' },
        { value: '100%', label: 'Free Service Model' }
    ];

    return (
        <Layout>
            {/* Cinematic Hero Section with /banner9.png */}
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner9.png"
                        alt="Inside SufiPulse Studio Environment & Acoustic Architecture"
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
                                    SufiPulse USA — Facility Architecture
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Inside the Studio<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    Acoustic Architecture & Spaces
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                A comprehensive look into the physical facilities, technical hardware, acoustic suites, and sound philosophy powering SufiPulse's sacred master productions.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/studio">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        Studio Overview
                                    </PrimaryButton>
                                </Link>
                                <Link href="/studio-engineers">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        Studio Engineers
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Spaces Overview Strip */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {studioSpaces.map((studio, idx) => (
                                    <div key={idx} className="text-center p-2">
                                        <studio.icon className="w-7 h-7 text-[var(--color-gold)] mx-auto mb-2 opacity-90" />
                                        <div className="text-sm md:text-base font-bold text-[var(--color-text-primary)] mb-0.5">
                                            {studio.name}
                                        </div>
                                        <div className="text-[11px] text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-1">
                                            {studio.subtitle}
                                        </div>
                                        <div className="text-[11px] text-[var(--color-text-tertiary)] leading-snug line-clamp-2">
                                            {studio.atmosphere}
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
                            title={missionStatement.title}
                            subtitle={`"${missionStatement.quote}"`}
                        />

                        <div className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-xl p-8 mb-8">
                            <p className="text-neutral-300 leading-relaxed mb-8">
                                {missionStatement.description}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {networkStats.map((stat, idx) => (
                                    <div key={idx} className="text-center">
                                        <div className="text-3xl font-bold text-amber-400 mb-1">
                                            {stat.value}
                                        </div>
                                        <div className="text-neutral-400 text-sm font-bold uppercase tracking-widest">
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Studio Spaces"
                            subtitle="Professional recording environments designed for optimal spiritual audio production"
                        />

                        <StudioCardGrid cols={3}>
                            {studioSpaces.map((studio, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={studio.icon}
                                    title={studio.name}
                                    subtitle={studio.subtitle}
                                    description={`SufiPulse Studio – USA, ${studio.atmosphere.toLowerCase()}`}
                                    footerTags={studio.features}
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
                            title="Professional Equipment"
                            subtitle="State-of-the-art recording and production equipment ensuring the highest quality capture and reproduction of sacred performances"
                        />

                        <StudioCardGrid cols={3}>
                            {professionalEquipment.map((section, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={section.icon}
                                    title={section.category}
                                    description=""
                                    footerTags={section.items}
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
                            title="Our Services"
                            subtitle="Comprehensive production services designed to bring your sacred kalam to life with technical excellence and spiritual authenticity"
                        />

                        <StudioCardGrid cols={2}>
                            {serviceOfferings.map((service, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={service.icon}
                                    title={service.title}
                                    description={service.description}
                                    footerTags={service.subtitle.split(', ')}
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
                            title="Recording Options"
                        />

                        <StudioCardGrid cols={2}>
                            {recordingOptions.map((option, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={Mic2}
                                    title={option.title}
                                    description={option.description}
                                    footerTags={option.benefits}
                                />
                            ))}
                        </StudioCardGrid>

                        <div className="mt-8 bg-[var(--color-midnight)] p-6 rounded-lg border border-[var(--color-gold)]/20 text-center max-w-3xl mx-auto">
                            <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed italic">
                                "All recording sessions operate under centralized oversight and follow documented production protocol. Sessions are scheduled based on approved kalam queue and vocalist assignments."
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Technical Excellence, Spiritual Purpose"
                description="The studio infrastructure exists to serve the mission: amplifying sacred Sufi expression through professional production standards while maintaining complete artistic integrity and non-commercial principles."
                primaryCTA={{ label: "Studio Overview", href: "/studio" }}
                secondaryCTA={{ label: "Studio Engineers", href: "/studio-engineers" }}
                shieldText="Production Standards Mandatory"
                background="midnight"
            />
        </Layout>
    );
}
