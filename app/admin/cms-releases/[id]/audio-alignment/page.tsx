"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Database, Download, ShieldCheck, Upload } from 'lucide-react';

import { useAuth } from '../../../../contexts/AuthContext';
import DashboardLayout from '../../../../components/layout/DashboardLayout';

type AlignmentSummary = {
  releaseId: string;
  providerKey?: string;
  sourceAssetId?: string;
  sourceUrl?: string;
  durationSeconds?: number;
  alignmentQuality?: number;
  payloadHash?: string;
  stats?: {
    lineCount: number;
    publishableLineCount: number;
    productionDirectionCount: number;
    wordCount: number;
    waveformPointCount: number;
    overlapCount: number;
  };
};

type PreviewLine = {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  section?: string;
  isProductionDirection: boolean;
};

export default function PrivateAudioAlignmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const releaseId = params.id as string;
  const isAdmin = user?.role?.includes('admin') ?? false;

  const [releaseTitle, setReleaseTitle] = useState('Release');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceAssetId, setSourceAssetId] = useState('');
  const [language, setLanguage] = useState('en');
  const [payloadJson, setPayloadJson] = useState('');
  const [configured, setConfigured] = useState(false);
  const [summary, setSummary] = useState<AlignmentSummary | null>(null);
  const [previewLines, setPreviewLines] = useState<PreviewLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const hasSource = Boolean(sourceUrl.trim() || sourceAssetId.trim());
  const canInspect = hasSource && !working;
  const canApply = Boolean(summary) && confirmReplace && !working;

  const timingSummary = useMemo(() => {
    if (!summary?.stats) return null;
    return [
      ['Timed lines', summary.stats.lineCount],
      ['Publishable lines', summary.stats.publishableLineCount],
      ['Filtered directions', summary.stats.productionDirectionCount],
      ['Aligned words', summary.stats.wordCount],
      ['Waveform points', summary.stats.waveformPointCount],
      ['Overlapping transitions', summary.stats.overlapCount],
    ];
  }, [summary]);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      router.push('/admin');
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const [releaseRes, sourceRes] = await Promise.all([
          fetch(`/api/releases?key=${encodeURIComponent(releaseId)}`, { cache: 'no-store' }),
          fetch(`/api/admin/releases/${encodeURIComponent(releaseId)}/audio-alignment`, { cache: 'no-store' }),
        ]);

        if (releaseRes.ok) {
          const release = await releaseRes.json();
          setReleaseTitle(release.title || release.canonicalTitle || 'Release');
          setLanguage(String(release.defaultLanguage || 'en').toLowerCase());
        }

        if (sourceRes.ok) {
          const data = await sourceRes.json();
          setConfigured(Boolean(data.configured));
          if (data.source) {
            setSummary(data.source);
            setSourceUrl(data.source.sourceUrl || '');
            setSourceAssetId(data.source.sourceAssetId || '');
          }
        }
      } catch (err: any) {
        setError(String(err?.message || err || 'Failed to load private alignment state.'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [isAdmin, releaseId, router, user]);

  const buildRequestBody = (applyToMasterTiming: boolean) => {
    let payload: unknown = undefined;
    if (payloadJson.trim()) {
      payload = JSON.parse(payloadJson);
    }

    return {
      sourceUrl: sourceUrl.trim() || undefined,
      sourceAssetId: sourceAssetId.trim() || undefined,
      payload,
      language: language.trim().toLowerCase(),
      applyToMasterTiming,
      confirmReplace: applyToMasterTiming ? confirmReplace : false,
    };
  };

  const importAlignment = async (applyToMasterTiming: boolean) => {
    try {
      setWorking(true);
      setError('');
      setMessage('');

      const response = await fetch(`/api/admin/releases/${encodeURIComponent(releaseId)}/audio-alignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequestBody(applyToMasterTiming)),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed with HTTP ${response.status}`);
      }

      if (data.source) setSummary(data.source);
      if (Array.isArray(data.previewLines)) setPreviewLines(data.previewLines);

      if (applyToMasterTiming) {
        setMessage(`Draft master timing updated: ${data.cueCount || 0} caption cues, version ${data.masterTimingVersion || '?'}.`);
      } else {
        setMessage('Private alignment imported and inspected. Nothing public was changed.');
      }
    } catch (err: any) {
      setError(String(err?.message || err || 'Private alignment import failed.'));
    } finally {
      setWorking(false);
    }
  };

  if (!user || loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-white/60">Loading private alignment workspace…</div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href={`/admin/cms-releases/${releaseId}`} className="mb-3 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to release
            </Link>
            <h1 className="text-2xl font-semibold text-white">Private Audio Alignment</h1>
            <p className="mt-1 text-sm text-white/60">{releaseTitle}</p>
          </div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
            Admin-only production data
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
            <div>
              <h2 className="font-medium text-white">Provider firewall</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-white/60">
                Source identity, source asset IDs, waveform data, word timing and alignment metadata remain in private server storage. Only approved draft timing and lyric text can be copied into the release caption model.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 flex items-center gap-2">
              <Download className="h-5 w-5 text-amber-300" />
              <h2 className="font-medium text-white">1. Fetch and inspect</h2>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50">Private source URL</span>
                <input
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="Paste the private song/source URL"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50">Or source asset ID</span>
                <input
                  value={sourceAssetId}
                  onChange={(event) => setSourceAssetId(event.target.value)}
                  placeholder="Private asset ID"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50">Source language</span>
                <input
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  placeholder="en"
                  className="w-36 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50">Optional controlled-test JSON payload</span>
                <textarea
                  value={payloadJson}
                  onChange={(event) => setPayloadJson(event.target.value)}
                  rows={7}
                  placeholder={configured ? 'Leave empty to fetch through the server-side private provider adapter.' : 'Provider fetch is not configured. Paste a captured alignment JSON payload here for a controlled test.'}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-amber-400/50"
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!canInspect}
                  onClick={() => void importAlignment(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download className="h-4 w-4" /> {working ? 'Working…' : 'Inspect private alignment'}
                </button>
                <span className="text-xs text-white/45">
                  Server fetch: {configured ? 'configured' : 'not configured'}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 flex items-center gap-2">
              <Database className="h-5 w-5 text-sky-300" />
              <h2 className="font-medium text-white">Alignment inspection</h2>
            </div>

            {!timingSummary ? (
              <p className="text-sm leading-6 text-white/50">Fetch an alignment source first. This inspection step never changes the public release.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {timingSummary.map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl border border-white/10 bg-black/15 p-3">
                    <div className="text-xs text-white/45">{label}</div>
                    <div className="mt-1 text-lg font-semibold text-white">{value}</div>
                  </div>
                ))}
              </div>
            )}

            {summary?.durationSeconds ? (
              <p className="mt-4 text-xs text-white/50">Detected duration: {summary.durationSeconds.toFixed(3)} seconds</p>
            ) : null}
          </section>
        </div>

        {previewLines.length > 0 ? (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 font-medium text-white">Line preview</h2>
            <div className="overflow-hidden rounded-xl border border-white/10">
              {previewLines.map((line) => (
                <div key={`${line.index}-${line.startSeconds}`} className="grid grid-cols-[110px_1fr] gap-4 border-b border-white/5 px-4 py-3 last:border-b-0">
                  <div className="font-mono text-xs text-white/45">{line.startSeconds.toFixed(3)} → {line.endSeconds.toFixed(3)}</div>
                  <div>
                    <div className={line.isProductionDirection ? 'text-sm text-amber-200/70' : 'text-sm text-white/85'}>{line.text}</div>
                    {line.isProductionDirection ? <div className="mt-1 text-[11px] uppercase tracking-wide text-amber-300/50">Filtered from public captions</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5">
          <div className="flex items-start gap-3">
            <Upload className="mt-0.5 h-5 w-5 text-amber-300" />
            <div className="flex-1">
              <h2 className="font-medium text-white">2. Apply to draft master timing</h2>
              <p className="mt-1 text-sm leading-6 text-white/60">
                This copies publishable line timing into the CMS subtitle master and marks the source-language captions as draft. It does not publish to the website or YouTube.
              </p>

              <label className="mt-4 flex items-start gap-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={confirmReplace}
                  onChange={(event) => setConfirmReplace(event.target.checked)}
                  className="mt-1"
                />
                <span>I reviewed the alignment and authorize replacement of any existing master timing. A private rollback snapshot will be captured first.</span>
              </label>

              <button
                type="button"
                disabled={!canApply}
                onClick={() => void importAlignment(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-2.5 text-sm font-semibold text-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Upload className="h-4 w-4" /> Apply as draft master timing
              </button>
            </div>
          </div>
        </section>

        {message ? <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
        {error ? <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
      </div>
    </DashboardLayout>
  );
}
