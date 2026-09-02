import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Database, MapPin, Mic2, Music, Settings, Shield, Video } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { PrimaryButton } from '../../components/primitives/PrimaryButton';
import { StudioCardGrid, StudioGovernancePanel, StudioLinkCard, StudioSectionHeader } from '../../components/studio/StudioLayoutComponents';

const operatingPillars = [
  {
    icon: Music,
    title: 'Music Production & Audio Engineering',
    description: 'Composition, arrangement, vocal production, audio mastering, and lyric-to-audio intelligence for the canonical production master.',
    href: '/studio/music-production'
  },
  {
    icon: Video,
    title: 'Creative Asset Production',
    description: 'Music video production, visual direction, release packaging, promotional creative, and delivery-ready video mastering.',
    href: '/studio/creative-assets'
  },
  {
    icon: Database,
    title: 'Studio Operations',
    description: 'Release and catalog control, metadata, lyrics, translations, captions, media versions, publishing, distribution, and delivery assurance.',
    href: '/studio/operations'
  },
  {
    icon: Settings,
    title: 'Studio Engineers',
    description: 'The established technical team responsible for engineering stewardship, sound architecture, vocal capture, mastering, and production coordination.',
    href: '/studio-engineers'
  }
];

const productionCapabilities = [
  {
    icon: Mic2,
    title: 'Recording & Session Production',
    description: 'Master-grade vocal capture, session coordination, and production support across approved studio environments.',
    href: '/studio-sessions'
  },
  {
    icon: Settings,
    title: 'Facilities & Technology',
    description: 'Technical environments, production equipment, studio systems, and engineering infrastructure supporting approved works.',
    href: '/inside-studio'
  },
  {
    icon: Music,
    title: 'Music Style Selection',
    description: 'Production-language and musical-style guidance connecting the character of the work to an appropriate sonic architecture.',
    href: '/production/music-style-selection'
  },
  {
    icon: Video,
    title: 'Platform & Video Distribution',
    description: 'Controlled relationship between approved SufiPulse releases and public video-distribution endpoints, including YouTube.',
    href: '/official-channels/operations'
  }
];

export default function Studio() {
  return (
    <>
      <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/banner8.png"
            alt="SufiPulse Studio USA production and release operations"
            fill
            priority
            quality={95}
            className="object-cover object-center scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-midnight)]/92 via-[var(--color-midnight)]/78 to-[var(--color-midnight)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[var(--color-midnight)]/65 to-[var(--color-midnight)]" />
        </div>

        <div className="relative z-10">
          <PageContainer>
            <div className="max-w-5xl mx-auto text-center">
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
                <span className="text-[11px] md:text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold">
                  SufiPulse Studio USA — Central Production Operations
                </span>
              </div>

              <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.08] tracking-tight drop-shadow-md">
                Production • Creative Assets<br className="hidden md:block" />{' '}
                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                  Release Operations
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed font-light max-w-3xl mx-auto mb-9 drop-shadow">
                SufiPulse Studio USA is the central production and release-control environment connecting the audio master, visual master, canonical release record, captions, metadata, public publishing, and platform distribution under one governed workflow.
              </p>

              <p className="text-[11px] uppercase tracking-[0.28em] font-black text-amber-400/75 mb-10">Karkhana-e-Sada — The Institutional Studio</p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <Link href="/studio/operations">
                  <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
                    Studio Operations
                  </PrimaryButton>
                </Link>
                <Link href="/studio-engineers">
                  <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                    Studio Team
                  </PrimaryButton>
                </Link>
              </div>
            </div>
          </PageContainer>
        </div>
      </section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <StudioSectionHeader
              title="SufiPulse Studio Operating Structure"
              subtitle="Four connected operating pillars manage the journey from musical production to visual mastering, canonical release control, and technical stewardship."
            />
            <StudioCardGrid cols={2}>
              {operatingPillars.map((item) => (
                <Link key={item.title} href={item.href} className="block h-full group">
                  <StudioLinkCard
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    className="group-hover:border-[var(--color-gold)]/35 transition-colors"
                  />
                </Link>
              ))}
            </StudioCardGrid>
          </div>
        </PageContainer>
      </Section>

      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <StudioSectionHeader
              title="Production Infrastructure & Distribution"
              subtitle="Existing studio capabilities remain active within the broader operating architecture and connect directly to governed release and distribution workflows."
            />
            <StudioCardGrid cols={2}>
              {productionCapabilities.map((item) => (
                <Link key={item.title} href={item.href} className="block h-full group">
                  <StudioLinkCard
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    className="group-hover:border-[var(--color-gold)]/35 transition-colors"
                  />
                </Link>
              ))}
            </StudioCardGrid>
          </div>
        </PageContainer>
      </Section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <StudioSectionHeader
              title="Central & Distributed Studio Architecture"
              subtitle="Physical and distributed production environments remain coordinated through the central SufiPulse Studio USA operating and governance framework."
            />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[var(--color-midnight)]/40 border border-[var(--color-gold)]/20 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6 text-[var(--color-gold)]" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Central Studio</h3>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/70 mt-1">USA — Virginia</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-neutral-400">
                  <li>Production and technical oversight</li>
                  <li>Canonical release and media-version control</li>
                  <li>Master validation and registry coordination</li>
                  <li>Publishing and distribution orchestration</li>
                </ul>
              </div>
              <div className="bg-[var(--color-midnight)]/40 border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6 text-[var(--color-gold)]" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Distributed Production Network</h3>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mt-1">Regional & Remote Collaboration</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-neutral-400">
                  <li>Regional production environments</li>
                  <li>Remote session and contributor coordination</li>
                  <li>Centralized technical review and release alignment</li>
                  <li>Consistent governance across production nodes</li>
                </ul>
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="max-w-5xl mx-auto rounded-3xl border border-[var(--color-gold)]/20 bg-[var(--color-gold)]/[0.035] p-8 md:p-10">
            <div className="flex flex-col md:flex-row gap-6 md:items-start">
              <Shield className="w-8 h-8 text-[var(--color-gold)] shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-white">One Canonical Release Chain</h2>
                <p className="mt-4 text-sm leading-relaxed text-neutral-400">
                  Audio production, creative assets, studio operations, and platform distribution are coordinated as functions of one SufiPulse release. External production and distribution technologies do not replace SufiPulse institutional identity, master records, governance, or registry authority.
                </p>
                <Link href="/studio/operations" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-gold)] hover:underline">
                  Explore Studio Operations <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      <StudioGovernancePanel
        title="Institutional Access & Governance"
        description="Studio participation, production functions, release controls, and distribution activity remain subject to SufiPulse governance, technical standards, and registry authorization."
        primaryCTA={{ label: 'Submit Studio Credentials', href: '/studio/apply' }}
        secondaryCTA={{ label: 'View Governance', href: '/governance' }}
        shieldText="SufiPulse Studio USA — Governed Production & Release Control"
        background="slate"
      />
    </>
  );
}
