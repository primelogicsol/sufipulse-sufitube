"use client";

import React, { useState, useEffect } from 'react';
import { X, Send, Check, Loader2, Globe } from 'lucide-react';

interface LyricsRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseId: string;
  releaseTitle: string;
  initialLanguageCode: string;
  initialLanguageName: string;
  languages: Array<{ key: string; label: string }>;
  user?: { name?: string; email?: string } | null;
}

export function LyricsRequestModal({
  isOpen,
  onClose,
  releaseId,
  releaseTitle,
  initialLanguageCode,
  initialLanguageName,
  languages,
  user
}: LyricsRequestModalProps) {
  const [languageCode, setLanguageCode] = useState(initialLanguageCode);
  const [languageName, setLanguageName] = useState(initialLanguageName);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [note, setNote] = useState('');
  const [notifyWhenPublished, setNotifyWhenPublished] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLanguageCode(initialLanguageCode);
      setLanguageName(initialLanguageName);
      setError(null);
      setIsSuccess(false);
      setSuccessMsg(null);
    }
  }, [isOpen, initialLanguageCode, initialLanguageName]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const lang = languages.find(l => (l as any).key === code || (l as any).code === code);
    setLanguageCode(code);
    setLanguageName(lang?.label || code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/lyrics-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseId,
          slug: window.location.pathname.split('/').pop(),
          songTitle: releaseTitle,
          language: languageName,
          languageCode,
          requesterName: name,
          requesterEmail: email,
          requestedMessage: note,
          sourceUrl: window.location.href
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to submit request');
      }

      setSuccessMsg(data.message);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'We could not submit your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Request Lyrics Translation</h2>
              <p className="text-[11px] text-neutral-500 uppercase tracking-widest">{releaseTitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Request Received</h3>
              <p className="text-neutral-400 text-sm mb-6">
                {successMsg || `Thank you. Your lyrics request for ${languageName} has been received. Our team will review and prioritize requests based on demand.`}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-neutral-400 leading-relaxed mb-4">
                Tell us which language you want lyrics for. Our team will review and prioritize requests based on demand.
              </p>

              <div className="space-y-4">
                {/* Language Selection */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Target Language
                  </label>
                  <select
                    value={languageCode}
                    onChange={handleLanguageChange}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    required
                  >
                    {languages.map(lang => (
                      <option key={lang.key} value={lang.key}>{lang.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                      Your Name <span className="text-neutral-600 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="e.g. Abdullah"
                    />
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                      Email Address {notifyWhenPublished && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="e.g. seeker@example.com"
                      required={notifyWhenPublished}
                    />
                  </div>
                </div>

                {/* Reason/Note */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Reason / Note <span className="text-neutral-600 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
                    rows={3}
                    placeholder="Why would this translation help you or your community?"
                  />
                </div>

                {/* Notify me */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={notifyWhenPublished}
                      onChange={e => setNotifyWhenPublished(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-neutral-700 rounded bg-neutral-950 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all"></div>
                    <Check className="absolute w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity left-0.5" />
                  </div>
                  <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                    Notify me when this translation is published
                  </span>
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-lg transition-all font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit Request
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
