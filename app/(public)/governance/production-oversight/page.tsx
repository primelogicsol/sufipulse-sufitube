"use client";
import { Settings, ArrowRight, Mic, Network, Headphones, FileCheck, Database, ShieldCheck } from 'lucide-react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioWorkflowRoadmap, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';

export default function ProductionOversight() {
    const mandatePoints = [
        {
            icon: FileCheck,
            title: 'Structured Entry',
            description: 'Ensuring only approved kalam from the Majlis-e-Nazr enters the production pipeline.'
        },
        {
            icon: Settings,
            title: 'Workflow Sequencing',
            description: 'Maintaining strict adherence to the documented studio and production sequence.'
        },
        {
            icon: ShieldCheck,
            title: 'Technical Standards',
            description: 'Consistent application of high-fidelity audio standards across the global network.'
        },
        {
            icon: Database,
            title: 'Registry Handoff',
            description: 'Validating technical documentation and master quality prior to registry entry.'
        }
    ];

    const supervisionAreas = [
        {
            label: 'Recording Sessions',
            description: 'Vocalist performance capture and quality verification in regional studios.'
        },
        {
            label: 'Network Coordination',
            description: 'Managing distributed studio execution within centralized institutional standards.'
        },
        {
            label: 'Sonic Alignment',
            description: 'Supervising mixing and mastering to ensure thematic and technical consistency.'
        },
        {
            label: 'Metadata Readiness',
            description: 'Confirming technical documentation is complete for final registry Handover.'
        }
    ];

    const executionSteps = [
        { id: 1, title: 'Approved Kalam', icon: FileCheck, desc: 'Editorial council authorization' },
        { id: 2, title: 'Talent Assignment', icon: Mic, desc: 'Vocalist and producer matching' },
        { id: 3, title: 'Network Allocation', icon: Network, desc: 'Studio resource scheduling' },
        { id: 4, title: 'Recording', icon: Headphones, desc: 'Master-grade capture' },
        { id: 5, title: 'Central Review', icon: Settings, desc: 'Technical and thematic audit' },
        { id: 6, title: 'Master Confirmation', icon: FileCheck, desc: 'Final production lock' },
        { id: 7, title: 'Registry Handoff', icon: Database, desc: 'Institutional record entry' }
    ];

    const authorityBoundaries = [
        {
            action: 'No Publication Authority',
            clarification: 'Release activation requires registry confirmation by Diwan-e-Amanat'
        },
        {
            action: 'No Thematic Approval',
            clarification: 'Editorial authority remains strictly with Majlis-e-Nazr'
        },
        {
            action: 'No Royalty Modification',
            clarification: 'Economic distribution follows the constitutional framework'
        },
        {
            action: 'No Charter Alteration',
            clarification: 'All authority derives from and remains bound by Mithaq'
        }
    ];

    return (
        <Layout>
            <StudioHero 
                badge="Execution Governance"
                title="Production Oversight"
                mysticalName={roleDisplayMap.production_oversight.mystical}
                description="Production Oversight governs the structured execution of approved works, ensuring that recording, mixing, and technical preparation follow documented institutional standards."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Mandate & Operational Control"
                            subtitle="Governing process integrity and technical fidelity throughout the production lifecycle"
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
                            title="Scope of Oversight"
                            subtitle="Supervisory authority across regional and centralized production nodes"
                        />

                        <StudioCardGrid cols={2}>
                            {supervisionAreas.map((area, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={Settings}
                                    title={area.label}
                                    description={area.description}
                                />
                            ))}
                        </StudioCardGrid>

                        <div className="mt-12 bg-[var(--color-midnight)]/30 border border-[var(--color-gold)]/20 rounded-xl p-8 text-center max-w-3xl mx-auto shadow-2xl">
                            <p className="text-[var(--text-sm)] text-neutral-400 leading-relaxed font-medium">
                                "Execution remains centralized through defined authority. Regional network participation does not alter or dilute institutional standards."
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioWorkflowRoadmap 
                title="Execution Flow"
                badge="Production Sequence"
                steps={executionSteps}
                description="No step is optional. Technical compliance and registry adherence is mandatory."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Authority Boundaries"
                            subtitle="Defined limitations to ensure procedural integrity and separation of powers"
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
                                Authority concludes at registry handoff.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Centralized Validation Principle"
                description="Distributed execution operates within centralized governance. All recording sessions and masters are subject to final technical validation by the SufiPulse Central Studio."
                primaryCTA={{ label: "Studio Network", href: "/studio" }}
                secondaryCTA={{ label: "Majlis-e-Nazr", href: "/governance/majlis-e-nazr" }}
                shieldText="Governed Production Oversight"
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
