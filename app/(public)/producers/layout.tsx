import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Music Producers & Composers (Ahl-e-Naghma)",
  description: "Join the SufiPulse USA production network. Access technical standards, musical composition guidelines, and sacred audio arrangement protocols.",
  keywords: ["Sufi music producers", "Ahl-e-Naghma", "sacred music composers", "Sufi audio engineering", "music production submission"],
  openGraph: {
    title: "Music Producers & Composers | SufiPulse USA",
    description: "Join the SufiPulse USA production network. Access technical standards, musical composition guidelines, and sacred audio arrangement protocols.",
    type: "website",
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com'}/producers`,
  },
};

export default function ProducersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
