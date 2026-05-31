"use client";
import { useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Mail, MapPin, Globe, Send, CheckCircle, User, MessageSquare, Info, Shield, HelpCircle, Loader as Loader2, ArrowRight, Tag } from 'lucide-react';
import { useFormSecurity } from '../../hooks/useFormSecurity';
import { contactFormSchema, validateSchema } from '../../lib/validation-schemas';
import { sanitizeObject } from '../../lib/sanitize';
import { IconInput } from '../../components/ui/IconInput';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../components/studio/StudioLayoutComponents';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        category: 'general_inquiry',
        message: ''
    });

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<any>({});
    const { botCheck, setBotCheck, verifySecurity } = useFormSecurity();

    const categoryOptions = [
        { value: 'general_inquiry', label: 'General Inquiry' },
        { value: 'contributor_inquiry', label: 'Contributor Inquiry' },
        { value: 'studio_coordination', label: 'Studio Coordination' },
        { value: 'partnership', label: 'Partnership Opportunity' },
        { value: 'technical_support', label: 'Technical Support' },
        { value: 'governance', label: 'Governance / Charter' },
        { value: 'media_press', label: 'Media / Press' },
        { value: 'institutional_collaboration', label: 'Institutional Collaboration' },
        { value: 'other', label: 'Other' }
    ];

    const specializedChannels = [
        {
            icon: Mail,
            title: 'Editorial & Content',
            description: 'Kalam submissions, thematic inquiries, and linguistic guidance.',
            email: 'editorial@sufipulse.com'
        },
        {
            icon: Mail,
            title: 'Contributor Applications',
            description: 'Writer, vocalist, producer, and studio credential applications.',
            email: 'applications@sufipulse.com'
        },
        {
            icon: Mail,
            title: 'Production Support',
            description: 'Studio coordination, session scheduling, and technical specs.',
            email: 'production@sufipulse.com'
        },
        {
            icon: Mail,
            title: 'Economic & Registry',
            description: 'Royalty inquiries, documentation, and payout verification.',
            email: 'registry@sufipulse.com'
        }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setFieldErrors({});

        if (!verifySecurity()) {
            setSubmitted(true);
            setSubmitting(false);
            return;
        }

        const payloadToValidate = {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            category: formData.category,
            message: formData.message
        };

        const { success, data, errors } = validateSchema(contactFormSchema, payloadToValidate);
        
        if (!success && errors) {
            const formattedErrors: any = {};
            errors.issues.forEach((issue: any) => {
                formattedErrors[issue.path[0]] = issue.message;
            });
            setFieldErrors(formattedErrors);
            setSubmitting(false);
            return;
        }

        try {
            const cleanData = sanitizeObject(data as any, {
                name: 'text',
                email: 'email',
                subject: 'text',
                category: 'text',
                message: 'text'
            });

            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanData),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to transmit inquiry.');
            }
            setSubmitted(true);
            setFormData({ name: '', email: '', subject: '', category: 'general_inquiry', message: '' });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout>
            <StudioHero 
                badge="Communication"
                title="Contact"
                mysticalName="Institutional Communication Channels"
                description="SufiPulse operates through structured communication protocols aligned with institutional governance and charter authority."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-4xl mx-auto text-center mb-10 md:mb-16">
                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6 tracking-tight">Institutional Message Intake</h2>
                        <p className="text-neutral-400 text-base md:text-lg leading-relaxed font-light">
                            All formal correspondence is logged and processed according to the SufiPulse Standard Response Protocol.
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto">
                        <div className="elite-card overflow-hidden shadow-2xl">
                            <div className="border-b border-white/5 px-6 md:px-8 py-6 md:py-8 bg-white/[0.02]">
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight">Inquiry Submission</h3>
                                <p className="text-[10px] text-amber-400 font-black uppercase tracking-[0.3em]">Institutional Service Pipeline</p>
                            </div>

                            {submitted ? (
                                <div className="p-8 md:p-16 text-center animate-in fade-in zoom-in duration-700">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                                        <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-emerald-500 stroke-[2.5]" />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4 tracking-tight">Inquiry Submitted</h3>
                                    <p className="text-amber-400/80 text-[10px] font-black uppercase tracking-[0.3em] mb-4 md:mb-6">Institutional Service Pipeline</p>
                                    <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-8 md:mb-10 max-w-lg mx-auto font-light">
                                        Your inquiry has been received and entered into the institutional response workflow. Relevant teams may review, classify, and coordinate responses based on the nature of the request.
                                    </p>
                                    <button
                                        onClick={() => setSubmitted(false)}
                                        className="px-8 md:px-10 py-4 bg-white/[0.03] hover:bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 hover:text-white transition-all shadow-xl"
                                    >
                                        Send Another Message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="p-6 md:p-10 lg:p-16 space-y-8 md:space-y-12">
                                    <input
                                        type="text"
                                        name="_bot_check"
                                        value={botCheck}
                                        onChange={(e) => setBotCheck(e.target.value)}
                                        style={{ display: 'none' }}
                                        tabIndex={-1}
                                        autoComplete="off"
                                    />

                                    <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                                        <IconInput icon={User} label="Your Name" error={fieldErrors.name}>
                                            <input
                                                type="text"
                                                id="name"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Enter your full name"
                                                className="w-full rounded-xl md:rounded-2xl bg-black/40 border border-white/10 pl-10 md:pl-16 pr-4 md:pr-6 py-3.5 md:py-5 text-sm md:text-base text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                                            />
                                        </IconInput>

                                        <IconInput icon={Mail} label="Email Address" error={fieldErrors.email}>
                                            <input
                                                type="email"
                                                id="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="your.email@example.com"
                                                className="w-full rounded-xl md:rounded-2xl bg-black/40 border border-white/10 pl-10 md:pl-16 pr-4 md:pr-6 py-3.5 md:py-5 text-sm md:text-base text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                                            />
                                        </IconInput>
                                    </div>

                                    <div className="space-y-6 md:space-y-8">
                                        <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                                            <IconInput icon={Tag} label="Inquiry Category" error={fieldErrors.category} rightIcon>
                                                <select
                                                    id="category"
                                                    required
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                    className="w-full appearance-none rounded-xl md:rounded-2xl bg-black/40 border border-white/10 pl-10 md:pl-16 pr-10 md:pr-14 py-3.5 md:py-5 text-sm md:text-base text-white focus:border-amber-400 focus:outline-none transition-all cursor-pointer"
                                                >
                                                    {categoryOptions.map((option) => (
                                                        <option key={option.value} value={option.value} className="bg-neutral-900">{option.label}</option>
                                                    ))}
                                                </select>
                                            </IconInput>

                                            <IconInput icon={Info} label="Subject" error={fieldErrors.subject}>
                                                <input
                                                    type="text"
                                                    id="subject"
                                                    required
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                    placeholder="Brief description"
                                                    className="w-full rounded-xl md:rounded-2xl bg-black/40 border border-white/10 pl-10 md:pl-16 pr-4 md:pr-6 py-3.5 md:py-5 text-sm md:text-base text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                                                />
                                            </IconInput>
                                        </div>

                                        <div className="space-y-2 group">
                                            <label htmlFor="message" className="text-[9px] md:text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-400">
                                                Detailed Message <span className="text-amber-400">*</span>
                                            </label>
                                            <textarea
                                                id="message"
                                                required
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                placeholder="Please share your message, questions, or how we can assist you..."
                                                rows={5}
                                                className={`w-full h-32 md:h-48 rounded-xl md:rounded-2xl bg-black/40 border border-white/10 px-4 md:px-8 py-4 md:py-6 text-sm md:text-base text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all resize-none ${fieldErrors.message ? 'border-red-500' : ''}`}
                                            />
                                            {fieldErrors.message && <p className="text-red-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1 ml-1">{fieldErrors.message}</p>}
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
                                            {submitting ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-black" /> : <Send size={20} className="md:size-[24px] group-hover:scale-110 transition-transform" />}
                                            {submitting ? 'Transmitting Message...' : 'Send Message'}
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
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Direct Correspondence"
                            subtitle="Primary contact points for general and institutional inquiries"
                        />

                        <div className="elite-card p-6 md:p-10 lg:p-12 mb-8 md:mb-12 shadow-2xl relative overflow-hidden group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
                                <div className="flex items-start gap-4 md:gap-6">
                                    <div className="p-3 md:p-4 bg-amber-400/5 rounded-xl md:rounded-2xl border border-amber-400/10 group-hover:border-amber-400/30 transition-all">
                                        <Mail className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-xl md:text-2xl tracking-tight mb-1 md:mb-2">info@sufipulse.com</p>
                                        <p className="text-neutral-400 text-sm md:text-base leading-relaxed font-light">General questions, partnership inquiries, and institutional correspondence.</p>
                                    </div>
                                </div>
                                <a 
                                    href="mailto:info@sufipulse.com"
                                    className="px-8 md:px-10 py-4 md:py-5 bg-white/[0.03] hover:bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 hover:text-white transition-all shadow-xl w-full md:w-auto text-center"
                                >
                                    Initiate Email
                                </a>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Specialized Communication Channels"
                            subtitle="Dedicated contact points for specific institutional roles and technical needs"
                        />

                        <StudioCardGrid cols={2}>
                            {specializedChannels.map((channel, idx) => (
                                <div key={idx} className="elite-card p-6 md:p-10 flex flex-col h-full group hover:border-amber-400/30 transition-all shadow-2xl">
                                    <div className="flex-1 space-y-4 md:space-y-6">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="p-2 md:p-3 bg-white/[0.03] rounded-xl border border-white/10 group-hover:border-amber-400/20 transition-colors">
                                                <channel.icon className="w-5 h-5 md:w-6 md:h-6 text-neutral-400 group-hover:text-amber-400" />
                                            </div>
                                            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">{channel.title}</h3>
                                        </div>
                                        <p className="text-neutral-400 text-xs md:text-sm leading-relaxed">{channel.description}</p>
                                    </div>
                                    <div className="pt-4 md:pt-6 border-t border-white/5 flex items-center justify-between">
                                        <a href={`mailto:${channel.email}`} className="text-amber-400 font-bold text-xs md:text-sm hover:underline truncate mr-2">{channel.email}</a>
                                        <ArrowRight size={12} className="md:size-[14px] text-neutral-700 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
                                    </div>
                                </div>
                            ))}
                        </StudioCardGrid>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6 md:gap-12">
                        <div>
                            <StudioSectionHeader 
                                title="Institutional Headquarters"
                                subtitle="SufiPulse Central Authority Location"
                            />
                            <div className="elite-card p-6 md:p-10 flex items-start gap-4 md:gap-6">
                                <div className="p-3 md:p-4 bg-amber-400/5 rounded-xl md:rounded-2xl border border-amber-400/10">
                                    <MapPin className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-lg md:text-xl mb-1 md:mb-2">Central Studio & Governance</p>
                                    <p className="text-amber-400 font-black uppercase tracking-widest text-[10px] md:text-xs mb-3 md:mb-4">Virginia, United States</p>
                                    <p className="text-neutral-400 text-xs md:text-sm leading-relaxed">
                                        All institutional governance, final validation, and registry operations centralized at headquarters.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <StudioSectionHeader 
                                title="Communication Protocol"
                                subtitle="Standard Response Protocol timeframe and adherence"
                            />
                            <div className="elite-card p-6 md:p-10 space-y-4 md:space-y-6">
                                {[
                                    { l: 'General Inquiries', v: '3–5 Business Days' },
                                    { l: 'Applications', v: 'Per Application Cycle' },
                                    { l: 'Editorial Submissions', v: 'Per Editorial Calendar' },
                                    { l: 'Technical Support', v: 'Priority-Based Response' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-3 md:pb-4 last:border-0 last:pb-0">
                                        <span className="text-neutral-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest">{item.l}</span>
                                        <span className="text-amber-400 font-bold text-[10px] md:text-xs uppercase tracking-wider">{item.v}</span>
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
                            title="Institutional Extensions"
                            subtitle="Related entities for research and global outreach"
                        />

                        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                            <div className="elite-card p-6 md:p-10 group hover:border-amber-400/30 transition-all shadow-2xl">
                                <div className="flex items-start gap-4 md:gap-6 mb-4 md:mb-6">
                                    <div className="p-3 md:p-4 bg-white/[0.03] rounded-xl md:rounded-2xl border border-white/10 group-hover:border-amber-400/20 transition-colors">
                                        <Globe className="w-6 h-6 md:w-8 md:h-8 text-neutral-400 group-hover:text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold text-white tracking-tight mb-1">Sufi Science Center</h3>
                                        <p className="text-neutral-500 text-[10px] md:text-xs font-black uppercase tracking-widest">Research & Preservation</p>
                                    </div>
                                </div>
                                <p className="text-neutral-400 text-xs md:text-sm leading-relaxed mb-6 md:mb-8">For scholarly collaboration, interdisciplinary research, and cultural archive inquiries.</p>
                                <a href="https://sufisciencecenter.info/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-amber-400 font-bold text-xs md:text-sm hover:underline">
                                    sufisciencecenter.info <ArrowRight size={12} className="md:size-[14px]" />
                                </a>
                            </div>

                            <div className="elite-card p-6 md:p-10 group hover:border-amber-400/30 transition-all shadow-2xl">
                                <div className="flex items-start gap-4 md:gap-6 mb-4 md:mb-6">
                                    <div className="p-3 md:p-4 bg-white/[0.03] rounded-xl md:rounded-2xl border border-white/10 group-hover:border-amber-400/20 transition-colors">
                                        <Globe className="w-6 h-6 md:w-8 md:h-8 text-neutral-400 group-hover:text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold text-white tracking-tight mb-1">Dr. Kumar Foundation USA</h3>
                                        <p className="text-neutral-500 text-[10px] md:text-xs font-black uppercase tracking-widest">Global Outreach</p>
                                    </div>
                                </div>
                                <p className="text-neutral-400 text-xs md:text-sm leading-relaxed mb-6 md:mb-8">For foundation programs, fellowship opportunities, and international extension projects.</p>
                                <a href="https://dkf.sufisciencecenter.info/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-amber-400 font-bold text-xs md:text-sm hover:underline">
                                    dkf.sufisciencecenter.info <ArrowRight size={12} className="md:size-[14px]" />
                                </a>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Governed Communication"
                description="SufiPulse does not engage through non-official social media platforms. All authentic communication occurs through documented email channels or official institutional websites."
                primaryCTA={{ label: "View Governance Framework", href: "/governance" }}
                shieldText="Governed Communication Protocol"
                background="midnight"
            />

            <style jsx global>{`
                .elite-input {
                    background: rgba(10, 10, 10, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: 16px 20px;
                    color: white;
                    font-size: 14px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
                }
                .elite-input:focus {
                    border-color: rgba(212, 175, 55, 0.4);
                    background: rgba(15, 15, 15, 1);
                    box-shadow: 0 0 30px rgba(212, 175, 55, 0.05), inset 0 2px 4px rgba(0,0,0,0.2);
                }
                @media (max-width: 639px) {
                    .elite-input {
                        padding: 12px 14px;
                        font-size: 13px;
                        border-radius: 12px;
                    }
                }
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
