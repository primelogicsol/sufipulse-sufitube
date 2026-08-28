
import Link from 'next/link';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Feather, Mic, Music, BookOpen, FileText, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, ExternalLink } from 'lucide-react';

export default function ContributorPolicy() {
    return (
        <>
            <Section className="pt-24 pb-8">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Contributor Policy
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
                            Creative Governance Framework
                        </p>

                        <div className="mt-8 max-w-3xl">
                            <p className="text-neutral-300 leading-relaxed mb-4">
                                This policy defines the structural relationship between SufiPulse and its creative contributors, including Writers (Ahl-e-Qalam), Vocalists (Ahl-e-Sada), Producers (Ahl-e-Naghma), and Literary Contributors (Ahl-e-Tahreer).
                            </p>
                            <p className="text-neutral-300 leading-relaxed">
                                Participation operates within institutional governance and editorial discipline.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Contributor Mandate & Scope
                        </h2>

                        <div className="space-y-4">
                            <p className="text-neutral-300 leading-relaxed">
                                Creative contribution to SufiPulse is a structured process, not an open publication channel.
                            </p>
                            <p className="text-neutral-300 leading-relaxed">
                                All submissions are subject to:
                            </p>
                            <ul className="space-y-2 ml-6">
                                <li className="text-neutral-300 leading-relaxed">Editorial review</li>
                                <li className="text-neutral-300 leading-relaxed">Governance oversight</li>
                                <li className="text-neutral-300 leading-relaxed">Institutional alignment</li>
                                <li className="text-neutral-300 leading-relaxed">Charter compliance</li>
                            </ul>
                            <p className="text-neutral-300 leading-relaxed font-medium">
                                Submission does not guarantee publication.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 bg-neutral-900/30">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-8">
                            Contributor Categories
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
                                        <Feather className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Writers — Ahl-e-Qalam
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Submit original kalam for editorial review and potential production.
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
                                            Vocalists — Ahl-e-Sada
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Perform approved works under structured production oversight.
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
                                            Producers — Ahl-e-Naghma
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Design composition frameworks aligned with approved texts.
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
                                            Literary Contributors — Ahl-e-Tahreer
                                        </h3>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            Publish reflective, analytical, or spiritual writings without musical production.
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
                                    Creative Discipline
                                </h3>
                                <ul className="space-y-2 ml-6">
                                    <li className="text-neutral-300 leading-relaxed">Original work submission required</li>
                                    <li className="text-neutral-300 leading-relaxed">Plagiarism is strictly prohibited</li>
                                    <li className="text-neutral-300 leading-relaxed">Editorial revision may be requested</li>
                                    <li className="text-neutral-300 leading-relaxed">Final publication decision remains institutional</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-white mb-3">
                                    Production Position
                                </h3>
                                <ul className="space-y-2 ml-6">
                                    <li className="text-neutral-300 leading-relaxed">Recording occurs only after formal approval</li>
                                    <li className="text-neutral-300 leading-relaxed">Central studio validation governs final master</li>
                                    <li className="text-neutral-300 leading-relaxed">Distributed network operates under centralized oversight</li>
                                </ul>
                            </div>

                            <div className="bg-neutral-800/60 border border-amber-400/20 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                                    <p className="text-sm text-neutral-300 leading-relaxed">
                                        Creative participation does not grant editorial authority, ownership of institutional identity, or independent release rights under SufiPulse branding.
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
                            Rights & Usage Structure
                        </h2>

                        <div className="space-y-4">
                            <p className="text-neutral-300 leading-relaxed">
                                Unless otherwise formalized in writing:
                            </p>
                            <ul className="space-y-3 ml-6">
                                <li className="text-neutral-300 leading-relaxed">Contributors retain authorship of original work</li>
                                <li className="text-neutral-300 leading-relaxed">SufiPulse receives structured rights for production and distribution</li>
                                <li className="text-neutral-300 leading-relaxed">Royalty agreements apply only to formally approved institutional releases</li>
                                <li className="text-neutral-300 leading-relaxed">Legacy works are governed separately under internal classification</li>
                            </ul>
                            <p className="text-neutral-300 leading-relaxed font-medium">
                                No contributor may independently distribute institutional productions without written authorization.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Conduct & Alignment
                        </h2>

                        <div className="space-y-4">
                            <p className="text-neutral-300 leading-relaxed">
                                Contributors must:
                            </p>
                            <ul className="space-y-2 ml-6">
                                <li className="text-neutral-300 leading-relaxed">Maintain alignment with institutional values</li>
                                <li className="text-neutral-300 leading-relaxed">Avoid public misrepresentation of affiliation</li>
                                <li className="text-neutral-300 leading-relaxed">Respect governance decisions</li>
                                <li className="text-neutral-300 leading-relaxed">Preserve the non-commercial mission</li>
                            </ul>
                            <p className="text-neutral-300 leading-relaxed">
                                Failure to align may result in suspension or termination of contributor status.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 bg-neutral-900/30">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Review & Approval Process
                        </h2>

                        <div className="space-y-4 mb-6">
                            <p className="text-neutral-300 leading-relaxed">
                                The structured path includes:
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-neutral-300 leading-relaxed font-medium">Submission</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-neutral-300 leading-relaxed font-medium">Editorial Council review (Majlis-e-Nazr)</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-neutral-300 leading-relaxed font-medium">Production alignment</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-neutral-300 leading-relaxed font-medium">Studio validation</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-neutral-300 leading-relaxed font-medium">Registry documentation (Diwan-e-Amanat)</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-neutral-300 leading-relaxed font-medium">Institutional release</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-neutral-300 leading-relaxed mt-6">
                            Each stage operates independently under governance oversight.
                        </p>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Structural Boundaries
                        </h2>

                        <ul className="space-y-3 ml-6 mb-6">
                            <li className="text-neutral-300 leading-relaxed">No automatic publication rights</li>
                            <li className="text-neutral-300 leading-relaxed">No implied employment relationship</li>
                            <li className="text-neutral-300 leading-relaxed">No unilateral branding use</li>
                            <li className="text-neutral-300 leading-relaxed">No bypassing governance structure</li>
                        </ul>

                        <div className="mt-6">
                            <Link
                                href="/governance/mithaq"
                                className="text-sm text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-2"
                            >
                                View Constitutional Charter
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </>
    );
}
