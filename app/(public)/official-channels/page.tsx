"use client";
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Video, Headphones, Globe, Shield, ExternalLink, Radio, Youtube, Music2, Music, Instagram, Twitter, Facebook, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { StudioHero, StudioSectionHeader, StudioCardGrid, StudioLinkCard, StudioGovernancePanel } from '../../components/studio/StudioLayoutComponents';

export default function OfficialChannels() {
    const digitalMandates = [
        {
            icon: Video,
            title: 'Video Archive',
            description: 'Official release publications and visual documentation across verified visual platforms.'
        },
        {
            icon: Headphones,
            title: 'Audio Distribution',
            description: 'Structured streaming access and high-fidelity audio presence across global networks.'
        },
        {
            icon: Globe,
            title: 'Global Outreach',
            description: 'Cross-regional accessibility and public engagement through authorized digital channels.'
        },
        {
            icon: Shield,
            title: 'Institutional Verification',
            description: 'All official channels are maintained under centralized governance and archival oversight.'
        }
    ];

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
            <StudioHero 
                badge="Digital Distribution"
                title="SufiTube"
                mysticalName="Official Channels & Verified Presence"
                description="SufiPulse maintains verified digital channels for distribution, publication, and institutional communication. These platforms serve as structured extensions of our archival and production framework."
            />

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Digital Mandate & Distribution Scope"
                            subtitle="Digital platforms function as distribution endpoints. They do not replace institutional governance or archival authority."
                        />

                        <StudioCardGrid cols={4}>
                            {digitalMandates.map((item, idx) => (
                                <StudioLinkCard 
                                    key={idx}
                                    icon={item.icon}
                                    title={item.title}
                                    description={item.description}
                                />
                            ))}
                        </StudioCardGrid>
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Verified Distribution Platforms"
                            subtitle="Owned and authorized channels for SufiPulse content"
                        />

                        <div className="space-y-8">
                            {/* ── SufiPulse Radio — Owned Layer ───────────────────────────────── */}
                            <div className="elite-card p-10 md:p-12 border-amber-400/20 bg-linear-to-br from-amber-400/5 to-transparent relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Radio size={160} className="text-amber-400" />
                                </div>
                                
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-amber-400/10 rounded-2xl border border-amber-400/20">
                                                <Radio className="w-8 h-8 text-amber-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-bold text-white tracking-tight">SufiPulse Radio</h3>
                                                <span className="text-[10px] font-black text-amber-400 bg-amber-400/5 border border-amber-400/10 px-3 py-1 rounded-full uppercase tracking-widest mt-2 inline-block">Owned Channel</span>
                                            </div>
                                        </div>
                                        <p className="text-neutral-400 text-lg leading-relaxed font-light">
                                            Official continuous audio broadcast environment featuring authorized releases and curated spiritual soundscapes.
                                        </p>
                                        <div className="p-6 bg-black/40 border border-white/5 rounded-2xl">
                                            <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.4em] mb-2">Institutional Purpose</p>
                                            <p className="text-neutral-300 text-sm font-medium">Owned broadcast presence across the SufiPulse ecosystem, serving as the primary real-time audio endpoint.</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <a 
                                            href={`/api/track-click?type=playlist&slug=sufipulse-radio&action=brand_asset_click&assetType=website&assetName=SufiPulse+Radio&sourcePage=official-channels&redirect=${encodeURIComponent('/releases')}`}
                                            className="px-10 py-5 bg-amber-400 text-black font-black uppercase text-[11px] tracking-[0.3em] rounded-xl hover:bg-amber-500 transition-all flex items-center justify-center gap-3 shadow-2xl"
                                        >
                                            Access Broadcast <ArrowRight size={14} />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* ── Third-party verified platforms ────────────────────────────── */}
                            <div className="grid md:grid-cols-2 gap-8">
                                {platforms.map((platform) => (
                                    <div key={platform.name} className="elite-card p-10 flex flex-col h-full group hover:border-amber-400/30 transition-all shadow-2xl">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-white/[0.03] rounded-xl border border-white/10 group-hover:border-amber-400/20 transition-colors">
                                                        <platform.icon className="w-6 h-6 text-neutral-400 group-hover:text-amber-400" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white tracking-tight">{platform.name}</h3>
                                                </div>
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">Verified</span>
                                            </div>
                                            <p className="text-neutral-400 text-base leading-relaxed mb-8">{platform.description}</p>
                                            <div className="p-6 bg-black/20 border border-white/5 rounded-2xl mb-10">
                                                <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.4em] mb-2">Distribution Purpose</p>
                                                <p className="text-neutral-300 text-xs font-medium leading-relaxed uppercase tracking-wider">{platform.purpose}</p>
                                            </div>
                                        </div>
                                        {(() => {
                                            const platformSlug = platform.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                            const trackUrl = `/api/track-click?type=playlist&slug=${platformSlug}&action=brand_asset_click&assetType=${platformSlug === 'youtube' ? 'youtube_channel' : platformSlug}&assetName=${encodeURIComponent(platform.name)}&sourcePage=official-channels&redirect=${encodeURIComponent(platform.url)}`;
                                            return (
                                                <a 
                                                    href={trackUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="w-full py-4 bg-white/[0.03] hover:bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 hover:text-white transition-all"
                                                >
                                                    {platform.buttonText} <ExternalLink size={12} />
                                                </a>
                                            );
                                        })()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <StudioSectionHeader 
                            title="Operational Clarity"
                            subtitle="Defining the relationship between institutional authority and digital endpoints"
                        />

                        <div className="elite-card p-10 md:p-12 mb-12">
                            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                                {[
                                    'Digital channels are distribution extensions',
                                    'Governance remains strictly centralized',
                                    'Content integrity precedes publication',
                                    'Public presence does not override institutional process'
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 group">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:shadow-[0_0_10px_rgba(212,175,55,0.6)] transition-all" />
                                        <p className="text-neutral-300 text-[11px] font-bold uppercase tracking-widest">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-black/20 border border-white/5 rounded-xl p-8 text-center max-w-3xl mx-auto shadow-xl">
                            <p className="text-neutral-500 text-sm leading-relaxed italic">
                                "Digital publication does not replace archival authority or registry validation. Authentic presence is anchored in governance."
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <StudioGovernancePanel 
                title="Structural Boundaries"
                description="Official channels follow institutional protocols. No commercial brand partnerships or independent publications occur outside the documented governance workflow."
                primaryCTA={{ label: "View Governance Charter", href: "/governance/mithaq" }}
                shieldText="Governed Digital Presence"
                background="midnight"
            />

            <style jsx global>{`
                .elite-card {
                    background: rgba(18, 18, 18, 0.4);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    border-radius: 32px;
                    box-shadow: 
                        0 20px 40px rgba(0,0,0,0.4),
                        inset 0 1px 1px rgba(255,255,255,0.02);
                }
            `}</style>
        </Layout>
    );
}
