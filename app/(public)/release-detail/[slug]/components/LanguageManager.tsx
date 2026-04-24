"use client";

import { Check, ChevronDown, AlertCircle } from 'lucide-react';
import { useState, memo } from 'react';

export type SubtitleStatus =
  | 'draft'
  | 'in_translation'
  | 'under_review'
  | 'verified'
  | 'published'
  | 'archived';

export interface LanguageEntry {
  code: string;
  label: string;
}

export const LANGUAGE_OPTIONS: LanguageEntry[] = [
  { code: 'roman_urdu', label: 'Roman Urdu' },
  { code: 'urdu', label: 'Urdu' },
  { code: 'hindi', label: 'Hindi' },
  { code: 'arabic', label: 'Arabic' },
  { code: 'turkish', label: 'Turkish' },
  { code: 'persian', label: 'Persian (Farsi)' },
  { code: 'punjabi', label: 'Punjabi' },
  { code: 'indonesian', label: 'Indonesian' },
  { code: 'spanish', label: 'Spanish' },
  { code: 'portuguese', label: 'Portuguese' },
  { code: 'french', label: 'French' },
  { code: 'german', label: 'German' },
  { code: 'russian', label: 'Russian' },
  { code: 'bengali', label: 'Bengali' },
  { code: 'chinese', label: 'Chinese' },
  { code: 'japanese', label: 'Japanese' },
  { code: 'english', label: 'English' },
];

export const STATUS_OPTIONS: { value: SubtitleStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'text-neutral-400' },
  { value: 'in_translation', label: 'In Translation', color: 'text-blue-400' },
  { value: 'under_review', label: 'Under Review', color: 'text-amber-400' },
  { value: 'verified', label: 'Verified', color: 'text-emerald-400' },
  { value: 'published', label: 'Published', color: 'text-green-400' },
  { value: 'archived', label: 'Archived', color: 'text-neutral-500' },
];

interface LanguageManagerProps {
  /** Array of language codes that are available/active for this release */
  availableLanguages: string[];
  /** The default/master language code */
  defaultLanguage: string;
  /** Per-language status map, e.g. { roman_urdu: 'verified', english: 'draft' } */
  languageStatuses: Record<string, SubtitleStatus>;
  /** Callback when admin changes available languages */
  onAvailableLanguagesChange: (languages: string[]) => void;
  /** Callback when admin changes the default language */
  onDefaultLanguageChange: (language: string) => void;
  /** Callback when admin changes a language's status */
  onLanguageStatusChange: (language: string, status: SubtitleStatus) => void;
}

export function LanguageManager({
  availableLanguages,
  defaultLanguage,
  languageStatuses,
  onAvailableLanguagesChange,
  onDefaultLanguageChange,
  onLanguageStatusChange,
}: LanguageManagerProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleLanguage = (code: string) => {
    const current = availableLanguages || [];
    if (current.includes(code)) {
      // Removing — if this was the default, pick a new default
      const next = current.filter((c) => c !== code);
      if (defaultLanguage === code) {
        onDefaultLanguageChange(next[0] || '');
      }
      onAvailableLanguagesChange(next);
    } else {
      onAvailableLanguagesChange([...current, code]);
    }
  };

  const getStatusForLang = (code: string): SubtitleStatus => {
    return languageStatuses?.[code] || 'draft';
  };

  const getStatusOption = (status: SubtitleStatus) =>
    STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

  const hasDataForLanguage = (code: string, release: any): boolean => {
    const st = release?.subtitle_translations || {};
    const ly = release?.lyrics || {};
    return !!(st[code] || ly[code]);
  };

  // We need access to release data to show "has data" indicator.
  // This is passed via a data prop that we'll use from the parent.
  return null; // replaced below
}

interface LanguageManagerWithReleaseProps extends Omit<LanguageManagerProps, never> {
  release: any;
}

export const LanguageManagerWithRelease = memo(({
  availableLanguages,
  defaultLanguage,
  languageStatuses,
  onAvailableLanguagesChange,
  onDefaultLanguageChange,
  onLanguageStatusChange,
  release,
}: LanguageManagerWithReleaseProps) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleLanguage = (code: string) => {
    const current = availableLanguages || [];
    if (current.includes(code)) {
      const next = current.filter((c) => c !== code);
      if (defaultLanguage === code) {
        onDefaultLanguageChange(next[0] || '');
      }
      // Also clean up status if language removed
      const newStatuses = { ...languageStatuses };
      delete newStatuses[code];
      onLanguageStatusChange(code, 'draft'); // fire cleanup
      onAvailableLanguagesChange(next);
    } else {
      onAvailableLanguagesChange([...current, code]);
    }
  };

  const getStatusForLang = (code: string): SubtitleStatus => {
    return languageStatuses?.[code] || 'draft';
  };

  const getStatusOption = (status: SubtitleStatus) =>
    STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

  const hasSubtitleData = (code: string): boolean => {
    const st = release?.subtitle_translations || {};
    return !!(st[code] && Object.keys(st[code]).length > 0);
  };

  const hasLyricsData = (code: string): boolean => {
    const ly = release?.lyrics || {};
    return !!(ly[code] && (Array.isArray(ly[code]) ? ly[code].length > 0 : true));
  };

  return (
    <div className="bg-neutral-900 border border-amber-800/40 rounded-lg p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center">
          <ChevronDown className="w-4 h-4 text-amber-400" />
        </div>
        <h3 className="text-lg font-medium text-neutral-100">Language Management</h3>
        <span className="text-xs text-neutral-500 ml-auto">
          {availableLanguages.length} active
        </span>
      </div>

      {/* Default Language Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-neutral-400 whitespace-nowrap">Default / Master Language:</label>
        <select
          value={defaultLanguage || ''}
          onChange={(e) => onDefaultLanguageChange(e.target.value)}
          className="bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-600"
        >
          {availableLanguages.map((code) => {
            const opt = LANGUAGE_OPTIONS.find((o) => o.code === code);
            return (
              <option key={code} value={code}>
                {opt?.label || code}
              </option>
            );
          })}
        </select>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-800" />

      {/* Language Grid with Checkboxes & Status */}
      <div>
        <p className="text-sm text-neutral-500 mb-3">Available Languages (check to activate):</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {LANGUAGE_OPTIONS.map((lang) => {
            const isActive = availableLanguages.includes(lang.code);
            const status = getStatusForLang(lang.code);
            const statusOpt = getStatusOption(status);
            const hasSubData = hasSubtitleData(lang.code);
            const hasLyrData = hasLyricsData(lang.code);

            return (
              <div
                key={lang.code}
                className={`rounded-lg border p-3 space-y-2 transition-colors ${
                  isActive
                    ? 'bg-neutral-800 border-neutral-700'
                    : 'bg-neutral-900 border-neutral-800 opacity-60'
                }`}
              >
                {/* Checkbox + Label */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleLanguage(lang.code)}
                    className="accent-amber-500 w-4 h-4"
                  />
                  <span className="text-sm text-neutral-200 truncate">{lang.label}</span>
                </label>

                {/* Data indicators */}
                {(hasSubData || hasLyrData) && (
                  <div className="flex gap-1 flex-wrap">
                    {hasSubData && (
                      <span className="text-[10px] bg-blue-900/40 text-blue-300 border border-blue-800/40 px-1.5 py-0.5 rounded">
                        subtitles
                      </span>
                    )}
                    {hasLyrData && (
                      <span className="text-[10px] bg-emerald-900/40 text-emerald-300 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                        lyrics
                      </span>
                    )}
                  </div>
                )}

                {/* Status Dropdown (only for active languages) */}
                {isActive && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === lang.code ? null : lang.code)}
                      onBlur={() => setTimeout(() => setOpenDropdown(null), 200)}
                      className={`w-full text-left text-xs px-2 py-1.5 rounded border flex items-center justify-between ${statusOpt.color.replace('text-', 'border-').replace('400', '800/40')} bg-neutral-900 hover:bg-neutral-850`}
                    >
                      <span className={statusOpt.color}>{statusOpt.label}</span>
                      <ChevronDown className="w-3 h-3 text-neutral-500" />
                    </button>
                    {openDropdown === lang.code && (
                      <div className="absolute z-50 w-full mt-1 bg-neutral-800 border border-neutral-700 rounded shadow-xl">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              onLanguageStatusChange(lang.code, opt.value);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left text-xs px-3 py-2 flex items-center justify-between hover:bg-neutral-700 ${
                              status === opt.value ? opt.color : 'text-neutral-400'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {status === opt.value && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Warning if no default language selected */}
      {!defaultLanguage && availableLanguages.length > 0 && (
        <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-900/20 border border-amber-800/30 rounded p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>No default language set. Select one above to establish the master reference language.</span>
        </div>
      )}
    </div>
  );
});

LanguageManagerWithRelease.displayName = 'LanguageManagerWithRelease';
