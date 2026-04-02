import { Settings, FileSliders as Sliders, CircleCheck as CheckCircle2, Calendar, Mic as Mic2, Radio, Globe as Globe2, Sparkles, Award, Music } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';

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

    const technicalCapabilities = [
        {
            icon: Mic2,
            title: 'Sacred Vocal Capture',
            description: 'Precision recording of spiritual voices across 25+ languages with specialized microphone techniques and acoustic treatment.'
        },
        {
            icon: Radio,
            title: 'Multi-Cultural Production',
            description: 'Expert coordination of diverse musical traditions, from whisper kalam to fusion arrangements, preserving cultural authenticity.'
        },
        {
            icon: Globe2,
            title: 'Global Session Management',
            description: 'Seamless coordination of international recording sessions with remote collaboration infrastructure and real-time technical support.'
        },
        {
            icon: Sparkles,
            title: 'Spiritual Sound Design',
            description: 'Custom effects processing and mystical audio engineering creating space for sacred expression through frequency architecture.'
        }
    ];

    const teamStats = [
        { value: '300+', label: 'Sacred Collaborations' },
        { value: '25+', label: 'Languages Supported' },
        { value: '500+', label: 'Recordings Produced' },
        { value: '15+', label: 'Years Experience' }
    ];

    return (
        <Layout>
            <Section className="pt-24 pb-8">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Studio Engineers
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
                            {roleDisplayMap.studio_engineer.mystical}
                        </p>

                        <div className="mt-8 max-w-3xl">
                            <p className="text-neutral-300 leading-relaxed mb-6">
                                Studio Engineers operate within the defined production authority of Karkhana-e-Sada. Their role is technical fidelity, master integrity, and execution discipline.
                            </p>

                            <div className="bg-gradient-to-r from-amber-400/5 to-transparent border-l-2 border-amber-400/50 pl-6 py-4 italic">
                                <p className="text-neutral-200 text-sm leading-relaxed">
                                    "Every sacred recording is a prayer in frequencies, a bridge between the human voice and divine resonance. Engineering is not about technical prowess—it is about sacred custody of sound."
                                </p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 bg-neutral-950/50">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-8">
                            Engineering Excellence by Numbers
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {teamStats.map((stat, idx) => (
                                <div key={idx} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6 text-center">
                                    <div className="text-3xl font-bold text-amber-400 mb-2">{stat.value}</div>
                                    <div className="text-neutral-400 text-sm">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Our Expertise
                        </h2>
                        <p className="text-neutral-400 text-sm mb-8">
                            Specialized skills that make SufiPulse productions world-class
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            {engineeringExpertise.map((expertise, idx) => {
                                const Icon = expertise.icon;
                                return (
                                    <div key={idx} className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6 hover:border-amber-400/30 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-amber-400/10 rounded-lg border border-amber-400/30 flex-shrink-0">
                                                <Icon className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-semibold mb-2">{expertise.title}</h3>
                                                <p className="text-neutral-300 text-sm leading-relaxed">
                                                    {expertise.description}
                                                </p>
                                            </div>
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
                            Our Engineering Team
                        </h2>
                        <p className="text-neutral-400 text-sm mb-8">
                            The masters behind every sacred production
                        </p>

                        <div className="space-y-8">
                            {engineeringTeam.map((engineer, idx) => (
                                <div key={idx} className="bg-neutral-900/40 border border-neutral-800 rounded-lg p-8 hover:border-amber-400/30 transition-colors">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-white">{engineer.name}</h3>
                                                <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                                                    {engineer.experience}
                                                </span>
                                            </div>
                                            <p className="text-amber-400 font-medium mb-1">{engineer.role}</p>
                                            <p className="text-neutral-400 text-sm italic">{engineer.specialty}</p>
                                        </div>
                                    </div>

                                    <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                                        {engineer.description}
                                    </p>

                                    <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-4 mb-6">
                                        <p className="text-white font-medium text-sm mb-2">Philosophy</p>
                                        <p className="text-neutral-300 text-sm leading-relaxed italic">
                                            "{engineer.philosophy}"
                                        </p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <p className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                                                <Award className="w-4 h-4 text-amber-400" />
                                                Key Achievements
                                            </p>
                                            <div className="space-y-2">
                                                {engineer.achievements.map((achievement, aIdx) => (
                                                    <div key={aIdx} className="flex items-start gap-2">
                                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                                        <p className="text-neutral-300 text-xs">{achievement}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                                                <Music className="w-4 h-4 text-amber-400" />
                                                Notable Projects
                                            </p>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {engineer.notableProjects.map((project, pIdx) => (
                                                    <span key={pIdx} className="text-xs text-amber-400/80 bg-amber-400/5 px-3 py-1.5 rounded border border-amber-400/20">
                                                        {project}
                                                    </span>
                                                ))}
                                            </div>

                                            <p className="text-white font-medium text-sm mb-2 mt-4">Languages</p>
                                            <div className="flex flex-wrap gap-2">
                                                {engineer.languages.map((lang, lIdx) => (
                                                    <span key={lIdx} className="text-xs text-neutral-400 bg-neutral-900/50 px-2 py-1 rounded">
                                                        {lang}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Engineering Role in Production
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-white font-medium mb-4">Engineers are responsible for:</p>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Recording capture precision</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Mix balance and sonic clarity</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Master-grade validation</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">File conformity prior to registry submission</p>
                                </div>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-5">
                                <p className="text-white font-medium text-sm mb-3">Engineers do not determine:</p>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 mt-2 flex-shrink-0" />
                                        <p className="text-neutral-400 text-sm">Editorial approval</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 mt-2 flex-shrink-0" />
                                        <p className="text-neutral-400 text-sm">Royalty allocation</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 mt-2 flex-shrink-0" />
                                        <p className="text-neutral-400 text-sm">Registry authority</p>
                                    </div>
                                </div>
                                <p className="text-neutral-400 text-xs mt-4 leading-relaxed">
                                    This preserves governance hierarchy.
                                </p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Functional Roles
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {engineeringRoles.map((role, idx) => {
                                const Icon = role.icon;
                                return (
                                    <div key={idx} className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6 hover:border-amber-400/30 transition-colors">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="p-2 bg-amber-400/10 rounded-lg flex-shrink-0">
                                                <Icon className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm mb-2">{role.title}</p>
                                                <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                                                    {role.description}
                                                </p>
                                                <p className="text-neutral-400 text-xs leading-relaxed border-t border-neutral-800 pt-3">
                                                    {role.detail}
                                                </p>
                                            </div>
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
                            Technical Capabilities
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {technicalCapabilities.map((capability, idx) => {
                                const Icon = capability.icon;
                                return (
                                    <div key={idx} className="bg-neutral-900/40 border border-neutral-800 rounded-lg p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-amber-400/5 rounded-lg border border-amber-400/20 flex-shrink-0">
                                                <Icon className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-semibold mb-2">{capability.title}</h3>
                                                <p className="text-neutral-300 text-sm leading-relaxed">
                                                    {capability.description}
                                                </p>
                                            </div>
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
                            Engineering Philosophy
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-1 h-full bg-amber-400/30 rounded-full flex-shrink-0" />
                                    <div>
                                        <p className="text-white font-medium mb-2">Sacred Frequency Architecture</p>
                                        <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                                            "Mixing is the art of creating space for the Divine to breathe within the track. Every frequency adjustment is an act of devotion, ensuring clarity serves the sacred message."
                                        </p>
                                        <p className="text-neutral-400 text-xs">
                                            Engineering approach to spiritual sound design and immersive soundscapes
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-1 h-full bg-amber-400/30 rounded-full flex-shrink-0" />
                                    <div>
                                        <p className="text-white font-medium mb-2">Vocal Essence Preservation</p>
                                        <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                                            "The human voice is the most sacred instrument—our job is to capture it without ego, without color, with absolute transparency and reverence."
                                        </p>
                                        <p className="text-neutral-400 text-xs">
                                            Multi-language vocal recording expertise and whisper kalam pioneering techniques
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-1 h-full bg-amber-400/30 rounded-full flex-shrink-0" />
                                    <div>
                                        <p className="text-white font-medium mb-2">Final Prayer in Mastering</p>
                                        <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                                            "Mastering is the final prayer—ensuring every frequency serves the sacred purpose, every dynamic choice honors the spiritual intent of the work."
                                        </p>
                                        <p className="text-neutral-400 text-xs">
                                            Distribution-ready validation and mystical effects design for publication standards
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-1 h-full bg-amber-400/30 rounded-full flex-shrink-0" />
                                    <div>
                                        <p className="text-white font-medium mb-2">Sacred Gathering Coordination</p>
                                        <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                                            "Every session is a sacred gathering—coordination is the art of honoring each contributor's time, culture, and spiritual offering with precision and respect."
                                        </p>
                                        <p className="text-neutral-400 text-xs">
                                            Global time zone management and cultural sensitivity in production workflows
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 pb-20">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Structural Principle
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-white font-medium mb-4">Technical Stewardship</p>

                            <div className="space-y-4">
                                <p className="text-neutral-300 text-sm leading-relaxed">
                                    Engineering within SufiPulse is custodial, not expressive.
                                </p>
                                <p className="text-neutral-300 text-sm leading-relaxed">
                                    The purpose is preservation of clarity, not artistic authorship.
                                </p>
                                <p className="text-neutral-300 text-sm leading-relaxed">
                                    Authority flows from Governance → Studio → Engineering.
                                </p>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-5">
                                <p className="text-neutral-400 text-xs leading-relaxed">
                                    Engineers execute within a defined chain of authority. Technical decisions support institutional standards rather than individual creative expression. The team combines Grammy-nominated excellence with sacred audio technology innovation, serving over 300 collaborations across 25+ languages with unwavering technical fidelity.
                                </p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
