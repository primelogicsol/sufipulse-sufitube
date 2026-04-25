import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Literary Journal",
  description: "The SufiPulse Literary Journal — a curated collection of Sufi essays, poetry analysis, reflective writing, and sacred literature from scholars and writers of the Sufi tradition.",
  keywords: ["Sufi literature", "Sufi poetry journal", "Islamic essays", "Sufi writing", "kalam analysis", "spiritual essays", "Urdu poetry analysis"],
  openGraph: {
    title: "Literary Journal | SufiPulse",
    description: "Essays, poetry analysis, and sacred literature from scholars of the Sufi tradition.",
    type: "website",
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com'}/literary-journal`,
  },
};

export default function LiteraryJournalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
