import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Creative Assets & Visual Standards | SufiPulse Studio',
  description: 'Visual identity, calligraphy, and canonical release artwork standards at SufiPulse Studio.',
  alternates: { canonical: 'https://sufipulse.com/studio/creative-assets' },
};

export default function StudioCreativeAssetsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
