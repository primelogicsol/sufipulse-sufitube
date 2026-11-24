import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Diwan-e-Amanat — Custodial Archive Governance',
  description: 'Diwan-e-Amanat: custodial stewardship and archival permanence protocol at SufiPulse USA.',
  alternates: { canonical: 'https://sufipulse.com/governance/diwan-e-amanat' },
};

export default function DiwanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
