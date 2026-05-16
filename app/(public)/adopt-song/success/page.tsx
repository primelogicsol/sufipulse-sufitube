'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2, AlertCircle, ArrowRight, Heart } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const adoptionId = searchParams.get('adoption_id') || searchParams.get('client_reference_id');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // If we have an adoptionId, we can optionally poll for status update
    // but the prompt says to show a static "verifying" message.
  }, [adoptionId]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-green-500" />
          </div>
          <div className="absolute -top-2 -right-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 flex items-center justify-center animate-bounce">
              <Heart className="w-4 h-4 text-[var(--color-gold)] fill-[var(--color-gold)]" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif text-[var(--color-text-primary)] tracking-tight">
            Thank You for Your Sponsorship
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] font-light leading-relaxed">
            Your sponsorship payment is being verified. Your campaign request remains under SufiPulse review.
          </p>
        </div>

        <div className="bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] rounded-3xl p-8 backdrop-blur-sm space-y-6">
          <div className="flex items-start gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0 mt-1">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
            </div>
            <div>
              <h3 className="text-[var(--color-text-primary)] font-medium">What happens next?</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 font-light">
                Our team will verify the payment and review your sponsorship details. 
                Once approved, your name will appear in the "Recent Adopters" section 
                of the song page according to your privacy settings.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border-strong)]">
            <Link 
              href="/releases"
              className="inline-flex items-center gap-2 text-[var(--color-gold)] hover:text-[var(--color-gold-hover)] transition-all font-medium group"
            >
              Return to Releases
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {adoptionId && (
          <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono uppercase tracking-widest">
            Reference: {adoptionId}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdoptSongSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-midnight)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
          <p className="text-neutral-400 font-light tracking-widest uppercase text-xs">Loading Success Details...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
