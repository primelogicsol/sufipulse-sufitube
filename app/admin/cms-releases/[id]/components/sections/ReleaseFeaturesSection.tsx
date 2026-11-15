import type { ChangeEventHandler } from 'react';
import type { CMSRelease } from '@/lib/cms-storage';

type ReleaseFeaturesSectionProps = {
  form: Partial<CMSRelease>;
  onCheckboxChange: ChangeEventHandler<HTMLInputElement>;
  setForm: (form: Partial<CMSRelease>) => void;
};

const FEATURE_TOGGLES: Array<{ name: keyof CMSRelease; label: string; checked: (form: Partial<CMSRelease>) => boolean }> = [
  { name: 'enableLyrics', label: 'Enable Lyrics', checked: (form) => form.enableLyrics !== false },
  { name: 'enableCommentary', label: 'Enable Commentary', checked: (form) => form.enableCommentary !== false },
  { name: 'enableAdoption', label: 'Enable Adoption', checked: (form) => form.enableAdoption !== false },
  { name: 'enableCredits', label: 'Enable Credits', checked: (form) => form.enableCredits !== false },
  { name: 'enableSponsors', label: 'Enable Sponsors', checked: (form) => form.enableSponsors !== false },
];

export function ReleaseFeaturesSection({ form, onCheckboxChange, setForm }: ReleaseFeaturesSectionProps) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Features</h2>
        <button type="button" className="dashboard-btn-secondary px-3 py-2 text-xs"
          onClick={() => setForm({ ...form, enableLyrics: true, enableCommentary: true,
            enableAdoption: true, enableCredits: true, enableSponsors: true })}>
          Enable All Features
        </button>
      </div>
      <p className="text-xs mb-4" style={{color: 'var(--dash-text-muted)'}}>All features are enabled by default for new releases. Turn off any feature independently. Enabling a feature does not publish missing content.</p>
      <div className="space-y-3">
        {FEATURE_TOGGLES.map((feature) => (
          <label key={String(feature.name)} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name={String(feature.name)}
              checked={feature.checked(form)}
              onChange={onCheckboxChange}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--dash-accent)' }}
            />
            <span style={{ color: 'var(--dash-text-primary)' }}>{feature.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}