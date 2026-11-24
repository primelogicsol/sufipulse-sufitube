import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Channel Operations & Broadcast Governance | Official Channels',
  description: 'Operational standards governing official SufiPulse USA YouTube and broadcast distribution.',
  alternates: { canonical: 'https://sufipulse.com/official-channels/operations' },
};

export default function OfficialChannelsOperationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
