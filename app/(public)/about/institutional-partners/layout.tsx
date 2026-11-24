import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Institutional Partners',
  description: 'Institutional partners and cultural foundations collaborating with SufiPulse USA.',
  alternates: {
    canonical: 'https://sufipulse.com/about/institutional-partners',
  },
};

export default function InstitutionalPartnersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
