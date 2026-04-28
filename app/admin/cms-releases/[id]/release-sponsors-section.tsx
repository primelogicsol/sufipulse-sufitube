"use client";

import type { CMSRelease } from '@/lib/cms-storage';

type Props = {
  form: Partial<CMSRelease>;
  onSponsorsIntroChange: (value: string) => void;
  addPublicSponsor: () => void;
  updatePublicSponsor: (index: number, key: 'name' | 'role' | 'logoUrl' | 'isPublished', value: string | boolean) => void;
  removePublicSponsor: (index: number) => void;
};

export function ReleaseSponsorsSection({
  form,
  onSponsorsIntroChange,
  addPublicSponsor,
  updatePublicSponsor,
  removePublicSponsor,
}: Props) {
  return (
    <div id="sponsors-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold" style={{color: 'var(--dash-text-primary)'}}>Sponsors Tab Content</h2>
        <button type="button" onClick={addPublicSponsor} className="dashboard-btn-secondary px-3 py-1 text-sm">Add Sponsor</button>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Intro Text</label>
        <textarea
          value={form.publicSponsorsIntro || ''}
          onChange={(e) => onSponsorsIntroChange(e.target.value)}
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
                  value={sponsor.logoUrl || ''}
                  onChange={(e) => updatePublicSponsor(index, 'logoUrl', e.target.value)}
                  className="form-input flex-1"
                  placeholder="https://example.com/logo.png"
                />
                {sponsor.logoUrl && (
                  <button
                    type="button"
                    onClick={() => updatePublicSponsor(index, 'logoUrl', '')}
                    className="dashboard-btn-danger px-3 py-2 text-xs whitespace-nowrap"
                  >
                    Remove logo
                  </button>
                )}
              </div>
              {sponsor.logoUrl && (
                <img
                  src={sponsor.logoUrl}
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
  );
}
