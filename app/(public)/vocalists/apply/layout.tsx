import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vocalist Application | SufiPulse USA',
  alternates: { canonical: 'https://sufipulse.com/vocalists/apply' },
  robots: { index: false, follow: true },
};

export default function VocalistsApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
