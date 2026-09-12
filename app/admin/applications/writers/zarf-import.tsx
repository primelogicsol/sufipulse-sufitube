"use client";

import { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, PlayCircle } from 'lucide-react';

export function ZarfImportTool({ writerId }: { writerId: string }) {
  const [sourceId, setSourceId] = useState('');
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (!sourceId.trim()) return;
    try {
      setWorking(true);
      setError('');
      setResult(null);

      const res = await fetch(`/api/admin/writers/${writerId}/import-work`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceAssetId: sourceId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import work');
      
      setResult(data);
      setSourceId('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <section className="pt-8 border-t border-neutral-900 mb-8">
      <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <PlayCircle className="w-4 h-4" />
        Privileged Action: Import Canonical Work
      </h3>
      <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
        <p className="text-xs text-amber-500/80 mb-4">
          For Dr. Zarf-e-Noori only: Import lyrics directly from a private upstream audio source ID. This bypasses standard intake and immediately creates a canonical Work draft.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Private Source Asset ID"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/50 font-mono"
          />
          <button
            onClick={handleImport}
            disabled={working || !sourceId.trim()}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50 transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {working ? 'Fetching...' : 'Fetch Work'}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-400 mb-4">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        )}

        {result && (
          <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-3">
              <CheckCircle2 className="w-4 h-4" />
              {result.action === 'COMPARE_UPDATE_DRAFT' ? 'Existing Work Found' : 'Draft Work Created'}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs text-emerald-500/80 mb-3">
              <div>
                <span className="block text-emerald-500/50 uppercase tracking-wider mb-1 text-[10px]">Title</span>
                <span className="font-medium text-emerald-400">{result.fetchedTitle || result.title}</span>
              </div>
              <div>
                <span className="block text-emerald-500/50 uppercase tracking-wider mb-1 text-[10px]">Work ID</span>
                <span className="font-mono text-emerald-400">{result.existingId || result.workId}</span>
              </div>
            </div>

            <div className="bg-black/40 rounded border border-emerald-500/10 p-3 max-h-32 overflow-y-auto">
              <pre className="text-[10px] text-emerald-500/70 whitespace-pre-wrap font-mono leading-relaxed">
                {result.fetchedLyrics}
              </pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
