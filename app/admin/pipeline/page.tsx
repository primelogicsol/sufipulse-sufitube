"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Trash2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Info,
  ShieldCheck,
  Headphones,
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
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role?.includes('admin') ?? false;

  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newSunoUrl, setNewSunoUrl] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newLyrics, setNewLyrics] = useState('');
  const [titleAutoFilled, setTitleAutoFilled] = useState(false);
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [titleFetchNote, setTitleFetchNote] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [sunoConnection, setSunoConnection] = useState<{state: string; message?: string}>({ state: 'checking' });
  const [connectingSuno, setConnectingSuno] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    const check = async () => {
      try {
        const response = await fetch('/api/admin/pipeline/suno-connection', { cache: 'no-store' });
        const data = await response.json();
        if (mounted) setSunoConnection(response.ok ? data : { state: 'unavailable', message: data.error || 'Could not check Suno.' });
      } catch {
        if (mounted) setSunoConnection({ state: 'unavailable', message: 'Connection status unavailable.' });
      }
    };
    void check();
    const timer = setInterval(check, 4000);
    return () => { mounted = false; clearInterval(timer); };
  }, [isAdmin]);

  const connectSuno = async () => {
    setConnectingSuno(true);
    try {
      const response = await fetch('/api/admin/pipeline/suno-connection', { method: 'POST' });
      const data = await response.json();
      setSunoConnection(response.ok ? data : { state: 'needs_signin', message: data.error || 'Could not start Suno sign-in.' });
    } catch {
      setSunoConnection({ state: 'needs_signin', message: 'Could not open the Suno sign-in window.' });
    } finally {
      setConnectingSuno(false);
    }
  };

  // Auto-fetch canonical title from a pasted Suno URL / asset ID
  useEffect(() => {
    const m = newSunoUrl.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    if (!m) {
      setTitleFetchNote(null);
      return;
    }
    // Never overwrite a title the admin typed manually
    if (newTitle.trim() && !titleAutoFilled) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setFetchingTitle(true);
        setTitleFetchNote(null);
        const res = await fetch(`/api/admin/pipeline/suno-metadata?url=${encodeURIComponent(m[0])}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.title) {
          setNewTitle(data.title);
          setTitleAutoFilled(true);
          setTitleFetchNote(`Fetched from Suno${data.artist ? ` (by ${data.artist})` : ''}. You can edit it.`);
        } else {
          setTitleFetchNote(data.error ? `Could not fetch title: ${data.error}. Enter it manually.` : 'Could not fetch title. Enter it manually.');
        }
      } catch {
        if (!cancelled) setTitleFetchNote('Could not fetch title. Enter it manually.');
      } finally {
        if (!cancelled) setFetchingTitle(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSunoUrl]);

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

  // Handle smart title input (auto-detect pasted Suno URLs or UUID fragments)
  const handleTitleChange = (val: string) => {
    const trimmed = val.trim();
    const uuidMatch = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    const isSunoUrl = trimmed.includes('suno.com/song/') || trimmed.startsWith('https://suno.com');

    if (isSunoUrl || (uuidMatch && trimmed.length <= 42)) {
      const assetId = uuidMatch ? uuidMatch[0] : trimmed;
      if (!newSunoUrl) {
        setNewSunoUrl(isSunoUrl ? trimmed : `https://suno.com/song/${assetId}`);
      }
      // Title will be auto-fetched from Suno by the URL effect
      setTitleAutoFilled(true);
      setNewTitle('');
      return;
    }
    setTitleAutoFilled(false);
    setNewTitle(val);
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!newTitle.trim() && !newSunoUrl.trim()) {
      setCreateError('Please enter a Song Title or Suno URL.');
      return;
    }

    try {
      setCreateLoading(true);
      const res = await fetch('/api/admin/pipeline/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          sunoUrl: newSunoUrl.trim() || undefined,
          duration: newDuration.trim() || undefined,
          lyricsText: newLyrics.trim(),
          primaryLanguage: 'ur',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Creation failed with status ${res.status}`);
      }

      setShowCreateModal(false);
      setNewTitle('');
      setNewSunoUrl('');
      setNewDuration('');
      setNewLyrics('');

      if (data.draft?.draftId) {
        router.push(`/admin/pipeline/${data.draft.draftId}`);
      } else {
        await fetchDrafts();
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create release pipeline');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete draft "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchDrafts();
      } else {
        const d = await res.json();
        alert(`Failed to delete draft: ${d.error || res.statusText}`);
      }
    } catch (err: any) {
      alert(`Error deleting draft: ${err.message}`);
    }
  };

  const handleClearAllDrafts = async () => {
    if (!confirm('Are you sure you want to clear ALL pipeline drafts? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/pipeline/drafts', {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchDrafts();
      } else {
        const d = await res.json();
        alert(`Failed to clear drafts: ${d.error || res.statusText}`);
      }
    } catch (err: any) {
      alert(`Error clearing drafts: ${err.message}`);
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
              type="button"
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>{isHelpOpen ? 'Hide Pipeline Guide' : 'How to Use Pipeline'}</span>
              {isHelpOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {drafts.length > 0 && (
              <button
                onClick={handleClearAllDrafts}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors"
                title="Clear all pipeline drafts"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                Clear All Drafts
              </button>
            )}
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

        <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between" aria-label="Suno connection">
          <div>
            <h2 className="font-semibold text-white">Suno account connection</h2>
            <p className="text-sm text-white/70 mt-1">
              {sunoConnection.state === 'connected' ? 'Connected. Sign-in is saved for future authorized imports.' :
               sunoConnection.state === 'connecting' ? 'Sign in to Suno in the dedicated Chrome window. This status updates automatically.' :
               sunoConnection.message || 'Connect Suno once to reuse your Chrome sign-in.'}
            </p>
            <p className="text-xs text-white/45 mt-1">Dedicated local Chrome profile. Reconnection may be required if Suno expires the session.</p>
          </div>
          <button type="button" onClick={connectSuno} disabled={connectingSuno || sunoConnection.state === 'connecting' || sunoConnection.state === 'checking'}
            className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
            {sunoConnection.state === 'connected' ? 'Reconnect Suno' : sunoConnection.state === 'connecting' ? 'Waiting for Sign-in' : 'Connect Suno'}
          </button>
        </section>

        {/* Expandable / Collapsible In-Page Help Guide */}
        {isHelpOpen && (
          <div className="rounded-2xl border border-amber-500/30 bg-black/60 backdrop-blur-sm p-6 shadow-2xl space-y-6 text-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
                <Info className="w-5 h-5" />
                <span>Hybrid Studio Pipeline — End-to-End Workflow Guide</span>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                Close ✕
              </button>
            </div>

            {/* Workflow Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                  <Music className="w-4 h-4" /> 1. Audio Master & Variant Ingestion
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Import multiple audio takes to assemble the definitive song:
                </p>
                <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
                  <li><strong className="text-white/80">Suno URL:</strong> Paste any Suno song link to auto-extract the 36-char asset ID.</li>
                  <li><strong className="text-white/80">Upload Audio:</strong> Directly upload <code className="text-amber-300">.wav</code>, <code className="text-amber-300">.mp3</code>, or <code className="text-amber-300">.m4a</code> files. Local <code className="text-amber-300">ffprobe</code> will calculate exact duration and waveforms.</li>
                  <li><strong className="text-white/80">Re-render Master WAV:</strong> Slices and crossfades takes into an uncompressed lossless 48kHz / 16-bit PCM WAV master.</li>
                </ul>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                  <FileText className="w-4 h-4" /> 2. Multilingual Lyrics & Synchronization
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Generates and synchronizes 4 authoritative lyric tracks mapped against the master audio timestamps:
                </p>
                <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
                  <li><strong className="text-white/80">1. Urdu (Nastaliq):</strong> Canonical right-to-left Urdu poetry in authentic Nastaliq typography.</li>
                  <li><strong className="text-white/80">2. Sufi English:</strong> Philosophical and theological English translation.</li>
                  <li><strong className="text-white/80">3. Roman Urdu:</strong> Phonetic transliteration for global singers and listeners.</li>
                  <li><strong className="text-white/80">4. Devanagari:</strong> Hindi script rendering for South Asian accessibility.</li>
                  <li><strong className="text-white/80">Exports:</strong> Download synchronized <code className="text-blue-300">.vtt</code>, <code className="text-blue-300">.srt</code>, or advanced styling <code className="text-blue-300">.ass</code> files.</li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                  <Video className="w-4 h-4" /> 3. 1080p Video Studio
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Renders full-length 1920x1080 music videos using GPU/FFmpeg acceleration in two distinct formats:
                </p>
                <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
                  <li><strong className="text-white/80">1. Lyric Master:</strong> Full HD video with burned Dual-Subtitle typography (prominent Nastaliq on top + English translation beneath).</li>
                  <li><strong className="text-white/80">2. Clean Cinematic:</strong> Unburned 1080p canvas for viewers who prefer toggleable Closed Captions (CC).</li>
                </ul>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wider">
                  <Send className="w-4 h-4" /> 4. Human Approval Gate & Publishing
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Automated publishing is locked until a human administrator reviews and signs off:
                </p>
                <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
                  <li><strong className="text-white/80">Checklist:</strong> Verify audio continuity, confirm Nastaliq typography, and review synchronized lyric intervals.</li>
                  <li><strong className="text-white/80">4-Phase Publishing Transaction:</strong>
                    <ol className="list-decimal list-inside pl-1 text-[11px] text-white/50 space-y-0.5 mt-1">
                      <li>Upload 1080p video as private to YouTube SufiPulse channel.</li>
                      <li>Upload and attach 4 localized CC subtitle tracks.</li>
                      <li>Register canonical release into the SufiPulse CMS database.</li>
                      <li>Switch video visibility to public unveiling.</li>
                    </ol>
                  </li>
                </ul>
              </div>
            </div>

            {/* Governance Callout */}
            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-white">Canonical Title Authority (GEMINI.md Governance Invariant)</span>
                <p className="text-white/70 leading-relaxed">
                  Canonical song title = permanent identity. YouTube A/B/C testing may optimize thumbnail packaging and qualifiers, but all variants must begin with the exact same canonical song title.
                </p>
              </div>
            </div>
          </div>
        )}

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
                        <span className="flex items-center gap-1.5 text-white/70 font-medium">
                          <Video className="w-3.5 h-3.5 text-white/50" />
                          Part A (Thumbnail)
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-300/90 font-medium">
                          <Video className="w-3.5 h-3.5 text-amber-400" />
                          Part B (DAHa7St5CYs)
                        </span>
                        <span className="flex items-center gap-1.5 text-blue-300/90 font-medium">
                          <Video className="w-3.5 h-3.5 text-blue-400" />
                          Part C (DAHa7eJOcbI)
                        </span>
                        <span className="text-white/40">
                          Updated {new Date(draft.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end md:self-center">
                      <button
                        onClick={() => handleDeleteDraft(draft.draftId, draft.title)}
                        className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/20 hover:border-red-500/40 text-white/50 hover:text-red-300 transition-colors"
                        title="Delete this draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                {createError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                    {createError}
                  </div>
                )}

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-white/70 mb-1.5">
                    Canonical Song Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Rab Ki Tasbeeh (Bolo Ab Toh Bolo)"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-white/40">
                    The permanent canonical title for SufiPulse and YouTube Variant A.
                  </p>
                  {(fetchingTitle || titleFetchNote) && (
                    <p className="mt-1 text-xs text-amber-300/80">
                      {fetchingTitle ? 'Fetching title from Suno…' : titleFetchNote}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-wider font-semibold text-white/70 mb-1.5">
                      Initial Suno Variant URL / Asset ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={newSunoUrl}
                      onChange={(e) => setNewSunoUrl(e.target.value)}
                      placeholder="https://suno.com/song/6a79ea36-a31d-45db-aae1-6862e99db69e"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-400 focus:outline-none font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-white/70 mb-1.5">
                      Duration (Optional)
                    </label>
                    <input
                      type="text"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      placeholder="e.g. 4:45 or 285s"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-400 focus:outline-none font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-white/70 mb-1.5">
                    Original Urdu / Canonical Lyrics
                  </label>
                  <textarea
                    rows={5}
                    value={newLyrics}
                    onChange={(e) => setNewLyrics(e.target.value)}
                    placeholder="بولو اب تو بولو خاموش زمیرو...&#10;عشق اور فنا میں خاموشی کا نور ہے..."
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
                    disabled={createLoading || (!newTitle.trim() && !newSunoUrl.trim())}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {createLoading ? 'Initializing...' : 'Initialize Pipeline'}
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
