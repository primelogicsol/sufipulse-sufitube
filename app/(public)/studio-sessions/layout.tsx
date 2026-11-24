import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Studio Sessions & Master Tracking",
  description: "Explore sacred recording sessions, artist collaboration protocols, and master acoustic tracking governed by SufiPulse USA central studios.",
  keywords: ["SufiPulse studio sessions", "sacred recording", "kalam acoustic tracking", "Sufi master tracks", "sacred music production"],
  openGraph: {
    title: "Studio Sessions & Master Tracking | SufiPulse USA",
    description: "Explore sacred recording sessions, artist collaboration protocols, and master acoustic tracking governed by SufiPulse USA central studios.",
    type: "website",
  },
  alternates: {
    canonical: 'https://sufipulse.com/studio-sessions',
  },
};

export default function StudioSessionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
