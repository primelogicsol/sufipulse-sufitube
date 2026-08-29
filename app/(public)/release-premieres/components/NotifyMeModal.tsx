"use client";

import React, { useState } from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';

export function NotifyMeModal({ releaseId, onClose }: { releaseId: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    
    try {
      const res = await fetch('/api/release-premieres/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseId, email })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || "You're on the release alert list.");
      } else {
        setStatus('error');
        setMessage(data.error || "Something went wrong.");
      }
    } catch (err) {
      setStatus('error');
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-bold text-white mb-2">Get Premiere Alerts</h3>
        <p className="text-neutral-400 text-sm mb-6">
          Sign up to be notified the moment this release goes live.
        </p>

        {status === 'success' ? (
          <div className="py-8 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
            <p className="text-white font-medium">{message}</p>
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-full transition-colors">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full bg-black/50 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)] transition-all"
                disabled={status === 'loading'}
              />
            </div>
            
            {status === 'error' && (
              <p className="text-red-400 text-sm">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-[var(--color-gold)] text-black font-bold uppercase tracking-wider text-sm py-3 rounded-lg hover:bg-[#FDE68A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Notify Me'}
            </button>
            <p className="text-center text-xs text-neutral-500 mt-2">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
