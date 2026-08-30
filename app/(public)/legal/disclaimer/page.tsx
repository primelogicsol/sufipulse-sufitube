// import Link from 'react-router-dom';
import Link from 'next/link';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Shield, BookOpen, Palette, MessageSquare, ExternalLink, Server, TriangleAlert as AlertTriangle, FileText } from 'lucide-react';

export default function Disclaimer() {
    return (
        <>
            <Section className="pt-24 pb-8">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Disclaimer
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
                            Institutional Responsibility Boundaries
                        </p>

                        <div className="mt-8 max-w-3xl">
                            <p className="text-neutral-300 leading-relaxed">
                                Content published by SufiPulse is intended for spiritual, cultural, educational, and artistic engagement. This Disclaimer clarifies the scope and limits of institutional responsibility.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Content Scope & Intent
                        </h2>

                        <div className="space-y-4">
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse publishes creative works, commentary, and research-based reflections within a defined governance framework.
                            </p>
                            <p className="text-neutral-300 leading-relaxed">
                                Published materials are not intended to replace professional, legal, medical, financial, or psychological advice.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 bg-neutral-900/30">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-8">
                            Interpretative Nature
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Spiritual Interpretation
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Mystical commentary reflects interpretative traditions and personal insight.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Educational Context
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Research materials are for academic and intellectual engagement.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
                                        <Palette className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Artistic Expression
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Creative works may include metaphor, symbolism, and poetic narrative.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Contributor Perspective
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Views expressed by contributors do not automatically represent institutional endorsement unless formally designated.
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
                            External Platforms & Links
                        </h2>
                        <div className="space-y-4 mb-6">
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse may reference or embed content from external platforms.
                            </p>
                            <p className="text-neutral-300 leading-relaxed">
                                The institution does not control:
                            </p>
                            <ul className="space-y-2 ml-6">
                                <li className="text-neutral-300 leading-relaxed">Third-party website policies</li>
                                <li className="text-neutral-300 leading-relaxed">Platform algorithms</li>
                                <li className="text-neutral-300 leading-relaxed">External content modifications</li>
                            </ul>
                            <p className="text-neutral-300 leading-relaxed">
                                Users engage with external services under those platforms' terms.
                            </p>
                        </div>

                        <div className="bg-neutral-800/60 border border-amber-400/20 rounded-lg p-6">
                            <div className="flex items-start gap-4">
                                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                                <p className="text-sm text-neutral-300 leading-relaxed">
                                    External links do not constitute institutional endorsement unless explicitly stated.
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
                            Media & Technical Limitations
                        </h2>
                        <div className="space-y-4">
                            <p className="text-neutral-300 leading-relaxed">
                                While reasonable effort is made to ensure accuracy and stability:
                            </p>
                            <ul className="space-y-2 ml-6">
                                <li className="text-neutral-300 leading-relaxed">Technical interruptions may occur</li>
                                <li className="text-neutral-300 leading-relaxed">Embedded media availability may change</li>
                                <li className="text-neutral-300 leading-relaxed">Data synchronization may be delayed</li>
                            </ul>
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse does not guarantee uninterrupted digital service.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Limitation of Liability
                        </h2>
                        <div className="space-y-4">
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse shall not be held responsible for:
                            </p>
                            <ul className="space-y-3 ml-6">
                                <li className="text-neutral-300 leading-relaxed">Personal interpretation outcomes</li>
                                <li className="text-neutral-300 leading-relaxed">Misuse of published materials</li>
                                <li className="text-neutral-300 leading-relaxed">Unauthorized redistribution by third parties</li>
                                <li className="text-neutral-300 leading-relaxed">Independent actions taken based on content</li>
                            </ul>
                            <p className="text-neutral-300 leading-relaxed">
                                Engagement with the platform remains voluntary and user-directed.
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
                        <ul className="space-y-3 ml-6 mb-6">
                            <li className="text-neutral-300 leading-relaxed">Content is informational, not contractual</li>
                            <li className="text-neutral-300 leading-relaxed">Publication does not create fiduciary relationship</li>
                            <li className="text-neutral-300 leading-relaxed">Institutional silence does not imply agreement</li>
                            <li className="text-neutral-300 leading-relaxed">Rights remain governed by Terms of Service</li>
                        </ul>

                        <div className="mt-6">
                            <Link
                                href="/legal/terms-of-service"
                                className="text-sm text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-2"
                            >
                                View Terms of Service
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Identity &amp; Affiliation Notice
                        </h2>
                        <div className="space-y-4 text-neutral-300 leading-relaxed">
                            <p>
                                &ldquo;SufiPulse&rdquo;, &ldquo;SufiPulse USA&rdquo; and &ldquo;SufiPulse Studio USA&rdquo; refer to the institutional and media identities expressly identified through SufiPulse.com.
                            </p>
                            <p>
                                Use of identical or similar terminology by unrelated third parties does not itself establish affiliation, authorization, sponsorship, endorsement or catalog ownership.
                            </p>
                            <p>
                                For authoritative identity verification, consult the{' '}
                                <Link href="/official-identity" className="text-amber-400 hover:text-amber-300 transition-colors underline underline-offset-2">
                                    Official Identity page
                                </Link>.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </>
    );
}
