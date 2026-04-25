import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Vocalists & Artists",
  description: "Explore SufiPulse vocalists — artists who perform and record authentic Sufi music, qawwali, and devotional kalam rooted in the South Asian and Kashmiri Sufi tradition.",
  keywords: ["Sufi vocalists", "qawwali singers", "Sufi artists", "devotional singers", "Kashmir vocalists", "Islamic music artists"],
  openGraph: {
    title: "Vocalists & Artists | SufiPulse",
    description: "Explore artists who perform authentic Sufi music and qawwali on SufiPulse.",
    type: "website",
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com'}/vocalists`,
  },
};

export default function VocalistsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
