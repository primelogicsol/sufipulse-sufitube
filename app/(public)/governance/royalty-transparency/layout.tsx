import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Royalty Transparency | Governance',
  description: 'Transparent contributor attribution, sponsorship accounting, and royalty stewardship at SufiPulse USA.',
  alternates: { canonical: 'https://sufipulse.com/governance/royalty-transparency' },
};

export default function RoyaltyTransparencyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
