import { CheckCircle2, Download, Save, Upload } from 'lucide-react';
import type { CMSRelease } from '@/lib/cms-storage';

type DeliveryState =
  | 'web_only'
  | 'synced_to_youtube'
  | 'manual_upload_pending'
  | 'manual_upload_completed'
  | 'sync_failed';

type CaptionTrackMeta = {
  captionId?: string;
  language?: string;
  lastUploadedAt?: string;
  lastExportedAt?: string;
  lastStatus?: 'synced' | 'unchanged' | 'failed';
  deliveryState?: DeliveryState;
  manualUploadActor?: string;
  manualUploadAt?: string;
  manualUploadNotes?: string;
  lastError?: string;
};

type ContentReadinessState =
  | 'draft'
  | 'editorial_ready'
  | 'web_published'
  | 'youtube_delivery_in_progress'
  | 'fully_delivered'
  | 'delivery_attention_required';

type YouTubeIntegrationStatus = {
  configured?: boolean;
  missing: string[];
} | null;

type Props = {
  form: Partial<CMSRelease>;
  manualUploadActor: string;
  setManualUploadActor: (value: string) => void;
  manualUploadNotes: Record<string, string>;
  setManualUploadNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  subtitleExportLanguages: string[];
  exportingZip: boolean;
  youtubeSyncing: boolean;
  youtubeIntegrationStatus: YouTubeIntegrationStatus;
  getTrackMeta: (language: string) => CaptionTrackMeta;
  toggleWebPublishState: () => Promise<void> | void;
  openPublicReleasePreview: () => void;
  updateReadinessState: (nextReadiness: ContentReadinessState) => Promise<void> | void;
  setForm: React.Dispatch<React.SetStateAction<Partial<CMSRelease>>>;
  exportAllSubtitlesZip: () => Promise<void> | void;
  copySubtitleNamingConvention: () => Promise<void> | void;
  syncYouTubeSubtitles: (options?: {
    releaseId?: string;
    mode?: 'update-changed' | 'force-update';
    languages?: string[];
    silent?: boolean;
  }) => Promise<any> | any;
  exportSubtitleByLanguage: (language: string, format: 'srt' | 'vtt' | 'ass') => Promise<void> | void;
  markManualDeliveryState: (
    language: string,
    state: Extract<DeliveryState, 'manual_upload_pending' | 'manual_upload_completed'>,
  ) => void;
  updateTrackMeta: (
    language: string,
    patch: Partial<CaptionTrackMeta>,
    options?: { persist?: boolean; successText?: string },
  ) => void;
};

export function DeliveryPanelSection({
  form,
  manualUploadActor,
  setManualUploadActor,
  manualUploadNotes,
  setManualUploadNotes,
  subtitleExportLanguages,
  exportingZip,
  youtubeSyncing,
  youtubeIntegrationStatus,
  getTrackMeta,
  toggleWebPublishState,
  openPublicReleasePreview,
  updateReadinessState,
  setForm,
  exportAllSubtitlesZip,
  copySubtitleNamingConvention,
  syncYouTubeSubtitles,
  exportSubtitleByLanguage,
  markManualDeliveryState,
  updateTrackMeta,
}: Props) {
  return (
    <div className="mt-6 rounded-lg p-4" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-primary)' }}>
      <div className="mb-4 rounded-lg p-3" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)' }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Web UI Delivery</h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void toggleWebPublishState()}
              className="dashboard-btn-secondary inline-flex items-center gap-2 px-3 py-1.5 text-sm"
            >
              {form.status === 'published' ? 'Set Unpublished' : 'Set Published'}
            </button>
            <button
              type="button"
              onClick={openPublicReleasePreview}
              className="dashboard-btn-secondary inline-flex items-center gap-2 px-3 py-1.5 text-sm"
            >
              Preview Public URL
            </button>
          </div>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--dash-text-muted)' }}>
          Slug: {String(form.slug || '').trim() || 'not set'} | Current web status: {String(form.status || 'draft')}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Subtitle Export</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={form.contentReadinessState || 'draft'}
            onChange={(e) => void updateReadinessState(e.target.value as ContentReadinessState)}
            className="form-input"
            style={{ minWidth: '230px' }}
            title="Content readiness state"
          >
            <option value="draft">Readiness: Draft</option>
            <option value="editorial_ready">Readiness: Editorial Ready</option>
            <option value="web_published">Readiness: Web Published</option>
            <option value="youtube_delivery_in_progress">Readiness: YouTube Delivery In Progress</option>
            <option value="fully_delivered">Readiness: Fully Delivered</option>
            <option value="delivery_attention_required">Readiness: Delivery Attention Required</option>
          </select>
          <input
            type="text"
            value={manualUploadActor}
            onChange={(e) => setManualUploadActor(e.target.value)}
            className="form-input"
            style={{ maxWidth: '220px' }}
            placeholder="Manual upload actor"
          />
          <label className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--dash-text-primary)' }}>
            <input
              type="checkbox"
              checked={form.youtubeSubtitleAutoSync !== false}
              onChange={(e) => setForm((prev) => ({ ...prev, youtubeSubtitleAutoSync: e.target.checked }))}
              style={{ accentColor: 'var(--dash-accent)' }}
            />
            Auto-sync to YouTube on Save
          </label>
          <button
            type="button"
            onClick={() => void exportAllSubtitlesZip()}
            disabled={exportingZip}
            className="dashboard-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
          >
            <Download size={16} /> {exportingZip ? 'Building ZIP...' : 'Export All as ZIP (.SRT + .VTT + .ASS)'}
          </button>
          <button
            type="button"
            onClick={() => void copySubtitleNamingConvention()}
            className="dashboard-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm"
          >
            Copy Naming Convention
          </button>
          <button
            type="button"
            onClick={() => void syncYouTubeSubtitles({ mode: 'update-changed' })}
            disabled={youtubeSyncing || youtubeIntegrationStatus?.configured === false}
            className="dashboard-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
          >
            <Download size={16} /> {youtubeSyncing ? 'Syncing...' : 'Sync Changed to YouTube'}
          </button>
          <button
            type="button"
            onClick={() => void syncYouTubeSubtitles({ mode: 'force-update' })}
            disabled={youtubeSyncing || youtubeIntegrationStatus?.configured === false}
            className="dashboard-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
          >
            <Download size={16} /> Force Push All to YouTube
          </button>
        </div>
      </div>

      <p className="text-xs mt-2" style={{ color: 'var(--dash-text-muted)' }}>
        Master styling: export ASS per language for visual subtitle styling and karaoke-like effects. Web-player-ready subtitles: export VTT per language. For YouTube, simpler subtitle formats and readable timing are more reliable. Web status and readiness controls save immediately.
      </p>

      {youtubeIntegrationStatus?.configured === false && (
        <div
          className="mt-3 rounded-md px-3 py-2 text-xs"
          style={{
            border: '1px solid var(--dash-status-pending)',
            backgroundColor: 'var(--dash-status-pending-bg)',
            color: 'var(--dash-status-pending)',
          }}
        >
          YouTube sync disabled: missing OAuth env vars: {youtubeIntegrationStatus.missing.join(', ')}.
        </div>
      )}

      <div className="mt-4 space-y-2">
        {subtitleExportLanguages.map((language) => (
          <div key={language} className="flex flex-wrap items-center justify-between gap-3 rounded-md px-3 py-2" style={{ border: '1px solid var(--dash-border)' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--dash-text-primary)' }}>{language.toUpperCase()}</div>
              <div className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>
                Delivery state: {(getTrackMeta(language).deliveryState || 'web_only').replace(/_/g, ' ')}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void exportSubtitleByLanguage(language, 'srt')}
                className="dashboard-btn-secondary inline-flex items-center gap-2 px-3 py-1.5 text-sm"
              >
                <Download size={14} /> Export SRT
              </button>
              <button
                type="button"
                onClick={() => void exportSubtitleByLanguage(language, 'vtt')}
                className="dashboard-btn-secondary inline-flex items-center gap-2 px-3 py-1.5 text-sm"
              >
                <Download size={14} /> Export VTT
              </button>
              <button
                type="button"
                onClick={() => void exportSubtitleByLanguage(language, 'ass')}
                className="dashboard-btn-secondary inline-flex items-center gap-2 px-3 py-1.5 text-sm"
              >
                <Download size={14} /> Export ASS
              </button>
              <button
                type="button"
                onClick={() => void syncYouTubeSubtitles({ mode: 'force-update', languages: [language] })}
                disabled={youtubeSyncing || youtubeIntegrationStatus?.configured === false}
                className="dashboard-btn-secondary inline-flex items-center gap-2 px-3 py-1.5 text-sm disabled:opacity-60"
              >
                <Download size={14} /> Push to YouTube
              </button>
              <button
                type="button"
                onClick={() => markManualDeliveryState(language, 'manual_upload_pending')}
                className="dashboard-btn-secondary inline-flex items-center gap-2 px-3 py-1.5 text-sm"
              >
                <Upload size={14} /> Mark Pending
              </button>
              <button
                type="button"
                onClick={() => markManualDeliveryState(language, 'manual_upload_completed')}
                className="dashboard-btn-secondary inline-flex items-center gap-2 px-3 py-1.5 text-sm"
              >
                <CheckCircle2 size={14} /> Mark Completed
              </button>
            </div>
            <div className="w-full">
              <input
                type="text"
                value={manualUploadNotes[language] || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setManualUploadNotes((prev) => ({ ...prev, [language]: value }));
                  updateTrackMeta(language, { manualUploadNotes: value });
                }}
                className="form-input w-full"
                placeholder={`Manual upload notes for ${language.toUpperCase()}`}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    updateTrackMeta(language, { manualUploadNotes: manualUploadNotes[language] || '' }, {
                      persist: true,
                      successText: `${language.toUpperCase()} manual note saved.`,
                    })
                  }
                  className="dashboard-btn-secondary inline-flex items-center gap-2 px-3 py-1.5 text-sm"
                >
                  <Save size={14} /> Save Note
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs space-y-1" style={{ color: 'var(--dash-text-muted)' }}>
        {subtitleExportLanguages.map((language) => {
          const syncMeta = getTrackMeta(language);
          if (!syncMeta.captionId && !syncMeta.lastStatus && !syncMeta.lastError && !syncMeta.deliveryState && !syncMeta.manualUploadAt && !syncMeta.lastExportedAt) {
            return null;
          }

          return (
            <div key={`${language}_sync_meta`}>
              {language.toUpperCase()}: {syncMeta.lastStatus || 'unknown'}
              {syncMeta.captionId ? ` | captionId: ${syncMeta.captionId}` : ''}
              {syncMeta.deliveryState ? ` | delivery: ${syncMeta.deliveryState}` : ''}
              {syncMeta.lastExportedAt ? ` | last export: ${new Date(syncMeta.lastExportedAt).toLocaleString()}` : ''}
              {syncMeta.manualUploadActor ? ` | manual actor: ${syncMeta.manualUploadActor}` : ''}
              {syncMeta.manualUploadAt ? ` | manual at: ${new Date(syncMeta.manualUploadAt).toLocaleString()}` : ''}
              {syncMeta.manualUploadNotes ? ` | note: ${syncMeta.manualUploadNotes}` : ''}
              {syncMeta.lastUploadedAt ? ` | last upload: ${new Date(syncMeta.lastUploadedAt).toLocaleString()}` : ''}
              {syncMeta.lastError ? ` | error: ${syncMeta.lastError}` : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
