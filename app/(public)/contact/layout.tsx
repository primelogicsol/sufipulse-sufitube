import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with SufiPulse — for partnerships, contributor applications, media inquiries, or general questions about our Sufi music and poetry platform.",
  openGraph: {
    title: "Contact Us | SufiPulse",
    description: "Get in touch with SufiPulse for partnerships, contributor applications, and media inquiries.",
    type: "website",
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com'}/contact`,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
