"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, Upload, Youtube, CheckSquare, RefreshCw, Loader2, ShieldCheck, Download, ExternalLink } from 'lucide-react';
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
import { ReleaseFeaturesSection, ReleaseMediaInfoSection, BasicInfoSection, ReleaseIntelligenceSection } from './components';
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
import { LyricsStructureSection } from './lyrics-structure-section';
import { ReleaseEditorLanguageManagementSection } from './components/sections/ReleaseEditorLanguageManagementSection';
import { VideoStructureSection } from './components/sections/VideoStructureSection';
import { CanonicalLyricsSection } from './components/sections/CanonicalLyricsSection';
import { ReleasePremiereSection } from './release-premiere-section';
import { ReleaseViralSyndicationSection } from './release-viral-syndication-section';
import { ReleaseCommentarySection } from './release-commentary-section';
import { ReleaseSponsorsSection } from './release-sponsors-section';
import { CaptionImportModal } from './modals/caption-import-modal';
import { getDefaultDistribution, type PlatformDistribution } from '@/lib/cms-storage';
import { useReleaseForm, SAMPLE_PREVIEW_DURATION_SECONDS } from './use-release-form';
import DashboardLayout from '../../../components/layout/DashboardLayout';
export default function EditReleasePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const isAdmin = user?.role.includes('admin') ?? false;

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/admin');
    }
  }, [authLoading, isAdmin, router]);

  const {
    form, setForm,
    originalForm,
    clearAutosave,
    recoverAutosave,
    hasUnsavedChanges,
    unsavedFieldNames,
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
    ready: !authLoading && isAdmin,
    onNavigate: (path) => router.push(path),
  });

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
  const [captionModalOpen, setCaptionModalOpen] = useState(false);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">Unauthorized</div>
      </DashboardLayout>
    );
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

  const isStudioGoverned = form.source === 'studio_pipeline' || Boolean(form.studioProduction);
  const studioDraftId = (form.studioProduction as any)?.draftId || (typeof params.id === 'string' && params.id.startsWith('studio_') ? params.id.replace('studio_', '') : null);

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
        (form.status === 'published' ? /^[A-Za-z0-9_-]{11}$/.test(String(form.youtubeId || '').trim()) : true)
      ),
      detail: form.status === 'published'
        ? 'Title, slug, and valid YouTube ID are required for published releases.'
        : 'Title and slug configured. YouTube ID optional until public release.',
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
      sectionId: 'canonical-lyrics-section',
      title: 'Lyrics Structure',
      done: isStudioGoverned ? Boolean(String(form.canonicalLyrics?.text || '').trim()) : publishedLyricsCount > 0,
      detail: isStudioGoverned
        ? 'Canonical lyrics approved and locked from Studio Master.'
        : `Published blocks in ${getLanguageLabel(defaultLanguage)}: ${publishedLyricsCount}.`,
      whatItDoes: 'Creates structured source blocks used for lyrics display and placeholder cue generation.',
      whyImportant: 'Structured lyrics become the source material for consistent subtitle creation workflows.',
      whatCanGoWrong: 'Unstructured or missing lines lead to chaotic placeholders and translation mismatch.',
      whyNow: 'This step feeds subtitle placeholders, so it should exist before cue refinement.',
      actionLabel: isStudioGoverned ? 'View Approved Lyrics' : (publishedLyricsCount > 0 ? 'Review Lyrics Blocks' : 'Add First Lyrics Block'),
    },
    {
      id: 'timeline',
      rank: 6,
      sectionId: 'subtitle-timeline-section',
      title: 'Subtitle Timeline',
      done: isStudioGoverned ? true : subtitleCuesCount > 0,
      detail: isStudioGoverned
        ? '4-track subtitles verified and burned into 1080p master in Hybrid Studio.'
        : `Cues created: ${subtitleCuesCount}.`,
      whatItDoes: 'Builds canonical cue timing windows that every subtitle format and language output uses.',
      whyImportant: 'Cue timing is the backbone for web subtitles, exports, and YouTube delivery.',
      whatCanGoWrong: 'Bad timing causes unreadable playback and cross-language sync defects.',
      whyNow: 'Timing should be established before validating language completeness.',
      actionLabel: isStudioGoverned ? 'View Master Tracks' : (subtitleCuesCount > 0 ? 'Open Subtitle Timeline' : 'Create First Cue'),
    },
    {
      id: 'language-track',
      rank: 7,
      sectionId: 'subtitle-timeline-section',
      title: `Language Track (${getLanguageLabel(selectedSubtitleLanguage)})`,
      done: isStudioGoverned ? true : (subtitleCuesCount > 0 && translatedCueCount === subtitleCuesCount),
      detail: isStudioGoverned
        ? 'Multilingual tracks (Urdu, English, Roman Urdu, Hindi) locked to Studio Master.'
        : subtitleCuesCount > 0
          ? `Translated cues for ${getLanguageLabel(selectedSubtitleLanguage)}: ${translatedCueCount}/${subtitleCuesCount}.`
          : 'Create cues first, then sync/translate this language.',
      whatItDoes: 'Ensures the selected language track is fully populated against the canonical cue list.',
      whyImportant: 'Delivery quality depends on complete language text aligned to approved timings.',
      whatCanGoWrong: 'Partial tracks can ship with missing lines and fail review or audience expectations.',
      whyNow: 'Once cue timing exists, language completion becomes the primary readiness gate.',
      actionLabel: isStudioGoverned ? 'View Master Subtitles' : 'Sync Language From Lyrics',
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
              {!isNew && !loading && Boolean(form.id) && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-sky-300">
                    {hasUnsavedChanges ? 'Unsaved edits' : 'Saved in CMS'}
                  </span>
                  <span className={form.status === "published" && form.visibility === "public"
                    ? "rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-emerald-300"
                    : "rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-amber-300"}>
                    {form.status === "published" && form.visibility === "public" ? "Published on SufiPulse" : "Not public on SufiPulse"}
                  </span>
                  {form.youtubeId && <a href={"https://www.youtube.com/watch?v=" + form.youtubeId} target="_blank" rel="noreferrer" className="text-sky-300 underline">YouTube video</a>}
                </div>
              )}
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

        {isStudioGoverned && (
          <div className="mb-6 p-4 rounded-xl border border-purple-500/40 bg-purple-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">SufiPulse Studio Governed Master</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    LOCKED PRODUCTION ASSET
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-0.5">
                  Audio assembly, synchronized lyrics, subtitle timing, and video boundaries are permanently governed by Hybrid Studio. Editorial metadata, credits, sponsors, and SEO can be managed below.
                </p>
              </div>
            </div>
            {studioDraftId && (
              <Link
                href={`/admin/pipeline/${studioDraftId}`}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold whitespace-nowrap transition-colors inline-flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
              >
                Open in Hybrid Studio Pipeline &rarr;
              </Link>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="dashboard-card p-8">
          {/* Basic Info */}
          {/* Basic Info */}
          <BasicInfoSection
            form={form}
            setForm={setForm}
            fieldRefs={fieldRefs}
            fieldErrors={fieldErrors}
            handleInputChange={handleInputChange}
            generateSlug={generateSlug}
            youtubeChannelLookupLoading={youtubeChannelLookupLoading}
            handleYouTubePaste={handleYouTubePaste}
            fetchedYouTubeChannel={fetchedYouTubeChannel}
            applyFetchedChannelDefaults={applyFetchedChannelDefaults}
          />

          {/* Media Info */}
          <div id="media-info-section">
            <ReleaseMediaInfoSection
              form={form}
              onInputChange={handleInputChange}
              onFieldChange={(field, value) => setForm((f: any) => ({ ...f, [field]: value }))}
              fieldRefs={fieldRefs}
            />
          </div>
          
          <VideoStructureSection
            durationSeconds={form.durationSeconds || 0}
            initialStructure={form.videoStructure || {}}
            isLocked={isStudioGoverned}
            onUpdate={(structure) => setForm((f: any) => ({ ...f, videoStructure: structure }))}
          />

          {/* Premiere & Pre-Release */}
          <ReleaseViralSyndicationSection
            releaseId={String(params.id || form.id || '')}
            draftId={form.studioProduction?.draftId}
            slug={form.slug}
            title={form.title}
            youtubeId={form.youtubeId}
            isStudioGoverned={isStudioGoverned}
          />

            <ReleasePremiereSection
            form={form}
            setForm={setForm}
          />

          {/* Streaming Platforms */}
          <ReleaseStreamingSection
            form={form}
            onUpdateDistribution={updateDistribution}
          />

          {/* Features */}
          <div id="features-section">
            <ReleaseFeaturesSection form={form} setForm={setForm} onCheckboxChange={handleCheckboxChange} />
          </div>

          {/* Public Commentary */}
          <ReleaseCommentarySection
            form={form}
            addPublicCommentary={addPublicCommentary}
            updatePublicCommentary={updatePublicCommentary}
            removePublicCommentary={removePublicCommentary}
          />

          {/* Public Sponsors */}
          <ReleaseSponsorsSection
            form={form}
            onSponsorsIntroChange={(val) => setForm({ ...form, publicSponsorsIntro: val })}
            addPublicSponsor={addPublicSponsor}
            updatePublicSponsor={updatePublicSponsor}
            removePublicSponsor={removePublicSponsor}
          />

          {/* Release Intelligence Section */}
          <ReleaseIntelligenceSection
            form={form}
            setForm={setForm}
            allReleases={allReleases}
          />

          {/* Public Credits */}
          <ReleaseCreditsSection
            form={form}
            setForm={setForm}
            updatePublicCredits={updatePublicCredits}
          />

          {/* Canonical Part I Lyrics */}
          <div id="canonical-lyrics-section">
            <CanonicalLyricsSection
              initialLyrics={form.canonicalLyrics}
              isLocked={isStudioGoverned}
              onUpdate={(canonicalLyrics) =>
                setForm((prev) => ({ ...prev, canonicalLyrics }))
              }
            />
          </div>

          {/* Structured Lyrics (Legacy editor for non-studio releases) */}
          {!isStudioGoverned && (
            <LyricsStructureSection
              form={form}
              selectedLyricsStructureLanguage={selectedLyricsStructureLanguage}
              setSelectedLyricsStructureLanguage={setSelectedLyricsStructureLanguage}
              addLyricsBlock={addLyricsBlock}
              updateLyricsBlock={updateLyricsBlock}
              removeLyricsBlock={removeLyricsBlock}
              getLyricsBlocks={getLyricsBlocks}
              getLanguageLabel={getLanguageLabel}
              editorHref={!isNew ? `/admin/cms-releases/${params.id as string}/lyrics` : undefined}
            />
          )}

          <ReleaseEditorLanguageManagementSection
            form={form}
            setForm={setForm}
            getLanguageLabel={getLanguageLabel}
            normalizeLanguageCode={normalizeLanguageCode}
            addCustomLanguage={addCustomLanguage}
            deleteCustomLanguage={deleteCustomLanguage}
            saveLanguageLabel={saveLanguageLabel}
            setLanguageTone={setLanguageTone}
            handleInputChange={handleInputChange}
          />

          {/* Subtitle Timeline + Language Tracks */}
          <div id="subtitle-timeline-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
            {isStudioGoverned ? (
              <div className="rounded-2xl border border-purple-500/30 bg-purple-950/10 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      <h3 className="text-base font-bold text-white">Hybrid Studio Master Tracks</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        4 TRACKS BURNED
                      </span>
                    </div>
                    <p className="text-xs text-white/60">
                      Vocal speech alignment, word timestamps, and optical typography were compiled and burned into the video master during Phase 2 &amp; 3 of production.
                    </p>
                  </div>
                  {studioDraftId && (
                    <Link
                      href={`/admin/pipeline/${studioDraftId}`}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold whitespace-nowrap transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto shadow-lg shadow-purple-600/20"
                    >
                      Edit in Hybrid Studio &rarr;
                    </Link>
                  )}
                </div>

                {/* 4 Multi-lingual Tracks Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-white">
                      <span>Urdu (Nastaliq)</span>
                      <span className="text-[10px] text-emerald-400 font-mono">READY</span>
                    </div>
                    <p className="text-[11px] text-white/50">Urdu Nastaliq typography with calibrated optical weight (60/74pt).</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-white">
                      <span>English</span>
                      <span className="text-[10px] text-emerald-400 font-mono">READY</span>
                    </div>
                    <p className="text-[11px] text-white/50">Master thematic English translation synchronized to verse cadence.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-white">
                      <span>Roman Urdu</span>
                      <span className="text-[10px] text-emerald-400 font-mono">READY</span>
                    </div>
                    <p className="text-[11px] text-white/50">Latin-script phonetics for global singing and pronunciation.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-white">
                      <span>Devanagari Hindi</span>
                      <span className="text-[10px] text-emerald-400 font-mono">READY</span>
                    </div>
                    <p className="text-[11px] text-white/50">Cross-cultural Hindi script representation of mystical kalam.</p>
                  </div>
                </div>

                {/* Master Render Production Info */}
                <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Master Video Output:</span>
                    <span className="font-mono text-white/90 text-[11px] truncate max-w-md">
                      {(form.studioProduction as any)?.outputPath || 'Authoritative 1080p Master'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Approved Production Format:</span>
                    <span className="font-mono text-amber-400 uppercase text-[11px]">
                      {(form.studioProduction as any)?.format || 'lyric_master'} ({(form.studioProduction as any)?.orientation || 'landscape'})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Audio Master Continuity:</span>
                    <span className="text-emerald-400 font-semibold text-[11px]">
                      48kHz WAV Master Verified • SHA-256 Validated
                    </span>
                  </div>
                </div>

                {/* Subtitle Export & Distribution Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={exportAllSubtitlesZip}
                    disabled={exportingZip}
                    className="dashboard-btn-secondary px-4 py-2 text-xs inline-flex items-center gap-2"
                  >
                    <Download size={14} />
                    {exportingZip ? 'Generating ZIP...' : 'Export Subtitle Package (.VTT / .SRT / .ASS)'}
                  </button>
                  <button
                    type="button"
                    onClick={copySubtitleNamingConvention}
                    className="dashboard-btn-secondary px-4 py-2 text-xs"
                  >
                    Copy YouTube CC Track Names
                  </button>
                </div>
              </div>
            ) : (
              <>
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
                    onClick={() => setCaptionModalOpen(true)}
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
              </>
            )}

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

          {/* Saved persistence and public publication are distinct verified states. */}
          {!isNew && !loading && Boolean(form.id) && (
            <div role="status" aria-live="polite" className="mt-10 flex flex-wrap items-center gap-3 rounded-xl border border-white/15 bg-white/5 p-4">
              <span className="text-xs font-semibold text-white/75">RELEASE STATUS</span>
              <span className="rounded-lg border border-sky-500/40 px-3 py-2 text-sm font-semibold text-sky-300">Saved in CMS</span>
              {hasUnsavedChanges && <span className="rounded-lg border border-amber-500/40 px-3 py-2 text-sm font-semibold text-amber-300" title="Fields changed in the editor but not saved">
                Unsaved edits: {unsavedFieldNames.slice(0, 6).join(", ")}{unsavedFieldNames.length > 6 ? ` (+${unsavedFieldNames.length - 6} more)` : ""}
              </span>}
              <span className={form.status === "published" && form.visibility === "public" ? "rounded-lg border border-emerald-500/40 px-3 py-2 text-sm font-semibold text-emerald-300" : "rounded-lg border border-amber-500/40 px-3 py-2 text-sm font-semibold text-amber-300"}>
                {form.status === "published" && form.visibility === "public" ? "Published on SufiPulse" : "Not publicly published on SufiPulse"}
              </span>
              {form.status === "published" && form.visibility === "public" && form.slug && (
                <a href={"/release-detail/" + form.slug} target="_blank" rel="noreferrer" className="text-xs font-semibold text-sky-300 underline">View public release</a>
              )}
            </div>
          )}
          {/* Submit */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[var(--dash-border)]">
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

      {/* Import Captions Modal */}
      <CaptionImportModal
        releaseId={params.id as string}
        form={form}
        setForm={setForm}
        setSuccessMessage={setSuccessMessage}
        getLanguageLabel={getLanguageLabel}
        open={captionModalOpen}
        onClose={() => setCaptionModalOpen(false)}
      />
    </DashboardLayout>
  );
}

