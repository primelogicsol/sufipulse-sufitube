import type { Metadata } from 'next';
import { SupportClient } from './SupportClient';

export const metadata: Metadata = {
  title: 'Support SufiPulse — Sufi Kalam Sponsorship',
  description: 'Sponsor the spread of authentic Sufi kalam. Your contribution supports preservation and global outreach.',
};

export default function SupportPage() {
  return <SupportClient />;
}
