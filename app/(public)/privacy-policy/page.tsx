import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Shield, Database, Lock, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <Layout>
            <Section className="pt-24 pb-8">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Privacy Policy
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
                            Data Stewardship Framework
                        </p>

                        <div className="mt-8 max-w-3xl">
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse maintains structured oversight of personal information entrusted through its digital platforms. Data collection operates within defined institutional boundaries and governance discipline.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Privacy Mandate & Scope
                        </h2>

                        <div className="space-y-4">
                            <p className="text-neutral-300 leading-relaxed">
                                Personal data is collected only where necessary for communication, contributor management, institutional review, and platform functionality.
                            </p>
                            <p className="text-neutral-300 leading-relaxed font-medium">
                                SufiPulse does not operate as a commercial data enterprise.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 bg-neutral-900/30">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-8">
                            Information Categories
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-amber-400/10">
                                        <FileText className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Contact Information
                                        </h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed">
                                            Name, email, organization, role, and proposal details submitted through forms.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-amber-400/10">
                                        <Database className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Contributor Records
                                        </h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed">
                                            Biographies, portfolio materials, submitted works, and contractual metadata.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-amber-400/10">
                                        <Shield className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Technical Metadata
                                        </h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed">
                                            IP address, browser type, device information, and general usage analytics.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-amber-400/10">
                                        <Lock className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Embedded Platform Data
                                        </h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed">
                                            Interactions with YouTube, Spotify, or other embedded media providers.
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
                        <h2 className="text-3xl font-bold text-white mb-8">
                            Operational Framework
                        </h2>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-4">
                                    Data Discipline
                                </h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Information collected only when voluntarily submitted or technically required
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            No sale, rental, or commercial transfer of personal data
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Limited internal access under institutional oversight
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-white mb-4">
                                    Usage Position
                                </h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Responding to inquiries
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Reviewing contributor submissions
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Evaluating institutional collaboration proposals
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Maintaining archival governance records
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-6 border-2 border-neutral-700 rounded-lg bg-neutral-900/30">
                                <p className="text-neutral-300 leading-relaxed font-medium">
                                    Data collection supports institutional function only. It does not constitute commercial profiling.
                                </p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 bg-neutral-900/30">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Data Retention & Protection
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <p className="text-neutral-300 leading-relaxed mb-4">
                                    SufiPulse retains information only as long as necessary for:
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Contributor administration
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Institutional review
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Legal compliance
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <p className="text-neutral-300 leading-relaxed">
                                Reasonable administrative and technical safeguards are implemented to protect submitted information.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            User Rights
                        </h2>

                        <div className="space-y-6">
                            <p className="text-neutral-300 leading-relaxed">
                                Where applicable under governing law, users may request:
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400 mt-1">•</span>
                                    <span className="text-neutral-300 leading-relaxed">
                                        Access to stored personal information
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400 mt-1">•</span>
                                    <span className="text-neutral-300 leading-relaxed">
                                        Correction of inaccuracies
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400 mt-1">•</span>
                                    <span className="text-neutral-300 leading-relaxed">
                                        Deletion of personal data
                                    </span>
                                </li>
                            </ul>
                            <p className="text-neutral-300 leading-relaxed">
                                Requests may be directed to:{' '}
                                <a href="/contact" className="text-amber-400 hover:underline">
                                    Official Contact
                                </a>
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 bg-neutral-900/30">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Structural Boundaries
                        </h2>

                        <ul className="space-y-3 mb-6">
                            <li className="flex items-start gap-3">
                                <span className="text-amber-400 mt-1">•</span>
                                <span className="text-neutral-300 leading-relaxed">
                                    No behavioral advertising practices
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-amber-400 mt-1">•</span>
                                <span className="text-neutral-300 leading-relaxed">
                                    No third-party data resale
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-amber-400 mt-1">•</span>
                                <span className="text-neutral-300 leading-relaxed">
                                    No automated decision profiling
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-amber-400 mt-1">•</span>
                                <span className="text-neutral-300 leading-relaxed">
                                    No external marketing data exchange
                                </span>
                            </li>
                        </ul>
                        <p className="text-neutral-300 leading-relaxed mb-6">
                            Embedded platforms operate under their own privacy policies.
                        </p>
                        <div>
                            <a
                                href="/cookie-policy"
                                className="text-sm text-amber-400 hover:underline"
                            >
                                View Cookie Policy
                            </a>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
