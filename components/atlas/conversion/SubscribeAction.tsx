'use client';

import { Bell } from 'lucide-react';
import { useState } from 'react';

export function SubscribeAction() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'discovery_hub' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Subscribed to SufiPulse release updates.');
        setEmail('');
        fetch('/api/public/discovery-telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'subscribe_intent',
            path: window.location.pathname,
          }),
        }).catch(() => {});
      } else {
        setStatus('error');
        setMessage(data.error || 'Unable to subscribe right now.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error while subscribing.');
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/30 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Bell className="w-5 h-5 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white">Join SufiPulse</h3>
      </div>
      <p className="text-sm text-slate-300 mb-6">
        Receive alerts when new full-length SufiPulse USA sacred recordings and translations are published.
      </p>

      {status === 'success' ? (
        <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-4 text-center">
          <p className="text-emerald-400 font-medium text-sm">{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Joining...' : 'Subscribe'}
            </button>
          </div>
          {status === 'error' && <p className="text-xs text-red-400">{message}</p>}
        </form>
      )}
    </div>
  );
}
