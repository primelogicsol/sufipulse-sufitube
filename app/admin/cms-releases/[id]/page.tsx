"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, Upload, Youtube, CheckSquare, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
import { ASSStyleLibrarySection } from './ass-style-library-section';
import { ReleaseCreditsSection } from './release-credits-section';
import { SubtitleBulkControlsSection } from './subtitle-bulk-controls-section';
import { WorkflowAssistantSection } from './workflow-assistant-section';
import { SocialShareKitSection } from './social-share-kit-section';
import { ReleaseStreamingSection } from './release-streaming-section';
import { getDefaultDistribution, type PlatformDistribution } from '@/lib/cms-storage';
import { useReleaseForm, SAMPLE_PREVIEW_DURATION_SECONDS } from './use-release-form';
import {
  REGIONS,
  DIASPORA_MARKETS,
  LANGUAGES,
  SUFI_CONCEPTS,
  SPIRITUAL_THEMES,
  MOODS
} from '@/lib/cms-taxonomy';
import DashboardLayout from '../../../components/layout/DashboardLayout';
export default function EditReleasePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const isAdmin = user?.role.includes('admin') ?? false;

  useEffect(() => {
    if (!isAdmin) router.push('/admin');
  }, [user]);

  const {
    form, setForm,
    originalForm,
    clearAutosave,
    recoverAutosave,
    hasUnsavedChanges,
    loading, notFound,
    saving,
    exportingZip,
    youtubeSyncing,
    errorMessage, setErrorMessage,
    successMessage, setSuccessMessage,
    fieldErrors,
    carryForwardNotice,
    allReleases,
    previewCanvasRef,
    previewYouTubeIframeRef,
    timelineRef,
    selectedSubtitleLanguage, setSelectedSubtitleLanguage,
    selectedLyricsStructureLanguage, setSelectedLyricsStructureLanguage,
    referenceLanguage, setReferenceLanguage,
    sideBySideMode, setSideBySideMode,
    selectedStyleName, setSelectedStyleName,
    autoTranslatingLang,
    previewCueId, setPreviewCueId,
    previewPanelPosition,
    previewInfoPosition,
    previewInfoWidth,
    previewCanvasWidth,
    previewTime, setPreviewTime,
    previewPlaying, setPreviewPlaying,
    lockAllCuePositions, setLockAllCuePositions,
    previewVideoDuration,
    previewOrigin,
    showSafeGuides, setShowSafeGuides,
    autoAdvanceAfterStamp, setAutoAdvanceAfterStamp,
    reviewActor, setReviewActor,
    reviewComment, setReviewComment,
    manualUploadActor, setManualUploadActor,
    manualUploadNotes, setManualUploadNotes,
    selectedCueIds, setSelectedCueIds,
    shiftTimingOffset, setShiftTimingOffset,
    bulkKaraokeEffect, setBulkKaraokeEffect,
    bulkKaraokeDurationsMs, setBulkKaraokeDurationsMs,
    lyricsPlaceholderOpen, setLyricsPlaceholderOpen,
    lyricsPlaceholderDraft, setLyricsPlaceholderDraft,
    lyricsPlaceholderNote,
    lyricsPlaceholderScope, setLyricsPlaceholderScope,
    lyricsPlaceholderBlockId, setLyricsPlaceholderBlockId,
    lyricsPlaceholderSyncLineRef, setLyricsPlaceholderSyncLineRef,
    youtubeIntegrationStatus,
    fetchedYouTubeChannel,
    youtubeChannelLookupLoading,
    expandedWorkflowStepId, setExpandedWorkflowStepId,
    handleSubmit,
    handleInputChange,
    handleCheckboxChange,
    generateSlug,
    handleYouTubePaste,
    applyFetchedChannelDefaults,
    applyCarryForwardToCurrentForm,
    fieldRefs,
    getLyricsBlocks,
    addLyricsBlock,
    updateLyricsBlock,
    removeLyricsBlock,
    loadLyricsIntoCuePlaceholders,
    applyLyricsPlaceholderDraft,
    addCue,
    updateCue,
    deleteCue,
    setCueTranslation,
    acceptCueTranslation,
    setCueMetadata,
    applyCueMetadataToAllCues,
    duplicateSelectedCues,
    deletSelectedCues,
    deleteAllCues,
    shiftAllCueTiming,
    applyKaraokeToAllCues,
    updateStylePack,
    addStylePack,
    removeStylePack,
    setLanguageStylePack,
    getLanguageLabel,
    addCustomLanguage,
    deleteCustomLanguage,
    normalizeLanguageCode,
    saveLanguageLabel,
    setLanguageTone,
    setLanguageStatus,
    setLanguageAssignee,
    addReviewLog,
    autoTranslateLanguage,
    handleImportSubtitleFile,
    sendPreviewYouTubeCommand,
    bootstrapPreviewYouTubePlayer,
    handlePreviewDrag,
    handlePreviewInfoDrag,
    handlePreviewInfoResize,
    handlePreviewResize,
    handleTimelineClick,
    handleTimelinePointerDown,
    addPublicCommentary,
    updatePublicCommentary,
    removePublicCommentary,
    addPublicSponsor,
    updatePublicSponsor,
    removePublicSponsor,
    updatePublicCredits,
    getSubtitleExportLanguages,
    getTrackMeta,
    toggleWebPublishState,
    updateReadinessState,
    updateTrackMeta,
    markManualDeliveryState,
    exportSubtitleByLanguage,
    exportAllSubtitlesZip,
    syncYouTubeSubtitles,
    openPublicReleasePreview,
    copySubtitleNamingConvention,
    runWorkflowAction,
  } = useReleaseForm({
    releaseId: params.id as string,
    isNew,
    ready: isAdmin,
    onNavigate: (path) => router.push(path),
  });

  // UI-only state — not persisted, not in the hook
  const [customLangCode, setCustomLangCode] = useState('');
  const [customLangLabel, setCustomLangLabel] = useState('');
  const [editingLangCode, setEditingLangCode] = useState<string | null>(null);
  const [editingLangNewLabel, setEditingLangNewLabel] = useState('');

  const handleAddCustomLanguage = () => {
    const code = normalizeLanguageCode(customLangCode);
    const ok = addCustomLanguage(code, customLangLabel.trim());
    if (ok) { setCustomLangCode(''); setCustomLangLabel(''); }
  };

  const updateDistribution = (platformId: string, patch: Partial<PlatformDistribution>) => {
    setForm((prev) => {
      const dist = prev.distribution || getDefaultDistribution();
      return {
        ...prev,
        distribution: {
          ...dist,
          [platformId]: {
            ...dist[platformId],
            ...patch,
            updatedAt: new Date().toISOString()
          }
        }
      };
    });
  };

  // ── Import Captions modal state ───────────────────────────────────────────
  type CaptionTrack = { id: string; language: string; name: string; trackKind: string; isDraft: boolean };
  const [captionModalOpen, setCaptionModalOpen] = useState(false);
  const [captionSource, setCaptionSource] = useState<'youtube' | 'video'>('youtube');
  const [captionTracks, setCaptionTracks] = useState<CaptionTrack[]>([]);
  const [captionTracksLoading, setCaptionTracksLoading] = useState(false);
  const [captionTracksError, setCaptionTracksError] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [captionImportMode, setCaptionImportMode] = useState<'replace' | 'merge'>('replace');
  const [captionImporting, setCaptionImporting] = useState(false);
  const [videoOcrFile, setVideoOcrFile] = useState<File | null>(null);
  const [videoOcrLang, setVideoOcrLang] = useState<string>(form.defaultLanguage || 'en');
  const [videoOcrMode, setVideoOcrMode] = useState<'replace' | 'merge'>('replace');
  const [videoOcrProgress, setVideoOcrProgress] = useState<{ stage: string; pct: number; detail: string } | null>(null);
  const [videoOcrError, setVideoOcrError] = useState<string | null>(null);
  const [videoOcrRunning, setVideoOcrRunning] = useState(false);

  const handleOpenCaptionModal = async () => {
    const rid = params.id as string;
    setCaptionModalOpen(true);
    setCaptionSource('youtube');
    setCaptionTracksError(null);
    setCaptionTracks([]);
    setSelectedTrackId('');
    setCaptionTracksLoading(true);
    try {
      const res = await fetch(`/api/releases/${rid}/import-captions`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to list caption tracks');
      setCaptionTracks(data.tracks || []);
      if (data.tracks?.length) setSelectedTrackId(data.tracks[0].id);
    } catch (err: any) {
      setCaptionTracksError(err.message);
      // If credentials simply aren't configured, skip the error state and go straight to video OCR
      if (/OAuth credentials|YOUTUBE_OAUTH/i.test(err.message)) {
        setCaptionSource('video');
        setCaptionTracksError(null);
      }
    } finally {
      setCaptionTracksLoading(false);
    }
  };

  const handleImportYouTubeCaptions = async () => {
    const rid = params.id as string;
    const track = captionTracks.find((t) => t.id === selectedTrackId);
    if (!track) return;
    const existingCount = (form.subtitleCues || []).length;
    if (captionImportMode === 'replace' && existingCount > 0) {
      const ok = window.confirm(`Replace all ${existingCount} existing cue${existingCount !== 1 ? 's' : ''} with captions from YouTube "${track.language}" track?\n\nAll translation work will be cleared. This cannot be undone after save.`);
      if (!ok) return;
    }
    setCaptionImporting(true);
    try {
      const res = await fetch(`/api/releases/${rid}/import-captions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captionId: track.id, language: track.language, mode: captionImportMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setForm(data.release);
      const warningNote = data.warnings?.length ? `\n⚠ ${data.warnings.join(' ')}` : '';
      const s = data.normalizationStats || {};
      const dropped = (s.removedInvalidTimestamp || 0) + (s.removedTooShort || 0) + (s.removedEmptyText || 0);
      const parts: string[] = [];
      if (s.collapsed > 0) parts.push(`${s.collapsed} duplicate${s.collapsed !== 1 ? 's' : ''} collapsed`);
      if (dropped > 0) parts.push(`${dropped} dropped`);
      const statsNote = parts.length ? ` (${parts.join(', ')})` : '';
      setSuccessMessage(`Imported ${data.importedCount} cues from YouTube "${track.language}" captions.${statsNote}${warningNote}`);
      setCaptionModalOpen(false);
    } catch (err: any) {
      setCaptionTracksError(err.message);
    } finally {
      setCaptionImporting(false);
    }
  };

  const handleRunVideoOcr = async () => {
    const rid = params.id as string;
    if (!videoOcrFile) return;
    const existingCount = (form.subtitleCues || []).length;
    if (videoOcrMode === 'replace' && existingCount > 0) {
      const ok = window.confirm(`Replace all ${existingCount} existing cue${existingCount !== 1 ? 's' : ''} with OCR results from "${videoOcrFile.name}"?\n\nAll translation work will be cleared. This cannot be undone after save.`);
      if (!ok) return;
    }
    setVideoOcrRunning(true);
    setVideoOcrError(null);
    setVideoOcrProgress({ stage: 'frames', pct: 0, detail: 'Starting…' });
    try {
      const { videoFileToParsedCues, cmsLangToTesseract } = await import('@/lib/subtitle-ingest/video-file-to-cues');
      const { browserCanPlayFile, convertVideoForOcr } = await import('@/lib/subtitle-ingest/convert-video');

      const ocrOptions = {
        fps: 2,
        subtitleZone: 0.25,
        ocrLang: cmsLangToTesseract(videoOcrLang),
        onProgress: (stage: string, pct: number, detail?: string) =>
          setVideoOcrProgress({ stage, pct, detail: detail || '' }),
      };

      let ocrInput: File | string = videoOcrFile;

      // canPlayType('video/mp4') returns 'maybe' for any MP4 — can't pre-detect H.265.
      // Strategy: if browser definitively refuses the type, convert upfront.
      // Otherwise try OCR first and catch the decode error to auto-convert on failure.
      if (!browserCanPlayFile(videoOcrFile)) {
        setVideoOcrProgress({ stage: 'frames', pct: 0, detail: `Converting "${videoOcrFile.name}" to H.264…` });
        ocrInput = await convertVideoForOcr(videoOcrFile, (msg) =>
          setVideoOcrProgress({ stage: 'frames', pct: 0, detail: msg })
        );
      }

      let cues: Awaited<ReturnType<typeof videoFileToParsedCues>>;
      try {
        cues = await videoFileToParsedCues(ocrInput, ocrOptions);
      } catch (decodeErr: any) {
        // Browser said 'maybe' but can't actually decode (H.265/HEVC case) — auto-convert
        if (ocrInput instanceof File && /codec|unsupported|H\.265|HEVC|decode/i.test(decodeErr.message)) {
          setVideoOcrProgress({ stage: 'frames', pct: 0, detail: `Converting to H.264 — browser cannot decode this codec…` });
          ocrInput = await convertVideoForOcr(videoOcrFile, (msg) =>
            setVideoOcrProgress({ stage: 'frames', pct: 0, detail: msg })
          );
          cues = await videoFileToParsedCues(ocrInput, ocrOptions);
        } else {
          throw decodeErr;
        }
      }

      setVideoOcrProgress({ stage: 'grouping', pct: 100, detail: `${cues.length} cues found — saving…` });
      const res = await fetch(`/api/releases/${rid}/import-captions/from-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cues, language: videoOcrLang, mode: videoOcrMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server write failed');
      setForm(data.release);
      const s = data.normalizationStats || {};
      const dropped = (s.removedInvalidTimestamp || 0) + (s.removedTooShort || 0) + (s.removedEmptyText || 0);
      const parts: string[] = [];
      if (s.collapsed > 0) parts.push(`${s.collapsed} duplicate${s.collapsed !== 1 ? 's' : ''} collapsed`);
      if (dropped > 0) parts.push(`${dropped} dropped`);
      const statsNote = parts.length ? ` (${parts.join(', ')})` : '';
      setSuccessMessage(`Imported ${data.importedCount} cues from video OCR.${statsNote}`);
      setCaptionModalOpen(false);
    } catch (err: any) {
      setVideoOcrError(err.message);
    } finally {
      setVideoOcrRunning(false);
      setVideoOcrProgress(null);
    }
  };

  if (!user?.role.includes('admin')) {
    return <DashboardLayout><div className="p-8 text-center">Unauthorized</div></DashboardLayout>;
  }

  if (loading) {
    return <DashboardLayout><div className="p-8 text-center">Loading...</div></DashboardLayout>;
  }

  if (notFound) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center gap-4 py-24">
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
      </DashboardLayout>
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
    {
      id: 'intelligence',
      rank: 9,
      sectionId: 'release-intelligence-section',
      title: 'Release Intelligence',
      done: Boolean(
        (form.targetRegions || []).length > 0 ||
        (form.targetDiaspora || []).length > 0 ||
        (form.targetLanguages || []).length > 0 ||
        (form.sufiConcepts || []).length > 0 ||
        (form.themes || []).length > 0 ||
        (form.moods || []).length > 0 ||
        (form.seoKeywords || []).length > 0 ||
        (form.relatedReleases || []).length > 0 ||
        (form.relatedPlaylists || []).length > 0
      ),
      detail: 'Define target regions, diaspora, languages, Sufi concepts, themes, moods, SEO keywords, and relationships.',
      whatItDoes: 'Attaches structured intelligence taxonomies, target markets, related content, and SEO details to this release.',
      whyImportant: 'Rich metadata helps search engines discover the kalam and powers regional personalization.',
      whatCanGoWrong: 'Incorrect concepts or unpopulated tags will reduce public discoverability and metadata richness.',
      whyNow: 'This sets up the structured data model required before any public rendering or future AI features.',
      actionLabel: 'Edit Release Intelligence',
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
    <DashboardLayout>
      <div className="px-4 py-8">
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

          {!isNew && typeof window !== 'undefined' && localStorage.getItem(`sufipulse_autosave_${params.id}`) && (
            <div className="flex items-center gap-3 p-3 rounded-lg animate-in fade-in slide-in-from-top-4 duration-500" style={{ backgroundColor: 'var(--dash-accent-muted)', border: '1px solid var(--dash-accent)' }}>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--dash-text-primary)' }}>
                  Unsaved changes from a previous session found.
                </p>
                <p className="text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
                  You were editing this release but didn't save. Would you like to restore your work?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={recoverAutosave}
                  className="dashboard-btn-primary px-3 py-1.5 text-xs flex items-center gap-2"
                >
                  <RefreshCw size={12} /> Restore Changes
                </button>
                <button
                  type="button"
                  onClick={clearAutosave}
                  className="dashboard-btn-secondary px-3 py-1.5 text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
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
                    ref={fieldRefs.title}
                    type="text"
                    name="title"
                    value={form.title || ''}
                    onChange={handleInputChange}
                    className={`form-input w-full${fieldErrors.title ? ' form-error' : ''}`}
                    placeholder="Release title"
                  />
                  {fieldErrors.title && <p className="form-error-message">{fieldErrors.title}</p>}
                  
                  {form.titleSource === 'admin' && form.youtubeTitle && (
                    <div className="mt-3 p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-sm">
                      <p className="text-amber-500 font-semibold mb-1 text-xs uppercase tracking-wide">Custom CMS title. YouTube currently uses:</p>
                      <p className="text-neutral-300 font-mono text-xs mb-3">{form.youtubeTitle}</p>
                      <button 
                        type="button" 
                        onClick={() => {
                          setForm(prev => ({ ...prev, title: prev.youtubeTitle, canonicalTitle: prev.youtubeTitle, titleSource: 'youtube' }));
                        }} 
                        className="dashboard-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-2"
                      >
                        Reset to YouTube Title
                      </button>
                    </div>
                  )}
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
                  : <p className="text-xs mt-1" style={{color: 'var(--dash-text-muted)'}}>Auto-generated from title — edit to customise</p>
                }
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>
                  YouTube ID <span style={{color: 'var(--dash-status-rejected)'}}>*</span>
                  {youtubeChannelLookupLoading && <Loader2 size={12} className="inline ml-2 animate-spin" style={{ color: 'var(--dash-accent)' }} />}
                </label>
                <input
                  ref={fieldRefs.youtubeId}
                  type="text"
                  name="youtubeId"
                  value={form.youtubeId || ''}
                  onChange={handleInputChange}
                  onPaste={handleYouTubePaste}
                  className={`form-input w-full${fieldErrors.youtubeId ? ' form-error' : ''}`}
                  placeholder="Paste a YouTube URL or video ID, for example: LXb3EKWsInQ"
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
                    ref={fieldRefs.status}
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
            <ReleaseMediaInfoSection
              form={form}
              onInputChange={handleInputChange}
              onFieldChange={(field, value) => setForm((f: any) => ({ ...f, [field]: value }))}
              fieldRefs={fieldRefs}
            />
          </div>

          {/* Streaming Platforms */}
          <ReleaseStreamingSection
            form={form}
            onUpdateDistribution={updateDistribution}
          />

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

          {/* Release Intelligence Section */}
          <div id="release-intelligence-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
            <h2 className="text-xl font-semibold mb-6" style={{color: 'var(--dash-text-primary)'}}>Release Intelligence</h2>
            
            <div className="space-y-6">
              {/* Intelligence Status & Last Updated */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>
                    Intelligence Status
                  </label>
                  <select
                    name="intelligenceStatus"
                    value={form.intelligenceStatus || 'draft'}
                    onChange={(e) => setForm({ ...form, intelligenceStatus: e.target.value as any, intelligenceUpdatedAt: new Date().toISOString() })}
                    className="form-input w-full"
                  >
                    <option value="draft">Draft</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
                {form.intelligenceUpdatedAt && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>
                      Last Updated
                    </label>
                    <div className="text-sm py-2 px-3 rounded bg-[var(--dash-bg-secondary)]" style={{border: '1px solid var(--dash-border)', color: 'var(--dash-text-secondary)'}}>
                      {new Date(form.intelligenceUpdatedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Target Regions */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--dash-text-primary)'}}>
                  Target Regions
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {REGIONS.map((region) => {
                    const isActive = (form.targetRegions || []).includes(region.code);
                    return (
                      <label
                        key={region.code}
                        className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition text-xs font-normal"
                        style={{
                          border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                          backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                          color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => {
                            const current = form.targetRegions || [];
                            const next = e.target.checked
                              ? [...current, region.code]
                              : current.filter((c) => c !== region.code);
                            setForm({ ...form, targetRegions: next, intelligenceUpdatedAt: new Date().toISOString() });
                          }}
                          style={{accentColor: 'var(--dash-accent)'}}
                        />
                        <span>{region.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Target Diaspora Markets */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--dash-text-primary)'}}>
                  Target Diaspora Markets
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {DIASPORA_MARKETS.map((diaspora) => {
                    const isActive = (form.targetDiaspora || []).includes(diaspora.code);
                    return (
                      <label
                        key={diaspora.code}
                        className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition text-xs font-normal"
                        style={{
                          border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                          backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                          color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => {
                            const current = form.targetDiaspora || [];
                            const next = e.target.checked
                              ? [...current, diaspora.code]
                              : current.filter((c) => c !== diaspora.code);
                            setForm({ ...form, targetDiaspora: next, intelligenceUpdatedAt: new Date().toISOString() });
                          }}
                          style={{accentColor: 'var(--dash-accent)'}}
                        />
                        <span>{diaspora.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Target Languages */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--dash-text-primary)'}}>
                  Target Languages
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {LANGUAGES.map((lang) => {
                    const isActive = (form.targetLanguages || []).includes(lang.code);
                    return (
                      <label
                        key={lang.code}
                        className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition text-xs font-normal"
                        style={{
                          border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                          backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                          color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => {
                            const current = form.targetLanguages || [];
                            const next = e.target.checked
                              ? [...current, lang.code]
                              : current.filter((c) => c !== lang.code);
                            setForm({ ...form, targetLanguages: next, intelligenceUpdatedAt: new Date().toISOString() });
                          }}
                          style={{accentColor: 'var(--dash-accent)'}}
                        />
                        <span>{lang.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Sufi Concepts */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--dash-text-primary)'}}>
                  Sufi Concepts
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {SUFI_CONCEPTS.map((concept) => {
                    const isActive = (form.sufiConcepts || []).includes(concept.code);
                    return (
                      <label
                        key={concept.code}
                        className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition text-xs font-normal"
                        style={{
                          border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                          backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                          color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => {
                            const current = form.sufiConcepts || [];
                            const next = e.target.checked
                              ? [...current, concept.code]
                              : current.filter((c) => c !== concept.code);
                            setForm({ ...form, sufiConcepts: next, intelligenceUpdatedAt: new Date().toISOString() });
                          }}
                          style={{accentColor: 'var(--dash-accent)'}}
                        />
                        <span>{concept.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Spiritual Themes */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--dash-text-primary)'}}>
                  Spiritual Themes
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {SPIRITUAL_THEMES.map((theme) => {
                    const isActive = (form.themes || []).includes(theme.code);
                    return (
                      <label
                        key={theme.code}
                        className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition text-xs font-normal"
                        style={{
                          border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                          backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                          color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => {
                            const current = form.themes || [];
                            const next = e.target.checked
                              ? [...current, theme.code]
                              : current.filter((c) => c !== theme.code);
                            setForm({ ...form, themes: next, intelligenceUpdatedAt: new Date().toISOString() });
                          }}
                          style={{accentColor: 'var(--dash-accent)'}}
                        />
                        <span>{theme.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Moods */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: 'var(--dash-text-primary)'}}>
                  Moods
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2">
                  {MOODS.map((mood) => {
                    const isActive = (form.moods || []).includes(mood.code);
                    return (
                      <label
                        key={mood.code}
                        className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition text-xs font-normal"
                        style={{
                          border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                          backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                          color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => {
                            const current = form.moods || [];
                            const next = e.target.checked
                              ? [...current, mood.code]
                              : current.filter((c) => c !== mood.code);
                            setForm({ ...form, moods: next, intelligenceUpdatedAt: new Date().toISOString() });
                          }}
                          style={{accentColor: 'var(--dash-accent)'}}
                        />
                        <span>{mood.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SEO Keywords (Input tags list) */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>
                  SEO Keywords <span className="text-xs" style={{color: 'var(--dash-text-muted)'}}>(Press Enter or comma to add)</span>
                </label>
                <div className="flex flex-wrap gap-2 p-2 rounded bg-[var(--dash-bg-secondary)] mb-2 min-h-[42px]" style={{border: '1px solid var(--dash-border)'}}>
                  {(form.seoKeywords || []).map((keyword, kidx) => (
                    <span
                      key={kidx}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--dash-accent-muted)] text-xs text-[var(--dash-accent)] font-medium font-sans"
                      style={{ border: '1px solid var(--dash-accent)' }}
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => {
                          const next = (form.seoKeywords || []).filter((_, idx) => idx !== kidx);
                          setForm({ ...form, seoKeywords: next, intelligenceUpdatedAt: new Date().toISOString() });
                        }}
                        className="hover:text-red-400 font-bold ml-1"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={(form.seoKeywords || []).length === 0 ? "Add keywords..." : ""}
                    className="bg-transparent border-0 outline-none flex-1 text-xs text-[var(--dash-text-primary)]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim().toLowerCase();
                        if (val && !(form.seoKeywords || []).includes(val)) {
                          const next = [...(form.seoKeywords || []), val];
                          setForm({ ...form, seoKeywords: next, intelligenceUpdatedAt: new Date().toISOString() });
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Related Releases & Related Playlists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Related Releases */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: 'var(--dash-text-primary)'}}>
                    Related Releases <span className="text-xs" style={{color: 'var(--dash-text-muted)'}}>(Select items to link, excluding current)</span>
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded bg-[var(--dash-bg-secondary)]" style={{border: '1px solid var(--dash-border)'}}>
                    {allReleases
                      .filter(r => r.id !== form.id)
                      .map((rel) => {
                        const isActive = (form.relatedReleases || []).includes(rel.id);
                        return (
                          <label
                            key={rel.id}
                            className="flex items-center gap-2 p-1.5 rounded cursor-pointer transition text-xs font-normal hover:bg-[var(--dash-bg-hover)]"
                          >
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={(e) => {
                                const current = form.relatedReleases || [];
                                const next = e.target.checked
                                  ? [...current, rel.id]
                                  : current.filter((c) => c !== rel.id);
                                setForm({ ...form, relatedReleases: next, intelligenceUpdatedAt: new Date().toISOString() });
                              }}
                              style={{accentColor: 'var(--dash-accent)'}}
                            />
                            <span style={{color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)'}}>{rel.title}</span>
                          </label>
                        );
                      })}
                    {allReleases.filter(r => r.id !== form.id).length === 0 && (
                      <div className="text-center py-4 text-xs text-[var(--dash-text-muted)]">No other releases available.</div>
                    )}
                  </div>
                </div>

                {/* Related Playlists */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>
                    Related YouTube Playlists <span className="text-xs" style={{color: 'var(--dash-text-muted)'}}>(Press Enter to add playlist ID)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 rounded bg-[var(--dash-bg-secondary)] mb-2 min-h-[42px]" style={{border: '1px solid var(--dash-border)'}}>
                    {(form.relatedPlaylists || []).map((playlistId, pidx) => (
                      <span
                        key={pidx}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--dash-bg-hover)] text-xs text-[var(--dash-text-primary)] font-medium font-sans"
                        style={{ border: '1px solid var(--dash-border)' }}
                      >
                        {playlistId}
                        <button
                          type="button"
                          onClick={() => {
                            const next = (form.relatedPlaylists || []).filter((_, idx) => idx !== pidx);
                            setForm({ ...form, relatedPlaylists: next, intelligenceUpdatedAt: new Date().toISOString() });
                          }}
                          className="hover:text-red-400 font-bold ml-1"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder={(form.relatedPlaylists || []).length === 0 ? "e.g. PL..." : ""}
                      className="bg-transparent border-0 outline-none flex-1 text-xs text-[var(--dash-text-primary)]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val && !(form.relatedPlaylists || []).includes(val)) {
                            const next = [...(form.relatedPlaylists || []), val];
                            setForm({ ...form, relatedPlaylists: next, intelligenceUpdatedAt: new Date().toISOString() });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Public Credits */}
          <ReleaseCreditsSection
            form={form}
            updatePublicCredits={updatePublicCredits}
          />

          {/* Structured Lyrics */}
          <div id="lyrics-structure-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-semibold" style={{color: 'var(--dash-text-primary)'}}>Lyrics System Structure</h2>
                {!isNew && (
                  <Link href={`/admin/cms-releases/${params.id}/lyrics`} className="text-xs mt-0.5 inline-block hover:underline" style={{ color: 'var(--dash-accent)' }}>
                    Open Lyrics Editor →
                  </Link>
                )}
              </div>
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
                          <button type="button" onClick={() => saveLanguageLabel(lang.code, editingLangNewLabel)} className="dashboard-btn-primary px-2 py-1 text-xs">Save</button>
                          <button type="button" onClick={() => { setEditingLangCode(null); setEditingLangNewLabel(''); }} className="dashboard-btn-secondary px-2 py-1 text-xs">Cancel</button>
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
                              <button type="button" onClick={() => saveLanguageLabel(lang.code, editingLangNewLabel)} className="dashboard-btn-primary px-2 py-1 text-xs">Save</button>
                              <button type="button" onClick={() => { setEditingLangCode(null); setEditingLangNewLabel(''); }} className="dashboard-btn-secondary px-2 py-1 text-xs">Cancel</button>
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
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomLanguage(); } }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomLanguage}
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
              <div>
                <h2 className="text-xl font-semibold" style={{color: 'var(--dash-text-primary)'}}>Subtitle Timeline & Language Tracks</h2>
                {!isNew && (
                  <Link href={`/admin/cms-releases/${params.id}/subtitles`} className="text-xs mt-0.5 inline-block hover:underline" style={{ color: 'var(--dash-accent)' }}>
                    Open Subtitle Editor →
                  </Link>
                )}
              </div>
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
                {!isNew && (
                  <button
                    type="button"
                    onClick={() => void handleOpenCaptionModal()}
                    className="dashboard-btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"
                  >
                    <Youtube size={16} /> Import Captions
                  </button>
                )}
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
                      ? '... Translating...'
                      : `— Auto-translate from ${getLanguageLabel(form.defaultLanguage || 'en')}`}
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

            <ASSStyleLibrarySection
              form={form}
              activeStyleName={activeStyleName}
              activeStyle={activeStyle}
              styleNames={styleNames}
              selectedSubtitleLanguage={selectedSubtitleLanguage}
              setSelectedStyleName={setSelectedStyleName}
              updateStylePack={updateStylePack}
              addStylePack={addStylePack}
              removeStylePack={removeStylePack}
              onRenameStyle={(oldName, newName) => {
                const packs = { ...(form.subtitleStylePacks || {}) } as Record<string, ASSStylePack>;
                packs[newName] = packs[oldName] || { ...DEFAULT_STYLE_PACK };
                delete packs[oldName];
                setForm({ ...form, subtitleStylePacks: packs });
                setSelectedStyleName(newName);
              }}
              applyCueMetadataToAllCues={applyCueMetadataToAllCues}
              setLanguageStylePack={setLanguageStylePack}
            />

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

            {!isNew && (
              <SocialShareKitSection
                releaseId={params.id as string}
                kit={form.socialShareKit}
                onKitGenerated={(kit) => setForm(f => ({ ...f, socialShareKit: kit }))}
              />
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 mt-12 pt-8 border-t border-[var(--dash-border)]">
            <button
              type="submit"
              disabled={saving || (!hasUnsavedChanges && !isNew)}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-lg transition-all font-semibold shadow-lg disabled:opacity-50 ${
                hasUnsavedChanges || isNew
                  ? 'dashboard-btn-primary scale-100 hover:scale-[1.02]'
                  : 'bg-green-900/30 text-green-400 border border-green-800/50 cursor-default'
              }`}
              title={hasUnsavedChanges ? 'Save changes (Ctrl+S)' : isNew ? 'Create release' : 'No changes to save'}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : !hasUnsavedChanges && !isNew ? (
                <>
                  <CheckSquare className="w-5 h-5" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isNew ? 'Create Release' : 'Save Changes'}
                </>
              )}
            </button>
            <button 
              type="button" 
              onClick={() => router.push('/admin/cms-releases')}
              className="dashboard-btn-secondary px-8 py-2.5 rounded-lg font-medium transition-all hover:bg-neutral-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Floating Save Bar */}
      {!isNew && hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center gap-4 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border border-amber-500/30 bg-neutral-900/90">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Unsaved Changes</span>
              <span className="text-[10px] text-neutral-400">Press Ctrl+S or click save</span>
            </div>
            <div className="h-8 w-[1px] bg-neutral-700" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const formEl = document.querySelector('form');
                  formEl?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }}
                disabled={saving}
                className="dashboard-btn-primary px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2"
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Now'}
              </button>
              <button
                type="button"
                onClick={() => {
                   if (confirm('Discard all unsaved changes in this session?')) {
                     window.location.reload();
                   }
                }}
                className="dashboard-btn-secondary px-5 py-2 rounded-full text-sm font-bold"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Captions Modal */}
      {captionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
          <div className="rounded-xl p-6 max-w-lg w-full mx-4 space-y-4" style={{ backgroundColor: 'var(--dash-bg-primary)', border: '1px solid var(--dash-border)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Import Captions</h3>
              <button type="button" onClick={() => setCaptionModalOpen(false)} className="text-lg font-bold leading-none" style={{ color: 'var(--dash-text-muted)' }}>✕</button>
            </div>

            {/* Source tabs */}
            <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--dash-bg-secondary)', border: '1px solid var(--dash-border)' }}>
              <button type="button" onClick={() => setCaptionSource('youtube')} className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition ${captionSource === 'youtube' ? 'dashboard-btn-primary' : ''}`} style={captionSource !== 'youtube' ? { color: 'var(--dash-text-secondary)' } : {}}>
                YouTube Captions
              </button>
              <button type="button" onClick={() => { setCaptionSource('video'); setVideoOcrError(null); }} className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition ${captionSource === 'video' ? 'dashboard-btn-primary' : ''}`} style={captionSource !== 'video' ? { color: 'var(--dash-text-secondary)' } : {}}>
                From Video File
              </button>
            </div>

            {/* YouTube Captions tab */}
            {captionSource === 'youtube' && captionTracksLoading && (
              <p className="text-sm" style={{ color: 'var(--dash-text-muted)' }}>Loading caption tracks…</p>
            )}
            {captionSource === 'youtube' && (
              <>
                {captionTracksError && (
                  <div className="rounded-lg p-3 text-sm space-y-2" style={{ backgroundColor: 'var(--dash-status-rejected-bg)', color: 'var(--dash-status-rejected)', border: '1px solid var(--dash-status-rejected)' }}>
                    {/OAuth credentials|YOUTUBE_OAUTH/i.test(captionTracksError) ? (
                      <>
                        <p className="font-medium">YouTube OAuth not configured</p>
                        <p className="text-xs opacity-80">
                          Set <code>YOUTUBE_OAUTH_CLIENT_ID</code>, <code>YOUTUBE_OAUTH_CLIENT_SECRET</code>, and <code>YOUTUBE_OAUTH_REFRESH_TOKEN</code> in your environment to use this feature.
                        </p>
                        <button
                          type="button"
                          onClick={() => setCaptionSource('video')}
                          className="mt-1 text-xs underline underline-offset-2 opacity-90 hover:opacity-100"
                        >
                          Switch to From Video File instead →
                        </button>
                      </>
                    ) : (
                      captionTracksError
                    )}
                  </div>
                )}
                {!captionTracksLoading && !captionTracksError && captionTracks.length === 0 && (
                  <p className="text-sm" style={{ color: 'var(--dash-text-muted)' }}>No caption tracks found for this video. Tracks only appear if captions have been uploaded to YouTube.</p>
                )}
                {captionTracks.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm" style={{ color: 'var(--dash-text-secondary)' }}>Select a caption track to import as master cues:</p>
                      {captionTracks.map((track) => (
                        <label key={track.id} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition" style={{ border: `1px solid ${selectedTrackId === track.id ? 'var(--dash-accent)' : 'var(--dash-border)'}`, backgroundColor: 'var(--dash-bg-secondary)' }}>
                          <input type="radio" name="captionTrack" value={track.id} checked={selectedTrackId === track.id} onChange={() => setSelectedTrackId(track.id)} style={{ accentColor: 'var(--dash-accent)' }} />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium" style={{ color: 'var(--dash-text-primary)' }}>{track.language}</span>
                            {track.name && <span className="text-xs ml-2" style={{ color: 'var(--dash-text-muted)' }}>{track.name}</span>}
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--dash-bg-primary)', color: 'var(--dash-text-muted)', border: '1px solid var(--dash-border)' }}>
                              {track.trackKind}{track.isDraft ? ' · draft' : ''}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--dash-text-secondary)' }}>Import mode</label>
                      <select value={captionImportMode} onChange={(e) => setCaptionImportMode(e.target.value as 'replace' | 'merge')} className="form-input w-full text-sm">
                        <option value="replace">Replace all existing cues (clears all translations)</option>
                        <option value="merge">Append to existing cues</option>
                      </select>
                      {captionImportMode === 'replace' && (form.subtitleCues || []).length > 0 && (
                        <p className="mt-1 text-xs" style={{ color: 'var(--dash-status-rejected)' }}>
                          Warning: {(form.subtitleCues || []).length} existing cue{(form.subtitleCues || []).length !== 1 ? 's' : ''} and all translations will be replaced.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* From Video File tab */}
            {captionSource === 'video' && (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>
                  OCR extracts burned-in subtitle text frame-by-frame in your browser. The video is never uploaded to the server.
                </p>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--dash-text-secondary)' }}>Video file (MP4, WebM, MOV)</label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                    className="form-input w-full text-sm"
                    onChange={(e) => { setVideoOcrFile(e.target.files?.[0] || null); setVideoOcrError(null); }}
                  />
                  {videoOcrFile && (
                    <p className="mt-1 text-xs font-mono" style={{ color: 'var(--dash-text-muted)' }}>
                      {videoOcrFile.name} · {(videoOcrFile.size / 1024 / 1024).toFixed(1)} MB · {videoOcrFile.type || 'unknown type'}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--dash-text-secondary)' }}>Subtitle language</label>
                    <select value={videoOcrLang} onChange={(e) => setVideoOcrLang(e.target.value)} className="form-input w-full text-sm">
                      {(form.availableLanguages || ['en']).map((lang) => (
                        <option key={lang} value={lang}>{getLanguageLabel(lang)} ({lang})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--dash-text-secondary)' }}>Import mode</label>
                    <select value={videoOcrMode} onChange={(e) => setVideoOcrMode(e.target.value as 'replace' | 'merge')} className="form-input w-full text-sm">
                      <option value="replace">Replace all existing cues</option>
                      <option value="merge">Append to existing cues</option>
                    </select>
                  </div>
                </div>
                {videoOcrRunning && videoOcrProgress && (
                  <div className="rounded-lg p-3 space-y-1" style={{ backgroundColor: 'var(--dash-bg-secondary)', border: '1px solid var(--dash-border)' }}>
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
                      <span>{videoOcrProgress.detail?.startsWith('Converting') || videoOcrProgress.detail?.startsWith('Uploading') ? 'Converting video' : videoOcrProgress.stage === 'frames' ? 'Extracting frames' : videoOcrProgress.stage === 'ocr' ? 'Running OCR' : 'Building cues'}</span>
                      <span>{videoOcrProgress.pct}%</span>
                    </div>
                    <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: 'var(--dash-border)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${videoOcrProgress.pct}%`, backgroundColor: 'var(--dash-accent)' }} />
                    </div>
                    {videoOcrProgress.detail && <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>{videoOcrProgress.detail}</p>}
                  </div>
                )}
                {videoOcrError && (
                  <div className="rounded-lg p-3 text-sm space-y-2" style={{ backgroundColor: 'var(--dash-status-rejected-bg)', color: 'var(--dash-status-rejected)', border: '1px solid var(--dash-status-rejected)' }}>
                    <p>{videoOcrError}</p>
                    {/codec|unsupported|H\.265|HEVC|decode/i.test(videoOcrError) && (
                      <p className="text-xs opacity-80">
                        Fix: In your video editor choose <strong>File → Export → H.264</strong> (or "Web" / "YouTube" preset). Avoid H.265/HEVC — it is not universally supported in browsers.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCaptionModalOpen(false)} className="dashboard-btn-secondary px-4 py-2 text-sm">Cancel</button>
              {captionSource === 'youtube' && captionTracks.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleImportYouTubeCaptions()}
                  disabled={!selectedTrackId || captionImporting}
                  className="dashboard-btn-primary px-4 py-2 text-sm disabled:opacity-60"
                >
                  {captionImporting ? 'Importing…' : 'Import Captions'}
                </button>
              )}
              {captionSource === 'video' && (
                <button
                  type="button"
                  onClick={() => void handleRunVideoOcr()}
                  disabled={!videoOcrFile || videoOcrRunning}
                  className="dashboard-btn-primary px-4 py-2 text-sm disabled:opacity-60"
                >
                  {videoOcrRunning ? 'Processing…' : 'Extract Captions'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

