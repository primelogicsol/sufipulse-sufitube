import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About SufiPulse USA | Sacred Music & Cultural Archive",
  description: "Learn about SufiPulse USA — an institutional archive and sacred-media production platform preserving authentic Sufi music, mystical poetry, and Kashmiri cultural heritage.",
  openGraph: {
    title: "About SufiPulse USA | Sacred Music & Cultural Archive",
    description: "Learn about SufiPulse USA — an institutional archive and sacred-media production platform preserving authentic Sufi music, mystical poetry, and Kashmiri cultural heritage.",
    type: "website",
  },
  alternates: {
    canonical: 'https://sufipulse.com/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
