import type { ChangeEventHandler } from 'react';
import type { CMSRelease } from '@/lib/cms-storage';

type ReleaseMediaInfoSectionProps = {
  form: Partial<CMSRelease>;
  onInputChange: ChangeEventHandler<HTMLInputElement>;
};

export function ReleaseMediaInfoSection({ form, onInputChange }: ReleaseMediaInfoSectionProps) {
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
      </div>
    </div>
  );
}