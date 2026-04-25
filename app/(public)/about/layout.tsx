import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About SufiPulse",
  description: "Learn about SufiPulse — a platform dedicated to preserving and promoting authentic Sufi music, sacred poetry (kalam), and the literary heritage of Kashmir and the Indian Subcontinent.",
  openGraph: {
    title: "About SufiPulse",
    description: "Learn about the mission, vision, and team behind SufiPulse — the premier platform for authentic Sufi music and poetry.",
    type: "website",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
