"use client";
import { useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Mail, MapPin, Globe, Send } from 'lucide-react';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        customSubject: '',
        message: ''
    });

    const subjectOptions = [
        'General Inquiry',
        'Partnership Opportunity',
        'Writer Application',
        'Vocalist Application',
        'Producer Application',
        'Studio Application',
        'Kalam Submission',
        'Technical Support',
        'Royalty Inquiry',
        'Custom'
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalSubject = formData.subject === 'Custom' ? formData.customSubject : formData.subject;
        console.log('Form submitted:', { ...formData, finalSubject });
    };

    return (
        <Layout>
            <Section className="pt-24 pb-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Contact
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-8 border-b border-amber-400/20 pb-4 inline-block">
                            Institutional Communication Channels
                        </p>

                        <div className="max-w-2xl">
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse operates through structured communication protocols aligned with institutional governance and charter authority.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Send Us a Message
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                                            Your Name <span className="text-amber-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter your full name"
                                            className="w-full px-4 py-3 bg-neutral-950/50 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                                            Email Address <span className="text-amber-400">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="your.email@example.com"
                                            className="w-full px-4 py-3 bg-neutral-950/50 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
                                        Subject <span className="text-amber-400">*</span>
                                    </label>
                                    <select
                                        id="subject"
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value, customSubject: '' })}
                                        className="w-full px-4 py-3 bg-neutral-950/50 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400/50 transition-colors appearance-none cursor-pointer [&>option]:bg-neutral-900 [&>option]:text-white [&>option:checked]:bg-amber-400/20"
                                        style={{
                                            colorScheme: 'dark'
                                        }}
                                    >
                                        <option value="" disabled className="text-neutral-400">Select a subject</option>
                                        {subjectOptions.map((option) => (
                                            <option key={option} value={option} className="bg-neutral-900 text-white hover:bg-neutral-800">
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {formData.subject === 'Custom' && (
                                    <div>
                                        <label htmlFor="customSubject" className="block text-sm font-medium text-white mb-2">
                                            Custom Subject <span className="text-amber-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="customSubject"
                                            required
                                            value={formData.customSubject}
                                            onChange={(e) => setFormData({ ...formData, customSubject: e.target.value })}
                                            placeholder="What is your inquiry about?"
                                            className="w-full px-4 py-3 bg-neutral-950/50 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50 transition-colors"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                                        Message <span className="text-amber-400">*</span>
                                    </label>
                                    <textarea
                                        id="message"
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Please share your message, questions, or how we can assist you..."
                                        rows={6}
                                        className="w-full px-4 py-3 bg-neutral-950/50 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50 transition-colors resize-y"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 px-8 py-3 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-lg font-medium transition-colors"
                                    >
                                        <Send size={18} />
                                        Send Message
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Direct Contact
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        <Mail className="text-amber-400/70" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm mb-1">
                                            Primary Contact
                                        </p>
                                        <a
                                            href="mailto:info@sufipulse.com"
                                            className="text-amber-400/90 text-sm hover:text-amber-400 transition-colors"
                                        >
                                            info@sufipulse.com
                                        </a>
                                        <p className="text-neutral-400 text-xs mt-2">
                                            General questions, partnership inquiries, and institutional correspondence
                                        </p>
                                    </div>
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
                            Specialized Communication Channels
                        </h2>
                        <p className="text-amber-400/70 text-sm mb-6">
                            Role-Specific Contact Points
                        </p>

                        <div className="space-y-6">
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                                <p className="text-white font-medium text-sm mb-3">
                                    Editorial & Content Review
                                </p>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        <Mail className="text-amber-400/70" size={18} />
                                    </div>
                                    <div>
                                        <a
                                            href="mailto:editorial@sufipulse.com"
                                            className="text-amber-400/90 text-sm hover:text-amber-400 transition-colors"
                                        >
                                            editorial@sufipulse.com
                                        </a>
                                        <p className="text-neutral-400 text-xs mt-2">
                                            Kalam submissions, thematic inquiries, editorial guidance
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                                <p className="text-white font-medium text-sm mb-3">
                                    Contributor Applications
                                </p>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        <Mail className="text-amber-400/70" size={18} />
                                    </div>
                                    <div>
                                        <a
                                            href="mailto:applications@sufipulse.com"
                                            className="text-amber-400/90 text-sm hover:text-amber-400 transition-colors"
                                        >
                                            applications@sufipulse.com
                                        </a>
                                        <p className="text-neutral-400 text-xs mt-2">
                                            Writer, vocalist, producer, and studio credential applications
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                                <p className="text-white font-medium text-sm mb-3">
                                    Technical & Production Support
                                </p>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        <Mail className="text-amber-400/70" size={18} />
                                    </div>
                                    <div>
                                        <a
                                            href="mailto:production@sufipulse.com"
                                            className="text-amber-400/90 text-sm hover:text-amber-400 transition-colors"
                                        >
                                            production@sufipulse.com
                                        </a>
                                        <p className="text-neutral-400 text-xs mt-2">
                                            Studio coordination, session scheduling, technical specifications
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                                <p className="text-white font-medium text-sm mb-3">
                                    Economic Transparency & Registry
                                </p>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        <Mail className="text-amber-400/70" size={18} />
                                    </div>
                                    <div>
                                        <a
                                            href="mailto:registry@sufipulse.com"
                                            className="text-amber-400/90 text-sm hover:text-amber-400 transition-colors"
                                        >
                                            registry@sufipulse.com
                                        </a>
                                        <p className="text-neutral-400 text-xs mt-2">
                                            Royalty inquiries, economic documentation, payout verification
                                        </p>
                                    </div>
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
                            Institutional Headquarters
                        </h2>
                        <p className="text-amber-400/70 text-sm mb-6">
                            Central Authority Location
                        </p>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="flex items-start gap-4">
                                <div className="mt-1">
                                    <MapPin className="text-amber-400/70" size={20} />
                                </div>
                                <div>
                                    <p className="text-white font-medium text-sm mb-1">
                                        Central Studio & Governance
                                    </p>
                                    <p className="text-neutral-300 text-sm leading-relaxed">
                                        Virginia, United States
                                    </p>
                                    <p className="text-neutral-400 text-xs mt-2">
                                        All institutional governance, final validation, and registry operations centralized at headquarters
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
                            Related Institutional Extensions
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="mt-1">
                                        <Globe className="text-amber-400/70" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm mb-1">
                                            Sufi Science Center
                                        </p>
                                        <p className="text-neutral-400 text-xs">
                                            Interdisciplinary research and cultural preservation
                                        </p>
                                    </div>
                                </div>
                                <div className="pl-9">
                                    <a
                                        href="https://sufisciencecenter.info/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-amber-400/90 text-sm hover:text-amber-400 transition-colors"
                                    >
                                        sufisciencecenter.info
                                    </a>
                                    <p className="text-neutral-400 text-xs mt-1">
                                        For scholarly collaboration and archival inquiries
                                    </p>
                                </div>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="mt-1">
                                        <Globe className="text-amber-400/70" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm mb-1">
                                            Dr. Kumar Foundation USA
                                        </p>
                                        <p className="text-neutral-400 text-xs">
                                            International extension and global outreach
                                        </p>
                                    </div>
                                </div>
                                <div className="pl-9">
                                    <a
                                        href="https://dkf.sufisciencecenter.info/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-amber-400/90 text-sm hover:text-amber-400 transition-colors"
                                    >
                                        dkf.sufisciencecenter.info
                                    </a>
                                    <p className="text-neutral-400 text-xs mt-1">
                                        For foundation programs and fellowship opportunities
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 pb-20">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Communication Protocol
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                <p>
                                    All communication channels operate under institutional governance framework.
                                </p>

                                <p className="font-medium text-white">Standard Response Protocol:</p>
                                <ul className="list-disc list-inside space-y-2 pl-4">
                                    <li>General inquiries: 3-5 business days</li>
                                    <li>Contributor applications: Under review according to application cycle</li>
                                    <li>Editorial submissions: Reviewed per editorial calendar</li>
                                    <li>Technical support: Priority-based response</li>
                                </ul>

                                <div className="pt-4 border-t border-neutral-800 mt-6">
                                    <p className="text-neutral-400 text-xs">
                                        SufiPulse does not engage through social media platforms. All authentic communication occurs through documented email channels listed above or through official institutional websites.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
