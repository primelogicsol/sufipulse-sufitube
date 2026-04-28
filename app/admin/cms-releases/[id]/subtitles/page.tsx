"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, Upload, Youtube } from 'lucide-react';
import Link from 'next/link';

import {
  type SubtitleStatus,
  type ASSStylePack,
  DEFAULT_STYLE_NAME,
  DEFAULT_STYLE_PACK,
} from '../release-constants';
import {
  resolvePreviewAnchor,
  cueTimeToSeconds,
  formatPreviewSeconds,
} from '../subtitle-utils';
import { useReleaseForm, SAMPLE_PREVIEW_DURATION_SECONDS } from '../use-release-form';
import { DeliveryPanelSection } from '../delivery-panel-section';
import { ReviewLogSection } from '../review-log-section';
import { SubtitleCueListSection } from '../subtitle-cue-list-section';
import { LiveAssPreviewSection } from '../live-ass-preview-section';
import { ASSStyleLibrarySection } from '../ass-style-library-section';
import { LanguageManagementSection } from '../language-management-section';
import { SubtitleBulkControlsSection } from '../subtitle-bulk-controls-section';
import { SocialShareKitSection } from '../social-share-kit-section';

export default function SubtitleEditorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const releaseId = params.id as string;

  const isAdmin = user?.role?.includes('admin') ?? false;

  const {
    form,
    setForm,
    loading,
    notFound,
    saving,
    hasUnsavedChanges,
    errorMessage,
    setErrorMessage,
    successMessage,
    setSuccessMessage,
    exportingZip,
    youtubeSyncing,
    autoTranslatingLang,
    // Language UI
    selectedSubtitleLanguage,
    setSelectedSubtitleLanguage,
    selectedLyricsStructureLanguage,
    referenceLanguage,
    setReferenceLanguage,
    sideBySideMode,
    setSideBySideMode,
    selectedStyleName,
    setSelectedStyleName,
    // Preview state
    previewCueId,
    setPreviewCueId,
    previewPanelPosition,
    previewInfoPosition,
    previewInfoWidth,
    previewCanvasWidth,
    previewTime,
    setPreviewTime,
    previewPlaying,
    setPreviewPlaying,
    lockAllCuePositions,
    setLockAllCuePositions,
    previewVideoDuration,
    previewOrigin,
    showSafeGuides,
    setShowSafeGuides,
    autoAdvanceAfterStamp,
    setAutoAdvanceAfterStamp,
    // Review / delivery
    reviewActor,
    setReviewActor,
    reviewComment,
    setReviewComment,
    manualUploadActor,
    setManualUploadActor,
    manualUploadNotes,
    setManualUploadNotes,
    youtubeIntegrationStatus,
    // Bulk cue operations
    selectedCueIds,
    setSelectedCueIds,
    shiftTimingOffset,
    setShiftTimingOffset,
    bulkKaraokeEffect,
    setBulkKaraokeEffect,
    bulkKaraokeDurationsMs,
    setBulkKaraokeDurationsMs,
    // Lyrics placeholder
    lyricsPlaceholderOpen,
    setLyricsPlaceholderOpen,
    lyricsPlaceholderDraft,
    setLyricsPlaceholderDraft,
    lyricsPlaceholderNote,
    lyricsPlaceholderScope,
    setLyricsPlaceholderScope,
    lyricsPlaceholderBlockId,
    setLyricsPlaceholderBlockId,
    lyricsPlaceholderSyncLineRef,
    setLyricsPlaceholderSyncLineRef,
    // Refs
    previewCanvasRef,
    previewYouTubeIframeRef,
    timelineRef,
    // Save
    handleSave,
    // Cue handlers
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
    // Style pack handlers
    updateStylePack,
    addStylePack,
    removeStylePack,
    setLanguageStylePack,
    // Language handlers
    getLanguageLabel,
    addCustomLanguage,
    deleteCustomLanguage,
    saveLanguageLabel,
    setLanguageTone,
    setLanguageStatus,
    setLanguageAssignee,
    addReviewLog,
    // Translation + import
    autoTranslateLanguage,
    handleImportSubtitleFile,
    // Lyrics placeholder handlers
    getLyricsBlocks,
    loadLyricsIntoCuePlaceholders,
    applyLyricsPlaceholderDraft,
    // Preview handlers
    sendPreviewYouTubeCommand,
    bootstrapPreviewYouTubePlayer,
    handlePreviewDrag,
    handlePreviewInfoDrag,
    handlePreviewInfoResize,
    handlePreviewResize,
    handleTimelineClick,
    handleTimelinePointerDown,
    // Export / delivery handlers
    buildSubtitleExportUrl,
    getSubtitleExportLanguages,
    getTrackMeta,
    toggleWebPublishState,
    openPublicReleasePreview,
    updateReadinessState,
    exportAllSubtitlesZip,
    copySubtitleNamingConvention,
    syncYouTubeSubtitles,
    exportSubtitleByLanguage,
    markManualDeliveryState,
    updateTrackMeta,
  } = useReleaseForm({ releaseId, isNew: false, ready: isAdmin, onNavigate: router.push });

  useEffect(() => {
    if (user !== undefined && !isAdmin) router.push('/admin');
  }, [user, isAdmin, router]);

  // ── YouTube caption import state ──────────────────────────────────────────
  type CaptionTrack = { id: string; language: string; name: string; trackKind: string; isDraft: boolean };
  const [captionModalOpen, setCaptionModalOpen] = useState(false);
  const [captionTracks, setCaptionTracks] = useState<CaptionTrack[]>([]);
  const [captionTracksLoading, setCaptionTracksLoading] = useState(false);
  const [captionTracksError, setCaptionTracksError] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [captionImportMode, setCaptionImportMode] = useState<'replace' | 'merge'>('replace');
  const [captionImporting, setCaptionImporting] = useState(false);

  const handleOpenCaptionModal = async () => {
    setCaptionModalOpen(true);
    setCaptionTracksError(null);
    setCaptionTracks([]);
    setSelectedTrackId('');
    setCaptionTracksLoading(true);
    try {
      const res = await fetch(`/api/releases/${releaseId}/import-captions`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to list caption tracks');
      setCaptionTracks(data.tracks || []);
      if (data.tracks?.length) setSelectedTrackId(data.tracks[0].id);
    } catch (err: any) {
      setCaptionTracksError(err.message);
    } finally {
      setCaptionTracksLoading(false);
    }
  };

  const handleImportYouTubeCaptions = async () => {
    const track = captionTracks.find((t) => t.id === selectedTrackId);
    if (!track) return;
    const existingCount = (form.subtitleCues || []).length;
    if (captionImportMode === 'replace' && existingCount > 0) {
      const ok = window.confirm(`Replace all ${existingCount} existing cue${existingCount !== 1 ? 's' : ''} with captions from YouTube "${track.language}" track?\n\nAll translation work will be cleared. This cannot be undone after save.`);
      if (!ok) return;
    }
    setCaptionImporting(true);
    try {
      const res = await fetch(`/api/releases/${releaseId}/import-captions`, {
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

  // ── Video OCR import state ────────────────────────────────────────────────
  const [captionSource, setCaptionSource] = useState<'youtube' | 'video'>('youtube');
  const [videoOcrFile, setVideoOcrFile] = useState<File | null>(null);
  const [videoOcrLang, setVideoOcrLang] = useState<string>(form.defaultLanguage || 'en');
  const [videoOcrMode, setVideoOcrMode] = useState<'replace' | 'merge'>('replace');
  const [videoOcrProgress, setVideoOcrProgress] = useState<{ stage: string; pct: number; detail: string } | null>(null);
  const [videoOcrError, setVideoOcrError] = useState<string | null>(null);
  const [videoOcrRunning, setVideoOcrRunning] = useState(false);

  const handleRunVideoOcr = async () => {
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

      let ocrInput: File | string = videoOcrFile;

      if (!browserCanPlayFile(videoOcrFile)) {
        setVideoOcrProgress({ stage: 'frames', pct: 0, detail: `Converting "${videoOcrFile.name}" to H.264 on server…` });
        ocrInput = await convertVideoForOcr(videoOcrFile, (msg) =>
          setVideoOcrProgress({ stage: 'frames', pct: 0, detail: msg })
        );
      }

      const cues = await videoFileToParsedCues(ocrInput, {
        fps: 2,
        subtitleZone: 0.25,
        ocrLang: cmsLangToTesseract(videoOcrLang),
        onProgress: (stage, pct, detail) => setVideoOcrProgress({ stage, pct, detail: detail || '' }),
      });
      setVideoOcrProgress({ stage: 'grouping', pct: 100, detail: `${cues.length} cues found — saving…` });
      const res = await fetch(`/api/releases/${releaseId}/import-captions/from-video`, {
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

  // ── Derived state for render ──────────────────────────────────────────────

  const styleNames = Object.keys(form.subtitleStylePacks || { [DEFAULT_STYLE_NAME]: DEFAULT_STYLE_PACK });
  const activeStyleName = styleNames.includes(selectedStyleName) ? selectedStyleName : styleNames[0];
  const activeStyle = { ...DEFAULT_STYLE_PACK, ...((form.subtitleStylePacks || {})[activeStyleName] || {}) };
  const previewCue = (form.subtitleCues || []).find((cue) => cue.id === previewCueId) || (form.subtitleCues || [])[0] || null;
  const previewCueMetadata = previewCue ? ((form.subtitleCueMetadata as Record<string, any> | undefined)?.[previewCue.id] || {}) : {};
  const previewStyleName = previewCueMetadata.styleName || form.languageStyleOverrides?.[selectedSubtitleLanguage]?.stylePack || activeStyleName || DEFAULT_STYLE_NAME;
  const previewStyle = { ...DEFAULT_STYLE_PACK, ...((form.subtitleStylePacks || {})[previewStyleName] || {}) };
  const previewText = previewCue
    ? (form.subtitleTranslations?.[selectedSubtitleLanguage]?.[previewCue.id] || form.subtitleTranslations?.[referenceLanguage]?.[previewCue.id] || 'Preview subtitle text')
    : 'Sample subtitle preview text';
  const previewYouTubeId = String(form.youtubeId || '').trim();
  const previewHasYouTube = /^[A-Za-z0-9_-]{11}$/.test(previewYouTubeId);
  const previewAlignment = previewCueMetadata.alignment || previewStyle.alignment || 2;
  const previewAnchor = resolvePreviewAnchor(previewAlignment);
  const previewHasCustomPosition = Number.isFinite(previewCueMetadata.positionX) && Number.isFinite(previewCueMetadata.positionY);
  const previewPosition = previewHasCustomPosition
    ? { x: Number(previewCueMetadata.positionX), y: Number(previewCueMetadata.positionY) }
    : previewCue ? null : previewPanelPosition;
  const previewTextLines = String(previewText || '').split('\n').filter(Boolean);
  const cueMaxEnd = Math.max(0, ...(form.subtitleCues || []).map((cue) => cueTimeToSeconds(cue.endTime)));
  const maxKnownDuration = Math.max(cueMaxEnd, Number(previewVideoDuration || 0), Number(form.durationSeconds || 0));
  const previewDuration = maxKnownDuration > 0 ? maxKnownDuration : SAMPLE_PREVIEW_DURATION_SECONDS;
  const subtitleExportLanguages = getSubtitleExportLanguages();

  // ── Early returns ─────────────────────────────────────────────────────────

  if (!isAdmin) return <div className="p-8 text-center">Unauthorized</div>;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--dash-bg-primary)' }}>
      <div className="text-sm" style={{ color: 'var(--dash-text-muted)' }}>Loading subtitle editor…</div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--dash-bg-secondary)' }}>
      <p className="text-lg font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Release not found</p>
      <Link href="/admin/cms-releases">
        <button className="dashboard-btn-primary px-5 py-2 rounded-lg text-sm font-medium">Back to Releases</button>
      </Link>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
    <div className="min-h-screen" style={{ backgroundColor: 'var(--dash-bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/admin/cms-releases/${releaseId}`} className="shrink-0 p-2 rounded-lg transition hover:opacity-70" style={{ backgroundColor: 'var(--dash-bg-secondary)', color: 'var(--dash-text-secondary)' }}>
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate" style={{ color: 'var(--dash-text-primary)' }}>
                Subtitle Editor
              </h1>
              {form.title && (
                <p className="text-sm truncate" style={{ color: 'var(--dash-text-muted)' }}>{form.title}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !hasUnsavedChanges}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg transition font-medium disabled:opacity-60 shrink-0 ${hasUnsavedChanges ? 'dashboard-btn-primary' : 'dashboard-btn-secondary'}`}
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Subtitles'}
          </button>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg text-sm flex items-start justify-between gap-2" style={{ backgroundColor: 'var(--dash-status-rejected-bg)', color: 'var(--dash-status-rejected)', border: '1px solid var(--dash-status-rejected)' }}>
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} className="shrink-0 font-bold">✕</button>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded-lg text-sm flex items-start justify-between gap-2" style={{ backgroundColor: 'var(--dash-status-approved-bg)', color: 'var(--dash-status-approved)', border: '1px solid var(--dash-status-approved)' }}>
            <span style={{ whiteSpace: 'pre-line' }}>{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} className="shrink-0 font-bold">✕</button>
          </div>
        )}

        {/* Language Management */}
        <LanguageManagementSection
          form={form}
          onToggleLanguage={(code, active) => {
            const current = form.availableLanguages || [];
            const next = active ? [...current, code] : current.filter((c) => c !== code);
            let newDefault = form.defaultLanguage;
            if (!active && form.defaultLanguage === code) newDefault = next[0] || 'en';
            setForm({ ...form, availableLanguages: next, defaultLanguage: newDefault });
          }}
          onAddCustomLanguage={addCustomLanguage}
          deleteCustomLanguage={deleteCustomLanguage}
          saveLanguageLabel={saveLanguageLabel}
          setLanguageTone={setLanguageTone}
          onSetRtl={(code, rtl) => {
            const overrides = { ...(form.languageStyleOverrides || {}) };
            overrides[code] = { ...(overrides[code] || {}), rtl };
            setForm({ ...form, languageStyleOverrides: overrides });
          }}
          subtitleLanguageStatuses={form.subtitleLanguageStatuses}
          onInputChange={(e) => {
            const { name, value } = e.target;
            setForm((prev) => ({ ...prev, [name]: value }));
          }}
          getLanguageLabel={getLanguageLabel}
        />

        {/* Subtitle Timeline & Language Tracks */}
        <div id="subtitle-timeline-section" className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--dash-border)' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Subtitle Timeline & Language Tracks</h2>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-80 cursor-pointer text-sm transition" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)' }}>
                <Upload size={16} />
                Import SRT/VTT/ASS
                <input type="file" accept=".srt,.vtt,.ass" className="hidden" onChange={handleImportSubtitleFile} />
              </label>
              {form.youtubeId && (
                <button type="button" onClick={() => void handleOpenCaptionModal()} className="dashboard-btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm">
                  <Youtube size={16} /> Import YouTube Captions
                </button>
              )}
              <button type="button" onClick={addCue} className="dashboard-btn-primary inline-flex items-center gap-2 px-3 py-2">
                <Plus size={16} /> Add Cue
              </button>
              <button type="button" onClick={loadLyricsIntoCuePlaceholders} className="dashboard-btn-secondary inline-flex items-center gap-2 px-3 py-2" title="Open lyrics placeholder panel and sync into subtitle cues">
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
                  <button type="button" onClick={() => setLyricsPlaceholderOpen(false)} className="dashboard-btn-secondary px-3 py-1 text-xs">Close</button>
                </div>
              </div>
              {lyricsPlaceholderNote && <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>{lyricsPlaceholderNote}</p>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--dash-text-muted)' }}>Load Scope</label>
                  <select value={lyricsPlaceholderScope} onChange={(e) => setLyricsPlaceholderScope(e.target.value as 'all' | 'published' | 'single')} className="form-input">
                    <option value="all">All Blocks ({getLyricsBlocks(selectedLyricsStructureLanguage || form.defaultLanguage || 'en').length})</option>
                    <option value="published">Published Blocks Only</option>
                    <option value="single">Single Block</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs mb-1" style={{ color: 'var(--dash-text-muted)' }}>Specific Block</label>
                  <select value={lyricsPlaceholderBlockId} onChange={(e) => setLyricsPlaceholderBlockId(e.target.value)} className="form-input" disabled={lyricsPlaceholderScope !== 'single'}>
                    <option value="">Select block...</option>
                    {getLyricsBlocks(selectedLyricsStructureLanguage || form.defaultLanguage || 'en').map((block: any, index: number) => (
                      <option key={block.id || index} value={String(block.id || '')}>
                        {(block.heading || `${String(block.type || 'section').toUpperCase()} ${index + 1}`)} ({Array.isArray(block.lines) ? block.lines.length : 0} lines)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <textarea value={lyricsPlaceholderDraft} onChange={(e) => setLyricsPlaceholderDraft(e.target.value)} rows={6} className="form-input w-full" placeholder="Paste one lyric line per row. Click Apply to create/update cues and subtitle text." />
              <div className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>
                Placeholder lines: {lyricsPlaceholderDraft.split('\n').map((line) => line.trim()).filter(Boolean).length}
              </div>
              <label className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
                <input type="checkbox" checked={lyricsPlaceholderSyncLineRef} onChange={(e) => setLyricsPlaceholderSyncLineRef(e.target.checked)} style={{ accentColor: 'var(--dash-accent)' }} />
                Sync cue lineRef as ordered labels (L001, L002, ...)
              </label>
              <div className="rounded p-2" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-primary)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--dash-text-muted)' }}>Order Preview (line 1 {'→'} cue 1, line 2 {'→'} cue 2, ...)</div>
                <div className="max-h-32 overflow-auto text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
                  {lyricsPlaceholderDraft.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 20).map((line, index) => (
                    <div key={`placeholder-order-${index}`} className="py-0.5">{index + 1}. {line}</div>
                  ))}
                  {lyricsPlaceholderDraft.split('\n').map((line) => line.trim()).filter(Boolean).length > 20 && (
                    <div style={{ color: 'var(--dash-text-muted)' }}>...and {lyricsPlaceholderDraft.split('\n').map((line) => line.trim()).filter(Boolean).length - 20} more</div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={loadLyricsIntoCuePlaceholders} className="dashboard-btn-secondary px-3 py-1.5 text-sm">Reload From Lyrics Blocks</button>
                <button type="button" onClick={applyLyricsPlaceholderDraft} className="dashboard-btn-primary px-3 py-1.5 text-sm">Apply Placeholder Lines</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dash-text-primary)' }}>Master Timing Version</label>
              <input
                type="number"
                name="masterTimingVersion"
                value={form.masterTimingVersion || 1}
                onChange={(e) => setForm((prev) => ({ ...prev, masterTimingVersion: parseInt(e.target.value) || 1 }))}
                className="form-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dash-text-primary)' }}>Active Language</label>
              <select value={selectedSubtitleLanguage} onChange={(e) => setSelectedSubtitleLanguage(e.target.value)} className="form-input w-full">
                {(form.availableLanguages || ['en']).map((lang) => (
                  <option key={lang} value={lang}>{getLanguageLabel(lang)} ({lang})</option>
                ))}
              </select>
              {selectedSubtitleLanguage !== (form.defaultLanguage || 'en') && (
                <button
                  type="button"
                  onClick={() => void autoTranslateLanguage(selectedSubtitleLanguage)}
                  disabled={autoTranslatingLang === selectedSubtitleLanguage}
                  className="mt-2 w-full dashboard-btn-secondary px-3 py-1 text-xs disabled:opacity-50"
                  title={`Auto-translate all cues from master language (${getLanguageLabel(form.defaultLanguage || 'en')}) to ${getLanguageLabel(selectedSubtitleLanguage)}`}
                >
                  {autoTranslatingLang === selectedSubtitleLanguage
                    ? '⏳ Translating…'
                    : `🔄 Auto-translate from ${getLanguageLabel(form.defaultLanguage || 'en')}`}
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dash-text-primary)' }}>Reference (Master) Language</label>
              <select value={referenceLanguage} onChange={(e) => setReferenceLanguage(e.target.value)} className="form-input w-full">
                {(form.availableLanguages || ['en']).map((lang) => (
                  <option key={lang} value={lang}>{getLanguageLabel(lang)} ({lang})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dash-text-primary)' }}>Language Status</label>
              <select value={form.subtitleLanguageStatuses?.[selectedSubtitleLanguage] || 'draft'} onChange={(e) => setLanguageStatus(selectedSubtitleLanguage, e.target.value as SubtitleStatus)} className="form-input w-full">
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
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dash-text-primary)' }}>Translator</label>
              <input type="text" value={form.subtitleLanguageAssignments?.[selectedSubtitleLanguage]?.translator || ''} onChange={(e) => setLanguageAssignee(selectedSubtitleLanguage, 'translator', e.target.value)} className="form-input w-full" placeholder="Assigned translator" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dash-text-primary)' }}>Reviewer</label>
              <input type="text" value={form.subtitleLanguageAssignments?.[selectedSubtitleLanguage]?.reviewer || ''} onChange={(e) => setLanguageAssignee(selectedSubtitleLanguage, 'reviewer', e.target.value)} className="form-input w-full" placeholder="Assigned reviewer" />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--dash-text-primary)' }}>
                <input type="checkbox" checked={sideBySideMode} onChange={(e) => setSideBySideMode(e.target.checked)} style={{ accentColor: 'var(--dash-accent)' }} />
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
            <div className="text-sm p-4 rounded-lg" style={{ color: 'var(--dash-text-muted)', border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)' }}>
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

          <SocialShareKitSection
            releaseId={releaseId}
            kit={form.socialShareKit}
            onKitGenerated={(kit) => setForm((f) => ({ ...f, socialShareKit: kit }))}
          />
        </div>

      </div>
    </div>

    {/* YouTube Caption Import Modal */}
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

          {/* ── YouTube Captions tab ── */}
          {captionSource === 'youtube' && captionTracksLoading && (
            <p className="text-sm" style={{ color: 'var(--dash-text-muted)' }}>Loading caption tracks…</p>
          )}

          {/* ── YouTube Captions content ── */}
          {captionSource === 'youtube' && (
            <>
              {captionTracksError && (
                <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'var(--dash-status-rejected-bg)', color: 'var(--dash-status-rejected)', border: '1px solid var(--dash-status-rejected)' }}>
                  {captionTracksError}
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

          {/* ── From Video File content ── */}
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
    </>
  );
}
