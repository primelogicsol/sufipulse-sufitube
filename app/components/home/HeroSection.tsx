import Link from 'next/link';
import Image from 'next/image';
import { PageContainer } from '../layout/PageContainer';
import { CountUp } from '../ui/CountUp';

interface HeroSectionProps {
  kpiStats: {
    releases: number;
    writers: number;
    institutions: number;
    globalReachImpressions?: number;
    countriesCount?: number;
  };
}

export function HeroSection({ kpiStats }: HeroSectionProps) {
  return (
    <section className="relative w-full min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[var(--color-midnight)] pb-16 md:pb-24 border-b border-[var(--color-border)] hero-bleed">
      {/* Cinematic Background Banner */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/banner1.png"
          alt="SufiPulse Studio Cinematic Session"
          fill
          priority
          quality={95}
          className="object-cover object-center scale-105 transform motion-safe:animate-fade-in"
        />
        {/* Layered brand gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-midnight)]/90 via-[var(--color-midnight)]/75 to-[var(--color-midnight)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[var(--color-midnight)]/70 to-[var(--color-midnight)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 pt-20 md:pt-32">
        <PageContainer>
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
              <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
              <span className="text-[11px] md:text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold">
                Official Platform · Rooted in Kashmir, Created for the World
              </span>
            </div>

            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-[var(--color-text-primary)] mb-6 leading-tight tracking-tight drop-shadow-md">
              SufiPulse
              <span className="block mt-3 font-sans text-2xl sm:text-3xl md:text-4xl font-medium text-[var(--color-gold)] leading-snug">
                The Official Home of Original Sufi Music &amp; Mystical Poetry
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-4 leading-[var(--leading-relaxed)] font-light drop-shadow">
              Discover original full-length Sufi recordings, sacred Kalam, Urdu poetry,
              lyrical interpretations, and contemplative world-fusion arrangements.
            </p>

            <p className="text-xs sm:text-sm text-[var(--color-text-tertiary)] max-w-3xl mx-auto mb-10 leading-relaxed tracking-wide">
              <Link href="/official-identity" className="hover:text-[var(--color-gold)] transition-colors">
                Canonical Home of SufiPulse (Sufi Pulse) · SufiPulse USA · SufiPulse Studio USA
              </Link>{' '}
              ·{' '}
              <Link href="/sufitube" className="hover:text-[var(--color-gold)] transition-colors">
                SufiTube (Sufi Tube)
              </Link>{' '}
              · Managed by Dr. Kumar Foundation USA
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/releases" className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-[var(--color-gold)] px-8 py-3.5 text-sm font-bold text-[var(--color-midnight)] transition-colors hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-gold)]">
                Explore Catalog &amp; Releases
              </Link>
              <Link href="/governance" className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-white/25 bg-[var(--color-midnight)]/80 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-gold)]">
                Governance Framework
              </Link>
            </div>

            {/* KPI Counter Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
              <div>
                <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1 text-[var(--color-gold)]">
                  <CountUp target={kpiStats.releases} suffix="+" style={{ color: 'var(--color-gold)' }} />
                </div>
                <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">
                  Releases
                </div>
              </div>

              <div>
                <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1 text-[var(--color-gold)]">
                  <CountUp target={kpiStats.writers} suffix="+" style={{ color: 'var(--color-gold)' }} />
                </div>
                <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">
                  Active Writers
                </div>
              </div>

              <Link href="/releases#global-reach-index" className="group block">
                <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1 text-[var(--color-gold)] group-hover:scale-105 transition-transform">
                  <CountUp target={Math.max(1, Math.round((kpiStats.globalReachImpressions || 1048614) / 1000000))} suffix="M+" style={{ color: 'var(--color-gold)' }} />
                </div>
                <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold group-hover:text-amber-400 transition-colors">
                  Global Reach Index
                </div>
              </Link>

              <Link href="/releases#global-reach-index" className="group block">
                <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1 text-[var(--color-gold)] group-hover:scale-105 transition-transform">
                  <CountUp target={kpiStats.countriesCount || 55} suffix="+" style={{ color: 'var(--color-gold)' }} />
                </div>
                <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold group-hover:text-amber-400 transition-colors">
                  Countries Reached
                </div>
              </Link>
            </div>
          </div>
        </PageContainer>
      </div>
    </section>
  );
}
