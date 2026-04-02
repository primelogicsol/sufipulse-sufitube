"use client";
import { useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Globe, BookOpen, Video, Shield } from 'lucide-react';
// import { supabase } from '../../lib/supabase';

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

        // try {
        //   const { error: submitError } = await supabase
        //     .from('institutional_partnership_proposals')
        //     .insert([formData]);

        //   if (submitError) throw submitError;

        //   setSubmitted(true);
        //   setFormData({
        //     contact_name: '',
        //     email: '',
        //     organization_name: '',
        //     role_title: '',
        //     organization_type: '',
        //     partnership_type: '',
        //     organization_website: '',
        //     proposal_description: '',
        //     proposed_timeline: '',
        //     resources_offered: '',
        //     partnership_goals: ''
        //   });
        // } catch (err) {
        //   setError(err instanceof Error ? err.message : 'Failed to submit proposal');
        // } finally {
        //   setSubmitting(false);
        // }
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
            <Section className="pt-24 pb-8">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Institutional Collaboration
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
                            Sacred Partnership Proposal
                        </p>

                        <div className="mt-8 max-w-3xl">
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse engages with institutions aligned in spiritual, cultural, educational, interfaith, and research service. All proposals are evaluated within our non-commercial charter and governance framework.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">

                        <h2 className="text-3xl font-bold text-white mb-6">
                            Collaboration Mandate & Scope
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 leading-relaxed mb-8">
                                Institutional collaboration operates within defined structural boundaries. Partnerships are evaluated for alignment with spiritual integrity, cultural stewardship, and long-term institutional vision.
                            </p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                    <div className="flex items-start gap-3 mb-3">
                                        <Globe className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                        <h3 className="text-white font-semibold">
                                            Global Cultural & Interfaith Exchange
                                        </h3>
                                    </div>
                                    <p className="text-neutral-300 text-sm leading-relaxed">
                                        Structured dialogue, heritage preservation, and responsible transmission of sacred knowledge across regions and traditions.
                                    </p>
                                </div>

                                <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                    <div className="flex items-start gap-3 mb-3">
                                        <BookOpen className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                        <h3 className="text-white font-semibold">
                                            Educational & Research Integration
                                        </h3>
                                    </div>
                                    <p className="text-neutral-300 text-sm leading-relaxed">
                                        Scholarly collaboration, academic dialogue, interdisciplinary inquiry, and structured knowledge initiatives.
                                    </p>
                                </div>

                                <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                    <div className="flex items-start gap-3 mb-3">
                                        <Video className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                        <h3 className="text-white font-semibold">
                                            Media & Distribution Alignment
                                        </h3>
                                    </div>
                                    <p className="text-neutral-300 text-sm leading-relaxed">
                                        Content amplification and platform cooperation under institutional governance and non-commercial principles.
                                    </p>
                                </div>

                                <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                    <div className="flex items-start gap-3 mb-3">
                                        <Shield className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                        <h3 className="text-white font-semibold">
                                            Charter-Based Integrity
                                        </h3>
                                    </div>
                                    <p className="text-neutral-300 text-sm leading-relaxed">
                                        All partnerships operate within the Mithaq (Constitutional Charter) and preserve editorial and spiritual independence.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Operational Framework
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <p className="text-white font-semibold mb-4">Institutional Discipline</p>

                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Proposals undergo structured internal review</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Alignment with Mithaq (Charter) is mandatory</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Governance oversight precedes formalization</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Non-commercial integrity must be preserved</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <p className="text-white font-semibold mb-4">Collaborative Process</p>

                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Proposal submission</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Internal review</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Governance clearance</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Formalization agreement</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Public acknowledgment (if applicable)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                            <p className="text-neutral-300 text-sm leading-relaxed italic">
                                Institutional collaboration does not alter governance authority or editorial independence.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Sacred Alignment
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                SufiPulse collaborations are guided by a commitment to serving the sacred without commercialization. We seek partnerships that honor spiritual values, promote unity, and amplify divine voice while preserving institutional integrity.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Partnership Proposal Submission
                        </h2>

                        {submitted ? (
                            <div className="bg-gradient-to-br from-amber-950/30 to-amber-900/20 border border-amber-800/50 p-8 rounded-lg text-center">
                                <h3 className="text-2xl font-semibold text-amber-400 mb-4">
                                    Proposal Submitted Successfully
                                </h3>
                                <p className="text-neutral-300 mb-6">
                                    Thank you for your partnership proposal. Our governance team will review your submission and respond within 10-14 business days.
                                </p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="text-amber-400 hover:text-amber-300 underline transition-colors"
                                >
                                    Submit Another Proposal
                                </button>
                            </div>
                        ) : (
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    Partnership Proposal Submission
                                </h3>
                                <p className="text-lg text-amber-400 mb-6">Institutional Engagement</p>
                                <p className="text-neutral-300 text-sm leading-relaxed mb-8">
                                    Institutions may submit partnership proposals for consideration within the SufiPulse governance structure.<br />
                                    All submissions are reviewed for alignment with our non-commercial charter and institutional mission.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div>
                                        <h4 className="text-lg font-semibold text-white mb-4">
                                            Contact Information
                                        </h4>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">
                                                    Your Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="contact_name"
                                                    value={formData.contact_name}
                                                    onChange={handleChange}
                                                    placeholder="Enter your full name"
                                                    required
                                                    className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">
                                                    Email Address <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="your.email@example.com"
                                                    required
                                                    className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">
                                                    Organization Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="organization_name"
                                                    value={formData.organization_name}
                                                    onChange={handleChange}
                                                    placeholder="Name of your organization"
                                                    required
                                                    className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">
                                                    Your Role / Title <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="role_title"
                                                    value={formData.role_title}
                                                    onChange={handleChange}
                                                    placeholder="Your position in the organization"
                                                    required
                                                    className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-600"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-semibold text-white mb-4">
                                            Organization Details
                                        </h4>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">
                                                    Organization Type <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="organization_type"
                                                    value={formData.organization_type}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700 transition-colors"
                                                >
                                                    <option value="">Select organization type</option>
                                                    {organizationTypes.map(type => (
                                                        <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">
                                                    Partnership Type <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="partnership_type"
                                                    value={formData.partnership_type}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700 transition-colors"
                                                >
                                                    <option value="">Select partnership type</option>
                                                    {partnershipTypes.map(type => (
                                                        <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">
                                                    Organization Website / Social Media
                                                </label>
                                                <input
                                                    type="url"
                                                    name="organization_website"
                                                    value={formData.organization_website}
                                                    onChange={handleChange}
                                                    placeholder="https://your-organization.com"
                                                    className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-600"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-semibold text-white mb-4">
                                            Proposal Details
                                        </h4>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">
                                                    Collaboration Proposal <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    name="proposal_description"
                                                    value={formData.proposal_description}
                                                    onChange={handleChange}
                                                    placeholder="Describe your partnership vision, goals, and alignment with SufiPulse's institutional mission."
                                                    required
                                                    rows={6}
                                                    className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-600 resize-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">
                                                    Proposed Timeline
                                                </label>
                                                <input
                                                    type="text"
                                                    name="proposed_timeline"
                                                    value={formData.proposed_timeline}
                                                    onChange={handleChange}
                                                    placeholder="Example: 6 months, ongoing collaboration, specific dates."
                                                    className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">
                                                    Resources You Can Provide
                                                </label>
                                                <textarea
                                                    name="resources_offered"
                                                    value={formData.resources_offered}
                                                    onChange={handleChange}
                                                    placeholder="Expertise, research contribution, platform access, institutional network, infrastructure support, etc."
                                                    rows={4}
                                                    className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-600 resize-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wider">
                                                    Partnership Goals
                                                </label>
                                                <textarea
                                                    name="partnership_goals"
                                                    value={formData.partnership_goals}
                                                    onChange={handleChange}
                                                    placeholder="What do you seek to achieve through this collaboration?"
                                                    rows={4}
                                                    className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-600 resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-950/30 border border-red-800/50 text-red-400 px-4 py-3 rounded">
                                            {error}
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-semibold py-3 px-8 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submitting ? 'Submitting...' : 'Submit Partnership Proposal'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 pb-20">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Structural Boundaries
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Non-commercial alignment required</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Governance review mandatory</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Editorial independence preserved</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">No financial dependency structure</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">No brand dilution</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Charter compliance enforced</p>
                                </div>
                            </div>

                            <div className="border border-neutral-800/50 rounded-lg p-4 mb-4">
                                <p className="text-neutral-300 text-sm leading-relaxed">
                                    Partnership consideration does not imply endorsement. Final approval remains under institutional governance.
                                </p>
                            </div>

                            <div className="mt-6">
                                <a
                                    href="/governance/mithaq"
                                    className="inline-flex items-center gap-2 text-neutral-300 hover:text-amber-400 transition-colors text-xs"
                                >
                                    <Shield className="w-3.5 h-3.5" />
                                    View Constitutional Charter
                                </a>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
