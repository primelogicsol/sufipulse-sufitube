"use client";
import Link from 'next/link';
import Image from 'next/image';
import { PageContainer } from '../layout/PageContainer';
import { PrimaryButton } from '../primitives/PrimaryButton';
import { CountUp } from '../ui/CountUp';

interface HeroSectionProps {
  kpiStats: {
    releases: number;
    writers: number;
    institutions: number;
  };
}

export function HeroSection({ kpiStats }: HeroSectionProps) {
  return (
    <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
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
      <div className="relative z-10">
        <PageContainer>
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
              <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
              <span className="text-[11px] md:text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold">
                SufiPulse USA - Institutional Archive
              </span>
            </div>

            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
              The House of Sacred<br className="hidden md:block" />{" "}
              <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                Word, Voice and Stewardship
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-10 leading-[var(--leading-relaxed)] font-light drop-shadow">
              SufiPulse Studio USA, managed by Dr. Kumar Foundation USA, is a disciplined institution dedicated to the authorship, performance, production, and entrusted release of sacred expression.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
              <Link
                href="/releases"
                className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-[var(--color-slate)]/80 hover:bg-[var(--color-slate)] border border-[var(--color-gold)]/30 hover:border-[var(--color-gold)]/60 transition-all duration-300 shadow-xl backdrop-blur-md hover:scale-[1.02]"
              >
                <Image
                  src="/sufitube-logo-v5.png"
                  alt="Sufitube Logo"
                  width={160}
                  height={40}
                  className="h-8 md:h-10 w-auto object-contain"
                />
                <span className="text-xs font-bold text-[var(--color-gold)] group-hover:text-[var(--color-gold-hover)] uppercase tracking-wider pl-2 border-l border-white/10">
                  Explore Catalog →
                </span>
              </Link>

              <Link href="/governance">
                <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                  Governance Framework
                </PrimaryButton>
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

              <div>
                <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1 text-[var(--color-gold)]">
                  <CountUp target={100} suffix="%" style={{ color: 'var(--color-gold)' }} />
                </div>
                <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">
                  Transparency
                </div>
              </div>

              <div>
                <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1 text-[var(--color-gold)]">
                  <CountUp target={kpiStats.institutions} style={{ color: 'var(--color-gold)' }} />
                </div>
                <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">
                  Institutions
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>
    </section>
  );
}
