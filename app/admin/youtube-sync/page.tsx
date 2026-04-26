"use client";
import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  Youtube,
  RefreshCw,
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  Loader,
} from 'lucide-react';

export default function YouTubeSync() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const syncFromYouTube = async () => {
    setSyncing(true);
    setStatus('syncing');
    setMessage('Importing releases from YouTube...');
    setProgress(0);
    setTotal(0);

    try {
      const res = await fetch('/api/releases/import-youtube', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      const imported: number = data.imported ?? data.count ?? 0;
      setTotal(imported);
      setProgress(imported);
      setStatus('success');
      setMessage(`Successfully imported ${imported} release${imported !== 1 ? 's' : ''} from YouTube.`);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setSyncing(false);
    }
  };

  const reset = () => {
    setStatus('idle');
    setProgress(0);
    setTotal(0);
    setMessage('');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-light text-neutral-100 mb-4">
              YouTube Sync
            </h1>
            <p className="text-neutral-400">
              Import videos from your YouTube channel into the CMS.
            </p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center">
                <Youtube className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-neutral-100">Import from YouTube</h2>
                <p className="text-sm text-neutral-500">
                  Fetches videos via YouTube Data API and saves them to the local CMS store
                </p>
              </div>
            </div>

            {status === 'idle' && (
              <button
                onClick={syncFromYouTube}
                disabled={syncing}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-5 h-5" />
                Start Import
              </button>
            )}

            {status === 'syncing' && (
              <div className="flex items-center gap-3 text-blue-400">
                <Loader className="w-5 h-5 animate-spin" />
                <span>{message}</span>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>{message}</span>
                </div>
                {total > 0 && (
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-full" />
                  </div>
                )}
                <button
                  onClick={reset}
                  className="w-full px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg transition-colors"
                >
                  Import Again
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>{message}</span>
                </div>
                <button
                  onClick={reset}
                  className="w-full px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">What does this do?</p>
                <ul className="space-y-1 text-blue-400">
                  <li>• Fetches videos from your YouTube channel (set YOUTUBE_API_KEY)</li>
                  <li>• Saves video metadata to the local CMS (.data/cms-releases.json)</li>
                  <li>• Skips videos that already exist in the CMS</li>
                  <li>• You can then manage each release in the CMS Dashboard</li>
                </ul>
              </div>
            </div>
          </div>
      </div>
    </DashboardLayout>
  );
}
