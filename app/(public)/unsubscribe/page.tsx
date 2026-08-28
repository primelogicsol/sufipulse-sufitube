"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layout } from '../../components/layout/Layout';
import { Section } from '../../components/layout/Section';
import { PageContainer } from '../../components/layout/PageContainer';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email || !token) {
      setStatus('error');
      setMessage('Invalid unsubscribe link. Please check your email.');
      return;
    }

    fetch(`/api/subscribe/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setStatus('success');
          setMessage('You have been successfully unsubscribed from SufiPulse release alerts.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to unsubscribe. Please try again or contact support.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('A network error occurred. Please try again.');
      });
  }, [searchParams]);

  return (
    <div className="max-w-md mx-auto text-center py-12">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[var(--color-gold)] animate-spin" />
          <h1 className="text-xl font-medium text-[var(--color-text-primary)]">Unsubscribing...</h1>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-6">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Unsubscribed</h1>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            {message}
          </p>
          <Link href="/" className="mt-4 px-6 py-2 bg-[var(--color-gold)] text-[var(--color-midnight)] font-bold rounded-lg hover:bg-[var(--color-gold-hover)] transition-colors">
            Back to Home
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-6">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Error</h1>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            {message}
          </p>
          <Link href="/" className="mt-4 text-[var(--color-gold)] hover:underline font-medium">
            Return to Homepage
          </Link>
        </div>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <>
      <Section background="midnight" spacing="normal" className="pt-20">
        <PageContainer>
          <Suspense fallback={
            <div className="max-w-md mx-auto text-center py-12">
              <Loader2 className="w-12 h-12 text-[var(--color-gold)] animate-spin mx-auto mb-4" />
              <p className="text-neutral-400">Loading...</p>
            </div>
          }>
            <UnsubscribeContent />
          </Suspense>
        </PageContainer>
      </Section>
    </>
  );
}
