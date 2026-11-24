"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Share2,
  Send,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Search,
  Network,
  ShieldCheck,
  Clock,
  XCircle,
} from 'lucide-react';
import { generateSocialShareKit } from '@/lib/social-share-generator';

interface ReleaseViralSyndicationSectionProps {
  releaseId: string;
  releaseData?: any;
  draftId?: string;
  slug?: string;
  title?: string;
  youtubeId?: string;
  isStudioGoverned?: boolean;
}

interface IndexingDiagnosticsPayload {
  indexNow: {
    checkedAt: string;
    key: string;
    keyLocation: string;
    localKeyFileExists: boolean;
    httpStatus: number | null;
    verified: boolean;
    message: string;
  };
  googleSearchConsole: {
    state: string;
    configured: boolean;
    property: string | null;
    errorMessage: string | null;
    missingRequirements: string[];
  };
  bingWebmaster: {
    status: string;
    configured: boolean;
    siteUrl: string;
    missingRequirements: string[];
  };
  urlDiagnostics: {
    canonicalUrl: string;
    eligibleForPublicIndex: boolean;
    eligibilityReason?: string;
    currentState: string;
    crawlObservedCount: number;
    lastCrawledAt: string | null;
    crawledByBots: string[];
    history: Array<{
      id: string;
      protocol: string;
      state: string;
      httpStatus: number | null;
      responseSummary: string;
      errorMessage?: string | null;
      timestamp: string;
    }>;
  } | null;
}

const STATE_BADGES: Record<string, { label: string; className: string }> = {
  INDEXED_VERIFIED: {
    label: 'INDEXED (API VERIFIED)',
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  CRAWL_OBSERVED: {
    label: 'CRAWL OBSERVED (FIRST-PARTY LOG)',
    className: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  },
  SUBMISSION_ACCEPTED: {
    label: 'SUBMISSION ACCEPTED (UNVERIFIED INDEX)',
    className: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
  ELIGIBLE_IN_SITEMAP: {
    label: 'IN PUBLIC SITEMAP (NOT YET SUBMITTED)',
    className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  NOT_CONFIGURED: {
    label: 'NOT CONFIGURED ON HOST',
    className: 'bg-neutral-800 text-neutral-300 border-neutral-700',
  },
  SUBMISSION_FAILED: {
    label: 'SUBMISSION FAILED',
    className: 'bg-red-500/15 text-red-300 border-red-500/30',
  },
  NOT_ELIGIBLE_PRIVATE: {
    label: 'BLOCKED (NON-PUBLIC / UNPUBLISHED)',
    className: 'bg-red-500/15 text-red-300 border-red-500/30',
  },
};

export function ReleaseViralSyndicationSection({
  releaseId,
  releaseData,
  slug: propSlug,
  title: propTitle,
  youtubeId: propYoutubeId,
}: ReleaseViralSyndicationSectionProps) {
  const [diagnostics, setDiagnostics] = useState<IndexingDiagnosticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const slug = releaseData?.slug || propSlug || releaseId;
  const canonicalTitle = releaseData?.canonicalTitle || releaseData?.title || propTitle || 'Sacred Kalam';
  const youtubeId = releaseData?.youtubeId || releaseData?.youtube_video_id || propYoutubeId || '';
  const isPubliclyPublished =
    releaseData?.status === 'published' && (releaseData?.visibility || 'public') === 'public';

  const canonicalReleaseUrl = `https://sufipulse.com/release-detail/${slug}`;

  const shareKit = generateSocialShareKit({
    id: releaseId,
    title: canonicalTitle,
    canonicalTitle,
    slug,
    youtubeId,
    description: releaseData?.description || '',
    writer: releaseData?.writer || 'Dr. Zarf-e-Noori',
  } as any);

  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/search-indexing?slug=${encodeURIComponent(slug)}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const json = await res.json();
        setDiagnostics(json);
      }
    } catch (err) {
      console.error('Failed to load search indexing diagnostics:', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadDiagnostics();
  }, [loadDiagnostics]);

  const handleAction = async (action: 'submit_indexnow' | 'run_release_pipeline' | 'inspect_gsc_url') => {
    setSubmitting(action);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/search-indexing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          releaseId,
          slug,
          url: canonicalReleaseUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ ok: false, text: data.error || `HTTP ${res.status}` });
      } else {
        const ok =
          action === 'run_release_pipeline'
            ? Boolean(data.executed)
            : action === 'inspect_gsc_url'
              ? Boolean(data.configured && data.state !== 'ERROR')
              : Boolean(data.accepted);
        const msg =
          data.message ||
          data.reason ||
          data.indexNow?.message ||
          'Completed search discovery action.';
        setFeedback({ ok, text: msg });
        await loadDiagnostics();
      }
    } catch (err: any) {
      setFeedback({ ok: false, text: err?.message || 'Network request failed.' });
    } finally {
      setSubmitting(null);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentState = isPubliclyPublished
    ? diagnostics?.urlDiagnostics?.currentState || 'ELIGIBLE_IN_SITEMAP'
    : 'NOT_ELIGIBLE_PRIVATE';
  const badge = STATE_BADGES[currentState] || STATE_BADGES.NOT_CONFIGURED;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Full-Song Organic Search & Discovery Syndication
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                Full-Length Master Only
              </span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Verified canonical URL indexing, Discovery Graph auto-linking, and full-song share distribution. No simulated statuses; no Shorts or cutdowns.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadDiagnostics}
          disabled={loading}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg border border-neutral-700 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Diagnostics
        </button>
      </div>

      {/* Non-public warning */}
      {!isPubliclyPublished && (
        <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Search Submission Blocked:</strong> This release currently has{' '}
            <code className="px-1 py-0.5 bg-neutral-950 rounded">status=&quot;{releaseData?.status}&quot;</code> and{' '}
            <code className="px-1 py-0.5 bg-neutral-950 rounded">visibility=&quot;{releaseData?.visibility || 'private'}&quot;</code>.
            It is excluded from <code className="px-1 py-0.5 bg-neutral-950 rounded">/sitemap.xml</code> and IndexNow until human-approved and published publicly.
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
            feedback.ok
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}
        >
          {feedback.ok ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 1. Real Search Indexing & Crawl Verification */}
      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-400" />
              Canonical Release URL & Verification State
            </div>
            <div className="text-[11px] font-mono text-neutral-400 break-all">{canonicalReleaseUrl}</div>
          </div>
          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        {/* Provider configuration matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200">IndexNow Protocol</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  diagnostics?.indexNow?.verified
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-amber-500/15 text-amber-300'
                }`}
              >
                {diagnostics?.indexNow?.verified ? 'KEY VERIFIED' : 'KEY PENDING DEPLOY'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              {diagnostics?.indexNow?.message || 'Checking public IndexNow key file...'}
            </p>
          </div>

          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200">Google Search Console</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  diagnostics?.googleSearchConsole?.state === 'CONNECTED'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {diagnostics?.googleSearchConsole?.state || 'NOT_CONFIGURED'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              {diagnostics?.googleSearchConsole?.state === 'CONNECTED'
                ? `Property: ${diagnostics.googleSearchConsole.property}`
                : 'Uses /sitemap.xml + VideoObject/MusicRecording JSON-LD. Set GOOGLE_SEARCH_CONSOLE_PROPERTY + Service Account for API inspection.'}
            </p>
          </div>

          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200">Crawler Observations</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300">
                {diagnostics?.urlDiagnostics?.crawlObservedCount || 0} HITS
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              {diagnostics?.urlDiagnostics?.crawledByBots?.length
                ? `Crawled by: ${diagnostics.urlDiagnostics.crawledByBots.join(', ')}`
                : 'No verified bot hits logged on this release path yet.'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={!isPubliclyPublished || submitting !== null}
            onClick={() => handleAction('run_release_pipeline')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
          >
            <Network className="w-3.5 h-3.5" />
            {submitting === 'run_release_pipeline'
              ? 'Syncing Graph & Sitemap...'
              : 'Sync Discovery Graph & Notify IndexNow'}
          </button>

          <button
            type="button"
            disabled={!isPubliclyPublished || submitting !== null}
            onClick={() => handleAction('submit_indexnow')}
            className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 text-xs font-medium rounded-lg border border-neutral-700 flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting === 'submit_indexnow' ? 'Submitting...' : 'Submit Canonical URL to IndexNow'}
          </button>

          <button
            type="button"
            disabled={!isPubliclyPublished || submitting !== null}
            onClick={() => handleAction('inspect_gsc_url')}
            className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 text-xs font-medium rounded-lg border border-neutral-700 flex items-center gap-1.5 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {submitting === 'inspect_gsc_url' ? 'Inspecting...' : 'Inspect URL via Search Console API'}
          </button>
        </div>

        {/* Audit log history for this URL */}
        {diagnostics?.urlDiagnostics?.history && diagnostics.urlDiagnostics.history.length > 0 && (
          <div className="border-t border-neutral-800 pt-3 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Recorded Submission Audit Trail
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {diagnostics.urlDiagnostics.history.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="p-2 bg-neutral-900/80 border border-neutral-800 rounded text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    {item.state === 'SUBMISSION_ACCEPTED' || item.state === 'INDEXED_VERIFIED' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="font-mono uppercase text-neutral-300">{item.protocol}</span>
                    <span className="text-neutral-400">{item.responseSummary}</span>
                  </div>
                  <div className="text-neutral-500 font-mono shrink-0">
                    {item.httpStatus ? `HTTP ${item.httpStatus} · ` : ''}
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Full-Song Community & Messaging Share Kits */}
      <div className="space-y-3 pt-2 border-t border-neutral-800">
        <div className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-emerald-400" />
          Full-Song Community Distribution Copy (Canonical URL + Official YouTube Watch Link)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">WhatsApp Full-Song Share</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => copyToClipboard(shareKit.whatsapp, 'wa')}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] rounded flex items-center gap-1"
                >
                  {copiedKey === 'wa' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'wa' ? 'Copied' : 'Copy'}
                </button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareKit.whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium rounded flex items-center gap-1"
                >
                  Open <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <pre className="p-2.5 bg-neutral-900 border border-neutral-800 rounded text-[11px] text-neutral-300 whitespace-pre-wrap font-sans max-h-32 overflow-y-auto">
              {shareKit.whatsapp}
            </pre>
          </div>

          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400">Telegram / Community Post</span>
              <button
                type="button"
                onClick={() => copyToClipboard(shareKit.facebook, 'fb')}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] rounded flex items-center gap-1"
              >
                {copiedKey === 'fb' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'fb' ? 'Copied' : 'Copy Post'}
              </button>
            </div>
            <pre className="p-2.5 bg-neutral-900 border border-neutral-800 rounded text-[11px] text-neutral-300 whitespace-pre-wrap font-sans max-h-32 overflow-y-auto">
              {shareKit.facebook}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
