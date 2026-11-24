import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Production Oversight Protocol',
  description: 'Sacred audio-visual production oversight and mastering standards at SufiPulse Studio USA.',
  alternates: { canonical: 'https://sufipulse.com/governance/production-oversight' },
};

export default function ProductionOversightLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
