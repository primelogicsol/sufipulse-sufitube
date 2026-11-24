import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Producer Application | SufiPulse USA',
  alternates: { canonical: 'https://sufipulse.com/producers/apply' },
  robots: { index: false, follow: true },
};

export default function ProducersApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
