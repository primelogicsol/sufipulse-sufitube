import { FileCheck, ArrowRight, Shield, Database } from 'lucide-react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';

export default function DiwanEAmanat() {
    const mandatePoints = [
        'Contributor credits are confirmed',
        'Royalty allocations are documented',
        'Metadata is locked prior to release',
        'Publication authorization follows structured verification'
    ];

    const responsibilityAreas = [
        {
            label: 'Final master confirmation',
            description: 'Validation that production output meets registry standards'
        },
        {
            label: 'Contributor identity verification',
            description: 'Documented confirmation of all participating contributors'
        },
        {
            label: 'Rights and royalty documentation',
            description: 'Formalized allocation structures and agreement records'
        },
        {
            label: 'Release record creation',
            description: 'Institutional archive entry and metadata lock'
        },
        {
            label: 'Institutional archival continuity',
            description: 'Long-term preservation of release documentation'
        }
    ];

    const finalizationSteps = [
        { label: 'Master Confirmation', icon: FileCheck },
        { label: 'Credit Verification', icon: Shield },
        { label: 'Royalty Allocation Documentation', icon: Database },
        { label: 'Metadata Lock', icon: Shield },
        { label: 'Publication Authorization', icon: FileCheck }
    ];

    const authorityBoundaries = [
        {
            action: 'Does not evaluate creative content',
            clarification: 'Thematic and artistic decisions remain with editorial authority'
        },
        {
            action: 'Does not manage studio sessions',
            clarification: 'Production execution is governed by Production Oversight'
        },
        {
            action: 'Does not modify approved kalam',
            clarification: 'Content authority resides with Majlis-e-Nazr'
        },
        {
            action: 'Does not override charter provisions',
            clarification: 'All authority derives from and remains bound by Mithaq'
        }
    ];

    const recordPrinciples = [
        'Is documented within registry records',
        'Contains confirmed contributor attribution',
        'Maintains archived metadata',
        'Remains traceable across institutional continuity'
    ];

    return (
        <Layout>
            <Section className="pt-24 pb-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Diwan-e-Amanat
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-8 border-b border-amber-400/20 pb-4 inline-block">
                            {roleDisplayMap.diwan_e_amanat.mystical}
                        </p>

                        <div className="max-w-2xl">
                            <p className="text-neutral-300 leading-relaxed">
                                The Registry Authority governs final validation, contributor documentation, and release authorization.
                                No work is published under SufiPulse without registry confirmation.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Mandate & Validation Authority
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm font-medium mb-6">
                                Diwan-e-Amanat ensures:
                            </p>

                            <div className="space-y-3 mb-6">
                                {mandatePoints.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm">{item}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 text-sm leading-relaxed">
                                Registry formalizes what production completes.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Scope of Responsibility
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm font-medium mb-6">
                                Registry Authority oversees:
                            </p>

                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                {responsibilityAreas.map((area, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <p className="text-white font-medium text-sm">{area.label}</p>
                                        <p className="text-neutral-400 text-xs leading-relaxed">
                                            {area.description}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 text-sm leading-relaxed">
                                This transforms production output into institutional record.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Finalization Sequence
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-neutral-800/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-neutral-600">
                            <div className="flex items-center gap-4 min-w-max pb-2">
                                {finalizationSteps.map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="flex flex-col items-center gap-3 min-w-[140px]">
                                            <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                                                <step.icon className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <p className="text-neutral-300 text-sm text-center font-medium">
                                                {step.label}
                                            </p>
                                        </div>
                                        {idx < finalizationSteps.length - 1 && (
                                            <ArrowRight className="w-5 h-5 text-neutral-600 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Authority Boundaries
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm font-medium mb-6">
                                Diwan-e-Amanat:
                            </p>

                            <div className="space-y-6 mb-6">
                                {authorityBoundaries.map((boundary, idx) => (
                                    <div key={idx}>
                                        <p className="text-white text-sm font-medium mb-1">
                                            {boundary.action}
                                        </p>
                                        <p className="text-neutral-400 text-xs leading-relaxed">
                                            {boundary.clarification}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 text-sm leading-relaxed">
                                Its authority begins after production confirmation and concludes at publication authorization.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Institutional Record
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                                Every authorized release:
                            </p>

                            <div className="space-y-3 mb-6">
                                {recordPrinciples.map((principle, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm">{principle}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                                Release is not a toggle.
                            </p>
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                It is a recorded institutional act.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
