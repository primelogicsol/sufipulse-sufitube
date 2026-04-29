"use client";

import { useState, useRef } from 'react';
import type { ChangeEventHandler } from 'react';
import type { CMSRelease } from '@/lib/cms-storage';
import { Upload, Music, CheckCircle, Loader2, X } from 'lucide-react';

type ReleaseMediaInfoSectionProps = {
  form: Partial<CMSRelease>;
  onInputChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  onFieldChange?: (field: keyof CMSRelease, value: any) => void;
};

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB per chunk

export function ReleaseMediaInfoSection({ form, onInputChange, onFieldChange }: ReleaseMediaInfoSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAudio = form.format === 'audio';

  const handleAudioUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress('');
    try {
      const uploadId = crypto.randomUUID();
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const totalMB = (file.size / 1024 / 1024).toFixed(1);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const chunk = file.slice(start, start + CHUNK_SIZE);
        const pct = Math.round((i / totalChunks) * 100);
        setUploadProgress(
          totalChunks === 1
            ? `Uploading ${totalMB} MB…`
            : `Uploading ${totalMB} MB — ${pct}% (part ${i + 1}/${totalChunks})…`
        );

        const res = await fetch('/api/audio/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Upload-Id': uploadId,
            'X-Chunk-Index': String(i),
            'X-Total-Chunks': String(totalChunks),
            'X-Filename': encodeURIComponent(file.name),
          },
          body: chunk,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Upload failed at part ${i + 1}/${totalChunks} (HTTP ${res.status})`);
        }

        if (i === totalChunks - 1) {
          const data = await res.json();
          onFieldChange?.('audioUrl', data.url);
          onFieldChange?.('webOnly', true);
        }
      }

      setUploadProgress('');
      setUploadSuccess(true);
    } catch (err: any) {
      setUploadError(err.message);
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-8 pb-8" style={{ borderBottom: '1px solid var(--dash-border)' }}>
      <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--dash-text-primary)' }}>
        Media Information
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dash-text-primary)' }}>
              Duration (seconds)
            </label>
            <input
              type="number"
              name="durationSeconds"
              value={form.durationSeconds || 0}
              onChange={onInputChange}
              className="form-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dash-text-primary)' }}>
              Duration (formatted)
            </label>
            <input
              type="text"
              name="durationFormatted"
              value={form.durationFormatted || ''}
              onChange={onInputChange}
              className="form-input w-full"
              placeholder="e.g., 5:30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dash-text-primary)' }}>
              View Count
            </label>
            <input
              type="number"
              name="viewCount"
              value={form.viewCount || 0}
              onChange={onInputChange}
              className="form-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dash-text-primary)' }}>
              Like Count
            </label>
            <input
              type="number"
              name="likeCount"
              value={form.likeCount || 0}
              onChange={onInputChange}
              className="form-input w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dash-text-primary)' }}>
            Thumbnail URL
          </label>
          <input
            type="text"
            name="thumbnailUrl"
            value={form.thumbnailUrl || ''}
            onChange={onInputChange}
            className="form-input w-full"
            placeholder="https://i.ytimg.com/vi/..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dash-text-primary)' }}>
              Format
            </label>
            <select
              name="format"
              value={form.format || ''}
              onChange={onInputChange}
              className="form-input w-full"
            >
              <option value="">— Unset —</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="short">Short</option>
              <option value="live">Live</option>
              <option value="playlist">Playlist</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dash-text-primary)' }}>
              Type (Governance)
            </label>
            <select
              name="releaseType"
              value={form.releaseType || ''}
              onChange={onInputChange}
              className="form-input w-full"
            >
              <option value="">— Unset —</option>
              <option value="native_governed">Native Governed</option>
              <option value="legacy_registry">Legacy Registry</option>
            </select>
          </div>
        </div>

        {/* Audio upload — shown only when Format = Audio */}
        {isAudio && (
          <div
            className="rounded-lg p-4 space-y-3"
            style={{ background: 'var(--dash-bg-secondary)', border: '1px solid var(--dash-border)' }}
          >
            <div className="flex items-center gap-2">
              <Music size={15} style={{ color: 'var(--dash-accent)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--dash-text-primary)' }}>
                Audio File
              </span>
            </div>

            {/* Current audio URL */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--dash-text-muted)' }}>
                Audio URL (paste external link or upload below)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="audioUrl"
                  value={form.audioUrl || ''}
                  onChange={onInputChange}
                  className="form-input flex-1"
                  placeholder="https://... or use upload button"
                />
                {form.audioUrl && (
                  <button
                    type="button"
                    onClick={() => onFieldChange?.('audioUrl', '')}
                    className="p-2 rounded dashboard-btn-secondary"
                    title="Clear URL"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* File upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAudioUpload(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 text-sm dashboard-btn-secondary disabled:opacity-60"
              >
                {uploading ? (
                  <><Loader2 size={14} className="animate-spin" /> {uploadProgress || 'Uploading…'}</>
                ) : (
                  <><Upload size={14} /> Upload Audio File</>
                )}
              </button>
              <p className="text-xs mt-1" style={{ color: 'var(--dash-text-muted)' }}>
                MP3, WAV, OGG, M4A, AAC, FLAC — max 150 MB
              </p>
            </div>

            {uploadError && (
              <p className="text-xs" style={{ color: 'var(--dash-status-rejected)' }}>{uploadError}</p>
            )}
            {uploadSuccess && (
              <p className="text-xs flex items-center gap-1" style={{ color: 'var(--dash-status-approved)' }}>
                <CheckCircle size={12} /> Uploaded — URL saved above. Click Save Release to persist.
              </p>
            )}

            {/* Preview player — auto-populates duration fields from loaded metadata */}
            {form.audioUrl && (
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--dash-text-muted)' }}>Preview</p>
                <audio
                  controls
                  src={form.audioUrl}
                  className="w-full"
                  style={{ height: 36, borderRadius: 6 }}
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    const el = e.currentTarget;
                    const dur = el.duration;
                    if (!dur || !Number.isFinite(dur) || dur <= 0) return;
                    const secs = Math.round(dur);
                    onFieldChange?.('durationSeconds', secs);
                    const h = Math.floor(secs / 3600);
                    const m = Math.floor((secs % 3600) / 60);
                    const s = secs % 60;
                    const formatted = h > 0
                      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
                      : `${m}:${String(s).padStart(2, '0')}`;
                    onFieldChange?.('durationFormatted', formatted);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
