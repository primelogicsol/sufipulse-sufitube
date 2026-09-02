import Link from 'next/link';
import { ArrowRight, Film, Image as ImageIcon, Package, Palette, Shield, Video } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { StudioCardGrid, StudioGovernancePanel, StudioLinkCard, StudioSectionHeader } from '../../../components/studio/StudioLayoutComponents';

const subdivisions = [
  {
    icon: Video,
    title: 'Music Video Production',
    description: 'Develops the visual narrative of each release through scene planning, sequencing, pacing, footage selection, motion, and final video assembly.'
  },
  {
    icon: Palette,
    title: 'Visual Direction & Art Design',
    description: 'Defines the visual language of a release through art direction, color, typography, composition, imagery, symbolism, and mood.'
  },
  {
    icon: Package,
    title: 'Branding & Release Packaging',
    description: 'Maintains SufiPulse identity across title treatments, logo usage, opening and closing cards, credits, cover assets, and release presentation.'
  },
  {
    icon: ImageIcon,
    title: 'Thumbnail & Promotional Creative',
    description: 'Creates thumbnails, teaser graphics, campaign visuals, banners, announcement assets, and platform-specific promotional creative.'
  },
  {
    icon: Film,
    title: 'Video Post-Production & Mastering',
    description: 'Performs final edit review, visual timing, transitions, resolution and format checks, export preparation, and delivery-master validation.'
  }
];

const skillGroups = [
  ['Music Video Production', 'Visual storytelling • Scene sequencing • Motion pacing • Audio-to-picture synchronization'],
  ['Visual Direction & Art Design', 'Art direction • Typography • Color systems • Visual symbolism • Concept design'],
  ['Branding & Release Packaging', 'Release identity • Title cards • End cards • Credits • Brand consistency'],
  ['Thumbnail & Promotional Creative', 'Thumbnail strategy • Campaign creative • Teaser assets • Social presentation'],
  ['Video Post-Production & Mastering', 'Final edit • Resolution and format QC • Export profiles • Delivery master validation']
];

export default function CreativeAssetsDivisionPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.10),_transparent_45%)]" />
        <PageContainer>
          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-gold)]/30 bg-black/20 px-4 py-1">
              <span className="h-2 w-2 rounded-full bg-[var(--color-gold)]" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-gold)]">SufiPulse USA — Creative Production</span>
            </div>
            <h1 className="font-serif text-[var(--text-hero)] font-bold leading-[1.08] tracking-tight text-[var(--color-text-primary)]">
              Creative Asset<br className="hidden md:block" /> <span className="text-[var(--color-gold)]">Production Division</span>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-base sm:text-lg md:text-xl font-light leading-relaxed text-[var(--color-text-secondary)]">
              The division transforms an approved audio production into a coherent visual release system: music video, visual direction, release packaging, promotional creative, and a delivery-ready video master.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/studio" className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--color-gold)] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[var(--color-midnight)]">
                Studio Overview <ArrowRight size={16} />
              </Link>
              <Link href="/releases" className="inline-flex items-center justify-center rounded-md border border-[var(--color-gold)]/50 px-6 py-3 text-sm font-bold uppercase tracking-wider text-[var(--color-gold)] hover:bg-[var(--color-gold)]/5">
                View Releases
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <StudioSectionHeader
              title="Five Creative Asset Functions"
              subtitle="Each function contributes to a unified release identity while remaining coordinated with the audio master, release record, and platform-delivery requirements."
            />
            <StudioCardGrid cols={3}>
              {subdivisions.map((item) => (
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
              title="Creative Production Team Structure"
              subtitle="Publicly, SufiPulse identifies the accountable creative functions and skills. Individual personnel are published only when formally assigned and approved for public attribution."
            />
            <div className="grid gap-5 md:grid-cols-2">
              {skillGroups.map(([title, skills]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-7">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-gold)]">Creative Unit</p>
                  <h3 className="mt-2 text-lg font-bold text-white">{title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-neutral-400">{skills}</p>
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
                <h2 className="text-2xl font-bold text-white">Visual Mastering Within the Release Chain</h2>
                <p className="mt-4 text-sm leading-relaxed text-neutral-400">The division produces the visual and video masters, while SufiPulse Studio USA controls version identity, release status, metadata, captions, catalog association, publishing, and delivery verification. Production dependencies remain internal to the studio workflow and are not exposed as public release identity.</p>
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      <StudioGovernancePanel
        title="Creative Assets Under Release Control"
        description="Every visual master remains connected to a governed SufiPulse release record so that video, artwork, credits, metadata, and publication state remain synchronized."
        primaryCTA={{ label: 'Studio Operations', href: '/studio/operations' }}
        secondaryCTA={{ label: 'Official Channels', href: '/official-channels' }}
        shieldText="SufiPulse Studio USA — Creative Asset Governance"
      />
    </>
  );
}
