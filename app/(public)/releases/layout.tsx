import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Sufi Songs & Releases",
  description: "Browse authentic Sufi songs, qawwali masters, and devotional music releases from SufiPulse USA. Stream full audio recordings, explore sacred lyrics, and support independent sacred musicians.",
  keywords: ["Sufi songs", "Sufi releases", "qawwali recordings", "devotional music", "Kashmir music releases", "Sufi kalam audio", "Islamic sacred music"],
  openGraph: {
    title: "Sufi Songs & Releases | SufiPulse USA",
    description: "Browse authentic Sufi songs, qawwali masters, and devotional music releases from SufiPulse USA. Stream full audio recordings, explore sacred lyrics, and support independent sacred musicians.",
    type: "website",
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com'}/releases`,
  },
};

export default function ReleasesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
