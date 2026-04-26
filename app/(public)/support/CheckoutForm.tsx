"use client";

import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const PRESET_AMOUNTS = [10, 25, 50, 100];

interface CheckoutFormProps {
  onAmountChange: (amount: number) => void;
  currentAmount: number;
}

export function CheckoutForm({ onAmountChange, currentAmount }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [email, setEmail] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const handlePreset = (amount: number) => {
    setCustomAmount('');
    onAmountChange(amount);
  };

  const handleCustom = (val: string) => {
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 1) onAmountChange(parsed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        receipt_email: email || undefined,
        return_url: `${window.location.origin}/support/thank-you`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message ?? 'Payment failed. Please try again.');
    } else if (paymentIntent?.status === 'succeeded') {
      setSucceeded(true);
      setMessage(null);
    } else {
      setMessage('Unexpected payment status. Please contact support.');
    }

    setIsProcessing(false);
  };

  if (succeeded) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="text-4xl">✦</div>
        <h3 className="font-headline text-2xl text-[var(--color-gold)]">
          JazakAllah Khair
        </h3>
        <p className="text-[var(--color-text-secondary)]">
          Your support keeps Sufi kalam alive. May it be a means of barakah.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          Sponsorship Amount (USD)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handlePreset(amt)}
              className={[
                'py-2 px-3 rounded-lg border text-sm font-semibold transition-all duration-150',
                currentAmount === amt && !customAmount
                  ? 'border-[var(--color-gold)] bg-[var(--color-gold-muted)] text-[var(--color-gold)]'
                  : 'border-white/10 text-[var(--color-text-secondary)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]',
              ].join(' ')}
            >
              ${amt}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] text-sm select-none">$</span>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Custom amount"
            value={customAmount}
            onChange={(e) => handleCustom(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-gold)] transition-colors"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          Email (for receipt — optional)
        </label>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-gold)] transition-colors"
        />
      </div>

      {/* Stripe Payment Element */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {message && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 px-6 rounded-lg bg-[var(--color-gold)] text-[var(--color-midnight)] font-semibold text-sm tracking-wide hover:bg-[var(--color-gold-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing…' : `Donate $${currentAmount}`}
      </button>
    </form>
  );
}
