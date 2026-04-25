'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { storage } from '@/app/lib/storage';

function AdoptionSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const adoptionId = searchParams.get('adoption_id');
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!adoptionId) {
      setStatus('error');
      setErrorMsg('Missing adoption ID.');
      return;
    }

    async function confirm() {
      try {
        let verifiedAmountPaid: number | undefined;

        if (sessionId) {
          const res = await fetch(`/api/adoptions/${adoptionId}/confirm/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          });

          const payload = await res.json();
          if (!res.ok || !payload?.verified) {
            throw new Error(payload?.reason || 'Payment could not be verified.');
          }

          verifiedAmountPaid = payload?.payment_record?.amountPaid;
        }

        await storage.updateSongAdoption(adoptionId!, {
          payment_status: 'paid',
          adoption_status: 'pending_review',
          stripe_session_id: sessionId || undefined,
          amount_paid: verifiedAmountPaid,
        });

        await storage.createSongAdoptionEvent({
          adoption_id: adoptionId,
          event_type: 'payment_completed',
          event_label: sessionId
            ? 'Stripe payment completed (server-verified)'
            : 'Payment marked completed',
          actor_type: 'system',
          metadata: { stripe_session_id: sessionId },
        });

        setStatus('success');
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to confirm payment.');
        setStatus('error');
      }
    }

    confirm();
  }, [adoptionId, sessionId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
          <p className="text-neutral-400">Confirming your payment…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-semibold text-neutral-100">Something went wrong</h2>
          <p className="text-neutral-400">{errorMsg}</p>
          <p className="text-sm text-neutral-500">
            Your card may have been charged. Please contact us at{' '}
            <a href="mailto:support@sufipulse.com" className="text-amber-400 hover:underline">
              support@sufipulse.com
            </a>{' '}
            with your adoption ID: <span className="font-mono text-neutral-300">{adoptionId}</span>
          </p>
          <Link href="/">
            <button className="mt-4 px-6 py-2 bg-neutral-800 text-neutral-200 rounded-lg hover:bg-neutral-700 transition">
              Return Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="max-w-lg w-full mx-4 text-center space-y-6">
        <div className="w-24 h-24 mx-auto bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10 text-green-500" />
        </div>

        <div>
          <h1 className="text-3xl font-serif font-light text-neutral-100 mb-3">
            Adoption Complete
          </h1>
          <p className="text-neutral-400 leading-relaxed">
            May your contribution bring ease and contemplation to whoever discovers this kalam.
            Your sponsorship has been recorded and payment confirmed.
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Payment</span>
            <span className="text-green-400 font-medium">Confirmed ✓</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Adoption Status</span>
            <span className="text-amber-400 font-medium">Pending Admin Review</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Reference ID</span>
            <span className="text-neutral-300 font-mono text-xs">{adoptionId}</span>
          </div>
        </div>

        <p className="text-sm text-neutral-500">
          You will receive a confirmation email once the campaign is approved and
          launched. Typically within 1–2 business days.
        </p>

        <Link href="/">
          <button className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors">
            Return Home
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function AdoptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
            <p className="text-neutral-400">Loading…</p>
          </div>
        </div>
      }
    >
      <AdoptionSuccessContent />
    </Suspense>
  );
}
