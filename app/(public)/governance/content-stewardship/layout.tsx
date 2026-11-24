import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content Stewardship | Governance',
  description: 'Editorial, theological, and artistic stewardship standards governing SufiPulse USA releases.',
  alternates: { canonical: 'https://sufipulse.com/governance/content-stewardship' },
};

export default function ContentStewardshipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
