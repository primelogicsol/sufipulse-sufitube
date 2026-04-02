"use client";
import { Shield, BookOpen, Users, Globe, Circle as HelpCircle } from 'lucide-react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { useState } from 'react';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';

export default function AboutSufiPulse() {
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
    const identityPoints = [
        'A devotional content institution',
        'A structured production framework',
        'A governed registry-based release system',
        'A multi-regional studio network'
    ];

    const missionPoints = [
        'Protect thematic coherence',
        'Maintain technical excellence',
        'Ensure contributor recognition',
        'Preserve institutional continuity'
    ];

    const structuralComponents = [
        {
            component: 'Editorial authorization',
            icon: BookOpen
        },
        {
            component: 'Production oversight',
            icon: Users
        },
        {
            component: 'Registry validation',
            icon: Shield
        }
    ];

    const networkLocations = [
        {
            type: 'Central Studio',
            location: 'USA (Virginia)',
            role: 'Production oversight and master validation'
        },
        {
            type: 'Network Studios',
            location: 'Canada, UAE, India',
            role: 'Regional recording under centralized governance'
        }
    ];

    const faqItems = [
        {
            question: 'What is SufiPulse?',
            answer: 'SufiPulse is a structured devotional production institution integrating editorial governance, studio infrastructure, and registry documentation under a unified charter. It operates as a constitutional framework for preserving devotional expression.'
        },
        {
            question: 'Is SufiPulse a record label?',
            answer: 'No. SufiPulse is not a label or a collective. It is an institutional structure operating under documented governance with editorial authorization, production oversight, and registry validation.'
        },
        {
            question: 'Who can contribute to SufiPulse?',
            answer: 'Contributions are governed by role-based participation. Writers (Ahl-e-Qalam) submit through editorial review. Vocalists (Ahl-e-Sada) and Producers (Ahl-e-Tarannum) are assigned after approval. All contributors operate within the documented governance framework.'
        },
        {
            question: 'How does editorial review work?',
            answer: 'Majlis-e-Nazr (Editorial Council) reviews all submissions for thematic coherence, spiritual alignment, and institutional compatibility. Approved works enter the production queue under documented workflow.'
        },
        {
            question: 'Where are releases recorded?',
            answer: 'Recording occurs within the SufiPulse Studio Network: Central Studio (USA - Virginia) and Network Studios (Canada, UAE, India). All recordings follow centralized production oversight and master validation before registry authorization.'
        },
        {
            question: 'How are releases published?',
            answer: 'All releases follow Release Protocol. After editorial approval, studio production, and technical validation, the Registry (Diwan-e-Amanat) authorizes publication. No independent publication occurs outside this sequence.'
        },
        {
            question: 'What is the Mithaq?',
            answer: 'Mithaq is the Constitutional Charter establishing SufiPulse\'s institutional framework, governance structure, role definitions, and operational principles. All participants operate under its documented authority.'
        },
        {
            question: 'How does royalty distribution work?',
            answer: 'Economic distribution follows documented templates managed by Diwan-e-Amanat. All revenue, allocations, and payouts are transparently recorded in the royalty transparency system. Contributors receive allocation based on their documented roles.'
        },
        {
            question: 'Can I submit my work?',
            answer: 'Writers may submit through the application process on the Writers page. Submissions undergo editorial review. Acceptance grants Ahl-e-Qalam status and access to the production framework.'
        },
        {
            question: 'What is the difference between mystical and public role names?',
            answer: 'SufiPulse uses dual naming: mystical names (e.g., Ahl-e-Qalam) reflect spiritual tradition; public names (e.g., Writers) ensure external accessibility. Both refer to the same institutional roles.'
        },
        {
            question: 'How can I become a vocalist or producer?',
            answer: 'Vocalists and Producers are invited based on institutional need and artistic alignment. Assignment occurs through Production Oversight after editorial approval of specific works.'
        },
        {
            question: 'What happens after a release is published?',
            answer: 'Published releases enter the permanent registry with full metadata documentation. Revenue tracking begins immediately. Contributors can monitor royalty allocation through the transparency system.'
        },
        {
            question: 'Who governs SufiPulse?',
            answer: 'Governance operates through constitutional structure: Mithaq (Charter), Majlis-e-Nazr (Editorial Council), Production Oversight (Studio Integration), Release Protocol (Publication Sequence), and Diwan-e-Amanat (Registry Authority). No single individual controls operations.'
        },
        {
            question: 'Can studios join the network?',
            answer: 'Studios may apply for network inclusion through the Studio page. Admission requires demonstrated technical capability, acoustic standards, and governance alignment. All network studios operate under centralized review.'
        },
        {
            question: 'How does SufiPulse ensure quality?',
            answer: 'Quality is maintained through layered validation: editorial thematic review, studio technical standards, production oversight, master validation, and registry authorization. No release bypasses this structure.'
        }
    ];

    return (
        <Layout>
            <Section className="pt-24 pb-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            About
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-8 border-b border-amber-400/20 pb-4 inline-block">
                            What is SufiPulse? ({roleDisplayMap.what_is_sufipulse.mystical})
                        </p>

                        <div className="max-w-2xl">
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse is a structured devotional production institution integrating editorial governance, studio infrastructure, and registry documentation under a unified charter.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Institutional Identity
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm font-medium mb-6">
                                SufiPulse operates as:
                            </p>

                            <div className="space-y-3 mb-6">
                                {identityPoints.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm">{item}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <div className="space-y-2">
                                <p className="text-neutral-300 text-sm leading-relaxed">
                                    It is not a label.
                                </p>
                                <p className="text-neutral-300 text-sm leading-relaxed">
                                    It is not a collective.
                                </p>
                                <p className="text-neutral-300 text-sm leading-relaxed">
                                    It is an institutional structure.
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
                            Vision
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                To preserve devotional expression through structured governance, disciplined production, and documented release integrity.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Mission
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="space-y-3">
                                {missionPoints.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm">{item}</p>
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
                            Structural Distinction
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm font-medium mb-6">
                                SufiPulse integrates:
                            </p>

                            <div className="grid md:grid-cols-3 gap-6 mb-6">
                                {structuralComponents.map((item, idx) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={idx} className="flex flex-col items-center text-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <p className="text-neutral-300 text-sm font-medium">
                                                {item.component}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 text-sm leading-relaxed mb-2">
                                Under a constitutional charter.
                            </p>
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                Creative energy operates within structured governance.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Global Infrastructure
                        </h2>

                        <div className="space-y-4">
                            {networkLocations.map((location, idx) => (
                                <div key={idx} className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                    <div className="flex items-start gap-3 mb-3">
                                        <Globe className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-white font-medium text-sm mb-1">
                                                {location.type}
                                            </p>
                                            <p className="text-amber-400/70 text-xs">
                                                {location.location}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-neutral-300 text-sm leading-relaxed">
                                        {location.role}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-6 mt-6">
                            <p className="text-neutral-300 text-sm leading-relaxed mb-2">
                                Distributed execution.
                            </p>
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                Centralized validation.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 pb-20">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Frequently Asked Questions
                        </h2>

                        <div className="space-y-3">
                            {faqItems.map((item, idx) => (
                                <div key={idx} className="bg-neutral-900/30 border border-neutral-800 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
                                        className="w-full flex items-start justify-between gap-4 p-6 text-left hover:bg-neutral-900/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-3 flex-1">
                                            <HelpCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-white font-medium text-sm leading-relaxed">
                                                {item.question}
                                            </p>
                                        </div>
                                        <div
                                            className={`text-amber-400 transition-transform duration-200 flex-shrink-0 ${expandedQuestion === idx ? 'rotate-180' : ''
                                                }`}
                                        >
                                            ▼
                                        </div>
                                    </button>

                                    {expandedQuestion === idx && (
                                        <div className="px-6 pb-6">
                                            <div className="pl-8 border-l-2 border-amber-400/20">
                                                <p className="text-neutral-300 text-sm leading-relaxed">
                                                    {item.answer}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
