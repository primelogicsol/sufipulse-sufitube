import Link from 'next/link';
import { Activity, ArrowRight, Mic2, Music, Radio, Settings, Shield } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { StudioCardGrid, StudioGovernancePanel, StudioLinkCard, StudioSectionHeader } from '../../../components/studio/StudioLayoutComponents';

const subdivisions = [
  {
    icon: Music,
    title: 'Composition & Song Development',
    description: 'Transforms approved lyrical and thematic material into structured song concepts, melodic direction, hooks, sections, and production-ready versions.'
  },
  {
    icon: Settings,
    title: 'Arrangement & Sound Design',
    description: 'Defines instrumentation, tempo, sonic architecture, texture, dynamics, spatial character, and the overall production language of each work.'
  },
  {
    icon: Mic2,
    title: 'Vocal Production',
    description: 'Directs vocal character, phrasing, pronunciation, interpretation, performance treatment, and the relationship between voice and composition.'
  },
  {
    icon: Radio,
    title: 'Audio Production & Mastering',
    description: 'Brings the production to a release-ready audio master through technical review, balance, final processing, format validation, and quality control.'
  },
  {
    icon: Activity,
    title: 'Lyrics Alignment & Audio Intelligence',
    description: 'Connects the approved lyric record to the performed audio through line timing, word-level alignment, waveform analysis, and synchronization data.'
  }
];

const team = [
  {
    function: 'Composition & Song Development',
    people: 'Michael “SufiPulse” Hartman • Arman Sayeed',
    skills: 'Production direction, song-development oversight, session coordination, cultural context and production alignment.'
  },
  {
    function: 'Arrangement & Sound Design',
    people: 'Ryan Cole',
    skills: 'Mixing architecture, sonic structuring, sound design, instrumentation balance and immersive spatial production.'
  },
  {
    function: 'Vocal Production',
    people: 'Lucas Ray',
    skills: 'Vocal recording, performance capture, multilingual voice work, vocal processing and spiritual voice preservation.'
  },
  {
    function: 'Audio Production & Mastering',
    people: 'Michael “SufiPulse” Hartman • Elijah James',
    skills: 'Production engineering, final technical oversight, mastering, effects design, distribution-grade validation and audio quality control.'
  },
  {
    function: 'Lyrics Alignment & Audio Intelligence',
    people: 'Studio Audio Intelligence Function',
    skills: 'Lyric-line timing, word alignment, waveform interpretation, caption timing preparation and synchronization quality assurance.'
  }
];

export default function MusicProductionDivisionPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.10),_transparent_46%)]" />
        <PageContainer>
          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-gold)]/30 bg-black/20 px-4 py-1">
              <span className="h-2 w-2 rounded-full bg-[var(--color-gold)]" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-gold)]">SufiPulse USA — Production Division</span>
            </div>
            <h1 className="font-serif text-[var(--text-hero)] font-bold leading-[1.08] tracking-tight text-[var(--color-text-primary)]">
              Music Production &<br className="hidden md:block" /> <span className="text-[var(--color-gold)]">Audio Engineering Division</span>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-base sm:text-lg md:text-xl font-light leading-relaxed text-[var(--color-text-secondary)]">
              The division develops the musical and sonic master of a SufiPulse work, from composition and arrangement through vocal production, mastering, and lyric-to-audio synchronization.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/studio" className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--color-gold)] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[var(--color-midnight)]">
                Studio Overview <ArrowRight size={16} />
              </Link>
              <Link href="/studio-engineers" className="inline-flex items-center justify-center rounded-md border border-[var(--color-gold)]/50 px-6 py-3 text-sm font-bold uppercase tracking-wider text-[var(--color-gold)] hover:bg-[var(--color-gold)]/5">
                Studio Engineers
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <StudioSectionHeader
              title="Five Production Functions"
              subtitle="A unified path from approved creative direction to a technically validated audio master and synchronized lyric timeline."
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
              title="Associated Studio Team"
              subtitle="Existing SufiPulse studio personnel are aligned to the functions supported by their published engineering roles. Specialized automation functions remain capability-based rather than being assigned to an invented public staff identity."
            />
            <div className="space-y-4">
              {team.map((item) => (
                <div key={item.function} className="grid gap-5 rounded-2xl border border-white/10 bg-white/[0.025] p-6 md:grid-cols-[1.05fr_1fr_1.6fr] md:items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-gold)]">Subdivision</p>
                    <h3 className="mt-2 font-bold text-white">{item.function}</h3>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-600">Associated Team</p>
                    <p className="mt-2 text-sm font-semibold text-neutral-200">{item.people}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-neutral-400">{item.skills}</p>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-gold)]/20 bg-[var(--color-midnight)]/40 p-8">
              <Shield className="mb-5 h-7 w-7 text-[var(--color-gold)]" />
              <h2 className="text-xl font-bold text-white">Canonical Audio Responsibility</h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-400">The division prepares and validates the production master. Release metadata, publication state, captions, catalog records, and downstream delivery remain controlled through SufiPulse Studio USA.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[var(--color-midnight)]/40 p-8">
              <Activity className="mb-5 h-7 w-7 text-[var(--color-gold)]" />
              <h2 className="text-xl font-bold text-white">Alignment as Production Data</h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-400">Timing and alignment data are treated as internal production intelligence that feeds approved lyrics, captions, translations, and synchronized release assets without exposing private production dependencies.</p>
            </div>
          </div>
        </PageContainer>
      </Section>

      <StudioGovernancePanel
        title="Production Under Studio Governance"
        description="Audio production remains subordinate to editorial approval, master validation, release controls, and registry authority across the SufiPulse system."
        primaryCTA={{ label: 'Studio Operations', href: '/studio/operations' }}
        secondaryCTA={{ label: 'Production Oversight', href: '/governance/production-oversight' }}
        shieldText="SufiPulse Studio USA — Master Production Governance"
      />
    </>
  );
}
