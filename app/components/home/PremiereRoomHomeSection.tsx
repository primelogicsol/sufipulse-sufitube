"use client";

import { PageContainer } from '../layout/PageContainer';
import { Section } from '../layout/Section';
import { HeroCTAGroup } from '../ui/HeroCTAGroup';
import { useState } from 'react';
import { PremiereReleaseCard } from '../releases/PremiereReleaseCard';

export function PremiereRoomHomeSection({ premieres }: { premieres: any[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!premieres || premieres.length === 0) return null;

  const sorted = [...premieres].sort((a, b) => {
    if (a.premiereOrder !== undefined && b.premiereOrder !== undefined) {
      return a.premiereOrder - b.premiereOrder;
    }
    return new Date(a.officialReleaseAt || a.premiereDate || 0).getTime() - new Date(b.officialReleaseAt || b.premiereDate || 0).getTime();
  });

  const release = sorted[activeIndex];

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % sorted.length);
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + sorted.length) % sorted.length);

  return (
    <Section background="midnight" className="border-b border-[var(--color-border)] relative overflow-hidden py-16 md:py-20 lg:py-24">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[var(--color-gold)]/10 via-transparent to-transparent" />
      </div>
      <PageContainer className="relative z-10 max-w-[1360px] mx-auto">
        
        <PremiereReleaseCard 
          release={release} 
          variant="homepage" 
          onNext={handleNext}
          onPrev={handlePrev}
          currentIndex={activeIndex}
          totalCount={sorted.length}
        />

        {/* Anchored Section Navigation */}
        <div className="mt-12 lg:mt-16 pt-8 lg:pt-10 border-t border-white/5 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-[var(--color-midnight)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]/40" />
          </div>
          <HeroCTAGroup 
            primary={{ label: "EXPLORE PREMIERES", href: "/release-premieres" }}
            secondary={{ label: "PREMIERE GOVERNANCE", href: "/governance" }}
          />
        </div>
      </PageContainer>
    </Section>
  );
}
