import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Writer Application | SufiPulse USA',
  alternates: { canonical: 'https://sufipulse.com/writers/apply' },
  robots: { index: false, follow: true },
};

export default function WritersApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
