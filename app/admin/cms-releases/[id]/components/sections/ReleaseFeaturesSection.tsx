import type { ChangeEventHandler } from 'react';
import type { CMSRelease } from '@/lib/cms-storage';

type ReleaseFeaturesSectionProps = {
  form: Partial<CMSRelease>;
  onCheckboxChange: ChangeEventHandler<HTMLInputElement>;
};

const FEATURE_TOGGLES: Array<{ name: keyof CMSRelease; label: string; checked: (form: Partial<CMSRelease>) => boolean }> = [
  { name: 'enableLyrics', label: 'Enable Lyrics', checked: (form) => form.enableLyrics !== false },
  { name: 'enableCommentary', label: 'Enable Commentary', checked: (form) => form.enableCommentary !== false },
  { name: 'enableAdoption', label: 'Enable Adoption', checked: (form) => form.enableAdoption !== false },
  { name: 'enableCredits', label: 'Enable Credits', checked: (form) => form.enableCredits !== false },
  { name: 'enableSponsors', label: 'Enable Sponsors', checked: (form) => form.enableSponsors || false },
];

export function ReleaseFeaturesSection({ form, onCheckboxChange }: ReleaseFeaturesSectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--dash-text-primary)' }}>
        Features
      </h2>

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