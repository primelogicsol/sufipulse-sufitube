"use client";
import Link from 'next/link';
import { Headphones, FileText } from 'lucide-react';
import { Section } from '../layout/Section';
import { PageContainer } from '../layout/PageContainer';
import { PrimaryButton } from '../primitives/PrimaryButton';

export function ArchitectureSection() {
  return (
    <Section background="midnight" spacing="normal">
      <PageContainer>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-4">
              Dual-Medium Architecture
            </div>
            <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
              Two Channels of Sacred Transmission
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="border-l-2 border-[var(--color-gold)] pl-6 md:pl-8">
              <div className="mb-6">
                <Headphones className="w-10 h-10 text-[var(--color-gold)] mb-4" />
                <h3 className="text-[var(--text-2xl)] font-bold text-[var(--color-text-primary)] mb-2">
                  Musical Registry
                </h3>
                <div className="text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-bold mb-4">
                  Studio Production Division
                </div>
              </div>
              <p className="text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-8">
                Vocal performances, instrumental arrangements, and audio engineering governed by production oversight protocols.
              </p>
              <div className="space-y-4 mb-10">
                {[
                  "Writer-vocalist-producer coordination system",
                  "Pre-production royalty agreement locking",
                  "Studio session documentation and archiving"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/releases">
                <PrimaryButton variant="secondary" size="medium">
                  View Musical Registry
                </PrimaryButton>
              </Link>
            </div>

            <div className="border-l-2 border-[var(--color-gold)] pl-6 md:pl-8">
              <div className="mb-6">
                <FileText className="w-10 h-10 text-[var(--color-gold)] mb-4" />
                <h3 className="text-[var(--text-2xl)] font-bold text-[var(--color-text-primary)] mb-2">
                  Literary Division
                </h3>
                <div className="text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-bold mb-4">
                  Editorial & Publishing Council
                </div>
              </div>
              <p className="text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-8">
                Essays, scholarly reflections, and written kalam published under editorial oversight ensuring intellectual rigor.
              </p>
              <div className="space-y-4 mb-10">
                {[
                  "Contributor credential verification system",
                  "Multi-stage editorial review process",
                  "Intellectual property protection protocols"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/literary-journal">
                <PrimaryButton variant="secondary" size="medium">
                  View Literary Division
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    </Section>
  );
}
