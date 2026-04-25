import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thank You — SufiPulse',
};

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-[var(--color-midnight)] flex flex-col items-center justify-center px-4 py-16 text-center">
      <Image
        src="/sufipulse-logo-v5.png"
        alt="SufiPulse"
        width={140}
        height={50}
        className="object-contain mb-10"
        priority
      />
      <div className="text-5xl mb-6 text-[var(--color-gold)]">✦</div>
      <h1 className="font-headline text-3xl font-semibold text-[var(--color-text-primary)] mb-3">
        JazakAllah Khair
      </h1>
      <p className="text-[var(--color-text-secondary)] text-base max-w-sm mb-8">
        Your sponsorship supports the preservation and global outreach of authentic
        Sufi kalam. May it be a means of barakah.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-[var(--color-gold)] text-[var(--color-gold)] text-sm font-semibold hover:bg-[var(--color-gold-muted)] transition-colors"
      >
        Return to SufiPulse
      </Link>
      <p className="text-xs text-[var(--color-text-tertiary)] mt-10">
        Payments handled by Prime Logic Solutions LLC (USA) · Powered by Stripe
      </p>
    </div>
  );
}
