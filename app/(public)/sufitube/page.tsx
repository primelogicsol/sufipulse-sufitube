import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { PageContainer } from '../../components/layout/PageContainer';

export const metadata: Metadata = {
  title: 'SufiTube | Official Video & Sacred-Media Channel | SufiPulse',
  description:
    'SufiTube is the official video and sacred-media channel of SufiPulse USA — the audiovisual publishing identity for sacred music, kalam, Sufi poetry, premiere releases and contemplative visual works.',
  alternates: {
    canonical: 'https://sufipulse.com/sufitube',
  },
  openGraph: {
    title: 'SufiTube — Official Video & Sacred-Media Channel | SufiPulse USA',
    description:
      'SufiTube is the official video and audiovisual publishing channel of SufiPulse USA.',
    url: 'https://sufipulse.com/sufitube',
    siteName: 'SufiPulse',
    type: 'website',
  },
};

const sufitubeSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://sufipulse.com/sufitube#webpage',
  url: 'https://sufipulse.com/sufitube',
  name: 'SufiTube — Official Video & Sacred-Media Channel',
  description:
    'SufiTube is the official audiovisual publishing identity of SufiPulse USA.',
  isPartOf: { '@id': 'https://sufipulse.com/#organization' },
  about: {
    '@type': 'BroadcastChannel',
    name: 'SufiTube',
    broadcastChannelId: '@SufiPulse-USA',
    broadcastServiceTier: 'Premium',
    inBroadcastLineup: {
      '@type': 'CableOrSatelliteService',
      name: 'YouTube',
    },
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sufipulse.com' },
      { '@type': 'ListItem', position: 2, name: 'SufiTube', item: 'https://sufipulse.com/sufitube' },
    ],
  },
};

const FEATURES = [
  {
    label: 'Video Publishing Identity',
    body: 'SufiTube is the official YouTube and video identity under which SufiPulse USA publishes original releases, premieres, visual kalam and sacred-media content.',
  },
  {
    label: 'Not a Separate Organization',
    body: 'SufiTube is a branded publishing identity of SufiPulse USA, not a separate company or independent platform. All releases carry SufiPulse institutional authority.',
  },
  {
    label: 'Premiere Room',
    body: 'Official video premieres, scheduled releases and premiere-room events are coordinated through SufiTube and accessible via the SufiPulse Premiere Room.',
  },
  {
    label: 'Future Audiovisual Platform',
    body: 'SufiTube is designed to grow beyond YouTube as a standalone audiovisual platform for sacred Sufi media, contemplative cinema and digital cultural preservation.',
  },
];

const FLOW = [
  { label: 'SufiPulse', sub: 'Institutional & Creative Framework', highlight: false },
  { label: 'SufiPulse Studio USA', sub: 'Production & Creative Studio', highlight: false },
  { label: 'SufiPulse USA', sub: 'Official Artist & Public Release Identity', highlight: false },
  { label: 'SufiTube', sub: 'Video & Sacred-Media Channel', highlight: true },
  { label: 'Releases · Premieres · Catalog', sub: 'Published Works', highlight: false },
];

export default function SufiTubePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sufitubeSchema) }}
      />

      {/* ═══ 1. HERO ═════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[var(--color-midnight)] pb-16 md:pb-24 border-b border-[var(--color-border)] hero-bleed">
        {/* Cinematic background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/banner29.png"
            alt="SufiTube — Official Video & Sacred-Media Channel"
            fill
            priority
            quality={95}
            className="object-cover object-center scale-105 opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-midnight)]/90 via-[var(--color-midnight)]/70 to-[var(--color-midnight)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[var(--color-midnight)]/70 to-[var(--color-midnight)]" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <PageContainer>
            <div className="max-w-4xl mx-auto text-center mb-16">
              {/* Kicker */}
              <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
                <span className="text-xs text-[var(--color-gold)] uppercase tracking-widest font-bold">
                  OFFICIAL VIDEO & SACRED-MEDIA CHANNEL
                </span>
              </div>

              {/* H1 */}
              <h1 className="font-serif text-[clamp(3rem,8vw,6rem)] font-bold text-[var(--color-text-primary)] leading-[0.95] mb-4">
                SufiTube
              </h1>

              {/* H2 subtitle */}
              <h2 className="font-serif text-[clamp(1rem,2.5vw,1.5rem)] text-[var(--color-gold)] italic font-normal mb-6 leading-snug">
                Audiovisual Identity of SufiPulse USA
              </h2>

              {/* Supporting */}
              <p className="text-[var(--color-text-secondary)] text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
                SufiTube is the official video and audiovisual publishing channel of SufiPulse USA — the branded identity through which sacred music, mystical kalam, Sufi poetry, premiere releases and contemplative visual works are presented to the world.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://www.youtube.com/channel/UCraDr3i5A3k0j7typ6tOOsQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[var(--color-gold)] text-black font-bold text-sm uppercase tracking-widest hover:bg-[#FDE68A] transition-all duration-200 shadow-[0_0_24px_rgba(212,175,55,0.25)]"
                >
                  Visit Official YouTube Channel
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
                <Link
                  href="/official-channels"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[var(--color-gold)]/40 text-[var(--color-gold)] font-semibold text-sm uppercase tracking-widest hover:bg-[var(--color-gold)]/8 hover:border-[var(--color-gold)]/70 transition-all duration-200"
                >
                  View Official Channels
                </Link>
              </div>
            </div>
          </PageContainer>
        </div>
      </section>

      {/* ═══ 2. WHAT SUFITUBE IS ═══════════════════════════════════════════ */}
      <section className="bg-[var(--color-midnight)] py-20 md:py-28 border-b border-[var(--color-border)]">
        <PageContainer>
          <div className="mb-12">
            <div className="w-8 h-px bg-[var(--color-gold)]/40 mb-4" aria-hidden="true" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-3">
              What SufiTube Is
            </h2>
            <p className="text-[var(--color-text-secondary)] text-base max-w-xl leading-relaxed">
              SufiTube is the audiovisual publishing layer within the SufiPulse institutional framework — not a social media account, but a branded identity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="rounded-2xl border border-[var(--color-gold)]/10 bg-white/[0.02] p-6 flex flex-col gap-3 hover:border-[var(--color-gold)]/25 transition-colors"
              >
                <div className="w-4 h-px bg-[var(--color-gold)]/50" aria-hidden="true" />
                <h3 className="font-serif text-base font-bold text-[var(--color-text-primary)] leading-tight">
                  {f.label}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ═══ 3. IDENTITY ARCHITECTURE ══════════════════════════════════════ */}
      <section className="bg-[var(--color-slate,#0f1117)] py-20 md:py-28 border-b border-[var(--color-border)]">
        <PageContainer>
          <div className="text-center max-w-[820px] mx-auto mb-14">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-4">
              SufiTube in the SufiPulse Identity
            </h2>
            <p className="text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-[680px] mx-auto">
              SufiTube operates as the audiovisual publishing layer within the SufiPulse identity framework — beneath SufiPulse USA and above individual release records.
            </p>
          </div>

          {/* Vertical identity flow */}
          <div className="flex flex-col items-center gap-0 max-w-sm mx-auto">
            {FLOW.map((node, i) => (
              <div key={node.label} className="flex flex-col items-center w-full">
                <div
                  className={[
                    'w-full rounded-xl px-5 py-4 text-center border',
                    node.highlight
                      ? 'bg-[var(--color-gold)]/8 border-[var(--color-gold)]/35 shadow-[0_0_20px_rgba(212,175,55,0.08)]'
                      : 'bg-white/[0.02] border-[var(--color-border)]',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'font-serif text-sm font-bold leading-tight',
                      node.highlight ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-primary)]',
                    ].join(' ')}
                  >
                    {node.label}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5 uppercase tracking-wider">
                    {node.sub}
                  </p>
                </div>
                {i < FLOW.length - 1 && (
                  <div className="flex flex-col items-center py-1.5" aria-hidden="true">
                    <div className="w-px h-4 bg-[var(--color-gold)]/20" />
                    <svg className="w-3 h-3 text-[var(--color-gold)]/30" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M6 10L1 3h10z"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ═══ 4. OFFICIAL CHANNEL ══════════════════════════════════════════ */}
      <section className="bg-[var(--color-midnight)] py-20 md:py-28 border-b border-[var(--color-border)]">
        <PageContainer>
          <div className="max-w-2xl">
            <div className="w-8 h-px bg-[var(--color-gold)]/40 mb-4" aria-hidden="true" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-8">
              Official YouTube Channel
            </h2>

            {/* Channel card */}
            <div className="rounded-2xl border border-[var(--color-gold)]/15 bg-white/[0.02] p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* YouTube icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-700 flex items-center justify-center shadow-[0_0_18px_rgba(185,28,28,0.4)]">
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5" aria-hidden="true">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-[var(--color-text-primary)] text-base">@SufiPulse-USA</p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    Verified
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
                  Official SufiPulse USA YouTube channel — authenticated institutional identity
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="https://www.youtube.com/channel/UCraDr3i5A3k0j7typ6tOOsQ?sub_confirmation=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-red-700 text-white font-bold text-xs uppercase tracking-wide hover:bg-red-600 transition-colors"
                  >
                    Subscribe on YouTube
                  </a>
                  <Link
                    href="/official-channels"
                    className="inline-flex items-center gap-1 text-xs text-[var(--color-gold)]/80 hover:text-[var(--color-gold)] font-semibold transition-colors"
                  >
                    View all verified channels
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M2 6h8M6 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ═══ 5. RELEASE VERIFICATION ══════════════════════════════════════ */}
      <section className="bg-[var(--color-midnight)] py-16 md:py-20">
        <PageContainer>
          <div className="max-w-2xl border border-[var(--color-gold)]/10 rounded-2xl p-7 md:p-10 bg-[var(--color-gold)]/[0.02]">
            <div className="w-5 h-px bg-[var(--color-gold)]/40 mb-4" aria-hidden="true" />
            <h2 className="font-serif text-xl font-bold text-[var(--color-text-primary)] mb-3">
              Release Verification
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-5">
              All content published under the SufiTube identity carries SufiPulse institutional authority. Official releases are catalogued at SufiPulse.com/releases. Premiere schedules are listed in the Premiere Room.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/releases"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-gold)]/80 hover:text-[var(--color-gold)] transition-colors"
              >
                Release Catalog
                <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M2 6h8M6 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <span className="w-px h-3 bg-[var(--color-border)]" aria-hidden="true" />
              <Link
                href="/release-premieres"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-gold)]/80 hover:text-[var(--color-gold)] transition-colors"
              >
                Premiere Room
                <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M2 6h8M6 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <span className="w-px h-3 bg-[var(--color-border)]" aria-hidden="true" />
              <Link
                href="/official-channels"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-gold)]/80 hover:text-[var(--color-gold)] transition-colors"
              >
                Official Channels
                <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M2 6h8M6 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>
    </>
  );
}
