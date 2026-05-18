"use client";
import { FileCheck, ArrowRight, Shield, Database, ShieldCheck, History, Archive, Lock } from 'lucide-react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioWorkflowRoadmap, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';

export default function DiwanEAmanat() {
    const mandatePoints = [
        {
            icon: ShieldCheck,
            title: 'Credit Confirmation',
            description: 'Permanent documentation and verification of all contributor credits prior to release.'
        },
        {
            icon: Database,
            title: 'Royalty Documentation',
            description: 'Formal recording of economic allocation structures within the institutional registry.'
        },
        {
            icon: Lock,
            title: 'Metadata Locking',
            description: 'Ensuring all technical and creative metadata is immutably locked before publication.'
        },
        {
            icon: Shield,
            title: 'Structured Verification',
            description: 'Authorized validation sequence that must be traversed for every release record.'
        }
    ];

    const responsibilityAreas = [
        {
            label: 'Master Confirmation',
            description: 'Final validation that production output meets institutional registry standards.'
        },
        {
            label: 'Identity Verification',
            description: 'Documented confirmation of all participating writers, vocalists, and producers.'
        },
        {
            label: 'Rights Documentation',
            description: 'Formalization of allocation structures and agreement records for all stakeholders.'
        },
        {
            label: 'Institutional Archive',
            description: 'Permanent record entry ensuring long-term preservation of release documentation.'
        }
    ];

    const finalizationSteps = [
        { id: 1, title: 'Master Confirm', icon: FileCheck, desc: 'Production validation' },
        { id: 2, title: 'Credit Verify', icon: Shield, desc: 'Identity documentation' },
        { id: 3, title: 'Royalty Logic', icon: Database, desc: 'Economic recording' },
        { id: 4, title: 'Metadata Lock', icon: Lock, desc: 'Immutable record entry' },
        { id: 5, title: 'Release Clear', icon: FileCheck, desc: 'Publication authorized' }
    ];

    const authorityBoundaries = [
        {
            action: 'No Creative Evaluation',
            clarification: 'Thematic and artistic decisions remain with editorial authority'
        },
        {
            action: 'No Studio Management',
            clarification: 'Production execution is governed by Production Oversight'
        },
        {
            action: 'No Content Modification',
            clarification: 'Authority over approved kalam resides with Majlis-e-Nazr'
        },
        {
            action: 'No Charter Overriding',
            clarification: 'All authority derives from and remains bound by Mithaq'
        }
    ];

    return (
        <Layout>
            <StudioHero 
                badge="Registry Authority"
                title="Diwan-e-Amanat"
                mysticalName={roleDisplayMap.diwan_e_amanat.mystical}
                description="The Registry Authority governs final validation, contributor documentation, and release authorization. No work is published under SufiPulse without registry confirmation."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Mandate & Validation Authority"
                            subtitle="Transforming production output into institutional record through immutable documentation"
                        />

                        <StudioCardGrid cols={4}>
                            {mandatePoints.map((item, idx) => (
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
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Scope of Responsibility"
                            subtitle="Supervising the transition from production to permanent archive"
                        />

                        <StudioCardGrid cols={2}>
                            {responsibilityAreas.map((area, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={Archive}
                                    title={area.label}
                                    description={area.description}
                                />
                            ))}
                        </StudioCardGrid>

                        <div className="mt-12 bg-[var(--color-midnight)]/30 border border-[var(--color-gold)]/20 rounded-xl p-8 text-center max-w-3xl mx-auto shadow-2xl">
                            <p className="text-[var(--text-sm)] text-neutral-400 leading-relaxed font-medium">
                                "Registry formalizes what production completes. It serves as the final seal of institutional approval."
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioWorkflowRoadmap 
                title="Finalization Sequence"
                badge="Registry Pipeline"
                steps={finalizationSteps}
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Authority Boundaries"
                            subtitle="Defined limitations to ensure registry independence and procedural integrity"
                        />

                        <div className="elite-card p-10 md:p-12">
                            <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                                {authorityBoundaries.map((boundary, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <p className="text-white text-sm font-bold uppercase tracking-wider">{boundary.action}</p>
                                        <p className="text-neutral-500 text-[11px] leading-relaxed font-medium uppercase tracking-widest">{boundary.clarification}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em] mt-12 pt-6 border-t border-white/5 text-center italic">
                                Authority begins after production confirmation and concludes at publication authorization.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Institutional Record"
                description="Release is not a technical toggle; it is a recorded institutional act. Every authorized release contains confirmed contributor attribution and archived metadata traceable across institutional continuity."
                primaryCTA={{ label: "Release Protocol", href: "/governance/release-protocol" }}
                secondaryCTA={{ label: "Royalty Framework", href: "/governance/royalty-transparency" }}
                shieldText="Governed Registry Authority"
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
