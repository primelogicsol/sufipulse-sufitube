"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, GitMerge, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react';

import { useAuth } from '../../../../contexts/AuthContext';
import DashboardLayout from '../../../../components/layout/DashboardLayout';

type SourceSummary = {
  providerKey: string;
  sourceAssetId: string;
  durationSeconds: number;
  alignmentQuality?: number;
  stats?: {
    lineCount: number;
    publishableLineCount: number;
    productionDirectionCount: number;
    wordCount: number;
    waveformPointCount: number;
    overlapCount: number;
  };
};

type SegmentDraft = {
  segmentId: string;
  sourceAssetId: string;
  role: 'primary' | 'extension' | 'alternate' | 'correction' | 'other';
  parentSourceAssetId?: string;
  order: number;
  sourceInSeconds: number;
  sourceOutSeconds?: number;
  destinationStartSeconds: number;
  transition: { type: 'cut' | 'crossfade'; durationSeconds?: number };
  excludedSourceLineIndexes?: number[];
  enabled?: boolean;
};

type AssemblyState = {
  version: number;
  updatedAt: string;
  segments: SegmentDraft[];
};

type CompiledPreview = {
  assemblyVersion: number;
  durationSeconds: number;
  stats: {
    segmentCount: number;
    sourceCount: number;
    lineCount: number;
    publishableLineCount: number;
    productionDirectionCount: number;
    excludedLineCount: number;
    clippedLineCount: number;
    overlapCount: number;
  };
  previewLines: Array<{
    segmentId: string;
    sourceAssetId: string;
    sourceLineIndex: number;
    sourceStartSeconds: number;
    sourceEndSeconds: number;
    startSeconds: number;
    endSeconds: number;
    text: string;
    isProductionDirection: boolean;
    clippedAtStart: boolean;
    clippedAtEnd: boolean;
  }>;
};

const parseIndexList = (value: string): number[] | undefined => {
  const values = Array.from(new Set(
    value
      .split(/[\s,;]+/)
      .map((part) => Number(part))
      .filter((num) => Number.isInteger(num) && num > 0),
  ));
  return values.length ? values : undefined;
};

const formatSeconds = (value: number) => {
  const totalMs = Math.max(0, Math.round(value * 1000));
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

export default function PrivateAudioAssemblyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const releaseId = params.id as string;
  const isAdmin = user?.role?.includes('admin') ?? false;

  const [releaseTitle, setReleaseTitle] = useState('Release');
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [primarySourceAssetId, setPrimarySourceAssetId] = useState('');
  const [segments, setSegments] = useState<SegmentDraft[]>([]);
  const [compiled, setCompiled] = useState<CompiledPreview | null>(null);
  const [sourceAssetId, setSourceAssetId] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [payloadJson, setPayloadJson] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const sourceLookup = useMemo(
    () => Object.fromEntries(sources.map((source) => [source.sourceAssetId, source])),
    [sources],
  );

  const load = async () => {
    try {
      setLoading(true);
      const [releaseRes, assemblyRes] = await Promise.all([
        fetch(`/api/releases?key=${encodeURIComponent(releaseId)}`, { cache: 'no-store' }),
        fetch(`/api/admin/releases/${encodeURIComponent(releaseId)}/audio-assembly`, { cache: 'no-store' }),
      ]);

      if (releaseRes.ok) {
        const release = await releaseRes.json();
        setReleaseTitle(release.title || release.canonicalTitle || 'Release');
      }

      if (!assemblyRes.ok) {
        const data = await assemblyRes.json().catch(() => ({}));
        throw new Error(data.error || `Assembly load failed with HTTP ${assemblyRes.status}`);
      }

      const data = await assemblyRes.json();
      setSources(Array.isArray(data.sources) ? data.sources : []);
      setPrimarySourceAssetId(String(data.primarySourceAssetId || ''));
      setSegments(Array.isArray(data.assembly?.segments) ? data.assembly.segments : []);
      setCompiled(data.compiled || null);
    } catch (err: any) {
      setError(String(err?.message || err || 'Failed to load private audio assembly.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      router.push('/admin');
      return;
    }
    void load();
  }, [isAdmin, releaseId, router, user]);

  const importSource = async () => {
    try {
      setWorking(true);
      setError('');
      setMessage('');
      let payload: unknown = undefined;
      if (payloadJson.trim()) payload = JSON.parse(payloadJson);

      const response = await fetch(`/api/admin/releases/${encodeURIComponent(releaseId)}/audio-assembly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import-source',
          sourceAssetId: sourceAssetId.trim() || undefined,
          sourceUrl: sourceUrl.trim() || undefined,
          payload,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Import failed with HTTP ${response.status}`);

      setSources(Array.isArray(data.sources) ? data.sources : []);
      setPrimarySourceAssetId(String(data.primarySourceAssetId || primarySourceAssetId));
      setSourceAssetId('');
      setSourceUrl('');
      setPayloadJson('');
      setMessage(`Private source ${data.source?.sourceAssetId || ''} imported. Nothing public changed.`);
    } catch (err: any) {
      setError(String(err?.message || err || 'Private source import failed.'));
    } finally {
      setWorking(false);
    }
  };

  const addSegment = () => {
    if (!sources.length) return;
    const source = sources[Math.min(segments.length, sources.length - 1)];
    const previous = [...segments].sort((a, b) => a.order - b.order).at(-1);
    const previousSource = previous ? sourceLookup[previous.sourceAssetId] : undefined;
    const previousOut = previous
      ? (previous.sourceOutSeconds ?? previousSource?.durationSeconds ?? 0)
      : 0;
    const previousDuration = previous ? Math.max(0, previousOut - previous.sourceInSeconds) : 0;
    const destinationStart = previous ? previous.destinationStartSeconds + previousDuration : 0;

    setSegments((current) => [
      ...current,
      {
        segmentId: `segment-${current.length + 1}`,
        sourceAssetId: source.sourceAssetId,
        role: current.length === 0 ? 'primary' : 'extension',
        parentSourceAssetId: current.length === 0 ? undefined : primarySourceAssetId || current[0]?.sourceAssetId,
        order: current.length + 1,
        sourceInSeconds: 0,
        sourceOutSeconds: source.durationSeconds,
        destinationStartSeconds: destinationStart,
        transition: { type: 'cut' },
        enabled: true,
      },
    ]);
    setCompiled(null);
  };

  const updateSegment = (index: number, patch: Partial<SegmentDraft>) => {
    setSegments((current) => current.map((segment, i) => i === index ? { ...segment, ...patch } : segment));
    setCompiled(null);
  };

  const removeSegment = (index: number) => {
    setSegments((current) => current.filter((_, i) => i !== index));
    setCompiled(null);
  };

  const compileOrSave = async (save: boolean) => {
    try {
      setWorking(true);
      setError('');
      setMessage('');
      const response = await fetch(`/api/admin/releases/${encodeURIComponent(releaseId)}/audio-assembly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: save ? 'save-assembly' : 'compile',
          segments,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Assembly request failed with HTTP ${response.status}`);
      setCompiled(data.compiled || null);
      if (save && data.assembly) setSegments(data.assembly.segments || segments);
      setMessage(save
        ? `Assembly v${data.assembly?.version || '?'} saved privately. Canonical caption timing has not been replaced.`
        : 'Assembly compiled for inspection only. Nothing was saved or published.');
    } catch (err: any) {
      setError(String(err?.message || err || 'Assembly could not be compiled.'));
    } finally {
      setWorking(false);
    }
  };

  if (!user || loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-white/60">Loading private production assembly…</div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href={`/admin/cms-releases/${releaseId}/audio-alignment`} className="mb-3 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to alignment
            </Link>
            <h1 className="text-2xl font-semibold text-white">Private Production Assembly</h1>
            <p className="mt-1 text-sm text-white/60">{releaseTitle}</p>
          </div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
            Admin-only • source-local → master timeline
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
            <div>
              <h2 className="font-medium text-white">One release, multiple private clips</h2>
              <p className="mt-1 max-w-4xl text-sm leading-6 text-white/60">
                Keep each clip's original alignment untouched. Define where each clip starts and ends in the Canva edit, then compile those local timestamps into one SufiPulse master timeline. Repeated extension lines are excluded explicitly by source line number; they are never guessed away automatically.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-medium text-white">1. Private source clips</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {sources.map((source) => (
              <div key={source.sourceAssetId} className="rounded-xl border border-white/10 bg-black/15 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-mono text-xs text-white/70">{source.sourceAssetId}</div>
                    <div className="mt-1 text-xs text-white/45">{source.sourceAssetId === primarySourceAssetId ? 'Primary source' : 'Additional source'}</div>
                  </div>
                  <div className="text-sm font-semibold text-white">{formatSeconds(source.durationSeconds || 0)}</div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/50">
                  <span>{source.stats?.lineCount || 0} lines</span>
                  <span>{source.stats?.wordCount || 0} words</span>
                  <span>{source.stats?.overlapCount || 0} overlaps</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="Additional private source URL"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50"
            />
            <input
              value={sourceAssetId}
              onChange={(event) => setSourceAssetId(event.target.value)}
              placeholder="Or additional source asset ID"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50"
            />
          </div>
          <textarea
            value={payloadJson}
            onChange={(event) => setPayloadJson(event.target.value)}
            rows={4}
            placeholder="Optional controlled-test alignment JSON for this source"
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-amber-400/50"
          />
          <button
            type="button"
            disabled={working || (!sourceUrl.trim() && !sourceAssetId.trim())}
            onClick={() => void importSource()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Import additional source
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-medium text-white">2. Assembly segments</h2>
              <p className="mt-1 text-sm text-white/50">Destination Start is the exact position of that segment in the final Canva audio edit.</p>
            </div>
            <button
              type="button"
              disabled={!sources.length || working}
              onClick={addSegment}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white/80 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" /> Add segment
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {segments.map((segment, index) => {
              const source = sourceLookup[segment.sourceAssetId];
              return (
                <div key={`${segment.segmentId}-${index}`} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <GitMerge className="h-4 w-4 text-sky-300" />
                      <span className="font-medium text-white">Segment {index + 1}</span>
                    </div>
                    <button type="button" onClick={() => removeSegment(index)} className="text-white/40 hover:text-rose-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="text-xs text-white/45">Source
                      <select
                        value={segment.sourceAssetId}
                        onChange={(event) => updateSegment(index, { sourceAssetId: event.target.value })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-950 px-2 py-2 text-sm text-white"
                      >
                        {sources.map((item) => <option key={item.sourceAssetId} value={item.sourceAssetId}>{item.sourceAssetId}</option>)}
                      </select>
                    </label>
                    <label className="text-xs text-white/45">Role
                      <select
                        value={segment.role}
                        onChange={(event) => updateSegment(index, { role: event.target.value as SegmentDraft['role'] })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-950 px-2 py-2 text-sm text-white"
                      >
                        <option value="primary">primary</option>
                        <option value="extension">extension</option>
                        <option value="alternate">alternate</option>
                        <option value="correction">correction</option>
                        <option value="other">other</option>
                      </select>
                    </label>
                    <label className="text-xs text-white/45">Source In (sec)
                      <input type="number" step="0.001" min="0" value={segment.sourceInSeconds} onChange={(event) => updateSegment(index, { sourceInSeconds: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-sm text-white" />
                    </label>
                    <label className="text-xs text-white/45">Source Out (sec)
                      <input type="number" step="0.001" min="0" value={segment.sourceOutSeconds ?? source?.durationSeconds ?? ''} onChange={(event) => updateSegment(index, { sourceOutSeconds: event.target.value === '' ? undefined : Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-sm text-white" />
                    </label>
                    <label className="text-xs text-white/45">Destination Start (sec)
                      <input type="number" step="0.001" min="0" value={segment.destinationStartSeconds} onChange={(event) => updateSegment(index, { destinationStartSeconds: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-sm text-white" />
                    </label>
                    <label className="text-xs text-white/45">Transition
                      <select
                        value={segment.transition?.type || 'cut'}
                        onChange={(event) => updateSegment(index, { transition: event.target.value === 'crossfade' ? { type: 'crossfade', durationSeconds: 1 } : { type: 'cut' } })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-950 px-2 py-2 text-sm text-white"
                      >
                        <option value="cut">cut</option>
                        <option value="crossfade">crossfade</option>
                      </select>
                    </label>
                    {segment.transition?.type === 'crossfade' ? (
                      <label className="text-xs text-white/45">Crossfade (sec)
                        <input type="number" step="0.001" min="0.001" value={segment.transition.durationSeconds ?? 1} onChange={(event) => updateSegment(index, { transition: { type: 'crossfade', durationSeconds: Number(event.target.value) } })} className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-sm text-white" />
                      </label>
                    ) : null}
                    <label className="text-xs text-white/45">Exclude source line #
                      <input
                        type="text"
                        defaultValue={(segment.excludedSourceLineIndexes || []).join(', ')}
                        onBlur={(event) => updateSegment(index, { excludedSourceLineIndexes: parseIndexList(event.target.value) })}
                        placeholder="e.g. 1, 2"
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-sm text-white"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!segments.length || working}
              onClick={() => void compileOrSave(false)}
              className="rounded-xl border border-sky-300/30 bg-sky-300/10 px-4 py-2.5 text-sm font-semibold text-sky-100 disabled:opacity-40"
            >
              Compile preview
            </button>
            <button
              type="button"
              disabled={!segments.length || working}
              onClick={() => void compileOrSave(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
            >
              <Save className="h-4 w-4" /> Save private assembly
            </button>
          </div>
        </section>

        {compiled ? (
          <section className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.04] p-5">
            <h2 className="font-medium text-white">3. Compiled master-timeline preview</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
              {[
                ['Duration', formatSeconds(compiled.durationSeconds)],
                ['Segments', compiled.stats.segmentCount],
                ['Sources', compiled.stats.sourceCount],
                ['Lines', compiled.stats.lineCount],
                ['Publishable', compiled.stats.publishableLineCount],
                ['Excluded', compiled.stats.excludedLineCount],
                ['Clipped', compiled.stats.clippedLineCount],
                ['Overlaps', compiled.stats.overlapCount],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-white/10 bg-black/15 p-3">
                  <div className="text-[11px] text-white/45">{label}</div>
                  <div className="mt-1 text-sm font-semibold text-white">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
              {compiled.previewLines.map((line) => (
                <div key={`${line.segmentId}-${line.sourceLineIndex}-${line.startSeconds}`} className="grid gap-2 border-b border-white/5 px-4 py-3 last:border-b-0 md:grid-cols-[150px_170px_1fr]">
                  <div className="font-mono text-xs text-white/50">{formatSeconds(line.startSeconds)} → {formatSeconds(line.endSeconds)}</div>
                  <div className="text-xs text-white/40">{line.segmentId} • source #{line.sourceLineIndex}</div>
                  <div className={line.isProductionDirection ? 'text-sm text-amber-200/70' : 'text-sm text-white/85'}>
                    {line.text}
                    {(line.clippedAtStart || line.clippedAtEnd) ? <span className="ml-2 text-[10px] uppercase text-rose-200/60">clipped at edit</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {message ? <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
        {error ? <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
      </div>
    </DashboardLayout>
  );
}
