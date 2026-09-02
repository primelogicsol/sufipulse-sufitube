import Link from 'next/link';
import { ArrowRight, BarChart3, Languages, ListVideo, RefreshCw, Search, Shield, Video, Youtube } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { StudioCardGrid, StudioGovernancePanel, StudioLinkCard, StudioSectionHeader } from '../../../components/studio/StudioLayoutComponents';

const operations = [
  {
    icon: Video,
    title: 'Video Publishing & Channel Operations',
    description: 'Coordinates approved video publication, scheduling, visibility, channel organization, and the release lifecycle across authorized video endpoints.'
  },
  {
    icon: Search,
    title: 'Metadata & Discoverability',
    description: 'Maintains release titles, descriptions, searchable context, platform metadata, and discoverability alignment with the canonical SufiPulse release record.'
  },
  {
    icon: Languages,
    title: 'Caption & Localization Delivery',
    description: 'Prepares and delivers approved language tracks, subtitles, caption revisions, and localization metadata for supported release surfaces.'
  },
  {
    icon: ListVideo,
    title: 'Playlist & Catalog Distribution',
    description: 'Organizes releases into governed playlists and catalog groupings while preserving the relationship between video identities and SufiPulse catalog records.'
  },
  {
    icon: BarChart3,
    title: 'Audience Analytics & Performance',
    description: 'Interprets impressions, click-through rate, retention, traffic sources, geography, and other platform signals for release-level operational insight.'
  },
  {
    icon: RefreshCw,
    title: 'Delivery Synchronization & Verification',
    description: 'Checks whether approved release assets and platform states remain synchronized, identifies delivery exceptions, and records verified outcomes.'
  }
];

export default function PlatformDistributionOperationsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.10),_transparent_46%)]" />
        <PageContainer>
          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-gold)]/30 bg-black/20 px-4 py-1">
              <Youtube className="h-3.5 w-3.5 text-[var(--color-gold)]" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-gold)]">SufiPulse USA — Platform & Video Distribution</span>
            </div>
            <h1 className="font-serif text-[var(--text-hero)] font-bold leading-[1.08] tracking-tight text-[var(--color-text-primary)]">
              Platform & Video<br className="hidden md:block" /> <span className="text-[var(--color-gold)]">Distribution Operations</span>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-base sm:text-lg md:text-xl font-light leading-relaxed text-[var(--color-text-secondary)]">
              This operating layer manages the relationship between governed SufiPulse releases and public video-distribution endpoints, with YouTube serving as the primary external video channel.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/official-channels" className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--color-gold)] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[var(--color-midnight)]">
                Official Channels <ArrowRight size={16} />
              </Link>
              <Link href="/studio/operations" className="inline-flex items-center justify-center rounded-md border border-[var(--color-gold)]/50 px-6 py-3 text-sm font-bold uppercase tracking-wider text-[var(--color-gold)] hover:bg-[var(--color-gold)]/5">
                Studio Operations
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <StudioSectionHeader
              title="Six Distribution Functions"
              subtitle="Public distribution is managed as a controlled extension of the SufiPulse release system, not as a replacement for studio, editorial, or registry authority."
            />
            <StudioCardGrid cols={3}>
              {operations.map((item) => (
                <StudioLinkCard key={item.title} icon={item.icon} title={item.title} description={item.description} />
              ))}
            </StudioCardGrid>
          </div>
        </PageContainer>
      </Section>

      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <StudioSectionHeader
              title="Operating Relationship"
              subtitle="The distribution layer receives approved release assets from SufiPulse Studio USA and returns public platform identity, state, and performance signals to the controlled release workflow."
            />
            <div className="grid gap-6 md:grid-cols-3">
              {[
                ['FROM STUDIO', 'Approved video master, metadata, captions, localization assets and release readiness.'],
                ['TO PUBLIC CHANNELS', 'Governed publication and supported distribution assets.'],
                ['BACK TO STUDIO', 'Video identity, publication state, delivery verification and audience-performance signals.']
              ].map(([label, text]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.025] p-7">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--color-gold)]">{label}</p>
                  <p className="mt-4 text-sm leading-relaxed text-neutral-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="mx-auto max-w-5xl rounded-3xl border border-[var(--color-gold)]/20 bg-[var(--color-midnight)]/45 p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <Shield className="h-8 w-8 shrink-0 text-[var(--color-gold)]" />
              <div>
                <h2 className="text-2xl font-bold text-white">Distribution Endpoint, Not Release Authority</h2>
                <p className="mt-4 text-sm leading-relaxed text-neutral-400">YouTube and other external services remain distribution surfaces. Canonical lyrics, credits, release metadata, master versions, translations, caption revisions, and governance state remain controlled by SufiPulse Studio USA and its registry framework.</p>
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      <StudioGovernancePanel
        title="Distribution Under Studio Control"
        description="Platform delivery follows release approval, asset validation, metadata integrity, and registry controls. Public distribution does not alter the institutional source of truth."
        primaryCTA={{ label: 'Official Channels', href: '/official-channels' }}
        secondaryCTA={{ label: 'Release Protocol', href: '/governance/release-protocol' }}
        shieldText="SufiPulse USA — Controlled Platform Distribution"
      />
    </>
  );
}
