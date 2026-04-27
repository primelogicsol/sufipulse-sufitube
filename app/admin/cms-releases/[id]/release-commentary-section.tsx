"use client";

import type { CMSRelease } from '@/lib/cms-storage';

type Props = {
  form: Partial<CMSRelease>;
  addPublicCommentary: () => void;
  updatePublicCommentary: (index: number, key: 'title' | 'content' | 'isPublished', value: string | boolean) => void;
  removePublicCommentary: (index: number) => void;
};

export function ReleaseCommentarySection({
  form,
  addPublicCommentary,
  updatePublicCommentary,
  removePublicCommentary,
}: Props) {
  return (
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
  );
}
