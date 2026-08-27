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
} from 'lucide-react';

type SyncMode = 'full' | 'incremental';

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

  const loadReconciliation = async () => {
    const res = await fetch('/api/releases/import-youtube?fetchAll=1', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Catalog reconciliation failed.');
    setReconciliation(data.reconciliation ?? null);
  };

  const syncFromYouTube = async (mode: SyncMode) => {
    setSyncing(true);
    setStatus('syncing');
    setMessage(mode === 'full' ? 'Synchronizing the full YouTube catalog...' : 'Synchronizing recent YouTube uploads...');
    setResult(null);
    setReconciliation(null);

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

      // Always run a read-only full reconciliation after a successful sync so the
      // dashboard reports the true channel-vs-CMS state, including CMS-only records.
      await loadReconciliation();

      setStatus('success');
      setMessage(data.message || 'YouTube catalog sync completed.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setSyncing(false);
    }
  };

  const reset = () => {
    setStatus('idle');
    setMessage('');
    setResult(null);
    setReconciliation(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-serif font-light text-neutral-100 mb-3">YouTube Catalog Sync</h1>
          <p className="text-neutral-400 max-w-3xl">
            Read the SufiPulse YouTube channel through the YouTube Data API and reconcile public video metadata into the SufiPulse CMS. This screen does not modify YouTube.
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200 flex gap-3">
          <Database className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Read-only channel synchronization</p>
            <p className="text-blue-300/70 mt-1">
              Existing releases are matched by YouTube video ID. New public channel videos create CMS records; existing records receive refreshed operational YouTube stats without overwriting governed SufiPulse intelligence fields. Nothing is deleted automatically.
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
              Reconcile up to 500 public channel videos. Use this for the initial 90+ release audit and after major catalog changes.
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
              Refresh videos published in the last 30 days, then run a full read-only reconciliation against the CMS.
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

        {status === 'syncing' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center gap-3 text-blue-400">
            <Loader className="w-5 h-5 animate-spin" />
            <span>{message}</span>
          </div>
        )}

        {status === 'success' && result && (
          <div className="space-y-5">
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 space-y-5">
              <div className="flex items-start gap-3 text-green-400">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Catalog synchronization completed</p>
                  <p className="text-sm text-green-300/70 mt-1">{result.message}</p>
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

            {reconciliation && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <SearchCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-medium text-neutral-100">Channel ↔ CMS Reconciliation</h3>
                    <p className="text-sm text-neutral-500 mt-1">
                      CMS-only items may be deleted, private, or unlisted because public API-key discovery cannot distinguish those states.
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
                <p className="font-medium">Catalog synchronization failed</p>
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
