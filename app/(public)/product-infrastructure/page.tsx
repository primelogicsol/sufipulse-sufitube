"use client";
import { useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Badge } from '../../components/primitives/Badge';
import { PrimaryButton } from '../../components/primitives/PrimaryButton';
import { Server, Shield, GitBranch, Zap, Globe, Lock, CheckCircle, User, Mail, Building2, Briefcase, Link as LinkIcon, FileText, Calendar, Code, ShieldCheck, ArrowRight, Loader as Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { IconInput } from '../../components/ui/IconInput';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../components/studio/StudioLayoutComponents';

const PROPOSAL_TYPES = [
  'Cloud & Hosting Infrastructure',
  'API Integration Partner',
  'CDN & Media Delivery',
  'Security & Compliance',
  'Data & Analytics Pipeline',
  'AI / ML Infrastructure',
  'Open Source Tooling',
  'DevOps & CI/CD Tooling',
  'Other Technical Partnership',
];

const EMPTY_FORM = {
  contact_name: '',
  email: '',
  organization_name: '',
  role_title: '',
  proposal_type: '',
  website: '',
  technical_description: '',
  integration_scope: '',
  compliance_notes: '',
  timeline: '',
};

export default function ProductInfrastructurePage() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const architecturePoints = [
    {
      icon: Server,
      title: 'File-First Storage',
      description: 'Zero-dependency default mode using JSON file storage. Optionally upgrades to PostgreSQL with no code changes.'
    },
    {
      icon: Shield,
      title: 'Security by Default',
      description: 'JWT authentication, HTTP-only cookies, rate limiting, and security headers on all institutional responses.'
    },
    {
      icon: GitBranch,
      title: 'Modular Backend',
      description: 'Service-layer architecture separating auth, email, payments, YouTube integration, and content management.'
    },
    {
      icon: Zap,
      title: 'Next.js Edge-Ready',
      description: 'Next.js 15 App Router with standalone Docker output, Turbopack development, and Sentry error tracking.'
    },
    {
      icon: Globe,
      title: 'Global CDN Compatible',
      description: 'Static asset optimization, image handling, and API caching designed for edge delivery at scale.'
    },
    {
      icon: Lock,
      title: 'Ethical Data Handling',
      description: 'No third-party tracking by default. All integrations are explicitly opt-in and configurable via environment.'
    }
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/infrastructure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Submission failed. Please try again.');
      }
      setSubmitted(true);
      setFormData(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Cinematic Hero Section with /banner26.png */}
      <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
        {/* Cinematic Background Banner */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/banner26.png"
            alt="SufiPulse Product Infrastructure & Technical Architecture"
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
        <div className="relative z-10">
          <PageContainer>
            <div className="max-w-5xl mx-auto text-center">
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
                <span className="text-[11px] md:text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold">
                  SufiPulse USA — Technical Architecture & Systems
                </span>
              </div>

              <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                Product Infrastructure & Systems<br className="hidden md:block" />{" "}
                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                  Nizam-e-Fanni (Technical Architecture)
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                SufiPulse is built on a principled technical foundation — file-first storage, security by default, privacy-respecting analytics, and open to ethical infrastructure partners aligned with our mission.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                <a 
                  href="#infrastructure-form"
                  className="px-8 py-3.5 bg-[var(--color-gold)] hover:bg-[#FDE68A] text-[var(--color-midnight)] font-bold rounded-[var(--radius-sm)] shadow-xl transition-all uppercase tracking-wider text-sm flex items-center gap-2"
                >
                  Submit Infrastructure Proposal
                </a>
                <Link href="/governance/diwan-e-amanat">
                  <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                    Registry Authority
                  </PrimaryButton>
                </Link>
              </div>

              {/* Architecture Pillars Strip */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                {architecturePoints.map((item, idx) => (
                  <div key={idx} className="text-center p-2">
                    <item.icon className="w-6 h-6 text-[var(--color-gold)] mx-auto mb-2 opacity-90" />
                    <div className="text-xs md:text-sm font-bold text-[var(--color-text-primary)] mb-1">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-tertiary)] leading-snug line-clamp-2">
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
                title="Platform Architecture"
                subtitle="Governing technical integrity and data sovereignty through structured engineering"
            />

            <StudioCardGrid cols={3}>
              {architecturePoints.map((item, idx) => (
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

      <div id="infrastructure-form">
        <Section background="midnight" spacing="normal">
          <PageContainer>
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">Infrastructure Partnership</h2>
              <p className="text-neutral-400 text-lg leading-relaxed font-light">
                  If your organization offers infrastructure, tooling, or technical services that align with SufiPulse's mission and ethical standards, we welcome structured proposals.
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="elite-card overflow-hidden shadow-2xl">
                  <div className="border-b border-white/5 px-8 py-8 bg-white/[0.02]">
                      <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Infrastructure Proposal</h3>
                      <p className="text-[10px] text-amber-400 font-black uppercase tracking-[0.3em]">Technical Intake Pathway</p>
                  </div>

                  {submitted ? (
                      <div className="p-16 text-center animate-in fade-in zoom-in duration-700">
                          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                              <CheckCircle className="w-10 h-10 text-emerald-500 stroke-[2.5]" />
                          </div>
                          <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">Proposal Received</h3>
                          <p className="text-neutral-400 text-base leading-relaxed mb-10 max-w-md mx-auto">
                              Your infrastructure proposal has been received. Our technical team will review your submission and respond within the standard audit timeframe (5–10 business days).
                          </p>
                          <button
                              onClick={() => setSubmitted(false)}
                              className="px-10 py-4 bg-white/[0.03] hover:bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 hover:text-white transition-all shadow-xl"
                          >
                              Submit Another Proposal
                          </button>
                      </div>
                  ) : (
                      <form onSubmit={handleSubmit} className="p-10 md:p-16 space-y-12">
                          <div className="space-y-8">
                              <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.4em] mb-4 border-b border-white/5 pb-4">01 — Technical Contact</p>
                              <div className="grid md:grid-cols-2 gap-8">
                                  <IconInput icon={User} label="Contact Name">
                                      <input
                                          name="contact_name"
                                          value={formData.contact_name}
                                          onChange={handleChange}
                                          required
                                          placeholder="Lead Technical Representative"
                                          className="w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-6 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                                      />
                                  </IconInput>

                                  <IconInput icon={Mail} label="Email Address">
                                      <input
                                          type="email"
                                          name="email"
                                          value={formData.email}
                                          onChange={handleChange}
                                          required
                                          placeholder="tech-office@organization.com"
                                          className="w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-6 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                                      />
                                  </IconInput>

                                  <IconInput icon={Building2} label="Organization Name">
                                      <input
                                          name="organization_name"
                                          value={formData.organization_name}
                                          onChange={handleChange}
                                          required
                                          placeholder="Full infrastructure entity name"
                                          className="w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-6 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                                      />
                                  </IconInput>

                                  <IconInput icon={Briefcase} label="Role / Title">
                                      <input
                                          name="role_title"
                                          value={formData.role_title}
                                          onChange={handleChange}
                                          placeholder="CTO, Infrastructure Lead, etc."
                                          className="w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-6 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                                      />
                                  </IconInput>
                              </div>
                          </div>

                          <div className="space-y-8">
                              <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.4em] mb-4 border-b border-white/5 pb-4">02 — Partnership Scope</p>
                              <div className="grid md:grid-cols-2 gap-8">
                                  <IconInput icon={Code} label="Proposal Type" rightIcon>
                                      <select
                                          name="proposal_type"
                                          value={formData.proposal_type}
                                          onChange={handleChange}
                                          required
                                          className="w-full appearance-none rounded-2xl bg-black/40 border border-white/10 pl-16 pr-14 py-5 text-white focus:border-amber-400 focus:outline-none transition-all cursor-pointer"
                                      >
                                          <option value="">Select infrastructure type</option>
                                          {PROPOSAL_TYPES.map((t) => (
                                              <option key={t} value={t}>{t}</option>
                                          ))}
                                      </select>
                                  </IconInput>

                                  <IconInput icon={LinkIcon} label="Organization Website">
                                      <input
                                          name="website"
                                          value={formData.website}
                                          onChange={handleChange}
                                          placeholder="https://dev-docs.site.com"
                                          className="w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-6 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                                      />
                                  </IconInput>
                              </div>
                          </div>

                          <div className="space-y-8">
                              <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.4em] mb-4 border-b border-white/5 pb-4">03 — Technical Specifications</p>
                              <div className="space-y-8">
                                  <div className="space-y-2 group">
                                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-400">Technical Description</label>
                                      <textarea
                                          name="technical_description"
                                          value={formData.technical_description}
                                          onChange={handleChange}
                                          required
                                          rows={4}
                                          placeholder="Describe your infrastructure offering, capabilities, and how it could benefit SufiPulse..."
                                          className="w-full h-32 rounded-2xl bg-black/40 border border-white/10 px-8 py-6 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all resize-none"
                                      />
                                  </div>

                                  <div className="space-y-2 group">
                                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-400">Integration Scope</label>
                                      <textarea
                                          name="integration_scope"
                                          value={formData.integration_scope}
                                          onChange={handleChange}
                                          rows={3}
                                          placeholder="What specific systems or services would this touch? How deeply would it integrate?"
                                          className="w-full h-32 rounded-2xl bg-black/40 border border-white/10 px-8 py-6 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all resize-none"
                                      />
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-8">
                                      <div className="space-y-2 group">
                                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-400">Compliance & Privacy</label>
                                          <textarea
                                              name="compliance_notes"
                                              value={formData.compliance_notes}
                                              onChange={handleChange}
                                              rows={3}
                                              placeholder="GDPR, SOC 2, data residency, retention policies..."
                                              className="w-full h-32 rounded-2xl bg-black/40 border border-white/10 px-8 py-6 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all resize-none"
                                          />
                                      </div>
                                      <div className="space-y-2 group">
                                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-400">Proposed Timeline</label>
                                          <textarea
                                              name="timeline"
                                              value={formData.timeline}
                                              onChange={handleChange}
                                              rows={3}
                                              placeholder="Proposed integration timeline and milestones..."
                                              className="w-full h-32 rounded-2xl bg-black/40 border border-white/10 px-8 py-6 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all resize-none"
                                          />
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {error && (
                              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-red-400 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2">
                                  {error}
                              </div>
                          )}

                          <div className="pt-6">
                              <button
                                  type="submit"
                                  disabled={submitting}
                                  className="w-full py-8 bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 font-black rounded-[32px] hover:shadow-[0_0_60px_rgba(212,175,55,0.3)] transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed uppercase text-[12px] tracking-[0.5em] flex items-center justify-center gap-5 group shadow-2xl"
                              >
                                  {submitting ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : <ShieldCheck size={24} className="group-hover:scale-110 transition-transform" />}
                                  {submitting ? 'Authenticating Technical Intake...' : 'Submit Infrastructure Proposal'}
                              </button>
                          </div>
                      </form>
                  )}
              </div>
            </div>
          </PageContainer>
        </Section>
      </div>

      <StudioGovernancePanel 
        title="Technical Sovereignty"
        description="Integrations must conform to institutional data sovereignty principles. SufiPulse maintains complete control over its core technical logic and archival records."
        primaryCTA={{ label: "Registry Authority", href: "/governance/diwan-e-amanat" }}
        shieldText="Governed Technical Infrastructure"
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
    </>
  );
}
