import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dr. Fayaz Khan — Founder of SufiPulse USA',
  description:
    'Learn about Dr. Fayaz Khan (pen name Dr. Zarf-e-Noori), founder of SufiPulse USA and custodian of its sacred Sufi music and literary archive.',
  alternates: {
    canonical: 'https://sufipulse.com/about/founder',
  },
  openGraph: {
    title: 'Dr. Fayaz Khan — Founder of SufiPulse USA',
    url: 'https://sufipulse.com/about/founder',
    type: 'profile',
  },
};

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
