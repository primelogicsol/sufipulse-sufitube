import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "What is SufiPulse? | Institutional Charter & Mission",
  description: "Discover the institutional charter, sacred-media philosophy, and cultural preservation mission of SufiPulse USA.",
  openGraph: {
    title: "What is SufiPulse? | Institutional Charter & Mission | SufiPulse USA",
    description: "Discover the institutional charter, sacred-media philosophy, and cultural preservation mission of SufiPulse USA.",
    type: "website",
  },
  alternates: {
    canonical: 'https://sufipulse.com/about/what-is-sufipulse',
  },
};

export default function WhatIsSufiPulseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
