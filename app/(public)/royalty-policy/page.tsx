import Link from 'next/link';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Feather, Mic, Music, Award, TriangleAlert as AlertTriangle, ExternalLink } from 'lucide-react';

export default function RoyaltyPolicy() {
    return (
        <>
            <Section className="pt-24 pb-8">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Royalty Policy
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
                            Compensation & Distribution Framework
                        </p>

                        <div className="mt-8 max-w-3xl">
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse applies structured royalty principles to formally approved institutional releases. Compensation operates within defined governance and documentation procedures.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Royalty Mandate & Scope
                        </h2>

                        <div className="space-y-4">
                            <p className="text-neutral-300 leading-relaxed">
                                Royalty structures apply only to:
                            </p>
                            <ul className="space-y-2 ml-6">
                                <li className="text-neutral-300 leading-relaxed">Approved institutional productions</li>
                                <li className="text-neutral-300 leading-relaxed">Formally documented contributor agreements</li>
                                <li className="text-neutral-300 leading-relaxed">Releases validated through governance process</li>
                            </ul>
                            <p className="text-neutral-300 leading-relaxed">
                                Legacy works and archival content may operate under separate internal classifications.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 bg-neutral-900/30">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-8">
                            Eligible Contributors
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
                                        <Feather className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Writers (Ahl-e-Qalam)
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Eligible when kalam is formally approved and produced.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
                                        <Mic className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Vocalists (Ahl-e-Sada)
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Eligible upon validated institutional release.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
                                        <Music className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Producers (Ahl-e-Naghma)
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Eligible where production contribution is documented.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
                                        <Award className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Special Contributors
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Defined by formal written agreement where applicable.
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
                            Operational Framework
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-3">
                                    Compensation Discipline
                                </h3>
                                <ul className="space-y-2 ml-6">
                                    <li className="text-neutral-300 leading-relaxed">Royalty structures are defined prior to release</li>
                                    <li className="text-neutral-300 leading-relaxed">Distribution percentages are documented</li>
                                    <li className="text-neutral-300 leading-relaxed">Registry records maintained under Diwan-e-Amanat</li>
                                    <li className="text-neutral-300 leading-relaxed">Payment cycles follow structured accounting timelines</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-white mb-3">
                                    Platform Revenue Sources
                                </h3>
                                <p className="text-neutral-300 leading-relaxed mb-3">
                                    Revenue may derive from:
                                </p>
                                <ul className="space-y-2 ml-6">
                                    <li className="text-neutral-300 leading-relaxed">Streaming platforms</li>
                                    <li className="text-neutral-300 leading-relaxed">Digital distribution</li>
                                    <li className="text-neutral-300 leading-relaxed">Licensed institutional use</li>
                                </ul>
                                <p className="text-neutral-300 leading-relaxed mt-3">
                                    All revenue classification remains internally documented.
                                </p>
                            </div>

                            <div className="bg-neutral-800/60 border border-amber-400/20 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                                    <p className="text-sm text-neutral-300 leading-relaxed">
                                        Royalty eligibility arises only after formal approval and institutional release validation.
                                    </p>
                                </div>
                            </div>
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
                            <li className="text-neutral-300 leading-relaxed">No automatic entitlement upon submission</li>
                            <li className="text-neutral-300 leading-relaxed">No retroactive claims without agreement</li>
                            <li className="text-neutral-300 leading-relaxed">No independent monetization under institutional branding</li>
                            <li className="text-neutral-300 leading-relaxed">Governance review precedes compensation activation</li>
                        </ul>

                        <div className="mt-6">
                            <Link
                                href="/contributor-policy"
                                className="text-sm text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-2"
                            >
                                View Contributor Policy
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </>
    );
}
