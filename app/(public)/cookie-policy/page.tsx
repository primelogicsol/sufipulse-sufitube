import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Shield, ChartBar as BarChart3, Youtube, FileSliders as Sliders } from 'lucide-react';

export default function CookiePolicy() {
    return (
        <Layout>
            <Section className="pt-24 pb-8">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Cookie Policy
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
                            Digital Usage Transparency
                        </p>

                        <div className="mt-8 max-w-3xl space-y-4">
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse utilizes limited technical tracking mechanisms to ensure platform functionality, security, and user experience continuity.
                            </p>
                            <p className="text-neutral-300 leading-relaxed font-medium">
                                This policy explains how cookies and related technologies operate within the institutional framework.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Cookie Mandate & Scope
                        </h2>

                        <div className="space-y-4">
                            <p className="text-neutral-300 leading-relaxed">
                                Cookies are small data files stored on your device to enable certain technical functions.
                            </p>
                            <p className="text-neutral-300 leading-relaxed font-medium">
                                SufiPulse does not operate behavioral advertising systems or commercial tracking networks.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 bg-neutral-900/30">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-8">
                            Types of Cookies Used
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-amber-400/10">
                                        <Shield className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Essential Cookies
                                        </h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed">
                                            Required for basic website functionality, navigation, and security.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-amber-400/10">
                                        <BarChart3 className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Performance Cookies
                                        </h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed">
                                            Aggregate analytics to understand site traffic and improve usability.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-amber-400/10">
                                        <Youtube className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Embedded Media Cookies
                                        </h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed">
                                            Generated by platforms such as YouTube or Spotify when media is embedded.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-amber-400/10">
                                        <Sliders className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Preference Cookies
                                        </h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed">
                                            Store language or interface settings where applicable.
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
                                    Technical Discipline
                                </h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Cookies are used only for platform stability
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            No resale of cookie-based data
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            No third-party marketing profiling through SufiPulse
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-white mb-4">
                                    Embedded Platforms
                                </h3>
                                <div className="space-y-3">
                                    <p className="text-neutral-300 leading-relaxed">
                                        Media embedded from external services may set their own cookies.
                                    </p>
                                    <p className="text-neutral-300 leading-relaxed">
                                        These platforms operate under their respective privacy policies.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 border-2 border-neutral-700 rounded-lg bg-neutral-900/30">
                                <p className="text-neutral-300 leading-relaxed font-medium">
                                    SufiPulse does not control third-party cookie policies associated with embedded content.
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
                            Managing Cookies
                        </h2>

                        <div className="space-y-6">
                            <p className="text-neutral-300 leading-relaxed">
                                Users may:
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400 mt-1">•</span>
                                    <span className="text-neutral-300 leading-relaxed">
                                        Adjust browser settings to block or delete cookies
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400 mt-1">•</span>
                                    <span className="text-neutral-300 leading-relaxed">
                                        Disable third-party tracking in browser preferences
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400 mt-1">•</span>
                                    <span className="text-neutral-300 leading-relaxed">
                                        Review platform-specific privacy settings for embedded services
                                    </span>
                                </li>
                            </ul>
                            <p className="text-neutral-300 leading-relaxed">
                                Disabling essential cookies may impact platform functionality.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Structural Boundaries
                        </h2>

                        <ul className="space-y-3 mb-6">
                            <li className="flex items-start gap-3">
                                <span className="text-amber-400 mt-1">•</span>
                                <span className="text-neutral-300 leading-relaxed">
                                    No behavioral advertising networks
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-amber-400 mt-1">•</span>
                                <span className="text-neutral-300 leading-relaxed">
                                    No commercial retargeting systems
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-amber-400 mt-1">•</span>
                                <span className="text-neutral-300 leading-relaxed">
                                    No data brokerage activity
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-amber-400 mt-1">•</span>
                                <span className="text-neutral-300 leading-relaxed">
                                    No hidden tracking mechanisms
                                </span>
                            </li>
                        </ul>
                        <div>
                            <a
                                href="/privacy-policy"
                                className="text-sm text-amber-400 hover:underline"
                            >
                                View Privacy Policy
                            </a>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
