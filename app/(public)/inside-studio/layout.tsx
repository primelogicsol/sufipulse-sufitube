import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inside SufiPulse Studio USA',
  description: 'Behind the scenes of SufiPulse Studio USA: sacred acoustics, composition, and production discipline.',
  alternates: { canonical: 'https://sufipulse.com/inside-studio' },
};

export default function InsideStudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
