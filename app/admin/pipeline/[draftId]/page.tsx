"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import {
  ArrowLeft,
  Music,
  CheckCircle2,
  AlertCircle,
  FileText,
  Video,
  Play,
  Pause,
  Upload,
  RefreshCw,
  Send,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Download,
  Clock,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Info,
} from 'lucide-react';

type LangTab = 'ur' | 'en' | 'en-rom' | 'ur-deva';

export default function PipelineCockpitPage() {
  const params = useParams();
  const draftId = params?.draftId as string;
  const router = useRouter();

  const { user } = useAuth();
  const isAdmin = user?.role?.includes('admin') ?? false;

  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Multilingual & Subtitle State
  const [selectedLang, setSelectedLang] = useState<LangTab>('ur');
  const [multilingualPkg, setMultilingualPkg] = useState<any>(null);
  const [generatingMulti, setGeneratingMulti] = useState(false);
  const [compilingSubtitles, setCompilingSubtitles] = useState(false);

  // Video State
  const [videoFormat, setVideoFormat] = useState<'lyric_master' | 'clean_cinematic'>('lyric_master');
  const [renderingVideo, setRenderingVideo] = useState(false);
  const [videoRenderResult, setVideoRenderResult] = useState<any>(null);

  // Part A Canva Artwork State
  const [partAFile, setPartAFile] = useState<File | null>(null);
  const [uploadingPartA, setUploadingPartA] = useState(false);

  // Part B Canva Video State
  const [partBFile, setPartBFile] = useState<File | null>(null);
  const [uploadingPartB, setUploadingPartB] = useState(false);
  const [partBPlaybackMode, setPartBPlaybackMode] = useState<'full_19_scenes' | 'trimmed'>('full_19_scenes');
  const [partBAudioMode, setPartBAudioMode] = useState<'preserve_canva_audio' | 'crossfade' | 'mute'>('preserve_canva_audio');

  // Variant Upload State
  const [variantSourceMode, setVariantSourceMode] = useState<'url' | 'file'>('url');
  const [variantLabel, setVariantLabel] = useState('');
  const [sunoUrl, setSunoUrl] = useState('');
  const [sunoDuration, setSunoDuration] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadingVariant, setUploadingVariant] = useState(false);
  const [renderingMaster, setRenderingMaster] = useState(false);

  // Approval & Publishing
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [savingApproval, setSavingApproval] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishVisibility, setPublishVisibility] = useState<'public' | 'unlisted'>('public');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const fetchDraft = async () => {
    if (!draftId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(`Failed to load draft (${res.status}): ${d.error || res.statusText}`);
      }
      const data = await res.json();
      setDraft(data.draft);
      if (data.draft?.downstreamStatus?.approvalStatus === 'approved_for_publishing') {
        setApprovalConfirmed(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching draft');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && draftId) {
      fetchDraft();
    }
  }, [isAdmin, draftId]);

  // Audio Player Toggle
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => console.error('Audio playback failed', err));
    }
  };

  // Add Variant (Suno URL or Audio Upload)
  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (variantSourceMode === 'url' && !sunoUrl.trim()) return;
    if (variantSourceMode === 'file' && !audioFile) return;

    try {
      setUploadingVariant(true);
      let res: Response;

      if (variantSourceMode === 'file' && audioFile) {
        const fd = new FormData();
        fd.append('file', audioFile);
        fd.append('label', variantLabel.trim() || `Variant ${Object.keys(draft?.variants || {}).length + 1}`);
        res = await fetch(`/api/admin/pipeline/drafts/${draftId}/upload-variant`, {
          method: 'POST',
          body: fd,
        });
      } else {
        res = await fetch(`/api/admin/pipeline/drafts/${draftId}/upload-variant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceType: 'suno_url',
            sunoUrl: sunoUrl.trim(),
            duration: sunoDuration.trim() || undefined,
            label: variantLabel.trim() || `Variant ${Object.keys(draft?.variants || {}).length + 1}`,
            role: 'primary',
          }),
        });
      }

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const errCode = d.code ? `[${d.code}] ` : '';
        throw new Error(`${errCode}${d.error || 'Failed to import audio variant'}`);
      }

      setSunoUrl('');
      setSunoDuration('');
      setVariantLabel('');
      setAudioFile(null);
      await fetchDraft();
    } catch (err: any) {
      alert(`Error importing variant: ${err.message}`);
    } finally {
      setUploadingVariant(false);
    }
  };

  // Render Master Audio
  const handleRenderMaster = async () => {
    try {
      setRenderingMaster(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/render-master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Render master audio failed');
      }

      await fetchDraft();
    } catch (err: any) {
      alert(`Master Audio Render failed: ${err.message}`);
    } finally {
      setRenderingMaster(false);
    }
  };

  // Generate Multilingual Package
  const handleGenerateMultilingual = async () => {
    try {
      setGeneratingMulti(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/multilingual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to generate multilingual package');
      }

      const data = await res.json();
      setMultilingualPkg(data.package);
      await fetchDraft();
    } catch (err: any) {
      alert(`Multilingual generation failed: ${err.message}`);
    } finally {
      setGeneratingMulti(false);
    }
  };

  // Compile Subtitles
  const handleCompileSubtitles = async () => {
    try {
      setCompilingSubtitles(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/subtitles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to compile subtitles');
      }

      await fetchDraft();
      alert('Synchronized Subtitles (.vtt, .srt, .ass) compiled successfully!');
    } catch (err: any) {
      alert(`Subtitle compilation failed: ${err.message}`);
    } finally {
      setCompilingSubtitles(false);
    }
  };

  // Render Master Video
  const handleRenderVideo = async () => {
    try {
      setRenderingVideo(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/render-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: videoFormat }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to render master video');
      }

      const data = await res.json();
      setVideoRenderResult(data.video);
      await fetchDraft();
    } catch (err: any) {
      alert(`Video rendering failed: ${err.message}`);
    } finally {
      setRenderingVideo(false);
    }
  };

  // Upload Part A (Canva Background Theme Image)
  const handleUploadPartA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partAFile) return;
    try {
      setUploadingPartA(true);
      const formData = new FormData();
      formData.append('file', partAFile);
      formData.append('canvaDesignId', draft?.video?.partA?.canvaDesignId || 'DAHa7St5CYs');
      formData.append('canvaUrl', draft?.video?.partA?.canvaUrl || 'https://canva.link/ezqj8ymddv6yl2d');
      formData.append('title', draft?.video?.partA?.title || 'Part A Background Theme');

      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/part-a`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to attach Part A background');
      }
      await fetchDraft();
      alert('Part A (Canva Background Theme) attached successfully!');
      setPartAFile(null);
    } catch (err: any) {
      alert(`Part A upload failed: ${err.message}`);
    } finally {
      setUploadingPartA(false);
    }
  };

  // Upload Part B (Canva MP4)
  const handleUploadPartB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partBFile) return;
    try {
      setUploadingPartB(true);
      const formData = new FormData();
      formData.append('file', partBFile);
      formData.append('canvaDesignId', draft?.video?.partB?.canvaDesignId || 'DAHa7eJOcbI');
      formData.append('playbackMode', partBPlaybackMode);
      formData.append('audioMode', partBAudioMode);

      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/part-b`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to attach Part B MP4');
      }
      await fetchDraft();
      alert('Part B (Canva Promotional Video) MP4 attached successfully!');
      setPartBFile(null);
    } catch (err: any) {
      alert(`Part B upload failed: ${err.message}`);
    } finally {
      setUploadingPartB(false);
    }
  };

  // Save Human Approval
  const handleSaveApproval = async () => {
    try {
      setSavingApproval(true);
      const newStatus = approvalConfirmed ? 'approved_for_publishing' : 'ready_for_video';
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalStatus: newStatus,
          notes: approvalNotes,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update approval status');
      }

      await fetchDraft();
    } catch (err: any) {
      alert(`Approval save failed: ${err.message}`);
    } finally {
      setSavingApproval(false);
    }
  };

  // Execute Publishing State Machine
  const handleExecutePublish = async () => {
    try {
      setPublishing(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visibility: publishVisibility,
          adminApprovalConfirmed: true,
          videoFormat,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Publishing failed');
      }

      setPublishResult(data);
      setShowPublishModal(false);
      await fetchDraft();
    } catch (err: any) {
      alert(`Publishing execution error: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-white/60">Admin authorization required.</div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-16 text-center text-white/50">Loading Review Cockpit...</div>
      </DashboardLayout>
    );
  }

  if (error || !draft) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-white text-lg">{error || 'Draft not found'}</p>
          <Link href="/admin/pipeline" className="text-amber-400 hover:underline text-sm">
            &larr; Back to Pipeline Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isApproved = draft.downstreamStatus?.approvalStatus === 'approved_for_publishing';
  const isPublished = draft.publishingTx?.status === 'VISIBILITY_UNVEILED' || draft.downstreamStatus?.approvalStatus === 'published';
  const hasMasterAudio = Boolean(draft.masterAudio?.filePath);
  const hasSubtitles = Boolean(draft.downstreamStatus?.subtitlesValid);
  const hasVideo = Boolean(draft.downstreamStatus?.videoValid);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1440px] space-y-8 px-6 py-8">
        {/* Cockpit Top Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/pipeline"
                className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Pipeline
              </Link>
              <span className="text-white/20">•</span>
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {draft.draftId}
              </span>
              <span className="text-xs font-mono text-white/40">Rev {draft.currentRevision}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{draft.title}</h1>
            <p className="text-xs text-white/50">
              Canonical Slug: <span className="font-mono text-white/70">{draft.slug}</span>
            </p>
          </div>

          {/* Quick Stage Status Indicators & Guide Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>{isHelpOpen ? 'Hide Cockpit Guide' : 'How to Use Cockpit'}</span>
              {isHelpOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                hasMasterAudio
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/5 text-white/40 border-white/10'
              }`}
            >
              <Music className="w-3.5 h-3.5" /> 1. Audio Master
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                hasSubtitles
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/5 text-white/40 border-white/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> 2. Subtitles (4 Tracks)
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                hasVideo
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/5 text-white/40 border-white/10'
              }`}
            >
              <Video className="w-3.5 h-3.5" /> 3. 1080p Video
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                isApproved
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  : 'bg-white/5 text-white/40 border-white/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> 4. Human Approval
            </span>
          </div>
        </div>

        {/* Expandable / Collapsible Cockpit Guide */}
        {isHelpOpen && (
          <div className="rounded-2xl border border-amber-500/30 bg-black/60 backdrop-blur-sm p-6 shadow-2xl space-y-6 text-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
                <Info className="w-5 h-5" />
                <span>Review Cockpit — Step-by-Step Operator Guide</span>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                  <Music className="w-4 h-4" /> 1. Audio Master
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Add audio takes using <strong>Suno URL</strong> or <strong>Upload Audio</strong> (.wav/.mp3/.m4a).
                </p>
                <div className="p-2.5 rounded-lg bg-white/5 text-[11px] text-white/60 space-y-1">
                  <div><strong>Action:</strong> Click <em>"Re-render Master WAV"</em> to slice & crossfade variants into the definitive 48kHz lossless master.</div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                  <FileText className="w-4 h-4" /> 2. Multilingual Lyrics
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Generates 4 localized representations mapped to the master timeline: Urdu Nastaliq, Sufi English, Roman Urdu & Devanagari.
                </p>
                <div className="p-2.5 rounded-lg bg-white/5 text-[11px] text-white/60 space-y-1">
                  <div><strong>Action:</strong> Click <em>"Run Multilingual Engine"</em> then <em>"Export Subtitles"</em> (.vtt / .srt / .ass).</div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                  <Video className="w-4 h-4" /> 3. Video Studio
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Renders 1080p Full HD video with GPU/FFmpeg acceleration.
                </p>
                <div className="p-2.5 rounded-lg bg-white/5 text-[11px] text-white/60 space-y-1">
                  <div><strong>1. Lyric Master:</strong> Burned dual Nastaliq Urdu + English translation.</div>
                  <div><strong>2. Clean Cinematic:</strong> Unburned canvas for toggleable CC.</div>
                  <div><strong>Action:</strong> Click <em>"Render 1080p Lyric Master"</em> and test playback in the preview player.</div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wider">
                  <Send className="w-4 h-4" /> 4. Human Gate & Publish
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Governance safeguard: publishing requires human sign-off.
                </p>
                <div className="p-2.5 rounded-lg bg-white/5 text-[11px] text-white/60 space-y-1">
                  <div><strong>Action:</strong> Check <em>"I approve this release"</em> &rarr; <em>"Commit Approval Status"</em> &rarr; <em>"Approve & Publish"</em> to upload to YouTube & register CMS release.</div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-white/70 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Verification & Playback Invariants</span>
              </div>
              <p>
                Always scrub the rendered video preview to ensure: (1) Urdu Nastaliq font displays legibly right-to-left without clipping, (2) English translation matches beneath it, and (3) subtitles vanish during instrumental breaks.
              </p>
            </div>
          </div>
        )}

        {/* Publication Success Banner if already published */}
        {isPublished && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">Release Live & Unveiled Globally</h4>
                <p className="text-xs text-white/70">
                  YouTube Video ID: <span className="font-mono text-emerald-300">{draft.publishingTx?.youtubeVideoId}</span> • Catalog Release ID: <span className="font-mono text-emerald-300">{draft.publishingTx?.cmsReleaseId}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {draft.publishingTx?.youtubeVideoId && (
                <a
                  href={`https://youtube.com/watch?v=${draft.publishingTx.youtubeVideoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {draft.publishingTx?.publishedUrl && (
                <Link
                  href={draft.publishingTx.publishedUrl}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                >
                  <span>View Release Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Grid Layout: Left Column (Audio & Lyrics) / Right Column (Video, Approval & Publishing) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: 7 Cols */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Master Audio & Variants Panel */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Master Audio & Suno Ingestion</h3>
                </div>
                <button
                  onClick={handleRenderMaster}
                  disabled={renderingMaster || Object.keys(draft.variants || {}).length === 0}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold border border-amber-500/40 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${renderingMaster ? 'animate-spin' : ''}`} />
                  {renderingMaster ? 'Rendering WAV...' : 'Re-render Master WAV'}
                </button>
              </div>

              {/* Master Audio Playback Bar */}
              {hasMasterAudio ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleAudio}
                      className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shrink-0 shadow-lg"
                    >
                      {isPlayingAudio ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>
                    <div>
                      <div className="text-sm font-semibold text-white">Authoritative Master Audio</div>
                      <div className="text-xs text-white/60 font-mono">
                        {draft.masterAudio.durationSeconds.toFixed(2)}s • 48kHz / 16-bit PCM WAV Lossless
                      </div>
                    </div>
                  </div>
                  <audio
                    ref={audioRef}
                    src={`/api/admin/pipeline/drafts/${draftId}/media?asset=master_audio`}
                    onEnded={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />
                  <a
                    href={`/api/admin/pipeline/drafts/${draftId}/media?asset=master_audio`}
                    download={`${draft.slug}-master.wav`}
                    className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
                  >
                    <Download className="w-3.5 h-3.5" /> Download WAV
                  </a>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/[0.03] text-xs text-amber-300/80">
                  Master audio has not been rendered yet. Ingest variants below and click "Re-render Master WAV".
                </div>
              )}

              {/* Ingested Variants List */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Ingested Variants ({Object.keys(draft.variants || {}).length})
                </div>
                <div className="space-y-2">
                  {Object.values(draft.variants || {}).map((v: any) => (
                    <div
                      key={v.variantId}
                      className="p-3 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{v.label}</div>
                        <div className="text-white/40 font-mono">
                          {v.durationSeconds.toFixed(1)}s • {v.format.toUpperCase()} • {v.sampleRate}Hz
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/70">
                        {v.sourceType === 'suno_url' ? 'Suno Link' : 'Upload'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingest New Variant Form */}
              <form onSubmit={handleAddVariant} className="pt-2 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                    Ingest Audio Variant
                  </span>
                  <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setVariantSourceMode('url')}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${
                        variantSourceMode === 'url' ? 'bg-amber-500 text-black font-semibold' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Suno URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setVariantSourceMode('file')}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${
                        variantSourceMode === 'file' ? 'bg-amber-500 text-black font-semibold' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Upload Audio
                    </button>
                  </div>
                </div>

                <div className={`grid grid-cols-1 ${variantSourceMode === 'url' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
                  <input
                    type="text"
                    value={variantLabel || ''}
                    onChange={(e) => setVariantLabel(e.target.value)}
                    placeholder="Label (e.g. Variant B, Chorus Patch)"
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
                  />
                  {variantSourceMode === 'url' ? (
                    <>
                      <input
                        key="suno-url-input"
                        type="url"
                        required
                        value={sunoUrl || ''}
                        onChange={(e) => setSunoUrl(e.target.value)}
                        placeholder="https://suno.com/song/..."
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={sunoDuration || ''}
                        onChange={(e) => setSunoDuration(e.target.value)}
                        placeholder="Duration (e.g. 4:45 or 285s)"
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none font-mono"
                        title="Optional duration if external alignment gateway is not active"
                      />
                    </>
                  ) : (
                    <input
                      key="audio-file-input"
                      type="file"
                      required
                      accept="audio/*,.mp3,.wav,.m4a,.aac,.flac"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 focus:border-amber-400 focus:outline-none"
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploadingVariant || (variantSourceMode === 'url' ? !sunoUrl.trim() : !audioFile)}
                  className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {uploadingVariant
                    ? 'Importing...'
                    : variantSourceMode === 'url'
                    ? 'Import Suno Variant'
                    : 'Upload Audio Variant'}
                </button>
              </form>
            </div>

            {/* 2. Multilingual Cockpit Panel */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Multilingual Lyrics & Translations</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateMultilingual}
                    disabled={generatingMulti || !hasMasterAudio}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold border border-amber-500/40 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {generatingMulti ? 'Processing...' : 'Run Multilingual Engine'}
                  </button>
                  <button
                    onClick={handleCompileSubtitles}
                    disabled={compilingSubtitles || !hasMasterAudio}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-semibold border border-blue-500/40 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {compilingSubtitles ? 'Compiling...' : 'Export Subtitles'}
                  </button>
                </div>
              </div>

              {/* 4-Language Tabs */}
              <div className="flex border-b border-white/10 gap-1 overflow-x-auto">
                <button
                  onClick={() => setSelectedLang('ur')}
                  className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                    selectedLang === 'ur'
                      ? 'border-amber-400 text-amber-300'
                      : 'border-transparent text-white/50 hover:text-white'
                  }`}
                >
                  1. Urdu (Nastaliq)
                </button>
                <button
                  onClick={() => setSelectedLang('en')}
                  className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                    selectedLang === 'en'
                      ? 'border-amber-400 text-amber-300'
                      : 'border-transparent text-white/50 hover:text-white'
                  }`}
                >
                  2. Sufi English Translation
                </button>
                <button
                  onClick={() => setSelectedLang('en-rom')}
                  className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                    selectedLang === 'en-rom'
                      ? 'border-amber-400 text-amber-300'
                      : 'border-transparent text-white/50 hover:text-white'
                  }`}
                >
                  3. Roman Urdu (Phonetic)
                </button>
                <button
                  onClick={() => setSelectedLang('ur-deva')}
                  className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                    selectedLang === 'ur-deva'
                      ? 'border-amber-400 text-amber-300'
                      : 'border-transparent text-white/50 hover:text-white'
                  }`}
                >
                  4. Urdu in Devanagari
                </button>
              </div>

              {/* Subtitle Cue Lines Display */}
              {draft.masterTimeline?.lines && draft.masterTimeline.lines.length > 0 ? (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {draft.masterTimeline.lines.map((line: any, idx: number) => {
                    const multiLine = multilingualPkg?.lines?.[idx];
                    let displayText = line.text;
                    let fontClass = '';
                    let isRtl = false;

                    if (selectedLang === 'ur') {
                      displayText = line.text;
                      fontClass = 'font-serif text-lg leading-relaxed';
                      isRtl = true;
                    } else if (selectedLang === 'en') {
                      displayText = multiLine?.english || '(Click Run Multilingual Engine)';
                      fontClass = 'italic text-sm text-emerald-300';
                    } else if (selectedLang === 'en-rom') {
                      displayText = multiLine?.romanUrdu || '(Click Run Multilingual Engine)';
                      fontClass = 'text-sm text-amber-200';
                    } else if (selectedLang === 'ur-deva') {
                      displayText = multiLine?.devanagari || '(Click Run Multilingual Engine)';
                      fontClass = 'text-sm text-blue-200';
                    }

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-white/10 bg-white/5 flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-white/40">#{idx + 1}</span>
                            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                              {line.startSeconds.toFixed(2)}s &rarr; {line.endSeconds.toFixed(2)}s
                            </span>
                          </div>
                          <div
                            dir={isRtl ? 'rtl' : 'ltr'}
                            className={`text-white font-medium ${fontClass}`}
                          >
                            {displayText}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-white/40 rounded-xl border border-white/5 bg-white/[0.01]">
                  Canonical lyrics are saved. Once Master Audio is rendered, synchronized timeline cues will populate here.
                </div>
              )}

              {/* Subtitle Bundle Download Bar */}
              {hasSubtitles && (
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-white/60 font-medium">Exported Subtitle Formats:</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/admin/pipeline/drafts/${draftId}/media?asset=subtitle&lang=ur&ext=vtt`}
                      download={`${draft.slug}-ur.vtt`}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[11px]"
                    >
                      ur.vtt
                    </a>
                    <a
                      href={`/api/admin/pipeline/drafts/${draftId}/media?asset=subtitle&lang=en&ext=vtt`}
                      download={`${draft.slug}-en.vtt`}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[11px]"
                    >
                      en.vtt
                    </a>
                    <a
                      href={`/api/admin/pipeline/drafts/${draftId}/media?asset=subtitle&lang=master_dual_urdu_english&ext=ass`}
                      download={`${draft.slug}-dual.ass`}
                      className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[11px] font-semibold"
                    >
                      master_dual.ass (Karaoke)
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: 5 Cols (Video Studio, Human Approval, Publishing) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 3. Dual-Master Video Studio */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Video Studio</h3>
                </div>
                <span className="text-[11px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded">
                  1080p Full HD
                </span>
              </div>

              {/* Format Radio Selection */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-white/70 block">
                  Select Video Master Format:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVideoFormat('lyric_master')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      videoFormat === 'lyric_master'
                        ? 'border-amber-400 bg-amber-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">1. Lyric Master</div>
                    <div className="text-[11px] text-white/50 mt-0.5">Burned Nastaliq + English dual tracks</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoFormat('clean_cinematic')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      videoFormat === 'clean_cinematic'
                        ? 'border-amber-400 bg-amber-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">2. Clean Cinematic</div>
                    <div className="text-[11px] text-white/50 mt-0.5">Unburned canvas (Toggleable CC)</div>
                  </button>
                </div>
              </div>

              {/* Two-Part Video Composition: Part A + Part B */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Two-Part Video Composition
                  </div>
                  <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Part A + Part B
                  </span>
                </div>

                {/* Part A Details (Canva Background Theme + Core Lyric Video) */}
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-amber-300">
                    <div className="flex items-center gap-1.5">
                      <span>Part A: Core Lyric Video</span>
                      <span className="text-[10px] font-mono bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-400/30 text-amber-200">
                        {draft?.video?.partA?.canvaDesignId || 'DAHa7St5CYs'}
                      </span>
                    </div>
                    <a
                      href={draft?.video?.partA?.canvaUrl || 'https://canva.link/ezqj8ymddv6yl2d'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 underline font-normal"
                    >
                      Open in Canva
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="text-[11px] text-white/70">
                    <strong className="text-white">Theme:</strong> Background Canvas &bull; 1920x1080
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-white/60">
                    <span>Suno Master WAV + Dual Nastaliq & English Subtitles</span>
                    <span className="font-mono text-emerald-400 font-semibold">{hasMasterAudio ? `${draft?.masterAudio?.durationSeconds?.toFixed(1)}s` : 'Pending Master'}</span>
                  </div>

                  {/* Upload / Attached Status for Part A Background */}
                  <div className="pt-2 border-t border-amber-500/20">
                    {draft?.video?.partA?.filePath ? (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <Check className="w-3.5 h-3.5" /> Background Canvas Attached
                        </span>
                        <span className="text-white/40 font-mono text-[10px] truncate max-w-[140px]">
                          {draft.video.partA.fileName || 'part_a_background.png'}
                        </span>
                      </div>
                    ) : (
                      <form onSubmit={handleUploadPartA} className="space-y-2">
                        <label className="text-[11px] text-white/60 block">
                          Attach Exported Canva Theme (PNG / JPG):
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => setPartAFile(e.target.files?.[0] || null)}
                            className="text-[11px] text-white/70 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-white/10 file:text-white hover:file:bg-white/20"
                          />
                          <button
                            type="submit"
                            disabled={!partAFile || uploadingPartA}
                            className="px-3 py-1 rounded-lg bg-amber-500 text-black text-[11px] font-semibold hover:bg-amber-400 disabled:opacity-40"
                          >
                            {uploadingPartA ? 'Uploading...' : 'Attach'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Part B Details (Canva Promotional Video) */}
                <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-blue-300">
                    <div className="flex items-center gap-1.5">
                      <span>Part B: Canva Promotional Video</span>
                      <span className="text-[10px] font-mono bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-400/30 text-blue-200">
                        {draft?.video?.partB?.canvaDesignId || 'DAHa7eJOcbI'}
                      </span>
                    </div>
                    <a
                      href={draft?.video?.partB?.canvaUrl || 'https://canva.link/qvmwwc830dm623g'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 underline font-normal"
                    >
                      Open in Canva
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="text-[11px] text-white/70">
                    <strong className="text-white">Heading:</strong> {draft?.video?.partB?.title || 'Part 2'} (19 Scenes, 1920x1080)
                  </div>

                  {/* Playback Scope Option */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-white/60 font-medium block">Part B Playback Scope:</label>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setPartBPlaybackMode('full_19_scenes')}
                        className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition-colors ${
                          partBPlaybackMode === 'full_19_scenes'
                            ? 'border-blue-400 bg-blue-500/20 text-blue-200'
                            : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                        }`}
                      >
                        All 19 Scenes (Full)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPartBPlaybackMode('trimmed')}
                        className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition-colors ${
                          partBPlaybackMode === 'trimmed'
                            ? 'border-blue-400 bg-blue-500/20 text-blue-200'
                            : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                        }`}
                      >
                        Custom Trimmed Range
                      </button>
                    </div>
                  </div>

                  {/* Audio Policy Option */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-white/60 font-medium block">Part B Audio Policy:</label>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setPartBAudioMode('preserve_canva_audio')}
                        className={`px-2 py-1 rounded border text-center font-medium transition-colors ${
                          partBAudioMode === 'preserve_canva_audio'
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                            : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                        }`}
                      >
                        Preserve Audio
                      </button>
                      <button
                        type="button"
                        onClick={() => setPartBAudioMode('crossfade')}
                        className={`px-2 py-1 rounded border text-center font-medium transition-colors ${
                          partBAudioMode === 'crossfade'
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                            : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                        }`}
                      >
                        Crossfade 1.5s
                      </button>
                      <button
                        type="button"
                        onClick={() => setPartBAudioMode('mute')}
                        className={`px-2 py-1 rounded border text-center font-medium transition-colors ${
                          partBAudioMode === 'mute'
                            ? 'border-red-400 bg-red-500/20 text-red-200'
                            : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                        }`}
                      >
                        Mute Part B
                      </button>
                    </div>
                  </div>

                  {/* Upload / Attached Status */}
                  <div className="pt-2 border-t border-blue-500/20">
                    {draft?.video?.partB?.filePath ? (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <Check className="w-3.5 h-3.5" /> MP4 Attached ({draft.video.partB.durationSeconds ? `${draft.video.partB.durationSeconds}s` : 'Ready'})
                        </span>
                        <span className="text-white/40 font-mono text-[10px] truncate max-w-[140px]">
                          {draft.video.partB.fileName || 'canva_part_b.mp4'}
                        </span>
                      </div>
                    ) : (
                      <form onSubmit={handleUploadPartB} className="space-y-2">
                        <label className="text-[11px] text-white/60 block">
                          Attach Exported Canva MP4:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="video/mp4"
                            onChange={(e) => setPartBFile(e.target.files?.[0] || null)}
                            className="text-[11px] text-white/70 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-white/10 file:text-white hover:file:bg-white/20"
                          />
                          <button
                            type="submit"
                            disabled={!partBFile || uploadingPartB}
                            className="px-3 py-1 rounded-lg bg-blue-500 text-white text-[11px] font-semibold hover:bg-blue-400 disabled:opacity-40"
                          >
                            {uploadingPartB ? 'Uploading...' : 'Attach'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Final Combined Timeline Indicator */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-white/70 font-medium">Final Video Master Runtime:</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {hasMasterAudio
                      ? `${(
                          (draft?.masterAudio?.durationSeconds || 0) +
                          (draft?.video?.partB?.filePath ? draft.video.partB.durationSeconds || 0 : 0)
                        ).toFixed(1)}s`
                      : '0.0s'}
                    {draft?.video?.partB?.filePath && (
                      <span className="text-[10px] font-normal text-white/50 ml-1">
                        (Part A: {draft?.masterAudio?.durationSeconds?.toFixed(1)}s + Part B: {draft?.video?.partB?.durationSeconds?.toFixed(1)}s)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Render Video Button */}
              <button
                onClick={handleRenderVideo}
                disabled={renderingVideo || !hasMasterAudio}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shadow-lg shadow-amber-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Video className={`w-4 h-4 ${renderingVideo ? 'animate-spin' : ''}`} />
                {renderingVideo ? 'Rendering 1080p MP4...' : `Render 1080p ${videoFormat === 'lyric_master' ? 'Lyric Master' : 'Clean Cinematic'}`}
              </button>

              {/* Video Player Preview if Rendered */}
              {hasVideo && (
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Rendered Video Preview</span>
                    <span className="text-emerald-400 font-mono text-[11px]">1920x1080 MP4</span>
                  </div>
                  <video
                    controls
                    className="w-full rounded-xl border border-white/15 bg-black aspect-video"
                    src={`/api/admin/pipeline/drafts/${draftId}/media?asset=master_video&format=${videoFormat}`}
                  />
                </div>
              )}
            </div>

            {/* 4. Mandatory Human Approval Gate */}
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/[0.03] p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-purple-500/20 pb-3">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Human Approval Gate</h3>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Governance Rule: Automated publishing to YouTube and the SufiPulse catalog is strictly prohibited until a human administrator reviews the final master audio, subtitle alignment, and video canvas.
              </p>

              <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(approvalConfirmed)}
                    onChange={(e) => setApprovalConfirmed(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-purple-400 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-xs text-white/80">
                    <span className="font-semibold text-white">I approve this release for publishing.</span>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      I have verified audio master continuity, confirmed Nastaliq typography, and checked synchronized lyrics.
                    </p>
                  </div>
                </label>

                <textarea
                  rows={2}
                  value={approvalNotes || ''}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Review notes (optional): e.g. Crossfade at 12s verified, Nastaliq layout checked."
                  className="w-full rounded-xl border border-purple-500/20 bg-black/40 p-2.5 text-xs text-white placeholder-white/30 focus:border-purple-400 focus:outline-none"
                />

                <button
                  onClick={handleSaveApproval}
                  disabled={savingApproval}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {savingApproval ? 'Updating Approval...' : 'Commit Approval Status'}
                </button>
              </div>
            </div>

            {/* 5. Recoverable Publishing State Machine */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Send className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Publishing Engine</h3>
              </div>

              <div className="space-y-2 text-xs text-white/60">
                <div className="flex items-center justify-between">
                  <span>Human Gate Approval:</span>
                  <span className={isApproved ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                    {isApproved ? 'APPROVED' : 'PENDING'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Subtitles (4 Tracks):</span>
                  <span className={hasSubtitles ? 'text-emerald-400 font-semibold' : 'text-white/40'}>
                    {hasSubtitles ? 'READY' : 'PENDING'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>1080p Video Master:</span>
                  <span className={hasVideo ? 'text-emerald-400 font-semibold' : 'text-white/40'}>
                    {hasVideo ? 'RENDERED' : 'PENDING'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowPublishModal(true)}
                disabled={!isApproved || publishing || isPublished}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-xs uppercase tracking-wider shadow-xl shadow-amber-500/20 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                {isPublished ? 'Release Already Published' : 'Approve & Publish to YouTube & SufiPulse'}
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Publish Confirmation & State Machine Execution */}
        {showPublishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-neutral-900 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Execute Publishing State Machine</h3>
                </div>
                {!publishing && (
                  <button onClick={() => setShowPublishModal(false)} className="text-white/40 hover:text-white">
                    ✕
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
                  <p className="font-semibold text-white mb-1">Durable 4-Phase Transaction Execution:</p>
                  <ol className="list-decimal list-inside space-y-1 text-white/80">
                    <li>Upload Master Video to YouTube in Private mode</li>
                    <li>Upload 4 Subtitle Tracks (Urdu, English, Roman, Devanagari) to YouTube CC</li>
                    <li>Commit new release to SufiPulse catalog (.data/cms-releases.json)</li>
                    <li>Unveil YouTube video visibility to {publishVisibility.toUpperCase()}</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-white/70 mb-1.5">
                    Target YouTube Visibility:
                  </label>
                  <select
                    value={publishVisibility}
                    onChange={(e: any) => setPublishVisibility(e.target.value)}
                    disabled={publishing}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="public" className="bg-neutral-900 text-white">Public (Global Premiere)</option>
                    <option value="unlisted" className="bg-neutral-900 text-white">Unlisted (Private Share Link)</option>
                  </select>
                </div>

                {publishing && (
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2 text-center">
                    <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
                    <p className="text-xs text-white font-medium">Executing Publishing Transaction...</p>
                    <p className="text-[11px] text-white/40">Ledger recorded at .data/pipeline-drafts/{draftId}/publish-tx.json</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  disabled={publishing}
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={publishing}
                  onClick={handleExecutePublish}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
                >
                  {publishing ? 'Publishing...' : 'Confirm & Publish Globally'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
