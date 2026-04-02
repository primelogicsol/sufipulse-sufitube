import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';

export default function InstitutionalPartners() {
    return (
        <Layout>
            <Section className="pt-24 pb-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Institutional Partners
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-8 border-b border-amber-400/20 pb-4 inline-block">
                            {roleDisplayMap.institutional_partners.mystical}
                        </p>

                        <div className="max-w-2xl">
                            <p className="text-neutral-300 leading-relaxed mb-4">
                                SufiPulse engages with select institutions and collaborators whose values align with its charter, governance framework, and cultural mission.
                            </p>
                            <p className="text-neutral-300 leading-relaxed">
                                Partnership is not promotional.<br />
                                It is structural alignment.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Alignment Over Sponsorship
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                <p>
                                    SufiPulse does not operate on commercial sponsorship models.
                                </p>

                                <p className="font-medium text-white">Institutional partnerships are based on:</p>
                                <ul className="list-disc list-inside space-y-2 pl-4">
                                    <li>Shared ethical framework</li>
                                    <li>Cultural and scholarly alignment</li>
                                    <li>Mutual respect for governance structures</li>
                                    <li>Long-term collaboration</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Categories of Institutional Partners
                        </h2>

                        <div className="space-y-4">
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <p className="text-white font-medium text-sm mb-2">
                                    Academic & Research Affiliates
                                </p>
                                <p className="text-neutral-300 text-sm leading-relaxed">
                                    Institutions supporting interdisciplinary dialogue between spirituality, ethics, and contemporary inquiry.
                                </p>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <p className="text-white font-medium text-sm mb-2">
                                    Cultural & Heritage Institutions
                                </p>
                                <p className="text-neutral-300 text-sm leading-relaxed">
                                    Organizations engaged in preservation of spiritual, literary, and artistic traditions.
                                </p>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <p className="text-white font-medium text-sm mb-3">
                                    Technical & Infrastructure Partners
                                </p>
                                <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                                    Entities providing support in:
                                </p>
                                <ul className="list-disc list-inside space-y-1 pl-4 text-neutral-300 text-sm">
                                    <li>Archival digitization</li>
                                    <li>Recording technology</li>
                                    <li>Distribution systems</li>
                                    <li>Educational platforms</li>
                                </ul>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                <p className="text-white font-medium text-sm mb-2">
                                    Regional Institutional Collaborators
                                </p>
                                <p className="text-neutral-300 text-sm leading-relaxed">
                                    Local or regional entities that assist in structured program execution.
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
                            Partner Engagement Model
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                <p>
                                    Institutional collaboration may include:
                                </p>

                                <ul className="list-disc list-inside space-y-2 pl-4">
                                    <li>Joint initiatives</li>
                                    <li>Research exchange</li>
                                    <li>Event coordination</li>
                                    <li>Content preservation projects</li>
                                    <li>Educational programming</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 pb-20">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Structural Principle
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                <p>
                                    Partnership within SufiPulse operates under charter-defined governance.
                                </p>
                                <p>
                                    Institutional collaboration enhances capacity without altering structural authority.
                                </p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
