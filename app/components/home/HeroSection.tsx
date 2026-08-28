"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Section } from '../layout/Section';
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
    <div className="relative w-full overflow-hidden bg-neutral-950">
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
        {/* Cinematic Multi-Layer Gradient Overlays for Maximum Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/85 via-neutral-950/75 to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-neutral-950/60 to-neutral-950" />
        <div className="absolute inset-0 bg-neutral-950/30 backdrop-blur-[1px]" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 pt-24 md:pt-36 pb-16 md:pb-24">
        <PageContainer>
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 border border-amber-500/30 rounded-full bg-neutral-900/80 backdrop-blur-md shadow-lg shadow-amber-500/5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] md:text-xs text-amber-300 uppercase tracking-widest font-bold">
                Institutional Studio Archive
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight drop-shadow-md">
              The House of Sacred<br className="hidden md:block" />{" "}
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                Word, Voice & Stewardship
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-neutral-300 max-w-3xl mx-auto mb-10 leading-relaxed font-light drop-shadow">
              SufiPulse Studio USA, managed by Dr. Kumar Foundation USA, is a disciplined institution dedicated to the authorship, performance, production, and entrusted release of sacred expression.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16">
              <Link
                href="/releases"
                className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-amber-500/30 hover:border-amber-400/60 transition-all duration-300 shadow-xl backdrop-blur-md hover:scale-[1.02]"
              >
                <Image
                  src="/sufitube-logo-v5.png"
                  alt="Sufitube Logo"
                  width={160}
                  height={40}
                  className="h-8 md:h-10 w-auto object-contain"
                />
                <span className="text-xs font-bold text-amber-300/90 group-hover:text-amber-200 uppercase tracking-wider pl-2 border-l border-white/10">
                  Explore Catalog →
                </span>
              </Link>

              <Link href="/governance">
                <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md bg-neutral-900/60 border-neutral-700 hover:border-amber-400/50">
                  Governance Framework
                </PrimaryButton>
              </Link>
            </div>

            {/* KPI Counter Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-10 border-t border-white/10 bg-neutral-950/40 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
              <div>
                <div className="text-2xl md:text-4xl font-bold mb-1 text-amber-400">
                  <CountUp target={kpiStats.releases} suffix="+" style={{ color: '#fbbf24' }} />
                </div>
                <div className="text-[10px] md:text-xs text-neutral-400 uppercase tracking-widest font-semibold">
                  Catalog Releases
                </div>
              </div>

              <div>
                <div className="text-2xl md:text-4xl font-bold mb-1 text-amber-400">
                  <CountUp target={kpiStats.writers} suffix="+" style={{ color: '#fbbf24' }} />
                </div>
                <div className="text-[10px] md:text-xs text-neutral-400 uppercase tracking-widest font-semibold">
                  Active Writers
                </div>
              </div>

              <div>
                <div className="text-2xl md:text-4xl font-bold mb-1 text-amber-400">
                  <CountUp target={100} suffix="%" style={{ color: '#fbbf24' }} />
                </div>
                <div className="text-[10px] md:text-xs text-neutral-400 uppercase tracking-widest font-semibold">
                  Transparency
                </div>
              </div>

              <div>
                <div className="text-2xl md:text-4xl font-bold mb-1 text-amber-400">
                  <CountUp target={kpiStats.institutions} style={{ color: '#fbbf24' }} />
                </div>
                <div className="text-[10px] md:text-xs text-neutral-400 uppercase tracking-widest font-semibold">
                  Institutions
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
