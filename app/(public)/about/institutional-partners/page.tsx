"use client";
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Globe, BookOpen, Shield, Users, GraduationCap, Building2, Zap, Handshake } from 'lucide-react';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';

export default function InstitutionalPartners() {
    const alignmentPrinciples = [
        {
            icon: Shield,
            title: 'Ethical Framework',
            description: 'Partnerships are rooted in a shared commitment to spiritual integrity and devotional preservation.'
        },
        {
            icon: BookOpen,
            title: 'Scholarly Alignment',
            description: 'Collaborations support traditional Islamic scholarship and cultural heritage documentation.'
        },
        {
            icon: Users,
            title: 'Governance Respect',
            description: 'Select institutions must align with and respect SufiPulse\'s documented governance structures.'
        },
        {
            icon: Handshake,
            title: 'Long-term Service',
            description: 'Engagement is focused on sustainable, non-commercial institutional service across generations.'
        }
    ];

    const partnerCategories = [
        {
            icon: GraduationCap,
            title: 'Academic & Research',
            description: 'Institutions supporting interdisciplinary dialogue between spirituality, ethics, and contemporary inquiry.',
            tags: ['Theology', 'Philosophy', 'Research']
        },
        {
            icon: Globe,
            title: 'Cultural & Heritage',
            description: 'Organizations engaged in the preservation and documentation of spiritual, literary, and artistic traditions.',
            tags: ['Archival', 'Tradition', 'Preservation']
        },
        {
            icon: Building2,
            title: 'Technical Infrastructure',
            description: 'Entities providing specialized support in recording technology, digital archives, and distribution.',
            tags: ['Engineering', 'Digital', 'Systems']
        },
        {
            icon: Users,
            title: 'Regional Collaborators',
            description: 'Local institutional bodies assisting in the structured execution of regional production programs.',
            tags: ['Regional', 'Execution', 'Coordination']
        }
    ];

    const engagementNodes = [
        {
            title: 'Joint Initiatives',
            description: 'Collaborative projects focused on sacred music production and thematic cultural exchange.'
        },
        {
            title: 'Research Exchange',
            description: 'Scholarly sharing and interdisciplinary dialogue between spiritual and academic domains.'
        },
        {
            title: 'Content Preservation',
            description: 'Partnered digitization and documentation projects for traditional Sufi Kalam and sacred literature.'
        },
        {
            title: 'Educational Programs',
            description: 'Structured pathways for knowledge transmission and spiritual awakening through curated curriculum.'
        }
    ];

    return (
        <Layout>
            <StudioHero 
                badge="Institutional Engagement"
                title="Institutional Partners"
                mysticalName={roleDisplayMap.institutional_partners.mystical}
                description="SufiPulse engages with select institutions and collaborators whose values align with its charter, governance framework, and cultural mission."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Alignment Over Sponsorship"
                            subtitle="SufiPulse does not operate on commercial sponsorship models. Partnership is structural alignment, not promotional exchange."
                        />

                        <StudioCardGrid cols={4}>
                            {alignmentPrinciples.map((item, idx) => (
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
                            title="Categories of Engagement"
                            subtitle="Documented alignment across spiritual, technical, and scholarly domains"
                        />

                        <StudioCardGrid cols={2}>
                            {partnerCategories.map((item, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={item.icon}
                                    title={item.title}
                                    description={item.description}
                                    footerTags={item.tags}
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
                            title="Partner Engagement Model"
                            subtitle="Structured collaboration pathways within the institutional framework"
                        />

                        <div className="grid md:grid-cols-2 gap-8">
                            {engagementNodes.map((node, idx) => (
                                <div key={idx} className="elite-card p-10 group hover:border-amber-400/30 transition-all shadow-2xl">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        <h3 className="text-white font-bold text-xl tracking-tight">{node.title}</h3>
                                    </div>
                                    <p className="text-neutral-400 text-base leading-relaxed">{node.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Structural Principle"
                description="Partnership within SufiPulse operates under charter-defined governance. Institutional collaboration enhances capacity without altering structural authority or editorial independence."
                primaryCTA={{ label: "View Governance Charter", href: "/governance/mithaq" }}
                secondaryCTA={{ label: "Collaboration Portal", href: "/collaboration" }}
                shieldText="Governed Partnership Framework"
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
