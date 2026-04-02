import { Users, ArrowRight, FileText, Lock, Database } from 'lucide-react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';

export default function RoyaltyTransparency() {
    const allocationPrinciples = [
        'Contributor roles are formally recorded',
        'Allocation percentages are confirmed before release',
        'Distribution structures are agreed prior to publication',
        'Registry records reflect final economic structure'
    ];

    const eligibleRoles = [
        {
            role: 'Approved writers',
            mystical: 'Ahl-e-Qalam'
        },
        {
            role: 'Approved vocalists',
            mystical: 'Ahl-e-Sada'
        },
        {
            role: 'Approved producers',
            mystical: 'Ahl-e-Naghma'
        }
    ];

    const documentationSteps = [
        { label: 'Contributor Confirmation', icon: Users },
        { label: 'Allocation Agreement', icon: FileText },
        { label: 'Registry Recording', icon: Database },
        { label: 'Metadata Lock', icon: Lock },
        { label: 'Release Authorization', icon: FileText }
    ];

    const recordPrinciples = [
        {
            principle: 'Is recorded prior to publication',
            detail: 'Economic structure defined before release'
        },
        {
            principle: 'Remains traceable through institutional registry',
            detail: 'Documentation permanently accessible'
        },
        {
            principle: 'Aligns with documented agreements',
            detail: 'Registry reflects confirmed allocations'
        },
        {
            principle: 'Cannot be altered post-publication without formal review',
            detail: 'Changes require documented authorization'
        }
    ];

    const authorityBoundaries = [
        {
            action: 'Does not assign creative approval',
            clarification: 'Editorial authority remains with Majlis-e-Nazr'
        },
        {
            action: 'Does not manage studio execution',
            clarification: 'Production oversight governs technical workflow'
        },
        {
            action: 'Does not override registry confirmation',
            clarification: 'Documentation follows institutional validation'
        }
    ];

    return (
        <Layout>
            <Section className="pt-24 pb-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Royalty Transparency
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-8 border-b border-amber-400/20 pb-4 inline-block">
                            {roleDisplayMap.royalty_transparency.mystical}
                        </p>

                        <div className="max-w-2xl">
                            <p className="text-neutral-300 leading-relaxed mb-4">
                                Royalty allocation within SufiPulse follows documented institutional protocol.
                                All economic distributions are confirmed prior to publication and recorded through registry validation.
                            </p>
                            <p className="text-neutral-300 leading-relaxed">
                                Clear. Controlled.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Allocation Principles
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm font-medium mb-6">
                                Royalty documentation ensures:
                            </p>

                            <div className="space-y-3 mb-6">
                                {allocationPrinciples.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <p className="text-neutral-300 text-sm">{item}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 text-sm leading-relaxed">
                                No allocation is determined after release.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Eligible Roles
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm font-medium mb-6">
                                Royalty consideration may apply to:
                            </p>

                            <div className="space-y-4 mb-6">
                                {eligibleRoles.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                                        <div>
                                            <span className="text-neutral-300 text-sm">{item.role}</span>
                                            <span className="text-amber-400/70 text-sm"> ({item.mystical})</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 text-sm leading-relaxed">
                                Studio infrastructure operates under service governance unless otherwise contractually defined.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Documentation Sequence
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-neutral-800/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-neutral-600">
                            <div className="flex items-center gap-4 min-w-max pb-2">
                                {documentationSteps.map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="flex flex-col items-center gap-3 min-w-[140px]">
                                            <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                                                <step.icon className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <p className="text-neutral-300 text-sm text-center font-medium">
                                                {step.label}
                                            </p>
                                        </div>
                                        {idx < documentationSteps.length - 1 && (
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
                            Transparency & Record
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 text-sm font-medium mb-6">
                                Royalty documentation:
                            </p>

                            <div className="space-y-6 mb-6">
                                {recordPrinciples.map((item, idx) => (
                                    <div key={idx}>
                                        <p className="text-white text-sm font-medium mb-1">
                                            {item.principle}
                                        </p>
                                        <p className="text-neutral-400 text-xs leading-relaxed">
                                            {item.detail}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <p className="text-neutral-300 text-sm leading-relaxed">
                                Transparency protects contributors and institution equally.
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
                                Royalty Transparency:
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
                                It governs economic clarity prior to release.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
