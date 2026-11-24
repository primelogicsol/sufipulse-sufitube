import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Institutional Governance & Sacred Stewardship',
  description: 'Explore the constitutional, editorial, and artistic governance framework of SufiPulse USA.',
  alternates: { canonical: 'https://sufipulse.com/governance' },
};

export default function GovernanceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
