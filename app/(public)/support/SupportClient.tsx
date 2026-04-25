"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from './CheckoutForm';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const STRIPE_APPEARANCE = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#C8A75E',
    colorBackground: '#1E293B',
    colorText: '#F8FAFC',
    colorTextSecondary: '#94A3B8',
    colorDanger: '#f87171',
    borderRadius: '8px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  rules: {
    '.Input': {
      backgroundColor: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
    },
    '.Input:focus': {
      border: '1px solid #C8A75E',
      boxShadow: '0 0 0 2px rgba(200,167,94,0.15)',
    },
    '.Label': {
      color: '#94A3B8',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    '.Tab': {
      backgroundColor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: '#94A3B8',
    },
    '.Tab--selected': {
      border: '1px solid #C8A75E',
      color: '#C8A75E',
    },
  },
};

export function SupportClient() {
  const [amount, setAmount] = useState(25);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchIntent = useCallback(async (amountUSD: number) => {
    setClientSecret(null);
    setError(null);
    try {
      const res = await fetch('/api/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUSD }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment');
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  // Debounce amount changes to avoid hammering the API on custom input
  useEffect(() => {
    const timer = setTimeout(() => fetchIntent(amount), 400);
    return () => clearTimeout(timer);
  }, [amount, fetchIntent]);

  return (
    <div className="min-h-screen bg-[var(--color-midnight)] flex flex-col items-center justify-start py-16 px-4">
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/sufipulse-logo-v5.png"
            alt="SufiPulse"
            width={160}
            height={56}
            className="object-contain"
            priority
          />
        </div>

        {/* Heading */}
        <div className="text-center mb-8 space-y-2">
          <h1 className="font-headline text-3xl font-semibold text-[var(--color-text-primary)]">
            Support SufiPulse
          </h1>
          <p className="text-[var(--color-text-secondary)] text-base">
            Sufi Kalam Sponsorship
          </p>
          <div className="flex items-center justify-center gap-3 pt-1">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[var(--color-gold)] text-lg">✦</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
        </div>

        {/* Payment card */}
        <div className="rounded-2xl border border-white/10 bg-[var(--color-slate)] shadow-xl p-6 space-y-6">
          {error ? (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {error}
            </div>
          ) : !clientSecret ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: STRIPE_APPEARANCE,
              }}
            >
              <CheckoutForm
                currentAmount={amount}
                onAmountChange={setAmount}
              />
            </Elements>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[var(--color-text-tertiary)] mt-6">
          Payments handled by{' '}
          <span className="text-[var(--color-text-secondary)]">Prime Logic Solutions LLC (USA)</span>
          {' '}· Powered by Stripe
        </p>
      </div>
    </div>
  );
}
