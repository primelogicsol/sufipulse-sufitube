import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Official Channels & Broadcasts",
  description: "Access verified distribution endpoints, 24/7 radio streaming, and official YouTube broadcast channels for SufiPulse USA master recordings.",
  keywords: ["SufiPulse official channels", "SufiPulse radio", "SufiPulse USA YouTube", "sacred music broadcast", "Sufi music streaming"],
  openGraph: {
    title: "Official Channels & Broadcasts | SufiPulse USA",
    description: "Access verified distribution endpoints, 24/7 radio streaming, and official YouTube broadcast channels for SufiPulse USA master recordings.",
    type: "website",
  },
  alternates: {
    canonical: 'https://sufipulse.com/official-channels',
  },
};

export default function OfficialChannelsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
