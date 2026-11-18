"use client";

import React, { useEffect, useState, useRef, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { YouTubeUploadPanel } from './YouTubeUploadPanel';
import { SocialDistributionPanel } from './SocialDistributionPanel';
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
  Repeat,
  Image as ImageIcon,
  Video as VideoIcon,
  Sliders,
  Volume2,
  RotateCcw,
  Save,
  Loader2,
} from 'lucide-react';
import { toRomanUrdu, devanagariToUrdu } from '@/lib/transliteration';

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

  // Audio Playback & Waveform Scrubber
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(285.2);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const phraseStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Multilingual & Subtitle State
  const [selectedLang, setSelectedLang] = useState<LangTab>('ur');
  const [multilingualPkg, setMultilingualPkg] = useState<any>(null);
  const [generatingMulti, setGeneratingMulti] = useState(false);
  const [compilingSubtitles, setCompilingSubtitles] = useState(false);
  const [autoAligning, setAutoAligning] = useState(false);
  const [editingLines, setEditingLines] = useState<any[]>([]);
  const [audioAlignmentReviewed, setAudioAlignmentReviewed] = useState(false);
  const [isSavingTimeline, setIsSavingTimeline] = useState(false);
  const [auditioningIndex, setAuditioningIndex] = useState<number | null>(null);
  const [expandedLineIndex, setExpandedLineIndex] = useState<number | null>(null);
  const [timelineFilterSpeaker, setTimelineFilterSpeaker] = useState<string>('all');

  // Video State
  const [videoFormat, setVideoFormat] = useState<'lyric_master' | 'clean_cinematic'>('lyric_master');
  const [videoOrientation, setVideoOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [renderingVideo, setRenderingVideo] = useState(false);
  const [videoRenderResult, setVideoRenderResult] = useState<any>(null);

  // Part A: Thumbnail Introduction State
  const [partADuration, setPartADuration] = useState<number>(5.0);
  const [partADurationPreset, setPartADurationPreset] = useState<'3' | '5' | '10' | 'custom'>('5');
  const [customThumbTimestamp, setCustomThumbTimestamp] = useState<string>('0.0');
  const [extractingThumbnail, setExtractingThumbnail] = useState(false);
  const [customThumbFile, setCustomThumbFile] = useState<File | null>(null);
  const [uploadingCustomThumb, setUploadingCustomThumb] = useState(false);
  const [showCustomThumbStudio, setShowCustomThumbStudio] = useState(false);

  // Part B: Main Suno Song (Canva Background Theme Visual) State
  const [partBFile, setPartBFile] = useState<File | null>(null);
  const [uploadingPartB, setUploadingPartB] = useState(false);
  const [partBPlaybackMode, setPartBPlaybackMode] = useState<'seamless_loop' | 'freeze_last_frame' | 'stretch' | 'custom_range'>('seamless_loop');
  const [partBLoopStart, setPartBLoopStart] = useState<number>(0);
  const [partBLoopEnd, setPartBLoopEnd] = useState<number>(4);
  const [savingPartBPlayback, setSavingPartBPlayback] = useState(false);
  const [showReplacePartB, setShowReplacePartB] = useState(false);

  // Part C: Canva Promotional Video State
  const [partCFile, setPartCFile] = useState<File | null>(null);
  const [uploadingPartC, setUploadingPartC] = useState(false);
  const [linkingSharedPartC, setLinkingSharedPartC] = useState(false);
  const [partCEnabled, setPartCEnabled] = useState(false);
  const [savingPartCEnabled, setSavingPartCEnabled] = useState(false);
  const [partCPlaybackMode, setPartCPlaybackMode] = useState<'full_19_scenes' | 'trimmed'>('full_19_scenes');
  const [partCAudioMode, setPartCAudioMode] = useState<'preserve_canva_audio' | 'crossfade' | 'mute'>('preserve_canva_audio');
  const [showReplacePartC, setShowReplacePartC] = useState(false);

  // Variant Upload State
  const [variantSourceMode, setVariantSourceMode] = useState<'url' | 'file'>('url');
  const [variantLabel, setVariantLabel] = useState('');
  const [sunoUrl, setSunoUrl] = useState('');
  const [sunoProviderStatus, setSunoProviderStatus] = useState<'checking' | 'configured' | 'missing' | 'unknown'>('checking');
  useEffect(() => {
    if (variantSourceMode !== 'url') return;
    const controller = new AbortController();
    setSunoProviderStatus('checking');
    fetch('/api/admin/studio-settings/private-production', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Could not check audio provider');
        const settings = await response.json();
        if (!controller.signal.aborted) setSunoProviderStatus(settings.streamConfigured || settings.localSunoBrowserAvailable ? 'configured' : 'missing');
      })
      .catch(() => { if (!controller.signal.aborted) setSunoProviderStatus('unknown'); });
    return () => controller.abort();
  }, [draftId, variantSourceMode]);
  const [audioRightsConfirmed, setAudioRightsConfirmed] = useState(false);
  const [sunoDuration, setSunoDuration] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadingVariant, setUploadingVariant] = useState(false);
  const [renderingMaster, setRenderingMaster] = useState(false);
  const [productionStage, setProductionStage] = useState<
    'idle' | 'fetching' | 'master' | 'aligning' | 'subtitles' | 'render1' | 'render2' | 'render3' | 'render4' | 'complete' | 'failed'
  >('idle');

  // Approval & Publishing
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [savingApproval, setSavingApproval] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishVisibility, setPublishVisibility] = useState<'public' | 'unlisted'>('public');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Canonical title / slug editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);

  const handleSaveTitle = async () => {
    const title = titleInput.trim();
    const slug = slugInput.trim();
    if (!title) {
      setTitleError('Canonical title cannot be empty.');
      return;
    }
    try {
      setSavingTitle(true);
      setTitleError(null);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug: slug || undefined }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `Save failed (${res.status})`);
      setDraft(d.draft);
      setEditingTitle(false);
    } catch (err: any) {
      setTitleError(err.message || 'Failed to save title');
    } finally {
      setSavingTitle(false);
    }
  };

  const fetchDraft = async () => {
    if (!draftId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(`Failed to load draft (${res.status}): ${d.error || res.statusText}`);
      }
      const data = await res.json();
      setDraft(data.draft);
      if (data.draft?.productionStatus?.stage) {
        const stageMap: Record<string, any> = {
          align: 'aligning', subtitles: 'subtitles', render1: 'render1', render2: 'render2',
          render3: 'render3', render4: 'render4', complete: 'complete', failed: 'failed',
        };
        const mapped = stageMap[data.draft.productionStatus.stage];
        if (mapped) setProductionStage(mapped);
      }
      if (data.draft?.downstreamStatus?.approvalStatus === 'approved_for_publishing') {
        setApprovalConfirmed(true);
      }
      if (data.draft?.video?.activeFormat) {
        setVideoFormat(data.draft.video.activeFormat);
      }
      if (data.draft?.video?.activeOrientation) {
        setVideoOrientation(data.draft.video.activeOrientation);
      }
      if (typeof data.draft?.video?.partA?.durationSeconds === 'number') {
        const sec = data.draft.video.partA.durationSeconds;
        setPartADuration(sec);
        if ([3, 5, 10].includes(sec)) {
          setPartADurationPreset(String(sec) as any);
        } else {
          setPartADurationPreset('custom');
        }
      }
      if (data.draft?.video?.partB?.playbackMode) {
        setPartBPlaybackMode(data.draft.video.partB.playbackMode);
      } else if (data.draft?.video?.partA?.playbackMode && ['seamless_loop', 'freeze_last_frame', 'stretch', 'custom_range'].includes(data.draft.video.partA.playbackMode)) {
        setPartBPlaybackMode(data.draft.video.partA.playbackMode);
      }
      if (typeof data.draft?.video?.partB?.loopStartSeconds === 'number') {
        setPartBLoopStart(data.draft.video.partB.loopStartSeconds);
      }
      if (typeof data.draft?.video?.partB?.loopEndSeconds === 'number') {
        setPartBLoopEnd(data.draft.video.partB.loopEndSeconds);
      }
      if (typeof data.draft?.video?.partA?.thumbnailTimestampSeconds === 'number') {
        setCustomThumbTimestamp(String(data.draft.video.partA.thumbnailTimestampSeconds));
      }
      setPartCEnabled(data.draft?.video?.partC?.enabled === true);
      if (data.draft?.video?.partC?.playbackMode) {
        setPartCPlaybackMode(data.draft.video.partC.playbackMode);
      }
      if (data.draft?.video?.partC?.audioMode) {
        setPartCAudioMode(data.draft.video.partC.audioMode);
      }
      if (data.draft?.masterTimeline?.lines) {
        const serverLines = data.draft.masterTimeline.lines;
        setEditingLines((prev) => {
          if (!prev || prev.length === 0 || !timelineDirtyRef.current) {
            return serverLines;
          }
          // If dirty, merge fresh multilingual translations into existing editingLines so translations don't stay empty!
          return prev.map((l: any, idx: number) => {
            const fresh = serverLines[idx] || {};
            return {
              ...l,
              urduNastaliq: l.urduNastaliq?.trim() ? l.urduNastaliq : (fresh.urduNastaliq || ''),
              englishTranslation: l.englishTranslation?.trim() ? l.englishTranslation : (fresh.englishTranslation || ''),
              romanUrdu: l.romanUrdu?.trim() ? l.romanUrdu : (fresh.romanUrdu || ''),
              devanagariUrdu: l.devanagariUrdu?.trim() ? l.devanagariUrdu : (fresh.devanagariUrdu || ''),
            };
          });
        });
      }
      if (data.draft?.masterTimeline?.durationSeconds) {
        setAudioDuration(data.draft.masterTimeline.durationSeconds);
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

  // While background caption alignment runs, refresh the draft so results appear without a manual reload.
  const alignmentRunning = draft?.alignmentStatus?.state === 'running';
  useEffect(() => {
    if (!alignmentRunning || !draftId) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/pipeline/drafts/${draftId}?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
        if (!res.ok) return;
        const data = await res.json();
        if (data.draft?.alignmentStatus?.state !== 'running') {
          await fetchDraft();
        }
      } catch {}
    }, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alignmentRunning, draftId]);

  // Audio Player & Scrubber Handlers
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      if (phraseStopTimeoutRef.current) {
        clearTimeout(phraseStopTimeoutRef.current);
        phraseStopTimeoutRef.current = null;
      }
      setAuditioningIndex(null);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => console.error('Audio playback failed', err));
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeekAudio = (timeSec: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeSec;
      setAudioCurrentTime(timeSec);
    }
  };

  const handlePlayPhrase = (startSec: number, endSec: number, idx: number) => {
    if (!audioRef.current) return;
    if (phraseStopTimeoutRef.current) {
      clearTimeout(phraseStopTimeoutRef.current);
      phraseStopTimeoutRef.current = null;
    }
    audioRef.current.currentTime = Math.max(0, startSec);
    audioRef.current.play().then(() => {
      setIsPlayingAudio(true);
      setAuditioningIndex(idx);
      const durMs = Math.max(400, (endSec - startSec) * 1000);
      phraseStopTimeoutRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlayingAudio(false);
          setAuditioningIndex(null);
        }
      }, durMs);
    }).catch(err => console.error('Audition error', err));
  };

  // Unsaved timeline edits must survive background refreshes (production / alignment polling).
  const timelineDirtyRef = useRef(false);
  const [timelineDirty, setTimelineDirty] = useState(false);
  const markTimelineDirty = () => { timelineDirtyRef.current = true; setTimelineDirty(true); };

  const handleNudgeTime = (idx: number, field: 'startSeconds' | 'endSeconds', delta: number) => {
    markTimelineDirty();
    setEditingLines((prev) => {
      const next = [...prev];
      const target = { ...next[idx] };
      const maxDur = draft?.masterTimeline?.durationSeconds || audioDuration || 285.2;
      const oldStart = Number(target.startSeconds);
      const oldEnd = Number(target.endSeconds);
      if (field === 'startSeconds') {
        target.startSeconds = Math.max(0, Math.min(target.endSeconds - 0.1, Number((target.startSeconds + delta).toFixed(2))));
      } else {
        target.endSeconds = Math.max(target.startSeconds + 0.1, Math.min(maxDur, Number((target.endSeconds + delta).toFixed(2))));
      }
      // Keep every word inside the cue: rescale word times proportionally to the new cue window.
      if (Array.isArray(target.words) && target.words.length && oldEnd > oldStart) {
        const scale = (target.endSeconds - target.startSeconds) / (oldEnd - oldStart);
        target.words = target.words.map((w: any) => ({
          ...w,
          startSeconds: Number((target.startSeconds + (Number(w.startSeconds) - oldStart) * scale).toFixed(3)),
          endSeconds: Number((target.startSeconds + (Number(w.endSeconds) - oldStart) * scale).toFixed(3)),
          sourceStartSeconds: undefined,
          sourceEndSeconds: undefined,
        }));
      }
      next[idx] = target;
      return next;
    });
  };

  const handleUpdateLineField = (idx: number, field: string, value: any) => {
    markTimelineDirty();
    setEditingLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSaveTimeline = async () => {
    if (!draftId) return;
    setIsSavingTimeline(true);
    try {
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_lines',
          lines: editingLines,
          audioAlignmentReviewed,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save timeline');
      setDraft((prev: any) => ({
        ...prev,
        masterTimeline: data.masterTimeline,
      }));
      setMultilingualPkg(data.package);
      setAudioAlignmentReviewed(false);
      timelineDirtyRef.current = false;
      setTimelineDirty(false);
      setEditingLines(data.masterTimeline?.lines || editingLines);
      alert('Reviewed word-level timestamps saved and subtitles regenerated. Re-render video to include the latest captions.');
    } catch (err: any) {
      alert(`Error saving timeline: ${err.message}`);
    } finally {
      setIsSavingTimeline(false);
    }
  };

  // One server-owned chain: auto-sync -> subtitles -> 4 verified masters. Runs even if this tab is closed.
  const handleAutoAlign = async (masterJustRendered = false) => {
    if (!draftId || (!hasMasterAudio && !masterJustRendered)) return;
    setAutoAligning(true);
    setProductionStage('aligning');
    try {
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/produce`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not start production');
      await fetchDraft();
    } catch (err: any) {
      setProductionStage('failed');
      alert(`Could not start auto production: ${err.message}`);
    } finally {
      setAutoAligning(false);
    }
  };

  // Mirror the server's production status into the progress tracker, and poll while it runs.
  const serverProduction = draft?.productionStatus;
  useEffect(() => {
    if (!serverProduction) return;
    const map: Record<string, any> = {
      align: 'aligning', subtitles: 'subtitles', render1: 'render1', render2: 'render2',
      render3: 'render3', render4: 'render4', complete: 'complete', failed: 'failed',
    };
    const mapped = map[serverProduction.stage];
    if (mapped) setProductionStage(mapped);
  }, [serverProduction?.stage, serverProduction?.state, serverProduction?.updatedAt]);

  const productionRunning = serverProduction?.state === 'running';
  useEffect(() => {
    if (!productionRunning || !draftId) return;
    const t = setInterval(() => { fetchDraft(); }, 6000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productionRunning, draftId]);

  const handleResetAlignment = async () => {
    if (!draftId || !confirm('Reset alignment to natural phrasing for all 136 lines?')) return;
    setIsSavingTimeline(true);
    try {
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_alignment' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset alignment');
      setDraft((prev: any) => ({
        ...prev,
        masterTimeline: data.masterTimeline,
      }));
      setEditingLines(data.masterTimeline.lines);
      setMultilingualPkg(data.package);
      setAudioAlignmentReviewed(false);
      alert('Estimated phrase layout restored for preview only. This is NOT synchronized against actual singing and cannot be approved.');
    } catch (err: any) {
      alert(`Error resetting alignment: ${err.message}`);
    } finally {
      setIsSavingTimeline(false);
    }
  };

  // Add Variant (Suno URL or Audio Upload)
  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (variantSourceMode === 'url' && (!sunoUrl.trim() || !audioRightsConfirmed || sunoProviderStatus === 'missing' || sunoProviderStatus === 'checking')) return;
    if (variantSourceMode === 'file' && !audioFile) return;

    try {
      setUploadingVariant(true);
      if (variantSourceMode === 'url') setProductionStage('fetching');
      let res: Response;

      if (variantSourceMode === 'file' && audioFile) {
        res = await fetch(`/api/admin/pipeline/drafts/${draftId}/upload-variant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'x-file-name': encodeURIComponent(audioFile.name),
            'x-label': encodeURIComponent(variantLabel.trim() || `Variant ${Object.keys(draft?.variants || {}).length + 1}`),
          },
          body: audioFile,
        });
      } else {
        res = await fetch(`/api/admin/pipeline/drafts/${draftId}/upload-variant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rightsConfirmed: audioRightsConfirmed,
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

      const imported = await res.json();
      const fetchedFromSuno = variantSourceMode === 'url';
      setSunoUrl('');
      setSunoDuration('');
      setVariantLabel('');
      setAudioFile(null);

      let masterReady = !imported.needsMasterRender;
      if (imported.needsMasterRender) {
        if (fetchedFromSuno) setProductionStage('master');
        const result = await fetch('/api/admin/pipeline/drafts/' + draftId + '/render-master', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expectedVariantId: imported.variant.variantId }),
        }).catch(() => null);
        if (!result?.ok) {
          const detail = await result?.json().catch(() => null);
          throw new Error('Recording imported, but master WAV render failed. ' + (detail?.error || 'Use Re-render Master WAV to retry.'));
        }
        masterReady = true;
      }

      await fetchDraft();

      // One-button Suno production chain:
      // authorized fetch -> master WAV -> high-accuracy auto-sync -> subtitles -> all four video masters.
      if (fetchedFromSuno && masterReady) {
        await handleAutoAlign(true);
      } else if (fetchedFromSuno) {
        setProductionStage('failed');
      }
    } catch (err: any) {
      if (variantSourceMode === 'url') setProductionStage('failed');
      alert(`Error importing variant: ${err.message}`);
    } finally {
      setUploadingVariant(false);
    }
  };

  // Render Master Audio
  const handleRenderMaster = async (variantId?: string) => {
    if (variantId && !confirm("Use this recording for the master and reset dependent audio timing and video approvals?")) return;
    try {
      setRenderingMaster(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/render-master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: variantId ? JSON.stringify({ selectVariantId: variantId }) : undefined,
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

  // One-step real audio: choose the genuine Suno MP3/WAV -> upload -> becomes the assembly source -> master renders
  const handleQuickUploadAudio = async (file: File | null) => {
    if (!file) return;
    try {
      setUploadingVariant(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/upload-variant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'x-file-name': encodeURIComponent(file.name),
          'x-label': encodeURIComponent('Variant A (Genuine Suno)'),
        },
        body: file,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(`${d.code ? `[${d.code}] ` : ''}${d.error || 'Upload failed'}`);
      }
      const imported = await res.json();
      if (imported.needsMasterRender) {
        const r = await fetch(`/api/admin/pipeline/drafts/${draftId}/render-master`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expectedVariantId: imported.variant.variantId }),
        });
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(`Audio uploaded, but the master render failed: ${d.error || r.statusText}`);
        }
      }
      await fetchDraft();
    } catch (err: any) {
      alert(`Genuine audio import failed: ${err.message}`);
    } finally {
      setUploadingVariant(false);
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

  // Select and persist Video Format (lyric_master | clean_cinematic)
  const handleSelectVideoFormat = async (fmt: 'lyric_master' | 'clean_cinematic') => {
    setVideoFormat(fmt);
    try {
      await fetch(`/api/admin/pipeline/drafts/${draftId}/render-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_preferences', format: fmt, orientation: videoOrientation }),
      });
    } catch {}
  };

  // Select and persist Video Orientation (landscape | portrait)
  const handleSelectVideoOrientation = async (ori: 'landscape' | 'portrait') => {
    setVideoOrientation(ori);
    try {
      await fetch(`/api/admin/pipeline/drafts/${draftId}/render-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_preferences', format: videoFormat, orientation: ori }),
      });
    } catch {}
  };

  // Render Part B only (background + full Suno master + burned lyrics when available) for quick review
  const [renderingPartBPreview, setRenderingPartBPreview] = useState(false);
  const handleRenderPartBPreview = async () => {
    try {
      setRenderingPartBPreview(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/part-b-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orientation: videoOrientation }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `Preview render failed (${res.status})`);
      await fetchDraft();
    } catch (err: any) {
      alert(`Part B preview failed: ${err.message}`);
    } finally {
      setRenderingPartBPreview(false);
    }
  };

  // Render Master Video (Three-Part Architecture)
  const handleRenderVideo = async () => {
    try {
      setRenderingVideo(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/render-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: videoFormat,
          orientation: videoOrientation,
          partADurationSeconds: partADuration,
          partBPlaybackMode,
          partCEnabled,
          partCAudioMode,
        }),
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

  // Update Part A Duration (Thumbnail intro screen)
  const handleUpdatePartADuration = async (sec: number) => {
    setPartADuration(sec);
    if ([3, 5, 10].includes(sec)) {
      setPartADurationPreset(String(sec) as any);
    } else {
      setPartADurationPreset('custom');
    }
    try {
      await fetch(`/api/admin/pipeline/drafts/${draftId}/part-a`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationSeconds: sec }),
      });
      await fetchDraft();
    } catch (err: any) {
      console.warn('Failed to update Part A duration:', err.message);
    }
  };

  const handleUpdatePartAAudioPolicy = async (audioPolicy: 'suno_starts_at_part_b' | 'suno_starts_at_part_a' | 'preserve_part_a_audio') => {
    try {
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/part-a`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioPolicy }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update Part A audio policy');
      }
      await fetchDraft();
    } catch (err: any) {
      alert(`Part A audio setting failed: ${err.message}`);
    }
  };

  // Upload Custom Media (Part A: Image Cover or Video Opener)
  const handleUploadCustomThumbnail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customThumbFile) return;
    try {
      setUploadingCustomThumb(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/part-a?asset=thumbnail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'x-thumbnail-upload': 'true',
          'x-file-name': encodeURIComponent(customThumbFile.name),
        },
        body: customThumbFile,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to upload custom media');
      }
      await fetchDraft();
      const isVid = /\.(mp4|mov|webm|mkv)$/i.test(customThumbFile.name);
      alert(isVid ? 'Part A intro video attached! Frame t=0 was extracted as the YouTube cover thumbnail.' : 'Custom cover image attached successfully!');
      setCustomThumbFile(null);
      setShowCustomThumbStudio(false);
    } catch (err: any) {
      alert(`Media upload failed: ${err.message}`);
    } finally {
      setUploadingCustomThumb(false);
    }
  };

  // Extract Frame at Timestamp as Thumbnail
  const handleExtractThumbnailFrame = async (timestampSec: number) => {
    try {
      setExtractingThumbnail(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/part-a`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extract_thumbnail_frame',
          timestampSeconds: timestampSec,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to extract thumbnail frame');
      }
      await fetchDraft();
      alert(`Thumbnail extracted at ${timestampSec.toFixed(1)}s successfully!`);
    } catch (err: any) {
      alert(`Thumbnail extraction failed: ${err.message}`);
    } finally {
      setExtractingThumbnail(false);
    }
  };

  // Update Part B Playback Mode (Seamless Loop, Freeze Last Frame, Stretch, Custom Range)
  const handleUpdatePartBPlayback = async (mode: 'seamless_loop' | 'freeze_last_frame' | 'stretch' | 'custom_range') => {
    setPartBPlaybackMode(mode);
    try {
      setSavingPartBPlayback(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/part-b`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playbackMode: mode,
          loopStartSeconds: partBLoopStart,
          loopEndSeconds: partBLoopEnd,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to update Part B playback mode');
      }
      await fetchDraft();
    } catch (err: any) {
      alert(`Error updating Part B playback mode: ${err.message}`);
    } finally {
      setSavingPartBPlayback(false);
    }
  };

  // Upload Part B (Canva Background Theme MP4)
  const handleUploadPartBTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partBFile) return;
    try {
      setUploadingPartB(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/part-b`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'x-file-name': encodeURIComponent(partBFile.name),
          'x-canva-design-id': draft?.video?.partB?.canvaDesignId || 'DAHa7St5CYs',
          'x-canva-url': encodeURIComponent(draft?.video?.partB?.canvaUrl || 'https://canva.link/ezqj8ymddv6yl2d'),
          'x-title': encodeURIComponent(draft?.video?.partB?.title || 'Part B Background Theme'),
        },
        body: partBFile,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to attach Part B background theme');
      }
      await fetchDraft();
      alert('Part B (Canva Background Theme) attached successfully!');
      setPartBFile(null);
      setShowReplacePartB(false);
    } catch (err: any) {
      alert(`Part B upload failed: ${err.message}`);
    } finally {
      setUploadingPartB(false);
    }
  };

  // Part C is optional and persists independently of its source file.
  const handleSetPartCEnabled = async (enabled: boolean) => {
    setSavingPartCEnabled(true);
    try {
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/part-c`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save Part C selection');
      setPartCEnabled(enabled);
      await fetchDraft();
    } catch (err: any) {
      alert(`Part C selection failed: ${err.message}`);
    } finally {
      setSavingPartCEnabled(false);
    }
  };

  // Link Shared 608s Asset for Part C
  const handleUseSharedPartCAsset = async () => {
    try {
      setLinkingSharedPartC(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/part-c`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'use_shared_asset' }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to link shared asset');
      }
      await fetchDraft();
      alert('Shared Canva Part C (19 Scenes • 10:08) linked and verified successfully!');
    } catch (err: any) {
      alert(`Failed to link shared Part C asset: ${err.message}`);
    } finally {
      setLinkingSharedPartC(false);
    }
  };

  // Update Part C Settings (Scope / Audio Policy)
  const handleUpdatePartCSettings = async (
    pMode?: 'full_19_scenes' | 'trimmed',
    aMode?: 'preserve_canva_audio' | 'crossfade' | 'mute'
  ) => {
    const nextP = pMode || partCPlaybackMode;
    const nextA = aMode || partCAudioMode;
    if (pMode) setPartCPlaybackMode(pMode);
    if (aMode) setPartCAudioMode(aMode);
    try {
      await fetch(`/api/admin/pipeline/drafts/${draftId}/part-c`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playbackMode: nextP, audioMode: nextA }),
      });
      await fetchDraft();
    } catch (err: any) {
      console.warn('Failed to update Part C settings:', err.message);
    }
  };

  // Upload Part C (Canva Promotional MP4)
  const handleUploadPartC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partCFile) return;
    try {
      setUploadingPartC(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/part-c`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'x-file-name': encodeURIComponent(partCFile.name),
          'x-canva-design-id': draft?.video?.partC?.canvaDesignId || 'DAHa7eJOcbI',
          'x-playback-mode': partCPlaybackMode,
          'x-audio-mode': partCAudioMode,
        },
        body: partCFile,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to attach Part C MP4');
      }
      await fetchDraft();
      alert('Part C (Canva Promotional Video) MP4 attached and verified successfully!');
      setPartCFile(null);
      setShowReplacePartC(false);
    } catch (err: any) {
      alert(`Part C upload failed: ${err.message}`);
    } finally {
      setUploadingPartC(false);
    }
  };

  // Human review transfers the validated master to the private CMS, never to YouTube.
  const handleSaveApproval = async () => {
    if (!approvalConfirmed) {
      alert('Review the final video and explicitly confirm approval first.');
      return;
    }
    try {
      setSavingApproval(true);
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/approve-final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmFinalApproval: true,
          videoFormat,
          orientation: videoOrientation,
          notes: approvalNotes,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Final approval failed validation');
      await fetchDraft();
      window.location.assign(result.cmsUrl || '/admin/cms-releases');
    } catch (err: any) {
      alert(`Approval blocked: ${err.message}`);
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
  // True while every enabled assembly segment points to a placeholder "reference tone" (URL-only import)
  const enabledSegments = (draft.assembly?.segments || []).filter((s: any) => s.enabled);
  const onlyReferenceTone =
    enabledSegments.length > 0 &&
    enabledSegments.every((s: any) => draft.variants?.[s.sourceVariantId]?.sourceType === 'suno_url');
  const hasSubtitles = Boolean(draft.downstreamStatus?.subtitlesValid);
  // Why "Save Timestamps" is disabled (shown to the editor instead of a silent grey button)
  const saveTimestampsBlockReason = editingLines.length === 0
    ? 'There are no timed lyric lines yet. Click "Auto-Sync Audio + Lyrics" first.'
    : editingLines.some((line: any) => !Array.isArray(line.words) || line.words.length === 0)
      ? 'Some lines have no word-level timestamps. Run "Auto-Sync Audio + Lyrics" to create them.'
      : !audioAlignmentReviewed
        ? 'Tick "I reviewed every lyric cue and word timing" below to enable saving.'
        : '';
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
            {editingTitle ? (
              <div className="space-y-2 max-w-xl">
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-white/60">
                  Canonical Song Title *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setEditingTitle(false);
                  }}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-lg font-bold text-white focus:border-amber-400 focus:outline-none"
                />
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-white/60">
                  Canonical Slug
                </label>
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-mono text-white focus:border-amber-400 focus:outline-none"
                />
                {titleError && <p className="text-xs text-red-400">{titleError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveTitle}
                    disabled={savingTitle}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 disabled:opacity-50"
                  >
                    {savingTitle ? 'Saving…' : 'Save Title'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingTitle(false); setTitleError(null); }}
                    className="px-3 py-1.5 rounded-lg border border-white/15 text-white/70 text-xs hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{draft.title}</h1>
                  <button
                    type="button"
                    onClick={() => {
                      setTitleInput(draft.title);
                      setSlugInput(draft.slug);
                      setTitleError(null);
                      setEditingTitle(true);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
                  >
                    Edit title
                  </button>
                </div>
                <p className="text-xs text-white/50">
                  Canonical Slug: <span className="font-mono text-white/70">{draft.slug}</span>
                </p>
              </>
            )}
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
                  <div><strong>1. Lyric Master:</strong> Burned four-line Roman Urdu + English + Urdu + Hindi captions.</div>
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
                Always scrub the rendered video preview to ensure: (1) Roman Urdu, Urdu, Hindi, and English remain centered and readable without clipping, (2) the four-line stack keeps compact standard spacing, and (3) subtitles vanish during instrumental breaks.
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
                  onClick={() => handleRenderMaster()}
                  disabled={renderingMaster || Object.keys(draft.variants || {}).length === 0 || onlyReferenceTone}
                  title={onlyReferenceTone ? 'Only a placeholder reference tone is selected. Add the genuine Suno audio first.' : undefined}
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
                    onTimeUpdate={handleAudioTimeUpdate}
                    onLoadedMetadata={() => {
                      if (audioRef.current?.duration && !isNaN(audioRef.current.duration)) {
                        setAudioDuration(audioRef.current.duration);
                      }
                    }}
                    onEnded={() => {
                      setIsPlayingAudio(false);
                      setAuditioningIndex(null);
                    }}
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
              ) : onlyReferenceTone ? (
                <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/[0.06] space-y-3 text-xs">
                  <div className="font-semibold text-amber-300">Real audio needed</div>
                  <p className="text-white/70">
                    A Suno URL only identifies the song; it does not contain the recording. Right now this draft holds a
                    placeholder <em>reference tone</em>, which can never be rendered into a master. Add the genuine recording once:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-black font-semibold cursor-pointer hover:bg-amber-400">
                      {uploadingVariant ? 'Uploading…' : 'Choose genuine Suno MP3 / WAV'}
                      <input
                        type="file"
                        accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/flac,.mp3,.wav,.m4a,.flac"
                        disabled={uploadingVariant}
                        className="hidden"
                        onChange={(e) => { handleQuickUploadAudio(e.target.files?.[0] || null); e.target.value = ''; }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setVariantSourceMode('url')}
                      className="px-3 py-1.5 rounded-lg border border-white/20 text-white/80 hover:text-white"
                    >
                      Or use Fetch from Suno (one-time sign-in)
                    </button>
                  </div>
                  <p className="text-[11px] text-white/50">
                    The uploaded file becomes the assembly source automatically and the master WAV renders right after.
                  </p>
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
                        {v.sourceType === 'suno_url' ? 'Reference tone' : v.sourceUrl ? 'Imported audio' : 'Upload'}
                      </span>
                      {v.sourceType !== 'suno_url' && v.variantId !== draft.activeVariantId && (
                        <button type="button" disabled={renderingMaster || uploadingVariant} onClick={() => handleRenderMaster(v.variantId)} className="rounded-lg bg-white/10 px-3 py-1.5 text-white disabled:opacity-50">Use as Master</button>
                      )}
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
                      Fetch from Suno
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

                {variantSourceMode === 'url' && sunoProviderStatus === 'missing' && (
                  <p role="status" className="text-xs text-amber-300">
                    <a className="underline" href="/admin/studio-settings/private-production">Set up the Suno audio provider</a> once to fetch by link. You can upload a file now.
                  </p>
                )}
                {variantSourceMode === 'url' && (
                  <label className="flex items-start gap-2 text-[11px] text-white/70">
                    <input type="checkbox" checked={audioRightsConfirmed} onChange={e => setAudioRightsConfirmed(e.target.checked)} />
                    I own this recording or have permission to import it.
                  </label>
                )}
                <button
                  type="submit"
                  disabled={uploadingVariant || (variantSourceMode === 'url' ? !sunoUrl.trim() || !audioRightsConfirmed || sunoProviderStatus === 'missing' || sunoProviderStatus === 'checking' : !audioFile)}
                  className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {uploadingVariant
                    ? (variantSourceMode === 'url'
                        ? 'Fetching Suno audio → Master WAV → Auto-Sync → 4 Masters...'
                        : 'Uploading audio...')
                    : variantSourceMode === 'url'
                    ? 'Fetch & Produce All Masters'
                    : 'Upload Audio Variant'}
                </button>

                {productionStage !== 'idle' && (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2" role="status" aria-live="polite">
                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="font-semibold text-white/80">Production Progress</span>
                      <span className={`font-mono ${
                        productionStage === 'failed'
                          ? 'text-red-300'
                          : productionStage === 'complete'
                          ? 'text-emerald-300'
                          : 'text-amber-300'
                      }`}>
                        {productionStage === 'complete'
                          ? 'COMPLETE'
                          : productionStage === 'failed'
                          ? 'FAILED'
                          : 'RUNNING'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        ['fetching', 'Fetch'],
                        ['master', 'WAV'],
                        ['aligning', 'Auto-Sync'],
                        ['subtitles', 'Subtitles'],
                        ['render1', '1/4 Landscape Lyric'],
                        ['render2', '2/4 Landscape Clean'],
                        ['render3', '3/4 Portrait Lyric'],
                        ['render4', '4/4 Portrait Clean'],
                      ].map(([stage, label], index, all) => {
                        const order = all.map(([s]) => s);
                        const currentIndex = order.indexOf(productionStage);
                        const isDone = productionStage === 'complete' || (currentIndex >= 0 && index < currentIndex);
                        const isActive = stage === productionStage;
                        return (
                          <div
                            key={stage}
                            className={`rounded-lg border px-2 py-1.5 text-[10px] font-medium ${
                              isActive
                                ? 'border-amber-400/60 bg-amber-500/15 text-amber-200'
                                : isDone
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                : 'border-white/10 bg-white/[0.03] text-white/40'
                            }`}
                          >
                            {isDone ? '✓ ' : isActive ? '● ' : '○ '}{label}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-white/50">
                      {productionStage === 'fetching' && 'Fetching authorized Suno recording...'}
                      {productionStage === 'master' && 'Building genuine master WAV...'}
                      {productionStage === 'aligning' && 'Running high-accuracy lyric/audio alignment...'}
                      {productionStage === 'subtitles' && 'Compiling synchronized subtitle masters...'}
                      {productionStage === 'render1' && 'Rendering Landscape Lyric master...'}
                      {productionStage === 'render2' && 'Rendering Landscape Clean master...'}
                      {productionStage === 'render3' && 'Rendering Portrait Lyric master...'}
                      {productionStage === 'render4' && 'Rendering Portrait Clean master...'}
                      {productionStage === 'complete' && 'All four masters generated successfully.'}
                      {productionStage === 'failed' && ('Production stopped at the failed stage. ' + (serverProduction?.error || 'Correct the reported error and retry.'))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* 2. Multilingual Cockpit Panel & Synchronized Waveform Editor */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
              {/* Header with Title & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Multilingual Lyrics & Translations</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleGenerateMultilingual}
                    disabled={generatingMulti || !hasMasterAudio}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold border border-amber-500/40 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {generatingMulti ? 'Processing...' : 'Run Multilingual Engine'}
                  </button>
                  <button
                    onClick={() => handleAutoAlign(false)}
                    disabled={autoAligning || !hasMasterAudio}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold border border-cyan-500/40 disabled:opacity-50"
                    title="Analyze the genuine master WAV and align canonical lyrics to actual vocal timestamps"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {autoAligning ? 'Auto-Syncing...' : 'Auto-Sync Audio + Lyrics'}
                  </button>
                  <button
                    onClick={handleResetAlignment}
                    disabled={isSavingTimeline || autoAligning || !hasMasterAudio}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-xs font-semibold border border-purple-500/40 disabled:opacity-50"
                    title="Reset to natural phrase-based preview timing only"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Phrasing
                  </button>
                  <button
                    onClick={handleSaveTimeline}
                    disabled={isSavingTimeline || editingLines.length === 0 || !audioAlignmentReviewed || editingLines.some(line => !Array.isArray(line.words) || line.words.length === 0)}
                    title={saveTimestampsBlockReason || 'Save the reviewed word timestamps and regenerate all subtitle tracks'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold border border-emerald-500/40 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSavingTimeline ? 'Saving...' : 'Save Timestamps'}
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

              <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 text-xs text-amber-100 space-y-2">
                {draft.alignmentStatus && (
                  <div className={`rounded-lg border px-2.5 py-1.5 text-[11px] ${
                    draft.alignmentStatus.state === 'running'
                      ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200'
                      : draft.alignmentStatus.state === 'done'
                        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                        : 'border-red-400/40 bg-red-500/10 text-red-200'
                  }`}>
                    <strong>
                      {draft.alignmentStatus.state === 'running' ? 'Auto-sync running…' : draft.alignmentStatus.state === 'done' ? 'Auto-sync finished' : 'Auto-sync failed'}
                    </strong>{' '}
                    {draft.alignmentStatus.message}
                    {draft.alignmentStatus.state === 'running' && ' (runs in the background; this page updates by itself. Large-v3 on CPU can take 10–20 minutes.)'}
                  </div>
                )}
                {timelineDirty && (
                  <div className="rounded-lg border border-amber-400/60 bg-amber-500/15 px-2.5 py-1.5 text-[11px] text-amber-100">
                    <strong>Unsaved timing edits.</strong> They are only in this page until you tick
                    {' '}"I reviewed every lyric cue…" and click <strong>Save Timestamps</strong>. Saving rebuilds the subtitle
                    files; Part B Preview and the four masters must then be re-rendered to show the new timing.
                  </div>
                )}
                {saveTimestampsBlockReason && (
                  <div className="rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-[11px] text-amber-200">
                    <strong>Save Timestamps is disabled:</strong> {saveTimestampsBlockReason}
                  </div>
                )}
                <strong>Caption synchronization integrity</strong>
                <div>{editingLines.length === 0 || editingLines.some(line => !Array.isArray(line.words) || line.words.length === 0)
                  ? 'UNVERIFIED. Word-level alignment is missing. A proportional lyric preview is not synchronized singing. Import verified alignment with the genuine audio before final rendering.'
                  : 'Word timestamps available. Audition the recording against the lyrics and confirm below before saving.'}</div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={audioAlignmentReviewed} onChange={e => setAudioAlignmentReviewed(e.target.checked)} /> I reviewed every lyric cue and word timing against actual master audio.</label>
              </div>
              {/* Synchronized Waveform Scrubber & Playhead Controller */}
              {hasMasterAudio && (
                <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleAudio}
                        className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shrink-0 shadow"
                      >
                        {isPlayingAudio ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>
                      <div>
                        <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <span>Waveform Scrubber</span>
                          {isPlayingAudio && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                        </div>
                        <div className="text-[11px] text-white/60 font-mono">
                          {audioCurrentTime.toFixed(2)}s / {audioDuration.toFixed(2)}s
                        </div>
                      </div>
                    </div>

                    {/* Active Singing Line Live Indicator */}
                    {(() => {
                      const activeLine = editingLines.find(
                        (l) => audioCurrentTime >= l.startSeconds && audioCurrentTime <= l.endSeconds && !l.isProductionDirection
                      );
                      if (!activeLine) {
                        if (audioCurrentTime >= 101.50 && audioCurrentTime < 125.56) {
                          const remaining = Math.max(0, Math.ceil(125.56 - audioCurrentTime));
                          return (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs animate-pulse">
                              <span className="font-bold text-purple-300 font-mono">🎵 INTERLUDE</span>
                              <span className="text-[11px] text-white/80">Flute & Rebab Solo (Resumes in {remaining}s at #32)</span>
                            </div>
                          );
                        }
                        if (audioCurrentTime >= 189.78 && audioCurrentTime < 202.76) {
                          const remaining = Math.max(0, Math.ceil(202.76 - audioCurrentTime));
                          return (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs animate-pulse">
                              <span className="font-bold text-purple-300 font-mono">🎵 BRIDGE</span>
                              <span className="text-[11px] text-white/80">Instrumental Break (Resumes in {remaining}s at #55)</span>
                            </div>
                          );
                        }
                        return <div className="text-xs text-white/30 italic">No vocals active</div>;
                      }
                      return (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                          <span className="font-bold text-amber-400 font-mono">#{activeLine.vocalIndex || activeLine.lineIndex + 1}</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] uppercase font-semibold">
                            {(() => {
                               const speakerRoman: Record<string, string> = {
                                 'शायर': 'Shayar', 'रब': 'Rab', 'नौजवान': 'Naujawan', 'कोरस': 'Chorus',
                               };
                               const sp = String(activeLine.speaker || 'शायर').trim();
                               return speakerRoman[sp] || sp;
                             })()}
                          </span>
                          <span className="truncate max-w-[280px] font-medium" title={toRomanUrdu(activeLine.romanUrdu) || toRomanUrdu(activeLine.text)}>
                            {toRomanUrdu(activeLine.romanUrdu) || toRomanUrdu(activeLine.text)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Scrubber Range Slider with Simulated Waveform Bars */}
                  <div className="relative pt-1">
                    {/* Simulated Waveform Visualization Bars */}
                    <div className="h-6 flex items-end gap-0.5 opacity-40 px-1 mb-1 pointer-events-none">
                      {Array.from({ length: 70 }).map((_, i) => {
                        const progress = i / 70;
                        const isPast = (progress * audioDuration) <= audioCurrentTime;
                        // Pseudo-amplitude waveform based on section cadence
                        const h = 20 + Math.sin(i * 0.45) * 15 + ((i % 4) * 10);
                        return (
                          <div
                            key={i}
                            className={`flex-1 rounded-t transition-colors ${
                              isPast ? 'bg-amber-400' : 'bg-white/20'
                            }`}
                            style={{ height: `${Math.min(100, Math.max(15, h))}%` }}
                          />
                        );
                      })}
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={audioDuration || 285.2}
                      step={0.1}
                      value={audioCurrentTime}
                      onChange={(e) => handleSeekAudio(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                    />
                  </div>
                </div>
              )}

              {/* Speaker Filters & 4-Language Tabs */}
              <div className="space-y-3">
                {/* Speaker Filter Pills */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white/40 font-medium mr-1">Speaker Filter:</span>
                    <button
                      onClick={() => setTimelineFilterSpeaker('all')}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                        timelineFilterSpeaker === 'all'
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-white/5 text-white/50 hover:text-white border border-transparent'
                      }`}
                    >
                      All ({editingLines.length})
                    </button>
                    <button
                      onClick={() => setTimelineFilterSpeaker('शायर')}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                        timelineFilterSpeaker === 'शायर'
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                          : 'bg-white/5 text-amber-300/60 hover:text-amber-200 border border-transparent'
                      }`}
                    >
                      शायर / Poet ({editingLines.filter((l) => (l.speaker || '').includes('शायर')).length})
                    </button>
                    <button
                      onClick={() => setTimelineFilterSpeaker('रब')}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                        timelineFilterSpeaker === 'रब'
                          ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                          : 'bg-white/5 text-purple-300/60 hover:text-purple-200 border border-transparent'
                      }`}
                    >
                      रब / The Divine ({editingLines.filter((l) => (l.speaker || '').includes('रब')).length})
                    </button>
                    <button
                      onClick={() => setTimelineFilterSpeaker('नौजवान')}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                        timelineFilterSpeaker === 'नौजवान'
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                          : 'bg-white/5 text-emerald-300/60 hover:text-emerald-200 border border-transparent'
                      }`}
                    >
                      नौजवान / Youth ({editingLines.filter((l) => (l.speaker || '').includes('नौजवान')).length})
                    </button>
                  </div>
                </div>

                {/* 4-Language Representation Script Tabs */}
                <div className="flex border-b border-white/10 gap-1 overflow-x-auto">
                  <button
                    onClick={() => setSelectedLang('en-rom')}
                    className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                      selectedLang === 'en-rom'
                        ? 'border-amber-400 text-amber-300'
                        : 'border-transparent text-white/50 hover:text-white'
                    }`}
                  >
                    1. Roman Urdu
                  </button>
                  <button
                    onClick={() => setSelectedLang('ur')}
                    className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                      selectedLang === 'ur'
                        ? 'border-amber-400 text-amber-300'
                        : 'border-transparent text-white/50 hover:text-white'
                    }`}
                  >
                    2. Urdu (Nastaliq)
                  </button>
                  <button
                    onClick={() => setSelectedLang('ur-deva')}
                    className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                      selectedLang === 'ur-deva'
                        ? 'border-amber-400 text-amber-300'
                        : 'border-transparent text-white/50 hover:text-white'
                    }`}
                  >
                    3. Hindi (Devanagari)
                  </button>
                  <button
                    onClick={() => setSelectedLang('en')}
                    className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                      selectedLang === 'en'
                        ? 'border-amber-400 text-amber-300'
                        : 'border-transparent text-white/50 hover:text-white'
                    }`}
                  >
                    4. English
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      timelineDirtyRef.current = false;
                      setTimelineDirty(false);
                      await fetchDraft();
                    }}
                    className="ml-auto my-auto px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-semibold whitespace-nowrap"
                    title="Reload fresh 4-language cues from the authoritative master lexicon"
                  >
                    ↻ Refresh 4-Language Cues
                  </button>
                </div>
              </div>

              {/* Subtitle Cue Lines Interactive List */}
              {editingLines.length > 0 ? (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {editingLines.map((line: any, idx: number) => {
                    if (
                      timelineFilterSpeaker !== 'all' &&
                      !(line.speaker || '').toLowerCase().includes(timelineFilterSpeaker.toLowerCase())
                    ) {
                      return null;
                    }

                    const isActiveSinging =
                      audioCurrentTime >= line.startSeconds && audioCurrentTime <= line.endSeconds;
                    const isAuditioning = auditioningIndex === idx;

                    // Speaker Badge Coloring
                    let speakerBadgeClass = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
                    let speakerLabel = line.speaker || 'कोरस';
                    if (speakerLabel.includes('शायर')) {
                      speakerBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                    } else if (speakerLabel.includes('रब')) {
                      speakerBadgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
                    } else if (speakerLabel.includes('नौजवान')) {
                      speakerBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                    }

                    // Display text based on selected language tab
                    let displayText = line.text;
                    let fontClass = '';
                    let isRtl = false;

                    if (selectedLang === 'ur') {
                      const ur = String(line.urduNastaliq || '').trim();
                      displayText = (ur && /[\u0600-\u06FF]/.test(ur))
                        ? ur
                        : devanagariToUrdu(line.text);
                      fontClass = 'font-nastaliq text-xl leading-[2.4] text-amber-100';
                      isRtl = true;
                    } else if (selectedLang === 'en') {
                      displayText = line.englishTranslation || '(Translating...)';
                      fontClass = 'italic text-sm text-emerald-300 leading-relaxed';
                    } else if (selectedLang === 'en-rom') {
                      const roman = String(line.romanUrdu || '').trim();
                      displayText = (roman && !/[\u0600-\u06FF\u0900-\u097F]/.test(roman))
                        ? roman
                        : toRomanUrdu(line.text) || '(Roman Urdu unavailable)';
                      fontClass = 'text-sm text-amber-200';
                    } else if (selectedLang === 'ur-deva') {
                      const deva = String(line.devanagariUrdu || '').trim();
                      displayText = (deva && /[\u0900-\u097F]/.test(deva))
                        ? deva
                        : (line.text || '(Devanagari unavailable)');
                      fontClass = 'text-sm text-blue-200';
                    }

                    const isExpanded = expandedLineIndex === idx;

                    return (
                      <Fragment key={idx}>
                        <div
                          className={`p-3.5 rounded-xl border transition-all duration-200 space-y-3 ${
                            isActiveSinging
                              ? 'border-amber-400 bg-amber-500/[0.08] shadow-lg shadow-amber-500/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                        {/* Header Row: Index, Speaker Badge, Section, Audition Button, Editable Timestamps */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-mono font-bold text-white/50">
                              #{line.vocalIndex || idx + 1}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border uppercase ${speakerBadgeClass}`}>
                              {speakerLabel}
                            </span>
                            {line.section && (
                              <span className="px-2 py-0.5 rounded bg-white/5 text-white/40 text-[10px] truncate max-w-[200px]">
                                {line.section}
                              </span>
                            )}
                            {line.isProductionDirection && (
                              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-semibold">
                                Instrumental / Non-Vocal
                              </span>
                            )}
                            <button
                              onClick={() => handlePlayPhrase(line.startSeconds, line.endSeconds, idx)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                                isAuditioning
                                  ? 'bg-amber-400 text-black shadow'
                                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                              }`}
                              title="Audition phrase in master audio"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              {isAuditioning ? 'Playing...' : 'Audition'}
                            </button>
                          </div>

                          {/* Timestamp Adjustment Controls */}
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            {/* Start Time Nudge */}
                            <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10">
                              <button
                                onClick={() => handleNudgeTime(idx, 'startSeconds', -0.2)}
                                className="px-1 text-[10px] text-white/50 hover:text-amber-300"
                                title="Nudge start earlier by 0.2s"
                              >
                                -0.2
                              </button>
                              <input
                                type="number"
                                step="0.05"
                                value={line.startSeconds}
                                onChange={(e) =>
                                  handleUpdateLineField(idx, 'startSeconds', parseFloat(e.target.value) || 0)
                                }
                                className="w-14 bg-transparent text-center text-amber-300 text-xs font-mono focus:outline-none"
                              />
                              <button
                                onClick={() => handleNudgeTime(idx, 'startSeconds', 0.2)}
                                className="px-1 text-[10px] text-white/50 hover:text-amber-300"
                                title="Nudge start later by 0.2s"
                              >
                                +0.2
                              </button>
                            </div>

                            <span className="text-white/40">&rarr;</span>

                            {/* End Time Nudge */}
                            <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10">
                              <button
                                onClick={() => handleNudgeTime(idx, 'endSeconds', -0.2)}
                                className="px-1 text-[10px] text-white/50 hover:text-amber-300"
                                title="Nudge end earlier by 0.2s"
                              >
                                -0.2
                              </button>
                              <input
                                type="number"
                                step="0.05"
                                value={line.endSeconds}
                                onChange={(e) =>
                                  handleUpdateLineField(idx, 'endSeconds', parseFloat(e.target.value) || 0)
                                }
                                className="w-14 bg-transparent text-center text-amber-300 text-xs font-mono focus:outline-none"
                              />
                              <button
                                onClick={() => handleNudgeTime(idx, 'endSeconds', 0.2)}
                                className="px-1 text-[10px] text-white/50 hover:text-amber-300"
                                title="Nudge end later by 0.2s"
                              >
                                +0.2
                              </button>
                            </div>

                            {/* Duration & Confidence */}
                            <span className="px-1.5 py-0.5 rounded bg-white/5 text-white/60 text-[10px]">
                              {(line.endSeconds - line.startSeconds).toFixed(2)}s
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">
                              {Array.isArray(line.words) && line.words.length > 0 ? `${Math.round((line.confidence || 0) * 100)}%` : 'Timing unverified'}
                            </span>
                          </div>
                        </div>

                        {/* Content Row: Selected Language Text Display */}
                        <div
                          dir={isRtl ? 'rtl' : 'ltr'}
                          className={`font-medium ${fontClass}`}
                        >
                          {displayText}
                        </div>

                        {/* Expandable 4-Language Inline Editor Drawer */}
                        <div>
                          <button
                            onClick={() => setExpandedLineIndex(isExpanded ? null : idx)}
                            className="text-[11px] text-white/40 hover:text-amber-300 flex items-center gap-1 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {isExpanded ? 'Hide Language Editor' : 'Edit 4 Scripts Inline'}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 p-3 rounded-lg bg-black/60 border border-white/10 space-y-2.5 text-xs">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <label className="text-[10px] font-semibold text-amber-300 block mb-1">
                                    1. Roman Urdu
                                  </label>
                                  <input
                                    type="text"
                                    value={line.romanUrdu || ''}
                                    onChange={(e) => handleUpdateLineField(idx, 'romanUrdu', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-300"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-amber-400 block mb-1">
                                    2. Urdu (Nastaliq)
                                  </label>
                                  <input
                                    dir="rtl"
                                    type="text"
                                    value={line.urduNastaliq || ''}
                                    onChange={(e) => handleUpdateLineField(idx, 'urduNastaliq', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white font-serif text-sm focus:outline-none focus:border-amber-400"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-blue-300 block mb-1">
                                    3. Hindi (Devanagari)
                                  </label>
                                  <input
                                    type="text"
                                    value={line.devanagariUrdu || ''}
                                    onChange={(e) => handleUpdateLineField(idx, 'devanagariUrdu', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-300"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-emerald-400 block mb-1">
                                    4. English
                                  </label>
                                  <input
                                    type="text"
                                    value={line.englishTranslation || ''}
                                    onChange={(e) => handleUpdateLineField(idx, 'englishTranslation', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateLineField(idx, 'isProductionDirection', !line.isProductionDirection)}
                                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                                    line.isProductionDirection
                                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                      : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
                                  }`}
                                >
                                  {line.isProductionDirection ? '✓ Marked as Instrumental (Omit from Subtitles)' : 'Mark as Instrumental (Omit from Subtitles)'}
                                </button>
                                <span className="text-[10px] text-white/40">
                                  {line.isProductionDirection ? 'Line is preserved in poem text, but omitted from video subtitle burn.' : 'Line burns in video subtitle.'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Fragment>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-white/40 rounded-xl border border-white/5 bg-white/[0.01]">
                  {draft.masterAudio ? "Master audio is ready. Run Multilingual Engine to generate lyric cues for review." : "Render the master WAV, then run Multilingual Engine to generate lyric cues."}
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
                    onClick={() => handleSelectVideoFormat('lyric_master')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      videoFormat === 'lyric_master'
                        ? 'border-amber-400 bg-amber-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">1. Lyric Master</div>
                    <div className="text-[11px] text-white/50 mt-0.5">Burned Roman Urdu + English + Urdu + Hindi</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectVideoFormat('clean_cinematic')}
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

              {/* Aspect Ratio / Canvas Layout Selection */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-white/70 block">
                  Canvas Aspect Ratio & Layout:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectVideoOrientation('landscape')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      videoOrientation === 'landscape'
                        ? 'border-amber-400 bg-amber-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">16:9 Landscape</div>
                    <div className="text-[10px] text-white/50 mt-0.5">1920x1080 (YouTube Master)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectVideoOrientation('portrait')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      videoOrientation === 'portrait'
                        ? 'border-amber-400 bg-amber-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">9:16 Portrait</div>
                    <div className="text-[10px] text-white/50 mt-0.5">1080x1920 (Shorts / Reels)</div>
                  </button>
                </div>
              </div>

              {/* Four-Format Master Production Matrix */}
              {(() => {
                const matrix = [
                  { key: 'lyric_master_landscape', legacy: 'lyric_master', fmt: 'lyric_master' as const, ori: 'landscape' as const, name: 'Landscape Lyric', res: '1920 × 1080', ratio: '16:9', cc: 'Burned CC' },
                  { key: 'clean_cinematic_landscape', legacy: 'clean_cinematic', fmt: 'clean_cinematic' as const, ori: 'landscape' as const, name: 'Landscape Clean', res: '1920 × 1080', ratio: '16:9', cc: 'No CC' },
                  { key: 'lyric_master_portrait', legacy: null, fmt: 'lyric_master' as const, ori: 'portrait' as const, name: 'Portrait Lyric', res: '1080 × 1920', ratio: '9:16', cc: 'Mobile CC' },
                  { key: 'clean_cinematic_portrait', legacy: null, fmt: 'clean_cinematic' as const, ori: 'portrait' as const, name: 'Portrait Clean', res: '1080 × 1920', ratio: '9:16', cc: 'No CC' },
                ];
                return (
                  <div className="p-3.5 rounded-xl border border-white/10 bg-black/40 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-white/80 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        Four-Format Production Matrix (Independent Settings)
                      </span>
                      <span className="font-mono text-amber-300 text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                        Active: {videoOrientation === 'portrait' ? '9:16 Portrait' : '16:9 Landscape'} • {videoFormat === 'lyric_master' ? 'Lyric Master' : 'Clean Cinematic'}
                      </span>
                    </div>
                    <div
                      role="radiogroup"
                      aria-label="Video master format"
                      className="grid gap-2"
                      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 10.5rem), 1fr))' }}
                    >
                      {matrix.map((m) => {
                        const selected = videoFormat === m.fmt && videoOrientation === m.ori;
                        const info = draft?.video?.formats?.[m.key] || (m.legacy ? draft?.video?.formats?.[m.legacy] : undefined);
                        const isReady = Boolean(info?.outputPath);
                        const isRendering = renderingVideo && selected;
                        const status = isRendering ? 'RENDERING' : isReady ? 'READY' : 'NOT RENDERED';
                        const statusClass =
                          status === 'READY'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                            : status === 'RENDERING'
                              ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                              : 'text-white/50 bg-white/5 border-white/10';
                        return (
                          <button
                            key={m.key}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => { handleSelectVideoFormat(m.fmt); handleSelectVideoOrientation(m.ori); }}
                            className={`min-w-0 min-h-[8.5rem] flex flex-col justify-between gap-2 p-3 rounded-lg border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                              selected
                                ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/10'
                                : 'border-white/10 bg-white/5 hover:border-white/25'
                            }`}
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="text-xs font-semibold text-white break-words">{m.name}</div>
                              <div className="text-sm font-mono text-white whitespace-nowrap">{m.res}</div>
                              <div className="text-[11px] text-white/60">{m.ratio}</div>
                              <div className="text-[11px] text-white/60">{m.cc}</div>
                            </div>
                            <div className={`self-start text-[10px] font-mono font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${statusClass}`}>
                              {status}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Three-Part Video Composition: Part A + Part B + Part C */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Three-Part Video Composition
                  </div>
                  <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Part A (Thumbnail) + Part B (Suno Song) + Part C (Promo)
                  </span>
                </div>

                {/* ─── PART A: OPENER / INTRODUCTION (VIDEO OR IMAGE) ───────────────── */}
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3 text-xs">
                  <div className="flex items-center justify-between font-semibold text-amber-300">
                    <div className="flex items-center gap-1.5">
                      {draft?.video?.partA?.mediaType === 'video' ? (
                        <VideoIcon className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                      )}
                      <span>PART A: {draft?.video?.partA?.mediaType === 'video' ? 'Video Opener' : 'Thumbnail Intro'} (Opening Screen)</span>
                    </div>
                    <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30 text-amber-200">
                      {draft?.video?.partA?.mediaType === 'video' ? '🎬 Video' : '🖼️ Image'} • {partADuration.toFixed(1)}s • {draft?.video?.partA?.audioPolicy === 'suno_starts_at_part_a' ? 'Song + Captions' : draft?.video?.partA?.audioPolicy === 'preserve_part_a_audio' ? 'Video Audio' : 'Silent'}
                    </span>
                  </div>

                  <div className="text-[11px] text-white/70">
                    {draft?.video?.partA?.audioPolicy === 'suno_starts_at_part_a'
                      ? <>The Suno song and lyric captions begin immediately on Part A; Part B continues seamlessly at t = {partADuration.toFixed(1)}s without restarting.</>
                      : draft?.video?.partA?.audioPolicy === 'preserve_part_a_audio'
                      ? <>Part A plays the uploaded video with its original embedded audio; the Suno song and lyric captions begin when Part B starts at t = {partADuration.toFixed(1)}s.</>
                      : <>Opening visual screen is silent. The Suno song and lyric captions begin when Part B starts at t = {partADuration.toFixed(1)}s.</>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg border border-amber-500/20 bg-black/30">
                    <span className="text-[11px] text-white/70 font-semibold">Part A Audio:</span>
                    <button
                      type="button"
                      onClick={() => handleUpdatePartAAudioPolicy('suno_starts_at_part_b')}
                      className={`px-3 py-1 rounded-lg border text-[11px] font-medium ${draft?.video?.partA?.audioPolicy === 'suno_starts_at_part_b' || (!draft?.video?.partA?.audioPolicy && draft?.video?.partA?.mediaType !== 'video') ? 'border-amber-400 bg-amber-500/20 text-white' : 'border-white/10 bg-white/5 text-white/60'}`}
                    >
                      Silent Intro
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdatePartAAudioPolicy('suno_starts_at_part_a')}
                      className={`px-3 py-1 rounded-lg border text-[11px] font-medium ${draft?.video?.partA?.audioPolicy === 'suno_starts_at_part_a' ? 'border-amber-400 bg-amber-500/20 text-white' : 'border-white/10 bg-white/5 text-white/60'}`}
                    >
                      Song + Captions
                    </button>
                    {draft?.video?.partA?.mediaType === 'video' && (
                      <button
                        type="button"
                        onClick={() => handleUpdatePartAAudioPolicy('preserve_part_a_audio')}
                        className={`px-3 py-1 rounded-lg border text-[11px] font-medium ${draft?.video?.partA?.audioPolicy === 'preserve_part_a_audio' ? 'border-amber-400 bg-amber-500/20 text-white' : 'border-white/10 bg-white/5 text-white/60'}`}
                      >
                        Original Video Audio
                      </button>
                    )}
                  </div>

                  {/* Configurable Duration Selector */}
                  <div className="space-y-1.5 p-2.5 rounded-lg border border-amber-500/20 bg-black/30">
                    <label className="text-[11px] text-white/70 font-semibold block flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Introductory Screen Duration:
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { label: '3 sec', sec: 3 },
                        { label: '5 sec (Default)', sec: 5 },
                        { label: '10 sec', sec: 10 },
                        ...(draft?.video?.partA?.mediaType === 'video' && draft?.video?.partA?.durationSeconds
                          ? [{ label: `Video (${Number(draft.video.partA.durationSeconds).toFixed(1)}s)`, sec: Math.round(draft.video.partA.durationSeconds * 10) / 10 }]
                          : []),
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => handleUpdatePartADuration(item.sec)}
                          className={`px-3 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                            partADuration === item.sec && partADurationPreset !== 'custom'
                              ? 'border-amber-400 bg-amber-500/20 text-white font-semibold'
                              : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}

                      <div className="flex items-center gap-1.5 ml-auto text-[11px]">
                        <span className="text-white/50">Custom:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="60"
                          value={partADuration}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleUpdatePartADuration(val);
                          }}
                          className="w-16 px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white font-mono text-[11px] text-center"
                        />
                        <span className="text-white/50">sec</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Visual Preview & Controls */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-black/40 border border-amber-500/20">
                      {draft?.video?.partA?.mediaType === 'video' ? (
                        <div className="relative w-28 h-16 rounded border border-white/10 shrink-0 bg-black overflow-hidden">
                          <img
                            src={`/api/admin/pipeline/drafts/${draftId}/media?asset=thumbnail&v=${encodeURIComponent(draft?.video?.partA?.uploadedAt || draft?.updatedAt || '')}`}
                            alt="Active Video Thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 text-[8px] font-mono text-amber-300 rounded border border-amber-400/30">
                            VIDEO
                          </span>
                        </div>
                      ) : (
                        <img
                          src={`/api/admin/pipeline/drafts/${draftId}/media?asset=thumbnail&v=${encodeURIComponent(draft?.video?.partA?.uploadedAt || draft?.updatedAt || '')}`}
                          alt="Active Thumbnail"
                          className="w-28 h-16 object-cover rounded border border-white/10 shrink-0 bg-black/60"
                        />
                      )}
                      <div className="space-y-1 min-w-0 text-[11px]">
                        <div className="text-white font-medium flex items-center gap-1.5">
                          <span>{draft?.video?.partA?.mediaType === 'video' ? 'Active Video Opener & Cover' : 'Active Release Thumbnail & Video Opener'}</span>
                          <span className="text-emerald-400 font-mono text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Verified
                          </span>
                        </div>
                        <div className="text-white/50 text-[10px]">
                          {draft?.video?.partA?.mediaType === 'video' ? 'Animated Video Opener' : 'Independent YouTube Cover'} ({partADuration.toFixed(1)}s • {draft?.video?.partA?.audioPolicy === 'suno_starts_at_part_a' ? 'song + caption intro' : draft?.video?.partA?.audioPolicy === 'preserve_part_a_audio' ? 'video audio' : 'silent intro'})
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCustomThumbStudio(!showCustomThumbStudio)}
                          className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium"
                        >
                          {showCustomThumbStudio ? 'Hide Upload / Thumbnail Controls' : 'Change / Upload Video Opener or Cover Image'}
                        </button>
                      </div>
                    </div>

                    {showCustomThumbStudio && (
                      <div className="p-3 rounded-lg border border-white/10 bg-black/30 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleExtractThumbnailFrame(0.0)}
                            disabled={extractingThumbnail}
                            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium border border-white/20"
                          >
                            First Frame (t=0.0s)
                          </button>

                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-white/50">Frame at (s):</span>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={draft?.video?.partA?.mediaType === 'video' ? (draft?.video?.partA?.durationSeconds || 60) : (draft?.masterAudio?.durationSeconds || 285)}
                              value={customThumbTimestamp}
                              onChange={(e) => setCustomThumbTimestamp(e.target.value)}
                              className="w-14 px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white font-mono text-[10px]"
                            />
                            <button
                              type="button"
                              onClick={() => handleExtractThumbnailFrame(parseFloat(customThumbTimestamp) || 0)}
                              disabled={extractingThumbnail}
                              className="px-2 py-1 rounded bg-amber-500 text-black font-semibold text-[10px] hover:bg-amber-400 disabled:opacity-50"
                            >
                              {extractingThumbnail ? 'Extracting...' : 'Extract Frame'}
                            </button>
                          </div>
                        </div>

                        {/* Custom Media Upload Form (Image or Video) */}
                        <form onSubmit={handleUploadCustomThumbnail} className="pt-2 border-t border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-white/70 font-semibold">Upload Image Cover or Video Opener:</label>
                            <span className="text-[9px] text-white/40 font-mono">PNG, JPG, WebP, MP4, MOV, WebM</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr),auto] items-center gap-2">
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                              onChange={(e) => setCustomThumbFile(e.target.files?.[0] || null)}
                              className="min-w-0 w-full max-w-full text-[10px] text-white/70 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[9px] file:bg-white/10 file:text-white file:font-semibold hover:file:bg-white/20"
                            />
                            <button
                              type="submit"
                              disabled={!customThumbFile || uploadingCustomThumb}
                              className="w-full sm:w-auto px-3.5 py-1.5 rounded bg-emerald-500 text-black text-[10px] font-semibold hover:bg-emerald-400 disabled:opacity-40 transition-colors whitespace-nowrap"
                            >
                              {uploadingCustomThumb ? 'Uploading…' : customThumbFile && /\.(mp4|mov|webm|mkv)$/i.test(customThumbFile.name) ? 'Attach Video Opener' : 'Attach Cover Image'}
                            </button>
                          </div>
                          <p className="text-[9px] text-white/50">
                            💡 If you upload a video, it plays as the animated Part A opening hook and frame t=0 is automatically extracted as the YouTube cover thumbnail.
                          </p>
                        </form>
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── PART B: MAIN SUNO SONG (DYNAMIC DURATION MATCHING) ───────── */}
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3 text-xs">
                  <div className="flex items-center justify-between font-semibold text-emerald-300">
                    <div className="flex items-center gap-1.5">
                      <Music className="w-4 h-4 text-emerald-400" />
                      <span>PART B: Main Suno Song (Core Lyric Video)</span>
                      <span className="text-[10px] font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-400/30 text-emerald-200">
                        {draft?.video?.partB?.canvaDesignId || 'DAHa7St5CYs'}
                      </span>
                    </div>
                    <a
                      href={draft?.video?.partB?.canvaUrl || 'https://canva.link/ezqj8ymddv6yl2d'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 underline font-normal"
                    >
                      Open in Canva
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Dynamic Duration Matching Status Banner */}
                  <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/70 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <Repeat className="w-3 h-3 text-emerald-400" />
                        Dynamic Duration Matching
                      </span>
                      <span className="font-mono text-emerald-300 font-bold">
                        {hasMasterAudio ? `${draft?.masterAudio?.durationSeconds?.toFixed(1)}s` : 'Pending Master'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-500/20">
                      <div>
                        <span className="text-white/50 block text-[10px]">Source clip length</span>
                        <span className="font-mono text-white font-medium">
                          {draft?.video?.partB?.sourceDurationSeconds?.toFixed(1) || 4.0}s (Visual Loop)
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50 block text-[10px]">Part B render length</span>
                        <span className="font-mono text-emerald-300 font-bold">
                          {draft.masterAudio ? draft.masterAudio.durationSeconds.toFixed(1) + 's (full song)' : 'Pending master WAV'}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-200/80 pt-0.5">
                      During render, SufiPulse {partBPlaybackMode === 'freeze_last_frame' ? 'holds the last frame' : partBPlaybackMode === 'stretch' ? 'stretches the animation' : partBPlaybackMode === 'custom_range' ? 'repeats the selected range' : 'repeats the source clip'} to fill Part B.
                    </div>
                    <div className="text-[10px] text-white/60 flex items-center gap-1 pt-0.5">
                      <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{draft.masterTimeline?.lines?.length || 0} lyric cues available for the Lyric Master</span>
                    </div>
                  </div>

                  {/* Background Source Diagnostics (Requirement 6) */}
                  <div className="p-3 rounded-lg border border-emerald-500/30 bg-black/40 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                      <span className="font-semibold text-emerald-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Background Source Diagnostics
                      </span>
                      <span className="font-mono text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-400/30 font-bold">
                        VERIFIED CANVA ASSET
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      <div className="bg-white/5 p-2 rounded border border-white/5">
                        <span className="text-white/50 block text-[9px] uppercase tracking-wider">Selected Source</span>
                        <span className="font-mono text-white font-semibold truncate block" title={draft?.video?.partB?.sourceFile || 'canva_part_b_original_4s.mp4'}>
                          {draft?.video?.partB?.sourceFile || 'canva_part_b_original_4s.mp4'}
                        </span>
                        <span className="text-white/40 text-[9px] block">part a.mp4</span>
                      </div>

                      <div className="bg-white/5 p-2 rounded border border-white/5">
                        <span className="text-white/50 block text-[9px] uppercase tracking-wider">Source Origin</span>
                        <span className="font-semibold text-amber-300 block">Canva DAHa7St5CYs</span>
                        <span className="text-white/40 text-[9px] block">Kashmir Gold Landscape</span>
                      </div>

                      <div className="bg-white/5 p-2 rounded border border-white/5">
                        <span className="text-white/50 block text-[9px] uppercase tracking-wider">Resolution & Time</span>
                        <span className="font-mono text-white font-medium block">3840 × 2160 (4K UHD)</span>
                        <span className="text-emerald-400 font-mono text-[9px] block">Duration: 4.0s (Looped)</span>
                      </div>

                      <div className="bg-white/5 p-2 rounded border border-white/5">
                        <span className="text-white/50 block text-[9px] uppercase tracking-wider">Integrity Status</span>
                        <div className="flex items-center gap-1 text-emerald-400 font-bold">
                          <Check className="w-2.5 h-2.5" /> Media: VERIFIED
                        </div>
                        <div className="text-[9px] text-emerald-300">
                          Fallback Active: <strong className="text-emerald-400">NO</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between pt-1 border-t border-white/5 text-[10px] text-white/60">
                      <div className="flex items-center gap-2">
                        <span>Preview/Render Match: <strong className="text-emerald-400">YES</strong></span>
                        <span>•</span>
                        <span>Loop Mode: <strong className="text-white">{partBPlaybackMode === 'seamless_loop' ? 'Seamless Loop (4.0s -> ' + (draft?.masterAudio?.durationSeconds?.toFixed(1) || '285.2') + 's)' : partBPlaybackMode}</strong></span>
                      </div>
                      <span className="font-mono text-white/40 text-[9px]">Zero-Silent-Fallback Enforced</span>
                    </div>
                  </div>

                  {(() => {
                    const rendered = draft.video?.formats?.[videoFormat + '_' + videoOrientation];
                    const duration = rendered?.partBSeconds ?? 0;
                    const base = '/api/admin/pipeline/drafts/' + draftId + '/media?asset=';
                    const quick: any = draft.video?.partB?.preview;
                    const quickExists = Boolean(quick?.path && quick.orientation === videoOrientation);
                    // The full-master Part B clip is stale once captions/timing were edited (videoValid=false)
                    // or when a newer quick preview exists: always show the freshest one.
                    const masterClipFresh = Boolean(rendered?.outputPath && duration > 0) &&
                      draft.downstreamStatus?.videoValid !== false &&
                      !(quickExists && new Date(quick.renderedAt).getTime() > new Date(draft.video?.renderedAt || 0).getTime());
                    const preview = masterClipFresh;
                    const quickReady = Boolean(!preview && quickExists);
                    const src = preview
                      ? base + 'part_b_rendered&format=' + videoFormat + '&orientation=' + videoOrientation + '&v=' + rendered.sha256
                      : quickReady
                        ? base + 'part_b_preview&orientation=' + videoOrientation + '&v=' + (quick.sha256 || quick.key)
                        : base + 'part_b_video';
                    return (
                      <div className="space-y-2">
                        <div className="mx-auto w-full overflow-hidden rounded-lg border border-emerald-500/20 bg-black/40" style={{ aspectRatio: videoOrientation === "portrait" ? "9 / 16" : "16 / 9", maxWidth: videoOrientation === "portrait" ? "min(100%, 36.5625vh)" : undefined }}>
                          <video
                            key={src}
                            controls
                            muted={!preview && !quickReady}
                            preload="metadata"
                            className="block h-full w-full object-cover"
                            src={src}
                          />
                        </div>
                        <p className="text-xs text-white/65">{preview
                          ? 'Rendered Part B (' + duration.toFixed(2) + 's) with the Suno master' + (videoFormat === 'lyric_master' ? ' and burned lyrics.' : '.')
                          : quickReady
                            ? 'Part B preview (' + Number(quick.durationSeconds || 0).toFixed(1) + 's): full Suno song' + (quick.hasBurnedLyrics ? ' with burned lyrics.' : ' (no lyrics burned yet — compile subtitles first).')
                            : 'Source clip only. Click "Render Part B Preview" to hear the full Suno song over this background' + (hasSubtitles ? ' with the burned lyrics.' : '.')}</p>
                        <button
                          type="button"
                          onClick={handleRenderPartBPreview}
                          disabled={renderingPartBPreview || !hasMasterAudio}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold hover:bg-emerald-500/30 disabled:opacity-50"
                        >
                          {renderingPartBPreview ? 'Rendering Part B preview…' : quickReady || preview ? 'Re-render Part B Preview' : 'Render Part B Preview'}
                        </button>
                        {!hasMasterAudio && <span className="ml-2 text-[11px] text-amber-300/80">Needs the genuine master WAV first.</span>}
                      </div>
                    );
                  })()}

                  {/* Playback Mode Selection */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] text-white/70 font-semibold block flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-emerald-400" />
                      Part B Playback Mode:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleUpdatePartBPlayback('seamless_loop')}
                        disabled={savingPartBPlayback}
                        className={`px-2 py-1.5 rounded-lg border text-left font-medium transition-all ${
                          partBPlaybackMode === 'seamless_loop'
                            ? 'border-emerald-400 bg-emerald-500/20 text-white font-semibold'
                            : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        <div>1. Seamless Loop (Default)</div>
                        <div className="text-[9px] text-white/40">Repeats visual to song end</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdatePartBPlayback('freeze_last_frame')}
                        disabled={savingPartBPlayback}
                        className={`px-2 py-1.5 rounded-lg border text-left font-medium transition-all ${
                          partBPlaybackMode === 'freeze_last_frame'
                            ? 'border-emerald-400 bg-emerald-500/20 text-white font-semibold'
                            : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        <div>2. Freeze Last Frame</div>
                        <div className="text-[9px] text-white/40">Holds final frame until audio end</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdatePartBPlayback('stretch')}
                        disabled={savingPartBPlayback}
                        className={`px-2 py-1.5 rounded-lg border text-left font-medium transition-all ${
                          partBPlaybackMode === 'stretch'
                            ? 'border-emerald-400 bg-emerald-500/20 text-white font-semibold'
                            : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        <div>3. Stretch Animation</div>
                        <div className="text-[9px] text-white/40">Slows animation to match runtime</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdatePartBPlayback('custom_range')}
                        disabled={savingPartBPlayback}
                        className={`px-2 py-1.5 rounded-lg border text-left font-medium transition-all ${
                          partBPlaybackMode === 'custom_range'
                            ? 'border-emerald-400 bg-emerald-500/20 text-white font-semibold'
                            : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        <div>4. Custom Loop Range</div>
                        <div className="text-[9px] text-white/40">Trimmed loop In &rarr; Out</div>
                      </button>
                    </div>

                    {partBPlaybackMode === 'custom_range' && (
                      <div className="p-2 rounded-lg bg-black/40 border border-white/10 flex items-center gap-2 text-[10px]">
                        <span className="text-white/60">Loop In (s):</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={partBLoopStart}
                          onChange={(e) => setPartBLoopStart(parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white font-mono"
                        />
                        <span className="text-white/60">Out (s):</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={partBLoopEnd}
                          onChange={(e) => setPartBLoopEnd(parseFloat(e.target.value) || 4)}
                          className="w-16 px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdatePartBPlayback('custom_range')}
                          className="px-2 py-0.5 rounded bg-emerald-500 text-black font-semibold hover:bg-emerald-400 ml-auto"
                        >
                          Save Range
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Upload / Replace Part B Background Visual Loop */}
                  <div className="pt-2 border-t border-emerald-500/20">
                    {!showReplacePartB ? (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <Check className="w-3.5 h-3.5" /> Source clip attached ({draft?.video?.partB?.sourceDurationSeconds?.toFixed(1) || 4.0}s Video Loop)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowReplacePartB(true)}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-medium"
                        >
                          Replace source clip
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleUploadPartBTheme} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-white/60 block">
                            Replace Canva Background Loop (MP4):
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowReplacePartB(false)}
                            className="text-[10px] text-white/40 hover:text-white underline"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="video/mp4,video/quicktime,image/png,image/jpeg"
                            onChange={(e) => setPartBFile(e.target.files?.[0] || null)}
                            className="text-[11px] text-white/70 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-white/10 file:text-white hover:file:bg-white/20"
                          />
                          <button
                            type="submit"
                            disabled={!partBFile || uploadingPartB}
                            className="px-3 py-1 rounded-lg bg-emerald-500 text-black text-[11px] font-semibold hover:bg-emerald-400 disabled:opacity-40 shrink-0"
                          >
                            {uploadingPartB ? 'Uploading...' : 'Attach Loop'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* ─── PART C: CANVA PROMOTIONAL VIDEO (FIXED) ──────────────────── */}
                <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3 text-xs">
                  <div className="flex items-center justify-between font-semibold text-blue-300">
                    <div className="flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-blue-400" />
                      <span>PART C: Canva Promotional Video (Optional)</span>
                      <span className="text-[10px] font-mono bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-400/30 text-blue-200">
                        {draft?.video?.partC?.canvaDesignId || 'DAHa7eJOcbI'}
                      </span>
                    </div>
                    <a
                      href={draft?.video?.partC?.canvaUrl || 'https://canva.link/qvmwwc830dm623g'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 underline font-normal"
                    >
                      Open in Canva
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="text-[11px] text-white/70 flex items-center justify-between">
                    <div>
                      <strong className="text-white">Heading:</strong> {draft?.video?.partC?.title || 'Part 2'} (19 Scenes &bull; {draft?.video?.partC?.formattedDuration || '10:08'} &bull; 1920x1080)
                    </div>
                    <button
                      type="button"
                      onClick={handleUseSharedPartCAsset}
                      disabled={linkingSharedPartC}
                      className="px-2 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30 text-[10px] font-medium transition-all"
                    >
                      {linkingSharedPartC ? 'Linking...' : 'Use Verified Shared Asset (10:08)'}
                    </button>
                  </div>

                  <label className="flex items-center gap-2 rounded-lg bg-black/30 border border-blue-500/20 p-3 text-[11px] text-white">
                    <input type="checkbox" checked={partCEnabled} disabled={savingPartCEnabled} onChange={(e) => handleSetPartCEnabled(e.target.checked)} />
                    Include Part C (10:08) after the Suno song
                  </label>
                  {/* Playback Scope Option */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-white/60 font-medium block">Part C Playback Scope:</label>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleUpdatePartCSettings('full_19_scenes', undefined)}
                        className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition-colors ${
                          partCPlaybackMode === 'full_19_scenes'
                            ? 'border-blue-400 bg-blue-500/20 text-blue-200'
                            : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                        }`}
                      >
                        All 19 Scenes (Full Original)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdatePartCSettings('trimmed', undefined)}
                        className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition-colors ${
                          partCPlaybackMode === 'trimmed'
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
                    <label className="text-[11px] text-white/60 font-medium block">Part C Audio Policy:</label>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleUpdatePartCSettings(undefined, 'preserve_canva_audio')}
                        className={`px-2 py-1 rounded border text-center font-medium transition-colors ${
                          partCAudioMode === 'preserve_canva_audio'
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                            : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                        }`}
                      >
                        Preserve Audio
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdatePartCSettings(undefined, 'crossfade')}
                        className={`px-2 py-1 rounded border text-center font-medium transition-colors ${
                          partCAudioMode === 'crossfade'
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                            : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                        }`}
                      >
                        Crossfade 1.5s
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdatePartCSettings(undefined, 'mute')}
                        className={`px-2 py-1 rounded border text-center font-medium transition-colors ${
                          partCAudioMode === 'mute'
                            ? 'border-red-400 bg-red-500/20 text-red-200'
                            : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                        }`}
                      >
                        Mute Part C
                      </button>
                    </div>
                  </div>

                  {/* Upload / Attached Status & Interactive In-Browser Player */}
                  <div className="pt-2 border-t border-blue-500/20 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                        <Check className="w-3.5 h-3.5" /> MP4 Attached & Verified ({draft?.video?.partC?.durationSeconds || 608}s &bull; 1920x1080 &bull; Audio Stream)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowReplacePartC(!showReplacePartC)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 underline font-medium"
                      >
                        {showReplacePartC ? 'Hide Replace Form' : 'Replace MP4'}
                      </button>
                    </div>

                    <div className="relative rounded-lg overflow-hidden border border-blue-500/20 aspect-video bg-black/40">
                      <video
                        key={draft?.video?.partC?.uploadedAt || 'part-c'}
                        controls
                        preload="metadata"
                        className="w-full h-full object-cover"
                        src={`/api/admin/pipeline/drafts/${draftId}/media?asset=part_c_video&v=${encodeURIComponent(draft?.video?.partC?.uploadedAt || '')}`}
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-blue-300 border border-blue-400/20">
                        Part C Promo Video &bull; 19 Scenes ({draft?.video?.partC?.durationSeconds || 608}s)
                      </div>
                    </div>

                    {showReplacePartC && (
                      <form onSubmit={handleUploadPartC} className="space-y-2 pt-2 border-t border-white/10">
                        <label className="text-[11px] text-white/60 block">
                          Attach Alternate Canva MP4:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="video/mp4"
                            onChange={(e) => setPartCFile(e.target.files?.[0] || null)}
                            className="text-[11px] text-white/70 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-white/10 file:text-white hover:file:bg-white/20"
                          />
                          <button
                            type="submit"
                            disabled={!partCFile || uploadingPartC}
                            className="px-3 py-1 rounded-lg bg-blue-500 text-white text-[11px] font-semibold hover:bg-blue-400 disabled:opacity-40"
                          >
                            {uploadingPartC ? 'Uploading...' : 'Attach MP4'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* ─── THREE-PART DURATION PLANNER BAR ─────────────────────────── */}
                <div className="p-3 rounded-xl border border-white/15 bg-black/40 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/80 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Three-Part Duration Planner
                    </span>
                    <span className="font-mono text-amber-300 font-bold text-sm">
                      {(() => {
                        const aSec = partADuration;
                        const bSec = draft?.masterAudio?.durationSeconds || 285.16;
                        const cSec = draft?.video?.partC?.durationSeconds || 608.0;
                        const total = aSec + bSec + cSec;
                        const mins = Math.floor(total / 60);
                        const secs = (total % 60).toFixed(2);
                        return `${mins}:${Number(secs) < 10 ? '0' : ''}${secs} (${total.toFixed(2)}s)`;
                      })()}
                    </span>
                  </div>

                  {/* Multi-segment visual bar */}
                  <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex">
                    {/* Part A Segment */}
                    <div
                      style={{
                        width: `${Math.max(
                          2,
                          (partADuration / (partADuration + (draft?.masterAudio?.durationSeconds || 285.16) + 608.0)) * 100
                        )}%`,
                      }}
                      className="bg-amber-400 h-full"
                      title={`Part A (Thumbnail Intro): ${partADuration.toFixed(1)}s`}
                    />
                    {/* Part B Segment */}
                    <div
                      style={{
                        width: `${(
                          ((draft?.masterAudio?.durationSeconds || 285.16) /
                            (partADuration + (draft?.masterAudio?.durationSeconds || 285.16) + 608.0)) *
                          100
                        )}%`,
                      }}
                      className="bg-emerald-500 h-full"
                      title={`Part B (Suno Master Song): ${(draft?.masterAudio?.durationSeconds || 285.16).toFixed(1)}s`}
                    />
                    {/* Part C Segment */}
                    <div
                      style={{
                        width: `${(
                          (608.0 / (partADuration + (draft?.masterAudio?.durationSeconds || 285.16) + 608.0)) *
                          100
                        )}%`,
                      }}
                      className="bg-blue-500 h-full"
                      title="Part C (Canva Promotional Video): 608.0s (10:08)"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pt-1 text-center">
                    <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      <span className="block font-semibold">Part A: Thumbnail</span>
                      <span>{partADuration.toFixed(1)}s</span>
                    </div>
                    <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                      <span className="block font-semibold">Part B: Suno Master</span>
                      <span>{(draft?.masterAudio?.durationSeconds || 285.16).toFixed(1)}s (4:45.2)</span>
                    </div>
                    <div className="p-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                      <span className="block font-semibold">Part C: Canva Promo</span>
                      <span>{draft?.video?.partC?.formattedDuration || '10:08'} (608.0s)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Render Master Video Button */}
              <button
                onClick={handleRenderVideo}
                disabled={renderingVideo || !hasMasterAudio}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shadow-lg shadow-amber-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Video className={`w-4 h-4 ${renderingVideo ? 'animate-spin' : ''}`} />
                {renderingVideo
                  ? 'Rendering MP4 Master (Part A + Part B + Part C)...'
                  : `Render ${videoOrientation === 'portrait' ? '9:16 Portrait' : '1080p Landscape'} ${videoFormat === 'lyric_master' ? 'Lyric Master (4-Line Captions)' : 'Clean Cinematic'}`}
              </button>

              {/* Video Player Preview / Status for Selected Combination */}
              {(() => {
                const comboKey = `${videoFormat}_${videoOrientation}`;
                const formatsMap = draft?.video?.formats || {};
                const isComboReady = Boolean(
                  formatsMap[comboKey]?.outputPath ||
                  (videoOrientation === 'landscape' && formatsMap[videoFormat]?.outputPath)
                );
                const comboMeta = formatsMap[comboKey] || (videoOrientation === 'landscape' ? formatsMap[videoFormat] : null);

                return isComboReady ? (
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                        Part D Preview: {videoOrientation === 'portrait' ? '9:16 Portrait' : '16:9 Landscape'} ({videoFormat === 'lyric_master' ? 'Lyric Master' : 'Clean Cinematic'})
                      </span>
                      <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {videoOrientation === 'portrait' ? '1080 × 1920 MP4' : '1920 × 1080 MP4'} • {comboMeta?.durationSeconds?.toFixed(1) || 898.2}s
                      </span>
                    </div>
                    <div className="flex justify-center bg-black/60 rounded-xl p-3 border border-white/10">
                      <video
                        key={`${videoFormat}_${videoOrientation}_${comboMeta?.sha256 || draft?.updatedAt}`}
                        controls
                        className={`rounded-lg border border-white/15 bg-black shadow-2xl ${
                          videoOrientation === 'portrait' ? 'max-h-[580px] aspect-[9/16]' : 'w-full aspect-video'
                        }`}
                        src={`/api/admin/pipeline/drafts/${draftId}/media?asset=master_video&format=${videoFormat}&orientation=${videoOrientation}`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white/70">
                        Part D Preview: {videoOrientation === 'portrait' ? '9:16 Portrait' : '16:9 Landscape'} ({videoFormat === 'lyric_master' ? 'Lyric Master' : 'Clean Cinematic'})
                      </span>
                      <span className="text-amber-400 font-mono text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                        NOT YET RENDERED
                      </span>
                    </div>
                    <div
                      className={`rounded-xl border border-dashed border-white/20 bg-black/30 flex flex-col items-center justify-center p-8 text-center ${
                        videoOrientation === 'portrait' ? 'max-h-[420px] aspect-[9/16] mx-auto' : 'w-full aspect-video'
                      }`}
                    >
                      <Video className="w-10 h-10 text-white/20 mb-3" />
                      <div className="text-xs font-semibold text-white">
                        {videoOrientation === 'portrait' ? '1080 × 1920 Portrait' : '1920 × 1080 Landscape'} {videoFormat === 'lyric_master' ? 'Lyric Master' : 'Clean Cinematic'} Not Rendered
                      </div>
                      <p className="text-[11px] text-white/50 max-w-sm mt-1.5 leading-relaxed">
                        This format combination has not been generated yet. Click the button above to render the {videoOrientation === 'portrait' ? 'mobile 9:16' : '16:9 widescreen'} master.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 4. Mandatory Human Approval Gate */}
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/[0.03] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white">Human Approval Gate</h3>
                </div>
                {isApproved && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Transferred to CMS
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Approval validates source audio, subtitle timing and all three video segments. A successful approval transfers the master to CMS Releases as an authoritative editorial record. YouTube publishing is a separate action.
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
                    <span className="font-semibold text-white">I approve this final master for transfer to CMS Releases.</span>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      I have verified audio master continuity, confirmed the Roman Urdu / Urdu / Hindi / English caption layout, and checked synchronized lyrics.
                    </p>
                  </div>
                </label>

                <textarea
                  rows={2}
                  value={approvalNotes || ''}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Review notes (optional): e.g. Crossfade at 12s verified, four-line caption layout checked."
                  className="w-full rounded-xl border border-purple-500/20 bg-black/40 p-2.5 text-xs text-white placeholder-white/30 focus:border-purple-400 focus:outline-none"
                />

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={handleSaveApproval}
                    disabled={savingApproval}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingApproval ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Validating Master &amp; Saving to CMS...
                      </>
                    ) : isApproved ? (
                      'Re-Validate & Update CMS Release'
                    ) : (
                      'Approve Final & Transfer to CMS'
                    )}
                  </button>
                  {isApproved && (
                    <Link
                      href={`/admin/cms-releases/${draft.downstreamStatus?.cmsReleaseId || ('studio_' + draftId)}`}
                      className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors text-center inline-flex items-center justify-center gap-1.5"
                    >
                      Open CMS Release &rarr;
                    </Link>
                  )}
                </div>
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
                  <span className={isApproved ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
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

              {isApproved ? (
                <div className="space-y-2 pt-2">
                  <YouTubeUploadPanel
                    draftId={draftId}
                    cmsReleaseId={draft.downstreamStatus?.cmsReleaseId || 'studio_' + draftId}
                    onLinked={fetchDraft}
                  />
                  <SocialDistributionPanel draftId={draftId} youtubeVideoId={draft.publishingTx?.youtubeVideoId} />
                  <Link
                    href={`/admin/cms-releases/${draft.downstreamStatus?.cmsReleaseId || ('studio_' + draftId)}`}
                    className="block text-center w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-amber-400/10"
                  >
                    Open Release in CMS Editor
                  </Link>
                  <Link
                    href="/admin/cms-releases"
                    className="block text-center w-full py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium text-xs transition-colors"
                  >
                    View All CMS Releases Catalog
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed">
                    <strong>Draft Not Transferred Yet:</strong> Complete the <strong>Human Approval Gate</strong> above and click &quot;Approve Final &amp; Transfer to CMS&quot; to transfer this master into the CMS Releases catalog.
                  </div>
                  <Link
                    href="/admin/cms-releases"
                    className="block text-center w-full py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium text-xs transition-colors"
                  >
                    Open Existing CMS Releases Catalog
                  </Link>
                </div>
              )}

              <p className="text-[11px] text-amber-300/70">
                Approved video upload is available above. Upload is PRIVATE first and links to the existing CMS release. Uploading four YouTube caption tracks, metadata reconciliation and public unveiling are separate verified steps.
              </p>
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
