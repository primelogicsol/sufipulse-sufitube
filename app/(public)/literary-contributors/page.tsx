// import { Link } from 'react-router-dom';
"use client";
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Pen, BookOpen, Compass, Shield, ArrowRight, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { LiteraryContributorCredentialsForm } from '../../components/literary/LiteraryContributorCredentialsForm';
import { ArticleSubmissionForm } from '../../components/literary/ArticleSubmissionForm';
import Link from 'next/link';

export default function LiteraryContributors() {
    const workflowScrollRef = useRef<HTMLDivElement>(null);
    const [showApplicationForm, setShowApplicationForm] = useState(false);
    const [showSubmissionForm, setShowSubmissionForm] = useState(false);

    useEffect(() => {
        if (window.location.hash === '#apply') {
            setShowApplicationForm(true);
            setTimeout(() => {
                document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, []);

    const scrollWorkflowLeft = () => {
        if (workflowScrollRef.current) {
            workflowScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollWorkflowRight = () => {
        if (workflowScrollRef.current) {
            workflowScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    const mandateFeatures = [
        {
            icon: Pen,
            title: 'Reflective Writing',
            description: 'Spiritual, philosophical, and thematic essays.'
        },
        {
            icon: BookOpen,
            title: 'Analytical Discourse',
            description: 'Structured commentary on Sufi thought and contemporary issues.'
        },
        {
            icon: Compass,
            title: 'Institutional Alignment',
            description: 'Content aligned with charter-defined principles.'
        },
        {
            icon: Shield,
            title: 'Editorial Oversight',
            description: 'All submissions reviewed prior to publication.'
        }
    ];

    return (
        <Layout>
            <Section className="pt-24 pb-8">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Literary Contributors
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-6 border-b border-amber-400/20 pb-4 inline-block">
                            Ahl-e-Tahreer
                        </p>

                        <div className="mt-8 max-w-3xl">
                            <p className="text-neutral-300 leading-relaxed">
                                Ahl-e-Tahreer represents contributors who engage through reflective writing, essays, spiritual commentary, and analytical discourse independent of musical production.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Literary Mandate & Intellectual Contribution
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 leading-relaxed mb-6">
                                Literary Contributors operate within the institutional journal and reflection framework. Their work undergoes editorial review prior to publication.
                            </p>

                            <div className="grid md:grid-cols-2 gap-4">
                                {mandateFeatures.map((item, idx) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={idx} className="flex items-start gap-3">
                                            <Icon className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-white font-medium text-sm mb-1">{item.title}</p>
                                                <p className="text-neutral-400 text-xs leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
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

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-white font-medium mb-3">Structural Discipline</p>
                                    <p className="text-neutral-300 text-sm leading-relaxed mb-2">
                                        Submissions must demonstrate clarity, coherence, and intellectual integrity.
                                    </p>
                                    <p className="text-neutral-300 text-sm leading-relaxed">
                                        Content is subject to editorial review and structured revision where required.
                                    </p>
                                </div>

                                <div>
                                    <p className="text-white font-medium mb-3">Collaborative Position</p>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                            <p className="text-neutral-300 text-sm">Literary Contributors submit</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                            <p className="text-neutral-300 text-sm">Editorial Council reviews</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                            <p className="text-neutral-300 text-sm">Approved works enter publication archive</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                            <p className="text-neutral-300 text-sm">No production workflow involvement</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-4">
                                <p className="text-neutral-300 text-sm leading-relaxed">
                                    Literary publication does not initiate musical production unless separately submitted under Ahl-e-Qalam.
                                </p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Publication Workflow Position
                        </h2>

                        <div className="hidden lg:block">
                            <div
                                ref={workflowScrollRef}
                                className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-2 mb-3"
                            >
                                <div className="min-w-[140px]">
                                    <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-3">
                                        <p className="text-amber-400 text-xs font-semibold">Literary Submission</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-amber-400/30 flex-shrink-0" />
                                <div className="min-w-[140px]">
                                    <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                        <p className="text-neutral-300 text-xs font-medium">Editorial Review</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-amber-400/30 flex-shrink-0" />
                                <div className="min-w-[140px]">
                                    <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                        <p className="text-neutral-300 text-xs font-medium">Revision (if required)</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-amber-400/30 flex-shrink-0" />
                                <div className="min-w-[140px]">
                                    <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                        <p className="text-neutral-300 text-xs font-medium">Publication</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-amber-400/30 flex-shrink-0" />
                                <div className="min-w-[140px]">
                                    <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                        <p className="text-neutral-300 text-xs font-medium">Archival Documentation</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={scrollWorkflowLeft}
                                    className="w-8 h-8 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 transition-colors"
                                    aria-label="Scroll left"
                                >
                                    <ChevronLeft className="w-4 h-4 text-neutral-400" />
                                </button>
                                <button
                                    onClick={scrollWorkflowRight}
                                    className="w-8 h-8 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center hover:bg-neutral-800 transition-colors"
                                    aria-label="Scroll right"
                                >
                                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                                </button>
                            </div>
                        </div>

                        <div className="lg:hidden space-y-2">
                            <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-3">
                                <p className="text-amber-400 text-xs font-semibold">Literary Submission</p>
                            </div>
                            <div className="flex">
                                <ArrowRight className="w-4 h-4 text-amber-400/30 rotate-90" />
                            </div>
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                <p className="text-neutral-300 text-xs font-medium">Editorial Review</p>
                            </div>
                            <div className="flex">
                                <ArrowRight className="w-4 h-4 text-amber-400/30 rotate-90" />
                            </div>
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                <p className="text-neutral-300 text-xs font-medium">Revision (if required)</p>
                            </div>
                            <div className="flex">
                                <ArrowRight className="w-4 h-4 text-amber-400/30 rotate-90" />
                            </div>
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                <p className="text-neutral-300 text-xs font-medium">Publication</p>
                            </div>
                            <div className="flex">
                                <ArrowRight className="w-4 h-4 text-amber-400/30 rotate-90" />
                            </div>
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-3">
                                <p className="text-neutral-300 text-xs font-medium">Archival Documentation</p>
                            </div>
                        </div>

                        <p className="text-neutral-400 text-xs mt-4">
                            Each stage operates under documented institutional coordination.
                        </p>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Contribution & Alignment
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <p className="text-white font-semibold mb-4">Role in Publication</p>

                                <p className="text-neutral-300 text-sm leading-relaxed mb-4">
                                    Literary Contributors engage through written discourse and reflection.
                                </p>

                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Reflective essays</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Spiritual commentary</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Thematic discourse</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Structured intellectual engagement</p>
                                    </div>
                                </div>

                                <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-lg p-3 mt-4">
                                    <p className="text-neutral-400 text-xs leading-relaxed">
                                        Editorial review precedes all publication decisions.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <p className="text-white font-semibold mb-4">Submission for Literary Consideration</p>

                                <p className="text-neutral-300 text-sm leading-relaxed mb-4">
                                    Literary Contributors may request institutional consideration through formal submission.
                                </p>

                                <p className="text-white text-xs font-medium mb-2">Requirements:</p>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Original authorship</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Structured prose</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Clarity of intent</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Alignment with institutional ethos</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                        <p className="text-neutral-300 text-sm">Acceptance of editorial governance</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowApplicationForm(!showApplicationForm)}
                                    className="w-full bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors mb-3"
                                >
                                    {showApplicationForm ? 'Hide Application Form' : 'Apply as Literary Contributor'}
                                </button>

                                <button
                                    onClick={() => setShowSubmissionForm(!showSubmissionForm)}
                                    className="w-full bg-blue-400/10 hover:bg-blue-400/20 border border-blue-400/30 text-blue-400 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    {showSubmissionForm ? 'Hide Submission Form' : 'Submit Article for Review'}
                                </button>
                            </div>
                        </div>

                        {showApplicationForm && (
                            <div id="apply-form" className="mt-8">
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    Literary Contributor Eligibility & Consideration
                                </h3>
                                <p className="text-lg text-amber-400 mb-4">Ahl-e-Tahreer</p>
                                <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                                    Literary Contributors may request consideration for inclusion within the SufiPulse editorial structure.<br />
                                    Submissions are reviewed for intellectual integrity and institutional alignment.
                                </p>
                                <LiteraryContributorCredentialsForm />
                            </div>
                        )}

                        {showSubmissionForm && (
                            <div className="mt-8">
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    Submit Article for Editorial Review
                                </h3>
                                <p className="text-lg text-blue-400 mb-4">Article Submission Portal</p>
                                <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                                    Submit your literary work for editorial review. All articles undergo review by the Editorial Council before publication in the Literary Journal.
                                </p>
                                <ArticleSubmissionForm />
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
                                    <p className="text-neutral-300 text-sm">Editorial review mandatory</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">No automatic publication</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Institutional tone required</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">No bypass of review process</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Non-commercial integrity preserved</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Governance alignment enforced</p>
                                </div>
                            </div>

                            <div className="border border-neutral-800/50 rounded-lg p-4 mb-4">
                                <p className="text-neutral-300 text-sm leading-relaxed">
                                    Literary contribution operates within institutional review and does not imply editorial endorsement without formal clearance.
                                </p>
                            </div>

                            <div className="mt-6">
                                <Link
                                    href="/governance/majlis-e-nazr"
                                    className="inline-flex items-center gap-2 text-neutral-300 hover:text-amber-400 transition-colors text-xs"
                                >
                                    <Shield className="w-3.5 h-3.5" />
                                    View Governance Framework
                                </Link>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
