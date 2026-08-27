'use client';

import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Youtube,
  RefreshCw,
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  Loader,
  Database,
  SearchCheck,
  FileSpreadsheet,
} from 'lucide-react';

type SyncMode = 'full' | 'incremental';
type ReconciliationSource = 'youtube_data_api' | 'studio_csv';

type SyncResult = {
  importedCount: number;
  newCount: number;
  updatedCount: number;
  errorCount: number;
  checkedCount: number;
  registryCount: number;
  message: string;
};

type Reconciliation = {
  matched: number;
  youtubeOnly: number;
  metadataMismatch: number;
  duplicates: number;
  stale: number;
  cmsOnlyOrNonpublic: number;
  missingYoutubeId: number;
};

export default function YouTubeSync() {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<SyncResult | null>(null);
  const [reconciliation, setReconciliation] = useState<Reconciliation | null>(null);
  const [reconciliationSource, setReconciliationSource] = useState<ReconciliationSource | null>(null);

  const loadReconciliation = async (preferStudio = false) => {
    let liveError = '';

    if (!preferStudio) {
      try {
        const res = await fetch('/api/releases/import-youtube?fetchAll=1', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Live catalog reconciliation failed.');
        setReconciliation(data.reconciliation ?? null);
        setReconciliationSource('youtube_data_api');
        return 'youtube_data_api' as const;
      } catch (error: any) {
        liveError = error?.message || 'Live YouTube Data API reconciliation was unavailable.';
      }
    }

    const studioRes = await fetch('/api/releases/import-youtube/studio-reconciliation', { cache: 'no-store' });
    const studioData = await studioRes.json();
    if (!studioRes.ok) {
      const fallbackMessage = studioData.message || studioData.error || 'Studio catalog reconciliation failed.';
      throw new Error(liveError ? `${liveError} Studio fallback: ${fallbackMessage}` : fallbackMessage);
    }

    setReconciliation(studioData.reconciliation ?? null);
    setReconciliationSource('studio_csv');
    return 'studio_csv' as const;
  };

  const syncFromYouTube = async (mode: SyncMode) => {
    setSyncing(true);
    setStatus('syncing');
    setMessage(mode === 'full' ? 'Synchronizing the full YouTube catalog...' : 'Synchronizing recent YouTube uploads...');
    setResult(null);
    setReconciliation(null);
    setReconciliationSource(null);

    try {
      const res = await fetch('/api/releases/import-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, lookbackDays: 30 }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'YouTube catalog sync failed.');

      setResult({
        importedCount: data.importedCount ?? data.imported ?? data.count ?? 0,
        newCount: data.newCount ?? 0,
        updatedCount: data.updatedCount ?? 0,
        errorCount: data.errorCount ?? 0,
        checkedCount: data.checkedCount ?? 0,
        registryCount: data.registryCount ?? 0,
        message: data.message || 'YouTube catalog sync completed.',
      });

      const source = await loadReconciliation();
      setStatus('success');
      setMessage(
        source === 'studio_csv'
          ? `${data.message || 'YouTube catalog sync completed.'} Reconciliation used the latest verified YouTube Studio CSV because the live catalog read was unavailable.`
          : (data.message || 'YouTube catalog sync completed.')
      );
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setSyncing(false);
    }
  };

  const reconcileFromStudio = async () => {
    setSyncing(true);
    setStatus('syncing');
    setMessage('Reconciling the CMS against the latest verified YouTube Studio snapshot...');
    setResult(null);
    setReconciliation(null);
    setReconciliationSource(null);

    try {
      await loadReconciliation(true);
      setStatus('success');
      setMessage('Studio catalog reconciliation completed. No YouTube API quota was consumed and no YouTube data was modified.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Studio catalog reconciliation failed.');
    } finally {
      setSyncing(false);
    }
  };

  const reset = () => {
    setStatus('idle');
    setMessage('');
    setResult(null);
    setReconciliation(null);
    setReconciliationSource(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-serif font-light text-neutral-100 mb-3">YouTube Catalog Sync</h1>
          <p className="text-neutral-400 max-w-3xl">
            Read the SufiPulse YouTube channel through verified first-party sources and reconcile video metadata into the SufiPulse CMS. This screen never modifies YouTube.
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200 flex gap-3">
          <Database className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Read-only channel synchronization</p>
            <p className="text-blue-300/70 mt-1">
              The live Data API remains the metadata-refresh path. When Google quota is unavailable, the latest imported YouTube Studio Advanced Mode CSV can still perform authoritative video-ID/title catalog reconciliation. Nothing is deleted automatically.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-red-600/10 rounded-full flex items-center justify-center mb-4">
              <Youtube className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-xl font-medium text-neutral-100">Full Catalog Sync</h2>
            <p className="text-sm text-neutral-500 mt-2 mb-5">
              Refresh and reconcile up to 500 public channel videos through the live YouTube Data API. Use this after quota is available and after major catalog changes.
            </p>
            <button
              onClick={() => syncFromYouTube('full')}
              disabled={syncing}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? <Loader className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              Sync Full Catalog
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-xl font-medium text-neutral-100">Recent Sync</h2>
            <p className="text-sm text-neutral-500 mt-2 mb-5">
              Refresh live videos published in the last 30 days, then reconcile the complete catalog using Data API or Studio fallback.
            </p>
            <button
              onClick={() => syncFromYouTube('incremental')}
              disabled={syncing}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg border border-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? <Loader className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              Sync Last 30 Days
            </button>
          </div>
        </div>

        <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
          <FileSpreadsheet className="w-6 h-6 text-sky-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-sky-200">Quota-independent Studio reconciliation</p>
            <p className="text-xs text-sky-300/60 mt-1">
              Uses the latest imported YouTube Studio Advanced Mode CSV to compare the verified catalog IDs/titles against the CMS. Import or replace the snapshot under YouTube Analytics first.
            </p>
          </div>
          <button
            onClick={reconcileFromStudio}
            disabled={syncing}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 text-sky-200 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {syncing ? <Loader className="w-4 h-4 animate-spin" /> : <SearchCheck className="w-4 h-4" />}
            Reconcile Studio Snapshot
          </button>
        </div>

        {status === 'syncing' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center gap-3 text-blue-400">
            <Loader className="w-5 h-5 animate-spin" />
            <span>{message}</span>
          </div>
        )}

        {status === 'success' && (result || reconciliation) && (
          <div className="space-y-5">
            {result && (
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 space-y-5">
                <div className="flex items-start gap-3 text-green-400">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Catalog synchronization completed</p>
                    <p className="text-sm text-green-300/70 mt-1">{message}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    ['Checked', result.checkedCount],
                    ['Created', result.newCount],
                    ['Updated', result.updatedCount],
                    ['Failed', result.errorCount],
                    ['Registry', result.registryCount],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="bg-black/20 border border-white/5 rounded-lg p-3">
                      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
                      <p className="text-xl font-bold text-neutral-100 mt-1 tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!result && reconciliation && (
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5 flex items-start gap-3 text-green-400">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Catalog reconciliation completed</p>
                  <p className="text-sm text-green-300/70 mt-1">{message}</p>
                </div>
              </div>
            )}

            {reconciliation && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <SearchCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-medium text-neutral-100">Channel ↔ CMS Reconciliation</h3>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                        reconciliationSource === 'studio_csv'
                          ? 'bg-sky-500/10 border-sky-500/20 text-sky-300'
                          : 'bg-green-500/10 border-green-500/20 text-green-300'
                      }`}>
                        {reconciliationSource === 'studio_csv' ? 'STUDIO CSV' : 'LIVE DATA API'}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">
                      {reconciliationSource === 'studio_csv'
                        ? 'First-party Studio fallback compares verified video IDs and titles. Richer description/duration reconciliation resumes when Data API quota is available.'
                        : 'CMS-only items may be deleted, private, or unlisted because public API-key discovery cannot distinguish those states.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {[
                    ['Matched', reconciliation.matched],
                    ['YouTube Only', reconciliation.youtubeOnly],
                    ['Metadata Diff', reconciliation.metadataMismatch],
                    ['Duplicates', reconciliation.duplicates],
                    ['Stale', reconciliation.stale],
                    ['CMS Only / Nonpublic', reconciliation.cmsOnlyOrNonpublic],
                    ['Missing YT ID', reconciliation.missingYoutubeId],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="bg-black/20 border border-white/5 rounded-lg p-3">
                      <p className="text-[10px] uppercase tracking-wide text-neutral-500 min-h-7">{label}</p>
                      <p className="text-xl font-bold text-neutral-100 mt-1 tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={reset}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg transition-colors"
            >
              Close Result
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Catalog operation failed</p>
                <p className="text-sm text-red-300/70 mt-1">{message}</p>
              </div>
            </div>
            <button
              onClick={reset}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
