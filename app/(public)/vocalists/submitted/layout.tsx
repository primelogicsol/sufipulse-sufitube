import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vocalist Submission Received | SufiPulse USA',
  alternates: { canonical: 'https://sufipulse.com/vocalists/submitted' },
  robots: { index: false, follow: false },
};

export default function VocalistsSubmittedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
