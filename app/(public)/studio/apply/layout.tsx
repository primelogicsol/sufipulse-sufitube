import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studio Accreditation Application | SufiPulse USA',
  alternates: { canonical: 'https://sufipulse.com/studio/apply' },
  robots: { index: false, follow: true },
};

export default function StudioApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
