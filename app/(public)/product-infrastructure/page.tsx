"use client";
import { useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Server, Shield, GitBranch, Zap, Globe, Lock, CheckCircle } from 'lucide-react';

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

  const inputClass =
    'w-full bg-neutral-900/60 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors';
  const labelClass = 'block text-sm font-medium text-neutral-300 mb-1.5';

  return (
    <Layout>
      {/* Hero */}
      <Section className="pt-24 pb-8">
        <PageContainer>
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold text-white mb-2">Product Infrastructure</h1>
            <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
              Technical Architecture & Infrastructure Partners
            </p>
            <p className="text-neutral-300 leading-relaxed mt-6">
              SufiPulse is built on a principled technical foundation — file-first, privacy-respecting, and open to ethical infrastructure partners who align with our mission of cultural and spiritual preservation.
            </p>
          </div>
        </PageContainer>
      </Section>

      {/* Platform overview */}
      <Section className="py-12">
        <PageContainer>
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-white mb-8">Platform Architecture</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Server className="w-5 h-5 text-amber-400" />,
                  title: 'File-First Storage',
                  desc: 'Zero-dependency default mode using JSON file storage. Optionally upgrades to PostgreSQL with no code changes.',
                },
                {
                  icon: <Shield className="w-5 h-5 text-amber-400" />,
                  title: 'Security by Default',
                  desc: 'JWT authentication, HTTP-only cookies, rate limiting, input sanitization, and security headers on all responses.',
                },
                {
                  icon: <GitBranch className="w-5 h-5 text-amber-400" />,
                  title: 'Modular Backend',
                  desc: 'Service-layer architecture separating auth, email, payments, YouTube integration, and content management.',
                },
                {
                  icon: <Zap className="w-5 h-5 text-amber-400" />,
                  title: 'Next.js Edge-Ready',
                  desc: 'Next.js 15 App Router with standalone Docker output, Turbopack dev, and Sentry error tracking.',
                },
                {
                  icon: <Globe className="w-5 h-5 text-amber-400" />,
                  title: 'Global CDN Compatible',
                  desc: 'Static asset optimization, image handling, and API caching designed for edge delivery at scale.',
                },
                {
                  icon: <Lock className="w-5 h-5 text-amber-400" />,
                  title: 'Ethical Data Handling',
                  desc: 'No third-party tracking by default. All integrations are explicitly opt-in and configurable via environment variables.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {item.icon}
                    <h3 className="text-white font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </Section>

      {/* Integration partner CTA */}
      <Section className="py-12 bg-neutral-900/20">
        <PageContainer>
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-white mb-4">Infrastructure Partnership</h2>
            <p className="text-neutral-300 mb-8 leading-relaxed">
              If your organization offers infrastructure, tooling, or technical services that align with SufiPulse's mission and ethical standards, we welcome structured proposals. All integrations are reviewed against our non-commercial charter and data sovereignty principles.
            </p>

            {submitted ? (
              <div className="flex items-start gap-4 bg-green-900/20 border border-green-500/30 rounded-lg p-6">
                <CheckCircle className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-green-300 font-semibold text-lg mb-1">Proposal Received</p>
                  <p className="text-green-400/80 text-sm">
                    Your infrastructure proposal has been submitted and will be reviewed by our technical team. We will respond within 5–10 business days.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-900/40 border border-neutral-800 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-white border-b border-neutral-800 pb-4">
                  Infrastructure Proposal Form
                </h3>

                {error && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Contact Name *</label>
                    <input
                      name="contact_name"
                      value={formData.contact_name}
                      onChange={handleChange}
                      required
                      placeholder="Your full name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@organization.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Organization Name *</label>
                    <input
                      name="organization_name"
                      value={formData.organization_name}
                      onChange={handleChange}
                      required
                      placeholder="Your organization"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Role / Title</label>
                    <input
                      name="role_title"
                      value={formData.role_title}
                      onChange={handleChange}
                      placeholder="CTO, Infrastructure Lead, etc."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Proposal Type *</label>
                    <select
                      name="proposal_type"
                      value={formData.proposal_type}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">Select proposal type</option>
                      {PROPOSAL_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Organization Website</label>
                    <input
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Technical Description *</label>
                  <textarea
                    name="technical_description"
                    value={formData.technical_description}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="Describe your infrastructure offering, capabilities, and how it could benefit SufiPulse..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Integration Scope</label>
                  <textarea
                    name="integration_scope"
                    value={formData.integration_scope}
                    onChange={handleChange}
                    rows={3}
                    placeholder="What specific systems or services would this touch? How deeply would it integrate?"
                    className={inputClass}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Compliance & Privacy Notes</label>
                    <textarea
                      name="compliance_notes"
                      value={formData.compliance_notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="GDPR, SOC 2, data residency, retention policies..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Proposed Timeline</label>
                    <textarea
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Proposed integration timeline and milestones..."
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Submit Infrastructure Proposal'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </PageContainer>
      </Section>
    </Layout>
  );
}
