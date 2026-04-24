"use client";

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import JSZip from 'jszip';
import type { CMSRelease } from '@/lib/cms-storage';

import {
  type SubtitleStatus,
  type LyricsSectionType,
  type ASSStylePack,
  LYRICS_SECTION_TYPES,
  ALL_LANGUAGES,
  DEFAULT_STYLE_NAME,
  DEFAULT_STYLE_PACK,
} from './release-constants';
import {
  assColorToHex,
  normalizeHexColor,
  assColorToRgba,
  resolvePreviewAnchor,
  getAlignmentLabel,
  normalizeCueTime,
  cueTimeToSeconds,
  secondsToCueTime,
  formatPreviewSeconds,
  triggerBlobDownload,
  extractFilenameFromDisposition,
  parseSubtitleFile,
  parseAssFile,
  parseAssStyles,
} from './subtitle-utils';
import { ReleaseFeaturesSection, ReleaseMediaInfoSection } from './components';
import { DeliveryPanelSection } from './delivery-panel-section';
import { ReviewLogSection } from './review-log-section';
import { SubtitleCueListSection } from './subtitle-cue-list-section';
import { LiveAssPreviewSection } from './live-ass-preview-section';
import { SubtitleBulkControlsSection } from './subtitle-bulk-controls-section';
import { WorkflowAssistantSection } from './workflow-assistant-section';

type DeliveryState = 'web_only' | 'synced_to_youtube' | 'manual_upload_pending' | 'manual_upload_completed' | 'sync_failed';

type CaptionTrackMeta = {
  captionId?: string;
  language?: string;
  lastSyncHash?: string;
  lastSyncAttemptAt?: string;
  lastUploadedAt?: string;
  lastExportedAt?: string;
  lastFormat?: 'srt' | 'vtt';
  lastStatus?: 'synced' | 'unchanged' | 'failed';
  deliveryState?: DeliveryState;
  manualUploadActor?: string;
  manualUploadAt?: string;
  manualUploadNotes?: string;
  lastError?: string;
};

type ContentReadinessState = 'draft' | 'editorial_ready' | 'web_published' | 'youtube_delivery_in_progress' | 'fully_delivered' | 'delivery_attention_required';
const CARRY_FORWARD_STORAGE_KEY = 'cms_release_editor_carry_forward_v1';

export default function EditReleasePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const [form, setForm] = useState<Partial<CMSRelease>>({
    title: '',
    slug: '',
    youtubeId: '',
    youtubeChannelId: '',
    youtubeChannelUrl: '',
    description: '',
    releaseDate: new Date().toISOString().split('T')[0],
    durationSeconds: 0,
    durationFormatted: '0:00',
    viewCount: 0,
    likeCount: 0,
    status: 'draft',
    contentReadinessState: 'draft',
    enableLyrics: true,
    enableCommentary: true,
    enableSponsors: false,
    enableAdoption: true,
    enableCredits: true,
    publicCommentary: [
      {
        id: 'context',
        title: 'Historical Context',
        content: '',
        isPublished: true,
      },
      {
        id: 'theme',
        title: 'Thematic Interpretation',
        content: '',
        isPublished: true,
      },
    ],
    publicSponsorsIntro: '',
    publicSponsors: [],
    publicCredits: {
      artistic: {
        leadVocalist: '',
        lyricist: '',
        composer: '',
        musicProducer: '',
        backgroundVocals: '',
      },
      production: {
        recordedAt: '',
        recordingEngineer: '',
        mixMaster: '',
        soundDesign: '',
      },
      visual: {
        videoDirection: '',
        editing: '',
        thumbnailDesign: '',
        artwork: '',
      },
      literary: {
        romanTransliteration: '',
        englishTranslation: '',
        thematicInterpretation: '',
        proofreading: '',
      },
      rights: {
        publishedBy: '',
        platform: '',
        registeredReleaseId: '',
        releaseDateText: '',
        copyrightHolder: '',
        licensingText: '',
        licensingUrl: '',
      },
    },
    availableLanguages: ['en', 'ur', 'ar', 'fa', 'hi', 'pa', 'tr', 'sd', 'skr', 'bal', 'ps', 'ks', 'bn', 'gu', 'mr', 'ta', 'en-rom'],
    defaultLanguage: 'en',
    lyrics: {},
    lyricsStructure: {},
    masterTimingVersion: 1,
    subtitleCues: [],
    subtitleTranslations: {},
    subtitleLanguageStatuses: {},
    subtitleLanguageAssignments: {},
    subtitleStylePacks: {
      [DEFAULT_STYLE_NAME]: { ...DEFAULT_STYLE_PACK },
    },
    subtitleReviewLogs: [],
    youtubeSubtitleAutoSync: true,
    youtubeCaptionTracks: {},
  });
  const [selectedSubtitleLanguage, setSelectedSubtitleLanguage] = useState('en');
  const [selectedLyricsStructureLanguage, setSelectedLyricsStructureLanguage] = useState('en');
  const [referenceLanguage, setReferenceLanguage] = useState('en');
  const [sideBySideMode, setSideBySideMode] = useState(true);
  const [selectedStyleName, setSelectedStyleName] = useState(DEFAULT_STYLE_NAME);
  const [previewCueId, setPreviewCueId] = useState<string | null>(null);
  const [previewPanelPosition, setPreviewPanelPosition] = useState({ x: 50, y: 84 });
  const [previewInfoPosition, setPreviewInfoPosition] = useState({ x: 8, y: 9 });
  const [previewInfoWidth, setPreviewInfoWidth] = useState(420);
  const [previewCanvasWidth, setPreviewCanvasWidth] = useState(0);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [lockAllCuePositions, setLockAllCuePositions] = useState(false);
  const [previewYouTubeReady, setPreviewYouTubeReady] = useState(false);
  const [previewVideoDuration, setPreviewVideoDuration] = useState<number | null>(null);
  const [previewOrigin, setPreviewOrigin] = useState('');
  const [showSafeGuides, setShowSafeGuides] = useState(true);
  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const previewYouTubeIframeRef = useRef<HTMLIFrameElement>(null);
  const [reviewActor, setReviewActor] = useState('Editorial Admin');
  const [reviewComment, setReviewComment] = useState('');
  const [manualUploadActor, setManualUploadActor] = useState('Editorial Admin');
  const [manualUploadNotes, setManualUploadNotes] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);
  const [youtubeSyncing, setYoutubeSyncing] = useState(false);
  const [originalForm, setOriginalForm] = useState<Partial<CMSRelease> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [slugAutoGenerated, setSlugAutoGenerated] = useState(true);
  const [youtubeIntegrationStatus, setYoutubeIntegrationStatus] = useState<{
    configured: boolean;
    missing: string[];
    message?: string;
  } | null>(null);
  const [fetchedYouTubeChannel, setFetchedYouTubeChannel] = useState<{
    channelId: string;
    channelTitle?: string;
    channelUrl: string;
  } | null>(null);
  const [youtubeChannelLookupLoading, setYoutubeChannelLookupLoading] = useState(false);
  const [carryForwardNotice, setCarryForwardNotice] = useState<string | null>(null);
  const carryForwardInitRef = useRef(false);

  // Language management
  const [customLangCode, setCustomLangCode] = useState('');
  const [customLangLabel, setCustomLangLabel] = useState('');
  const [lyricsPlaceholderOpen, setLyricsPlaceholderOpen] = useState(false);
  const [lyricsPlaceholderDraft, setLyricsPlaceholderDraft] = useState('');
  const [lyricsPlaceholderNote, setLyricsPlaceholderNote] = useState<string | null>(null);
  const [lyricsPlaceholderScope, setLyricsPlaceholderScope] = useState<'all' | 'published' | 'single'>('all');
  const [lyricsPlaceholderBlockId, setLyricsPlaceholderBlockId] = useState('');
  const [lyricsPlaceholderSyncLineRef, setLyricsPlaceholderSyncLineRef] = useState(true);
  const [autoAdvanceAfterStamp, setAutoAdvanceAfterStamp] = useState(true);
  const [expandedWorkflowStepId, setExpandedWorkflowStepId] = useState<string | null>(null);
  const [editingLangCode, setEditingLangCode] = useState<string | null>(null);
  const [editingLangNewLabel, setEditingLangNewLabel] = useState('');
  const [autoTranslatingLang, setAutoTranslatingLang] = useState<string | null>(null);
  
  // Undo/Redo
  const [history, setHistory] = useState<Partial<CMSRelease>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Bulk operations
  const [selectedCueIds, setSelectedCueIds] = useState<Set<string>>(new Set());
  const [shiftTimingOffset, setShiftTimingOffset] = useState(0);
  const [bulkKaraokeEffect, setBulkKaraokeEffect] = useState<'none' | 'k' | 'kf' | 'ko'>('kf');
  const [bulkKaraokeDurationsMs, setBulkKaraokeDurationsMs] = useState('');
  const SAMPLE_PREVIEW_DURATION_SECONDS = 8;
  
  // Timeline scrubbing
  const timelineRef = useRef<HTMLDivElement>(null);

  // Live ref — always holds latest form + lock state for drag callbacks (avoids stale closure)
  const liveRef = useRef({ form, lockAllCuePositions: false });

  // Detect unsaved changes
  const hasUnsavedChanges = originalForm && JSON.stringify(form) !== JSON.stringify(originalForm);

  // Keep liveRef in sync every render
  liveRef.current = { form, lockAllCuePositions };

  // Auto-save to localStorage
  useEffect(() => {
    if (!isNew && form.id && Object.keys(form).length > 1) {
      const autoSaveKey = `cms_autosave_${form.id}`;
      const timer = setTimeout(() => {
        localStorage.setItem(autoSaveKey, JSON.stringify(form));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [form, isNew]);

  // Undo/Redo functionality
  const addToHistory = (newForm: Partial<CMSRelease>) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newForm)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setForm(JSON.parse(JSON.stringify(history[newIndex])));
      setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setForm(JSON.parse(JSON.stringify(history[newIndex])));
      setHistoryIndex(newIndex);
    }
  };

  // Bulk cue operations
  const duplicateSelectedCues = () => {
    if (selectedCueIds.size === 0) {
      setErrorMessage('No cues selected');
      return;
    }

    const cueList = form.subtitleCues || [];
    const selectedCues = cueList.filter(c => selectedCueIds.has(c.id));
    const newCues = selectedCues.map((cue, idx) => ({
      ...cue,
      id: `cue_${Date.now()}_dup_${idx}`,
      endTime: String(Number(cue.endTime) + 0.5),
    }));

    const updatedCues = [...cueList, ...newCues];
    const updatedForm = { ...form, subtitleCues: updatedCues };
    setForm(updatedForm);
    addToHistory(updatedForm);
    setSuccessMessage(`Duplicated ${selectedCueIds.size} cues`);
  };

  const deletSelectedCues = () => {
    if (selectedCueIds.size === 0) {
      setErrorMessage('No cues selected');
      return;
    }

    const updatedCues = (form.subtitleCues || []).filter(c => !selectedCueIds.has(c.id));
    const updatedForm = { ...form, subtitleCues: updatedCues };
    setForm(updatedForm);
    addToHistory(updatedForm);
    setSelectedCueIds(new Set());
    setSuccessMessage(`Deleted ${selectedCueIds.size} cues`);
  };

  const deleteAllCues = () => {
    if (!confirm('Delete all cues? This cannot be undone.')) return;
    const updatedForm = { ...form, subtitleCues: [], subtitleTranslations: {} };
    setForm(updatedForm);
    addToHistory(updatedForm);
    setSelectedCueIds(new Set());
    setPreviewCueId(null);
    setSuccessMessage('Deleted all cues');
  };

  const shiftAllCueTiming = () => {
    if (shiftTimingOffset === 0) {
      setErrorMessage('Enter a time offset (in seconds)');
      return;
    }

    const MIN_CUE_DURATION_SECONDS = 0.2;
    let clampedToZeroCount = 0;
    let minDurationAdjustedCount = 0;
    let overlapAdjustedCount = 0;
    let previousEnd = 0;

    const updated = (form.subtitleCues || []).map((cue) => {
      const shiftedStart = cueTimeToSeconds(cue.startTime) + shiftTimingOffset;
      const shiftedEnd = cueTimeToSeconds(cue.endTime) + shiftTimingOffset;

      let start = shiftedStart;
      let end = shiftedEnd;

      if (start < 0) {
        start = 0;
        clampedToZeroCount += 1;
      }

      if (end < 0) {
        end = 0;
        clampedToZeroCount += 1;
      }

      if (end <= start) {
        end = start + MIN_CUE_DURATION_SECONDS;
        minDurationAdjustedCount += 1;
      }

      if (start < previousEnd) {
        start = previousEnd;
        end = Math.max(end, start + MIN_CUE_DURATION_SECONDS);
        overlapAdjustedCount += 1;
      }

      previousEnd = end;

      return {
        ...cue,
        startTime: secondsToCueTime(start),
        endTime: secondsToCueTime(end),
      };
    });

    const updatedForm = { ...form, subtitleCues: updated };
    setForm(updatedForm);
    addToHistory(updatedForm);
    setShiftTimingOffset(0);

    const notes: string[] = [];
    if (clampedToZeroCount > 0) {
      notes.push(`Warning: ${clampedToZeroCount} timestamp${clampedToZeroCount === 1 ? '' : 's'} clamped to 0.`);
    }
    if (minDurationAdjustedCount > 0) {
      notes.push(`${minDurationAdjustedCount} cue${minDurationAdjustedCount === 1 ? '' : 's'} stretched to minimum duration.`);
    }
    if (overlapAdjustedCount > 0) {
      notes.push(`${overlapAdjustedCount} cue${overlapAdjustedCount === 1 ? '' : 's'} shifted forward to avoid overlap.`);
    }

    setSuccessMessage(
      notes.length > 0
        ? `Shifted all cues by ${shiftTimingOffset}s\n${notes.join(' ')}`
        : `Shifted all cues by ${shiftTimingOffset}s`
    );
  };

  const applyKaraokeToAllCues = () => {
    const cueCount = (form.subtitleCues || []).length;
    if (!cueCount) {
      setErrorMessage('No cues available for karaoke batch update.');
      return;
    }

    const patch: Record<string, any> = {
      karaokeEffect: bulkKaraokeEffect,
      karaokeDurationsMs: bulkKaraokeEffect === 'none' ? '' : bulkKaraokeDurationsMs.trim(),
    };

    applyCueMetadataToAllCues(patch, {
      successMessage:
        bulkKaraokeEffect === 'none'
          ? `Cleared karaoke effect on ${cueCount} cue${cueCount === 1 ? '' : 's'}.`
          : `Applied ${bulkKaraokeEffect.toUpperCase()} karaoke effect to ${cueCount} cue${cueCount === 1 ? '' : 's'}.`,
    });
  };

  // Timeline scrubbing
  const scrubTimelineAtClientX = (clientX: number, duration: number) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    if (!rect.width) return;

    const percentage = (clientX - rect.left) / rect.width;
    const clampedPercent = Math.max(0, Math.min(1, percentage));
    const safeDuration = Math.max(0, Number(duration || 0));
    const newTime = Number((clampedPercent * safeDuration).toFixed(3));
    setPreviewTime(newTime);

    const youtubeId = String(form.youtubeId || '').trim();
    const hasYouTubePreview = /^[A-Za-z0-9_-]{11}$/.test(youtubeId);
    if (hasYouTubePreview) {
      sendPreviewYouTubeCommand('seekTo', [newTime, true]);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>, duration: number) => {
    scrubTimelineAtClientX(e.clientX, duration);
  };

  const handleTimelinePointerDown = (e: React.PointerEvent<HTMLDivElement>, duration: number) => {
    e.preventDefault();
    scrubTimelineAtClientX(e.clientX, duration);

    const move = (pointerEvent: PointerEvent) => scrubTimelineAtClientX(pointerEvent.clientX, duration);
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPreviewOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!isNew || carryForwardInitRef.current) return;
    carryForwardInitRef.current = true;

    const { formData, applied } = applyCarryForwardDefaults(form);
    if (applied > 0) {
      setForm(formData);
      setCarryForwardNotice(`Auto-applied ${applied} reusable default field${applied === 1 ? '' : 's'} from your last saved release.`);
    }
  }, [isNew]);

  useEffect(() => {
    const youtubeId = String(form.youtubeId || '').trim();
    if (!/^[A-Za-z0-9_-]{11}$/.test(youtubeId)) {
      setFetchedYouTubeChannel(null);
      setYoutubeChannelLookupLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setYoutubeChannelLookupLoading(true);
        const res = await fetch(`/api/youtube/video-metadata?youtubeId=${encodeURIComponent(youtubeId)}`);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok || !data?.channelId) {
          setFetchedYouTubeChannel(null);
          return;
        }

        setFetchedYouTubeChannel({
          channelId: String(data.channelId || ''),
          channelTitle: String(data.channelTitle || ''),
          channelUrl: String(data.channelUrl || ''),
        });
      } catch {
        if (!cancelled) {
          setFetchedYouTubeChannel(null);
        }
      } finally {
        if (!cancelled) {
          setYoutubeChannelLookupLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.youtubeId]);

  useEffect(() => {
    if (!fetchedYouTubeChannel) return;

    setForm((prev) => {
      const next = { ...prev };
      let changed = false;

      if (!String(prev.youtubeChannelId || '').trim() && fetchedYouTubeChannel.channelId) {
        next.youtubeChannelId = fetchedYouTubeChannel.channelId;
        changed = true;
      }

      if (!String(prev.youtubeChannelUrl || '').trim() && fetchedYouTubeChannel.channelUrl) {
        next.youtubeChannelUrl = fetchedYouTubeChannel.channelUrl;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [fetchedYouTubeChannel]);

  const applyFetchedChannelDefaults = () => {
    if (!fetchedYouTubeChannel) {
      setErrorMessage('No fetched YouTube channel metadata available for this video yet.');
      return;
    }

    setForm({
      ...form,
      youtubeChannelId: fetchedYouTubeChannel.channelId || form.youtubeChannelId || '',
      youtubeChannelUrl: fetchedYouTubeChannel.channelUrl || form.youtubeChannelUrl || '',
    });
    setSuccessMessage(`Applied fetched channel defaults${fetchedYouTubeChannel.channelTitle ? ` (${fetchedYouTubeChannel.channelTitle})` : ''}.`);
  };

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const syncWidth = () => {
      const rect = canvas.getBoundingClientRect();
      setPreviewCanvasWidth(rect.width || 0);
    };

    syncWidth();

    const observer = new ResizeObserver(() => syncWidth());
    observer.observe(canvas);
    window.addEventListener('resize', syncWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncWidth);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges) {
          const form = document.querySelector('form');
          form?.dispatchEvent(new Event('submit', { bubbles: true }));
        }
      }
      // Ctrl+Z / Cmd+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Shift+Z / Cmd+Shift+Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      // Ctrl+Y / Cmd+Y: Redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      // Ctrl+E / Cmd+E: Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (!isNew) {
          exportAllSubtitlesZip();
        }
      }
      // Ctrl+N / Cmd+N: New Release
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        router.push('/admin/cms-releases/new');
      }

      // --- Subtitle / Lip-Sync Shortcuts ---
      // Ignore if focus is in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // [ : Stamp Start
      if (e.key === '[') {
        e.preventDefault();
        const stampBtn = document.querySelector('button[title*="Set cue START"]') as HTMLButtonElement;
        stampBtn?.click();
      }
      // ] : Stamp End
      if (e.key === ']') {
        e.preventDefault();
        const stampBtn = document.querySelector('button[title*="Set cue END"]') as HTMLButtonElement;
        stampBtn?.click();
      }
      // Space : Play/Pause
      if (e.key === ' ') {
        e.preventDefault();
        const playBtn = document.querySelector('button[className*="dashboard-btn-secondary"][onClick*="sendPreviewYouTubeCommand"]') as HTMLButtonElement;
        // The above selector might be fragile, let's use a more reliable way if possible.
        // Actually, since we are in the parent, we can just toggle the state.
        setPreviewPlaying(prev => {
          const next = !prev;
          if (/^[A-Za-z0-9_-]{11}$/.test(String(form.youtubeId || ''))) {
            sendPreviewYouTubeCommand(next ? 'playVideo' : 'pauseVideo');
          }
          return next;
        });
      }
      // Arrows : Seek
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const direction = e.key === 'ArrowLeft' ? -1 : 1;
        const amount = e.ctrlKey ? 0.05 : e.shiftKey ? 5 : 1;
        const newTime = Math.max(0, previewTime + (direction * amount));
        setPreviewTime(newTime);
        if (/^[A-Za-z0-9_-]{11}$/.test(String(form.youtubeId || ''))) {
          sendPreviewYouTubeCommand('seekTo', [newTime, true]);
        }
      }
      // Alt + Arrows : Next/Prev Cue
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const cues = form.subtitleCues || [];
        const currentIndex = cues.findIndex(c => c.id === previewCueId);
        if (currentIndex === -1) return;

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          if (currentIndex < cues.length - 1) setPreviewCueId(cues[currentIndex + 1].id);
        } else {
          if (currentIndex > 0) setPreviewCueId(cues[currentIndex - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, isNew, previewTime, previewCueId, form.subtitleCues, form.youtubeId]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!user?.role.includes('admin')) {
      router.push('/admin');
      return;
    }

    if (!isNew && params.id) {
      loadRelease();
    }
  }, [user, params.id, isNew]);

  useEffect(() => {
    const checkIntegration = async () => {
      try {
        const response = await fetch('/api/integrations/youtube-status');
        const data = await response.json();
        if (response.ok) {
          setYoutubeIntegrationStatus({
            configured: Boolean(data?.configured),
            missing: Array.isArray(data?.missing) ? data.missing : [],
            message: data?.message,
          });
        }
      } catch {
        // Keep null state; sync endpoint will still return explicit errors.
      }
    };

    if (!isNew) {
      void checkIntegration();
    }
  }, [isNew]);

  const applyCarryForwardDefaults = (baseForm: Partial<CMSRelease>) => {
    try {
      const carryForwardRaw = typeof window !== 'undefined' ? localStorage.getItem(CARRY_FORWARD_STORAGE_KEY) : null;
      const carryForward = carryForwardRaw ? JSON.parse(carryForwardRaw) : null;
      if (!carryForward || typeof carryForward !== 'object') {
        return { formData: baseForm, applied: 0 };
      }

      const formData: Partial<CMSRelease> = { ...baseForm };
      let applied = 0;

      if (!String(formData.youtubeChannelId || '').trim() && String(carryForward.youtubeChannelId || '').trim()) {
        formData.youtubeChannelId = String(carryForward.youtubeChannelId);
        applied += 1;
      }

      if (!String(formData.youtubeChannelUrl || '').trim() && String(carryForward.youtubeChannelUrl || '').trim()) {
        formData.youtubeChannelUrl = String(carryForward.youtubeChannelUrl);
        applied += 1;
      }

      const currentCredits = (formData.publicCredits || {}) as Record<string, any>;
      const defaultCredits = (carryForward.publicCredits || {}) as Record<string, any>;
      const mergedCredits: Record<string, any> = { ...currentCredits };

      ['artistic', 'production', 'visual', 'literary', 'rights'].forEach((section) => {
        const sectionCurrent = { ...(currentCredits[section] || {}) };
        const sectionDefaults = { ...(defaultCredits[section] || {}) };

        Object.keys(sectionDefaults).forEach((field) => {
          const currentValue = String(sectionCurrent[field] || '').trim();
          const fallbackValue = String(sectionDefaults[field] || '').trim();
          if (!currentValue && fallbackValue) {
            sectionCurrent[field] = sectionDefaults[field];
            applied += 1;
          }
        });

        mergedCredits[section] = sectionCurrent;
      });

      formData.publicCredits = mergedCredits as any;
      return { formData, applied };
    } catch {
      return { formData: baseForm, applied: 0 };
    }
  };

  const applyCarryForwardToCurrentForm = () => {
    const { formData, applied } = applyCarryForwardDefaults(form);
    if (applied === 0) {
      setSuccessMessage('No reusable defaults were applied. Save a previous release first or clear fields you want auto-filled.');
      return;
    }

    setForm(formData);
    setCarryForwardNotice(`Applied ${applied} reusable default field${applied === 1 ? '' : 's'} from your last saved release.`);
    setSuccessMessage(`Applied ${applied} reusable default field${applied === 1 ? '' : 's'} from previous release defaults.`);
  };

  const loadRelease = async () => {
    try {
      const res = await fetch(`/api/releases/${params.id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const formData = {
          ...data,
          subtitleCues: data.subtitleCues || [],
          subtitleTranslations: data.subtitleTranslations || {},
          subtitleLanguageStatuses: data.subtitleLanguageStatuses || {},
          subtitleLanguageAssignments: data.subtitleLanguageAssignments || {},
          subtitleStylePacks: Object.keys(data.subtitleStylePacks || {}).length
            ? data.subtitleStylePacks
            : { [DEFAULT_STYLE_NAME]: { ...DEFAULT_STYLE_PACK } },
          subtitleReviewLogs: data.subtitleReviewLogs || [],
          youtubeSubtitleAutoSync: data.youtubeSubtitleAutoSync !== false,
          youtubeCaptionTracks: data.youtubeCaptionTracks || {},
          contentReadinessState: data.contentReadinessState || 'draft',
          masterTimingVersion: data.masterTimingVersion || 1,
          publicCommentary: Array.isArray(data.publicCommentary)
            ? data.publicCommentary
            : [
                { id: 'context', title: 'Historical Context', content: '', isPublished: true },
                { id: 'theme', title: 'Thematic Interpretation', content: '', isPublished: true },
              ],
          publicSponsorsIntro: data.publicSponsorsIntro || '',
          publicSponsors: Array.isArray(data.publicSponsors) ? data.publicSponsors : [],
          publicCredits: data.publicCredits || {
            artistic: {},
            production: {},
            visual: {},
            literary: {},
            rights: {},
          },
          lyricsStructure: data.lyricsStructure || {},
        };

        const existingBackgroundVocals = String((formData.publicCredits as any)?.artistic?.backgroundVocals || '').trim();
        if (!existingBackgroundVocals && Array.isArray(data.chorusVocalists) && data.chorusVocalists.length > 0) {
          formData.publicCredits = {
            ...(formData.publicCredits || {}),
            artistic: {
              ...((formData.publicCredits as any)?.artistic || {}),
              backgroundVocals: data.chorusVocalists.join(', '),
            },
          } as any;
        }

        setForm(formData);
        setOriginalForm(formData);
        const trackNotes: Record<string, string> = {};
        Object.entries((formData.youtubeCaptionTracks || {}) as Record<string, any>).forEach(([language, meta]) => {
          trackNotes[language] = String(meta?.manualUploadNotes || '');
        });
        setManualUploadNotes(trackNotes);
        setSelectedSubtitleLanguage(data.defaultLanguage || 'en');
        setSelectedLyricsStructureLanguage(data.defaultLanguage || 'en');
        setReferenceLanguage(data.defaultLanguage || 'en');
        setSelectedStyleName(Object.keys(data.subtitleStylePacks || {})[0] || DEFAULT_STYLE_NAME);
        setPreviewCueId(data.subtitleCues?.[0]?.id || null);
        setCarryForwardNotice(null);
      }
    } catch (error) {
      console.error('Failed to load release:', error);
      setErrorMessage('Failed to load release. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const updated: Partial<CMSRelease> = {
      ...form,
      [name]: type === 'number' ? parseInt(value) : value,
    };
    if (name === 'status') {
      if (value === 'draft') updated.contentReadinessState = 'draft';
      if (value === 'approved' || value === 'in_review') updated.contentReadinessState = 'editorial_ready';
      if (value === 'published' && !updated.contentReadinessState) updated.contentReadinessState = 'web_published';
    }
    // Auto-generate slug from title when slug hasn't been manually edited
    if (name === 'title' && slugAutoGenerated) {
      updated.slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    // Mark slug as manually edited when user types in slug field
    if (name === 'slug') {
      setSlugAutoGenerated(false);
    }
    // Clear per-field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }
    setForm(updated);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm({
      ...form,
      [name]: checked,
    });
  };

  const generateSlug = () => {
    const slug = (form.title || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setForm({ ...form, slug });
    setSlugAutoGenerated(false);
  };

  // Extract YouTube ID from full URL or plain ID
  const extractYouTubeId = (input: string): string => {
    const trimmed = input.trim();
    // Full URL patterns: watch?v=, youtu.be/, embed/, shorts/
    const patterns = [
      /[?&]v=([A-Za-z0-9_-]{11})/,
      /youtu\.be\/([A-Za-z0-9_-]{11})/,
      /embed\/([A-Za-z0-9_-]{11})/,
      /shorts\/([A-Za-z0-9_-]{11})/,
    ];
    for (const re of patterns) {
      const m = trimmed.match(re);
      if (m) return m[1];
    }
    // Already an 11-char ID
    if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
    return trimmed;
  };

  const handleYouTubePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    const extracted = extractYouTubeId(pasted);
    if (extracted !== pasted.trim()) {
      e.preventDefault();
      setForm((prev) => ({ ...prev, youtubeId: extracted }));
      setFieldErrors((prev) => { const n = { ...prev }; delete n.youtubeId; return n; });
    }
  };

  const updatePublicCommentary = (index: number, key: 'title' | 'content' | 'isPublished', value: string | boolean) => {
    const next = [...(form.publicCommentary || [])];
    if (!next[index]) return;
    next[index] = { ...next[index], [key]: value };
    setForm({ ...form, publicCommentary: next });
  };

  const addPublicCommentary = () => {
    const next = [
      ...(form.publicCommentary || []),
      {
        id: `commentary_${Date.now()}`,
        title: '',
        content: '',
        isPublished: true,
      },
    ];
    setForm({ ...form, publicCommentary: next });
  };

  const removePublicCommentary = (index: number) => {
    const next = [...(form.publicCommentary || [])];
    next.splice(index, 1);
    setForm({ ...form, publicCommentary: next });
  };

  const updatePublicSponsor = (index: number, key: 'name' | 'role' | 'logoUrl' | 'isPublished', value: string | boolean) => {
    const next = [...(form.publicSponsors || [])];
    if (!next[index]) return;
    next[index] = { ...next[index], [key]: value };
    setForm({ ...form, publicSponsors: next });
  };

  const addPublicSponsor = () => {
    const next = [
      ...(form.publicSponsors || []),
      { id: `sponsor_${Date.now()}`, name: '', role: '', logoUrl: '', isPublished: true },
    ];
    setForm({ ...form, publicSponsors: next });
  };

  const removePublicSponsor = (index: number) => {
    const next = [...(form.publicSponsors || [])];
    next.splice(index, 1);
    setForm({ ...form, publicSponsors: next });
  };

  const updatePublicCredits = (
    section: 'artistic' | 'production' | 'visual' | 'literary' | 'rights',
    field: string,
    value: string
  ) => {
    const credits = { ...(form.publicCredits || {}) } as Record<string, any>;
    const sectionData = { ...(credits[section] || {}) };
    sectionData[field] = value;
    credits[section] = sectionData;
    setForm({ ...form, publicCredits: credits });
  };

  const getLyricsBlocks = (language: string) => {
    const structure = form.lyricsStructure || {};
    return Array.isArray(structure[language]) ? structure[language] : [];
  };

  const getPlaceholderSourceBlocks = (language: string) => {
    const blocks = getLyricsBlocks(language);
    if (!blocks.length) return [];

    if (lyricsPlaceholderScope === 'published') {
      return blocks.filter((block: any) => block?.isPublished !== false);
    }

    if (lyricsPlaceholderScope === 'single') {
      const picked = blocks.find((block: any) => String(block?.id || '') === lyricsPlaceholderBlockId);
      return picked ? [picked] : [];
    }

    return blocks;
  };

  const addLyricsBlock = () => {
    const language = selectedLyricsStructureLanguage || form.defaultLanguage || 'en';
    const structure = { ...(form.lyricsStructure || {}) } as Record<string, any[]>;
    const current = Array.isArray(structure[language]) ? [...structure[language]] : [];
    current.push({
      id: `lyric_block_${Date.now()}`,
      type: 'verse',
      heading: '',
      lines: [],
      order: current.length + 1,
      isPublished: true,
    });
    structure[language] = current;
    setForm({ ...form, lyricsStructure: structure });
  };

  const updateLyricsBlock = (index: number, key: 'type' | 'heading' | 'lines' | 'isPublished', value: string | boolean) => {
    const language = selectedLyricsStructureLanguage || form.defaultLanguage || 'en';
    const structure = { ...(form.lyricsStructure || {}) } as Record<string, any[]>;
    const current = Array.isArray(structure[language]) ? [...structure[language]] : [];
    if (!current[index]) return;

    if (key === 'lines') {
      current[index] = {
        ...current[index],
        lines: String(value || '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      };
    } else {
      current[index] = { ...current[index], [key]: value };
    }

    structure[language] = current;
    setForm({ ...form, lyricsStructure: structure });
  };

  const removeLyricsBlock = (index: number) => {
    const language = selectedLyricsStructureLanguage || form.defaultLanguage || 'en';
    const structure = { ...(form.lyricsStructure || {}) } as Record<string, any[]>;
    const current = Array.isArray(structure[language]) ? [...structure[language]] : [];
    current.splice(index, 1);
    structure[language] = current.map((block, i) => ({ ...block, order: i + 1 }));
    setForm({ ...form, lyricsStructure: structure });
  };

  const syncLyricsLinesToCues = (
    lines: string[],
    sourceLanguage: string,
    targetLanguage: string,
    options?: {
      syncLineRef?: boolean;
    }
  ) => {
    const cleanLines = lines.map((line) => String(line || '').trim()).filter(Boolean);
    if (!cleanLines.length) {
      setLyricsPlaceholderNote('No placeholder lines detected. Add lines and try Apply again.');
      setErrorMessage('No placeholder lines to apply. Paste or load at least one lyric line.');
      return;
    }

    let subtitleCues = [...(form.subtitleCues || [])];
    const subtitleTranslations = { ...(form.subtitleTranslations || {}) } as Record<string, Record<string, string>>;
    subtitleTranslations[targetLanguage] = { ...(subtitleTranslations[targetLanguage] || {}) };

    const createdCount = Math.max(0, cleanLines.length - subtitleCues.length);
    if (subtitleCues.length < cleanLines.length) {
      const missing = cleanLines.length - subtitleCues.length;
      const lastEnd = subtitleCues.length
        ? cueTimeToSeconds(subtitleCues[subtitleCues.length - 1].endTime)
        : 0;

      for (let i = 0; i < missing; i += 1) {
        const cueNumber = subtitleCues.length + 1;
        const start = lastEnd + i * 3;
        const end = start + 3;
        subtitleCues.push({
          id: `cue_${Date.now()}_${cueNumber}_${i}`,
          cueNumber,
          startTime: secondsToCueTime(start),
          endTime: secondsToCueTime(end),
          lineRef: '',
          sourceType: 'manual',
          active: true,
        });
      }
    }

    let assignedCount = 0;
    subtitleCues.forEach((cue, index) => {
      const placeholderText = cleanLines[index];
      if (!placeholderText) return;
      const currentText = String(subtitleTranslations[targetLanguage]?.[cue.id] || '').trim();
      if (currentText !== placeholderText) {
        subtitleTranslations[targetLanguage][cue.id] = placeholderText;
        assignedCount += 1;
      }

      if (options?.syncLineRef) {
        cue.lineRef = `L${String(index + 1).padStart(3, '0')}`;
      }
    });

    setForm({
      ...form,
      subtitleCues,
      subtitleTranslations,
    });

    if (!previewCueId && subtitleCues[0]) {
      setPreviewCueId(subtitleCues[0].id);
    }

    const summary = `Synced lyrics placeholders: ${assignedCount} updated, ${createdCount} cue${createdCount === 1 ? '' : 's'} created (${getLanguageLabel(sourceLanguage)} -> ${getLanguageLabel(targetLanguage)}).`;
    setLyricsPlaceholderNote(summary);
    setSuccessMessage(summary);
  };

  const loadLyricsIntoCuePlaceholders = () => {
    const sourceLanguage = selectedLyricsStructureLanguage || selectedSubtitleLanguage || form.defaultLanguage || 'en';
    const targetLanguage = selectedSubtitleLanguage || form.defaultLanguage || 'en';

    const allSourceBlocks = getLyricsBlocks(sourceLanguage);
    if (lyricsPlaceholderScope === 'single' && !lyricsPlaceholderBlockId && allSourceBlocks[0]?.id) {
      setLyricsPlaceholderBlockId(String(allSourceBlocks[0].id));
    }

    const sourceBlocks = getPlaceholderSourceBlocks(sourceLanguage);
    const fallbackBlocks = sourceLanguage === targetLanguage ? [] : getLyricsBlocks(targetLanguage);
    const lines = (sourceBlocks.length ? sourceBlocks : fallbackBlocks)
      .flatMap((block: any) => (Array.isArray(block.lines) ? block.lines : []))
      .map((line: string) => String(line || '').trim())
      .filter(Boolean);

    setLyricsPlaceholderOpen(true);
    if (!lines.length) {
      setLyricsPlaceholderDraft('');
      setLyricsPlaceholderNote(
        `No lines detected in ${getLanguageLabel(sourceLanguage)} lyrics blocks. Paste lines below or open Lyrics System Structure.`
      );
      return;
    }

    setLyricsPlaceholderDraft(lines.join('\n'));
    setLyricsPlaceholderNote(
      `Loaded ${lines.length} line${lines.length === 1 ? '' : 's'} from ${sourceBlocks.length} block${sourceBlocks.length === 1 ? '' : 's'} in ${getLanguageLabel(sourceLanguage)}. Click Apply to sync into ${getLanguageLabel(targetLanguage)} cues.`
    );
  };

  const applyLyricsPlaceholderDraft = () => {
    const sourceLanguage = selectedLyricsStructureLanguage || selectedSubtitleLanguage || form.defaultLanguage || 'en';
    const targetLanguage = selectedSubtitleLanguage || form.defaultLanguage || 'en';
    let lines = lyricsPlaceholderDraft
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      const sourceBlocks = getPlaceholderSourceBlocks(sourceLanguage);
      const fallbackBlocks = sourceLanguage === targetLanguage ? [] : getLyricsBlocks(targetLanguage);
      lines = (sourceBlocks.length ? sourceBlocks : fallbackBlocks)
        .flatMap((block: any) => (Array.isArray(block.lines) ? block.lines : []))
        .map((line: string) => String(line || '').trim())
        .filter(Boolean);

      if (lines.length) {
        setLyricsPlaceholderDraft(lines.join('\n'));
        setLyricsPlaceholderNote(`Draft was empty, loaded ${lines.length} line${lines.length === 1 ? '' : 's'} from lyrics blocks and applied.`);
      }
    }

    syncLyricsLinesToCues(lines, sourceLanguage, targetLanguage, {
      syncLineRef: lyricsPlaceholderSyncLineRef,
    });
  };

  const addCue = () => {
    const currentCues = form.subtitleCues || [];
    const nextCueNo = currentCues.length + 1;
    const cue = {
      id: `cue_${Date.now()}_${nextCueNo}`,
      cueNumber: nextCueNo,
      startTime: '00:00:00.000',
      endTime: '00:00:03.000',
      lineRef: '',
      sourceType: 'manual' as const,
      active: true,
    };
    setForm({ ...form, subtitleCues: [...currentCues, cue] });
    setPreviewCueId(cue.id);
  };

  const updateCue = (cueId: string, field: string, value: string | number | boolean) => {
    const updated = (form.subtitleCues || []).map((cue) =>
      cue.id === cueId ? { ...cue, [field]: value } : cue
    );
    setForm({ ...form, subtitleCues: updated });
  };

  const deleteCue = (cueId: string) => {
    const updatedCues = (form.subtitleCues || []).filter((cue) => cue.id !== cueId);
    const translations = { ...(form.subtitleTranslations || {}) };
    Object.keys(translations).forEach((lang) => {
      const langMap = { ...(translations[lang] || {}) };
      delete langMap[cueId];
      translations[lang] = langMap;
    });
    setForm({ ...form, subtitleCues: updatedCues, subtitleTranslations: translations });
    if (previewCueId === cueId) {
      setPreviewCueId(updatedCues[0]?.id || null);
    }
  };

  const setCueTranslation = (language: string, cueId: string, text: string) => {
    const translations = { ...(form.subtitleTranslations || {}) };
    const languageMap = { ...(translations[language] || {}) };
    languageMap[cueId] = text;
    translations[language] = languageMap;
    // Mark as manually edited
    const reviewStatus = { ...(form.translationReviewStatus || {}) };
    const langStatus = { ...(reviewStatus[language] || {}) };
    if (text.trim()) {
      if (langStatus[cueId] === 'ai') langStatus[cueId] = 'manual';
      else if (!langStatus[cueId]) langStatus[cueId] = 'manual';
    }
    reviewStatus[language] = langStatus;
    setForm({ ...form, subtitleTranslations: translations, translationReviewStatus: reviewStatus });
  };

  const acceptCueTranslation = (language: string, cueId: string) => {
    const reviewStatus = { ...(form.translationReviewStatus || {}) };
    const langStatus = { ...(reviewStatus[language] || {}) };
    langStatus[cueId] = 'accepted';
    reviewStatus[language] = langStatus;
    setForm({ ...form, translationReviewStatus: reviewStatus });
  };

  // Language helpers
  const getLanguageLabel = (code: string): string => {
    if (form.languageLabels?.[code]) return form.languageLabels[code];
    const preset = ALL_LANGUAGES.find((l) => l.code === code);
    if (preset) return preset.label;
    const custom = (form.customLanguages || []).find((l) => l.code === code);
    if (custom) return custom.label;
    return code.toUpperCase();
  };

  const normalizeLanguageCode = (raw: string) =>
    raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

  const addCustomLanguage = () => {
    const code = normalizeLanguageCode(customLangCode);
    const label = customLangLabel.trim();

    if (!code || !label) {
      setErrorMessage('Enter both language code and language name.');
      return;
    }

    if (!/^[a-z][a-z0-9-]{1,14}$/.test(code)) {
      setErrorMessage('Language code must start with a letter and use only lowercase letters, numbers, or dashes (2-15 chars).');
      return;
    }

    const existing = [...ALL_LANGUAGES, ...(form.customLanguages || [])].find((l) => l.code === code);
    if (existing) {
      setErrorMessage(`Language code "${code}" already exists`);
      return;
    }

    const newCustom = [...(form.customLanguages || []), { code, label }];
    const newAvailable = Array.from(new Set([...(form.availableLanguages || []), code]));
    const nextLabels = {
      ...(form.languageLabels || {}),
      [code]: label,
    };

    setForm({
      ...form,
      customLanguages: newCustom,
      availableLanguages: newAvailable,
      languageLabels: nextLabels,
    });

    setSelectedSubtitleLanguage(code);
    setSelectedLyricsStructureLanguage(code);
    setReferenceLanguage(form.defaultLanguage || 'en');
    setErrorMessage(null);
    setSuccessMessage(`Added language ${label} (${code}) and activated it.`);
    setCustomLangCode('');
    setCustomLangLabel('');
  };

  const deleteCustomLanguage = (code: string) => {
    const newCustom = (form.customLanguages || []).filter((l) => l.code !== code);
    const newAvailable = (form.availableLanguages || []).filter((c) => c !== code);
    const defaultLang = form.defaultLanguage === code ? (newAvailable[0] || 'en') : form.defaultLanguage;
    setForm({ ...form, customLanguages: newCustom, availableLanguages: newAvailable, defaultLanguage: defaultLang });

    if (selectedSubtitleLanguage === code) {
      setSelectedSubtitleLanguage(defaultLang || 'en');
    }
    if (selectedLyricsStructureLanguage === code) {
      setSelectedLyricsStructureLanguage(defaultLang || 'en');
    }
    if (referenceLanguage === code) {
      setReferenceLanguage(defaultLang || 'en');
    }

    setSuccessMessage(`Removed custom language (${code}).`);
  };

  const saveLanguageLabel = (code: string, newLabel: string) => {
    const labels = { ...(form.languageLabels || {}), [code]: newLabel.trim() };
    setForm({ ...form, languageLabels: labels });
    setEditingLangCode(null);
    setEditingLangNewLabel('');
  };

  const setLanguageTone = (langCode: string, tone: string) => {
    const tones = { ...(form.translationTone || {}), [langCode]: tone };
    setForm({ ...form, translationTone: tones });
  };

  const scrollToSection = (sectionId: string) => {
    if (typeof document === 'undefined') return;
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const runWorkflowAction = (sectionId: string) => {
    if (sectionId === 'lyrics-structure-section') {
      const activeLanguage = selectedLyricsStructureLanguage || form.defaultLanguage || 'en';
      if (getLyricsBlocks(activeLanguage).length === 0) {
        addLyricsBlock();
      }
      scrollToSection(sectionId);
      return;
    }

    if (sectionId === 'subtitle-timeline-section') {
      if ((form.subtitleCues || []).length === 0) {
        addCue();
      } else {
        loadLyricsIntoCuePlaceholders();
      }
      scrollToSection(sectionId);
      return;
    }

    scrollToSection(sectionId);
  };

  const autoTranslateLanguage = async (targetLang: string) => {
    const cues = form.subtitleCues || [];
    if (cues.length === 0) {
      setErrorMessage('No subtitle cues to translate. Add cues first.');
      return;
    }
    const masterLang = form.defaultLanguage || 'en';
    if (targetLang === masterLang) {
      setErrorMessage('Target language is the same as the master language.');
      return;
    }

    // Collect source texts from master language cues
    const sourceTexts = cues.map((cue) => form.subtitleTranslations?.[masterLang]?.[cue.id] || cue.lineRef || '');
    const hasSourceText = sourceTexts.some((t) => t.trim().length > 0);
    if (!hasSourceText) {
      setErrorMessage(`No text found in master language "${getLanguageLabel(masterLang)}" cues. Fill in subtitle text first.`);
      return;
    }

    setAutoTranslatingLang(targetLang);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: sourceTexts,
          sourceLang: masterLang,
          targetLang,
          tone: form.translationTone?.[targetLang] || 'literal',
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error || 'Translation request failed');
      }

      const { translations } = await res.json() as { translations: string[] };
      const translationsMap = { ...(form.subtitleTranslations || {}) };
      const langMap = { ...(translationsMap[targetLang] || {}) };
      const reviewStatus = { ...(form.translationReviewStatus || {}) };
      const langStatus = { ...(reviewStatus[targetLang] || {}) };

      cues.forEach((cue, i) => {
        if (translations[i] && translations[i].trim()) {
          langMap[cue.id] = translations[i];
          langStatus[cue.id] = 'ai';
        }
      });

      translationsMap[targetLang] = langMap;
      reviewStatus[targetLang] = langStatus;
      setForm({ ...form, subtitleTranslations: translationsMap, translationReviewStatus: reviewStatus });
      setSuccessMessage(`Auto-translated ${translations.filter((t) => t?.trim()).length} cues to ${getLanguageLabel(targetLang)}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Auto-translation failed');
    } finally {
      setAutoTranslatingLang(null);
    }
  };

  const setCueMetadata = (cueId: string, patch: Record<string, any>) => {
    const metadata = { ...(form.subtitleCueMetadata || {}) } as Record<string, any>;
    const next = { ...(metadata[cueId] || {}), ...patch };
    metadata[cueId] = next;
    setForm({ ...form, subtitleCueMetadata: metadata });
  };

  const applyCueMetadataToAllCues = (
    patch: Record<string, any>,
    options?: {
      clearPosition?: boolean;
      successMessage?: string;
      defaultStyleName?: string;
      defaultAlignment?: number;
      language?: string;
    }
  ) => {
    const cues = form.subtitleCues || [];
    if (!cues.length) {
      // Still make actions useful without cues by applying language-level defaults.
      if (options?.defaultStyleName && options?.language) {
        const styleName = options.defaultStyleName;
        const alignment = Number(options.defaultAlignment || 2);

        const nextStylePacks = {
          ...(form.subtitleStylePacks || {}),
          [styleName]: {
            ...DEFAULT_STYLE_PACK,
            ...((form.subtitleStylePacks as Record<string, ASSStylePack> | undefined)?.[styleName] || {}),
            alignment,
          },
        };

        const nextLanguageOverrides = {
          ...(form.languageStyleOverrides || {}),
          [options.language]: {
            ...((form.languageStyleOverrides as Record<string, any> | undefined)?.[options.language] || {}),
            stylePack: styleName,
          },
        };

        setForm({
          ...form,
          subtitleStylePacks: nextStylePacks,
          languageStyleOverrides: nextLanguageOverrides,
        });
        setSuccessMessage(
          options.successMessage ||
            `No cues yet. Applied ${styleName} as default style for ${options.language.toUpperCase()}.`
        );
        return;
      }

      if (options?.clearPosition) {
        setSuccessMessage(options.successMessage || 'No cue position overrides found to clear.');
        return;
      }

      setErrorMessage('No cues available for batch update. Add or import cues first.');
      return;
    }

    const metadata = { ...(form.subtitleCueMetadata || {}) } as Record<string, any>;
    for (const cue of cues) {
      const next = { ...(metadata[cue.id] || {}), ...patch };
      if (options?.clearPosition) {
        delete next.positionX;
        delete next.positionY;
      }
      metadata[cue.id] = next;
    }

    setForm({ ...form, subtitleCueMetadata: metadata });
    if (options?.successMessage) {
      setSuccessMessage(options.successMessage);
    }
  };

  const setAllCuePositions = (positionX: number, positionY: number) => {
    // Always use the latest form from the live ref so stale closures don't lose data
    const currentForm = liveRef.current.form;
    const cues = currentForm.subtitleCues || [];
    if (!cues.length) return;

    const metadata = { ...(currentForm.subtitleCueMetadata || {}) } as Record<string, any>;
    for (const cue of cues) {
      metadata[cue.id] = {
        ...(metadata[cue.id] || {}),
        positionX,
        positionY,
      };
    }

    setForm({ ...currentForm, subtitleCueMetadata: metadata });
  };

  const handlePreviewDrag = (event: React.PointerEvent<HTMLDivElement>, cueId?: string) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const updatePosition = (clientX: number, clientY: number) => {
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      const clampedX = Number(Math.max(0, Math.min(100, x)).toFixed(2));
      const clampedY = Number(Math.max(0, Math.min(100, y)).toFixed(2));

      // Always read live values — not stale closure
      const { lockAllCuePositions: lockNow } = liveRef.current;

      if (cueId) {
        if (lockNow) {
          // Lock mode: update EVERY cue with this position
          setAllCuePositions(clampedX, clampedY);
        } else {
          setCueMetadata(cueId, {
            positionX: clampedX,
            positionY: clampedY,
          });
        }
      } else {
        setPreviewPanelPosition({ x: clampedX, y: clampedY });
      }
    };

    event.preventDefault();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    updatePosition(event.clientX, event.clientY);

    const move = (pointerEvent: PointerEvent) => updatePosition(pointerEvent.clientX, pointerEvent.clientY);
    const stop = () => {
      target.releasePointerCapture(event.pointerId);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  const handlePreviewInfoDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const updatePosition = (clientX: number, clientY: number) => {
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      const halfWidthPercent = (previewInfoWidth / rect.width) * 50;
      const minX = Math.max(1, halfWidthPercent);
      const maxX = Math.min(99, 100 - halfWidthPercent);
      setPreviewInfoPosition({
        x: Number(Math.max(minX, Math.min(maxX, x)).toFixed(2)),
        y: Number(Math.max(3, Math.min(97, y)).toFixed(2)),
      });
    };

    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    updatePosition(event.clientX, event.clientY);

    const move = (pointerEvent: PointerEvent) => updatePosition(pointerEvent.clientX, pointerEvent.clientY);
    const stop = () => {
      target.releasePointerCapture(event.pointerId);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  const handlePreviewInfoResize = (event: React.PointerEvent<HTMLDivElement>, edge: 'left' | 'right') => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;

    const startX = event.clientX;
    const startWidth = previewInfoWidth;

    const updateWidth = (clientX: number) => {
      const deltaX = clientX - startX;
      const nextWidth = edge === 'right' ? startWidth + deltaX : startWidth - deltaX;
      const maxWidth = Math.max(220, rect.width - 8);
      const clampedWidth = Number(Math.max(160, Math.min(maxWidth, nextWidth)).toFixed(1));
      setPreviewInfoWidth(clampedWidth);
      setPreviewInfoPosition((prev) => {
        const halfWidthPercent = (clampedWidth / rect.width) * 50;
        const minX = Math.max(1, halfWidthPercent);
        const maxX = Math.min(99, 100 - halfWidthPercent);
        return {
          ...prev,
          x: Number(Math.max(minX, Math.min(maxX, prev.x)).toFixed(2)),
        };
      });
    };

    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    updateWidth(event.clientX);

    const move = (pointerEvent: PointerEvent) => updateWidth(pointerEvent.clientX);
    const stop = () => {
      target.releasePointerCapture(event.pointerId);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  const handlePreviewResize = (
    event: React.PointerEvent<HTMLDivElement>,
    styleName: string,
    edge: 'left' | 'right' = 'right'
  ) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;

    const currentPack = (form.subtitleStylePacks || {})[styleName] || DEFAULT_STYLE_PACK;
    const startWidth = Number(currentPack.maxWidthPercent || DEFAULT_STYLE_PACK.maxWidthPercent || 82);
    const startX = event.clientX;

    const updateWidthFromClientX = (clientX: number) => {
      const deltaX = clientX - startX;
      const deltaPercent = (deltaX / rect.width) * 200;
      const widthPercent = edge === 'right'
        ? startWidth + deltaPercent
        : startWidth - deltaPercent;

      updateStylePack(styleName, {
        maxWidthPercent: Number(Math.max(30, Math.min(200, widthPercent)).toFixed(2)),
      });
    };

    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    updateWidthFromClientX(event.clientX);

    const move = (pointerEvent: PointerEvent) => updateWidthFromClientX(pointerEvent.clientX);
    const stop = () => {
      target.releasePointerCapture(event.pointerId);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  const sendPreviewYouTubeCommand = (func: string, args: Array<string | number | boolean> = []) => {
    const targetWindow = previewYouTubeIframeRef.current?.contentWindow;
    if (!targetWindow) return;
    targetWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  };

  const bootstrapPreviewYouTubePlayer = () => {
    // Mark as ready optimistically so transport controls respond immediately.
    setPreviewYouTubeReady(true);
    window.setTimeout(() => {
      sendPreviewYouTubeCommand('addEventListener', ['onReady']);
      sendPreviewYouTubeCommand('addEventListener', ['onStateChange']);
      sendPreviewYouTubeCommand('addEventListener', ['infoDelivery']);
      sendPreviewYouTubeCommand('getDuration');
    }, 120);
  };

  useEffect(() => {
    const handlePlayerMessage = (event: MessageEvent) => {
      if (event.source !== previewYouTubeIframeRef.current?.contentWindow) return;

      let payload: any = event.data;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }

      if (!payload || typeof payload !== 'object') return;

      if (payload.event === 'onReady') {
        setPreviewYouTubeReady(true);
        if (previewTime > 0) {
          sendPreviewYouTubeCommand('seekTo', [previewTime, true]);
        }
        return;
      }

      if (payload.event === 'onStateChange') {
        const state = Number(payload.info);
        if (state === 1) setPreviewPlaying(true);
        if (state === 0 || state === 2) setPreviewPlaying(false);
        return;
      }

      if (payload.event === 'infoDelivery' && payload.info) {
        if (typeof payload.info.currentTime === 'number') {
          setPreviewTime(payload.info.currentTime);
        }
        if (typeof payload.info.duration === 'number' && Number.isFinite(payload.info.duration) && payload.info.duration > 0) {
          setPreviewVideoDuration(payload.info.duration);
        }
      }
    };

    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, []);

  useEffect(() => {
    if (!previewPlaying) return;

    const youtubeId = String(form.youtubeId || '').trim();
    // Proceed with running the interval incrementer even if we are using the YouTube preview
    // so the React ASS Cue timeline stays fully synchronized with playback time.

    const cueMaxEnd = Math.max(
      0,
      ...(form.subtitleCues || []).map((cue) => cueTimeToSeconds(cue.endTime))
    );
    const storedDuration = Number(form.durationSeconds || 0);
    const maxKnownDuration = Math.max(
      cueMaxEnd,
      Number(previewVideoDuration || 0),
      storedDuration,
    );
    const maxEnd = maxKnownDuration > 0 ? maxKnownDuration : SAMPLE_PREVIEW_DURATION_SECONDS;

    const timer = window.setInterval(() => {
      setPreviewTime((current) => {
        const next = current + 0.25;
        if (next >= maxEnd) {
          setPreviewPlaying(false);
          return maxEnd;
        }
        return next;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [previewPlaying, form.subtitleCues, form.youtubeId, form.durationSeconds, previewVideoDuration]);

  useEffect(() => {
    if (!(form.subtitleCues || []).length) return;
    const activeCue = (form.subtitleCues || []).find((cue) => {
      const start = cueTimeToSeconds(cue.startTime);
      const end = cueTimeToSeconds(cue.endTime);
      return previewTime >= start && previewTime < end;
    });

    if (activeCue && activeCue.id !== previewCueId) {
      setPreviewCueId(activeCue.id);
    }
  }, [previewTime, form.subtitleCues, previewCueId]);

  const updateStylePack = (styleName: string, patch: Partial<ASSStylePack>) => {
    const stylePacks = {
      ...(form.subtitleStylePacks || {}),
      [styleName]: {
        ...DEFAULT_STYLE_PACK,
        ...((form.subtitleStylePacks || {})[styleName] || {}),
        ...patch,
      },
    };

    setForm({ ...form, subtitleStylePacks: stylePacks });
  };

  const addStylePack = () => {
    const nextName = `Style_${Date.now()}`;
    const stylePacks = {
      ...(form.subtitleStylePacks || {}),
      [nextName]: { ...DEFAULT_STYLE_PACK },
    };

    setForm({ ...form, subtitleStylePacks: stylePacks });
    setSelectedStyleName(nextName);
  };

  const removeStylePack = (styleName: string) => {
    if (styleName === DEFAULT_STYLE_NAME) return;
    const stylePacks = { ...(form.subtitleStylePacks || {}) } as Record<string, ASSStylePack>;
    delete stylePacks[styleName];

    const metadata = { ...(form.subtitleCueMetadata || {}) } as Record<string, any>;
    Object.keys(metadata).forEach((cueId) => {
      if (metadata[cueId]?.styleName === styleName) {
        metadata[cueId] = { ...metadata[cueId], styleName: DEFAULT_STYLE_NAME };
      }
    });

    setForm({
      ...form,
      subtitleStylePacks: Object.keys(stylePacks).length ? stylePacks : { [DEFAULT_STYLE_NAME]: { ...DEFAULT_STYLE_PACK } },
      subtitleCueMetadata: metadata,
    });
    setSelectedStyleName(DEFAULT_STYLE_NAME);
  };

  const setLanguageStylePack = (language: string, stylePack: string) => {
    const overrides = { ...(form.languageStyleOverrides || {}) } as Record<string, any>;
    overrides[language] = {
      ...(overrides[language] || {}),
      stylePack,
    };
    setForm({ ...form, languageStyleOverrides: overrides });
  };

  const setLanguageStatus = (language: string, status: SubtitleStatus) => {
    const statuses = { ...(form.subtitleLanguageStatuses || {}) };
    statuses[language] = status;
    setForm({ ...form, subtitleLanguageStatuses: statuses });
  };

  const setLanguageAssignee = (language: string, role: 'translator' | 'reviewer', value: string) => {
    const assignments = { ...(form.subtitleLanguageAssignments || {}) };
    const current = { ...(assignments[language] || {}) };
    current[role] = value;
    assignments[language] = current;
    setForm({ ...form, subtitleLanguageAssignments: assignments });
  };

  const addReviewLog = () => {
    const status = form.subtitleLanguageStatuses?.[selectedSubtitleLanguage] || 'draft';
    const nextLogs = [
      ...(form.subtitleReviewLogs || []),
      {
        id: `review_${Date.now()}`,
        language: selectedSubtitleLanguage,
        status,
        comment: reviewComment.trim(),
        actor: reviewActor.trim() || 'Editorial Admin',
        createdAt: new Date().toISOString(),
      },
    ];

    setForm({ ...form, subtitleReviewLogs: nextLogs });
    setReviewComment('');
  };

  const handleImportSubtitleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const format: 'srt' | 'vtt' | 'ass' | null = lowerName.endsWith('.srt')
      ? 'srt'
      : lowerName.endsWith('.vtt')
      ? 'vtt'
      : lowerName.endsWith('.ass')
      ? 'ass'
      : null;

    if (!format) {
      alert('Please upload .srt, .vtt, or .ass file');
      event.target.value = '';
      return;
    }

    const content = await file.text();
    const parsed = format === 'ass' ? parseAssFile(content) : parseSubtitleFile(content, format);
    const importedStylePacks = format === 'ass' ? parseAssStyles(content) : {};
    if (!parsed.length) {
      alert('No cues detected in subtitle file');
      event.target.value = '';
      return;
    }

    const subtitleCues = parsed.map((cue, index) => ({
      id: `cue_${Date.now()}_${index + 1}`,
      cueNumber: cue.cueNumber,
      startTime: cue.startTime,
      endTime: cue.endTime,
      lineRef: '',
      sourceType: format,
      active: true,
    }));

    const cueMetadata = { ...(form.subtitleCueMetadata || {}) };
    if (format === 'ass') {
      subtitleCues.forEach((cue, idx) => {
        const source = parsed[idx] as any;
        cueMetadata[cue.id] = {
          ...(cueMetadata[cue.id] || {}),
          styleName: source.styleName || 'Mystic_Default',
          alignment: Number.isFinite(source.alignment) ? source.alignment : undefined,
          positionX: Number.isFinite(source.positionX) ? source.positionX : undefined,
          positionY: Number.isFinite(source.positionY) ? source.positionY : undefined,
        };
      });
    }

    const subtitleTranslations = { ...(form.subtitleTranslations || {}) };
    subtitleTranslations[selectedSubtitleLanguage] = {};

    subtitleCues.forEach((cue, idx) => {
      subtitleTranslations[selectedSubtitleLanguage][cue.id] = parsed[idx]?.text || '';
    });

    setForm({
      ...form,
      subtitleCues,
      subtitleTranslations,
      masterAssSource: format === 'ass' ? content : (form.masterAssSource || ''),
      subtitleCueMetadata: cueMetadata,
      subtitleStylePacks: format === 'ass' && Object.keys(importedStylePacks).length
        ? importedStylePacks
        : (form.subtitleStylePacks || { [DEFAULT_STYLE_NAME]: { ...DEFAULT_STYLE_PACK } }),
      masterTimingVersion: (form.masterTimingVersion || 1) + 1,
    });
    setPreviewCueId(subtitleCues[0]?.id || null);

    if (format === 'ass') {
      const firstStyle = Object.keys(importedStylePacks)[0] || DEFAULT_STYLE_NAME;
      setSelectedStyleName(firstStyle);
    }

    event.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    const newFieldErrors: Record<string, string> = {};
    if (!form.title?.trim()) newFieldErrors.title = 'Title is required';
    if (!form.slug?.trim()) newFieldErrors.slug = 'Slug is required';
    if (!form.youtubeId?.trim()) newFieldErrors.youtubeId = 'YouTube ID is required';
    if (!form.durationSeconds || form.durationSeconds <= 0) newFieldErrors.durationSeconds = 'Duration must be greater than 0';

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setErrorMessage('Please fix the highlighted fields before saving.');
      return;
    }
    setFieldErrors({});

    try {
      setSaving(true);
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/releases' : `/api/releases/${params.id}`;

      const normalizedChorus = String((form.publicCredits as any)?.artistic?.backgroundVocals || '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);

      const payload = {
        ...form,
        chorusVocalists: normalizedChorus,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        try {
          const carryForwardPayload = {
            youtubeChannelId: data.youtubeChannelId || '',
            youtubeChannelUrl: data.youtubeChannelUrl || '',
            publicCredits: data.publicCredits || {},
            updatedAt: new Date().toISOString(),
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem(CARRY_FORWARD_STORAGE_KEY, JSON.stringify(carryForwardPayload));
          }
        } catch {
          // ignore carry-forward persistence issues
        }

        setOriginalForm(data);
        setSuccessMessage(`Release "${data.title}" saved successfully${data.youtubeSubtitleAutoSync ? ' and synced to YouTube' : ''}`);
        
        if (data.youtubeSubtitleAutoSync !== false) {
          await syncYouTubeSubtitles({
            releaseId: data.id,
            mode: 'update-changed',
            silent: true,
          });
        }

        setTimeout(() => {
          router.push('/admin/cms-releases');
        }, 1500);
      } else {
        const error = await res.json();
        setErrorMessage(`Save failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save:', error);
      setErrorMessage(`Failed to save release: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const buildSubtitleExportUrl = (language: string, format: 'srt' | 'vtt' | 'ass') => {
    const query = new URLSearchParams({
      lang: language,
      format,
    });
    return `/api/releases/${params.id}/subtitles?${query.toString()}`;
  };

  const getSubtitleExportLanguages = () => {
    return Array.from(new Set([
      ...(form.availableLanguages || []),
      ...Object.keys(form.subtitleTranslations || {}),
      selectedSubtitleLanguage,
    ])).filter(Boolean);
  };

  const getTrackMeta = (language: string): CaptionTrackMeta => {
    return ((form.youtubeCaptionTracks as Record<string, CaptionTrackMeta> | undefined)?.[language] || {}) as CaptionTrackMeta;
  };

  const suggestReadinessState = (
    sourceForm: Partial<CMSRelease>,
    trackOverride?: Record<string, CaptionTrackMeta>
  ): ContentReadinessState => {
    const status = sourceForm.status || 'draft';
    if (status === 'draft') return 'draft';
    if (status === 'in_review' || status === 'approved') return 'editorial_ready';
    if (status !== 'published') return 'delivery_attention_required';

    const tracks = (trackOverride || sourceForm.youtubeCaptionTracks || {}) as Record<string, CaptionTrackMeta>;
    const languageSet = new Set<string>([
      ...(sourceForm.availableLanguages || []),
      ...Object.keys(sourceForm.subtitleTranslations || {}),
      ...Object.keys(tracks || {}),
    ].filter(Boolean));

    if (!languageSet.size) {
      return 'web_published';
    }

    const states = Array.from(languageSet).map((language) => {
      const meta = tracks[language] || {};
      return meta.deliveryState || 'web_only';
    });

    if (states.some((state) => state === 'sync_failed')) {
      return 'delivery_attention_required';
    }

    const allDelivered = states.every((state) => state === 'synced_to_youtube' || state === 'manual_upload_completed');
    if (allDelivered) {
      return 'fully_delivered';
    }

    const hasProgress = states.some((state) => state === 'synced_to_youtube' || state === 'manual_upload_pending' || state === 'manual_upload_completed');
    return hasProgress ? 'youtube_delivery_in_progress' : 'web_published';
  };

  const persistDeliveryTracks = async (
    tracks: Record<string, CaptionTrackMeta>,
    readinessState: ContentReadinessState,
    successText?: string
  ) => {
    if (isNew || !params.id) {
      setSuccessMessage('Delivery state updated locally. Save release to persist.');
      return;
    }

    try {
      const response = await fetch(`/api/releases/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeCaptionTracks: tracks,
          contentReadinessState: readinessState,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to persist delivery state');
      }

      if (successText) {
        setSuccessMessage(successText);
      }
    } catch (error: any) {
      setErrorMessage(`Delivery state persistence failed: ${error?.message || 'Unknown error'}`);
    }
  };

  const persistReleasePatch = async (
    patch: Partial<CMSRelease>,
    successText?: string,
  ) => {
    if (isNew || !params.id) {
      setSuccessMessage('Saved locally. Create release first to persist this control.');
      return;
    }

    try {
      const response = await fetch(`/api/releases/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to persist release settings');
      }

      setForm((previous) => ({ ...previous, ...patch }));
      if (successText) {
        setSuccessMessage(successText);
      }
    } catch (error: any) {
      setErrorMessage(`Failed to persist release settings: ${error?.message || 'Unknown error'}`);
    }
  };

  const toggleWebPublishState = async () => {
    const nextStatus = form.status === 'published' ? 'unpublished' : 'published';
    const nextReadiness = suggestReadinessState({
      ...form,
      status: nextStatus,
    });

    await persistReleasePatch(
      {
        status: nextStatus,
        contentReadinessState: nextReadiness,
      },
      `Web status set to ${nextStatus}.`,
    );
  };

  const updateReadinessState = async (nextReadiness: ContentReadinessState) => {
    await persistReleasePatch(
      {
        contentReadinessState: nextReadiness,
      },
      `Readiness updated to ${nextReadiness.replace(/_/g, ' ')}.`,
    );
  };

  const updateTrackMeta = (
    language: string,
    patch: Partial<CaptionTrackMeta>,
    options?: { persist?: boolean; successText?: string }
  ) => {
    const tracks = { ...(form.youtubeCaptionTracks || {}) } as Record<string, CaptionTrackMeta>;
    tracks[language] = {
      ...(tracks[language] || {}),
      language,
      ...patch,
    };

    const nextReadiness = suggestReadinessState(form, tracks);

    setForm((previous) => ({
      ...previous,
      youtubeCaptionTracks: tracks,
      contentReadinessState: nextReadiness,
    }));

    if (options?.persist) {
      void persistDeliveryTracks(tracks, nextReadiness, options.successText);
    }
  };

  const markManualDeliveryState = (language: string, state: Extract<DeliveryState, 'manual_upload_pending' | 'manual_upload_completed'>) => {
    updateTrackMeta(language, {
      deliveryState: state,
      manualUploadActor,
      manualUploadAt: new Date().toISOString(),
      manualUploadNotes: manualUploadNotes[language] || '',
    }, {
      persist: true,
      successText: `${language.toUpperCase()} marked as ${state === 'manual_upload_pending' ? 'manual upload pending' : 'manual upload completed'}.`,
    });
  };

  const exportSubtitleByLanguage = async (language: string, format: 'srt' | 'vtt' | 'ass') => {
    if (isNew) {
      alert('Save this release before exporting subtitle files.');
      return;
    }

    try {
      const response = await fetch(buildSubtitleExportUrl(language, format));
      if (!response.ok) {
        throw new Error(`Export failed for ${language.toUpperCase()} ${format.toUpperCase()}`);
      }

      const blob = await response.blob();
      const fallback = `${form.slug || params.id}-${language}.${format}`;
      const filename = extractFilenameFromDisposition(response.headers.get('content-disposition'), fallback);
      triggerBlobDownload(blob, filename);
      updateTrackMeta(language, {
        lastExportedAt: new Date().toISOString(),
      }, {
        persist: true,
        successText: `${language.toUpperCase()} ${format.toUpperCase()} export telemetry saved.`,
      });
    } catch (error) {
      console.error(error);
      alert('Subtitle export failed. Please try again.');
    }
  };

  const exportAllSubtitlesZip = async () => {
    if (isNew) {
      alert('Save this release before exporting subtitle files.');
      return;
    }

    const languages = getSubtitleExportLanguages();

    if (!languages.length) {
      alert('No subtitle languages available to export.');
      return;
    }

    setExportingZip(true);
    try {
      const zip = new JSZip();
      const failed: string[] = [];

      for (const language of languages) {
        for (const format of ['srt', 'vtt', 'ass'] as const) {
          try {
            const response = await fetch(buildSubtitleExportUrl(language, format));
            if (!response.ok) {
              failed.push(`${language.toUpperCase()} ${format.toUpperCase()}`);
              continue;
            }

            const fallback = `${form.slug || params.id}-${language}.${format}`;
            const filename = extractFilenameFromDisposition(response.headers.get('content-disposition'), fallback);
            const buffer = await response.arrayBuffer();
            zip.file(filename, buffer);
          } catch (error) {
            console.error(error);
            failed.push(`${language.toUpperCase()} ${format.toUpperCase()}`);
          }
        }
      }

      if (!Object.keys(zip.files).length) {
        alert('No subtitle files were generated for ZIP export.');
        return;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipName = `${form.slug || params.id}-subtitles-srt-vtt-ass.zip`;
      triggerBlobDownload(zipBlob, zipName);

      const exportedAt = new Date().toISOString();
      const tracks = { ...(form.youtubeCaptionTracks || {}) } as Record<string, CaptionTrackMeta>;
      for (const language of languages) {
        tracks[language] = {
          ...(tracks[language] || {}),
          language,
          lastExportedAt: exportedAt,
        };
      }

      const nextReadiness = suggestReadinessState(form, tracks);
      setForm((previous) => ({
        ...previous,
        youtubeCaptionTracks: tracks,
        contentReadinessState: nextReadiness,
      }));
      await persistDeliveryTracks(tracks, nextReadiness, 'ZIP export telemetry saved.');

      if (failed.length) {
        alert(`ZIP exported with partial results. Failed: ${failed.join(', ')}`);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to export subtitle ZIP. Please try again.');
    } finally {
      setExportingZip(false);
    }
  };

  const syncYouTubeSubtitles = async (options?: {
    releaseId?: string;
    mode?: 'update-changed' | 'force-update';
    languages?: string[];
    silent?: boolean;
  }) => {
    const targetReleaseId = options?.releaseId || String(params.id);
    if (!targetReleaseId || targetReleaseId === 'new') {
      if (!options?.silent) {
        alert('Save this release before syncing subtitles to YouTube.');
      }
      return null;
    }

    setYoutubeSyncing(true);
    try {
      const response = await fetch(`/api/releases/${targetReleaseId}/youtube-subtitles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: options?.mode || 'update-changed',
          format: 'srt',
          isDraft: false,
          languages: options?.languages?.length ? options.languages : getSubtitleExportLanguages(),
          youtubeSubtitleAutoSync: form.youtubeSubtitleAutoSync !== false,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'YouTube subtitle sync failed');
      }

      setForm((previous) => {
        const nextTracks = {
          ...(previous.youtubeCaptionTracks || {}),
          ...(data.youtubeCaptionTracks || {}),
        } as Record<string, CaptionTrackMeta>;

        const attemptAt = new Date().toISOString();
        const results = Array.isArray(data?.results) ? data.results : [];
        for (const row of results) {
          const language = String(row?.language || '').trim();
          if (!language) continue;
          const status = String(row?.status || '').toLowerCase();
          const current = nextTracks[language] || {};
          const nextState: DeliveryState =
            status === 'failed'
              ? 'sync_failed'
              : status === 'inserted' || status === 'updated' || status === 'skipped'
              ? 'synced_to_youtube'
              : (current.deliveryState || 'web_only');

          nextTracks[language] = {
            ...current,
            language,
            lastSyncAttemptAt: attemptAt,
            deliveryState: nextState,
          };
        }

        const nextReadiness = suggestReadinessState(previous, nextTracks);

        return {
          ...previous,
          youtubeCaptionTracks: nextTracks,
          contentReadinessState: nextReadiness,
        };
      });

      if (!options?.silent) {
        setSuccessMessage(
          `YouTube subtitle sync complete\n` +
          `Success: ${data.successCount} | Skipped: ${data.skippedCount} | Failed: ${data.failedCount}`
        );
      }

      return data;
    } catch (error: any) {
      if (!options?.silent) {
        setErrorMessage(`YouTube subtitle sync failed: ${error?.message || 'Unknown error'}`);
      }
      return null;
    } finally {
      setYoutubeSyncing(false);
    }
  };

  const openPublicReleasePreview = () => {
    const slug = String(form.slug || '').trim();
    if (!slug) {
      setErrorMessage('Add a slug first to preview the public release URL.');
      return;
    }

    if (typeof window !== 'undefined') {
      window.open(`/release-detail/${encodeURIComponent(slug)}`, '_blank', 'noopener,noreferrer');
    }
  };

  const copySubtitleNamingConvention = async () => {
    const slug = String(form.slug || '').trim() || String(params.id || 'release');
    const text = [
      'Subtitle naming convention:',
      `${slug}-{language}.srt`,
      `${slug}-{language}.vtt`,
      `${slug}-{language}.ass`,
    ].join('\n');

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setSuccessMessage('Subtitle naming convention copied to clipboard.');
        return;
      }
      setErrorMessage('Clipboard is unavailable in this browser context.');
    } catch {
      setErrorMessage('Could not copy naming convention.');
    }
  };

  if (!user?.role.includes('admin')) {
    return <div className="p-8 text-center">Unauthorized</div>;
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--dash-bg-secondary)' }}>
        <p className="text-lg font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Release not found</p>
        <p className="text-sm" style={{ color: 'var(--dash-text-muted)' }}>No release exists with ID &ldquo;{params.id}&rdquo;.</p>
        <p className="text-sm" style={{ color: 'var(--dash-text-muted)' }}>
          Legacy seeded IDs were removed. Import a real video from YouTube or create a new release.
        </p>
        <Link href="/admin/cms-releases">
          <button className="dashboard-btn-primary px-5 py-2 rounded-lg text-sm font-medium">
            Back to Releases
          </button>
        </Link>
      </div>
    );
  }

  const styleNames = Object.keys(form.subtitleStylePacks || { [DEFAULT_STYLE_NAME]: DEFAULT_STYLE_PACK });
  const activeStyleName = styleNames.includes(selectedStyleName) ? selectedStyleName : styleNames[0];
  const activeStyle = {
    ...DEFAULT_STYLE_PACK,
    ...((form.subtitleStylePacks || {})[activeStyleName] || {}),
  };
  const previewCue = (form.subtitleCues || []).find((cue) => cue.id === previewCueId) || (form.subtitleCues || [])[0] || null;
  const previewCueMetadata = previewCue ? ((form.subtitleCueMetadata as Record<string, any> | undefined)?.[previewCue.id] || {}) : {};
  const previewStyleName =
    previewCueMetadata.styleName ||
    form.languageStyleOverrides?.[selectedSubtitleLanguage]?.stylePack ||
    activeStyleName ||
    DEFAULT_STYLE_NAME;
  const previewStyle = {
    ...DEFAULT_STYLE_PACK,
    ...((form.subtitleStylePacks || {})[previewStyleName] || {}),
  };
  const previewText = previewCue
    ? (form.subtitleTranslations?.[selectedSubtitleLanguage]?.[previewCue.id] || form.subtitleTranslations?.[referenceLanguage]?.[previewCue.id] || 'Preview subtitle text')
    : 'Sample subtitle preview text';
  const previewYouTubeId = String(form.youtubeId || '').trim();
  const previewHasYouTube = /^[A-Za-z0-9_-]{11}$/.test(previewYouTubeId);
  const previewAlignment = previewCueMetadata.alignment || previewStyle.alignment || 2;
  const previewAnchor = resolvePreviewAnchor(previewAlignment);
  const previewHasCustomPosition = Number.isFinite(previewCueMetadata.positionX) && Number.isFinite(previewCueMetadata.positionY);
  const previewPosition = previewHasCustomPosition
    ? {
        x: Number(previewCueMetadata.positionX),
        y: Number(previewCueMetadata.positionY),
      }
    : previewCue
      ? null
      : previewPanelPosition;
  const previewTextLines = String(previewText || '').split('\n').filter(Boolean);
  const cueMaxEnd = Math.max(0, ...(form.subtitleCues || []).map((cue) => cueTimeToSeconds(cue.endTime)));
  const storedDuration = Number(form.durationSeconds || 0);
  const maxKnownDuration = Math.max(cueMaxEnd, Number(previewVideoDuration || 0), storedDuration);
  const previewDuration = maxKnownDuration > 0 ? maxKnownDuration : SAMPLE_PREVIEW_DURATION_SECONDS;
  const subtitleExportLanguages = getSubtitleExportLanguages();
  const defaultLanguage = form.defaultLanguage || 'en';
  const defaultLanguageLyricsBlocks = getLyricsBlocks(defaultLanguage);
  const publishedLyricsCount = defaultLanguageLyricsBlocks.filter((block: any) => block?.isPublished !== false).length;
  const subtitleCuesCount = (form.subtitleCues || []).length;
  const activeTranslationMap = form.subtitleTranslations?.[selectedSubtitleLanguage] || {};
  const translatedCueCount = (form.subtitleCues || []).filter((cue) => String(activeTranslationMap?.[cue.id] || '').trim().length > 0).length;
  const publishedCommentaryCount = (form.publicCommentary || []).filter((block) => block?.isPublished !== false && String(block?.content || '').trim()).length;
  const publishedSponsorsCount = (form.publicSponsors || []).filter((sponsor: any) => sponsor?.isPublished !== false && String(sponsor?.name || '').trim()).length;
  const requiredCreditFields = [
    form.publicCredits?.artistic?.leadVocalist,
    form.publicCredits?.artistic?.lyricist,
    form.publicCredits?.artistic?.composer,
    form.publicCredits?.artistic?.musicProducer,
  ].filter((entry) => String(entry || '').trim().length > 0).length;
  const workflowSteps = [
    {
      id: 'identity',
      rank: 1,
      sectionId: 'basic-info-section',
      title: 'Basic Release Identity',
      done: Boolean(
        String(form.title || '').trim() &&
        String(form.slug || '').trim() &&
        /^[A-Za-z0-9_-]{11}$/.test(String(form.youtubeId || '').trim())
      ),
      detail: 'Title, slug, and valid YouTube ID are required.',
      whatItDoes: 'Creates the canonical release identity used by CMS, slug-first public routing, and YouTube linkage.',
      whyImportant: 'If identity is weak, every downstream operation can attach to the wrong release or fail to resolve publicly.',
      whatCanGoWrong: 'Broken URLs, duplicate records, or invalid media linkage can cause publishing and QA confusion.',
      whyNow: 'This should be first because every other section depends on a stable release identity contract.',
      actionLabel: 'Complete Basic Info',
    },
    {
      id: 'sponsors',
      rank: 2,
      sectionId: 'sponsors-section',
      title: 'Sponsors Tab Content',
      done: !form.enableSponsors || publishedSponsorsCount > 0,
      detail: form.enableSponsors
        ? `Add sponsor entries when sponsors tab is enabled. Published: ${publishedSponsorsCount}.`
        : 'Sponsors tab is disabled, so this is optional.',
      whatItDoes: 'Defines sponsorship entities and intro copy shown in the public sponsors tab.',
      whyImportant: 'Sponsors often have contractual visibility requirements tied to release publishing.',
      whatCanGoWrong: 'Missing sponsor data may create legal, brand, or partner relationship issues after launch.',
      whyNow: 'Handled early so contractual and legal visibility is locked before final editorial publishing.',
      actionLabel: 'Review Sponsors',
    },
    {
      id: 'credits',
      rank: 3,
      sectionId: 'credits-section',
      title: 'Official Credits',
      done: requiredCreditFields >= 2,
      detail: `Fill key artistic credits (lead vocalist, lyricist, composer, producer). Completed: ${requiredCreditFields}/4.`,
      whatItDoes: 'Assigns attribution for artistic, production, visual, and rights ownership metadata.',
      whyImportant: 'Credits protect attribution integrity and make release metadata trustworthy for public and ops use.',
      whatCanGoWrong: 'Inaccurate credits can trigger disputes and force urgent post-release corrections.',
      whyNow: 'Credits should be locked before language and subtitle delivery so downstream exports stay consistent.',
      actionLabel: 'Fill Credits',
    },
    {
      id: 'languages',
      rank: 4,
      sectionId: 'language-management-section',
      title: 'Language Setup',
      done: (form.availableLanguages || []).length > 0 && (form.availableLanguages || []).includes(defaultLanguage),
      detail: `Active languages: ${(form.availableLanguages || []).length}. Master: ${getLanguageLabel(defaultLanguage)}.`,
      whatItDoes: 'Defines active locales, master timing language, and translation behavior configuration.',
      whyImportant: 'Canonical subtitle governance relies on a clear master language and active language list.',
      whatCanGoWrong: 'Wrong master language can desync cue timing and produce unreliable subtitle output.',
      whyNow: 'Language topology should be finalized before building lyrics and cue tracks.',
      actionLabel: 'Manage Languages',
    },
    {
      id: 'lyrics',
      rank: 5,
      sectionId: 'lyrics-structure-section',
      title: 'Lyrics Structure',
      done: publishedLyricsCount > 0,
      detail: `Published blocks in ${getLanguageLabel(defaultLanguage)}: ${publishedLyricsCount}.`,
      whatItDoes: 'Creates structured source blocks used for lyrics display and placeholder cue generation.',
      whyImportant: 'Structured lyrics become the source material for consistent subtitle creation workflows.',
      whatCanGoWrong: 'Unstructured or missing lines lead to chaotic placeholders and translation mismatch.',
      whyNow: 'This step feeds subtitle placeholders, so it should exist before cue refinement.',
      actionLabel: publishedLyricsCount > 0 ? 'Review Lyrics Blocks' : 'Add First Lyrics Block',
    },
    {
      id: 'timeline',
      rank: 6,
      sectionId: 'subtitle-timeline-section',
      title: 'Subtitle Timeline',
      done: subtitleCuesCount > 0,
      detail: `Cues created: ${subtitleCuesCount}.`,
      whatItDoes: 'Builds canonical cue timing windows that every subtitle format and language output uses.',
      whyImportant: 'Cue timing is the backbone for web subtitles, exports, and YouTube delivery.',
      whatCanGoWrong: 'Bad timing causes unreadable playback and cross-language sync defects.',
      whyNow: 'Timing should be established before validating language completeness.',
      actionLabel: subtitleCuesCount > 0 ? 'Open Subtitle Timeline' : 'Create First Cue',
    },
    {
      id: 'language-track',
      rank: 7,
      sectionId: 'subtitle-timeline-section',
      title: `Language Track (${getLanguageLabel(selectedSubtitleLanguage)})`,
      done: subtitleCuesCount > 0 && translatedCueCount === subtitleCuesCount,
      detail: subtitleCuesCount > 0
        ? `Translated cues for ${getLanguageLabel(selectedSubtitleLanguage)}: ${translatedCueCount}/${subtitleCuesCount}.`
        : 'Create cues first, then sync/translate this language.',
      whatItDoes: 'Ensures the selected language track is fully populated against the canonical cue list.',
      whyImportant: 'Delivery quality depends on complete language text aligned to approved timings.',
      whatCanGoWrong: 'Partial tracks can ship with missing lines and fail review or audience expectations.',
      whyNow: 'Once cue timing exists, language completion becomes the primary readiness gate.',
      actionLabel: 'Sync Language From Lyrics',
    },
    {
      id: 'commentary',
      rank: 8,
      sectionId: 'commentary-section',
      title: 'Commentary Publishing',
      done: !form.enableCommentary || publishedCommentaryCount > 0,
      detail: form.enableCommentary
        ? `Published commentary blocks: ${publishedCommentaryCount}.`
        : 'Commentary tab is disabled, so this is optional.',
      whatItDoes: 'Publishes contextual editorial notes that frame spiritual and thematic interpretation.',
      whyImportant: 'Commentary provides audience context and improves public release comprehension.',
      whatCanGoWrong: 'Without commentary, public presentation may feel incomplete or lose intended narrative depth.',
      whyNow: 'Final commentary check is best near completion to ensure narrative aligns with final release content.',
      actionLabel: 'Review Commentary',
    },
  ];
  const completedWorkflowSteps = workflowSteps.filter((step) => step.done).length;
  const workflowProgressPercent = Math.round((completedWorkflowSteps / workflowSteps.length) * 100);
  const nextWorkflowStep = workflowSteps.find((step) => !step.done) || null;
  const openWorkflowStepId = expandedWorkflowStepId || nextWorkflowStep?.id || null;
  const workflowStateMessage = nextWorkflowStep
    ? `Step ${nextWorkflowStep.rank} is next because ${nextWorkflowStep.whyNow}`
    : 'All critical workflow checks are complete. You can save and proceed to publishing/delivery actions.';

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--dash-bg-secondary)'}}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/cms-releases">
              <button className="flex items-center gap-2 transition" style={{color: 'var(--dash-text-secondary)'}}>
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold" style={{color: 'var(--dash-text-primary)'}}>
                {isNew ? 'New Release' : 'Edit Release'}
              </h1>
              {hasUnsavedChanges && (
                <p className="text-sm mt-1" style={{color: 'var(--dash-status-pending)'}}>Unsaved changes (Ctrl+S to save)</p>
              )}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-lg" style={{backgroundColor: 'var(--dash-status-rejected-bg)', border: '1px solid var(--dash-status-rejected)'}}>
            <p className="text-sm" style={{color: 'var(--dash-status-rejected)'}}><strong>Error:</strong> {errorMessage}</p>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 rounded-lg" style={{backgroundColor: 'var(--dash-status-approved-bg)', border: '1px solid var(--dash-status-approved)'}}>
            <p className="text-sm whitespace-pre-line" style={{color: 'var(--dash-status-approved)'}}><strong>Success:</strong> {successMessage}</p>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="mb-6 p-4 dashboard-card">
          <div className="text-sm space-y-1" style={{color: 'var(--dash-text-primary)'}}>
            <p><strong>Keyboard Shortcuts:</strong></p>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs mt-2">
              <div><kbd className="px-2 py-1 rounded" style={{backgroundColor: 'var(--dash-bg-hover)', border: '1px solid var(--dash-border)'}}>Ctrl+S</kbd> Save</div>
              <div><kbd className="px-2 py-1 rounded" style={{backgroundColor: 'var(--dash-bg-hover)', border: '1px solid var(--dash-border)'}}>Ctrl+Z</kbd> Undo</div>
              <div><kbd className="px-2 py-1 rounded" style={{backgroundColor: 'var(--dash-bg-hover)', border: '1px solid var(--dash-border)'}}>Ctrl+Shift+Z</kbd> Redo</div>
              <div><kbd className="px-2 py-1 rounded" style={{backgroundColor: 'var(--dash-bg-hover)', border: '1px solid var(--dash-border)'}}>Ctrl+E</kbd> Export</div>
              <div><kbd className="px-2 py-1 rounded" style={{backgroundColor: 'var(--dash-bg-hover)', border: '1px solid var(--dash-border)'}}>Ctrl+N</kbd> New</div>
              <div style={{color: 'var(--dash-text-muted)'}}>Click timeline to scrub</div>
            </div>
          </div>
        </div>

        <WorkflowAssistantSection
          completedWorkflowSteps={completedWorkflowSteps}
          workflowSteps={workflowSteps}
          workflowProgressPercent={workflowProgressPercent}
          workflowStateMessage={workflowStateMessage}
          carryForwardNotice={carryForwardNotice}
          nextWorkflowStep={nextWorkflowStep}
          openWorkflowStepId={openWorkflowStepId}
          onApplyPreviousDefaults={applyCarryForwardToCurrentForm}
          onDoNext={() => {
            if (!nextWorkflowStep) return;
            setExpandedWorkflowStepId(nextWorkflowStep.id);
            runWorkflowAction(nextWorkflowStep.sectionId);
          }}
          onRunWorkflowAction={runWorkflowAction}
          onToggleStepGuide={(stepId) => setExpandedWorkflowStepId(stepId === openWorkflowStepId ? null : stepId)}
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="dashboard-card p-8">
          {/* Basic Info */}
          <div id="basic-info-section" className="mb-8">
            <h2 className="text-xl font-semibold mb-6" style={{color: 'var(--dash-text-primary)'}}>Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>
                  Title <span style={{color: 'var(--dash-status-rejected)'}}>*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title || ''}
                  onChange={handleInputChange}
                  className={`form-input w-full${fieldErrors.title ? ' form-error' : ''}`}
                  placeholder="Release title"
                />
                {fieldErrors.title && <p className="form-error-message">{fieldErrors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>
                  Slug <span style={{color: 'var(--dash-status-rejected)'}}>*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="slug"
                    value={form.slug || ''}
                    onChange={handleInputChange}
                    className={`form-input flex-1${fieldErrors.slug ? ' form-error' : ''}`}
                    placeholder="url-friendly-slug"
                  />
                  <button
                    type="button"
                    onClick={generateSlug}
                    className="dashboard-btn-secondary px-4"
                  >
                    Generate
                  </button>
                </div>
                {fieldErrors.slug
                  ? <p className="form-error-message">{fieldErrors.slug}</p>
                  : <p className="text-xs mt-1" style={{color: 'var(--dash-text-muted)'}}>Auto-generated from title G�� edit to customise</p>
                }
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>
                  YouTube ID <span style={{color: 'var(--dash-status-rejected)'}}>*</span>
                </label>
                <input
                  type="text"
                  name="youtubeId"
                  value={form.youtubeId || ''}
                  onChange={handleInputChange}
                  onPaste={handleYouTubePaste}
                  className={`form-input w-full${fieldErrors.youtubeId ? ' form-error' : ''}`}
                  placeholder="Paste YouTube URL or ID G�� e.g., LXb3EKWsInQ"
                />
                {fieldErrors.youtubeId
                  ? <p className="form-error-message">{fieldErrors.youtubeId}</p>
                  : <p className="text-xs mt-1" style={{color: 'var(--dash-text-muted)'}}>Paste a full YouTube URL and the ID will be extracted automatically</p>
                }
                {form.youtubeId && /^[A-Za-z0-9_-]{11}$/.test(form.youtubeId.trim()) && (
                  <div className="mt-2 flex items-start gap-3">
                    <img
                      src={`https://i.ytimg.com/vi/${form.youtubeId.trim()}/hqdefault.jpg`}
                      alt="YouTube thumbnail preview"
                      className="rounded"
                      style={{width: 160, height: 90, objectFit: 'cover', border: '1px solid var(--dash-border)'}}
                    />
                    <p className="text-xs mt-1" style={{color: 'var(--dash-text-muted)'}}>Thumbnail preview</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>
                    YouTube Channel ID
                  </label>
                  <input
                    type="text"
                    name="youtubeChannelId"
                    value={form.youtubeChannelId || ''}
                    onChange={handleInputChange}
                    className="form-input w-full"
                    placeholder="e.g., UCraDr3i5A3k0j7typ6tOOsQ"
                  />
                  <p className="text-xs mt-1" style={{color: 'var(--dash-text-muted)'}}>
                    Default comes from fetched YouTube video metadata. You can override it per release for multi-channel publishing.
                  </p>
                  {fetchedYouTubeChannel?.channelId && (
                    <p className="text-xs mt-1" style={{color: 'var(--dash-text-secondary)'}}>
                      Fetched default: {fetchedYouTubeChannel.channelId}
                      {fetchedYouTubeChannel.channelTitle ? ` (${fetchedYouTubeChannel.channelTitle})` : ''}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>
                    YouTube Channel URL
                  </label>
                  <input
                    type="text"
                    name="youtubeChannelUrl"
                    value={form.youtubeChannelUrl || ''}
                    onChange={handleInputChange}
                    className="form-input w-full"
                    placeholder="https://www.youtube.com/channel/..."
                  />
                  <p className="text-xs mt-1" style={{color: 'var(--dash-text-muted)'}}>
                    If set, this URL is used by subscribe actions on the public release page. Keep this as override when release belongs to a different channel.
                  </p>
                  {fetchedYouTubeChannel?.channelUrl && (
                    <p className="text-xs mt-1" style={{color: 'var(--dash-text-secondary)'}}>
                      Fetched default URL: {fetchedYouTubeChannel.channelUrl}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={applyFetchedChannelDefaults}
                  className="dashboard-btn-secondary px-3 py-1"
                  disabled={!fetchedYouTubeChannel || youtubeChannelLookupLoading}
                >
                  {youtubeChannelLookupLoading ? 'Loading Channel Default...' : 'Use API Channel Default'}
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, youtubeChannelId: '', youtubeChannelUrl: '' })}
                  className="dashboard-btn-secondary px-3 py-1"
                >
                  Clear Channel Override
                </button>
                <span style={{color: 'var(--dash-text-muted)'}}>
                  Default auto-fills once from the current YouTube video. Manual edits are preserved until you reset/apply again.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium" style={{color: 'var(--dash-text-primary)'}}>
                    Description
                  </label>
                  <span className="text-xs" style={{color: (form.description || '').length > 500 ? 'var(--dash-status-pending)' : 'var(--dash-text-muted)'}}>
                    {(form.description || '').length} / 600
                  </span>
                </div>
                <textarea
                  name="description"
                  value={form.description || ''}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={600}
                  className="form-input w-full"
                  placeholder="Public-facing summary: theme, message, lyrical or spiritual context of the release"
                />
                <p className="text-xs mt-1" style={{color: 'var(--dash-text-muted)'}}>Visible on the release page and used for SEO. Keep it audience-facing and concise.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>
                    Release Date
                  </label>
                  <input
                    type="date"
                    name="releaseDate"
                    value={form.releaseDate || ''}
                    onChange={handleInputChange}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status || 'draft'}
                    onChange={handleInputChange}
                    className="form-input w-full"
                  >
                    <option value="draft">Draft</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                    <option value="unpublished">Unpublished</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Media Info */}
          <div id="media-info-section">
            <ReleaseMediaInfoSection form={form} onInputChange={handleInputChange} />
          </div>

          {/* Streaming Platforms */}
          <div id="streaming-platforms-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{color: 'var(--dash-text-primary)'}}>Streaming Platforms</h2>
              <button 
                type="button" 
                onClick={() => {
                  const updated = [...(form.streamingPlatforms || []), { platform: '', status: 'Distribution Pending', url: '' }];
                  setForm({...form, streamingPlatforms: updated});
                }} 
                className="dashboard-btn-secondary px-3 py-1 text-sm"
              >
                Add Platform
              </button>
            </div>
            <div className="space-y-3">
              {(form.streamingPlatforms || []).map((platform, index) => (
                <div key={index} className="p-4 rounded-lg" style={{border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)'}}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <label className="block text-xs font-medium mb-1">Platform Name</label>
                      <input
                        type="text"
                        value={platform.platform}
                        onChange={(e) => {
                          const updated = [...(form.streamingPlatforms || [])];
                          updated[index] = { ...updated[index], platform: e.target.value };
                          setForm({ ...form, streamingPlatforms: updated });
                        }}
                        placeholder="e.g., Spotify, Apple Music"
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Status</label>
                      <select
                        value={platform.status}
                        onChange={(e) => {
                          const updated = [...(form.streamingPlatforms || [])];
                          updated[index] = { ...updated[index], status: e.target.value };
                          setForm({ ...form, streamingPlatforms: updated });
                        }}
                        className="form-input w-full"
                      >
                        <option value="Distribution Pending">Distribution Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Available">Available</option>
                        <option value="Not Planned">Not Planned</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">URL (Optional)</label>
                      <div className="flex items-center gap-2">
                         <input
                           type="text"
                           value={platform.url || ''}
                           onChange={(e) => {
                             const updated = [...(form.streamingPlatforms || [])];
                             updated[index] = { ...updated[index], url: e.target.value };
                             setForm({ ...form, streamingPlatforms: updated });
                           }}
                           placeholder="https://..."
                           className="form-input w-full"
                         />
                         <button
                           type="button"
                           onClick={() => {
                             const updated = [...(form.streamingPlatforms || [])];
                             updated.splice(index, 1);
                             setForm({ ...form, streamingPlatforms: updated });
                           }}
                           className="text-red-500 hover:text-red-400 p-2 font-bold text-lg"
                           title="Remove Platform"
                         >
                           &times;
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!form.streamingPlatforms || form.streamingPlatforms.length === 0) && (
                <div className="text-center py-4">
                  <p className="text-sm text-neutral-500 italic mb-3">No platforms defined.</p>
                  <button 
                    type="button" 
                    className="dashboard-btn-secondary px-4 py-2 text-sm" 
                    onClick={() => {
                      const defaults = [
                        { platform: 'SufiPulse Radio', status: 'Distribution Pending', url: '' },
                        { platform: 'YouTube', status: 'Distribution Pending', url: '' },
                        { platform: 'Spotify', status: 'Distribution Pending', url: '' },
                        { platform: 'Apple Music', status: 'Distribution Pending', url: '' },
                        { platform: 'Instagram', status: 'Distribution Pending', url: '' },
                        { platform: 'X', status: 'Distribution Pending', url: '' },
                        { platform: 'Facebook', status: 'Distribution Pending', url: '' },
                      ];
                      setForm({ ...form, streamingPlatforms: defaults });
                    }}
                  >
                    Auto-Fill Verified Platforms
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div id="features-section">
            <ReleaseFeaturesSection form={form} onCheckboxChange={handleCheckboxChange} />
          </div>

          {/* Public Commentary */}
          <div id="commentary-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{color: 'var(--dash-text-primary)'}}>Commentary Tab Content</h2>
              <button type="button" onClick={addPublicCommentary} className="dashboard-btn-secondary px-3 py-1 text-sm">Add Block</button>
            </div>
            <div className="space-y-3">
              {(form.publicCommentary || []).map((block, index) => (
                <div key={block.id || index} className="p-4 rounded-lg" style={{border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)'}}>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <input
                      type="text"
                      value={block.title || ''}
                      onChange={(e) => updatePublicCommentary(index, 'title', e.target.value)}
                      className="form-input md:col-span-2"
                      placeholder="Block title"
                    />
                    <textarea
                      value={block.content || ''}
                      onChange={(e) => updatePublicCommentary(index, 'content', e.target.value)}
                      className="form-input md:col-span-3"
                      rows={3}
                      placeholder="Commentary text"
                    />
                    <div className="md:col-span-1 flex flex-col gap-2">
                      <label className="inline-flex items-center gap-2 text-xs" style={{color: 'var(--dash-text-primary)'}}>
                        <input
                          type="checkbox"
                          checked={block.isPublished !== false}
                          onChange={(e) => updatePublicCommentary(index, 'isPublished', e.target.checked)}
                          style={{accentColor: 'var(--dash-accent)'}}
                        />
                        Published
                      </label>
                      <button
                        type="button"
                        onClick={() => removePublicCommentary(index)}
                        className="dashboard-btn-danger text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Public Sponsors */}
          <div id="sponsors-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{color: 'var(--dash-text-primary)'}}>Sponsors Tab Content</h2>
              <button type="button" onClick={addPublicSponsor} className="dashboard-btn-secondary px-3 py-1 text-sm">Add Sponsor</button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Intro Text</label>
              <textarea
                value={form.publicSponsorsIntro || ''}
                onChange={(e) => setForm({ ...form, publicSponsorsIntro: e.target.value })}
                className="form-input w-full"
                rows={2}
                placeholder="Sponsors intro paragraph"
              />
            </div>
            <div className="space-y-3">
              {(form.publicSponsors || []).map((sponsor, index) => (
                <div key={sponsor.id || index} className="p-4 rounded-lg space-y-3" style={{border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)'}}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>Sponsor name</label>
                      <input
                        type="text"
                        value={sponsor.name || ''}
                        onChange={(e) => updatePublicSponsor(index, 'name', e.target.value)}
                        className="form-input w-full"
                        placeholder="e.g. SufiPulse Foundation"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>Sponsor role</label>
                      <input
                        type="text"
                        value={sponsor.role || ''}
                        onChange={(e) => updatePublicSponsor(index, 'role', e.target.value)}
                        className="form-input w-full"
                        placeholder="e.g. Principal Sponsor"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>Logo URL <span style={{fontWeight: 'normal'}}>(optional)</span></label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={(sponsor as any).logoUrl || ''}
                        onChange={(e) => updatePublicSponsor(index, 'logoUrl', e.target.value)}
                        className="form-input flex-1"
                        placeholder="https://example.com/logo.png"
                      />
                      {(sponsor as any).logoUrl && (
                        <button
                          type="button"
                          onClick={() => updatePublicSponsor(index, 'logoUrl', '')}
                          className="dashboard-btn-danger px-3 py-2 text-xs whitespace-nowrap"
                        >
                          Remove logo
                        </button>
                      )}
                    </div>
                    {(sponsor as any).logoUrl && (
                      <img
                        src={(sponsor as any).logoUrl}
                        alt={`${sponsor.name} logo preview`}
                        className="mt-2 h-10 rounded object-contain"
                        style={{border: '1px solid var(--dash-border)', background: '#fff', maxWidth: 160}}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer" style={{color: 'var(--dash-text-primary)'}}>
                      <input
                        type="checkbox"
                        checked={sponsor.isPublished !== false}
                        onChange={(e) => updatePublicSponsor(index, 'isPublished', e.target.checked)}
                        style={{accentColor: 'var(--dash-accent)'}}
                      />
                      Published
                    </label>
                    <button type="button" onClick={() => removePublicSponsor(index)} className="dashboard-btn-danger text-sm">Remove sponsor</button>
                  </div>
                </div>
              ))}
              {(form.publicSponsors || []).length === 0 && (
                <p className="text-sm py-4 text-center" style={{color: 'var(--dash-text-muted)'}}>No sponsors added yet. Click "Add Sponsor" to begin.</p>
              )}
            </div>
          </div>

          {/* Public Credits */}
          <div id="credits-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
            <h2 className="text-xl font-semibold mb-6" style={{color: 'var(--dash-text-primary)'}}>Official Credits</h2>

            {/* Artistic Credits */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 pb-1" style={{color: 'var(--dash-accent)', borderBottom: '1px solid var(--dash-border)'}}>
                Artistic Credits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[['leadVocalist','Lead Vocalist'],['lyricist','Lyricist'],['composer','Composer'],['musicProducer','Music Producer'],['backgroundVocals','Background Vocals']].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>{label}</label>
                    <input className="form-input w-full" placeholder={label} value={(form.publicCredits?.artistic as any)?.[key] || ''} onChange={(e) => updatePublicCredits('artistic', key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Production Credits */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 pb-1" style={{color: 'var(--dash-accent)', borderBottom: '1px solid var(--dash-border)'}}>
                Production Credits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[['recordedAt','Recorded at'],['recordingEngineer','Recording Engineer'],['mixMaster','Mix & Master'],['soundDesign','Sound Design']].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>{label}</label>
                    <input className="form-input w-full" placeholder={label} value={(form.publicCredits?.production as any)?.[key] || ''} onChange={(e) => updatePublicCredits('production', key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Credits */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 pb-1" style={{color: 'var(--dash-accent)', borderBottom: '1px solid var(--dash-border)'}}>
                Visual Credits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[['videoDirection','Video Direction'],['editing','Editing'],['thumbnailDesign','Thumbnail Design'],['artwork','Artwork']].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>{label}</label>
                    <input className="form-input w-full" placeholder={label} value={(form.publicCredits?.visual as any)?.[key] || ''} onChange={(e) => updatePublicCredits('visual', key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Literary & Language */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 pb-1" style={{color: 'var(--dash-accent)', borderBottom: '1px solid var(--dash-border)'}}>
                Literary &amp; Language
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[['romanTransliteration','Roman Transliteration'],['englishTranslation','English Translation'],['thematicInterpretation','Thematic Interpretation'],['proofreading','Proofreading']].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>{label}</label>
                    <input className="form-input w-full" placeholder={label} value={(form.publicCredits?.literary as any)?.[key] || ''} onChange={(e) => updatePublicCredits('literary', key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Release & Rights */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 pb-1" style={{color: 'var(--dash-accent)', borderBottom: '1px solid var(--dash-border)'}}>
                Release &amp; Rights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[['publishedBy','Published by'],['platform','Platform'],['registeredReleaseId','Registered Release ID'],['releaseDateText','Release Date'],['copyrightHolder','Copyright Holder'],['licensingText','Licensing / Permissions']].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>{label}</label>
                    <input className="form-input w-full" placeholder={label} value={(form.publicCredits?.rights as any)?.[key] || ''} onChange={(e) => updatePublicCredits('rights', key, e.target.value)} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>Licensing URL</label>
                  <input className="form-input w-full" placeholder="https://sufipulse.com/contact" value={form.publicCredits?.rights?.licensingUrl || ''} onChange={(e) => updatePublicCredits('rights', 'licensingUrl', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Structured Lyrics */}
          <div id="lyrics-structure-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold" style={{color: 'var(--dash-text-primary)'}}>Lyrics System Structure</h2>
              <div className="flex items-center gap-2">
                <select
                  value={selectedLyricsStructureLanguage}
                  onChange={(e) => setSelectedLyricsStructureLanguage(e.target.value)}
                  className="form-input"
                >
                  {(form.availableLanguages || ['en']).map((lang) => (
                    <option key={lang} value={lang}>{getLanguageLabel(lang)}</option>
                  ))}
                </select>
                <button type="button" onClick={addLyricsBlock} className="dashboard-btn-secondary px-3 py-1 text-sm">Add Section</button>
              </div>
            </div>

            <p className="text-sm mb-3" style={{color: 'var(--dash-text-muted)'}}>
              Build lyrics in sections like intro, verse, chorus, bridge, and control per-block publish visibility.
            </p>

            <div className="space-y-3">
              {getLyricsBlocks(selectedLyricsStructureLanguage).length === 0 && (
                <div className="p-3 rounded" style={{border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)', color: 'var(--dash-text-muted)'}}>
                  No structured lyrics blocks for this language yet.
                </div>
              )}

              {getLyricsBlocks(selectedLyricsStructureLanguage).map((block: any, index: number) => (
                <div key={block.id || index} className="p-4 rounded-lg" style={{border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)'}}>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <select
                      value={(block.type || 'verse') as LyricsSectionType}
                      onChange={(e) => updateLyricsBlock(index, 'type', e.target.value)}
                      className="form-input md:col-span-2"
                    >
                      {LYRICS_SECTION_TYPES.map((sectionType) => (
                        <option key={sectionType} value={sectionType}>{sectionType.toUpperCase()}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={block.heading || ''}
                      onChange={(e) => updateLyricsBlock(index, 'heading', e.target.value)}
                      className="form-input md:col-span-4"
                      placeholder="Optional heading (e.g., Verse 1)"
                    />

                    <label className="md:col-span-3 inline-flex items-center gap-2 text-sm" style={{color: 'var(--dash-text-primary)'}}>
                      <input
                        type="checkbox"
                        checked={block.isPublished !== false}
                        onChange={(e) => updateLyricsBlock(index, 'isPublished', e.target.checked)}
                        style={{accentColor: 'var(--dash-accent)'}}
                      />
                      Published block
                    </label>

                    <button type="button" onClick={() => removeLyricsBlock(index)} className="dashboard-btn-danger md:col-span-3 text-sm">Delete Section</button>

                    <textarea
                      value={Array.isArray(block.lines) ? block.lines.join('\n') : ''}
                      onChange={(e) => updateLyricsBlock(index, 'lines', e.target.value)}
                      className="form-input md:col-span-12"
                      rows={4}
                      placeholder="One lyric line per row"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Language Management */}
          <div id="language-management-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold" style={{color: 'var(--dash-text-primary)'}}>Language Management</h2>
                <p className="text-xs mt-1" style={{color: 'var(--dash-text-muted)'}}>Select active languages, add custom ones, set the master language, and configure translation tone per language.</p>
              </div>
              <span className="text-xs px-2 py-1 rounded" style={{backgroundColor: 'var(--dash-bg-hover)', color: 'var(--dash-text-secondary)', border: '1px solid var(--dash-border)'}}>
                {(form.availableLanguages || []).length} active
              </span>
            </div>

            {/* Preset languages grid */}
            <p className="text-xs font-medium mb-2" style={{color: 'var(--dash-text-muted)'}}>PRESET LANGUAGES</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
              {ALL_LANGUAGES.map((lang) => {
                const isActive = (form.availableLanguages || []).includes(lang.code);
                const displayLabel = form.languageLabels?.[lang.code] || lang.label;
                const isEditing = editingLangCode === lang.code;
                return (
                  <div
                    key={lang.code}
                    className="flex flex-col gap-1 px-3 py-2 rounded transition"
                    style={{
                      border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                      backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                    }}
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => {
                          const current = form.availableLanguages || [];
                          const next = e.target.checked
                            ? [...current, lang.code]
                            : current.filter((c) => c !== lang.code);
                          let newDefault = form.defaultLanguage;
                          if (!e.target.checked && form.defaultLanguage === lang.code) {
                            newDefault = next[0] || 'en';
                          }
                          setForm({ ...form, availableLanguages: next, defaultLanguage: newDefault });
                        }}
                        style={{accentColor: 'var(--dash-accent)'}}
                      />
                      <span className="text-sm font-medium" style={{color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)'}}>{displayLabel}</span>
                      <span className="text-xs ml-auto" style={{color: 'var(--dash-text-muted)'}}>{lang.code}</span>
                    </label>
                    {isActive && (
                      isEditing ? (
                        <div className="flex gap-1 mt-1">
                          <input
                            type="text"
                            value={editingLangNewLabel}
                            onChange={(e) => setEditingLangNewLabel(e.target.value)}
                            className="form-input text-xs flex-1"
                            placeholder="New label"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveLanguageLabel(lang.code, editingLangNewLabel);
                              if (e.key === 'Escape') { setEditingLangCode(null); setEditingLangNewLabel(''); }
                            }}
                          />
                          <button type="button" onClick={() => saveLanguageLabel(lang.code, editingLangNewLabel)} className="dashboard-btn-primary px-2 py-1 text-xs">G��</button>
                          <button type="button" onClick={() => { setEditingLangCode(null); setEditingLangNewLabel(''); }} className="dashboard-btn-secondary px-2 py-1 text-xs">G��</button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setEditingLangCode(lang.code); setEditingLangNewLabel(displayLabel); }}
                          className="text-xs text-left mt-1"
                          style={{color: 'var(--dash-text-muted)'}}
                        >
                          G�� Rename label
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom languages */}
            {(form.customLanguages || []).length > 0 && (
              <>
                <p className="text-xs font-medium mb-2" style={{color: 'var(--dash-text-muted)'}}>CUSTOM LANGUAGES</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                  {(form.customLanguages || []).map((lang) => {
                    const isActive = (form.availableLanguages || []).includes(lang.code);
                    const displayLabel = form.languageLabels?.[lang.code] || lang.label;
                    const isEditing = editingLangCode === lang.code;
                    return (
                      <div
                        key={lang.code}
                        className="flex flex-col gap-1 px-3 py-2 rounded transition"
                        style={{
                          border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                          backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                        }}
                      >
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => {
                              const current = form.availableLanguages || [];
                              const next = e.target.checked
                                ? [...current, lang.code]
                                : current.filter((c) => c !== lang.code);
                              let newDefault = form.defaultLanguage;
                              if (!e.target.checked && form.defaultLanguage === lang.code) {
                                newDefault = next[0] || 'en';
                              }
                              setForm({ ...form, availableLanguages: next, defaultLanguage: newDefault });
                            }}
                            style={{accentColor: 'var(--dash-accent)'}}
                          />
                          <span className="text-sm font-medium" style={{color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)'}}>{displayLabel}</span>
                          <span className="text-xs ml-auto" style={{color: 'var(--dash-text-muted)'}}>{lang.code}</span>
                        </label>
                        <div className="flex gap-1 mt-1">
                          {isEditing ? (
                            <>
                              <input
                                type="text"
                                value={editingLangNewLabel}
                                onChange={(e) => setEditingLangNewLabel(e.target.value)}
                                className="form-input text-xs flex-1"
                                placeholder="New label"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveLanguageLabel(lang.code, editingLangNewLabel);
                                  if (e.key === 'Escape') { setEditingLangCode(null); setEditingLangNewLabel(''); }
                                }}
                              />
                              <button type="button" onClick={() => saveLanguageLabel(lang.code, editingLangNewLabel)} className="dashboard-btn-primary px-2 py-1 text-xs">G��</button>
                              <button type="button" onClick={() => { setEditingLangCode(null); setEditingLangNewLabel(''); }} className="dashboard-btn-secondary px-2 py-1 text-xs">G��</button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => { setEditingLangCode(lang.code); setEditingLangNewLabel(displayLabel); }}
                                className="text-xs flex-1 text-left"
                                style={{color: 'var(--dash-text-muted)'}}
                              >
                                G�� Rename
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteCustomLanguage(lang.code)}
                                className="text-xs"
                                style={{color: 'var(--dash-status-rejected)'}}
                                title="Delete this custom language"
                              >
                                =���
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Add custom language */}
            <div className="p-3 rounded-lg mb-4" style={{border: '1px dashed var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)'}}>
              <p className="text-xs font-medium mb-2" style={{color: 'var(--dash-text-muted)'}}>ADD CUSTOM LANGUAGE</p>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={customLangCode}
                  onChange={(e) => setCustomLangCode(e.target.value)}
                  className="form-input text-sm"
                  style={{width: 120}}
                  placeholder="Code (e.g. dg)"
                />
                <input
                  type="text"
                  value={customLangLabel}
                  onChange={(e) => setCustomLangLabel(e.target.value)}
                  className="form-input text-sm flex-1"
                  placeholder="Language name (e.g. Dogri)"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomLanguage(); } }}
                />
                <button
                  type="button"
                  onClick={addCustomLanguage}
                  disabled={!customLangCode.trim() || !customLangLabel.trim()}
                  className="dashboard-btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                >
                  + Add Language
                </button>
              </div>
            </div>

            {/* Master language + tone per active language */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>Default / Master Language</label>
                <p className="text-xs mb-2" style={{color: 'var(--dash-text-muted)'}}>The master language holds the authoritative subtitle timestamps. All other languages follow these timings.</p>
                <select
                  name="defaultLanguage"
                  value={form.defaultLanguage || 'en'}
                  onChange={handleInputChange}
                  className="form-input"
                  style={{width: '100%'}}
                >
                  {(form.availableLanguages || ['en']).map((code) => (
                    <option key={code} value={code}>{getLanguageLabel(code)} ({code})</option>
                  ))}
                </select>
              </div>

              {(form.availableLanguages || []).filter((c) => c !== form.defaultLanguage).length > 0 && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>Translation Tone per Language</label>
                  <p className="text-xs mb-2" style={{color: 'var(--dash-text-muted)'}}>Tone guides auto-translation style. Mystic / Poetic tones suggest reverent translations; Literal gives word-for-word accuracy.</p>
                  <div className="space-y-2">
                    {(form.availableLanguages || []).filter((c) => c !== form.defaultLanguage).map((code) => (
                      <div key={code} className="flex items-center gap-2">
                        <span className="text-sm min-w-[120px]" style={{color: 'var(--dash-text-primary)'}}>{getLanguageLabel(code)}</span>
                        <select
                          value={form.translationTone?.[code] || 'literal'}
                          onChange={(e) => setLanguageTone(code, e.target.value)}
                          className="form-input text-sm flex-1"
                        >
                          <option value="literal">Literal G�� word-for-word accuracy</option>
                          <option value="mystic">Mystic G�� spiritual / Sufi essence</option>
                          <option value="poetic">Poetic G�� lyrical and flowing</option>
                          <option value="scholarly">Scholarly G�� academic precision</option>
                          <option value="contemporary">Contemporary G�� modern everyday language</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subtitle Timeline + Language Tracks */}
          <div id="subtitle-timeline-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
              <h2 className="text-xl font-semibold" style={{color: 'var(--dash-text-primary)'}}>Subtitle Timeline & Language Tracks</h2>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-80 cursor-pointer text-sm transition" style={{border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)'}}>
                  <Upload size={16} />
                  Import SRT/VTT/ASS
                  <input
                    type="file"
                    accept=".srt,.vtt,.ass"
                    className="hidden"
                    onChange={handleImportSubtitleFile}
                  />
                </label>
                <button
                  type="button"
                  onClick={addCue}
                  className="dashboard-btn-primary inline-flex items-center gap-2 px-3 py-2"
                >
                  <Plus size={16} /> Add Cue
                </button>
                <button
                  type="button"
                  onClick={loadLyricsIntoCuePlaceholders}
                  className="dashboard-btn-secondary inline-flex items-center gap-2 px-3 py-2"
                  title="Open lyrics placeholder panel and sync into subtitle cues"
                >
                  Use Lyrics Placeholders
                </button>
              </div>
            </div>

            {lyricsPlaceholderOpen && (
              <div className="mb-4 rounded-lg p-3 space-y-3" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)' }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="text-sm" style={{ color: 'var(--dash-text-primary)' }}>
                    Lyrics Placeholder Panel ({getLanguageLabel(selectedLyricsStructureLanguage || form.defaultLanguage || 'en')} {'->'} {getLanguageLabel(selectedSubtitleLanguage || form.defaultLanguage || 'en')})
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById('lyrics-structure-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      className="dashboard-btn-secondary px-3 py-1 text-xs"
                    >
                      Go To Lyrics Structure
                    </button>
                    <button
                      type="button"
                      onClick={() => setLyricsPlaceholderOpen(false)}
                      className="dashboard-btn-secondary px-3 py-1 text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {lyricsPlaceholderNote && (
                  <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>{lyricsPlaceholderNote}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--dash-text-muted)' }}>Load Scope</label>
                    <select
                      value={lyricsPlaceholderScope}
                      onChange={(e) => setLyricsPlaceholderScope(e.target.value as 'all' | 'published' | 'single')}
                      className="form-input"
                    >
                      <option value="all">All Blocks ({getLyricsBlocks(selectedLyricsStructureLanguage || form.defaultLanguage || 'en').length})</option>
                      <option value="published">Published Blocks Only</option>
                      <option value="single">Single Block</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs mb-1" style={{ color: 'var(--dash-text-muted)' }}>Specific Block</label>
                    <select
                      value={lyricsPlaceholderBlockId}
                      onChange={(e) => setLyricsPlaceholderBlockId(e.target.value)}
                      className="form-input"
                      disabled={lyricsPlaceholderScope !== 'single'}
                    >
                      <option value="">Select block...</option>
                      {getLyricsBlocks(selectedLyricsStructureLanguage || form.defaultLanguage || 'en').map((block: any, index: number) => (
                        <option key={block.id || index} value={String(block.id || '')}>
                          {(block.heading || `${String(block.type || 'section').toUpperCase()} ${index + 1}`)} ({Array.isArray(block.lines) ? block.lines.length : 0} lines)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <textarea
                  value={lyricsPlaceholderDraft}
                  onChange={(e) => setLyricsPlaceholderDraft(e.target.value)}
                  rows={6}
                  className="form-input w-full"
                  placeholder="Paste one lyric line per row. Click Apply to create/update cues and subtitle text."
                />

                <div className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>
                  Placeholder lines: {lyricsPlaceholderDraft.split('\n').map((line) => line.trim()).filter(Boolean).length}
                </div>

                <label className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={lyricsPlaceholderSyncLineRef}
                    onChange={(e) => setLyricsPlaceholderSyncLineRef(e.target.checked)}
                    style={{ accentColor: 'var(--dash-accent)' }}
                  />
                  Sync cue lineRef as ordered labels (L001, L002, ...)
                </label>

                <div className="rounded p-2" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-primary)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--dash-text-muted)' }}>
                    Order Preview (line 1 {'->'} cue 1, line 2 {'->'} cue 2, ...)
                  </div>
                  <div className="max-h-32 overflow-auto text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
                    {lyricsPlaceholderDraft.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 20).map((line, index) => (
                      <div key={`placeholder-order-${index}`} className="py-0.5">
                        {index + 1}. {line}
                      </div>
                    ))}
                    {lyricsPlaceholderDraft.split('\n').map((line) => line.trim()).filter(Boolean).length > 20 && (
                      <div style={{ color: 'var(--dash-text-muted)' }}>
                        ...and {lyricsPlaceholderDraft.split('\n').map((line) => line.trim()).filter(Boolean).length - 20} more
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={loadLyricsIntoCuePlaceholders}
                    className="dashboard-btn-secondary px-3 py-1.5 text-sm"
                  >
                    Reload From Lyrics Blocks
                  </button>
                  <button
                    type="button"
                    onClick={applyLyricsPlaceholderDraft}
                    className="dashboard-btn-primary px-3 py-1.5 text-sm"
                  >
                    Apply Placeholder Lines
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Master Timing Version</label>
                <input
                  type="number"
                  name="masterTimingVersion"
                  value={form.masterTimingVersion || 1}
                  onChange={handleInputChange}
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Active Language</label>
                <select
                  value={selectedSubtitleLanguage}
                  onChange={(e) => setSelectedSubtitleLanguage(e.target.value)}
                  className="form-input w-full"
                >
                  {(form.availableLanguages || ['en']).map((lang) => (
                    <option key={lang} value={lang}>{getLanguageLabel(lang)} ({lang})</option>
                  ))}
                </select>
                {selectedSubtitleLanguage !== (form.defaultLanguage || 'en') && (
                  <button
                    type="button"
                    onClick={() => autoTranslateLanguage(selectedSubtitleLanguage)}
                    disabled={autoTranslatingLang === selectedSubtitleLanguage}
                    className="mt-2 w-full dashboard-btn-secondary px-3 py-1 text-xs disabled:opacity-50"
                    title={`Auto-translate all cues from master language (${getLanguageLabel(form.defaultLanguage || 'en')}) to ${getLanguageLabel(selectedSubtitleLanguage)}`}
                  >
                    {autoTranslatingLang === selectedSubtitleLanguage
                      ? 'GŦ TranslatingGǪ'
                      : `G�� Auto-translate from ${getLanguageLabel(form.defaultLanguage || 'en')}`}
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Reference (Master) Language</label>
                <select
                  value={referenceLanguage}
                  onChange={(e) => setReferenceLanguage(e.target.value)}
                  className="form-input w-full"
                >
                  {(form.availableLanguages || ['en']).map((lang) => (
                    <option key={lang} value={lang}>{getLanguageLabel(lang)} ({lang})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Language Status</label>
                <select
                  value={form.subtitleLanguageStatuses?.[selectedSubtitleLanguage] || 'draft'}
                  onChange={(e) => setLanguageStatus(selectedSubtitleLanguage, e.target.value as SubtitleStatus)}
                  className="form-input w-full"
                >
                  <option value="draft">Draft</option>
                  <option value="in_translation">In Translation</option>
                  <option value="under_review">Under Review</option>
                  <option value="verified">Verified</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Translator</label>
                <input
                  type="text"
                  value={form.subtitleLanguageAssignments?.[selectedSubtitleLanguage]?.translator || ''}
                  onChange={(e) => setLanguageAssignee(selectedSubtitleLanguage, 'translator', e.target.value)}
                  className="form-input w-full"
                  placeholder="Assigned translator"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Reviewer</label>
                <input
                  type="text"
                  value={form.subtitleLanguageAssignments?.[selectedSubtitleLanguage]?.reviewer || ''}
                  onChange={(e) => setLanguageAssignee(selectedSubtitleLanguage, 'reviewer', e.target.value)}
                  className="form-input w-full"
                  placeholder="Assigned reviewer"
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer" style={{color: 'var(--dash-text-primary)'}}>
                  <input
                    type="checkbox"
                    checked={sideBySideMode}
                    onChange={(e) => setSideBySideMode(e.target.checked)}
                    style={{accentColor: 'var(--dash-accent)'}}
                  />
                  Side-by-side translation mode
                </label>
              </div>
            </div>

            <div className="mb-6 rounded-lg p-4 space-y-4" style={{border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)'}}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h3 className="text-sm font-semibold" style={{color: 'var(--dash-text-primary)'}}>ASS Style Library & Location Control</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyCueMetadataToAllCues(
                      {
                        styleName: activeStyleName,
                        alignment: Number(activeStyle.alignment || 2),
                      },
                      {
                        successMessage: `Applied ${activeStyleName} style to all cues.`,
                        defaultStyleName: activeStyleName,
                        defaultAlignment: Number(activeStyle.alignment || 2),
                        language: selectedSubtitleLanguage,
                      }
                    )}
                    className="dashboard-btn-secondary px-2 py-1 text-xs"
                  >
                    Apply To All Cues
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCueMetadataToAllCues({}, {
                      clearPosition: true,
                      successMessage: 'Cleared position overrides for all cues.',
                    })}
                    className="dashboard-btn-secondary px-2 py-1 text-xs"
                  >
                    Clear All Positions
                  </button>
                  <button
                    type="button"
                    onClick={addStylePack}
                    className="dashboard-btn-primary px-2 py-1 text-xs"
                  >
                    Add Style
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStylePack(activeStyleName)}
                    disabled={activeStyleName === DEFAULT_STYLE_NAME}
                    className="dashboard-btn-danger px-2 py-1 text-xs disabled:opacity-50"
                  >
                    Delete Style
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Selected Style</label>
                  <select
                    value={activeStyleName}
                    onChange={(e) => setSelectedStyleName(e.target.value)}
                    className="form-input w-full"
                  >
                    {styleNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Style Name</label>
                  <input
                    type="text"
                    value={activeStyleName}
                    onChange={(e) => {
                      const nextName = e.target.value.trim();
                      if (!nextName || nextName === activeStyleName) return;
                      const packs = { ...(form.subtitleStylePacks || {}) } as Record<string, ASSStylePack>;
                      packs[nextName] = packs[activeStyleName] || { ...DEFAULT_STYLE_PACK };
                      delete packs[activeStyleName];
                      setForm({ ...form, subtitleStylePacks: packs });
                      setSelectedStyleName(nextName);
                    }}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Language Default Style</label>
                  <select
                    value={form.languageStyleOverrides?.[selectedSubtitleLanguage]?.stylePack || ''}
                    onChange={(e) => setLanguageStylePack(selectedSubtitleLanguage, e.target.value)}
                    className="form-input w-full"
                  >
                    <option value="">None</option>
                    {styleNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Alignment</label>
                  <select
                    value={activeStyle.alignment || 2}
                    onChange={(e) => updateStylePack(activeStyleName, { alignment: Number(e.target.value) })}
                    className="form-input w-full"
                  >
                    <option value={1}>Bottom Left (1)</option>
                    <option value={2}>Bottom Center (2)</option>
                    <option value={3}>Bottom Right (3)</option>
                    <option value={4}>Middle Left (4)</option>
                    <option value={5}>Middle Center (5)</option>
                    <option value={6}>Middle Right (6)</option>
                    <option value={7}>Top Left (7)</option>
                    <option value={8}>Top Center (8)</option>
                    <option value={9}>Top Right (9)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Font</label>
                  <input
                    type="text"
                    value={activeStyle.fontFamily || ''}
                    onChange={(e) => updateStylePack(activeStyleName, { fontFamily: e.target.value })}
                    className="form-input"
                    placeholder="Font family"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Size</label>
                  <input
                    type="number"
                    value={activeStyle.fontSize || 42}
                    onChange={(e) => updateStylePack(activeStyleName, { fontSize: Number(e.target.value || 42) })}
                    className="form-input"
                    placeholder="Font size"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Text Color</label>
                  <input
                    type="color"
                    value={activeStyle.primaryColor || '#FFFFFF'}
                    onChange={(e) => updateStylePack(activeStyleName, { primaryColor: e.target.value })}
                    className="h-10 w-full px-1 py-1 rounded"
                    style={{border: '1px solid var(--dash-border)'}}
                    title="Primary color"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Outline Color</label>
                  <input
                    type="color"
                    value={activeStyle.outlineColor || '#202020'}
                    onChange={(e) => updateStylePack(activeStyleName, { outlineColor: e.target.value })}
                    className="h-10 w-full px-1 py-1 rounded"
                    style={{border: '1px solid var(--dash-border)'}}
                    title="Outline color"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Background</label>
                  <input
                    type="color"
                    value={activeStyle.backColor || '#000000'}
                    onChange={(e) => updateStylePack(activeStyleName, { backColor: e.target.value })}
                    className="h-10 w-full px-1 py-1 rounded"
                    style={{border: '1px solid var(--dash-border)'}}
                    title="Background color"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Outline</label>
                  <input
                    type="number"
                    value={activeStyle.outline || 2}
                    onChange={(e) => updateStylePack(activeStyleName, { outline: Number(e.target.value || 0) })}
                    className="form-input"
                    placeholder="Outline"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Shadow</label>
                  <input
                    type="number"
                    value={activeStyle.shadow || 0}
                    onChange={(e) => updateStylePack(activeStyleName, { shadow: Number(e.target.value || 0) })}
                    className="form-input"
                    placeholder="Shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Margin L</label>
                  <input
                    type="number"
                    value={activeStyle.marginL || 40}
                    onChange={(e) => updateStylePack(activeStyleName, { marginL: Number(e.target.value || 0) })}
                    className="form-input"
                    placeholder="Margin L"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Margin R</label>
                  <input
                    type="number"
                    value={activeStyle.marginR || 40}
                    onChange={(e) => updateStylePack(activeStyleName, { marginR: Number(e.target.value || 0) })}
                    className="form-input"
                    placeholder="Margin R"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Margin V</label>
                  <input
                    type="number"
                    value={activeStyle.marginV || 28}
                    onChange={(e) => updateStylePack(activeStyleName, { marginV: Number(e.target.value || 0) })}
                    className="form-input"
                    placeholder="Margin V"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Panel Width % (30-200)</label>
                  <input
                    type="number"
                    min={30}
                    max={200}
                    value={activeStyle.maxWidthPercent || 82}
                    onChange={(e) => updateStylePack(activeStyleName, { maxWidthPercent: Number(e.target.value || 82) })}
                    className="form-input"
                    placeholder="Panel width %"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Panel Width Slider</label>
                  <input
                    type="range"
                    min={30}
                    max={200}
                    step={1}
                    value={Math.max(30, Math.min(200, Number(activeStyle.maxWidthPercent || 82)))}
                    onChange={(e) => updateStylePack(activeStyleName, { maxWidthPercent: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <button
                    type="button"
                    onClick={() => applyCueMetadataToAllCues({ alignment: 2 }, { successMessage: 'Set all cues to Bottom Center.' })}
                    className="dashboard-btn-secondary px-2 py-1 text-xs"
                  >
                    Bottom Center Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCueMetadataToAllCues({ alignment: 8 }, { successMessage: 'Set all cues to Top Center.' })}
                    className="dashboard-btn-secondary px-2 py-1 text-xs"
                  >
                    Top Center Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCueMetadataToAllCues({ alignment: 5 }, { successMessage: 'Set all cues to Middle Center.' })}
                    className="dashboard-btn-secondary px-2 py-1 text-xs"
                  >
                    Middle Center Preset
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <label className="inline-flex items-center gap-2" style={{color: 'var(--dash-text-primary)'}}>
                  <input
                    type="checkbox"
                    checked={!!activeStyle.bold}
                    onChange={(e) => updateStylePack(activeStyleName, { bold: e.target.checked })}
                    style={{accentColor: 'var(--dash-accent)'}}
                  />
                  Bold
                </label>
                <label className="inline-flex items-center gap-2" style={{color: 'var(--dash-text-primary)'}}>
                  <input
                    type="checkbox"
                    checked={!!activeStyle.italic}
                    onChange={(e) => updateStylePack(activeStyleName, { italic: e.target.checked })}
                    style={{accentColor: 'var(--dash-accent)'}}
                  />
                  Italic
                </label>
              </div>
            </div>

            <LiveAssPreviewSection
              form={form}
              timelineRef={timelineRef}
              previewCanvasRef={previewCanvasRef}
              previewYouTubeIframeRef={previewYouTubeIframeRef}
              previewStyleName={previewStyleName}
              previewAlignment={previewAlignment}
              previewPlaying={previewPlaying}
              setPreviewPlaying={setPreviewPlaying}
              previewHasYouTube={previewHasYouTube}
              previewTime={previewTime}
              setPreviewTime={setPreviewTime}
              sendPreviewYouTubeCommand={sendPreviewYouTubeCommand}
              previewDuration={previewDuration}
              handleTimelineClick={handleTimelineClick}
              handleTimelinePointerDown={handleTimelinePointerDown}
              formatPreviewSeconds={formatPreviewSeconds}
              showSafeGuides={showSafeGuides}
              setShowSafeGuides={setShowSafeGuides}
              previewCue={previewCue}
              setPreviewCueId={(id) => setPreviewCueId(id)}
              previewYouTubeId={previewYouTubeId}
              previewOrigin={previewOrigin}
              bootstrapPreviewYouTubePlayer={bootstrapPreviewYouTubePlayer}
              handlePreviewInfoDrag={handlePreviewInfoDrag}
              previewInfoPosition={previewInfoPosition}
              previewInfoWidth={previewInfoWidth}
              handlePreviewInfoResize={handlePreviewInfoResize}
              selectedSubtitleLanguage={selectedSubtitleLanguage}
              handlePreviewDrag={handlePreviewDrag}
              previewPosition={previewPosition}
              previewAnchor={previewAnchor}
              previewCanvasWidth={previewCanvasWidth}
              previewStyle={previewStyle}
              previewTextLines={previewTextLines}
              handlePreviewResize={handlePreviewResize}
              previewCueMetadata={previewCueMetadata}
              lockAllCuePositions={lockAllCuePositions}
              setLockAllCuePositions={setLockAllCuePositions}
              applyCueMetadataToAllCues={applyCueMetadataToAllCues}
              updateCue={updateCue}
              autoAdvanceAfterStamp={autoAdvanceAfterStamp}
              setAutoAdvanceAfterStamp={setAutoAdvanceAfterStamp}
            />

            {(!form.subtitleCues || form.subtitleCues.length === 0) ? (
              <div className="text-sm p-4 rounded-lg" style={{color: 'var(--dash-text-muted)', border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)'}}>
                No cues yet. Add cues to build a single master timeline shared across all languages.
              </div>
            ) : (
              <div className="space-y-4">
                <SubtitleBulkControlsSection
                  subtitleCueIds={(form.subtitleCues || []).map((cue) => cue.id)}
                  selectedCueIds={selectedCueIds}
                  setSelectedCueIds={setSelectedCueIds}
                  duplicateSelectedCues={duplicateSelectedCues}
                  deletSelectedCues={deletSelectedCues}
                  deleteAllCues={deleteAllCues}
                  shiftTimingOffset={shiftTimingOffset}
                  setShiftTimingOffset={setShiftTimingOffset}
                  shiftAllCueTiming={shiftAllCueTiming}
                  bulkKaraokeEffect={bulkKaraokeEffect}
                  setBulkKaraokeEffect={setBulkKaraokeEffect}
                  bulkKaraokeDurationsMs={bulkKaraokeDurationsMs}
                  setBulkKaraokeDurationsMs={setBulkKaraokeDurationsMs}
                  applyKaraokeToAllCues={applyKaraokeToAllCues}
                />

                {/* Cues List */}
                <SubtitleCueListSection
                  form={form}
                  selectedSubtitleLanguage={selectedSubtitleLanguage}
                  referenceLanguage={referenceLanguage}
                  sideBySideMode={sideBySideMode}
                  styleNames={styleNames}
                  selectedCueIds={selectedCueIds}
                  previewCueId={previewCue?.id || null}
                  setPreviewCueId={(id) => setPreviewCueId(id)}
                  setSelectedCueIds={setSelectedCueIds}
                  updateCue={updateCue}
                  setCueTranslation={setCueTranslation}
                  deleteCue={deleteCue}
                  acceptCueTranslation={acceptCueTranslation}
                  setCueMetadata={setCueMetadata}
                />
              </div>
            )}

            <ReviewLogSection
              form={form}
              selectedSubtitleLanguage={selectedSubtitleLanguage}
              reviewActor={reviewActor}
              setReviewActor={setReviewActor}
              reviewComment={reviewComment}
              setReviewComment={setReviewComment}
              addReviewLog={addReviewLog}
            />

            {!isNew && (
              <DeliveryPanelSection
                form={form}
                manualUploadActor={manualUploadActor}
                setManualUploadActor={setManualUploadActor}
                manualUploadNotes={manualUploadNotes}
                setManualUploadNotes={setManualUploadNotes}
                subtitleExportLanguages={subtitleExportLanguages}
                exportingZip={exportingZip}
                youtubeSyncing={youtubeSyncing}
                youtubeIntegrationStatus={youtubeIntegrationStatus}
                getTrackMeta={getTrackMeta}
                toggleWebPublishState={toggleWebPublishState}
                openPublicReleasePreview={openPublicReleasePreview}
                updateReadinessState={updateReadinessState}
                setForm={setForm}
                exportAllSubtitlesZip={exportAllSubtitlesZip}
                copySubtitleNamingConvention={copySubtitleNamingConvention}
                syncYouTubeSubtitles={syncYouTubeSubtitles}
                exportSubtitleByLanguage={exportSubtitleByLanguage}
                markManualDeliveryState={markManualDeliveryState}
                updateTrackMeta={updateTrackMeta}
              />
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || !hasUnsavedChanges && !isNew}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition font-medium disabled:opacity-60 ${
                hasUnsavedChanges || isNew
                  ? 'dashboard-btn-primary'
                  : 'dashboard-btn-secondary'
              }`}
              title={hasUnsavedChanges ? 'Save changes (Ctrl+S)' : 'No changes to save'}
            >
              <Save size={20} />
              {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}
            </button>
            <Link href="/admin/cms-releases">
              <button type="button" className="dashboard-btn-secondary px-6 py-2">
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

