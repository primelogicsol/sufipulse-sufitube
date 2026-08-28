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
    <Section
      background="midnight"
      spacing="normal"
      className="relative isolate overflow-hidden pt-20 md:pt-32"
    >
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        <Image
          src="/sufipulse-home-hero-studio.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div
        className="absolute inset-0 -z-10 bg-[#0b1528]/65"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0b1528]/55 via-[#0b1528]/45 to-[#0b1528]/90"
        aria-hidden="true"
      />

      <PageContainer>
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="mb-4">
            <span className="inline-block px-4 py-1 border border-[var(--color-gold)]/30 rounded-full text-[var(--text-xs)] md:text-[var(--text-sm)] text-[var(--color-gold)] uppercase tracking-wider font-medium">
              Institutional Archive
            </span>
          </div>

          <h1 className="text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight">
            The House of Sacred<br className="hidden md:block" /> Word, Voice and Stewardship
          </h1>

          <p className="text-[var(--text-lg)] md:text-[var(--text-xl)] text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-10 leading-[var(--leading-relaxed)] font-light">
            SufiPulse Studio USA, managed by Dr. Kumar Foundation USA, is a disciplined institution dedicated to the authorship, performance, production, and entrusted release of sacred expression.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <Link href="/releases">
              <Image
                src="/sufitube-logo-v5.png"
                alt="Sufitube Logo"
                width={180}
                height={45}
                className="h-10 md:h-12 w-auto object-contain"
              />
            </Link>
            <Link href="/governance">
              <PrimaryButton variant="outline" size="medium" className="px-8">
                Governance Framework
              </PrimaryButton>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-12 border-t border-[var(--color-text-tertiary)]/10">
            <div>
              <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1">
                <CountUp target={kpiStats.releases} suffix="+" style={{ color: 'var(--color-gold)' }} />
              </div>
              <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">Releases</div>
            </div>
            <div>
              <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1">
                <CountUp target={kpiStats.writers} suffix="+" style={{ color: 'var(--color-gold)' }} />
              </div>
              <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">Active Writers</div>
            </div>
            <div>
              <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1">
                <CountUp target={100} suffix="%" style={{ color: 'var(--color-gold)' }} />
              </div>
              <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">Transparency</div>
            </div>
            <div>
              <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1">
                <CountUp target={kpiStats.institutions} style={{ color: 'var(--color-gold)' }} />
              </div>
              <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">Institutions</div>
            </div>
          </div>
        </div>
      </PageContainer>
    </Section>
  );
}
