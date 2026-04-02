import { FileCheck, ArrowRight, Mic, Shield, Database, Lock } from 'lucide-react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';

export default function ReleaseProtocol() {
    const purposePoints = [
        'Sequential authority is respected',
        'Production outputs are validated',
        'Registry documentation is complete',
        'Institutional integrity is preserved'
    ];

    const sequentialSteps = [
        { label: 'Editorial Authorization', icon: FileCheck },
        { label: 'Production Completion', icon: Mic },
        { label: 'Master Confirmation', icon: Shield },
        { label: 'Registry Verification', icon: Database },
        { label: 'Royalty Documentation', icon: FileCheck },
        { label: 'Metadata Lock', icon: Lock },
        { label: 'Publication Authorization', icon: FileCheck }
    ];

    const nonBypassRequirements = [
        'Without editorial approval',
        'Without structured production',
        'Without registry confirmation',
        'Without documented royalty allocation'
    ];

    const irreversibilityPrinciples = [
        'Credits are locked',
        'Metadata is recorded',
        'Registry entry becomes permanent',
        'Economic allocation is fixed'
    ];

    const authorityBoundaries = [
        {
            action: 'Does not evaluate creative content',
            clarification: 'Thematic and artistic decisions remain with editorial authority'
        },
        {
            action: 'Does not perform studio production',
            clarification: 'Production execution is governed by Production Oversight'
        },
        {
            action: 'Does not redefine charter provisions',
            clarification: 'All authority derives from and remains bound by Mithaq'
        }
    ];

    return (
        <Layout>
            <Section className="pt-24 pb-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Release Protocol
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-8 border-b border-amber-400/20 pb-4 inline-block">
                            {roleDisplayMap.release_protocol.mystical}
                        </p>

                        <div className="max-w-2xl">
                            <p className="text-neutral-300 leading-relaxed">
                                The Release Protocol defines the formal sequence required before any work is published under SufiPulse.
                                Publication is a governed institutional act, not a technical upload.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Purpose
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm font-medium mb-6">
                                The Release Protocol ensures:
                            </p>

                            <div className="space-y-3 mb-6">
                                {purposePoints.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm">{item}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                                Release follows authorization.
                            </p>
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                It does not initiate it.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Sequential Requirements
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-neutral-800/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-neutral-600">
                            <div className="flex items-center gap-4 min-w-max pb-2">
                                {sequentialSteps.map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="flex flex-col items-center gap-3 min-w-[140px]">
                                            <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                                                <step.icon className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <p className="text-neutral-300 text-sm text-center font-medium">
                                                {step.label}
                                            </p>
                                        </div>
                                        {idx < sequentialSteps.length - 1 && (
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
                            Non-Bypass Principle
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm font-medium mb-6">
                                No release occurs:
                            </p>

                            <div className="space-y-3 mb-6">
                                {nonBypassRequirements.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm">{item}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 text-sm leading-relaxed">
                                No parallel shortcuts.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Irreversibility Principle
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                                Once publication is authorized:
                            </p>

                            <div className="space-y-3 mb-6">
                                {irreversibilityPrinciples.map((principle, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm">{principle}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                                Release is a recorded institutional moment.
                            </p>
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                Not a reversible toggle.
                            </p>
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
                                Release Protocol:
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
                                It governs the act of publication.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
