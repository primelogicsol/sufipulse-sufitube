"use client";
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { MapPin, Globe, Shield, Settings, Mic, Network, Users, Activity } from 'lucide-react';
import Image from 'next/image';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function OurNetwork() {
    const centralAuthorityPoints = [
        {
            icon: Shield,
            title: 'Technical Hub',
            description: 'The Central Studio operates as the primary technical and validation hub for all regional outputs.'
        },
        {
            icon: Settings,
            title: 'Oversight Authority',
            description: 'Final master confirmation and institutional production oversight remain strictly centralized.'
        },
        {
            icon: Activity,
            title: 'Validation Standard',
            description: 'Distributed recording does not alter or dilute centralized validation and quality standards.'
        }
    ];

    const remoteLocations = [
        {
            title: 'Canada — Ottawa',
            description: 'Regional recording node supporting North American contributors under centralized coordination.',
            tags: ['Vocal Tracking', 'Acoustic Environment', 'Regional Support']
        },
        {
            title: 'UAE — Dubai',
            description: 'Middle Eastern production station aligning regional talent with SufiPulse technical protocols.',
            tags: ['Multilingual Support', 'Session Management', 'Network Node']
        },
        {
            title: 'India — Mumbai',
            description: 'South Asian production hub coordinating localized vocalist sessions and technical handoffs.',
            tags: ['Traditional Capture', 'Regional Coordination', 'Technical Hub']
        }
    ];

    const collaborationNodes = [
        {
            icon: Users,
            title: 'Creative Contributors',
            description: 'Approved writers, vocalists, and producers integrated into the global production queue.'
        },
        {
            icon: Globe,
            title: 'Institutional Partners',
            description: 'Select organizations and research affiliates aligned with the founding mission.'
        },
        {
            icon: Mic,
            title: 'Technical Partners',
            description: 'Collaborators providing specialized recording, archival, or distribution infrastructure.'
        },
        {
            icon: Network,
            title: 'Advisory Council',
            description: 'Scholarly and spiritual guidance providing thematic alignment for global projects.'
        }
    ];

    return (
        <>
            {/* Cinematic Hero Section with /banner22.png */}
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pb-16 md:pb-24 border-b border-[var(--color-border)] hero-bleed">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner22.png"
                        alt="SufiPulse Global Studio & Distribution Network"
                        fill
                        priority
                        quality={95}
                        className="object-cover object-center scale-105 transform motion-safe:animate-fade-in"
                    />
                    {/* Layered brand gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-midnight)]/90 via-[var(--color-midnight)]/75 to-[var(--color-midnight)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[var(--color-midnight)]/70 to-[var(--color-midnight)]" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10" style={{ paddingTop: 'var(--hero-content-top)' }}>
                    <PageContainer>
                        <div className="max-w-5xl mx-auto text-center">
                            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
                                <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
                                <span className="text-[11px] md:text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold">
                                    SufiPulse USA — Global Infrastructure
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Our Global Network<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    {roleDisplayMap.our_network.mystical}
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                SufiPulse operates through a centralized governance framework supported by distributed studio hubs, regional affiliates, and collaborative networks worldwide.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <Link href="/studio">
                                    <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                                        Studio Network
                                    </PrimaryButton>
                                </Link>
                                <Link href="/governance/mithaq">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        Constitutional Mithaq
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Collaboration Nodes Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {collaborationNodes.map((item, idx) => (
                                    <div key={idx} className="text-center p-2">
                                        <item.icon className="w-7 h-7 text-[var(--color-gold)] mx-auto mb-2 opacity-90" />
                                        <div className="text-sm md:text-base font-bold text-[var(--color-text-primary)] mb-1">
                                            {item.title}
                                        </div>
                                        <div className="text-[11px] text-[var(--color-text-tertiary)] leading-snug line-clamp-2">
                                            {item.description}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </PageContainer>
                </div>
            </section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Central Authority"
                            subtitle="United States — Virginia"
                        />

                        <div className="elite-card p-10 md:p-12 mb-12 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Shield size={160} className="text-amber-400" />
                            </div>
                            <div className="relative z-10 grid md:grid-cols-3 gap-8">
                                {centralAuthorityPoints.map((point, idx) => (
                                    <div key={idx} className="space-y-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-400/5 border border-amber-400/10 flex items-center justify-center text-amber-400 group-hover:border-amber-400/30 transition-all">
                                            <point.icon size={24} />
                                        </div>
                                        <h3 className="text-white font-bold text-lg tracking-tight">{point.title}</h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed">{point.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Distributed Studio Network"
                            subtitle="Remote recording nodes ensuring global accessibility without compromising technical fidelity"
                        />

                        <StudioCardGrid cols={3}>
                            {remoteLocations.map((loc, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={MapPin}
                                    title={loc.title}
                                    description={loc.description}
                                    footerTags={loc.tags}
                                />
                            ))}
                        </StudioCardGrid>

                        <div className="mt-12 elite-card p-10 bg-gradient-to-br from-amber-400/5 to-transparent border-none">
                            <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em] mb-6 text-center">Network Protocol</h4>
                            <div className="grid md:grid-cols-3 gap-8">
                                {[
                                    'Operate within defined production protocol',
                                    'Deliver session files under documented standards',
                                    'Remain subject to centralized review'
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                        <p className="text-neutral-300 text-[11px] font-bold uppercase tracking-widest">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Global Collaboration"
                            subtitle="Engaging contributors and institutional affiliates across regional boundaries"
                        />

                        <StudioCardGrid cols={2}>
                            {collaborationNodes.map((node, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={node.icon}
                                    title={node.title}
                                    description={node.description}
                                />
                            ))}
                        </StudioCardGrid>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Structural Principle"
                description="Distributed execution. Centralized governance. Network expansion operates strictly within charter-defined authority to ensure the preservation of sacred art."
                primaryCTA={{ label: "Studio Overview", href: "/studio" }}
                secondaryCTA={{ label: "Constitutional Mithaq", href: "/governance/mithaq" }}
                shieldText="Governed Network Framework"
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
        </>
    );
}
