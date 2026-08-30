import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import {
  StudioSectionHeader,
  StudioCardGrid,
  StudioLinkCard,
} from '../../components/studio/StudioLayoutComponents';
import {
  Shield,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Globe,
  Link2,
  Layers,
  FileText,
  MessageSquare,
  Archive,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Official Identity | SufiPulse USA',
  description:
    'Verify the official identity, channels, releases, institutional relationships and public media properties of SufiPulse, SufiPulse USA and SufiPulse Studio USA.',
  alternates: {
    canonical: 'https://sufipulse.com/official-identity',
  },
  openGraph: {
    title: 'Official Identity | SufiPulse USA',
    description:
      'The authoritative reference for SufiPulse identity, affiliation, channels, releases and institutional verification.',
    url: 'https://sufipulse.com/official-identity',
    siteName: 'SufiPulse',
    type: 'website',
  },
};

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://sufipulse.com/official-identity#webpage',
  url: 'https://sufipulse.com/official-identity',
  name: 'Official Identity | SufiPulse USA',
  description:
    'The authoritative reference for SufiPulse identity, affiliation, channels, releases and institutional verification.',
  isPartOf: { '@type': 'WebSite', '@id': 'https://sufipulse.com/#website' },
  about: { '@type': 'Organization', '@id': 'https://sufipulse.com/#organization' },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sufipulse.com' },
      { '@type': 'ListItem', position: 2, name: 'Institutional Identity', item: 'https://sufipulse.com/about/what-is-sufipulse' },
      { '@type': 'ListItem', position: 3, name: 'Official Identity', item: 'https://sufipulse.com/official-identity' },
    ],
  },
};

function Divider() {
  return <div className="border-t border-[var(--color-border-strong)] my-2" />;
}

function VerificationCriterion({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 py-3 border-b border-[var(--color-border)]/50 last:border-0">
      <CheckCircle className="w-4 h-4 text-[var(--color-gold)] mt-0.5 flex-shrink-0" />
      <span className="text-[var(--color-text-secondary)] text-sm leading-relaxed">{children}</span>
    </li>
  );
}

function IdentityTierRow({
  tier, name, role, description,
}: { tier: string; name: string; role: string; description: string; }) {
  return (
    <div className="flex gap-4 md:gap-8 items-start py-6 border-b border-[var(--color-border)] last:border-0">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 flex items-center justify-center">
        <span className="text-[var(--color-gold)] text-xs font-black">{tier}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-base mb-0.5">{name}</p>
        <p className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-widest mb-2">{role}</p>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function OfficialIdentityPage() {
  const currentMonth = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      {/* 1. HERO */}
      <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/banner4.png"
            alt=""
            aria-hidden="true"
            fill
            priority
            quality={90}
            className="object-cover object-center opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-midnight)]/85 via-[var(--color-midnight)]/70 to-[var(--color-midnight)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[var(--color-midnight)]/60 to-[var(--color-midnight)]" />
        </div>
        <div className="relative z-10">
          <PageContainer>
            <div className="max-w-5xl mx-auto text-center">
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
                <span className="text-[11px] md:text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold">
                  Institutional Identity
                </span>
              </div>
              <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                Official{' '}
                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                  Identity
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-4 drop-shadow">
                The authoritative reference for SufiPulse identity, affiliation, channels, releases and institutional relationships.
              </p>
              <p className="text-sm text-[var(--color-text-tertiary)] max-w-2xl mx-auto mb-10">
                Verify the source. Understand the institution. Follow only authenticated SufiPulse properties.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/official-channels"
                  className="px-8 py-3.5 bg-[var(--color-gold)] hover:bg-[#FDE68A] text-[var(--color-midnight)] font-bold rounded-[var(--radius-sm)] shadow-xl transition-all uppercase tracking-wider text-sm flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Verify Official Channels
                </Link>
                <Link
                  href="/about/what-is-sufipulse"
                  className="px-8 py-3.5 border border-[var(--color-gold)]/40 hover:border-[var(--color-gold)]/70 text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] font-medium rounded-[var(--radius-sm)] transition-all text-sm backdrop-blur-md"
                >
                  What is SufiPulse
                </Link>
              </div>
            </div>
          </PageContainer>
        </div>
      </section>

      {/* 2. CANONICAL IDENTITY */}
      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <StudioSectionHeader
              title="Canonical Identity"
              subtitle="SufiPulse is an institutional and creative media identity developed for the creation, documentation, interpretation, production and public presentation of contemporary Sufi-inspired music, kalam, poetry and associated cultural discourse."
            />
            <StudioCardGrid cols={3}>
              <StudioLinkCard
                icon={Layers}
                title="SufiPulse"
                subtitle="Institutional & Creative Media Identity"
                description="The overarching identity through which SufiPulse creative, editorial, musical, scholarly and cultural activities are organized and presented."
                footerTags={['Institution', 'Creative Identity']}
              />
              <StudioLinkCard
                icon={Globe}
                title="SufiPulse USA"
                subtitle="Official Public Music & Distribution Identity"
                description="The public-facing music identity through which official releases, video publications, premiere activity and authenticated SufiPulse media are presented."
                footerTags={['Public Identity', 'Distribution']}
              />
              <StudioLinkCard
                icon={Archive}
                title="SufiPulse Studio USA"
                subtitle="Production & Creative Studio Identity"
                description="The production framework responsible for developing and coordinating authorized SufiPulse creative works, recordings, media and associated release materials."
                footerTags={['Production', 'Studio']}
              />
            </StudioCardGrid>
          </div>
        </PageContainer>
      </Section>

      {/* 3. IDENTITY ARCHITECTURE */}
      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="max-w-4xl mx-auto">
            <StudioSectionHeader
              title="How the SufiPulse Identity Is Organized"
              subtitle="SufiPulse uses related identities for different functions. These identities should be understood as parts of a coordinated public and creative framework rather than as interchangeable account names."
            />
            <div className="bg-[var(--color-slate)]/30 border border-[var(--color-border-strong)] rounded-2xl overflow-hidden">
              <IdentityTierRow tier="1" name="SufiPulse" role="Institutional Framework"
                description="The root institutional identity governing editorial standards, release governance, contributor attribution, and cultural stewardship across all SufiPulse activities." />
              <div className="px-8 py-2 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-[var(--color-gold)]/40 rotate-90" />
                <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest">Coordinates</span>
              </div>
              <IdentityTierRow tier="2" name="SufiPulse Studio USA" role="Production & Creative Studio"
                description="Responsible for developing, recording and coordinating authorized SufiPulse creative works — from composition through final release materials." />
              <div className="px-8 py-2 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-[var(--color-gold)]/40 rotate-90" />
                <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest">Publishes through</span>
              </div>
              <IdentityTierRow tier="3" name="SufiPulse USA" role="Public Distribution Identity"
                description="The authenticated public identity through which official SufiPulse releases reach audiences — via YouTube, DSPs, the Premiere Room and sufipulse.com." />
              <div className="px-8 py-2 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-[var(--color-gold)]/40 rotate-90" />
                <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest">Delivered to</span>
              </div>
              <IdentityTierRow tier="↓" name="Official Releases · YouTube · DSPs · Premiere Room" role="Authenticated Public Endpoints"
                description="All authenticated release and distribution endpoints are listed in the Official Channels registry and linked from sufipulse.com." />
            </div>
          </div>
        </PageContainer>
      </Section>

      {/* 4. VERIFICATION STANDARD */}
      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-4xl mx-auto">
            <StudioSectionHeader
              title="How Official SufiPulse Identity Is Verified"
              subtitle={'Use of the words \u201cSufiPulse\u201d, \u201cSufi Pulse\u201d, \u201cSufiPulse USA\u201d or similar terminology alone does not establish affiliation with SufiPulse.'}
            />
            <div className="bg-[var(--color-midnight)]/60 border border-[var(--color-border-strong)] rounded-2xl p-6 md:p-8 mb-8">
              <p className="text-[var(--color-gold)] text-xs font-black uppercase tracking-widest mb-4">
                A property, release or account should be treated as officially affiliated only when one or more of the following can be verified:
              </p>
              <ul className="space-y-0">
                <VerificationCriterion>It is directly linked from SufiPulse.com.</VerificationCriterion>
                <VerificationCriterion>It is listed in the SufiPulse Official Channels registry.</VerificationCriterion>
                <VerificationCriterion>It appears within an authenticated SufiPulse release record.</VerificationCriterion>
                <VerificationCriterion>It is associated with official SufiPulse release metadata.</VerificationCriterion>
                <VerificationCriterion>It is expressly identified within an authorized institutional SufiPulse record.</VerificationCriterion>
                <VerificationCriterion>Its relationship can be independently verified through the relevant platform or distribution record.</VerificationCriterion>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/official-channels"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--color-gold)] hover:bg-[#FDE68A] text-[var(--color-midnight)] font-bold rounded-[var(--radius-sm)] transition-all uppercase tracking-wider text-sm">
                <Shield className="w-4 h-4" />
                View Official Channels
              </Link>
              <Link href="/governance"
                className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-gold)] transition-colors inline-flex items-center gap-1">
                Governance Framework <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </PageContainer>
      </Section>

      {/* 5. OFFICIAL CHANNELS */}
      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="max-w-4xl mx-auto">
            <StudioSectionHeader
              title="Official Channels"
              subtitle="SufiPulse maintains a separate Official Channels registry as the authoritative directory of recognized public distribution and social-media properties."
            />
            <div className="bg-[var(--color-slate)]/40 border border-[var(--color-border-strong)] rounded-2xl p-6 md:p-8 mb-6">
              <div className="flex items-start gap-4">
                <Shield className="w-5 h-5 text-[var(--color-gold)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-3">
                    The Official Channels registry is the single authoritative source for verified SufiPulse public endpoints. Only channels listed there and linked from SufiPulse.com carry institutional authentication.
                  </p>
                  <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
                    Learn how SufiPulse determines official identity and affiliation before interacting with any account presenting itself as an official SufiPulse property.
                  </p>
                </div>
              </div>
            </div>
            <Link href="/official-channels"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-[var(--color-gold)]/40 hover:border-[var(--color-gold)]/70 hover:bg-[var(--color-gold)]/5 text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] font-medium rounded-[var(--radius-sm)] transition-all text-sm">
              <Link2 className="w-4 h-4" />
              View Official Channels Registry
            </Link>
          </div>
        </PageContainer>
      </Section>

      {/* 6. RELEASE VERIFICATION */}
      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-4xl mx-auto">
            <StudioSectionHeader
              title="Verify an Official SufiPulse Release"
              subtitle="An official SufiPulse release may be authenticated using combinations of the following identifiers and records."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                { icon: FileText, label: 'Official Release Title', note: 'Canonical title in the SufiPulse Registry' },
                { icon: Globe, label: 'SufiPulse Release Page', note: 'sufipulse.com/releases' },
                { icon: BookOpen, label: 'Artist Identity & Credits', note: 'Structured contributor attribution' },
                { icon: Archive, label: 'YouTube Video ID', note: 'Linked from authenticated release record' },
                { icon: FileText, label: 'UPC / ISRC', note: 'Distribution identifiers where applicable' },
                { icon: CheckCircle, label: 'Premiere Record', note: 'Listed in the Premiere Room' },
                { icon: FileText, label: 'Release Date & Distributor', note: 'DSP metadata chain' },
                { icon: BookOpen, label: 'Institutional Documentation', note: 'Governance and provenance records' },
              ].map(({ icon: Icon, label, note }) => (
                <div key={label}
                  className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-midnight)]/30">
                  <Icon className="w-4 h-4 text-[var(--color-gold)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-semibold">{label}</p>
                    <p className="text-[var(--color-text-tertiary)] text-xs mt-0.5">{note}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/releases"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--color-gold)] hover:bg-[#FDE68A] text-[var(--color-midnight)] font-bold rounded-[var(--radius-sm)] transition-all uppercase tracking-wider text-sm">
                Explore Releases
              </Link>
              <Link href="/release-premieres"
                className="inline-flex items-center gap-2 px-6 py-3.5 border border-[var(--color-gold)]/30 hover:border-[var(--color-gold)]/60 text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] font-medium rounded-[var(--radius-sm)] transition-all text-sm">
                Premiere Room <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </PageContainer>
      </Section>

      {/* 7. INSTITUTIONAL RELATIONSHIPS */}
      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="max-w-4xl mx-auto">
            <StudioSectionHeader
              title="Institutional Relationships"
              subtitle="SufiPulse participates within a broader institutional and cultural ecosystem. The relationships below reflect a coordinated framework of creative collaboration, cultural stewardship and educational mission."
            />
            <div className="space-y-4">
              {[
                { name: 'Sufi Science Center USA', relationship: 'Cultural & Educational Relationship',
                  note: 'A connected institutional ecosystem supporting knowledge, scholarship and Sufi cultural research.' },
                { name: 'Dr. Kumar Foundation USA', relationship: 'Creative Collaboration',
                  note: 'A stewardship relationship supporting the preservation and interpretation of Sufi heritage.' },
                { name: 'Interfaith Peace Bridge USA', relationship: 'Institutional Engagement',
                  note: 'Media infrastructure relationship within interfaith dialogue and cultural exchange.' },
                { name: 'Purple Soul Collective USA', relationship: 'Creative Collaboration',
                  note: 'A connected creative relationship within the SufiPulse media and production ecosystem.' },
              ].map(({ name, relationship, note }) => (
                <div key={name}
                  className="p-5 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-slate)]/30 flex items-start gap-4">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--color-gold)]/60 mt-2" />
                  <div>
                    <p className="text-white font-semibold text-sm mb-0.5">{name}</p>
                    <p className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-wider mb-1">{relationship}</p>
                    <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">{note}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link href="/about/our-network"
                className="inline-flex items-center gap-2 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-gold)] transition-colors">
                View Our Network <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </PageContainer>
      </Section>

      {/* 8. AFFILIATION CLARIFICATION */}
      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-4xl mx-auto">
            <StudioSectionHeader
              title="Identity & Affiliation Clarification"
              subtitle="This section exists to prevent confusion, not to characterize any specific third party."
            />
            <div className="bg-[var(--color-midnight)]/80 border border-[var(--color-border-strong)] rounded-2xl p-6 md:p-10 space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-[var(--color-gold)]" />
                </div>
                <p className="text-[var(--color-text-secondary)] text-base leading-relaxed">
                  Identical or similar terminology may be used independently by third-party artists, channels, organizations, businesses, playlists, websites or social-media accounts.
                </p>
              </div>
              <Divider />
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[var(--color-gold)]" />
                </div>
                <p className="text-[var(--color-text-secondary)] text-base leading-relaxed">
                  The presence of the words &ldquo;SufiPulse&rdquo;, &ldquo;Sufi Pulse&rdquo; or a similar designation should not by itself be interpreted as evidence of affiliation, authorization, sponsorship, endorsement, collaboration or catalog ownership.
                </p>
              </div>
              <Divider />
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-[var(--color-gold)]" />
                </div>
                <p className="text-[var(--color-text-secondary)] text-base leading-relaxed">
                  SufiPulse authenticates its own institutional relationships and public properties through SufiPulse.com and expressly designated official records.
                </p>
              </div>
              <Divider />
              <p className="text-[var(--color-text-tertiary)] text-sm leading-relaxed pt-2">
                For verification of an account, release, communication or institutional relationship, consult the{' '}
                <Link href="/official-channels" className="text-[var(--color-gold)] hover:underline">Official Channels registry</Link>{' '}
                or contact SufiPulse through an authenticated SufiPulse.com channel.
              </p>
            </div>
          </div>
        </PageContainer>
      </Section>

      {/* 9. CREATIVE PROVENANCE */}
      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="max-w-4xl mx-auto">
            <StudioSectionHeader
              title="Creative Provenance"
              subtitle="Official SufiPulse works are documented through structured creative, production and release records intended to preserve authorship, attribution, catalog continuity and institutional provenance."
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {[
                'Authorship & Composition','Music Direction','Vocals & Performance',
                'Studio & Production Records','Release Metadata','ISRC & UPC',
                'Editorial Notes','Lyrics & Translations','Contributor Attribution',
                'Premiere Records','Institutional Documentation','Release Date Chain',
              ].map((item) => (
                <div key={item}
                  className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] py-2 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-slate)]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]/60 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <Link href="/releases"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--color-gold)] hover:bg-[#FDE68A] text-[var(--color-midnight)] font-bold rounded-[var(--radius-sm)] transition-all uppercase tracking-wider text-sm">
              Explore Releases
            </Link>
          </div>
        </PageContainer>
      </Section>

      {/* 10. VERIFICATION ASSISTANCE */}
      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-4xl mx-auto">
            <StudioSectionHeader title="Need to Verify Something?" />
            <div className="bg-[var(--color-midnight)]/60 border border-[var(--color-border-strong)] rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <MessageSquare className="w-5 h-5 text-[var(--color-gold)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[var(--color-text-secondary)] text-base leading-relaxed mb-4">
                    If you encounter an account, release, collaboration request, sponsorship claim, institutional communication or media property presenting itself as affiliated with SufiPulse and cannot verify that relationship through this website, contact SufiPulse before relying upon the claim.
                  </p>
                  <Link href="/contact"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-gold)] hover:bg-[#FDE68A] text-[var(--color-midnight)] font-bold rounded-[var(--radius-sm)] transition-all uppercase tracking-wider text-sm">
                    Contact SufiPulse
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      {/* 11. FINAL NOTICE */}
      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="max-w-4xl mx-auto">
            <div className="border-t border-[var(--color-border-strong)] pt-8">
              <p className="text-[var(--color-text-tertiary)] text-sm leading-relaxed mb-3">
                Official identity information published on this page is maintained as part of SufiPulse&rsquo;s public institutional record and may be updated when channels, platforms, distribution relationships or organizational structures change.
              </p>
              <div className="flex flex-wrap items-center gap-6 text-xs text-[var(--color-text-tertiary)]">
                <span>Last reviewed: {currentMonth}</span>
                <Link href="/legal/disclaimer" className="hover:text-[var(--color-gold)] transition-colors inline-flex items-center gap-1">
                  Disclaimer <ArrowRight className="w-3 h-3" />
                </Link>
                <Link href="/terms-of-service" className="hover:text-[var(--color-gold)] transition-colors inline-flex items-center gap-1">
                  Terms of Service <ArrowRight className="w-3 h-3" />
                </Link>
                <Link href="/governance" className="hover:text-[var(--color-gold)] transition-colors inline-flex items-center gap-1">
                  Governance <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>
    </>
  );
}
