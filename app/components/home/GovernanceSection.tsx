"use client";
import Link from 'next/link';
import { Shield, TrendingUp, Music, Users, ArrowRight } from 'lucide-react';
import { Section } from '../layout/Section';
import { PageContainer } from '../layout/PageContainer';
import { Card } from '../primitives/Card';

export function GovernanceSection() {
  return (
    <Section background="slate" spacing="normal">
      <PageContainer>
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 sm:text-center">
            <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-4">
              Institutional Framework
            </div>
            <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
              Governed Structure for Sacred Content
            </h2>
            <p className="text-[var(--text-base)] md:text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-3xl md:mx-auto leading-[var(--leading-relaxed)]">
              SufiPulse operates under a comprehensive governance system with formal oversight mechanisms, transparent economic protocols, and institutional accountability standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <Card className="bg-[var(--color-midnight)]/40 border-[var(--color-text-tertiary)]/10 p-6 md:p-8">
              <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-[var(--color-gold)]" />
              </div>
              <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-3">
                Multi-Stakeholder Governance
              </h3>
              <p className="text-[var(--text-sm)] md:text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-6">
                Decision-making authority distributed across specialized oversight committees with documented accountability trails and constitutional alignment.
              </p>
              <Link href="/governance" className="text-[var(--text-sm)] text-[var(--color-gold)] hover:underline font-semibold flex items-center gap-2">
                View Framework <ArrowRight size={14} />
              </Link>
            </Card>

            <Card className="bg-[var(--color-midnight)]/40 border-[var(--color-text-tertiary)]/10 p-6 md:p-8">
              <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-[var(--color-gold)]" />
              </div>
              <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-3">
                Transparent Revenue Systems
              </h3>
              <p className="text-[var(--text-sm)] md:text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-6">
                All revenue streams tracked in real-time. Royalty agreements locked before production. Contributors receive quarterly statements with full audit trails.
              </p>
              <Link href="/governance/royalty-transparency" className="text-[var(--text-sm)] text-[var(--color-gold)] hover:underline font-semibold flex items-center gap-2">
                View Transparency Reports <ArrowRight size={14} />
              </Link>
            </Card>

            <Card className="bg-[var(--color-midnight)]/40 border-[var(--color-text-tertiary)]/10 p-6 md:p-8">
              <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-6">
                <Music className="w-6 h-6 text-[var(--color-gold)]" />
              </div>
              <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-3">
                Content Integrity Standards
              </h3>
              <p className="text-[var(--text-sm)] md:text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-6">
                Every submission reviewed against established criteria. Release protocols ensure alignment with Sufi tradition and institutional quality benchmarks.
              </p>
              <Link href="/governance/release-protocol" className="text-[var(--text-sm)] text-[var(--color-gold)] hover:underline font-semibold flex items-center gap-2">
                View Protocol <ArrowRight size={14} />
              </Link>
            </Card>

            <Card className="bg-[var(--color-midnight)]/40 border-[var(--color-text-tertiary)]/10 p-6 md:p-8">
              <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-[var(--color-gold)]" />
              </div>
              <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-3">
                Contributor Rights Protection
              </h3>
              <p className="text-[var(--text-sm)] md:text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-6">
                Writers, vocalists, and producers retain intellectual property rights. Formal agreements govern all collaborations with institutional mediation available.
              </p>
              <Link href="/contributor-policy" className="text-[var(--text-sm)] text-[var(--color-gold)] hover:underline font-semibold flex items-center gap-2">
                View Policy <ArrowRight size={14} />
              </Link>
            </Card>
          </div>
        </div>
      </PageContainer>
    </Section>
  );
}
