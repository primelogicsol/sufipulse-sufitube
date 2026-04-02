"use client";
import { Music, Radio, Sparkles, Waves, Users, Mic as Mic2, Music2, BookOpen } from 'lucide-react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { useState } from 'react';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';

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
        switch (activeTab) {
            case 'fundamentals':
                return (
                    <div className="space-y-8">
                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <h3 className="text-2xl font-bold text-white mb-4">Overview</h3>
                            <p className="text-neutral-300 leading-relaxed">
                                {sacredFundamentals.overview}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-white mb-6">Core Principles</h3>
                            <div className="space-y-6">
                                {sacredFundamentals.corePrinciples.map((principle, idx) => (
                                    <div key={idx} className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6 hover:border-amber-400/30 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="w-1 h-full bg-amber-400/30 rounded-full flex-shrink-0" />
                                            <div>
                                                <h4 className="text-white font-semibold mb-1">{principle.title}</h4>
                                                <p className="text-amber-400/80 text-sm mb-3 italic">{principle.description}</p>
                                                <p className="text-neutral-300 text-sm leading-relaxed">{principle.detail}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <h3 className="text-xl font-bold text-white mb-4">Practical Applications</h3>
                            <div className="space-y-3">
                                {sacredFundamentals.practicalApplications.map((app, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm leading-relaxed">{app}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'maqam':
                return (
                    <div className="space-y-8">
                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <h3 className="text-2xl font-bold text-white mb-4">Overview</h3>
                            <p className="text-neutral-300 leading-relaxed">
                                {maqamSystem.overview}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-white mb-6">Core Principles</h3>
                            <div className="space-y-6">
                                {maqamSystem.corePrinciples.map((principle, idx) => (
                                    <div key={idx} className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6 hover:border-amber-400/30 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="w-1 h-full bg-amber-400/30 rounded-full flex-shrink-0" />
                                            <div>
                                                <h4 className="text-white font-semibold mb-1">{principle.title}</h4>
                                                <p className="text-amber-400/80 text-sm mb-3 italic">{principle.description}</p>
                                                <p className="text-neutral-300 text-sm leading-relaxed">{principle.detail}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <h3 className="text-xl font-bold text-white mb-4">Practical Applications</h3>
                            <div className="space-y-3">
                                {maqamSystem.practicalApplications.map((app, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm leading-relaxed">{app}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'rhythms':
                return (
                    <div className="space-y-8">
                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <h3 className="text-2xl font-bold text-white mb-4">Overview</h3>
                            <p className="text-neutral-300 leading-relaxed">
                                {sacredRhythms.overview}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-white mb-6">Core Principles</h3>
                            <div className="space-y-6">
                                {sacredRhythms.corePrinciples.map((principle, idx) => (
                                    <div key={idx} className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6 hover:border-amber-400/30 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="w-1 h-full bg-amber-400/30 rounded-full flex-shrink-0" />
                                            <div>
                                                <h4 className="text-white font-semibold mb-1">{principle.title}</h4>
                                                <p className="text-amber-400/80 text-sm mb-3 italic">{principle.description}</p>
                                                <p className="text-neutral-300 text-sm leading-relaxed">{principle.detail}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <h3 className="text-xl font-bold text-white mb-4">Practical Applications</h3>
                            <div className="space-y-3">
                                {sacredRhythms.practicalApplications.map((app, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm leading-relaxed">{app}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'acoustics':
                return (
                    <div className="space-y-8">
                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <h3 className="text-2xl font-bold text-white mb-4">Overview</h3>
                            <p className="text-neutral-300 leading-relaxed">
                                {sacredAcoustics.overview}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-white mb-6">Core Principles</h3>
                            <div className="space-y-6">
                                {sacredAcoustics.corePrinciples.map((principle, idx) => (
                                    <div key={idx} className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6 hover:border-amber-400/30 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="w-1 h-full bg-amber-400/30 rounded-full flex-shrink-0" />
                                            <div>
                                                <h4 className="text-white font-semibold mb-1">{principle.title}</h4>
                                                <p className="text-amber-400/80 text-sm mb-3 italic">{principle.description}</p>
                                                <p className="text-neutral-300 text-sm leading-relaxed">{principle.detail}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <h3 className="text-xl font-bold text-white mb-4">Practical Applications</h3>
                            <div className="space-y-3">
                                {sacredAcoustics.practicalApplications.map((app, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm leading-relaxed">{app}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Layout>
            <Section className="pt-24 pb-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Sacred Music Theory Framework
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-8 border-b border-amber-400/20 pb-4 inline-block">
                            {roleDisplayMap.music_style_selection.mystical}
                        </p>

                        <div className="max-w-3xl">
                            <p className="text-neutral-300 leading-relaxed">
                                Comprehensive exploration of the principles that guide spiritual musical expression within SufiPulse productions.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg overflow-hidden mb-8">
                            <div className="grid grid-cols-2 md:grid-cols-4">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`p-4 text-center border-b-2 transition-all ${activeTab === tab.id
                                                ? 'border-amber-400 bg-amber-400/5'
                                                : 'border-transparent hover:bg-neutral-800/30'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-amber-400' : 'text-neutral-400'}`} />
                                                <span className={`text-xs font-medium ${activeTab === tab.id ? 'text-white' : 'text-neutral-400'}`}>
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

            <Section className="py-12 bg-neutral-950/50">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Practical Applications
                        </h2>
                        <p className="text-neutral-400 text-sm mb-8">
                            How sacred music theory translates into real-world spiritual practice
                        </p>

                        <div className="space-y-6">
                            {roleApplications.map((roleApp, idx) => {
                                const Icon = roleApp.icon;
                                return (
                                    <div key={idx} className="bg-neutral-900/40 border border-neutral-800 rounded-lg p-8">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="p-3 bg-amber-400/10 rounded-lg border border-amber-400/30 flex-shrink-0">
                                                <Icon className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-2">{roleApp.role}</h3>
                                                <p className="text-neutral-300 text-sm">{roleApp.description}</p>
                                            </div>
                                        </div>

                                        <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-6">
                                            <div className="space-y-3">
                                                {roleApp.practices.map((practice, pIdx) => (
                                                    <div key={pIdx} className="flex items-start gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                                        <p className="text-neutral-300 text-sm leading-relaxed">{practice}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 pb-20">
                <PageContainer>
                    <div className="max-w-4xl">
                        <div className="bg-gradient-to-r from-amber-400/5 to-transparent border-l-2 border-amber-400/50 pl-6 py-6">
                            <p className="text-white font-medium mb-3">Guiding Philosophy</p>
                            <p className="text-neutral-300 text-sm leading-relaxed italic mb-4">
                                "We do not monetize the sacred. We serve it."
                            </p>
                            <p className="text-neutral-400 text-xs leading-relaxed">
                                Sacred music theory at SufiPulse is not academic exercise—it is lived spiritual practice. Every technical choice, every artistic decision, every production element serves the ultimate purpose of facilitating divine connection and spiritual transformation.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
