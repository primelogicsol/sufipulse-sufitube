import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "SufiPulse Studio & Production Center",
  description: "Central production hub of SufiPulse USA: audio engineering, artist roster, sacred composition, acoustic mastering, and release operations.",
  keywords: ["SufiPulse Studio", "sacred audio engineering", "Sufi master recordings", "sacred acoustics", "Virginia recording studio"],
  openGraph: {
    title: "SufiPulse Studio & Production Center | SufiPulse USA",
    description: "Central production hub of SufiPulse USA: audio engineering, artist roster, sacred composition, acoustic mastering, and release operations.",
    type: "website",
  },
  alternates: {
    canonical: 'https://sufipulse.com/studio',
  },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
