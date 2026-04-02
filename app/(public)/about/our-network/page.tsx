import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';

export default function OurNetwork() {
    return (
        <Layout>
            <Section className="pt-24 pb-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Our Network
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-8 border-b border-amber-400/20 pb-4 inline-block">
                            {roleDisplayMap.our_network.mystical}
                        </p>

                        <div className="max-w-2xl">
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse operates through a centralized governance framework supported by distributed studio and collaborative networks across regions.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Central Authority
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="mb-6">
                                <p className="text-white font-medium text-lg mb-1">
                                    Central Studio
                                </p>
                                <p className="text-amber-400/70 text-sm">
                                    United States — Virginia
                                </p>
                            </div>

                            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                <p>
                                    The Central Studio operates as the primary technical and validation hub.
                                </p>
                                <p>
                                    Final master confirmation and institutional production oversight remain centralized.
                                </p>
                                <p>
                                    Distributed recording does not alter centralized validation.
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
                            Distributed Studio Network
                        </h2>
                        <p className="text-amber-400/70 text-sm mb-6">
                            Remote Studio Locations
                        </p>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="space-y-3 mb-6">
                                <p className="text-neutral-300 text-sm">Canada — Ottawa</p>
                                <p className="text-neutral-300 text-sm">United Arab Emirates — Dubai</p>
                                <p className="text-neutral-300 text-sm">India — Mumbai</p>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

                            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                <p>
                                    These locations support structured vocal recording under centralized coordination.
                                </p>

                                <p className="font-medium text-white">Network studios:</p>
                                <ul className="list-disc list-inside space-y-2 pl-4">
                                    <li>Operate within defined production protocol</li>
                                    <li>Deliver session files under documented standards</li>
                                    <li>Remain subject to centralized review</li>
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
                            Global Collaboration
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                <p>
                                    SufiPulse engages with contributors and collaborators across regions through:
                                </p>

                                <ul className="list-disc list-inside space-y-2 pl-4">
                                    <li>Approved creative contributors</li>
                                    <li>Institutional partners</li>
                                    <li>Technical collaborators</li>
                                    <li>Advisory engagement (where applicable)</li>
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
                                    Distributed execution.<br />
                                    Centralized governance.
                                </p>
                                <p>
                                    Network expansion operates within charter-defined authority.
                                </p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
