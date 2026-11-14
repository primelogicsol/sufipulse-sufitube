"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Sparkles,
  Music,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Video,
  Send,
  RefreshCw,
} from 'lucide-react';

interface DraftItem {
  draftId: string;
  title: string;
  slug: string;
  primaryLanguage: string;
  currentRevision: number;
  variants: Record<string, any>;
  masterAudio: {
    durationSeconds: number;
    format: string;
    renderedAt: string;
  } | null;
  downstreamStatus: {
    timestampsValid: boolean;
    subtitlesValid: boolean;
    videoValid: boolean;
    approvalStatus: string;
  };
  publishingTx: {
    status: string;
    youtubeVideoId?: string;
    publishedUrl?: string;
  } | null;
  updatedAt: string;
  createdAt: string;
}

export default function PipelineDashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.includes('admin') ?? false;

  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLyrics, setNewLyrics] = useState('');

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/pipeline/drafts');
      if (res.ok) {
        const data = await res.json();
        setDrafts(data.drafts || []);
      }
    } catch (err) {
      console.error('Failed to fetch drafts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDrafts();
    }
  }, [isAdmin]);

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setCreateLoading(true);
      const res = await fetch('/api/admin/pipeline/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          lyricsText: newLyrics.trim(),
          primaryLanguage: 'ur',
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewTitle('');
        setNewLyrics('');
        await fetchDrafts();
      }
    } catch (err) {
      console.error('Failed to create draft', err);
    } finally {
      setCreateLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-white/60">Admin authorization required.</div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string, txStatus?: string) => {
    if (txStatus === 'VISIBILITY_UNVEILED' || status === 'published') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" /> Published
        </span>
      );
    }
    if (status === 'approved_for_publishing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Send className="w-3.5 h-3.5" /> Approved for Publishing
        </span>
      );
    }
    if (status === 'ready_for_video') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Video className="w-3.5 h-3.5" /> Subtitles Ready (Video Pending)
        </span>
      );
    }
    if (status === 'assembly_pending_review') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" /> Assembly in Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70 border border-white/10">
        <Layers className="w-3.5 h-3.5" /> Draft Intake
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-8 px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Hybrid Studio
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                New-Release Automation Pipeline
              </h1>
            </div>
            <p className="mt-1 text-sm text-white/60">
              Isolated production pipeline for new Suno AI songs, multilingual lyric synchronization, dual-subtitle video rendering, and recoverable publishing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDrafts}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-lg shadow-amber-500/20 transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              New Release Pipeline
            </button>
          </div>
        </div>

        {/* Pipeline Info Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-wider text-white/40 font-medium">1. Suno Intake & Alignment</div>
            <div className="mt-1 text-sm text-white font-medium">Lossless 48kHz WAV Splicing</div>
            <p className="mt-1 text-xs text-white/50">Mathematical timestamp mapping across spliced variants.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-wider text-white/40 font-medium">2. Multilingual Engine</div>
            <div className="mt-1 text-sm text-white font-medium">4 Core Representations</div>
            <p className="mt-1 text-xs text-white/50">Urdu Nastaliq, Sufi English, Roman Urdu & Devanagari.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-wider text-white/40 font-medium">3. Video Production</div>
            <div className="mt-1 text-sm text-white font-medium">1080p Dual-Subtitle Master</div>
            <p className="mt-1 text-xs text-white/50">Clean cinematic canvas + burned Nastaliq/English dual tracks.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-wider text-white/40 font-medium">4. Recoverable Publishing</div>
            <div className="mt-1 text-sm text-white font-medium">Human-Gate 4-Phase Machine</div>
            <p className="mt-1 text-xs text-white/50">Private upload &rarr; 4 CC tracks &rarr; CMS &rarr; Public unveil.</p>
          </div>
        </div>

        {/* Drafts List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Active Production Drafts ({drafts.length})</h2>

          {loading ? (
            <div className="p-12 text-center text-white/40 rounded-2xl border border-white/10 bg-white/[0.02]">
              Loading pipeline drafts...
            </div>
          ) : drafts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <Sparkles className="w-10 h-10 text-amber-400/60 mx-auto mb-3" />
              <p className="text-base text-white/80 font-medium">No active pipeline drafts</p>
              <p className="text-sm text-white/50 mt-1 max-w-md mx-auto">
                Create a new release pipeline to import Suno variants, generate synchronized translations, and render dual-subtitle master videos.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Start First Release Pipeline
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {drafts.map((draft) => {
                const variantCount = Object.keys(draft.variants || {}).length;
                return (
                  <div
                    key={draft.draftId}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-amber-500/30 transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-lg font-semibold text-white truncate">{draft.title}</h3>
                        {getStatusBadge(
                          draft.downstreamStatus?.approvalStatus || 'draft',
                          draft.publishingTx?.status
                        )}
                        <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">
                          Rev {draft.currentRevision || 1}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
                        <span className="flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-amber-400" />
                          {variantCount} Audio {variantCount === 1 ? 'Variant' : 'Variants'}
                        </span>
                        {draft.masterAudio && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            Master: {draft.masterAudio.durationSeconds.toFixed(1)}s WAV
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          Subtitles: {draft.downstreamStatus?.subtitlesValid ? 'Ready' : 'Pending'}
                        </span>
                        <span className="text-white/40">
                          Updated {new Date(draft.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <Link
                        href={`/admin/pipeline/${draft.draftId}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black font-semibold text-sm text-white transition-all group-hover:shadow-md"
                      >
                        <span>Open Review Cockpit</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Create New Draft */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-neutral-900 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Create New Release Pipeline</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-white/40 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateDraft} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-white/70 mb-1.5">
                    Canonical Song Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Noor-e-Fana (Radiance of Divine Silence)"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-white/40">
                    The permanent canonical title for SufiPulse and YouTube Variant A.
                  </p>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-white/70 mb-1.5">
                    Original Urdu / Canonical Lyrics
                  </label>
                  <textarea
                    rows={6}
                    value={newLyrics}
                    onChange={(e) => setNewLyrics(e.target.value)}
                    placeholder="عشق اور فنا میں خاموشی کا نور ہے...&#10;هر دم دلِ بے قرار با یادِ حق..."
                    dir="rtl"
                    className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white placeholder-white/30 focus:border-amber-400 focus:outline-none font-serif leading-relaxed"
                  />
                  <p className="mt-1 text-xs text-white/40">
                    Original Urdu poetry will serve as the immutable foundation for word alignment, transliterations, and Sufi theological translations.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading || !newTitle.trim()}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {createLoading ? 'Creating...' : 'Initialize Pipeline'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
