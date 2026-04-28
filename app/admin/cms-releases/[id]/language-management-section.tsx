"use client";

import { useState } from 'react';
import type { CMSRelease } from '@/lib/cms-storage';
import { ALL_LANGUAGES } from './release-constants';

type Props = {
  form: Partial<CMSRelease>;
  onToggleLanguage: (code: string, active: boolean) => void;
  onAddCustomLanguage: (code: string, label: string) => void;
  deleteCustomLanguage: (code: string) => void;
  saveLanguageLabel: (code: string, newLabel: string) => void;
  setLanguageTone: (code: string, tone: string) => void;
  onSetRtl: (code: string, rtl: boolean) => void;
  subtitleLanguageStatuses?: Record<string, string>;
  onInputChange: React.ChangeEventHandler<HTMLSelectElement>;
  getLanguageLabel: (code: string) => string;
};

const normalizeLanguageCode = (raw: string) =>
  raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  draft:          { label: 'Draft',       color: 'var(--dash-status-draft)',    bg: 'var(--dash-status-draft-bg)' },
  in_translation: { label: 'Translating', color: 'var(--dash-status-pending)',  bg: 'var(--dash-status-pending-bg)' },
  under_review:   { label: 'Review',      color: 'var(--dash-status-pending)',  bg: 'var(--dash-status-pending-bg)' },
  verified:       { label: 'Verified',    color: 'var(--dash-status-approved)', bg: 'var(--dash-status-approved-bg)' },
  published:      { label: 'Published',   color: 'var(--dash-status-approved)', bg: 'var(--dash-status-approved-bg)' },
  archived:       { label: 'Archived',    color: 'var(--dash-status-draft)',    bg: 'var(--dash-status-draft-bg)' },
};

export function LanguageManagementSection({
  form,
  onToggleLanguage,
  onAddCustomLanguage,
  deleteCustomLanguage,
  saveLanguageLabel,
  setLanguageTone,
  onSetRtl,
  subtitleLanguageStatuses,
  onInputChange,
  getLanguageLabel,
}: Props) {
  const [editingLangCode, setEditingLangCode] = useState<string | null>(null);
  const [editingLangNewLabel, setEditingLangNewLabel] = useState('');
  const [customLangCode, setCustomLangCode] = useState('');
  const [customLangLabel, setCustomLangLabel] = useState('');

  const handleSaveLabel = (code: string, newLabel: string) => {
    saveLanguageLabel(code, newLabel);
    setEditingLangCode(null);
    setEditingLangNewLabel('');
  };

  const handleAddCustomLanguage = () => {
    const code = normalizeLanguageCode(customLangCode);
    const label = customLangLabel.trim();
    onAddCustomLanguage(code, label);
    setCustomLangCode('');
    setCustomLangLabel('');
  };

  return (
    <div id="language-management-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold" style={{color: 'var(--dash-text-primary)'}}>Language Management</h2>
          <p className="text-xs mt-1" style={{color: 'var(--dash-text-muted)'}}>Select active languages, add custom ones, set the master language, and configure translation tone per language.</p>
        </div>
        <span className="text-xs px-2 py-1 rounded" style={{backgroundColor: 'var(--dash-bg-hover)', color: 'var(--dash-text-secondary)', border: '1px solid var(--dash-border)'}}>
          {(form.availableLanguages || []).length} active
        </span>
      </div>

      {/* Preset languages grid */}
      <p className="text-xs font-medium mb-2" style={{color: 'var(--dash-text-muted)'}}>PRESET LANGUAGES</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
        {ALL_LANGUAGES.map((lang) => {
          const isActive = (form.availableLanguages || []).includes(lang.code);
          const displayLabel = form.languageLabels?.[lang.code] || lang.label;
          const isEditing = editingLangCode === lang.code;
          const statusKey = isActive ? (subtitleLanguageStatuses?.[lang.code] ?? null) : null;
          const statusBadge = statusKey ? (STATUS_BADGE[statusKey] ?? null) : null;
          return (
            <div
              key={lang.code}
              className="flex flex-col gap-1 px-3 py-2 rounded transition"
              style={{
                border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
              }}
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => onToggleLanguage(lang.code, e.target.checked)}
                  style={{accentColor: 'var(--dash-accent)'}}
                />
                <span className="text-sm font-medium" style={{color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)'}}>{displayLabel}</span>
                <span className="text-xs ml-auto" style={{color: 'var(--dash-text-muted)'}}>{lang.code}</span>
              </label>
              {statusBadge && (
                <span className="text-xs px-1.5 py-0.5 rounded self-start" style={{color: statusBadge.color, backgroundColor: statusBadge.bg}}>
                  {statusBadge.label}
                </span>
              )}
              {isActive && (
                isEditing ? (
                  <div className="flex gap-1 mt-1">
                    <input
                      type="text"
                      value={editingLangNewLabel}
                      onChange={(e) => setEditingLangNewLabel(e.target.value)}
                      className="form-input text-xs flex-1"
                      placeholder="New label"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveLabel(lang.code, editingLangNewLabel);
                        if (e.key === 'Escape') { setEditingLangCode(null); setEditingLangNewLabel(''); }
                      }}
                    />
                    <button type="button" onClick={() => handleSaveLabel(lang.code, editingLangNewLabel)} className="dashboard-btn-primary px-2 py-1 text-xs">✓</button>
                    <button type="button" onClick={() => { setEditingLangCode(null); setEditingLangNewLabel(''); }} className="dashboard-btn-secondary px-2 py-1 text-xs">✗</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <button
                      type="button"
                      onClick={() => { setEditingLangCode(lang.code); setEditingLangNewLabel(displayLabel); }}
                      className="text-xs text-left"
                      style={{color: 'var(--dash-text-muted)'}}
                    >
                      ✎ Rename label
                    </button>
                    <label className="inline-flex items-center gap-1 text-xs cursor-pointer" style={{color: 'var(--dash-text-muted)'}}>
                      <input
                        type="checkbox"
                        checked={form.languageStyleOverrides?.[lang.code]?.rtl ?? false}
                        onChange={(e) => onSetRtl(lang.code, e.target.checked)}
                        style={{accentColor: 'var(--dash-accent)'}}
                      />
                      RTL
                    </label>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Custom languages */}
      {(form.customLanguages || []).length > 0 && (
        <>
          <p className="text-xs font-medium mb-2" style={{color: 'var(--dash-text-muted)'}}>CUSTOM LANGUAGES</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
            {(form.customLanguages || []).map((lang) => {
              const isActive = (form.availableLanguages || []).includes(lang.code);
              const displayLabel = form.languageLabels?.[lang.code] || lang.label;
              const isEditing = editingLangCode === lang.code;
              const statusKey = isActive ? (subtitleLanguageStatuses?.[lang.code] ?? null) : null;
              const statusBadge = statusKey ? (STATUS_BADGE[statusKey] ?? null) : null;
              return (
                <div
                  key={lang.code}
                  className="flex flex-col gap-1 px-3 py-2 rounded transition"
                  style={{
                    border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                    backgroundColor: isActive ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                  }}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => onToggleLanguage(lang.code, e.target.checked)}
                      style={{accentColor: 'var(--dash-accent)'}}
                    />
                    <span className="text-sm font-medium" style={{color: isActive ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)'}}>{displayLabel}</span>
                    <span className="text-xs ml-auto" style={{color: 'var(--dash-text-muted)'}}>{lang.code}</span>
                  </label>
                  {statusBadge && (
                    <span className="text-xs px-1.5 py-0.5 rounded self-start" style={{color: statusBadge.color, backgroundColor: statusBadge.bg}}>
                      {statusBadge.label}
                    </span>
                  )}
                  <div className="flex gap-1 mt-1">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editingLangNewLabel}
                          onChange={(e) => setEditingLangNewLabel(e.target.value)}
                          className="form-input text-xs flex-1"
                          placeholder="New label"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveLabel(lang.code, editingLangNewLabel);
                            if (e.key === 'Escape') { setEditingLangCode(null); setEditingLangNewLabel(''); }
                          }}
                        />
                        <button type="button" onClick={() => handleSaveLabel(lang.code, editingLangNewLabel)} className="dashboard-btn-primary px-2 py-1 text-xs">✓</button>
                        <button type="button" onClick={() => { setEditingLangCode(null); setEditingLangNewLabel(''); }} className="dashboard-btn-secondary px-2 py-1 text-xs">✗</button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => { setEditingLangCode(lang.code); setEditingLangNewLabel(displayLabel); }}
                          className="text-xs flex-1 text-left"
                          style={{color: 'var(--dash-text-muted)'}}
                        >
                          ✎ Rename
                        </button>
                        <label className="inline-flex items-center gap-1 text-xs cursor-pointer" style={{color: 'var(--dash-text-muted)'}}>
                          <input
                            type="checkbox"
                            checked={form.languageStyleOverrides?.[lang.code]?.rtl ?? false}
                            onChange={(e) => onSetRtl(lang.code, e.target.checked)}
                            style={{accentColor: 'var(--dash-accent)'}}
                          />
                          RTL
                        </label>
                        <button
                          type="button"
                          onClick={() => deleteCustomLanguage(lang.code)}
                          className="text-xs"
                          style={{color: 'var(--dash-status-rejected)'}}
                          title="Delete this custom language"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add custom language */}
      <div className="p-3 rounded-lg mb-4" style={{border: '1px dashed var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)'}}>
        <p className="text-xs font-medium mb-2" style={{color: 'var(--dash-text-muted)'}}>ADD CUSTOM LANGUAGE</p>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={customLangCode}
            onChange={(e) => setCustomLangCode(e.target.value)}
            className="form-input text-sm"
            style={{width: 120}}
            placeholder="Code (e.g. dg)"
          />
          <input
            type="text"
            value={customLangLabel}
            onChange={(e) => setCustomLangLabel(e.target.value)}
            className="form-input text-sm flex-1"
            placeholder="Language name (e.g. Dogri)"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomLanguage(); } }}
          />
          <button
            type="button"
            onClick={handleAddCustomLanguage}
            disabled={!customLangCode.trim() || !customLangLabel.trim()}
            className="dashboard-btn-secondary px-3 py-1 text-sm disabled:opacity-50"
          >
            + Add Language
          </button>
        </div>
      </div>

      {/* Master language + tone per active language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>Default / Master Language</label>
          <p className="text-xs mb-2" style={{color: 'var(--dash-text-muted)'}}>The master language holds the authoritative subtitle timestamps. All other languages follow these timings.</p>
          <select
            name="defaultLanguage"
            value={form.defaultLanguage || 'en'}
            onChange={onInputChange}
            className="form-input"
            style={{width: '100%'}}
          >
            {(form.availableLanguages || ['en']).map((code) => (
              <option key={code} value={code}>{getLanguageLabel(code)} ({code})</option>
            ))}
          </select>
        </div>

        {(form.availableLanguages || []).filter((c) => c !== form.defaultLanguage).length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>Translation Tone per Language</label>
            <p className="text-xs mb-2" style={{color: 'var(--dash-text-muted)'}}>Tone guides auto-translation style. Mystic / Poetic tones suggest reverent translations; Literal gives word-for-word accuracy.</p>
            <div className="space-y-2">
              {(form.availableLanguages || []).filter((c) => c !== form.defaultLanguage).map((code) => (
                <div key={code} className="flex items-center gap-2">
                  <span className="text-sm min-w-[120px]" style={{color: 'var(--dash-text-primary)'}}>{getLanguageLabel(code)}</span>
                  <select
                    value={form.translationTone?.[code] || 'literal'}
                    onChange={(e) => setLanguageTone(code, e.target.value)}
                    className="form-input text-sm flex-1"
                  >
                    <option value="literal">Literal — word-for-word accuracy</option>
                    <option value="mystic">Mystic — spiritual / Sufi essence</option>
                    <option value="poetic">Poetic — lyrical and flowing</option>
                    <option value="scholarly">Scholarly — academic precision</option>
                    <option value="contemporary">Contemporary — modern everyday language</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
