import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Writer Submission Received | SufiPulse USA',
  alternates: { canonical: 'https://sufipulse.com/writers/submitted' },
  robots: { index: false, follow: false },
};

export default function WritersSubmittedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
