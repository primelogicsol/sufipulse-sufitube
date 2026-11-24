import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Producer Submission Received | SufiPulse USA',
  alternates: { canonical: 'https://sufipulse.com/producers/submitted' },
  robots: { index: false, follow: false },
};

export default function ProducersSubmittedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
