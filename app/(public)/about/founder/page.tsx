import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { ExternalLink } from 'lucide-react';

export default function Founder() {
    return (
        <Layout>
            <Section className="pt-24 pb-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Founder
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-8 border-b border-amber-400/20 pb-4 inline-block">
                            {roleDisplayMap.founder.mystical}
                        </p>

                        <div className="max-w-2xl">
                            <p className="text-neutral-300 leading-relaxed">
                                SufiPulse stands upon the founding vision of Dr. Ghulam Mohammad Kumar — a spiritual guide whose life bridged medicine, mysticism, and structured institutional awakening.
                            </p>
                            <p className="text-neutral-300 leading-relaxed mt-4">
                                Representative stewardship and institutional development are guided by Dr. Fayaz Ahmad Khan under the framework of Mithaq.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Early Life & Formative Influences
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="mb-6">
                                <p className="text-white font-medium text-lg mb-1">
                                    Dr. Ghulam Mohammad Kumar
                                </p>
                                <p className="text-amber-400/70 text-sm">
                                    Founder
                                </p>
                            </div>

                            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                <p>
                                    Dr. Ghulam Mohammad Kumar's journey began within a Kashmiri heritage grounded in scholarly and spiritual traditions. Born in 1957 into a family rooted in learning and healing, he demonstrated exceptional contemplative nature and profound inner sensitivity from his earliest years.
                                </p>

                                <p>
                                    He trained in modern medicine at Government Medical College Srinagar and practiced as a Medical Officer. Yet instinctively drawn deeper into inner inquiry, he transitioned from clinical practice toward a life devoted to spiritual depth and the pursuit of universal truth.
                                </p>

                                <p>
                                    His formative years in Kashmir's rich spiritual landscape shaped a disposition that would ultimately bridge conventional medical training with the ancient wisdom traditions of Kashmiri Sufism.
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
                            Spiritual Transformation & Teaching Genesis
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                <p>
                                    His path reflects the classical Sufi journey of detachment and inner realization. After withdrawing from public life, Dr. Kumar spent fourteen years in contemplative retreat in the forests of Ganderbal — a period marked by silence, muraqaba (meditation), and profound spiritual discipline.
                                </p>

                                <p>
                                    Through years of contemplative discipline and reflective silence in Kashmir's landscapes, he embodied a transformative practice rooted in the Sufi philosophy of Fana (annihilation of self) and the Qalandari path toward enlightenment.
                                </p>

                                <p>
                                    This transformation shaped his emergence as a spiritual guide — one rooted in truth rather than title, in presence rather than proclamation.
                                </p>

                                <p>
                                    His teaching methodology emphasized inner transformation through silence and conscious presence. As he observed: "Silence is not the absence of sound, but the presence of the Divine." Healing, in his framework, emerges from within rather than through external intervention.
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
                            Core Teaching Domains
                        </h2>
                        <p className="text-amber-400/70 text-sm mb-6">
                            Structured Philosophical Framework
                        </p>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                <p>
                                    Dr. Kumar's work synthesizes classical Kashmiri Sufi insight with a structured framework of inner transformation and holistic engagement with the world. His integrated approach encompasses six interconnected domains:
                                </p>

                                <div className="mt-6 space-y-3">
                                    <div className="border-l-2 border-amber-500/30 pl-4">
                                        <p className="font-medium text-white mb-1">Divine Healing & Holistic Wellbeing</p>
                                        <p className="text-neutral-400 text-xs">Wholeness in healing that addresses body, mind, and spirit as integrated realities.</p>
                                    </div>

                                    <div className="border-l-2 border-amber-500/30 pl-4">
                                        <p className="font-medium text-white mb-1">Environmental Stewardship as Sacred Responsibility</p>
                                        <p className="text-neutral-400 text-xs">Reverence for the natural world as spiritually significant, including water conservation and ecological consciousness.</p>
                                    </div>

                                    <div className="border-l-2 border-amber-500/30 pl-4">
                                        <p className="font-medium text-white mb-1">Bridging Spiritual Wisdom with Rigorous Inquiry</p>
                                        <p className="text-neutral-400 text-xs">Synthesis of contemplative insight with rational exploration and scientific methodology.</p>
                                    </div>

                                    <div className="border-l-2 border-amber-500/30 pl-4">
                                        <p className="font-medium text-white mb-1">Education as Awakening & Consciousness Expansion</p>
                                        <p className="text-neutral-400 text-xs">Education as a pathway to expanded consciousness, not merely information transfer.</p>
                                    </div>

                                    <div className="border-l-2 border-amber-500/30 pl-4">
                                        <p className="font-medium text-white mb-1">Inner Peace Through Mindfulness</p>
                                        <p className="text-neutral-400 text-xs">Cultivating presence and awareness as foundations for sustainable inner peace.</p>
                                    </div>

                                    <div className="border-l-2 border-amber-500/30 pl-4">
                                        <p className="font-medium text-white mb-1">Transcendent Truth Beyond Religious Divisions</p>
                                        <p className="text-neutral-400 text-xs">Universal spiritual principles that transcend sectarian boundaries and cultural limitations.</p>
                                    </div>
                                </div>

                                <p className="mt-6">
                                    This positions his teachings not as charismatic pronouncements but as sustained philosophical contributions with structured depth and institutional continuity.
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
                            Founding Vision for SufiPulse
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                <p>
                                    The founding vision established a structured devotional institution integrating editorial authority, production discipline, and registry validation under a unified charter. SufiPulse emerged from the recognition that devotional expression requires institutional governance to preserve thematic coherence, maintain technical excellence, and ensure continuity beyond individual contributions.
                                </p>

                                <p>
                                    The foundational philosophy centers on constitutional order: creative energy operates within documented frameworks, editorial oversight ensures spiritual alignment, and registry documentation maintains perpetual accountability.
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
                            Banday Bagh
                        </h2>
                        <p className="text-amber-400/70 text-sm mb-6">
                            Spiritual Station
                        </p>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                <p>
                                    Banday Bagh in Ganderbal, Kashmir, serves as a spiritual center for seekers. It functions as:
                                </p>

                                <ul className="list-disc list-inside space-y-2 pl-4">
                                    <li>A meditation space for Zikr and reflection</li>
                                    <li>A Langar offering unconditional hospitality</li>
                                    <li>Lodging for spiritual travelers</li>
                                    <li>A place of direct guidance and transmission</li>
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
                            Legacy & Stewardship Structures
                        </h2>
                        <p className="text-amber-400/70 text-sm mb-6">
                            Institutional Extensions
                        </p>

                        <div className="space-y-6">
                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        Sufi Science Center
                                    </h3>
                                    <p className="text-amber-400/70 text-xs">
                                        Institutional Extension
                                    </p>
                                </div>

                                <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                    <p>
                                        Dr. Kumar's legacy is institutional, not individualistic. The Sufi Science Center (SSC) serves as an interdisciplinary platform preserving and evolving Kashmiri Sufi wisdom through research, digital preservation, and curated educational pathways.
                                    </p>

                                    <p>
                                        To preserve and systematize foundational teachings, SSC operates as an institution integrating spirituality, scholarship, and contemporary inquiry.
                                    </p>

                                    <p className="font-medium text-white">Core Initiatives:</p>
                                    <ul className="list-disc list-inside space-y-2 pl-4">
                                        <li>Kashmiri Sufi archives and digital preservation</li>
                                        <li>Interdisciplinary research in consciousness and healing</li>
                                        <li>Youth engagement and spiritual guidance programs</li>
                                        <li>Global scholarly collaboration</li>
                                        <li>Traditional Kashmiri craft preservation</li>
                                    </ul>

                                    <div className="pt-6 mt-6 border-t border-neutral-800">
                                        <a
                                            href="https://sufisciencecenter.info/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all duration-200 font-medium"
                                        >
                                            Visit Official SSC Website
                                            <ExternalLink size={16} />
                                        </a>
                                        <p className="text-xs text-neutral-500 mt-2">
                                            sufisciencecenter.info
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                            Opens in new tab
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        Dr. Kumar Foundation USA
                                    </h3>
                                    <p className="text-amber-400/70 text-xs">
                                        International Extension
                                    </p>
                                </div>

                                <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                    <p>
                                        Established by students and supporters in the United States, the Dr. Kumar Foundation anchors global impact, extending spiritual, cultural, and scholarly engagement across borders.
                                    </p>

                                    <p>
                                        The Foundation continues his work merging spiritual wisdom with scientific research, focusing on consciousness, healing methodologies, and environmental preservation.
                                    </p>

                                    <p className="font-medium text-white">Supported Initiatives:</p>
                                    <ul className="list-disc list-inside space-y-2 pl-4">
                                        <li>Spiritual outreach and healing workshops</li>
                                        <li>Research fellowships in consciousness studies</li>
                                        <li>Educational programs and spiritual retreats</li>
                                        <li>Water conservation initiatives in Kashmir</li>
                                        <li>Cross-cultural dialogue and scholarly collaboration</li>
                                    </ul>

                                    <div className="pt-6 mt-6 border-t border-neutral-800">
                                        <a
                                            href="https://dkf.sufisciencecenter.info/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all duration-200 font-medium"
                                        >
                                            Visit Official Foundation Website
                                            <ExternalLink size={16} />
                                        </a>
                                        <p className="text-xs text-neutral-500 mt-2">
                                            dkf.sufisciencecenter.info
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                            Opens in new tab
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-6 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                Framing legacy in this way aligns it with organizational continuance rather than personal legend. His global influence reached approximately 14,000 seekers following the spiritual path he embodied.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Representative Stewardship
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="mb-6">
                                <p className="text-white font-medium text-lg mb-1">
                                    Dr. Fayaz Ahmad Khan
                                </p>
                                <p className="text-amber-400/70 text-sm">
                                    Representative Founder
                                </p>
                            </div>

                            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                <p>
                                    Representative stewardship oversees structural development, institutional governance integration, and digital expansion aligned with the founding charter.
                                </p>

                                <p>
                                    The representative role focuses on architectural design: translating constitutional principles into operational systems, integrating editorial processes with production workflows, and establishing technological infrastructure that serves institutional permanence.
                                </p>

                                <p>
                                    Structural development includes the construction of multi-layered governance systems, role-based participation frameworks, registry documentation protocols, and economic transparency mechanisms that reinforce charter authority.
                                </p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 pb-20">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Institutional Continuity
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="space-y-4 text-neutral-300 text-sm leading-relaxed">
                                <p>
                                    Founding and representative leadership operate within the constitutional framework of Mithaq. Institutional authority remains charter-governed rather than personality-driven.
                                </p>

                                <p>
                                    Leadership functions as structural stewardship, not personal authority. Decisions flow from documented principles, editorial review processes, and governance protocols rather than individual discretion.
                                </p>

                                <p>
                                    The separation of founding vision from operational execution creates institutional resilience. Continuity derives from constitutional design, not individual presence.
                                </p>

                                <p>
                                    SufiPulse's structural integrity depends on this distinction: the institution transcends its founders. Governance mechanisms, editorial standards, production protocols, and registry validation operate independently of individual tenure.
                                </p>

                                <p>
                                    This ensures perpetual operation. The framework survives leadership transitions because authority resides in documented charter, not personal charisma.
                                </p>

                                <p>
                                    Institutional permanence exceeds individual roles. The structure endures.
                                </p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
