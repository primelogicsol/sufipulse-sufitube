import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';

export const metadata: Metadata = {
  title: "SufiPulse Verification Center | Official SufiPulse, SufiPulse-USA & Institutional Registry",
  description: "Official public verification registry for SufiPulse, SufiPulse.com, @SufiPulse-USA, SufiPulse Studio USA, SufiTube, Dr Kumar Foundation USA, and Sufi Science Center USA. Confirm official assets, institutional affiliations, and similar-name clarifications.",
  keywords: [
    "SufiPulse", "SufiPulse USA", "SufiPulse-USA", "@SufiPulse-USA",
    "SufiPulse Studio USA", "SufiTube", "Sufi Pulse Official",
    "SufiPulse verification", "official SufiPulse channel",
    "Dr Kumar Foundation USA", "Sufi Science Center USA",
    "SufiPulse official channels", "SufiPulse identity verification",
    "SufiPulse brand authenticity", "SufiPulse institutional registry"
  ],
  openGraph: {
    title: "SufiPulse Verification Center | Official SufiPulse, SufiPulse-USA & Institutional Registry",
    description: "Official public verification registry for SufiPulse, SufiPulse.com, @SufiPulse-USA, SufiPulse Studio USA, SufiTube, Dr Kumar Foundation USA, and Sufi Science Center USA.",
    type: "website",
    url: `${BASE_URL}/verification`,
    images: [
      {
        url: "/og?title=SufiPulse+Verification+Center&subtitle=Official+SufiPulse+%26+SufiPulse-USA+Institutional+Registry",
        width: 1200,
        height: 630,
        alt: "SufiPulse Verification Center — Official SufiPulse, SufiPulse-USA & Institutional Registry",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SufiPulse Verification Center | Official SufiPulse, SufiPulse-USA & Institutional Registry",
    description: "Official public verification registry for SufiPulse, SufiPulse.com, @SufiPulse-USA, SufiPulse Studio USA, SufiTube, Dr Kumar Foundation USA, and Sufi Science Center USA.",
    images: ["/og?title=SufiPulse+Verification+Center&subtitle=Official+SufiPulse+%26+SufiPulse-USA+Institutional+Registry"],
  },
  alternates: {
    canonical: "https://www.sufipulse.com/verification",
  },
};

export default function VerificationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
