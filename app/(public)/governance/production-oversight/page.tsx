import { Settings, ArrowRight, Mic, Network, Headphones, FileCheck, Database } from 'lucide-react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';

export default function ProductionOversight() {
    const mandatePoints = [
        'Approved kalam enters structured production',
        'Studio workflow follows defined sequencing',
        'Technical standards are consistently applied',
        'Documentation supports registry validation'
    ];

    const supervisionAreas = [
        {
            label: 'Vocal recording sessions',
            description: 'Vocalist performance capture and quality verification'
        },
        {
            label: 'Network studio coordination',
            description: 'Distributed execution within centralized standards'
        },
        {
            label: 'Mixing and mastering alignment',
            description: 'Technical processing and sonic consistency'
        },
        {
            label: 'Metadata preparation',
            description: 'Documentation readiness for registry handoff'
        }
    ];

    const executionSteps = [
        { label: 'Approved Kalam', icon: FileCheck },
        { label: 'Vocalist Assignment', icon: Mic },
        { label: 'Network Allocation', icon: Network },
        { label: 'Recording', icon: Headphones },
        { label: 'Central Review', icon: Settings },
        { label: 'Master Confirmation', icon: FileCheck },
        { label: 'Registry Handoff', icon: Database }
    ];

    const authorityBoundaries = [
        {
            action: 'Does not authorize publication',
            clarification: 'Release activation requires registry confirmation'
        },
        {
            action: 'Does not define thematic approval',
            clarification: 'Editorial authority remains with Majlis-e-Nazr'
        },
        {
            action: 'Does not alter royalty allocation',
            clarification: 'Economic distribution follows constitutional framework'
        },
        {
            action: 'Does not override charter provisions',
            clarification: 'All authority derives from and remains bound by Mithaq'
        }
    ];

    const validationPrinciples = [
        'Final review remains centralized',
        'Master validation occurs under defined authority',
        'Technical compliance is documented before release'
    ];

    return (
        <Layout>
            <Section className="pt-24 pb-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Production Oversight
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-8 border-b border-amber-400/20 pb-4 inline-block">
                            {roleDisplayMap.production_oversight.mystical}
                        </p>

                        <div className="max-w-2xl">
                            <p className="text-neutral-300 leading-relaxed">
                                Production Oversight governs the structured execution of approved works.
                                It ensures that recording, mixing, mastering, and technical preparation follow documented institutional standards.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Mandate & Operational Control
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm font-medium mb-6">
                                Production Oversight ensures:
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
                                It governs process integrity, not artistic expression.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Scope of Oversight
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm font-medium mb-6">
                                Production Oversight supervises:
                            </p>

                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                {supervisionAreas.map((area, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <p className="text-white font-medium text-sm">{area.label}</p>
                                        <p className="text-neutral-400 text-xs leading-relaxed">
                                            {area.description}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                                Execution remains centralized through defined authority.
                            </p>
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                Network participation does not dilute standards.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Execution Flow
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-neutral-800/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-neutral-600">
                            <div className="flex items-center gap-4 min-w-max pb-2">
                                {executionSteps.map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="flex flex-col items-center gap-3 min-w-[140px]">
                                            <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                                                <step.icon className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <p className="text-neutral-300 text-sm text-center font-medium">
                                                {step.label}
                                            </p>
                                        </div>
                                        {idx < executionSteps.length - 1 && (
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
                                Production Oversight:
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
                                Its authority concludes at registry handoff.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Centralized Validation Principle
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                                Even when recording occurs across distributed studios:
                            </p>

                            <div className="space-y-3 mb-6">
                                {validationPrinciples.map((principle, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm">{principle}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 text-sm leading-relaxed">
                                Distributed execution operates within centralized governance.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
