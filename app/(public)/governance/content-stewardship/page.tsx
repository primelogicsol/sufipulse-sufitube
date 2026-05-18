"use client";
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { FileText, Globe, Shield, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Languages, Search, Sparkles, BookOpen } from 'lucide-react';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioWorkflowRoadmap, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function ContentStewardship() {
    const languages = [
        'Roman Urdu', 'Urdu', 'Hindi', 'Arabic', 'Turkish', 'Persian (Farsi)',
        'Punjabi', 'Indonesian', 'Spanish', 'Portuguese', 'French', 'German',
        'Russian', 'Bengali', 'Chinese', 'Japanese', 'English'
    ];

    const stewardshipMandates = [
        {
            icon: Globe,
            title: '17-Language Discipline',
            description: 'Standardized multilingual distribution with native-script preservation across all releases.'
        },
        {
            icon: Shield,
            title: 'Source Integrity',
            description: 'Original linguistic nuance protected through authorized translation and scholarly review.'
        },
        {
            icon: FileText,
            title: 'Thematic Coherence',
            description: 'Unified interpretive framework maintained across all global translations and variants.'
        },
        {
            icon: CheckCircle,
            title: 'Doctrinal Alignment',
            description: 'Interpretation verified against institutional doctrine and traditional sacred literature.'
        }
    ];

    const subtitlePrinciples = [
        { title: 'RTL Positioning', desc: 'Arabic, Urdu, and Persian scripts maintain directional integrity.' },
        { title: 'Native-Script Preservation', desc: 'No romanization of non-Latin scripts unless mandated.' },
        { title: 'Pronunciation Integrity', desc: 'Transliteration follows scholarly conventions, not phonetic convenience.' },
        { title: 'Conceptual Precision', desc: 'Technical terms retain doctrinal meaning across all target languages.' }
    ];

    const interpretivePrinciples = [
        { title: 'Doctrinal Clarity', desc: 'Alignment with institutional understanding of text and tradition.' },
        { title: 'Theological Neutrality', desc: 'Avoiding sectarian bias or doctrinal deviation in framing.' },
        { title: 'Non-Commercial Tone', desc: 'Avoiding sensationalism or entertainment-driven narratives.' },
        { title: 'Cultural Nuance', desc: 'Respecting linguistic context without compromising core meaning.' }
    ];

    const reviewSteps = [
        { id: 1, title: 'Language Approval', icon: Languages, desc: 'Source text accuracy check' },
        { id: 2, title: 'Alignment Review', icon: Search, desc: 'Semantic consistency verify' },
        { id: 3, title: 'Thematic Documentation', icon: BookOpen, desc: 'Interpretive guidance lock' },
        { id: 4, title: 'Technical Verification', icon: FileText, desc: 'Subtitle timing and RTL check' },
        { id: 5, title: 'Clearance Issued', icon: CheckCircle, desc: 'Final publication authorization' }
    ];

    const structuralBoundaries = [
        {
            action: 'No External Editing',
            clarification: 'Translation modifications require formal institutional review'
        },
        {
            action: 'No Post-Release Alteration',
            clarification: 'Interpretive framing remains immutable after registry lock'
        },
        {
            action: 'No Unauthorized Additions',
            clarification: 'The 17-language framework is standardized globally'
        },
        {
            action: 'Charter Compliance',
            clarification: 'All decisions must conform to institutional Mithaq provisions'
        }
    ];

    return (
        <Layout>
            <StudioHero 
                badge="Linguistic & Thematic Alignment"
                title="Content Stewardship"
                mysticalName={roleDisplayMap.content_stewardship.mystical}
                description="All releases undergo structured linguistic review, thematic alignment, and subtitle standardization prior to publication to ensure doctrinal integrity."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Stewardship Mandate"
                            subtitle="Safeguarding the sacredness of sound and meaning through disciplined linguistic oversight"
                        />

                        <StudioCardGrid cols={4}>
                            {stewardshipMandates.map((item, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={item.icon}
                                    title={item.title}
                                    description={item.description}
                                />
                            ))}
                        </StudioCardGrid>

                        <div className="mt-12 bg-neutral-950/50 border border-red-500/20 rounded-xl p-8 text-center max-w-3xl mx-auto shadow-2xl">
                            <div className="flex items-center justify-center gap-4 text-amber-500 mb-2">
                                <AlertTriangle size={20} />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Critical Responsibility</p>
                            </div>
                            <p className="text-neutral-300 text-sm font-medium">
                                "Translation is not localization. It is doctrinal responsibility. We preserve the essence, not just the word."
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Global Subtitle Framework"
                            subtitle="SufiPulse operates under a standardized 17-language subtitle sequence with RTL alignment protocols and linguistic integrity rules."
                        />

                        <div className="elite-card p-10 md:p-12 mb-12 shadow-inner">
                            <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.4em] text-center mb-10">Supported Institutional Languages</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-4">
                                {languages.map((lang, idx) => (
                                    <div key={idx} className="flex items-center gap-3 group">
                                        <div className="w-1 h-1 rounded-full bg-amber-400/40 group-hover:bg-amber-400 transition-colors" />
                                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest group-hover:text-white transition-colors">{lang}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <StudioCardGrid cols={2}>
                            {subtitlePrinciples.map((item, idx) => (
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

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Interpretive Integrity"
                            subtitle="Thematic framing must preserve doctrinal clarity and avoid theological distortion"
                        />

                        <StudioCardGrid cols={2}>
                            {interpretivePrinciples.map((item, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={Shield}
                                    title={item.title}
                                    description={item.desc}
                                />
                            ))}
                        </StudioCardGrid>
                    </div>
                </PageContainer>
            </Section>

            <StudioWorkflowRoadmap 
                title="Editorial Review Sequence"
                badge="Linguistic Pipeline"
                steps={reviewSteps}
                description="Linguistic precision and thematic consistency verification."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Structural Boundaries"
                            subtitle="Non-negotiable constraints to preserve institutional content integrity"
                        />

                        <div className="elite-card p-10 md:p-12">
                            <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                                {structuralBoundaries.map((boundary, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <p className="text-white text-sm font-bold uppercase tracking-wider">{boundary.action}</p>
                                        <p className="text-neutral-500 text-[11px] leading-relaxed font-medium uppercase tracking-widest">{boundary.clarification}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em] mt-12 pt-6 border-t border-white/5 text-center italic">
                                Stewardship ensures clarity serves the sacred message.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Linguistic Stewardship"
                description="Content stewardship at SufiPulse is custodial, not creative. All translations and interpretive framing must align with the institutional charter to ensure that spiritual art transcends linguistic barriers without losing its doctrinal essence."
                primaryCTA={{ label: "Editorial Council", href: "/governance/majlis-e-nazr" }}
                secondaryCTA={{ label: "Constitutional Mithaq", href: "/governance/mithaq" }}
                shieldText="Governed Content Stewardship"
                background="midnight"
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
