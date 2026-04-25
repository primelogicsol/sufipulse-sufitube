import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Writers & Poets",
  description: "Discover Sufi writers and poets on SufiPulse — scholars and artists who contribute sacred kalam, Urdu poetry, and Sufi literary works rooted in the Kashmiri and South Asian tradition.",
  keywords: ["Sufi writers", "Sufi poets", "kalam writers", "Urdu poets", "Kashmir poets", "Sufi scholars", "Islamic poetry"],
  openGraph: {
    title: "Writers & Poets | SufiPulse",
    description: "Discover Sufi writers and poets who contribute sacred kalam and literary works on SufiPulse.",
    type: "website",
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com'}/writers`,
  },
};

export default function WritersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
