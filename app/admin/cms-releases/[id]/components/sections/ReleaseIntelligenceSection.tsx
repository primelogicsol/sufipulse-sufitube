import React from 'react';
import type { CMSRelease } from '@/lib/cms-storage';
import {
  REGIONS,
  DIASPORA_MARKETS,
  LANGUAGES,
  SUFI_CONCEPTS,
  SPIRITUAL_THEMES,
  MOODS
} from '@/lib/cms-taxonomy';

interface ReleaseIntelligenceSectionProps {
  form: Partial<CMSRelease>;
  setForm: React.Dispatch<React.SetStateAction<Partial<CMSRelease>>>;
  allReleases: CMSRelease[];
}

export function ReleaseIntelligenceSection({
  form,
  setForm,
  allReleases
}: ReleaseIntelligenceSectionProps) {
  return (
    <div id="release-intelligence-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
      <h2 className="text-xl font-semibold mb-6" style={{color: 'var(--dash-text-primary)'}}>Release Intelligence</h2>
      
      <div className="space-y-6">
        {/* Intelligence Status & Last Updated */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>
              Intelligence Status
            </label>
            <select
              name="intelligenceStatus"
              value={form.intelligenceStatus || 'draft'}
              onChange={(e) => setForm({ ...form, intelligenceStatus: e.target.value as any, intelligenceUpdatedAt: new Date().toISOString() })}
              className="form-input w-full"
            >
              <option value="draft">Draft</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          {form.intelligenceUpdatedAt && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>
                Last Updated
              </label>
              <div className="text-sm py-2 px-3 rounded bg-[var(--dash-bg-secondary)]" style={{border: '1px solid var(--dash-border)', color: 'var(--dash-text-secondary)'}}>
                {new Date(form.intelligenceUpdatedAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Target Regions */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{color: 'var(--dash-text-primary)'}}>
            Target Regions
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {REGIONS.map((region) => {
              const isActive = (form.targetRegions || []).includes(region.code);
              return (
                <label
                  key={region.code}
                  className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition text-xs font-normal"
                  style={{
                    border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                    backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                    color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => {
                      const current = form.targetRegions || [];
                      const next = e.target.checked
                        ? [...current, region.code]
                        : current.filter((c) => c !== region.code);
                      setForm({ ...form, targetRegions: next, intelligenceUpdatedAt: new Date().toISOString() });
                    }}
                    style={{accentColor: 'var(--dash-accent)'}}
                  />
                  <span>{region.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Target Diaspora Markets */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{color: 'var(--dash-text-primary)'}}>
            Target Diaspora Markets
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {DIASPORA_MARKETS.map((diaspora) => {
              const isActive = (form.targetDiaspora || []).includes(diaspora.code);
              return (
                <label
                  key={diaspora.code}
                  className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition text-xs font-normal"
                  style={{
                    border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                    backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                    color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => {
                      const current = form.targetDiaspora || [];
                      const next = e.target.checked
                        ? [...current, diaspora.code]
                        : current.filter((c) => c !== diaspora.code);
                      setForm({ ...form, targetDiaspora: next, intelligenceUpdatedAt: new Date().toISOString() });
                    }}
                    style={{accentColor: 'var(--dash-accent)'}}
                  />
                  <span>{diaspora.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Target Languages */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{color: 'var(--dash-text-primary)'}}>
            Target Languages
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {LANGUAGES.map((lang) => {
              const isActive = (form.targetLanguages || []).includes(lang.code);
              return (
                <label
                  key={lang.code}
                  className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition text-xs font-normal"
                  style={{
                    border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                    backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                    color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => {
                      const current = form.targetLanguages || [];
                      const next = e.target.checked
                        ? [...current, lang.code]
                        : current.filter((c) => c !== lang.code);
                      setForm({ ...form, targetLanguages: next, intelligenceUpdatedAt: new Date().toISOString() });
                    }}
                    style={{accentColor: 'var(--dash-accent)'}}
                  />
                  <span>{lang.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Sufi Concepts */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{color: 'var(--dash-text-primary)'}}>
            Sufi Concepts
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {SUFI_CONCEPTS.map((concept) => {
              const isActive = (form.sufiConcepts || []).includes(concept.code);
              return (
                <label
                  key={concept.code}
                  className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition text-xs font-normal"
                  style={{
                    border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                    backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                    color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => {
                      const current = form.sufiConcepts || [];
                      const next = e.target.checked
                        ? [...current, concept.code]
                        : current.filter((c) => c !== concept.code);
                      setForm({ ...form, sufiConcepts: next, intelligenceUpdatedAt: new Date().toISOString() });
                    }}
                    style={{accentColor: 'var(--dash-accent)'}}
                  />
                  <span>{concept.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Spiritual Themes */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{color: 'var(--dash-text-primary)'}}>
            Spiritual Themes
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {SPIRITUAL_THEMES.map((theme) => {
              const isActive = (form.themes || []).includes(theme.code);
              return (
                <label
                  key={theme.code}
                  className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition text-xs font-normal"
                  style={{
                    border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                    backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                    color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => {
                      const current = form.themes || [];
                      const next = e.target.checked
                        ? [...current, theme.code]
                        : current.filter((c) => c !== theme.code);
                      setForm({ ...form, themes: next, intelligenceUpdatedAt: new Date().toISOString() });
                    }}
                    style={{accentColor: 'var(--dash-accent)'}}
                  />
                  <span>{theme.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Moods */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{color: 'var(--dash-text-primary)'}}>
            Moods
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2">
            {MOODS.map((mood) => {
              const isActive = (form.moods || []).includes(mood.code);
              return (
                <label
                  key={mood.code}
                  className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition text-xs font-normal"
                  style={{
                    border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                    backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                    color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => {
                      const current = form.moods || [];
                      const next = e.target.checked
                        ? [...current, mood.code]
                        : current.filter((c) => c !== mood.code);
                      setForm({ ...form, moods: next, intelligenceUpdatedAt: new Date().toISOString() });
                    }}
                    style={{accentColor: 'var(--dash-accent)'}}
                  />
                  <span>{mood.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* SEO Keywords (Input tags list) */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>
            SEO Keywords <span className="text-xs" style={{color: 'var(--dash-text-muted)'}}>(Press Enter or comma to add)</span>
          </label>
          <div className="flex flex-wrap gap-2 p-2 rounded bg-[var(--dash-bg-secondary)] mb-2 min-h-[42px]" style={{border: '1px solid var(--dash-border)'}}>
            {(form.seoKeywords || []).map((keyword, kidx) => (
              <span
                key={kidx}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--dash-accent-muted)] text-xs text-[var(--dash-accent)] font-medium font-sans"
                style={{ border: '1px solid var(--dash-accent)' }}
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => {
                    const next = (form.seoKeywords || []).filter((_, idx) => idx !== kidx);
                    setForm({ ...form, seoKeywords: next, intelligenceUpdatedAt: new Date().toISOString() });
                  }}
                  className="hover:text-red-400 font-bold ml-1"
                >
                  &times;
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder={(form.seoKeywords || []).length === 0 ? "Add keywords..." : ""}
              className="bg-transparent border-0 outline-none flex-1 text-xs text-[var(--dash-text-primary)]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  const val = e.currentTarget.value.trim().toLowerCase();
                  if (val && !(form.seoKeywords || []).includes(val)) {
                    const next = [...(form.seoKeywords || []), val];
                    setForm({ ...form, seoKeywords: next, intelligenceUpdatedAt: new Date().toISOString() });
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Related Releases & Related Playlists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Related Releases */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{color: 'var(--dash-text-primary)'}}>
              Related Releases <span className="text-xs" style={{color: 'var(--dash-text-muted)'}}>(Select items to link, excluding current)</span>
            </label>
            <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded bg-[var(--dash-bg-secondary)]" style={{border: '1px solid var(--dash-border)'}}>
              {allReleases
                .filter(r => r.id !== form.id)
                .map((rel) => {
                  const isActive = (form.relatedReleases || []).includes(rel.id);
                  return (
                    <label
                      key={rel.id}
                      className="flex items-center gap-2 p-1.5 rounded cursor-pointer transition text-xs font-normal hover:bg-[var(--dash-bg-hover)]"
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => {
                          const current = form.relatedReleases || [];
                          const next = e.target.checked
                            ? [...current, rel.id]
                            : current.filter((c) => c !== rel.id);
                          setForm({ ...form, relatedReleases: next, intelligenceUpdatedAt: new Date().toISOString() });
                        }}
                        style={{accentColor: 'var(--dash-accent)'}}
                      />
                      <span style={{color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)'}}>{rel.title}</span>
                    </label>
                  );
                })}
              {allReleases.filter(r => r.id !== form.id).length === 0 && (
                <div className="text-center py-4 text-xs text-[var(--dash-text-muted)]">No other releases available.</div>
              )}
            </div>
          </div>

          {/* Related Playlists */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>
              Related YouTube Playlists <span className="text-xs" style={{color: 'var(--dash-text-muted)'}}>(Press Enter to add playlist ID)</span>
            </label>
            <div className="flex flex-wrap gap-2 p-2 rounded bg-[var(--dash-bg-secondary)] mb-2 min-h-[42px]" style={{border: '1px solid var(--dash-border)'}}>
              {(form.relatedPlaylists || []).map((playlistId, pidx) => (
                <span
                  key={pidx}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--dash-bg-hover)] text-xs text-[var(--dash-text-primary)] font-medium font-sans"
                  style={{ border: '1px solid var(--dash-border)' }}
                >
                  {playlistId}
                  <button
                    type="button"
                    onClick={() => {
                      const next = (form.relatedPlaylists || []).filter((_, idx) => idx !== pidx);
                      setForm({ ...form, relatedPlaylists: next, intelligenceUpdatedAt: new Date().toISOString() });
                    }}
                    className="hover:text-red-400 font-bold ml-1"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder={(form.relatedPlaylists || []).length === 0 ? "e.g. PL..." : ""}
                className="bg-transparent border-0 outline-none flex-1 text-xs text-[var(--dash-text-primary)]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim();
                    if (val && !(form.relatedPlaylists || []).includes(val)) {
                      const next = [...(form.relatedPlaylists || []), val];
                      setForm({ ...form, relatedPlaylists: next, intelligenceUpdatedAt: new Date().toISOString() });
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
