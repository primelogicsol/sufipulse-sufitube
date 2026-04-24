"use client";

import { useState, useMemo, memo } from 'react';
import { Check, AlertCircle, Info, Languages } from 'lucide-react';
import { LANGUAGE_OPTIONS, getLanguageLabel } from './LanguageSelector';
import type { SubtitleStatus } from './LanguageManager';

interface SubtitlePasteEditorProps {
  /** Master timing cues from CMS */
  masterCues: Array<{ id: string; startTime: string; endTime: string; cueNumber?: number }>;
  /** Current subtitle_translations map: { lang: { cueId: text } } */
  subtitleTranslations: Record<string, Record<string, string>>;
  /** The default/master language code */
  defaultLanguage: string;
  /** All available language codes */
  availableLanguages: string[];
  /** Callback when admin pastes and maps subtitles for a language */
  onTranslationsChange: (language: string, translations: Record<string, string>) => void;
  /** Callback when admin changes a language's status */
  onStatusChange?: (language: string, status: SubtitleStatus) => void;
  /** Current per-language statuses */
  languageStatuses?: Record<string, SubtitleStatus>;
}

/**
 * Admin component for pasting full subtitle text per language.
 * Each line of pasted text is mapped to the corresponding master cue by index.
 */
export const SubtitlePasteEditor = memo(({
  masterCues,
  subtitleTranslations,
  defaultLanguage,
  availableLanguages,
  onTranslationsChange,
  onStatusChange,
  languageStatuses,
}: SubtitlePasteEditorProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [pastedText, setPastedText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [copiedFrom, setCopiedFrom] = useState<string>('');

  // Parse pasted text into line-to-cue mapping
  const parsedMapping = useMemo(() => {
    if (!pastedText.trim()) return { lines: [], mismatch: false, cueMappings: [] };

    const lines = pastedText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const cueMappings = lines.map((line, idx) => ({
      cueIndex: idx,
      cue: masterCues[idx] || null,
      text: line,
      matched: !!masterCues[idx],
    }));

    const mismatch = lines.length !== masterCues.length;

    return { lines, mismatch, cueMappings };
  }, [pastedText, masterCues]);

  // Get existing translations for selected language
  const existingTranslations = subtitleTranslations?.[selectedLanguage] || {};

  // Load existing translations when language changes
  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setCopiedFrom('');

    if (subtitleTranslations?.[lang]) {
      // Reconstruct text from existing cue translations (ordered by master cue index)
      const lines = masterCues
        .map((cue) => subtitleTranslations[lang]?.[cue.id] || '')
        .filter(Boolean);
      setPastedText(lines.join('\n'));
    } else {
      setPastedText('');
    }
    setShowPreview(false);
  };

  // Apply parsed lines to translations
  const handleApply = () => {
    if (!selectedLanguage) return;

    const translations: Record<string, string> = {};
    parsedMapping.cueMappings.forEach(({ cue, text }) => {
      if (cue && text) {
        translations[cue.id] = text;
      }
    });

    onTranslationsChange(selectedLanguage, translations);
    setShowPreview(false);
    setCopiedFrom('applied');
  };

  // Clear translations for selected language
  const handleClear = () => {
    if (!selectedLanguage) return;
    onTranslationsChange(selectedLanguage, {});
    setPastedText('');
    setShowPreview(false);
    setCopiedFrom('cleared');
    setTimeout(() => setCopiedFrom(''), 2000);
  };

  // Auto-fill from another language (quick copy)
  const handleCopyFrom = (sourceLang: string) => {
    if (!subtitleTranslations?.[sourceLang]) return;
    setSelectedLanguage(selectedLanguage);

    // Copy source translations as starting point
    const sourceTranslations = subtitleTranslations[sourceLang];
    const lines = masterCues
      .map((cue) => sourceTranslations[cue.id] || '')
      .filter(Boolean);

    setPastedText(lines.join('\n'));
    setCopiedFrom(sourceLang);
    setShowPreview(false);
  };

  const cueCount = masterCues.length;
  const lineCount = parsedMapping.lines.length;
  const matchedCount = parsedMapping.cueMappings.filter((m) => m.matched).length;
  const currentLangCount = Object.keys(subtitleTranslations?.[selectedLanguage] || {}).length;

  // Languages with existing translations (for copy-from)
  const languagesWithData = availableLanguages.filter(
    (lang) => lang !== selectedLanguage && subtitleTranslations?.[lang] && Object.keys(subtitleTranslations[lang]).length > 0
  );

  return (
    <div className="bg-neutral-900 border border-amber-800/40 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-amber-400/10 border-b border-amber-800/30 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center">
            <Languages className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-neutral-100">Subtitle Translator</h3>
            <p className="text-xs text-neutral-500">
              Paste full subtitle text — one line per cue. Each line maps to the master cue timing.
            </p>
          </div>
          <div className="ml-auto text-xs text-neutral-600 bg-neutral-900 px-3 py-1 rounded border border-neutral-800">
            {cueCount} master cues
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Language Selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm text-neutral-400 whitespace-nowrap">Target Language:</label>
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-600 min-w-[200px]"
          >
            <option value="">— Select Language —</option>
            {availableLanguages
              .filter((lang) => lang !== defaultLanguage)
              .map((code) => {
                const label = getLanguageLabel(code);
                const hasData = subtitleTranslations?.[code] && Object.keys(subtitleTranslations[code]).length > 0;
                return (
                  <option key={code} value={code}>
                    {label} {hasData ? `(${Object.keys(subtitleTranslations[code]).length} cues)` : ''}
                  </option>
                );
              })}
          </select>

          {/* Status indicator */}
          {selectedLanguage && languageStatuses?.[selectedLanguage] && (
            <span className={`text-xs px-2 py-1 rounded border ${
              languageStatuses[selectedLanguage] === 'verified'
                ? 'text-emerald-400 bg-emerald-900/20 border-emerald-800/40'
                : languageStatuses[selectedLanguage] === 'published'
                ? 'text-green-400 bg-green-900/20 border-green-800/40'
                : languageStatuses[selectedLanguage] === 'under_review'
                ? 'text-amber-400 bg-amber-900/20 border-amber-800/40'
                : 'text-neutral-500 bg-neutral-800 border-neutral-700'
            }`}>
              {languageStatuses[selectedLanguage].replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Copy From Existing */}
        {languagesWithData.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-neutral-500">Quick copy from:</span>
            {languagesWithData.map((lang) => (
              <button
                key={lang}
                onClick={() => handleCopyFrom(lang)}
                className="text-xs px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
              >
                {getLanguageLabel(lang)} ({Object.keys(subtitleTranslations[lang]).length} cues)
              </button>
            ))}
          </div>
        )}

        {/* Paste Area */}
        {selectedLanguage && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-neutral-300 font-medium">
                  Paste Subtitle Text for {getLanguageLabel(selectedLanguage)}
                </label>
                <span className="text-xs text-neutral-500">
                  {lineCount} lines pasted / {cueCount} cues available
                  {currentLangCount > 0 && ` • ${currentLangCount} saved`}
                </span>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  setCopiedFrom('');
                }}
                placeholder={`Paste the full subtitle translation here.\nOne line = one subtitle cue.\n\nExample:\nIn the name of love and light\nThe heart remembers what the mind forgets\n...`}
                rows={16}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-4 text-sm text-neutral-200 font-mono leading-relaxed focus:outline-none focus:border-amber-600 resize-y placeholder:text-neutral-600"
              />
            </div>

            {/* Mismatch Warning */}
            {parsedMapping.mismatch && pastedText.trim() && (
              <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-900/20 border border-amber-800/30 rounded p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {lineCount > cueCount
                    ? `You have ${lineCount} lines but only ${cueCount} master cues. Extra lines will be ignored.`
                    : `You have ${lineCount} lines but ${cueCount} master cues. ${cueCount - lineCount} cues will have no translation.`
                  }
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                disabled={!pastedText.trim()}
                className="px-4 py-2 text-sm rounded border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {showPreview ? 'Hide Preview' : 'Preview Mapping'}
              </button>

              <button
                onClick={handleApply}
                disabled={!pastedText.trim() || matchedCount === 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded border border-emerald-800/50 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="w-4 h-4" />
                Apply to {getLanguageLabel(selectedLanguage)}
              </button>

              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm rounded border border-red-800/50 text-red-400 hover:bg-red-900/20 transition-colors"
              >
                Clear
              </button>

              {copiedFrom === 'applied' && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Applied! Save changes to persist.
                </span>
              )}
            </div>

            {/* Preview Table */}
            {showPreview && pastedText.trim() && (
              <div className="border border-neutral-700 rounded-lg overflow-hidden">
                <div className="bg-neutral-800 px-4 py-2 border-b border-neutral-700">
                  <span className="text-xs text-neutral-400">
                    Cue → Translation Mapping ({matchedCount} of {cueCount} matched)
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-neutral-900 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-neutral-500 font-medium border-b border-neutral-800">#</th>
                        <th className="text-left px-3 py-2 text-neutral-500 font-medium border-b border-neutral-800">Time</th>
                        <th className="text-left px-3 py-2 text-neutral-500 font-medium border-b border-neutral-800">Translation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedMapping.cueMappings.map((mapping, idx) => (
                        <tr key={idx} className={`border-b border-neutral-800/50 ${!mapping.matched ? 'opacity-40' : ''}`}>
                          <td className="px-3 py-1.5 text-neutral-600 font-mono w-10">
                            {mapping.cue?.cueNumber || idx + 1}
                          </td>
                          <td className="px-3 py-1.5 text-neutral-500 font-mono w-32 whitespace-nowrap">
                            {mapping.cue?.startTime || '--:--:--'}
                          </td>
                          <td className={`px-3 py-1.5 ${mapping.matched ? 'text-neutral-200' : 'text-neutral-600 italic'}`}>
                            {mapping.text || <span className="text-neutral-600">(no text)</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* No cues available */}
        {cueCount === 0 && (
          <div className="flex items-center gap-2 text-neutral-500 text-sm bg-neutral-800/50 border border-neutral-700 rounded p-4">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              No master subtitle cues exist for this release. Create timing cues first in the CMS editor, or paste text to auto-generate them.
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

SubtitlePasteEditor.displayName = 'SubtitlePasteEditor';
