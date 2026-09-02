import Link from 'next/link';
import { ArrowRight, BarChart3, Database, FileText, HardDrive, Languages, Plug, Send, Shield } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { StudioCardGrid, StudioGovernancePanel, StudioLinkCard, StudioSectionHeader } from '../../../components/studio/StudioLayoutComponents';

const operations = [
  {
    icon: Database,
    title: 'Release & Catalog Management',
    description: 'Maintains the canonical release record, catalog relationships, identifiers, release state, readiness, and archival continuity.'
  },
  {
    icon: FileText,
    title: 'Metadata & Credits Administration',
    description: 'Controls approved titles, descriptions, authorship, production credits, attribution records, and metadata consistency across delivery surfaces.'
  },
  {
    icon: Languages,
    title: 'Lyrics, Translation & Caption Operations',
    description: 'Maintains approved master lyrics, multilingual translations, caption timelines, subtitle assets, editorial status, and language delivery readiness.'
  },
  {
    icon: HardDrive,
    title: 'Media Asset & Version Control',
    description: 'Tracks audio masters, video masters, artwork, thumbnails, caption assets, revisions, validation state, and the relationship between production versions.'
  },
  {
    icon: Plug,
    title: 'Platform Integration & Distribution',
    description: 'Coordinates authorized platform connectors, release associations, external video identities, synchronization, and controlled distribution workflows.'
  },
  {
    icon: Send,
    title: 'Publishing & Delivery Management',
    description: 'Controls publication to SufiPulse-owned surfaces and coordinates approved delivery to external distribution endpoints.'
  },
  {
    icon: BarChart3,
    title: 'Analytics & Delivery Assurance',
    description: 'Verifies delivery state, monitors platform performance, detects synchronization exceptions, and supports release-level operational reporting.'
  }
];

const leadership = [
  {
    name: 'Michael “SufiPulse” Hartman',
    role: 'Studio Director & Lead Engineer',
    responsibility: 'Studio technical leadership, master-production oversight, engineering standards, and final technical coordination.'
  },
  {
    name: 'Arman Sayeed',
    role: 'Session Manager & Cultural Coordinator',
    responsibility: 'Session operations, production coordination, cultural alignment, cross-team workflow, and distributed collaboration support.'
  }
];

export default function StudioOperationsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.11),_transparent_48%)]" />
        <PageContainer>
          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-gold)]/30 bg-black/20 px-4 py-1">
              <span className="h-2 w-2 rounded-full bg-[var(--color-gold)]" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-gold)]">SufiPulse Studio USA — Central Operations</span>
            </div>
            <h1 className="font-serif text-[var(--text-hero)] font-bold leading-[1.08] tracking-tight text-[var(--color-text-primary)]">
              Studio Operations &<br className="hidden md:block" /> <span className="text-[var(--color-gold)]">Release Control</span>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-base sm:text-lg md:text-xl font-light leading-relaxed text-[var(--color-text-secondary)]">
              SufiPulse Studio USA is the central operational control layer connecting production masters, creative assets, release records, captions, platform delivery, owned publishing, and delivery assurance.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/studio" className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--color-gold)] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[var(--color-midnight)]">
                Studio Overview <ArrowRight size={16} />
              </Link>
              <Link href="/official-channels/operations" className="inline-flex items-center justify-center rounded-md border border-[var(--color-gold)]/50 px-6 py-3 text-sm font-bold uppercase tracking-wider text-[var(--color-gold)] hover:bg-[var(--color-gold)]/5">
                Distribution Operations
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <StudioSectionHeader
              title="Seven Studio Control Functions"
              subtitle="These functions provide the operational bridge between production, editorial approval, media assets, public publishing, external distribution, and release verification."
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
              title="Studio Leadership"
              subtitle="Existing public studio leadership remains the operational anchor of the expanded SufiPulse Studio USA structure."
            />
            <div className="grid gap-6 md:grid-cols-2">
              {leadership.map((person) => (
                <div key={person.name} className="rounded-2xl border border-white/10 bg-white/[0.025] p-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-gold)]">Studio Leadership</p>
                  <h3 className="mt-3 text-2xl font-bold text-white">{person.name}</h3>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-amber-400/80">{person.role}</p>
                  <p className="mt-5 text-sm leading-relaxed text-neutral-400">{person.responsibility}</p>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <StudioSectionHeader
              title="Operating Chain"
              subtitle="SufiPulse Studio USA maintains one governed release identity while specialist production and distribution functions work around it."
            />
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ['1', 'Audio Master', 'Music production and audio engineering'],
                ['2', 'Visual Master', 'Creative asset and video production'],
                ['3', 'Release Master', 'Catalog, lyrics, metadata, versions and approvals'],
                ['4', 'Distribution', 'SufiPulse, SufiTube and authorized external channels']
              ].map(([number, title, text]) => (
                <div key={number} className="rounded-2xl border border-white/10 bg-[var(--color-midnight)]/40 p-6">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-gold)] text-sm font-black text-[var(--color-midnight)]">{number}</div>
                  <h3 className="font-bold text-white">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="mx-auto max-w-5xl rounded-3xl border border-[var(--color-gold)]/20 bg-[var(--color-gold)]/[0.035] p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <Shield className="h-8 w-8 shrink-0 text-[var(--color-gold)]" />
              <div>
                <h2 className="text-2xl font-bold text-white">Canonical Release Authority</h2>
                <p className="mt-4 text-sm leading-relaxed text-neutral-400">The Studio record is the operational source of truth for approved lyrics, media masters, metadata, credits, translations, captions, platform associations, publication state, and delivery status. External platforms remain distribution endpoints rather than the institutional authority for the release.</p>
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      <StudioGovernancePanel
        title="Operational Control Under Governance"
        description="Studio Operations executes production and delivery workflows within the editorial, registry, release, and production-governance framework of SufiPulse USA."
        primaryCTA={{ label: 'Release Protocol', href: '/governance/release-protocol' }}
        secondaryCTA={{ label: 'Registry Authority', href: '/governance/diwan-e-amanat' }}
        shieldText="SufiPulse Studio USA — Central Release Control"
      />
    </>
  );
}
