import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Releases",
  description: "Browse all SufiPulse releases — a curated collection of authentic Sufi music, qawwali, and devotional songs from Kashmir and the Indian Subcontinent. Stream, adopt, and support sacred music.",
  keywords: ["Sufi releases", "qawwali songs", "devotional music", "Kashmir music releases", "Sufi kalam audio", "Islamic music"],
  openGraph: {
    title: "Releases | SufiPulse",
    description: "Browse all SufiPulse releases — authentic Sufi music, qawwali, and devotional songs from Kashmir and the Indian Subcontinent.",
    type: "website",
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com'}/releases`,
  },
};

export default function ReleasesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
