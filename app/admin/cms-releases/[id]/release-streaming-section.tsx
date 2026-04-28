"use client";

import type { CMSRelease } from '@/lib/cms-storage';

type Props = {
  form: Partial<CMSRelease>;
  onAddPlatform: () => void;
  onUpdatePlatform: (index: number, field: 'platform' | 'status' | 'url', value: string) => void;
  onRemovePlatform: (index: number) => void;
  onAutoFillPlatforms: () => void;
};

export function ReleaseStreamingSection({
  form,
  onAddPlatform,
  onUpdatePlatform,
  onRemovePlatform,
  onAutoFillPlatforms,
}: Props) {
  return (
    <div id="streaming-platforms-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold" style={{color: 'var(--dash-text-primary)'}}>Streaming Platforms</h2>
        <button
          type="button"
          onClick={onAddPlatform}
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
                  onChange={(e) => onUpdatePlatform(index, 'platform', e.target.value)}
                  placeholder="e.g., Spotify, Apple Music"
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Status</label>
                <select
                  value={platform.status}
                  onChange={(e) => onUpdatePlatform(index, 'status', e.target.value)}
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
                    onChange={(e) => onUpdatePlatform(index, 'url', e.target.value)}
                    placeholder="https://..."
                    className="form-input w-full"
                  />
                  <button
                    type="button"
                    onClick={() => onRemovePlatform(index)}
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
              onClick={onAutoFillPlatforms}
            >
              Auto-Fill Verified Platforms
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
