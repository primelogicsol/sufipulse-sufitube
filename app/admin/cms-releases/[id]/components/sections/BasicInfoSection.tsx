import React from 'react';
import { Loader2 } from 'lucide-react';
import type { CMSRelease } from '@/lib/cms-storage';

interface BasicInfoSectionProps {
  form: Partial<CMSRelease>;
  setForm: React.Dispatch<React.SetStateAction<Partial<CMSRelease>>>;
  fieldRefs: Record<string, React.RefObject<any>>;
  fieldErrors: Record<string, string>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  generateSlug: () => void;
  youtubeChannelLookupLoading: boolean;
  handleYouTubePaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  fetchedYouTubeChannel: { channelId?: string; channelTitle?: string; channelUrl?: string } | null;
  applyFetchedChannelDefaults: () => void;
}

export function BasicInfoSection({
  form,
  setForm,
  fieldRefs,
  fieldErrors,
  handleInputChange,
  generateSlug,
  youtubeChannelLookupLoading,
  handleYouTubePaste,
  fetchedYouTubeChannel,
  applyFetchedChannelDefaults
}: BasicInfoSectionProps) {
  return (
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
              className={`form-input w-full` + (fieldErrors.title ? ' form-error' : '')}
              placeholder="Release title"
            />
            {fieldErrors.title && <p className="form-error-message">{fieldErrors.title}</p>}
            
            {form.titleOverride && form.youtubeTitle && (
              <div className="mt-3 p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-sm">
                <p className="text-amber-500 font-semibold mb-1 text-xs uppercase tracking-wide">Custom CMS title. YouTube currently uses:</p>
                <p className="text-neutral-300 font-mono text-xs mb-3">{form.youtubeTitle}</p>
                <button 
                  type="button" 
                  onClick={() => {
                    setForm(prev => ({ ...prev, title: prev.youtubeTitle, canonicalTitle: prev.youtubeTitle, titleOverride: false, titleOverrideAt: null, titleOverrideBy: null }));
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
              className={`form-input flex-1` + (fieldErrors.slug ? ' form-error' : '')}
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
            className={`form-input w-full` + (fieldErrors.youtubeId ? ' form-error' : '')}
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

          {form.descriptionOverride && form.youtubeDescription && (
            <div className="mt-3 p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-sm">
              <p className="text-amber-500 font-semibold mb-1 text-xs uppercase tracking-wide">Custom CMS description. YouTube currently uses:</p>
              <p className="text-neutral-300 font-mono text-xs mb-3 whitespace-pre-wrap max-h-40 overflow-y-auto">{form.youtubeDescription}</p>
              <button 
                type="button" 
                onClick={() => {
                  setForm(prev => ({ ...prev, description: prev.youtubeDescription, descriptionOverride: false, descriptionOverrideAt: null, descriptionOverrideBy: null }));
                }} 
                className="dashboard-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-2"
              >
                Reset to YouTube Description
              </button>
            </div>
          )}

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
              ref={fieldRefs.status as any}
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
  );
}
