import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Majlis-e-Nazr — Editorial & Lyrical Review Council',
  description: 'Majlis-e-Nazr: lyrical, theological, and literary review governance at SufiPulse USA.',
  alternates: { canonical: 'https://sufipulse.com/governance/majlis-e-nazr' },
};

export default function MajlisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
