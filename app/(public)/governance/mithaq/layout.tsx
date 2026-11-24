import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Al-Mithaq — Founding Covenant',
  description: 'Al-Mithaq: the founding ethical and artistic covenant of SufiPulse USA.',
  alternates: { canonical: 'https://sufipulse.com/governance/mithaq' },
};

export default function MithaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
