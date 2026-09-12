import React, { useState, useEffect } from 'react';
import type { CMSRelease } from '@/lib/cms-storage';

type CaptionTrack = { id: string; language: string; name: string; trackKind: string; isDraft: boolean };

interface CaptionImportModalProps {
  releaseId: string;
  form: Partial<CMSRelease>;
  setForm: React.Dispatch<React.SetStateAction<Partial<CMSRelease>>>;
  setSuccessMessage: (msg: string) => void;
  getLanguageLabel: (code: string) => string;
  open: boolean;
  onClose: () => void;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err.trim()) return err;
  if (err && typeof err === 'object') {
    const obj = err as any;
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message;
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error;
    if (typeof obj.detail === 'string' && obj.detail.trim()) return obj.detail;
    try {
      const json = JSON.stringify(err);
      if (json !== '{}') return json;
    } catch {
      // ignore
    }
  }
  const str = String(err);
  if (str && str !== 'undefined' && str !== 'null' && str !== '[object Object]') return str;
  return 'Unknown OCR error';
}

export function CaptionImportModal({
  releaseId,
  form,
  setForm,
  setSuccessMessage,
  getLanguageLabel,
  open,
  onClose
}: CaptionImportModalProps) {
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
  const [videoOcrDiagnostic, setVideoOcrDiagnostic] = useState<any>(null);
  const [videoOcrRunning, setVideoOcrRunning] = useState(false);

  useEffect(() => {
    if (open) {
      handleOpenCaptionModal();
    }
  }, [open, releaseId]);

  const handleOpenCaptionModal = async () => {
    setCaptionSource('youtube');
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
      if (/OAuth credentials|YOUTUBE_OAUTH/i.test(err.message)) {
        setCaptionSource('video');
        setCaptionTracksError(null);
      }
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
      onClose();
    } catch (err: any) {
      setCaptionTracksError(err.message);
    } finally {
      setCaptionImporting(false);
    }
  };

  const handleRunVideoOcr = async () => {
    if (!videoOcrFile) return;
    const existingCount = (form.subtitleCues || []).length;
    if (videoOcrMode === 'replace' && existingCount > 0) {
      const ok = window.confirm(`Replace all ${existingCount} existing cue${existingCount !== 1 ? 's' : ''} with OCR results from "${videoOcrFile.name}"?\n\nAll translation work will be cleared. This cannot be undone after save.`);
      if (!ok) return;
    }
    setVideoOcrRunning(true);
    setVideoOcrError(null); setVideoOcrDiagnostic(null);
    setVideoOcrProgress({ stage: 'frames', pct: 0, detail: 'Starting…' });
    try {
      const { videoFileToParsedCues, cmsLangToTesseract } = await import('@/lib/subtitle-ingest/video-file-to-cues');


      const ocrOptions = {
        fps: 2,
        subtitleZone: 0.25,
        ocrLang: cmsLangToTesseract(videoOcrLang),
        onProgress: (stage: string, pct: number, detail?: string) =>
          setVideoOcrProgress({ stage, pct, detail: detail || '' }),
      };

        const cues = await videoFileToParsedCues(videoOcrFile, ocrOptions);

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
      onClose();
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setVideoOcrError(msg);
      if (err && err.diagnostic) {
        setVideoOcrDiagnostic(err.diagnostic);
      }
    } finally {
      setVideoOcrRunning(false);
      setVideoOcrProgress(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
      <div className="rounded-xl p-6 max-w-lg w-full mx-4 space-y-4" style={{ backgroundColor: 'var(--dash-bg-primary)', border: '1px solid var(--dash-border)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Import Captions</h3>
          <button type="button" onClick={onClose} className="text-lg font-bold leading-none" style={{ color: 'var(--dash-text-muted)' }}>✕</button>
        </div>

        {/* Source tabs */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--dash-bg-secondary)', border: '1px solid var(--dash-border)' }}>
          <button type="button" onClick={() => setCaptionSource('youtube')} className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition ${captionSource === 'youtube' ? 'dashboard-btn-primary' : ''}`} style={captionSource !== 'youtube' ? { color: 'var(--dash-text-secondary)' } : {}}>
            YouTube Captions
          </button>
          <button type="button" onClick={() => { setCaptionSource('video'); setVideoOcrError(null); setVideoOcrDiagnostic(null); }} className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition ${captionSource === 'video' ? 'dashboard-btn-primary' : ''}`} style={captionSource !== 'video' ? { color: 'var(--dash-text-secondary)' } : {}}>
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
            <div className="space-y-1 text-xs" style={{ color: 'var(--dash-text-muted)' }}>
              <p>OCR runs entirely in your browser. Your MP4 video is not uploaded.</p>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--dash-text-secondary)' }}>Video file (MP4)</label>
              <input
                type="file"
                accept="video/mp4,.mp4"
                className="form-input w-full text-sm"
                onChange={(e) => { setVideoOcrFile(e.target.files?.[0] || null); setVideoOcrError(null); setVideoOcrDiagnostic(null); }}
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
          <button type="button" onClick={onClose} className="dashboard-btn-secondary px-4 py-2 text-sm">Cancel</button>
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
  );
}
