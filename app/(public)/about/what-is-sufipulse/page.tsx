"use client";
import { Shield, BookOpen, Users, Globe, Circle as HelpCircle, ChevronDown } from 'lucide-react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { useState } from 'react';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';

function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
    return (
        <div className="elite-card overflow-hidden transition-all duration-500">
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between gap-6 px-8 py-7 text-left hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-start gap-4 flex-1">
                    <HelpCircle className="w-5 h-5 text-amber-400/60 mt-1 flex-shrink-0" />
                    <p className="text-white font-bold text-lg tracking-tight leading-relaxed text-left">
                        {question}
                    </p>
                </div>
                <div className={`shrink-0 p-2 rounded-full bg-amber-400/5 border border-amber-400/10 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-amber-400" />
                </div>
            </button>

            {isOpen && (
                <div className="px-8 pb-10 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="pl-6 md:pl-10 border-l-2 border-amber-400/20">
                        <p className="text-neutral-400 text-base md:text-lg leading-relaxed font-light">
                            {answer}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AboutSufiPulse() {
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
    const identityPoints = [
        { title: 'Content Institution', desc: 'A devotional content institution preserving sacred art through structured oversight.' },
        { title: 'Production Framework', desc: 'A disciplined technical framework that transforms creative intent into master recordings.' },
        { title: 'Registry Release', desc: 'A governed release system ensuring permanent documentation and verified attribution.' },
        { title: 'Global Network', desc: 'A multi-regional network of studios and contributors aligned under a single charter.' }
    ];

    const missionPoints = [
        'Protect thematic coherence',
        'Maintain technical excellence',
        'Ensure contributor recognition',
        'Preserve institutional continuity'
    ];

    const structuralComponents = [
        {
            title: 'Editorial Authorization',
            icon: BookOpen,
            description: 'Majlis-e-Nazr reviews all kalam for spiritual and linguistic alignment.'
        },
        {
            title: 'Production Oversight',
            icon: Users,
            description: 'Structured studio coordination and technical quality validation.'
        },
        {
            title: 'Registry Validation',
            icon: Shield,
            description: 'Diwan-e-Amanat ensures metadata lock and attribution integrity.'
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
        }
    ];

    return (
        <Layout>
            <StudioHero 
                badge="Institutional Overview"
                title="About SufiPulse"
                mysticalName={roleDisplayMap.what_is_sufipulse.mystical}
                description="SufiPulse is a structured devotional production institution integrating editorial governance, studio infrastructure, and registry documentation under a unified charter."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Institutional Identity"
                            subtitle="Defining our position as a custodial authority for sacred music preservation"
                        />

                        <StudioCardGrid cols={2}>
                            {identityPoints.map((item, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={Globe}
                                    title={item.title}
                                    description={item.desc}
                                />
                            ))}
                        </StudioCardGrid>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <StudioSectionHeader 
                                    title="Our Mission"
                                    subtitle="Structural focus beyond individual expression"
                                />
                                <div className="space-y-6">
                                    {missionPoints.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 group">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:shadow-[0_0_10px_rgba(212,175,55,0.6)] transition-all" />
                                            <p className="text-neutral-300 text-sm font-black uppercase tracking-[0.2em]">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="elite-card p-10 bg-linear-to-br from-amber-400/5 to-transparent">
                                <p className="text-white text-xl font-light leading-relaxed italic">
                                    "To preserve devotional expression through structured governance, disciplined production, and documented release integrity."
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
                            title="Structural Components"
                            subtitle="The integrated layers of institutional authority"
                        />

                        <StudioCardGrid cols={3}>
                            {structuralComponents.map((item, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={item.icon}
                                    title={item.title}
                                    description={item.description}
                                />
                            ))}
                        </StudioCardGrid>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-4xl mx-auto">
                        <StudioSectionHeader 
                            title="Frequently Asked Questions"
                            subtitle="Essential institutional knowledge for contributors and partners"
                            centered
                        />

                        <div className="space-y-6">
                            {faqItems.map((item, idx) => (
                                <FAQItem 
                                    key={idx} 
                                    question={item.question} 
                                    answer={item.answer} 
                                    isOpen={expandedQuestion === idx}
                                    onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
                                />
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Sacred Stewardship"
                description="SufiPulse is not a label or a collective. It is a constitutional framework designed for institutional permanence and doctrinal fidelity."
                primaryCTA={{ label: "View Constitutional Charter", href: "/governance/mithaq" }}
                secondaryCTA={{ label: "Contributor Policy", href: "/contributor-policy" }}
                shieldText="Governed Institutional Division"
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
        </Layout>
    );
}
