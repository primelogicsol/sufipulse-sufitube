import { Mic as Mic2, Radio, Music2, HardDrive, Headphones, Waves, Volume2, Zap, Shield, ArrowRight } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import Link from 'next/link';
// import { Link } from 'react-router-dom';

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
            <Section className="pt-24 pb-8">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Inside Studio
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
                            Karkhana-e-Sada
                        </p>

                        <div className="mt-8 max-w-3xl">
                            <p className="text-neutral-300 leading-relaxed mb-4">
                                A glimpse into the physical spaces, technical capabilities, and creative philosophy that power SufiPulse's sacred music production.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-3">
                            {missionStatement.title}
                        </h2>
                        <p className="text-xl text-amber-400/80 italic mb-6">
                            "{missionStatement.quote}"
                        </p>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8 mb-8">
                            <p className="text-neutral-300 leading-relaxed mb-8">
                                {missionStatement.description}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {networkStats.map((stat, idx) => (
                                    <div key={idx} className="text-center">
                                        <div className="text-3xl font-bold text-amber-400 mb-1">
                                            {stat.value}
                                        </div>
                                        <div className="text-neutral-400 text-sm">
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Studio Spaces
                        </h2>
                        <p className="text-neutral-400 text-sm mb-8">
                            Professional recording environments designed for optimal spiritual audio production
                        </p>

                        <div className="grid md:grid-cols-3 gap-6">
                            {studioSpaces.map((studio, idx) => {
                                const Icon = studio.icon;
                                return (
                                    <div key={idx} className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6 hover:border-amber-400/30 transition-colors">
                                        <div className="w-12 h-12 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mb-4">
                                            <Icon className="w-6 h-6 text-amber-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1">
                                            {studio.name}
                                        </h3>
                                        <p className="text-amber-400 text-sm mb-3">
                                            {studio.subtitle}
                                        </p>
                                        <p className="text-neutral-400 text-sm italic mb-4 leading-relaxed border-b border-neutral-800 pb-4">
                                            SufiPulse Studio – USA, {studio.atmosphere.toLowerCase()}
                                        </p>

                                        <div className="space-y-2">
                                            {studio.features.map((feature, fIdx) => (
                                                <div key={fIdx} className="flex items-start gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                                    <p className="text-neutral-300 text-sm">{feature}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 bg-neutral-950/50">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Professional Equipment
                        </h2>
                        <p className="text-neutral-400 text-sm mb-8">
                            State-of-the-art recording and production equipment ensuring the highest quality capture and reproduction of sacred performances
                        </p>

                        <div className="grid md:grid-cols-3 gap-6">
                            {professionalEquipment.map((section, idx) => {
                                const Icon = section.icon;
                                return (
                                    <div key={idx} className="bg-neutral-900/40 border border-neutral-800 rounded-lg p-5 hover:border-amber-400/30 transition-colors">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Icon className="w-5 h-5 text-amber-400" />
                                            <p className="text-amber-400 text-sm font-semibold">
                                                {section.category}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            {section.items.map((item, iIdx) => (
                                                <div key={iIdx} className="flex items-start gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-neutral-600 mt-1.5 flex-shrink-0" />
                                                    <p className="text-neutral-300 text-xs">{item}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Our Services
                        </h2>
                        <p className="text-neutral-400 text-sm mb-8">
                            Comprehensive production services designed to bring your sacred kalam to life with technical excellence and spiritual authenticity
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            {serviceOfferings.map((service, idx) => {
                                const Icon = service.icon;
                                return (
                                    <div key={idx} className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6 hover:border-amber-400/30 transition-colors">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-white">
                                                {service.title}
                                            </h3>
                                        </div>

                                        <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                                            {service.description}
                                        </p>

                                        <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-800">
                                            {service.subtitle.split(', ').map((tag, tIdx) => (
                                                <span key={tIdx} className="text-xs text-amber-400/70 bg-amber-400/5 px-2 py-1 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Recording Options
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {recordingOptions.map((option, idx) => (
                                <div key={idx} className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-white mb-2">
                                        {option.title}
                                    </h3>
                                    <p className="text-neutral-400 text-sm mb-4 leading-relaxed">
                                        {option.description}
                                    </p>
                                    <div className="space-y-2">
                                        {option.benefits.map((benefit, bIdx) => (
                                            <div key={bIdx} className="flex items-start gap-2">
                                                <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                                <p className="text-neutral-300 text-sm">{benefit}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-5">
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                All recording sessions operate under centralized oversight and follow documented production protocol. Sessions are scheduled based on approved kalam queue and vocalist assignments.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 pb-20">
                <PageContainer>
                    <div className="max-w-4xl">
                        <div className="bg-gradient-to-br from-amber-400/10 to-amber-600/5 border border-amber-400/20 rounded-lg p-8">
                            <h2 className="text-2xl font-bold text-white mb-3">
                                Technical Excellence, Spiritual Purpose
                            </h2>
                            <p className="text-neutral-300 leading-relaxed mb-6">
                                The studio infrastructure exists to serve the mission: amplifying sacred Sufi expression through professional production standards while maintaining complete artistic integrity and non-commercial principles.
                            </p>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/studio"
                                    className="inline-flex items-center gap-2 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                                >
                                    Studio Overview
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    href="/studio-engineers"
                                    className="inline-flex items-center gap-2 bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                                >
                                    Studio Engineers
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
