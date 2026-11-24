import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dr. Zarf-e-Noori — Lyricist, Composer & Music Producer',
  description:
    'Official biographical and artistic profile of Dr. Zarf-e-Noori — lyricist, composer, and music producer of SufiPulse USA sacred kalam and Sufi musical works.',
  alternates: {
    canonical: 'https://sufipulse.com/about/zarf-e-noori',
  },
  openGraph: {
    title: 'Dr. Zarf-e-Noori — Lyricist, Composer & Music Producer | SufiPulse USA',
    description:
      'Official profile of Dr. Zarf-e-Noori — lyricist, composer, and music producer of SufiPulse USA.',
    url: 'https://sufipulse.com/about/zarf-e-noori',
    type: 'profile',
  },
};

export default function ZarfENooriLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
