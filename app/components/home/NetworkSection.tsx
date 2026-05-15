"use client";
import Link from 'next/link';
import { ArrowRight, Pen, Mic, Disc3, Feather } from 'lucide-react';
import { Section } from '../layout/Section';
import { PageContainer } from '../layout/PageContainer';
import { Card } from '../primitives/Card';

export function NetworkSection() {
  const roles = [
    { icon: Pen, label: 'Writers', mystical: 'Ahl-e-Qalam', href: '/writers' },
    { icon: Mic, label: 'Vocalists', mystical: 'Ahl-e-Sada', href: '/vocalists' },
    { icon: Disc3, label: 'Producers', mystical: 'Ahl-e-Naghma', href: '/producers' },
    { icon: Feather, label: 'Journalists', mystical: 'Ahl-e-Tahreer', href: '/literary-contributors' }
  ];

  return (
    <Section background="midnight" spacing="normal">
      <PageContainer>
        <div className="max-w-6xl mx-auto">
          <div className="sm:text-center mb-16">
            <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-4">
              Creative Ecosystem
            </div>
            <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
              Verified Contributors
            </h2>
            <p className="text-[var(--text-base)] md:text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-3xl md:mx-auto leading-[var(--leading-relaxed)]">
              Join a community of vocalists, writers, and producers creating sacred content under institutional oversight.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role, i) => (
              <Link key={i} href={role.href} className="group">
                <Card className="h-full bg-[var(--color-slate)]/20 border-[var(--color-text-tertiary)]/10 p-8 hover:border-[var(--color-gold)]/40 transition-all duration-500 text-center">
                  <div className="w-14 h-14 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-500">
                    <role.icon className="w-6 h-6 text-[var(--color-gold)]" />
                  </div>
                  <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-1 uppercase tracking-wide group-hover:text-[var(--color-gold)] transition-colors">
                    {role.label}
                  </h3>
                  <p className="text-[var(--text-xs)] text-[var(--color-gold)] font-bold uppercase tracking-[0.2em] mb-4 opacity-70">
                    {role.mystical}
                  </p>
                  <div className="text-[var(--text-xs)] text-[var(--color-gold)] font-bold flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    APPLY NOW <ArrowRight size={12} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </PageContainer>
    </Section>
  );
}
