"use client";

import { memo } from 'react';
import { Check, Eye, EyeOff, Columns } from 'lucide-react';

export interface LanguageEntry {
  code: string;
  label: string;
}

export type SubtitleStatus =
  | 'draft'
  | 'in_translation'
  | 'under_review'
  | 'verified'
  | 'published'
  | 'archived';

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

export interface LanguageSelectorProps {
  /** The full list of language codes configured for this release */
  availableLanguages: string[];
  /** Currently selected language code */
  selectedLanguage: string;
  /** Per-language status map from CMS */
  languageStatuses: Record<string, SubtitleStatus>;
  /** Callback when user picks a language */
  onSelect: (code: string) => void;
  /** Whether to show languages that have no data (subtitles or lyrics) */
  hideEmptyLanguages?: boolean;
  /** Release object to check for data presence */
  release: any;
  /** If true, show side-by-side comparison toggle */
  allowComparison?: boolean;
  /** Callback when comparison mode is toggled */
  onComparisonToggle?: () => void;
  /** Second language for comparison mode */
  comparisonLanguage?: string | null;
  /** Callback when comparison language changes */
  onComparisonChange?: (code: string | null) => void;
  /** Whether user is admin (shows draft languages) */
  isAdmin?: boolean;
}

/** Get human-readable label for a language code */
export function getLanguageLabel(code: string): string {
  const found = LANGUAGE_OPTIONS.find((o) => o.code === code);
  if (found) return found.label;
  // Fallback: format the code
  return code
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Check if a language has actual subtitle or lyrics data */
function languageHasData(code: string, release: any): boolean {
  const st = release?.subtitle_translations || {};
  const ly = release?.lyrics || {};
  const stHas = st[code] && (typeof st[code] === 'object' ? Object.keys(st[code]).length > 0 : true);
  const lyHas = ly[code] && (Array.isArray(ly[code]) ? ly[code].length > 0 : true);
  return !!stHas || !!lyHas;
}

/** Check if language status allows public display */
function isPubliclyVisible(status: SubtitleStatus): boolean {
  return ['verified', 'published'].includes(status);
}

export const LanguageSelector = memo(({
  availableLanguages,
  selectedLanguage,
  languageStatuses,
  onSelect,
  hideEmptyLanguages = true,
  release,
  allowComparison = false,
  onComparisonToggle,
  comparisonLanguage,
  onComparisonChange,
  isAdmin = false,
}: LanguageSelectorProps) => {
  // Filter languages based on admin status and data availability
  const visibleLanguages = availableLanguages.filter((code) => {
    const status = languageStatuses?.[code] || 'draft';

    // Admin sees everything
    if (isAdmin) return true;

    // Non-admin: only see publicly visible languages
    if (!isPubliclyVisible(status)) return false;

    // If hiding empty languages, skip those without data
    if (hideEmptyLanguages && !languageHasData(code, release)) return false;

    return true;
  });

  if (visibleLanguages.length === 0) {
    return (
      <div className="text-neutral-500 text-sm italic py-4">
        No languages available for this release.
      </div>
    );
  }

  return (
    <div>
      {/* Comparison Toggle (admin only) */}
      {allowComparison && isAdmin && onComparisonToggle && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-neutral-400">Select Language</p>
          <button
            onClick={onComparisonToggle}
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
          >
            <Columns className="w-3 h-3" />
            {comparisonLanguage ? 'Exit Compare' : 'Compare Mode'}
          </button>
        </div>
      )}

      {!allowComparison && (
        <p className="text-sm text-neutral-400 mb-3">Select Language</p>
      )}

      {/* Language Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
        {visibleLanguages.map((code) => {
          const label = getLanguageLabel(code);
          const isSelected = selectedLanguage === code;
          const isComparison = comparisonLanguage === code;
          const status = languageStatuses?.[code] || 'draft';
          const isVerified = isPubliclyVisible(status);
          const hasData = languageHasData(code, release);

          return (
            <button
              key={code}
              onClick={() => onSelect(code)}
              className={`relative px-4 py-3 rounded-lg border font-medium transition-all text-sm ${
                isSelected
                  ? 'bg-neutral-700 border-neutral-600 text-white shadow-lg'
                  : isComparison
                  ? 'bg-blue-900/30 border-blue-600/50 text-blue-200 shadow-lg'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:border-neutral-600'
              } ${!hasData && isAdmin ? 'opacity-50' : ''}`}
            >
              <span className="truncate">{label}</span>

              {/* Verification badge for public users */}
              {isVerified && !isAdmin && (
                <Check className="w-3 h-3 text-emerald-400 absolute top-1.5 right-1.5" />
              )}

              {/* Draft badge for admin */}
              {isAdmin && !isVerified && (
                <EyeOff className="w-3 h-3 text-neutral-500 absolute top-1.5 right-1.5" />
              )}

              {/* No data indicator for admin */}
              {isAdmin && !hasData && (
                <span className="absolute bottom-1 right-1.5 text-[9px] text-neutral-600">empty</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Comparison Language Selector */}
      {comparisonLanguage && onComparisonChange && (
        <div className="mt-4 pt-4 border-t border-neutral-800">
          <p className="text-sm text-blue-400 mb-3 flex items-center gap-2">
            <Columns className="w-3 h-3" />
            Comparison Language:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {visibleLanguages
              .filter((code) => code !== selectedLanguage)
              .map((code) => {
                const label = getLanguageLabel(code);
                const isComparison = comparisonLanguage === code;

                return (
                  <button
                    key={`compare-${code}`}
                    onClick={() => onComparisonChange(isComparison ? null : code)}
                    className={`px-4 py-2 rounded-lg border text-xs font-medium transition-all ${
                      isComparison
                        ? 'bg-blue-900/30 border-blue-600/50 text-blue-200'
                        : 'bg-neutral-800/50 border-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:border-neutral-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
});

LanguageSelector.displayName = 'LanguageSelector';
