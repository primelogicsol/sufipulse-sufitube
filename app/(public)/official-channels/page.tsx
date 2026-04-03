import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Video, Headphones, Globe, Shield, ExternalLink, Radio, Youtube, Music2, Music, Instagram, Twitter, Facebook } from 'lucide-react';

export default function OfficialChannels() {
    const platforms = [
        {
            name: 'YouTube',
            description: 'Primary video archive and global release channel.',
            purpose: 'Official release publication, legacy archival, and multilingual visual distribution.',
            url: 'https://www.youtube.com/@SufiPulse-USA',
            buttonText: 'Visit Channel',
            icon: Youtube,
        },
        {
            name: 'Spotify',
            description: 'Primary streaming distribution platform for audio releases.',
            purpose: 'Structured audio access and global listener distribution.',
            url: 'https://open.spotify.com/artist/sufipulse',
            buttonText: 'Open Spotify',
            icon: Music2,
        },
        {
            name: 'Apple Music',
            description: 'Official audio distribution channel for Apple ecosystem users.',
            purpose: 'Curated audio releases and streaming access for Apple Music subscribers.',
            url: 'https://music.apple.com/artist/sufipulse',
            buttonText: 'Open Apple Music',
            icon: Music,
        },
        {
            name: 'Instagram',
            description: 'Visual excerpts, release announcements, and structured updates.',
            purpose: 'Visual storytelling and community engagement through strategic content curation.',
            url: 'https://instagram.com/sufipulse',
            buttonText: 'View Instagram',
            icon: Instagram,
        },
        {
            name: 'X',
            description: 'Institutional communication, public statements, and thought leadership.',
            purpose: 'Real-time updates, governance communications, and interfaith dialogue.',
            url: 'https://x.com/sufipulse',
            buttonText: 'Visit X',
            icon: Twitter,
        },
        {
            name: 'Facebook',
            description: 'Community announcements and archival public updates.',
            purpose: 'Long-form community engagement and archival content sharing.',
            url: 'https://www.facebook.com/groups/1100263345262190',
            buttonText: 'Visit Facebook',
            icon: Facebook,
        }
    ];

    return (
        <Layout>
            <Section className="pt-24 pb-12 ">
                <PageContainer>
                    <div className="max-w-5xl mx-auto text-center">
                        <div className="mb-6">
                            <span className="inline-block px-4 py-2 bg-amber-400/10 border border-amber-400/30 rounded-full text-sm text-amber-400 uppercase tracking-wider font-medium">
                                Digital Distribution
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
                            SufiTube
                        </h1>
                        <p className="text-2xl md:text-3xl text-amber-400/90 mb-8 font-light">
                            Official Channels & Verified Presence
                        </p>

                        <div className="max-w-3xl mx-auto">
                            <p className="text-lg text-neutral-300 leading-relaxed">
                                SufiPulse maintains verified digital channels for distribution, publication, and institutional communication. These platforms serve as structured extensions of our archival and production framework.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 border-t border-neutral-800 bg-neutral-900/50">
                <PageContainer>
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Digital Mandate & Distribution Scope
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <p className="text-neutral-300 leading-relaxed mb-8">
                                Digital platforms function as distribution endpoints. They do not replace institutional governance or archival authority.
                            </p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                    <div className="flex items-start gap-3 mb-3">
                                        <Video className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                        <h3 className="text-white font-semibold">
                                            Video Archive
                                        </h3>
                                    </div>
                                    <p className="text-neutral-300 text-sm leading-relaxed">
                                        Official release publications and visual documentation.
                                    </p>
                                </div>

                                <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                    <div className="flex items-start gap-3 mb-3">
                                        <Headphones className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                        <h3 className="text-white font-semibold">
                                            Audio Distribution
                                        </h3>
                                    </div>
                                    <p className="text-neutral-300 text-sm leading-relaxed">
                                        Structured streaming access across global platforms.
                                    </p>
                                </div>

                                <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                    <div className="flex items-start gap-3 mb-3">
                                        <Globe className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                        <h3 className="text-white font-semibold">
                                            Global Outreach
                                        </h3>
                                    </div>
                                    <p className="text-neutral-300 text-sm leading-relaxed">
                                        Cross-regional accessibility and public engagement.
                                    </p>
                                </div>

                                <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                                    <div className="flex items-start gap-3 mb-3">
                                        <Shield className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                        <h3 className="text-white font-semibold">
                                            Institutional Verification
                                        </h3>
                                    </div>
                                    <p className="text-neutral-300 text-sm leading-relaxed">
                                        All official channels are maintained under governance oversight.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 bg-neutral-900">
                <PageContainer>
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Verified Distribution Platforms
                        </h2>

                        <div className="space-y-6">
                            {/* ── SufiPulse Radio — Owned Layer ───────────────────────────────── */}
                            <div className="relative rounded-lg p-6 border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-neutral-900/60 to-neutral-900/30 overflow-hidden">
                                {/* subtle corner accent */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none" />

                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Radio className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-semibold text-white">SufiPulse Radio</h3>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 tracking-wide">Owned Channel</span>
                                        </div>
                                        <p className="text-neutral-400 text-sm mb-3">
                                            Official continuous audio broadcast environment
                                        </p>
                                        <div className="bg-neutral-900/60 border border-amber-500/10 rounded p-3">
                                            <p className="text-neutral-400 text-xs uppercase tracking-wider mb-1.5">Purpose</p>
                                            <p className="text-neutral-300 text-sm leading-relaxed">
                                                Owned broadcast presence across the SufiPulse ecosystem
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end">
                                    <a
                                        href="/releases"
                                        className="inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/60 text-amber-300 hover:text-amber-200 px-4 py-2 text-sm rounded transition-all group"
                                    >
                                        Access Broadcast
                                        <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
                                    </a>
                                </div>
                            </div>

                            {/* ── Third-party verified platforms ────────────────────────────── */}
                            {platforms.map((platform) => {
                                const PlatformIcon = platform.icon;
                                return (
                                <div
                                    key={platform.name}
                                    className="relative rounded-lg p-6 border border-neutral-700/50 bg-gradient-to-br from-neutral-900/60 via-neutral-900/40 to-neutral-900/30 overflow-hidden hover:border-neutral-600/70 transition-colors"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-700/5 rounded-bl-full pointer-events-none" />

                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-neutral-700/30 border border-neutral-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <PlatformIcon className="w-5 h-5 text-neutral-300" strokeWidth={1.5} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-semibold text-white">{platform.name}</h3>
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-700/40 border border-neutral-600/30 text-neutral-400 tracking-wide">Verified</span>
                                            </div>
                                            <p className="text-neutral-400 text-sm mb-3">
                                                {platform.description}
                                            </p>
                                            <div className="bg-neutral-900/60 border border-neutral-700/20 rounded p-3">
                                                <p className="text-neutral-400 text-xs uppercase tracking-wider mb-1.5">Purpose</p>
                                                <p className="text-neutral-300 text-sm leading-relaxed">
                                                    {platform.purpose}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end">
                                        <a
                                            href={platform.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 bg-neutral-700/20 hover:bg-neutral-700/40 border border-neutral-600/40 hover:border-neutral-500/60 text-neutral-300 hover:text-white px-4 py-2 text-sm rounded transition-all group"
                                        >
                                            {platform.buttonText}
                                            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
                                        </a>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 bg-neutral-900/50">
                <PageContainer>
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Operational Clarity
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                            <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 mb-6">
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Digital channels are distribution extensions</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Governance remains centralized</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Content integrity precedes publication</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">Public presence does not override institutional process</p>
                                </div>
                            </div>

                            <div className="border border-neutral-800/50 rounded-lg p-4">
                                <p className="text-neutral-300 text-sm leading-relaxed italic">
                                    Digital publication does not replace archival authority or registry validation.
                                </p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 pb-20 bg-neutral-900">
                <PageContainer>
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            Structural Boundaries
                        </h2>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                            <div className="space-y-2 mb-6">
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">No commercial brand partnerships through social platforms</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">No independent publication outside governance workflow</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                    <p className="text-neutral-300 text-sm">All content subject to institutional standards</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <a
                                    href="/governance/mithaq"
                                    className="inline-flex items-center gap-2 text-neutral-300 hover:text-amber-400 transition-colors text-xs"
                                >
                                    <Shield className="w-3.5 h-3.5" />
                                    View Governance Framework
                                </a>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>
        </Layout>
    );
}
