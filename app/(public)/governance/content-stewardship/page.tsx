import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { FileText, Globe, Shield, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function ContentStewardship() {
    const languages = [
        'Roman Urdu', 'Urdu', 'Hindi', 'Arabic', 'Turkish', 'Persian (Farsi)',
        'Punjabi', 'Indonesian', 'Spanish', 'Portuguese', 'French', 'German',
        'Russian', 'Bengali', 'Chinese', 'Japanese', 'English'
    ];

    return (
        <Layout>
            <Section className="pt-24 pb-12">
                <PageContainer>
                    <div className="max-w-4xl">
                        <h1 className="text-5xl font-bold text-white mb-2">
                            Content Stewardship
                        </h1>
                        <p className="text-xl text-amber-400/90 mb-8 border-b border-amber-400/20 pb-4 inline-block">
                            {roleDisplayMap.content_stewardship.mystical}
                        </p>

                        <div className="max-w-2xl">
                            <p className="text-neutral-300 leading-relaxed mb-4">
                                All releases undergo structured linguistic review, thematic alignment, and subtitle standardization prior to publication.
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
                    <div className="max-w-4xl space-y-20">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">
                                Stewardship Mandate
                            </h2>
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="flex items-start gap-4">
                                        <Globe className="w-5 h-5 text-neutral-500 mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-lg font-medium text-neutral-200 mb-2">17-Language Subtitle Discipline</h3>
                                            <p className="text-neutral-400">
                                                Standardized multilingual distribution with native-script preservation
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <Shield className="w-5 h-5 text-neutral-500 mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-lg font-medium text-neutral-200 mb-2">Source-Language Integrity</h3>
                                            <p className="text-neutral-400">
                                                Original linguistic nuance protected through translation
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <FileText className="w-5 h-5 text-neutral-500 mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-lg font-medium text-neutral-200 mb-2">Thematic Coherence</h3>
                                            <p className="text-neutral-400">
                                                Unified interpretive framework across all translations
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <CheckCircle className="w-5 h-5 text-neutral-500 mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-lg font-medium text-neutral-200 mb-2">Doctrinal Alignment</h3>
                                            <p className="text-neutral-400">
                                                Interpretation verified against institutional doctrine
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 mt-8">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-neutral-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-neutral-400 leading-relaxed">
                                            <span className="font-medium text-neutral-300">Translation is not localization.</span> It is doctrinal responsibility.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-20">
                            <h2 className="text-3xl font-bold text-white mb-6">
                                Global Subtitle Framework
                            </h2>
                            <div className="space-y-8">
                                <p className="text-neutral-300 leading-relaxed">
                                    SufiPulse operates under a standardized 17-language subtitle sequence with RTL alignment protocols and linguistic integrity rules.
                                </p>

                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <h3 className="text-lg font-medium text-neutral-200 mb-6">Supported Languages</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {languages.map((lang, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 text-neutral-400"
                                            >
                                                <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full"></div>
                                                <span className="text-sm">{lang}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                                        <h3 className="text-base font-medium text-neutral-200 mb-3">RTL Positioning Discipline</h3>
                                        <p className="text-sm text-neutral-400 leading-relaxed">
                                            Arabic, Urdu, Persian, and other right-to-left scripts maintain directional integrity across all platforms
                                        </p>
                                    </div>

                                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                                        <h3 className="text-base font-medium text-neutral-200 mb-3">Native-Script Preservation</h3>
                                        <p className="text-sm text-neutral-400 leading-relaxed">
                                            No romanization of non-Latin scripts except where linguistically mandated
                                        </p>
                                    </div>

                                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                                        <h3 className="text-base font-medium text-neutral-200 mb-3">Pronunciation Integrity</h3>
                                        <p className="text-sm text-neutral-400 leading-relaxed">
                                            Transliteration follows scholarly conventions, not phonetic convenience
                                        </p>
                                    </div>

                                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                                        <h3 className="text-base font-medium text-neutral-200 mb-3">No Conceptual Dilution</h3>
                                        <p className="text-sm text-neutral-400 leading-relaxed">
                                            Technical terms retain doctrinal precision across all target languages
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-20">
                            <h2 className="text-3xl font-bold text-white mb-6">
                                Interpretive Integrity
                            </h2>
                            <div className="space-y-8">
                                <p className="text-neutral-300 leading-relaxed">
                                    Song themes are documented prior to release. Interpretive framing must preserve doctrinal clarity, avoid theological distortion, maintain non-commercial tone, and respect cross-cultural nuance.
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center">
                                                <Shield className="w-4 h-4 text-neutral-400" />
                                            </div>
                                            <h3 className="text-base font-medium text-neutral-200">Doctrinal Clarity</h3>
                                        </div>
                                        <p className="text-sm text-neutral-400 leading-relaxed">
                                            Thematic interpretation aligns with institutional understanding of text and tradition
                                        </p>
                                    </div>

                                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center">
                                                <AlertTriangle className="w-4 h-4 text-neutral-400" />
                                            </div>
                                            <h3 className="text-base font-medium text-neutral-200">No Theological Distortion</h3>
                                        </div>
                                        <p className="text-sm text-neutral-400 leading-relaxed">
                                            Interpretation does not introduce sectarian bias or doctrinal deviation
                                        </p>
                                    </div>

                                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center">
                                                <FileText className="w-4 h-4 text-neutral-400" />
                                            </div>
                                            <h3 className="text-base font-medium text-neutral-200">Non-Commercial Tone</h3>
                                        </div>
                                        <p className="text-sm text-neutral-400 leading-relaxed">
                                            Thematic framing avoids sensationalism, clickbait, or entertainment-driven narratives
                                        </p>
                                    </div>

                                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center">
                                                <Globe className="w-4 h-4 text-neutral-400" />
                                            </div>
                                            <h3 className="text-base font-medium text-neutral-200">Cross-Cultural Nuance</h3>
                                        </div>
                                        <p className="text-sm text-neutral-400 leading-relaxed">
                                            Interpretation respects linguistic and cultural context without compromising meaning
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-20">
                            <h2 className="text-3xl font-bold text-white mb-6">
                                Editorial Review Sequence
                            </h2>
                            <div className="space-y-6">
                                <p className="text-neutral-300 leading-relaxed mb-8">
                                    All content passes through a structured review process ensuring linguistic precision and thematic consistency.
                                </p>

                                <div className="relative">
                                    <div className="absolute left-6 top-12 bottom-12 w-px bg-neutral-800"></div>

                                    <div className="space-y-8">
                                        <div className="flex items-start gap-6 relative">
                                            <div className="w-12 h-12 bg-neutral-900 border-2 border-neutral-700 rounded-full flex items-center justify-center flex-shrink-0 relative z-10">
                                                <span className="text-neutral-400 font-medium">1</span>
                                            </div>
                                            <div className="pt-2 flex-1">
                                                <h3 className="text-lg font-medium text-neutral-200 mb-2">Primary Language Approval</h3>
                                                <p className="text-neutral-400">Source text reviewed for linguistic accuracy and doctrinal alignment</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-6 relative">
                                            <div className="w-12 h-12 bg-neutral-900 border-2 border-neutral-700 rounded-full flex items-center justify-center flex-shrink-0 relative z-10">
                                                <span className="text-neutral-400 font-medium">2</span>
                                            </div>
                                            <div className="pt-2 flex-1">
                                                <h3 className="text-lg font-medium text-neutral-200 mb-2">Translation Alignment Review</h3>
                                                <p className="text-neutral-400">All 17 language variants verified for semantic consistency</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-6 relative">
                                            <div className="w-12 h-12 bg-neutral-900 border-2 border-neutral-700 rounded-full flex items-center justify-center flex-shrink-0 relative z-10">
                                                <span className="text-neutral-400 font-medium">3</span>
                                            </div>
                                            <div className="pt-2 flex-1">
                                                <h3 className="text-lg font-medium text-neutral-200 mb-2">Thematic Documentation</h3>
                                                <p className="text-neutral-400">Song theme, interpretive notes, and contextual guidance finalized</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-6 relative">
                                            <div className="w-12 h-12 bg-neutral-900 border-2 border-neutral-700 rounded-full flex items-center justify-center flex-shrink-0 relative z-10">
                                                <span className="text-neutral-400 font-medium">4</span>
                                            </div>
                                            <div className="pt-2 flex-1">
                                                <h3 className="text-lg font-medium text-neutral-200 mb-2">Subtitle Technical Verification</h3>
                                                <p className="text-neutral-400">RTL positioning, timing accuracy, and platform compatibility confirmed</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-6 relative">
                                            <div className="w-12 h-12 bg-neutral-900 border-2 border-neutral-700 rounded-full flex items-center justify-center flex-shrink-0 relative z-10">
                                                <span className="text-neutral-400 font-medium">5</span>
                                            </div>
                                            <div className="pt-2 flex-1">
                                                <h3 className="text-lg font-medium text-neutral-200 mb-2">Publication Clearance</h3>
                                                <p className="text-neutral-400">Final approval issued by designated stewardship authority</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-20">
                            <h2 className="text-3xl font-bold text-white mb-6">
                                Structural Boundaries
                            </h2>
                            <div className="space-y-6">
                                <p className="text-neutral-300 leading-relaxed mb-8">
                                    Content stewardship operates under non-negotiable constraints to preserve institutional integrity.
                                </p>

                                <div className="grid gap-4">
                                    <div className="flex items-start gap-4 p-6 bg-neutral-900/30 border border-neutral-800 rounded-lg">
                                        <div className="w-2 h-2 bg-neutral-600 rounded-full mt-2 flex-shrink-0"></div>
                                        <div>
                                            <h3 className="text-base font-medium text-neutral-200 mb-1">No External Subtitle Editing</h3>
                                            <p className="text-sm text-neutral-400">Translation modifications require institutional review and approval</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-6 bg-neutral-900/30 border border-neutral-800 rounded-lg">
                                        <div className="w-2 h-2 bg-neutral-600 rounded-full mt-2 flex-shrink-0"></div>
                                        <div>
                                            <h3 className="text-base font-medium text-neutral-200 mb-1">No Post-Release Theme Alteration</h3>
                                            <p className="text-sm text-neutral-400">Interpretive framing is finalized prior to publication and remains immutable</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-6 bg-neutral-900/30 border border-neutral-800 rounded-lg">
                                        <div className="w-2 h-2 bg-neutral-600 rounded-full mt-2 flex-shrink-0"></div>
                                        <div>
                                            <h3 className="text-base font-medium text-neutral-200 mb-1">No Unauthorized Language Additions</h3>
                                            <p className="text-sm text-neutral-400">The 17-language framework is standardized across all releases</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-6 bg-neutral-900/30 border border-neutral-800 rounded-lg">
                                        <div className="w-2 h-2 bg-neutral-600 rounded-full mt-2 flex-shrink-0"></div>
                                        <div>
                                            <h3 className="text-base font-medium text-neutral-200 mb-1">Charter Alignment Mandatory</h3>
                                            <p className="text-sm text-neutral-400">All stewardship decisions must conform to institutional charter provisions</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-neutral-800">
                                    <Link
                                        href="/governance/majlis-e-nazr"
                                        className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-300 transition-colors"
                                    >
                                        <span>View Editorial Council</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
