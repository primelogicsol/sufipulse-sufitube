"use client";
import { useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Globe, BookOpen, Video, Shield, User, Mail, Building2, Briefcase, Link as LinkIcon, FileText, Calendar, Target, CheckCircle, ArrowRight, Loader as Loader2, Sparkles } from 'lucide-react';
import { IconInput } from '../../components/ui/IconInput';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../components/studio/StudioLayoutComponents';

export default function InstitutionalCollaboration() {
    const [formData, setFormData] = useState({
        contact_name: '',
        email: '',
        organization_name: '',
        role_title: '',
        organization_type: '',
        partnership_type: '',
        organization_website: '',
        proposal_description: '',
        proposed_timeline: '',
        resources_offered: '',
        partnership_goals: ''
    });

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const collaborationMandates = [
        {
            icon: Globe,
            title: 'Cultural Exchange',
            description: 'Structured dialogue and responsible transmission of sacred knowledge across regional traditions.'
        },
        {
            icon: BookOpen,
            title: 'Research Integration',
            description: 'Scholarly collaboration and interdisciplinary inquiry between spiritual and academic domains.'
        },
        {
            icon: Video,
            title: 'Media Alignment',
            description: 'Content amplification and platform cooperation under institutional governance and non-commercial principles.'
        },
        {
            icon: Shield,
            title: 'Charter Integrity',
            description: 'All partnerships operate within the Mithaq and preserve editorial and spiritual independence.'
        }
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/partnerships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    proposal_type: formData.partnership_type,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to submit proposal.');
            }

            setSubmitted(true);
            setFormData({
                contact_name: '',
                email: '',
                organization_name: '',
                role_title: '',
                organization_type: '',
                partnership_type: '',
                organization_website: '',
                proposal_description: '',
                proposed_timeline: '',
                resources_offered: '',
                partnership_goals: ''
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit proposal. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const organizationTypes = [
        'Spiritual / Religious Institution',
        'Interfaith Organization',
        'Educational Institution',
        'Research Institute / Think Tank',
        'Cultural Heritage Organization',
        'Media & Publishing Institution',
        'Non-Profit Foundation',
        'Community Network',
        'Government / Public Body',
        'Technology Partner (Ethical / Infrastructure)',
        'Other'
    ];

    const partnershipTypes = [
        'Content Collaboration',
        'Educational Exchange',
        'Interfaith Dialogue & Unity Initiative',
        'Cultural Preservation Initiative',
        'Research Collaboration',
        'Media Amplification Partnership',
        'Distribution Alignment',
        'Technology Integration (Infrastructure Support)',
        'Community Alliance',
        'Grant / Philanthropic Support (Non-Commercial)',
        'Other'
    ];

    return (
        <Layout>
            <StudioHero 
                badge="Institutional Engagement"
                title="Institutional Collaboration"
                mysticalName="Sacred Partnership Proposal"
                description="SufiPulse engages with institutions aligned in spiritual, cultural, educational, interfaith, and research service. All proposals are evaluated within our non-commercial charter."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Collaboration Mandate & Scope"
                            subtitle="Institutional collaboration operates within defined structural boundaries, ensuring alignment with spiritual integrity and custodial stewardship."
                        />

                        <StudioCardGrid cols={4}>
                            {collaborationMandates.map((item, idx) => (
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
                        <div className="grid md:grid-cols-2 gap-12">
                            <div>
                                <StudioSectionHeader 
                                    title="Institutional Discipline"
                                    subtitle="Governing the collaborative process"
                                />
                                <div className="space-y-4">
                                    {[
                                        'Proposals undergo structured internal review',
                                        'Alignment with Mithaq (Charter) is mandatory',
                                        'Governance oversight precedes formalization',
                                        'Non-commercial integrity must be preserved'
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 group">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:shadow-[0_0_10px_rgba(212,175,55,0.6)] transition-all" />
                                            <p className="text-neutral-300 text-sm font-bold uppercase tracking-widest">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <StudioSectionHeader 
                                    title="Collaborative Process"
                                    subtitle="The sequence of engagement"
                                />
                                <div className="elite-card p-6 md:p-10 space-y-4 md:space-y-6">
                                    {[
                                        'Proposal submission',
                                        'Internal review',
                                        'Governance clearance',
                                        'Formalization agreement'
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 md:gap-4 border-b border-white/5 pb-3 md:pb-4 last:border-0 last:pb-0">
                                            <span className="text-amber-400 font-black text-[10px] md:text-xs">0{i+1}</span>
                                            <p className="text-neutral-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 bg-white/[0.02] border border-white/5 rounded-xl p-8 text-center max-w-3xl mx-auto shadow-xl">
                            <p className="text-neutral-500 text-sm leading-relaxed italic">
                                "Institutional collaboration does not alter governance authority or editorial independence."
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-4xl mx-auto text-center mb-10 md:mb-16">
                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6 tracking-tight">Sacred Alignment</h2>
                        <p className="text-neutral-400 text-base md:text-lg leading-relaxed font-light">
                            SufiPulse collaborations are guided by a commitment to serving the sacred without commercialization. We seek partnerships that honor spiritual values, promote unity, and amplify divine voice while preserving institutional integrity.
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto">
                        <div className="elite-card overflow-hidden shadow-2xl">
                            <div className="border-b border-white/5 px-6 md:px-8 py-6 md:py-8 bg-white/[0.02]">
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight">Partnership Proposal</h3>
                                <p className="text-[10px] text-amber-400 font-black uppercase tracking-[0.3em]">Institutional Intake Pathway</p>
                            </div>

                            {submitted ? (
                                <div className="p-8 md:p-16 text-center animate-in fade-in zoom-in duration-700">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                                        <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-emerald-500 stroke-[2.5]" />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4 tracking-tight">Proposal Submitted Successfully</h3>
                                    <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-8 md:mb-10 max-w-md mx-auto">
                                        Thank you for your partnership proposal. Our governance team will review your submission and respond within the institutional review cycle (10–14 business days).
                                    </p>
                                    <button
                                        onClick={() => setSubmitted(false)}
                                        className="px-8 md:px-10 py-4 bg-white/[0.03] hover:bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 hover:text-white transition-all shadow-xl"
                                    >
                                        Submit Another Proposal
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="p-6 md:p-10 lg:p-16 space-y-8 md:space-y-12">
                                    <div className="space-y-6 md:space-y-8">
                                        <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.4em] mb-3 md:mb-4 border-b border-white/5 pb-3 md:pb-4">01 — Contact Identity</p>
                                        <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                                            <IconInput icon={User} label="Your Name">
                                                <input
                                                    type="text"
                                                    name="contact_name"
                                                    value={formData.contact_name}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Enter your full name"
                                                    className="w-full rounded-xl md:rounded-2xl bg-black/40 border border-white/10 pl-10 md:pl-16 pr-4 md:pr-6 py-3.5 md:py-5 text-sm md:text-base text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                                                />
                                            </IconInput>

                                            <IconInput icon={Mail} label="Email Address">
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="your.email@example.com"
                                                    className="w-full rounded-xl md:rounded-2xl bg-black/40 border border-white/10 pl-10 md:pl-16 pr-4 md:pr-6 py-3.5 md:py-5 text-sm md:text-base text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                                                />
                                            </IconInput>

                                            <IconInput icon={Building2} label="Organization Name">
                                                <input
                                                    type="text"
                                                    name="organization_name"
                                                    value={formData.organization_name}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Full institutional name"
                                                    className="w-full rounded-xl md:rounded-2xl bg-black/40 border border-white/10 pl-10 md:pl-16 pr-4 md:pr-6 py-3.5 md:py-5 text-sm md:text-base text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                                                />
                                            </IconInput>

                                            <IconInput icon={Briefcase} label="Your Role / Title">
                                                <input
                                                    type="text"
                                                    name="role_title"
                                                    value={formData.role_title}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Lead, Director, etc."
                                                    className="w-full rounded-xl md:rounded-2xl bg-black/40 border border-white/10 pl-10 md:pl-16 pr-4 md:pr-6 py-3.5 md:py-5 text-sm md:text-base text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                                                />
                                            </IconInput>
                                        </div>
                                    </div>

                                    <div className="space-y-6 md:space-y-8">
                                        <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.4em] mb-3 md:mb-4 border-b border-white/5 pb-3 md:pb-4">02 — Organization Profile</p>
                                        <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                                            <IconInput icon={Target} label="Organization Type" rightIcon>
                                                <select
                                                    name="organization_type"
                                                    value={formData.organization_type}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full appearance-none rounded-xl md:rounded-2xl bg-black/40 border border-white/10 pl-10 md:pl-16 pr-10 md:pr-14 py-3.5 md:py-5 text-sm md:text-base text-white focus:border-amber-400 focus:outline-none transition-all cursor-pointer"
                                                >
                                                    <option value="">Select type</option>
                                                    {organizationTypes.map(type => (
                                                        <option key={type} value={type} className="bg-neutral-900">{type}</option>
                                                    ))}
                                                </select>
                                            </IconInput>

                                            <IconInput icon={Shield} label="Partnership Type" rightIcon>
                                                <select
                                                    name="partnership_type"
                                                    value={formData.partnership_type}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full appearance-none rounded-xl md:rounded-2xl bg-black/40 border border-white/10 pl-10 md:pl-16 pr-10 md:pr-14 py-3.5 md:py-5 text-sm md:text-base text-white focus:border-amber-400 focus:outline-none transition-all cursor-pointer"
                                                >
                                                    <option value="">Select pathway</option>
                                                    {partnershipTypes.map(type => (
                                                        <option key={type} value={type} className="bg-neutral-900">{type}</option>
                                                    ))}
                                                </select>
                                            </IconInput>

                                            <div className="md:col-span-2">
                                                <IconInput icon={LinkIcon} label="Organization Website / Social Media">
                                                    <input
                                                        type="url"
                                                        name="organization_website"
                                                        value={formData.organization_website}
                                                        onChange={handleChange}
                                                        placeholder="https://official-site.org"
                                                        className="w-full rounded-xl md:rounded-2xl bg-black/40 border border-white/10 pl-10 md:pl-16 pr-4 md:pr-6 py-3.5 md:py-5 text-sm md:text-base text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                                                    />
                                                </IconInput>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 md:space-y-8">
                                        <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.4em] mb-3 md:mb-4 border-b border-white/5 pb-3 md:pb-4">03 — Proposal Specifics</p>
                                        <div className="space-y-6 md:space-y-8">
                                            <div className="space-y-2 group">
                                                <label className="text-[9px] md:text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-400">Collaboration Proposal</label>
                                                <textarea
                                                    name="proposal_description"
                                                    value={formData.proposal_description}
                                                    onChange={handleChange}
                                                    placeholder="Describe your partnership vision, goals, and alignment with SufiPulse's institutional mission..."
                                                    required
                                                    rows={5}
                                                    className="w-full h-32 md:h-48 rounded-xl md:rounded-2xl bg-black/40 border border-white/10 px-4 md:px-8 py-4 md:py-6 text-sm md:text-base text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all resize-none"
                                                />
                                            </div>

                                            <IconInput icon={Calendar} label="Proposed Timeline">
                                                <input
                                                    type="text"
                                                    name="proposed_timeline"
                                                    value={formData.proposed_timeline}
                                                    onChange={handleChange}
                                                    placeholder="6 months, ongoing, specific dates, etc."
                                                    className="w-full rounded-xl md:rounded-2xl bg-black/40 border border-white/10 pl-10 md:pl-16 pr-4 md:pr-6 py-3.5 md:py-5 text-sm md:text-base text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                                                />
                                            </IconInput>

                                            <div className="space-y-2 group">
                                                <label className="text-[9px] md:text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-400">Resources & Capacities</label>
                                                <textarea
                                                    name="resources_offered"
                                                    value={formData.resources_offered}
                                                    onChange={handleChange}
                                                    placeholder="Expertise, platform access, institutional network, infrastructure, etc."
                                                    rows={3}
                                                    className="w-full h-24 md:h-32 rounded-xl md:rounded-2xl bg-black/40 border border-white/10 px-4 md:px-8 py-4 md:py-6 text-sm md:text-base text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all resize-none"
                                                />
                                            </div>

                                            <div className="space-y-2 group">
                                                <label className="text-[9px] md:text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-400">Partnership Goals</label>
                                                <textarea
                                                    name="partnership_goals"
                                                    value={formData.partnership_goals}
                                                    onChange={handleChange}
                                                    placeholder="What do you seek to achieve through this collaboration?"
                                                    rows={3}
                                                    className="w-full h-24 md:h-32 rounded-xl md:rounded-2xl bg-black/40 border border-white/10 px-4 md:px-8 py-4 md:py-6 text-sm md:text-base text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 md:p-6 text-red-400 text-[10px] md:text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2">
                                            {error}
                                        </div>
                                    )}

                                    <div className="pt-4 md:pt-6">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full py-5 md:py-8 bg-linear-to-r from-amber-400 to-amber-500 text-neutral-950 font-black rounded-2xl md:rounded-[32px] hover:shadow-[0_0_60px_rgba(212,175,55,0.3)] transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed uppercase text-[11px] md:text-[12px] tracking-[0.3em] md:tracking-[0.5em] flex items-center justify-center gap-4 md:gap-5 group shadow-2xl"
                                        >
                                            {submitting ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-black" /> : <Sparkles size={20} className="md:size-[24px] group-hover:scale-110 transition-transform" />}
                                            {submitting ? 'Authenticating Proposal...' : 'Submit Partnership Proposal'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-4xl mx-auto">
                        <StudioSectionHeader 
                            title="Structural Boundaries"
                            subtitle="Non-negotiable constraints to preserve institutional and editorial integrity"
                            centered
                        />

                        <div className="elite-card p-6 md:p-10 lg:p-12 mb-8 md:mb-12">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 text-left">
                                {[
                                    { t: 'Alignment Required', d: 'Non-commercial spiritual alignment mandatory' },
                                    { t: 'Review Process', d: 'Structured governance review for all proposals' },
                                    { t: 'Independence', d: 'Editorial and spiritual independence preserved' },
                                    { t: 'No Dependency', d: 'No financial or operational dependency structure' },
                                    { t: 'Brand Integrity', d: 'No brand dilution or unauthorized co-branding' },
                                    { t: 'Charter Focus', d: 'Strict adherence to institutional Mithaq provisions' }
                                ].map((item, idx) => (
                                    <div key={idx} className="space-y-1 md:space-y-2">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-amber-400 shrink-0" />
                                            <p className="text-white text-[10px] md:text-xs font-black uppercase tracking-widest">{item.t}</p>
                                        </div>
                                        <p className="text-neutral-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest ml-3 md:ml-4">{item.d}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 p-8 bg-amber-400/5 border border-amber-400/10 rounded-2xl text-center shadow-xl">
                            <p className="text-neutral-500 text-[11px] font-black uppercase tracking-[0.3em] leading-relaxed">
                                Partnership consideration does not imply endorsement. Final approval remains under institutional governance authority.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Institutional Permanence"
                description="SufiPulse collaborations extend our capacity without diluting our mission. We build structures that outlast individual partnerships, anchored in constitutional authority."
                primaryCTA={{ label: "View Governance Charter", href: "/governance/mithaq" }}
                shieldText="Governed Partnership Framework"
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
                @media (max-width: 639px) {
                    .elite-card {
                        border-radius: 20px;
                    }
                }
            `}</style>
        </Layout>
    );
}
