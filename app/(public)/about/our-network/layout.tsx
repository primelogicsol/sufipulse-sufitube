import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Cultural & Institutional Network',
  description: 'Explore the global cultural, artistic, and scholarly network of SufiPulse USA.',
  alternates: {
    canonical: 'https://sufipulse.com/about/our-network',
  },
};

export default function OurNetworkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
