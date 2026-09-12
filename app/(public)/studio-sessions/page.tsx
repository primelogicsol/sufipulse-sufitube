"use client";
import { useState } from 'react';
import { Building2, Radio, FileCheck, UserCheck, Settings, Database, ArrowRight, KeyRound, ChevronDown, ChevronUp, ShieldCheck, Shield } from 'lucide-react';
import Image from 'next/image';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Badge } from '../../components/primitives/Badge';
import { PrimaryButton } from '../../components/primitives/PrimaryButton';
import { SessionRequestForm } from '../../components/studio/SessionRequestForm';
import { StudioAccessCodeRequestForm } from '../../components/studio/StudioAccessCodeRequestForm';
import { StudioHero, StudioSectionHeader, StudioWorkflowRoadmap, StudioGovernancePanel, StudioCardGrid, StudioLinkCard } from '../../components/studio/StudioLayoutComponents';
import Link from 'next/link';

export default function StudioSessions() {
    const [activeForm, setActiveForm] = useState<'in_person' | 'remote' | null>(null);
    const [showCodeRequest, setShowCodeRequest] = useState(false);
    
    const sessionAccessRequirements = [
        'Approved Writers (Ahl-e-Qalam)',
        'Approved Vocalists (Ahl-e-Sada)',
        'Approved Producers (Ahl-e-Naghma)'
    ];

    const authorizationConditions = [
        'Editorial approval',
        'Production alignment',
        'Governance validation'
    ];

    const inPersonFeatures = [
        'Central master validation',
        'Production supervision',
        'Registry-aligned documentation'
    ];

    const remoteFeatures = [
        'Session protocol guidance',
        'Technical standards compliance',
        'Final master validated at Central Studio (USA – Virginia)'
    ];

    const coordinationSteps = [
        { id: 1, title: 'Approved Kalam Confirmation', desc: 'Editorial council authorization' },
        { id: 2, title: 'Contributor Assignment', icon: UserCheck, desc: 'Matching voice to sacred text' },
        { id: 3, title: 'Production Framework Finalized', icon: Settings, desc: 'Thematic musical structuring' },
        { id: 4, title: 'Session Authorization Confirmed', icon: ShieldCheck, desc: 'Institutional clearance' },
        { id: 5, title: 'Studio Session Scheduled', icon: Building2, desc: 'Master-grade capture' },
        { id: 6, title: 'Master Validation', icon: Settings, desc: 'Technical quality check' },
        { id: 7, title: 'Registry Documentation', icon: Database, desc: 'Final institutional lock' }
    ];

    const schedulingPrinciples = [
        { restriction: 'Coordinated, not booked instantly', clarification: 'Sessions are coordinated through institutional review and production authorization, not instant public booking.' },
        { restriction: 'Aligned with production workflow', clarification: 'Scheduling follows the finalized production framework and contributor availability.' },
        { restriction: 'Subject to availability and governance review', clarification: 'Registry authorization is mandatory for all network studio sessions.' }
    ];

    const structuralBoundaries = [
        {
            restriction: 'No external commercial rentals',
            clarification: 'Studio access is reserved for institutional productions'
        },
        {
            restriction: 'No independent recording under SufiPulse branding',
            clarification: 'All recordings follow centralized production protocols'
        },
        {
            restriction: 'No bypassing review',
            clarification: 'No bypassing editorial, production, or governance review'
        },
        {
            restriction: 'No unauthorized scheduling',
            clarification: 'No session scheduling without Studio Authorization Reference'
        }
    ];

    return (
        <>
            {/* Cinematic Hero Section with /banner11.png */}
            <section className="relative w-full min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[var(--color-midnight)] pb-16 md:pb-24 border-b border-[var(--color-border)] hero-bleed">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner11.png"
                        alt="SufiPulse Studio Sessions & Live Sacred Master Capture"
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
                <div className="relative z-10 pt-20 md:pt-32">
                    <PageContainer>
                        <div className="max-w-5xl mx-auto text-center">
                            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
                                <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
                                <span className="text-[11px] md:text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold">
                                    SufiPulse USA — Production Governance
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Studio Sessions & Capture<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    Majalis-e-Sabt
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                SufiPulse Studio operates under centralized institutional governance. Recording sessions are coordinated exclusively for approved contributors operating within authorized production frameworks.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <button
                                    onClick={() => setActiveForm(activeForm === 'in_person' ? null : 'in_person')}
                                    className="px-8 py-3.5 bg-[var(--color-gold)] hover:bg-[#FDE68A] text-[var(--color-midnight)] font-bold rounded-[var(--radius-sm)] shadow-xl transition-all uppercase tracking-wider text-sm"
                                >
                                    Request Studio Session
                                </button>
                                <Link href="/contributor-policy">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        Contributor Policy
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Access Requirements Strip */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {sessionAccessRequirements.map((item, idx) => (
                                    <div key={idx} className="text-center p-3">
                                        <ShieldCheck className="w-7 h-7 text-[var(--color-gold)] mx-auto mb-2 opacity-90" />
                                        <div className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
                                            {item}
                                        </div>
                                        <div className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">
                                            Authorized Access Node
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
                            title="Session Access Governance"
                            subtitle="Studio session coordination is available only to approved contributors operating within institutionally authorized production frameworks."
                        />

                        <div className="bg-[var(--color-midnight)]/30 border border-[var(--color-text-tertiary)]/10 rounded-xl p-10">
                            <div className="grid md:grid-cols-2 gap-12">
                                <div>
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-6">Access Requirements</p>
                                    <div className="space-y-4">
                                        {sessionAccessRequirements.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-4">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                <p className="text-neutral-300 text-sm font-bold uppercase tracking-widest">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-6">Authorization Path</p>
                                    <div className="space-y-4">
                                        {authorizationConditions.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-4 group">
                                                <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                                                <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest group-hover:text-neutral-400 transition-colors">{item}</p>
                                            </div>
                                        ))}
                                    </div>
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
                            title="Recording Modalities"
                            subtitle="Select the appropriate coordination path for your authorized production"
                            centered
                        />

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="elite-card p-10 md:p-12 group hover:ring-1 hover:ring-amber-400/20 transition-all flex flex-col h-full">
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="p-4 bg-amber-400/5 rounded-2xl border border-amber-400/10 group-hover:bg-amber-400/10 group-hover:border-amber-400/30 transition-all">
                                        <Building2 className="w-8 h-8 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white tracking-tight">USA Studio</h3>
                                        <p className="text-[10px] text-amber-400 font-black uppercase tracking-[0.2em] mt-1">In-Person Coordination</p>
                                    </div>
                                </div>
                                <p className="text-neutral-400 leading-relaxed mb-8 flex-1">
                                    Experience recording within the centralized studio under full technical oversight and governance supervision.
                                </p>
                                <div className="space-y-3 mb-10">
                                    {inPersonFeatures.map((f, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-1 h-1 rounded-full bg-amber-400" />
                                            <p className="text-[10px] text-neutral-300 font-black uppercase tracking-widest">{f}</p>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setActiveForm(activeForm === 'in_person' ? null : 'in_person')}
                                    className="w-full py-5 bg-amber-400/5 hover:bg-amber-400 text-amber-400 hover:text-black border border-amber-400/20 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all"
                                >
                                    {activeForm === 'in_person' ? 'Cancel Request' : 'Request Studio Session Access'}
                                </button>
                            </div>

                            <div className="elite-card p-10 md:p-12 group hover:ring-1 hover:ring-amber-400/20 transition-all flex flex-col h-full">
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="p-4 bg-amber-400/5 rounded-2xl border border-amber-400/10 group-hover:bg-amber-400/10 group-hover:border-amber-400/30 transition-all">
                                        <Radio className="w-8 h-8 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white tracking-tight">Remote Network</h3>
                                        <p className="text-[10px] text-amber-400 font-black uppercase tracking-[0.2em] mt-1">Distributed Coordination</p>
                                    </div>
                                </div>
                                <p className="text-neutral-400 leading-relaxed mb-8 flex-1">
                                    Approved vocalists may record from authorized network locations under centralized coordination and master validation.
                                </p>
                                <div className="space-y-3 mb-10">
                                    {remoteFeatures.map((f, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-1 h-1 rounded-full bg-amber-400" />
                                            <p className="text-[10px] text-neutral-300 font-black uppercase tracking-widest">{f}</p>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setActiveForm(activeForm === 'remote' ? null : 'remote')}
                                    className="w-full py-5 bg-amber-400/5 hover:bg-amber-400 text-amber-400 hover:text-black border border-amber-400/20 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all"
                                >
                                    {activeForm === 'remote' ? 'Cancel Request' : 'Request Studio Session Access'}
                                </button>
                            </div>
                        </div>

                        <div className="mt-12">
                          <button
                            onClick={() => setShowCodeRequest(!showCodeRequest)}
                            className="w-full flex items-center justify-between px-8 py-6 bg-black/40 border border-white/5 hover:border-amber-400/30 rounded-[24px] transition-all group shadow-xl"
                          >
                            <div className="flex items-center gap-5">
                              <div className="p-3 bg-amber-400/5 rounded-xl border border-amber-400/10 group-hover:border-amber-400/40 transition-colors">
                                <KeyRound className="w-6 h-6 text-amber-400" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-black text-white uppercase tracking-[0.2em]">Request Authorization Reference</p>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1 opacity-60">For approved contributors awaiting coordination</p>
                              </div>
                            </div>
                            {showCodeRequest ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                          {showCodeRequest && (
                            <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-700">
                              <StudioAccessCodeRequestForm />
                            </div>
                          )}
                        </div>

                        {activeForm && (
                            <div className="mt-12 animate-in fade-in slide-in-from-top-6 duration-700">
                                <SessionRequestForm
                                    sessionType={activeForm}
                                    onClose={() => setActiveForm(null)}
                                />
                            </div>
                        )}
                    </div>
                </PageContainer>
            </Section>

            <StudioWorkflowRoadmap 
                title="Session Coordination Process"
                badge="Production Lifecycle"
                steps={coordinationSteps}
                description="Technical compliance and registry adherence is mandatory for all production steps."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Scheduling Discipline</h2>
                                <div className="space-y-10">
                                    {schedulingPrinciples.map((p, i) => (
                                        <div key={i} className="group relative pl-8">
                                            <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                                            <p className="text-white text-xs font-black uppercase tracking-[0.2em] mb-2">{p.restriction}</p>
                                            <p className="text-neutral-500 text-[11px] leading-relaxed font-medium group-hover:text-neutral-400 transition-colors">{p.clarification}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Structural Boundaries</h2>
                                <div className="elite-card p-10 space-y-8">
                                    {structuralBoundaries.map((b, i) => (
                                        <div key={i} className="space-y-2 border-b border-white/5 pb-6 last:border-0 last:pb-0">
                                            <p className="text-white text-xs font-black uppercase tracking-[0.2em]">{b.restriction}</p>
                                            <p className="text-neutral-500 text-[10px] leading-relaxed font-bold uppercase tracking-widest">{b.clarification}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Institutional Mandate"
                description="SufiPulse Studio Sessions operate as centralized institutional production infrastructure for governed recording, technical validation, archival documentation, and contributor coordination under Majalis-e-Sabt."
                primaryCTA={{ label: "Contributor Policy", href: "/contributor-policy" }}
                shieldText="Governed Production Infrastructure"
                background="midnight"
            />

            <style jsx global>{`
                .elite-card {
                    background: rgba(18, 18, 18, 0.4);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    border-radius: 32px;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.02);
                }
            `}</style>
        </>
    );
}
