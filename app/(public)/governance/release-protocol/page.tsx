"use client";
import { FileCheck, ArrowRight, Mic, Shield, Database, Lock, ShieldCheck } from 'lucide-react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioWorkflowRoadmap, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';

export default function ReleaseProtocol() {
    const purposePoints = [
        {
            icon: ShieldCheck,
            title: 'Sequential Respect',
            description: 'Ensuring all levels of institutional authority are respected prior to publication.'
        },
        {
            icon: FileCheck,
            title: 'Output Validation',
            description: 'Confirming that all production outputs meet documented technical and spiritual standards.'
        },
        {
            icon: Database,
            title: 'Registry Integrity',
            description: 'Ensuring registry documentation is 100% complete and verified before release.'
        },
        {
            icon: Shield,
            title: 'Mission Preservation',
            description: 'Maintaining the long-term institutional integrity of the SufiPulse platform.'
        }
    ];

    const sequentialSteps = [
        { id: 1, title: 'Editorial Auth', icon: FileCheck, desc: 'Majlis-e-Nazr approval' },
        { id: 2, title: 'Production Clear', icon: Mic, desc: 'Technical execution lock' },
        { id: 3, title: 'Master Confirm', icon: Shield, desc: 'Central studio validation' },
        { id: 4, title: 'Registry Verify', icon: Database, desc: 'Diwan-e-Amanat audit' },
        { id: 5, title: 'Royalty Logic', icon: FileCheck, desc: 'Economic allocation lock' },
        { id: 6, title: 'Metadata Lock', icon: Lock, desc: 'Immutable record entry' },
        { id: 7, title: 'Publication Clear', icon: FileCheck, desc: 'Final release activation' }
    ];

    const nonBypassRequirements = [
        { title: 'Editorial Gate', desc: 'No release occurs without formal theological and thematic approval.' },
        { title: 'Production Gate', desc: 'No release occurs without traversing the structured production workflow.' },
        { title: 'Registry Gate', desc: 'No release occurs without immutable confirmation of all registry data.' },
        { title: 'Economic Gate', desc: 'No release occurs without documented and agreed royalty allocation.' }
    ];

    const irreversibilityPrinciples = [
        { title: 'Locked Credits', desc: 'Attribution data cannot be altered after registry finalization.' },
        { title: 'Immutable Metadata', desc: 'Technical specifications are permanently recorded in the archive.' },
        { title: 'Registry Finality', desc: 'Entry becomes a permanent part of the institutional record.' },
        { title: 'Fixed Allocation', desc: 'Economic distribution structures are set prior to publication.' }
    ];

    const authorityBoundaries = [
        {
            action: 'No Creative Evaluation',
            clarification: 'Thematic and artistic decisions remain strictly with editorial authority'
        },
        {
            action: 'No Studio Execution',
            clarification: 'Production execution is governed strictly by Production Oversight'
        },
        {
            action: 'No Charter Redefinition',
            clarification: 'All authority derives from and remains bound by Mithaq'
        }
    ];

    return (
        <Layout>
            <StudioHero 
                badge="Publication Sequence"
                title="Release Protocol"
                mysticalName={roleDisplayMap.release_protocol.mystical}
                description="The Release Protocol defines the formal sequence required before any work is published under SufiPulse. Publication is a governed institutional act, not a technical upload."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Purpose"
                            subtitle="Safeguarding institutional standards through rigorous pre-publication verification"
                        />

                        <StudioCardGrid cols={4}>
                            {purposePoints.map((item, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={item.icon}
                                    title={item.title}
                                    description={item.description}
                                />
                            ))}
                        </StudioCardGrid>

                        <div className="mt-12 bg-[var(--color-midnight)]/30 border border-[var(--color-gold)]/20 rounded-xl p-8 text-center max-w-3xl mx-auto shadow-2xl">
                            <p className="text-[var(--text-sm)] text-neutral-400 leading-relaxed font-medium">
                                "Release follows authorization; it does not initiate it. No parallel shortcuts or procedural bypasses are permitted."
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioWorkflowRoadmap 
                title="Sequential Requirements"
                badge="Verification Pipeline"
                steps={sequentialSteps}
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12">
                            <div>
                                <StudioSectionHeader 
                                    title="Non-Bypass Principle"
                                    subtitle="Structural gates that prevent unverified publication"
                                />
                                <div className="space-y-4">
                                    {nonBypassRequirements.map((item, i) => (
                                        <div key={i} className="flex items-start gap-4 p-6 elite-card border-none bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-1.5 shrink-0" />
                                            <div>
                                                <p className="text-white font-bold uppercase tracking-widest text-xs mb-1">{item.title}</p>
                                                <p className="text-neutral-500 text-xs leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <StudioSectionHeader 
                                    title="Irreversibility Principle"
                                    subtitle="The finality of authorized publication records"
                                />
                                <div className="space-y-4">
                                    {irreversibilityPrinciples.map((item, i) => (
                                        <div key={i} className="flex items-start gap-4 p-6 elite-card border-none bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50 mt-1.5 shrink-0" />
                                            <div>
                                                <p className="text-white font-bold uppercase tracking-widest text-xs mb-1">{item.title}</p>
                                                <p className="text-neutral-500 text-xs leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Authority Boundaries"
                            subtitle="Defined limitations to ensure cross-layer accountability"
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
                                Protocol governs the formal act of publication.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Institutional Permanence"
                description="Authorized release is a recorded institutional moment, not a technical toggle. Once verified, the release record enters the Diwan-e-Amanat registry as a permanent documentation of sacred art."
                primaryCTA={{ label: "Registry Authority", href: "/governance/diwan-e-amanat" }}
                shieldText="Governed Release Protocol"
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
