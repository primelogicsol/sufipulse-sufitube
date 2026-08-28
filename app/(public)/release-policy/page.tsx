import Link from 'next/link';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { FileText, Archive, BookOpen, Star, TriangleAlert as AlertTriangle, ExternalLink, ArrowRight } from 'lucide-react';

export default function ReleasePolicy() {
    return (
        <>
            <Section className="pt-24 pb-8">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Release Policy
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
                            Publication & Classification Framework
                        </p>

                        <div className="mt-8 max-w-3xl">
                            <p className="text-neutral-300 leading-relaxed">
                                All public releases under SufiPulse operate within defined governance, production validation, and registry documentation procedures.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Release Mandate & Scope
                        </h2>

                        <div className="space-y-4">
                            <p className="text-neutral-300 leading-relaxed">
                                Publication occurs only after structured review, validation, and documentation.
                            </p>
                            <p className="text-neutral-300 leading-relaxed font-medium">
                                Not all submissions progress to release.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 bg-neutral-900/30">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-8">
                            Release Categories
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Formal Institutional Releases
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Approved, documented, and validated productions.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
                                        <Archive className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Archival Publications
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Previously produced or legacy materials preserved for reference.
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
                                            Research & Commentary
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Educational or analytical content not classified as musical release.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
                                        <Star className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Special Editions
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Designated publications under defined institutional context.
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
                                <h3 className="text-xl font-semibold text-white mb-4">
                                    Structured Path
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center">
                                            <ArrowRight className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <p className="text-neutral-300">Submission</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center">
                                            <ArrowRight className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <p className="text-neutral-300">Editorial Review (Majlis-e-Nazr)</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center">
                                            <ArrowRight className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <p className="text-neutral-300">Production Oversight</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center">
                                            <ArrowRight className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <p className="text-neutral-300">Studio Validation</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center">
                                            <ArrowRight className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <p className="text-neutral-300">Registry Documentation (Diwan-e-Amanat)</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center">
                                            <ArrowRight className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <p className="text-neutral-300 font-medium">Public Release</p>
                                    </div>
                                </div>
                                <p className="text-neutral-300 leading-relaxed mt-4">
                                    Each stage is independent and mandatory.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-white mb-3">
                                    Classification Discipline
                                </h3>
                                <p className="text-neutral-300 leading-relaxed mb-3">
                                    Release classification is determined internally based on:
                                </p>
                                <ul className="space-y-2 ml-6">
                                    <li className="text-neutral-300 leading-relaxed">Production pathway</li>
                                    <li className="text-neutral-300 leading-relaxed">Governance validation</li>
                                    <li className="text-neutral-300 leading-relaxed">Documentation completeness</li>
                                    <li className="text-neutral-300 leading-relaxed">Institutional alignment</li>
                                </ul>
                            </div>

                            <div className="bg-neutral-800/60 border border-amber-400/20 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                                    <p className="text-sm text-neutral-300 leading-relaxed">
                                        Public visibility does not disclose internal classification mechanics.
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
                            <li className="text-neutral-300 leading-relaxed">No bypassing governance process</li>
                            <li className="text-neutral-300 leading-relaxed">No independent release under institutional name</li>
                            <li className="text-neutral-300 leading-relaxed">No publication without registry documentation</li>
                            <li className="text-neutral-300 leading-relaxed">No alteration of validated master files</li>
                        </ul>

                        <div className="mt-6">
                            <Link
                                href="/royalty-policy"
                                className="text-sm text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-2"
                            >
                                View Royalty Policy
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </>
    );
}
