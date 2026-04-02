"use client"
import { useState } from 'react';
import { Building2, Radio, FileCheck, UserCheck, Settings, Database, ArrowRight } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
// import { Link } from 'react-router-dom';
import { SessionRequestForm } from '../../components/studio/SessionRequestForm';
import Link from 'next/link';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';

export default function StudioSessions() {
    const [showInPersonForm, setShowInPersonForm] = useState(false);
    const [showRemoteForm, setShowRemoteForm] = useState(false);
    const sessionAccessRequirements = [
        'Approved Writers (Ahl-e-Qalam)',
        'Approved Vocalists (Ahl-e-Sada)',
        'Approved Producers (Ahl-e-Naghma)'
    ];

    const authorizationConditions = [
        'Editorial approval',
        'Production alignment',
        'Governance validation'
    ];

    const inPersonFeatures = [
        'Central master validation',
        'Production supervision',
        'Registry-aligned documentation'
    ];

    const remoteFeatures = [
        'Session protocol guidance',
        'Technical standards compliance',
        'Final master validated at Central Studio (USA – Virginia)'
    ];

    const coordinationSteps = [
        { label: 'Approved Kalam Confirmation', icon: FileCheck },
        { label: 'Vocalist Assignment', icon: UserCheck },
        { label: 'Production Framework Finalized', icon: Settings },
        { label: 'Studio Session Scheduled', icon: Building2 },
        { label: 'Master Validation', icon: Settings },
        { label: 'Registry Documentation', icon: Database }
    ];

    const schedulingPrinciples = [
        'Coordinated, not booked instantly',
        'Aligned with production workflow',
        'Subject to availability and governance review'
    ];

    const structuralBoundaries = [
        {
            restriction: 'No external commercial rentals',
            clarification: 'Studio access is reserved exclusively for institutional productions'
        },
        {
            restriction: 'No independent recording under SufiPulse branding',
            clarification: 'All recordings must follow centralized governance protocols'
        },
        {
            restriction: 'No bypassing editorial review',
            clarification: 'Session authorization requires formal approval pathway'
        },
        {
            restriction: 'No session authorization without formal approval',
            clarification: 'Access follows institutional validation sequence'
        }
    ];

    return (
        <Layout>
            <Section className="pt-24 pb-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Studio Sessions
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-8 border-b border-amber-400/20 pb-4 inline-block">
                            {roleDisplayMap.studio_sessions.mystical}
                        </p>

                        <div className="max-w-2xl">
                            <p className="text-neutral-300 leading-relaxed mb-4">
                                SufiPulse Studio – USA operates under centralized governance. Recording sessions are available exclusively to approved contributors within the institutional framework.
                            </p>
                            <p className="text-neutral-300 leading-relaxed">
                                No public booking.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Session Access Mandate
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm font-medium mb-6">
                                Recording access is limited to:
                            </p>

                            <div className="space-y-3 mb-8">
                                {sessionAccessRequirements.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm">{item}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 text-sm font-medium mb-6">
                                Sessions are authorized only after:
                            </p>

                            <div className="space-y-3 mb-8">
                                {authorizationConditions.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm">{item}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-neutral-950/50 border border-neutral-700 rounded-lg p-6">
                                <p className="text-neutral-300 text-sm leading-relaxed">
                                    Studio access does not operate as an open commercial service.
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
                            Recording Modalities
                        </h2>

                        <div className="bg-neutral-950/30 border border-amber-400/30 rounded-lg p-6 mb-8">
                            <p className="text-amber-400/90 text-sm leading-relaxed">
                                <span className="font-semibold">Approval Required:</span> Session coordination requires a valid approval reference code. This code is issued to approved contributors after credential review. Submit your credentials through the appropriate contributor page to receive your reference code before requesting session access.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-amber-400/10 rounded-lg border border-amber-400/30">
                                        <Building2 className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">
                                        SufiPulse Studio – USA
                                    </h3>
                                </div>

                                <p className="text-sm text-neutral-400 mb-6">
                                    (In-Person)
                                </p>

                                <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                                    Experience recording within the centralized studio under full technical oversight and governance supervision.
                                </p>

                                <div className="space-y-3 mb-8">
                                    {inPersonFeatures.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                            <p className="text-neutral-300 text-sm">{feature}</p>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowInPersonForm(!showInPersonForm)}
                                    className="w-full px-6 py-3 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 hover:border-amber-400/50 text-amber-400 rounded-lg text-sm font-medium transition-all"
                                >
                                    {showInPersonForm ? 'Hide Form' : 'Request Session Coordination'}
                                </button>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-amber-400/10 rounded-lg border border-amber-400/30">
                                        <Radio className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">
                                        Remote Recording Support
                                    </h3>
                                </div>

                                <p className="text-sm text-neutral-400 mb-6">
                                    Network Coordination
                                </p>

                                <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                                    Approved vocalists may record from authorized network locations under centralized coordination.
                                </p>

                                <div className="space-y-3 mb-8">
                                    {remoteFeatures.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                            <p className="text-neutral-300 text-sm">{feature}</p>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowRemoteForm(!showRemoteForm)}
                                    className="w-full px-6 py-3 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 hover:border-amber-400/50 text-amber-400 rounded-lg text-sm font-medium transition-all"
                                >
                                    {showRemoteForm ? 'Hide Form' : 'Initiate Remote Coordination'}
                                </button>
                            </div>
                        </div>

                        {(showInPersonForm || showRemoteForm) && (
                            <div className="mt-8">
                                <SessionRequestForm
                                    sessionType={showInPersonForm ? 'in_person' : 'remote'}
                                />
                            </div>
                        )}
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Session Coordination Process
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-neutral-800/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-neutral-600">
                            <div className="flex items-center gap-4 min-w-max pb-2">
                                {coordinationSteps.map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="flex flex-col items-center gap-3 min-w-[160px]">
                                            <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                                                <step.icon className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <p className="text-neutral-300 text-sm text-center font-medium">
                                                {step.label}
                                            </p>
                                        </div>
                                        {idx < coordinationSteps.length - 1 && (
                                            <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 bg-neutral-950/50 border border-neutral-700 rounded-lg p-6">
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                No step is optional.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Scheduling Discipline
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm font-medium mb-6">
                                Sessions are:
                            </p>

                            <div className="space-y-3">
                                {schedulingPrinciples.map((principle, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm">{principle}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 text-sm leading-relaxed">
                                This prevents it from feeling like a booking system.
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

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="space-y-6 mb-6">
                                {structuralBoundaries.map((boundary, idx) => (
                                    <div key={idx}>
                                        <p className="text-white text-sm font-medium mb-1">
                                            {boundary.restriction}
                                        </p>
                                        <p className="text-neutral-400 text-xs leading-relaxed">
                                            {boundary.clarification}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <Link
                                href="/contributor-policy"
                                className="text-amber-400 text-sm hover:text-amber-300 transition-colors inline-flex items-center gap-2"
                            >
                                View Contributor Policy
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 pb-20">
                <PageContainer>
                    <div className="max-w-4xl">
                        <div className="bg-gradient-to-r from-amber-400/5 to-transparent border-l-2 border-amber-400/50 pl-6 py-6">
                            <p className="text-white font-medium mb-3">Institutional Mandate</p>
                            <p className="text-neutral-300 text-sm leading-relaxed mb-4">
                                Without this framework, studio access appears as a commercial service.
                            </p>
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                With this framework, it operates as institutional production infrastructure under centralized governance.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
