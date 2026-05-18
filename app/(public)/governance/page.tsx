"use client";
import { Shield, FileCheck, Building2, ArrowRight, CircleCheck as CheckCircle2, BookOpen, Scale, History, Gavel, Archive, Lock } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioWorkflowRoadmap, StudioGovernancePanel } from '../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function GovernanceOverview() {
    const governanceLayers = [
        {
            id: 'mithaq',
            icon: BookOpen,
            title: 'Mithaq',
            subtitle: 'Constitutional Charter',
            description: 'Foundational document defining institutional purpose, ethical alignment, and long-term continuity.',
            link: '/governance/mithaq'
        },
        {
            id: 'editorial',
            icon: FileCheck,
            title: 'Majlis-e-Nazr',
            subtitle: 'Editorial Council',
            description: 'Content authorization. Governs kalam review, thematic coherence, and approval for production.',
            link: '/governance/majlis-e-nazr'
        },
        {
            id: 'production',
            icon: Building2,
            title: 'Production Oversight',
            subtitle: 'Studio Integration',
            description: 'Technical compliance oversight, validation authority, and structured production sequencing.',
            link: '/governance/production-oversight'
        },
        {
            id: 'registry',
            icon: Shield,
            title: 'Diwan-e-Amanat',
            subtitle: 'Registry Authority',
            description: 'Final institutional lock. Credit confirmation, royalty allocation, and publication authorization.',
            link: '/governance/diwan-e-amanat'
        }
    ];

    const authorityFlow = [
        { id: 1, title: 'Mithaq Foundation', desc: 'Ethical alignment' },
        { id: 2, title: 'Editorial Approval', desc: 'Thematic review' },
        { id: 3, title: 'Production Oversight', desc: 'Technical execution' },
        { id: 4, title: 'Registry Authorization', desc: 'Documented lock' },
        { id: 5, title: 'Public Release', desc: 'Institutional act' }
    ];

    const alignmentRequirements = [
        {
            icon: FileCheck,
            title: 'Respect for Review',
            description: 'The editorial process is absolute and preserved throughout the lifecycle.'
        },
        {
            icon: Scale,
            title: 'Structured Progression',
            description: 'The creative path follows institutional protocols without deviation.'
        },
        {
            icon: History,
            title: 'Identity Verification',
            description: 'All contributors are documented and verified within the registry.'
        },
        {
            icon: Gavel,
            title: 'Institutional Charter',
            description: 'Mission alignment is sustained through continuous oversight.'
        }
    ];

    return (
        <Layout>
            <StudioHero 
                badge="Institutional Framework"
                title="Governance"
                mysticalName="Stewardship & Accountability"
                description="SufiPulse operates through defined authority, documented process, and structured creative progression. Governance is not restriction; it is alignment with sacred tradition and institutional integrity."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="The Four Governing Layers"
                            subtitle="Authority flows sequentially through four institutional layers. Each layer validates the previous and prepares for the next."
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {governanceLayers.map((layer) => (
                                <Link key={layer.id} href={layer.link} className="group h-full">
                                    <StudioLinkCard 
                                        icon={layer.icon}
                                        title={layer.title}
                                        subtitle={layer.subtitle}
                                        description={layer.description}
                                        className="group-hover:border-amber-400/30 group-hover:bg-amber-400/[0.02] transition-all"
                                    />
                                </Link>
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioWorkflowRoadmap 
                title="Authority Sequence"
                badge="Institutional Workflow"
                steps={authorityFlow}
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-8">
                                <StudioSectionHeader 
                                    title="Royalty & Credit Transparency"
                                    subtitle="Royalty participation is defined before release. Contributors review and acknowledge allocation structures. Registry confirmation precedes publication."
                                />
                                <div className="p-8 elite-card bg-white/[0.02] border-none shadow-inner">
                                    <p className="text-neutral-400 text-base leading-relaxed font-light">
                                        Documentation is preserved within the institutional archive. Transparency is procedural, not promotional, ensuring long-term accountability.
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <Link href="/governance/royalty-transparency" className="dashboard-btn-secondary px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-3">
                                        View Transparency Reports <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </div>
                            <div className="elite-card p-10 bg-linear-to-br from-amber-400/5 to-transparent">
                                <h3 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-3">
                                    <Archive className="text-amber-400 w-5 h-5" /> Audit & Continuity
                                </h3>
                                <div className="space-y-6">
                                    <div className="p-6 bg-black/40 border-l-4 border-amber-400 rounded-r-xl">
                                        <p className="text-neutral-300 text-sm leading-relaxed italic font-medium">
                                            "Each release passes through documented status transitions. No release appears within the archive without registry confirmation."
                                        </p>
                                    </div>
                                    <p className="text-neutral-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                                        Institutional memory is maintained deliberately. Continuity ensures that what is created today remains accountable tomorrow.
                                    </p>
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
                            title="Contributor Alignment"
                            subtitle="Participation in SufiPulse implies acceptance of institutional standards and structured progression."
                            centered
                        />

                        <StudioCardGrid cols={4}>
                            {alignmentRequirements.map((item, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={item.icon}
                                    title={item.title}
                                    description={item.description}
                                />
                            ))}
                        </StudioCardGrid>

                        <div className="mt-16 bg-white/[0.02] border border-white/5 p-8 rounded-2xl text-center max-w-3xl mx-auto shadow-2xl">
                            <p className="text-neutral-500 text-xs font-black uppercase tracking-[0.3em]">
                                Alignment is not demanded. It is understood before entry.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Institutional Permanence"
                description="Our governance framework outlasts individuals and technical shifts, ensuring that sacred art remains untainted by ego or commercial drift."
                primaryCTA={{ label: "View Charter", href: "/governance/mithaq" }}
                secondaryCTA={{ label: "Registry Access", href: "/governance/diwan-e-amanat" }}
                shieldText="Governed Institutional Framework"
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

