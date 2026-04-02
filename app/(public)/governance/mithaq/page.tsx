"use client";
import { useState } from 'react';
import { ArrowDown, Shield, FileCheck, Building2, Archive, Scale, Users, BookOpen, Lock, CircleCheck as CheckCircle, ScrollText, ChevronDown } from 'lucide-react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';

interface ExpandableSection {
    title: string;
    content: string[];
}

function ExpandableContent({ title, content }: ExpandableSection) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-neutral-800 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 bg-neutral-900/30 hover:bg-neutral-900/50 transition-colors"
            >
                <h3 className="text-lg font-semibold text-white text-left">{title}</h3>
                <ChevronDown
                    className={`w-5 h-5 text-amber-400 transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>
            {isOpen && (
                <div className="p-6 bg-neutral-900/20 space-y-4">
                    {content.map((paragraph, idx) => (
                        <p key={idx} className="text-neutral-300 leading-relaxed">
                            {paragraph}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Mithaq() {
    const foundationalPrinciples = [
        'Institutional purpose',
        'Structural sequencing',
        'Governance hierarchy',
        'Continuity across generations'
    ];

    const authorityBoundaries = [
        'No creative function bypasses editorial authorization.',
        'No production function bypasses structured workflow.',
        'No release occurs without registry confirmation.',
        'Authority is sequential.'
    ];

    const governanceScope = [
        'All creative modules',
        'All production infrastructure',
        'All registry documentation',
        'All future network expansion'
    ];

    const constitutionalPillars = [
        {
            icon: Scale,
            title: 'Justice in Attribution',
            description: 'Every creative contribution is documented, validated, and attributed permanently through Diwan-e-Amanat registry.'
        },
        {
            icon: Users,
            title: 'Collective Stewardship',
            description: 'Authority is distributed across institutional bodies. No individual holds unilateral power over creative or economic decisions.'
        },
        {
            icon: BookOpen,
            title: 'Transparency by Design',
            description: 'All governance decisions, editorial processes, and economic distributions are documented and accessible to stakeholders.'
        },
        {
            icon: Lock,
            title: 'Immutable Standards',
            description: 'Core principles cannot be altered by convenience. Constitutional amendments require formal institutional consensus.'
        }
    ];

    const editorialPrinciples = [
        {
            title: 'Orthodoxy as Foundation',
            content: 'All content must align with traditional Islamic scholarship and Sufi teachings from recognized orders.'
        },
        {
            title: 'Scholarly Verification',
            content: 'Majlis-e-Nazr validates theological accuracy before any content enters production workflows.'
        },
        {
            title: 'No Commercial Compromise',
            content: 'Market demand does not override editorial standards. Quality and authenticity precede popularity.'
        }
    ];

    const accountabilityMechanisms = [
        {
            layer: 'Editorial Layer',
            body: 'Majlis-e-Nazr',
            accountability: 'Reviews all submitted kalams against orthodox criteria. Publishes rejection rationale for accountability.'
        },
        {
            layer: 'Production Layer',
            body: 'Production Oversight',
            accountability: 'Ensures studio bookings, performance assignments, and resource allocation follow established protocols.'
        },
        {
            layer: 'Registry Layer',
            body: 'Diwan-e-Amanat',
            accountability: 'Maintains immutable records of all contributions, preventing retroactive attribution disputes.'
        },
        {
            layer: 'Economic Layer',
            body: 'Royalty Framework',
            accountability: 'Transparent distribution logic ensures contributors receive their agreed share without negotiation friction.'
        }
    ];

    const contextualSections: ExpandableSection[] = [
        {
            title: 'Understanding Sufi Kalam: Sacred Poetry in Islamic Tradition',
            content: [
                'Sufi Kalam represents a centuries-old tradition of devotional poetry within Islamic spirituality. Rooted in the teachings of Sufism, these compositions express love for the Divine, spiritual longing, and mystical experiences while remaining firmly grounded in Islamic orthodoxy.',
                'Unlike secular poetry, Sufi Kalam serves as a vehicle for spiritual awakening and religious devotion. Masters like Rumi, Hafiz, Bulleh Shah, and Amir Khusro used poetic language to convey profound theological truths in forms accessible to both scholars and laypeople.',
                'Traditional Sufi Kalam adheres to Islamic principles, drawing from Quranic verses, Hadith, and teachings of recognized Sufi orders (tariqas). The poetry often explores themes of divine love (ishq-e-haqiqi), spiritual purification (tazkiyah), and the seeker\'s journey toward proximity to Allah.'
            ]
        },
        {
            title: 'Why SufiPulse Exists: Addressing Modern Challenges',
            content: [
                'The digital age has democratized content creation, but this freedom comes with significant challenges for sacred artistic traditions. Anyone can now produce and distribute content labeled as "Sufi" or "Islamic," often without proper knowledge, editorial oversight, or accountability.',
                'This has led to theological inaccuracies, commercialization of sacred content, and the dilution of centuries-old traditions. Content that contradicts Islamic principles or misrepresents Sufi teachings spreads rapidly, causing confusion among seekers.',
                'SufiPulse was established to preserve the integrity of Sufi Kalam in the modern era by creating an institutional framework that ensures all content undergoes rigorous theological review, maintains attribution standards, and operates with transparent governance.'
            ]
        },
        {
            title: 'The Crisis of Attribution in Digital Media',
            content: [
                'Traditional artistic communities operated with clear attribution practices, where teachers, students, and patrons all received recognition. The digital economy has disrupted these norms, with content frequently shared without proper credit.',
                'Musicians, poets, and producers often see their work distributed across platforms with no compensation or recognition. Streaming services and social media algorithms prioritize engagement over attribution, and contractual disputes leave artists powerless.',
                'Mithaq establishes Diwan-e-Amanat as the constitutional authority for attribution. Every contribution is recorded immutably, ensuring that writers, vocalists, producers, and studios receive permanent recognition and economic rights.'
            ]
        },
        {
            title: 'Governance as Protection, Not Control',
            content: [
                'SufiPulse\'s governance model is not about centralized control but distributed accountability. Mithaq establishes multiple institutional layers, each with defined authority and clear boundaries.',
                'Majlis-e-Nazr ensures theological accuracy, Production Oversight manages creative execution, and Diwan-e-Amanat validates all records. No single body can override the others, creating a system of checks and balances.',
                'This structure protects contributors from arbitrary decisions, ensures content remains aligned with Islamic principles, and provides a transparent framework that can be audited and trusted by the community.'
            ]
        },
        {
            title: 'Economic Justice in Creative Work',
            content: [
                'Mithaq recognizes that creative work has both spiritual and economic dimensions. While Sufi Kalam is sacred, those who dedicate time and skill to its production deserve fair compensation.',
                'Traditional patronage models are no longer viable at scale. SufiPulse implements a royalty system where all contributors receive transparent revenue shares based on documented roles.',
                'This economic layer is governed by the same constitutional principles as editorial and production layers, ensuring that financial decisions cannot compromise artistic integrity or theological standards.'
            ]
        },
        {
            title: 'Why Constitutional Documentation Matters',
            content: [
                'Institutions without documented governance often fail when founders leave, circumstances change, or disputes arise. Mithaq exists as a written constitutional charter to prevent mission drift and ensure continuity.',
                'By documenting principles, authority structures, and amendment processes, SufiPulse creates institutional permanence. Future generations inherit a clear framework rather than vague intentions.',
                'This document is not symbolic. It is operational, referenced in decision-making, and enforced through the institutional hierarchy it establishes.'
            ]
        },
        {
            title: 'SufiPulse\'s Scope and Limitations',
            content: [
                'SufiPulse focuses specifically on Sufi Kalam that aligns with Islamic orthodoxy and traditional Sufi teachings. It does not claim authority over all Islamic content or all Sufi traditions globally.',
                'The platform serves artists, producers, and audiences who value editorial rigor, attribution integrity, and governance transparency. It is not positioned as the only way to engage with Sufi content but as one institutional model.',
                'Mithaq acknowledges that other approaches exist and may be valid within their own contexts. SufiPulse\'s contribution is to demonstrate that institutional rigor and sacred art can coexist in the digital age.'
            ]
        }
    ];

    return (
        <Layout>
            <Section className="pt-24 pb-8">
                <PageContainer>
                    <div className="max-w-6xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Mithaq
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
                            {roleDisplayMap.institutional_framework.mystical}
                        </p>

                        <div className="mt-8 max-w-3xl">
                            <p className="text-neutral-300 leading-relaxed">
                                Mithaq establishes the governing principles, authority boundaries, and structural continuity of SufiPulse. All institutional functions derive legitimacy from this charter.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-6xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Essential Context: Why This Matters
                        </h2>
                        <p className="text-neutral-300 leading-relaxed mb-6">
                            To understand Mithaq's role, it's important to understand the broader context of Sufi Kalam, the challenges it faces in the modern era, and why institutional governance is necessary for its preservation.
                        </p>
                        <div className="space-y-4">
                            {contextualSections.map((section, idx) => (
                                <ExpandableContent key={idx} title={section.title} content={section.content} />
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-6xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Foundational Authority
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 leading-relaxed mb-6">
                                Mithaq defines:
                            </p>

                            <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
                                {foundationalPrinciples.map((principle, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">{principle}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 leading-relaxed text-sm">
                                It does not operate daily workflows. It defines who has the authority to operate them.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-6xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Institutional Hierarchy
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 leading-relaxed mb-8">
                                Authority flows vertically through defined institutional layers:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6 flex flex-col items-center text-center">
                                    <Shield className="w-8 h-8 text-amber-400 mb-3" />
                                    <h3 className="text-white font-semibold text-base mb-1">Mithaq</h3>
                                    <p className="text-neutral-400 text-xs">Constitutional Foundation</p>
                                </div>

                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6 flex flex-col items-center text-center">
                                    <FileCheck className="w-8 h-8 text-amber-400 mb-3" />
                                    <h3 className="text-white font-semibold text-base mb-1">Majlis-e-Nazr</h3>
                                    <p className="text-neutral-400 text-xs">Editorial Authorization</p>
                                </div>

                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6 flex flex-col items-center text-center">
                                    <Building2 className="w-8 h-8 text-amber-400 mb-3" />
                                    <h3 className="text-white font-semibold text-base mb-1">Production Oversight</h3>
                                    <p className="text-neutral-400 text-xs">Execution Governance</p>
                                </div>

                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6 flex flex-col items-center text-center">
                                    <Archive className="w-8 h-8 text-amber-400 mb-3" />
                                    <h3 className="text-white font-semibold text-base mb-1">Diwan-e-Amanat</h3>
                                    <p className="text-neutral-400 text-xs">Registry Validation</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Authority Boundaries
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="space-y-4">
                                {authorityBoundaries.map((boundary, idx) => (
                                    <p key={idx} className="text-neutral-300 leading-relaxed">
                                        {boundary}
                                    </p>
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
                            Continuity & Amendment
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 leading-relaxed mb-4">
                                Mithaq may only be amended through documented institutional review. Amendments require recorded approval across governing bodies.
                            </p>
                            <p className="text-neutral-300 leading-relaxed">
                                This makes the charter real.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-6xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Constitutional Pillars
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {constitutionalPillars.map((pillar, idx) => (
                                <div key={idx} className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                    <div className="flex items-start gap-4 mb-3">
                                        <pillar.icon className="w-6 h-6 text-amber-400 flex-shrink-0" />
                                        <h3 className="text-white font-semibold">{pillar.title}</h3>
                                    </div>
                                    <p className="text-neutral-400 text-sm leading-relaxed">
                                        {pillar.description}
                                    </p>
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
                            Editorial Principles
                        </h2>

                        <div className="space-y-4">
                            {editorialPrinciples.map((principle, idx) => (
                                <div key={idx} className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                    <div className="flex items-start gap-3 mb-2">
                                        <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                        <h3 className="text-white font-semibold">{principle.title}</h3>
                                    </div>
                                    <p className="text-neutral-400 text-sm leading-relaxed pl-8">
                                        {principle.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-6xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Accountability Mechanisms
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-neutral-900/50 border-b border-neutral-800">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-amber-400 font-semibold text-sm">Layer</th>
                                            <th className="text-left px-6 py-4 text-amber-400 font-semibold text-sm">Governing Body</th>
                                            <th className="text-left px-6 py-4 text-amber-400 font-semibold text-sm">Accountability</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accountabilityMechanisms.map((mechanism, idx) => (
                                            <tr key={idx} className="border-b border-neutral-800 last:border-0">
                                                <td className="px-6 py-4 text-white font-medium text-sm">{mechanism.layer}</td>
                                                <td className="px-6 py-4 text-neutral-300 text-sm">{mechanism.body}</td>
                                                <td className="px-6 py-4 text-neutral-400 text-sm leading-relaxed">{mechanism.accountability}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-6xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Constitutional Protection
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="flex items-start gap-4 mb-6">
                                <ScrollText className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-white font-semibold mb-2">Amendment Process</h3>
                                    <p className="text-neutral-300 leading-relaxed text-sm mb-4">
                                        Mithaq may only be amended through documented institutional review requiring:
                                    </p>
                                    <ul className="space-y-2 text-neutral-400 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-400 mt-1">•</span>
                                            <span>Written proposal submitted to all governing bodies</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-400 mt-1">•</span>
                                            <span>Unanimous approval from Majlis-e-Nazr</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-400 mt-1">•</span>
                                            <span>Production oversight verification</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-400 mt-1">•</span>
                                            <span>Permanent record in Diwan-e-Amanat with rationale</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 leading-relaxed text-sm italic">
                                This deliberate friction prevents arbitrary changes and ensures constitutional stability across leadership transitions.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 pb-24">
                <PageContainer>
                    <div className="max-w-6xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Institutional Permanence
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 leading-relaxed mb-6">
                                Mithaq governs:
                            </p>

                            <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 mb-6">
                                {governanceScope.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">{item}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 leading-relaxed">
                                This charter outlasts individuals. It survives leadership changes, technological shifts, and market fluctuations. Expansion does not dilute governance—it extends institutional authority into new domains under the same constitutional framework.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
