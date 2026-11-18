import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Music Production & Sound Architecture",
  description: "Acoustic architecture, melodic composition, vocal production, and audio mastering standards across all SufiPulse USA master productions.",
  keywords: ["Sufi music production", "sacred audio engineering", "vocal production", "acoustic arrangement", "mastering standards"],
  openGraph: {
    title: "Music Production & Sound Architecture | SufiPulse USA",
    description: "Acoustic architecture, melodic composition, vocal production, and audio mastering standards across all SufiPulse USA master productions.",
    type: "website",
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com'}/studio/music-production`,
  },
};

export default function MusicProductionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
