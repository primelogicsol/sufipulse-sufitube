import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studio Operations | Karkhana-e-Sada',
  description: 'Master recording workflow, archival audio standards, and release operations at SufiPulse Studio.',
  alternates: { canonical: 'https://sufipulse.com/studio/operations' },
};

export default function StudioOperationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
