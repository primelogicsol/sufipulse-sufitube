import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Users, FileCheck, Handshake, KeyRound } from 'lucide-react';

export default function TermsOfService() {
    return (
        <Layout>
            <Section className="pt-24 pb-8">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Terms of Service
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
                            Platform Usage Framework
                        </p>

                        <div className="mt-8 max-w-3xl space-y-4">
                            <p className="text-neutral-300 leading-relaxed">
                                These Terms govern access to and use of the SufiPulse platform, its digital properties, contributor systems, and institutional publications.
                            </p>
                            <p className="text-neutral-300 leading-relaxed font-medium">
                                Use of this platform constitutes agreement with the structural terms outlined below.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Usage Mandate & Scope
                        </h2>

                        <div className="space-y-4">
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse operates as a structured, governance-based cultural institution. Access to the platform does not confer editorial authority, publication rights, or institutional representation.
                            </p>
                            <p className="text-neutral-300 leading-relaxed font-medium">
                                Platform use must align with institutional standards and legal compliance.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 bg-neutral-900/30">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-8">
                            User Categories
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-amber-400/10">
                                        <Users className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            General Visitors
                                        </h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed">
                                            Access publicly available content and institutional materials.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-amber-400/10">
                                        <FileCheck className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Contributors
                                        </h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed">
                                            Submit creative works under defined review and governance structure.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-amber-400/10">
                                        <Handshake className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Institutional Collaborators
                                        </h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed">
                                            Propose partnerships subject to review and formalization.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-amber-400/10">
                                        <KeyRound className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            Registered Participants
                                        </h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed">
                                            Access approved portals and contributor systems.
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
                                    Platform Discipline
                                </h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Users may not misuse submission systems
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            No unlawful, defamatory, or harmful content may be submitted
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            No attempt to breach technical security systems
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            No impersonation of institutional authority
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-white mb-4">
                                    Content Position
                                </h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Submission does not guarantee publication
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Editorial review precedes public release
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Institutional governance retains final publication authority
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Published content remains subject to structural oversight
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-6 border-2 border-neutral-700 rounded-lg bg-neutral-900/30">
                                <p className="text-neutral-300 leading-relaxed font-medium">
                                    Use of the platform does not create employment, agency, or ownership rights unless formalized through written agreement.
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
                            Intellectual Property
                        </h2>

                        <div className="space-y-6">
                            <p className="text-neutral-300 leading-relaxed">
                                Unless otherwise agreed in writing:
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400 mt-1">•</span>
                                    <span className="text-neutral-300 leading-relaxed">
                                        Contributors retain authorship of original works
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400 mt-1">•</span>
                                    <span className="text-neutral-300 leading-relaxed">
                                        SufiPulse receives structured publication and distribution rights
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400 mt-1">•</span>
                                    <span className="text-neutral-300 leading-relaxed">
                                        Institutional branding, logos, and frameworks remain exclusive property of SufiPulse
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400 mt-1">•</span>
                                    <span className="text-neutral-300 leading-relaxed">
                                        Reproduction of platform content requires written authorization
                                    </span>
                                </li>
                            </ul>
                            <p className="text-neutral-300 leading-relaxed font-medium">
                                Unauthorized use of institutional materials is prohibited.
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

                        <div className="space-y-6">
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse provides content for cultural, educational, and spiritual purposes.
                            </p>
                            <div>
                                <p className="text-neutral-300 leading-relaxed mb-4">
                                    The institution does not guarantee:
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Specific outcomes from engagement
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Uninterrupted digital service
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-amber-400 mt-1">•</span>
                                        <span className="text-neutral-300 leading-relaxed">
                                            Third-party platform performance
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <p className="text-neutral-300 leading-relaxed">
                                Users assume responsibility for their own use of published materials.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 bg-neutral-900/30">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Termination & Restriction
                        </h2>

                        <div className="space-y-6">
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse reserves the right to:
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400 mt-1">•</span>
                                    <span className="text-neutral-300 leading-relaxed">
                                        Restrict access to misuse of platform systems
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400 mt-1">•</span>
                                    <span className="text-neutral-300 leading-relaxed">
                                        Remove submitted content violating standards
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400 mt-1">•</span>
                                    <span className="text-neutral-300 leading-relaxed">
                                        Suspend accounts breaching governance guidelines
                                    </span>
                                </li>
                            </ul>
                            <p className="text-neutral-300 leading-relaxed">
                                Such actions may occur without prior notice when necessary to preserve institutional integrity.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Governing Framework
                        </h2>

                        <div className="space-y-4">
                            <p className="text-neutral-300 leading-relaxed">
                                These Terms are governed by applicable laws of the jurisdiction in which SufiPulse operates.
                            </p>
                            <p className="text-neutral-300 leading-relaxed">
                                Disputes shall be resolved through structured legal channels under applicable law.
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
                                    No commercial exploitation of institutional identity
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-amber-400 mt-1">•</span>
                                <span className="text-neutral-300 leading-relaxed">
                                    No unauthorized distribution of releases
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-amber-400 mt-1">•</span>
                                <span className="text-neutral-300 leading-relaxed">
                                    No use of SufiPulse branding without approval
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-amber-400 mt-1">•</span>
                                <span className="text-neutral-300 leading-relaxed">
                                    No circumvention of governance process
                                </span>
                            </li>
                        </ul>
                        <div>
                            <a
                                href="/mithaq"
                                className="text-sm text-amber-400 hover:underline"
                            >
                                View Contributor Policy
                            </a>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
