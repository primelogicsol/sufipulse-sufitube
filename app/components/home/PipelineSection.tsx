"use client";
import { Section } from '../layout/Section';
import { PageContainer } from '../layout/PageContainer';

export function PipelineSection() {
  const steps = [
    { 
      step: '01', 
      title: 'Submission & Review', 
      desc: 'Writers submit kalam through formal application system for committee review.',
      meta: 'Review Period: 14-21 days'
    },
    { 
      step: '02', 
      title: 'Production', 
      desc: 'Approved content assigned to vocalists and producers under oversight protocols.',
      meta: 'Phase: 4-8 weeks'
    },
    { 
      step: '03', 
      title: 'Registry Lock', 
      desc: 'Final approval from governance body before public distribution across platforms.',
      meta: 'Reporting: Quarterly'
    }
  ];

  return (
    <Section background="slate" spacing="normal">
      <PageContainer>
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 sm:text-center">
            <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-4">
              Institutional Workflow
            </div>
            <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
              Production Pipeline
            </h2>
            <p className="text-[var(--text-base)] md:text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-3xl md:mx-auto leading-[var(--leading-relaxed)]">
              A standardized, multi-stage approval process governs all content from initial submission through public release.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((item, i) => (
              <div key={i}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[var(--color-gold)] rounded-lg flex items-center justify-center flex-shrink-0 text-[var(--color-midnight)] font-bold text-xl">
                    {item.step}
                  </div>
                  <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-text-primary)]">
                    {item.title}
                  </h3>
                </div>
                <div className="border-l-2 border-[var(--color-gold)]/20 pl-6 ml-6 pb-2">
                  <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed mb-4">
                    {item.desc}
                  </p>
                  <div className="text-[11px] text-[var(--color-gold)] uppercase tracking-widest font-bold">
                    {item.meta}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </Section>
  );
}
