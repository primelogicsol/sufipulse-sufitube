import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Release Protocol | Governance',
  description: 'Canonical release verification, human approval gate, and publication protocol at SufiPulse USA.',
  alternates: { canonical: 'https://sufipulse.com/governance/release-protocol' },
};

export default function ReleaseProtocolLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
