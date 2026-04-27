"use client";

import { useState } from 'react';
import { Share2, Copy, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { CMSRelease } from '@/lib/cms-storage';

type SocialShareKit = NonNullable<CMSRelease['socialShareKit']>;
type KitKey = 'whatsapp' | 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'telegram';

const PLATFORMS: { key: KitKey; label: string; icon: string }[] = [
  { key: 'whatsapp',  label: 'WhatsApp',  icon: '💬' },
  { key: 'instagram', label: 'Instagram', icon: '📸' },
  { key: 'facebook',  label: 'Facebook',  icon: '📘' },
  { key: 'twitter',   label: 'X / Twitter', icon: '🐦' },
  { key: 'linkedin',  label: 'LinkedIn',  icon: '💼' },
  { key: 'telegram',  label: 'Telegram',  icon: '✈️' },
];

function CaptionCard({ platform, text }: { platform: typeof PLATFORMS[0]; text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-[var(--dash-border)] bg-[var(--dash-surface-2)] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--dash-text-primary)]">
          {platform.icon} {platform.label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-[var(--dash-surface)] border border-[var(--dash-border)] text-[var(--dash-text-muted)] hover:text-[var(--dash-text-primary)] transition"
        >
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      <pre className="text-xs text-[var(--dash-text-secondary)] whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto">
        {text}
      </pre>
    </div>
  );
}

interface Props {
  releaseId: string;
  kit: CMSRelease['socialShareKit'];
  onKitGenerated: (kit: SocialShareKit) => void;
}

export function SocialShareKitSection({ releaseId, kit, onKitGenerated }: Props) {
  const [open, setOpen] = useState(!!kit);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/releases/${releaseId}/social-share-kit`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      onKitGenerated(data.socialShareKit);
      setOpen(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="dashboard-card mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Share2 size={18} className="text-[var(--dash-accent)]" />
          <h3 className="font-semibold text-[var(--dash-text-primary)]">Social Share Captions</h3>
          {kit && (
            <span className="text-xs text-[var(--dash-text-muted)] ml-1">
              — generated {new Date(kit.generatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs dashboard-btn-secondary disabled:opacity-50"
          >
            <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
            {kit ? 'Regenerate' : 'Generate'}
          </button>
          {kit && (
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text-primary)] transition"
            >
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 mb-3">{error}</p>
      )}

      {!kit && !error && (
        <p className="text-sm text-[var(--dash-text-muted)]">
          No captions yet. Click Generate to create platform-specific share copy from this release's data.
        </p>
      )}

      {kit && open && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORMS.map(p => (
            <CaptionCard key={p.key} platform={p} text={kit[p.key]} />
          ))}
        </div>
      )}
    </div>
  );
}
