"use client";

import { LucideIcon, ArrowRight, Shield } from 'lucide-react';
import { Badge } from '../primitives/Badge';
import { Section } from '../layout/Section';
import { PageContainer } from '../layout/PageContainer';
import { Card } from '../primitives/Card';
import { PrimaryButton } from '../primitives/PrimaryButton';
import Link from 'next/link';
import React from 'react';

interface StudioHeroProps {
  badge: string;
  title: string;
  mysticalName: string;
  description: string;
  disclaimer?: string;
}

export function StudioHero({ badge, title, mysticalName, description, disclaimer }: StudioHeroProps) {
  return (
    <Section background="midnight" spacing="spacious">
      <PageContainer>
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6"><Badge variant="gold">{badge}</Badge></div>
          <h1 className="text-[var(--text-4xl)] md:text-[64px] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight">{title}</h1>
          <p className="text-[var(--text-xl)] text-[var(--color-gold)] font-medium mb-10 tracking-wide uppercase">{mysticalName}</p>
          <div className="max-w-3xl mx-auto">
            <p className="text-[var(--text-lg)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light mb-6 text-center">{description}</p>
            {disclaimer && (
              <div className="flex items-center justify-center gap-3 text-neutral-600">
                <Shield className="w-4 h-4" />
                <p className="font-black uppercase tracking-[0.3em] text-[10px]">{disclaimer}</p>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </Section>
  );
}

interface StudioSectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  centered?: boolean;
  align?: 'left' | 'center';
}

export function StudioSectionHeader({ title, subtitle, badge, centered = false, align }: StudioSectionHeaderProps) {
  const isCentered = align ? align === 'center' : centered;
  return (
    <div className={`mb-12 ${isCentered ? 'text-center' : 'text-center md:text-left'}`}>
      {badge && <Badge variant="neutral" className="mb-4">{badge}</Badge>}
      <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-4">{title}</h2>
      {subtitle && (
        <p className={`text-[var(--color-text-secondary)] ${isCentered ? 'max-w-3xl mx-auto' : 'max-w-2xl'}`}>{subtitle}</p>
      )}
    </div>
  );
}

export function StudioCardGrid({ children, cols = 4 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }[cols];
  return <div className={`grid gap-6 ${gridCols}`}>{children}</div>;
}

interface StudioLinkCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  subtitle?: string;
  className?: string;
  footerTags?: string[];
  href?: string;
}

export function StudioLinkCard({ icon: Icon, title, description, subtitle, className = "", footerTags, href }: StudioLinkCardProps) {
  const content = (
    <Card className={`bg-[var(--color-midnight)]/30 border-[var(--color-text-tertiary)]/10 h-full flex flex-col ${href ? 'hover:border-amber-400/30 transition-colors' : ''} ${className}`}>
      <div className="flex-1">
        <Icon className="w-8 h-8 text-[var(--color-gold)] mb-4" />
        <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-text-primary)] mb-2">{title}</h3>
        {subtitle && <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">{subtitle}</p>}
        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
      </div>
      {footerTags && footerTags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-white/5">
          {footerTags.map((tag, idx) => (
            <span key={idx} className="text-[10px] text-amber-400/70 bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/10 uppercase font-black tracking-tighter">{tag}</span>
          ))}
        </div>
      )}
    </Card>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }

  return content;
}

interface StudioGovernancePanelProps {
  title: string;
  description: string;
  primaryCTA?: { label: string; href: string };
  secondaryCTA?: { label: string; href: string };
  shieldText?: string;
  background?: 'midnight' | 'slate';
}

export function StudioGovernancePanel({ title, description, primaryCTA, secondaryCTA, shieldText = "Final Registry Authorization Required", background = "midnight" }: StudioGovernancePanelProps) {
  return (
    <Section background={background} spacing="normal" className="pb-24">
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-4">{title}</h2>
            <p className="text-[var(--color-text-secondary)]">{description}</p>
          </div>
          {(primaryCTA || secondaryCTA) && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              {primaryCTA && (
                <Link href={primaryCTA.href} className="w-full md:w-auto">
                  <PrimaryButton className="w-full md:w-auto min-w-[240px]">{primaryCTA.label}</PrimaryButton>
                </Link>
              )}
              {secondaryCTA && (
                <Link href={secondaryCTA.href} className="w-full md:w-auto">
                  <button className="w-full md:w-auto min-w-[240px] px-8 py-3.5 border-2 border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold-muted)] rounded-[var(--radius-sm)] transition-all font-medium uppercase tracking-wider">{secondaryCTA.label}</button>
                </Link>
              )}
            </div>
          )}
          <div className="mt-16 pt-8 border-t border-[var(--color-text-tertiary)]/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[var(--color-gold)]" />
              <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">{shieldText}</span>
            </div>
            <Link href="/governance" className="text-[var(--text-sm)] text-[var(--color-gold)] hover:underline font-medium">View Governance Framework →</Link>
          </div>
        </div>
      </PageContainer>
    </Section>
  );
}

interface StudioWorkflowRoadmapProps {
  title: string;
  badge?: string;
  steps: { id: number; title: string; desc: string; icon?: LucideIcon }[];
  activeId?: number;
  description?: string;
}

export function StudioWorkflowRoadmap({ title, badge, steps, activeId, description }: StudioWorkflowRoadmapProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  return (
    <Section background="midnight" spacing="normal">
      <PageContainer>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            {badge && <Badge variant="neutral" className="mb-4">{badge}</Badge>}
            <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)]">{title}</h2>
            {description && <p className="text-[var(--color-text-secondary)] mt-4 max-w-3xl mx-auto">{description}</p>}
          </div>
          <div className="relative group">
            <div ref={scrollRef} className="flex items-start gap-4 overflow-x-auto scrollbar-hide pb-8 px-4">
              {steps.map((stage) => {
                const Icon = stage.icon;
                return (
                  <div key={stage.id} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center text-center w-[180px]">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 font-bold ${stage.id === activeId ? 'bg-[var(--color-gold)] text-[var(--color-midnight)]' : 'bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 text-[var(--color-gold)]'}`}>
                        {Icon ? <Icon size={20} /> : stage.id}
                      </div>
                      <h4 className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)] mb-1">{stage.title}</h4>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider">{stage.desc}</p>
                    </div>
                    {stage.id < steps.length && <ArrowRight className="w-5 h-5 text-[var(--color-gold)]/20 mx-2 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
            <button onClick={() => scroll('left')} aria-label="Scroll roadmap left" className="absolute left-0 top-6 -translate-x-4 w-10 h-10 rounded-full bg-[var(--color-slate)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <button onClick={() => scroll('right')} aria-label="Scroll roadmap right" className="absolute right-0 top-6 translate-x-4 w-10 h-10 rounded-full bg-[var(--color-slate)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </PageContainer>
    </Section>
  );
}
