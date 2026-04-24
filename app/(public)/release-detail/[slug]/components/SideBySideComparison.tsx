"use client";

import { memo } from 'react';
import { Columns, X } from 'lucide-react';
import { getLanguageLabel } from './LanguageSelector';

interface SideBySideComparisonProps {
  /** Primary language code */
  primaryLanguage: string;
  /** Secondary/comparison language code */
  comparisonLanguage: string;
  /** Release object containing lyrics/subtitle data */
  release: any;
  /** Lyrics structure map if available */
  lyricsStructure?: Record<string, any[]>;
  /** Callback to exit comparison mode */
  onClose: () => void;
}

/**
 * Renders lyrics/subtitles for two languages side by side.
 * Supports both structured (lyricsStructure) and flat (lyrics array) data.
 */
export const SideBySideComparison = memo(({
  primaryLanguage,
  comparisonLanguage,
  release,
  lyricsStructure,
  onClose,
}: SideBySideComparisonProps) => {
  const primaryLabel = getLanguageLabel(primaryLanguage);
  const comparisonLabel = getLanguageLabel(comparisonLanguage);

  // Extract data for each language
  const getLanguageContent = (langCode: string) => {
    const structuredBlocks = lyricsStructure?.[langCode] || release?.lyrics_structure?.[langCode];
    const legacyLyrics = release?.lyrics?.[langCode];

    if (Array.isArray(structuredBlocks) && structuredBlocks.length > 0) {
      return {
        type: 'structured' as const,
        blocks: structuredBlocks
          .filter((b: any) => b?.isPublished !== false)
          .sort((a: any, b: any) => (a?.order || 0) - (b?.order || 0)),
      };
    }

    if (Array.isArray(legacyLyrics) && legacyLyrics.length > 0) {
      return {
        type: 'legacy' as const,
        rows: legacyLyrics,
      };
    }

    // Check subtitle translations
    const subtitleTranslations = release?.subtitle_translations?.[langCode];
    const subtitleCues = release?.subtitle_cues || [];
    if (subtitleTranslations && subtitleCues.length > 0) {
      return {
        type: 'subtitles' as const,
        cues: subtitleCues
          .filter((cue: any) => subtitleTranslations[cue.id])
          .map((cue: any, idx: number) => ({
            cueNumber: cue.cueNumber || idx + 1,
            text: subtitleTranslations[cue.id],
            startTime: cue.startTime,
          })),
      };
    }

    return { type: 'none' as const };
  };

  const primaryContent = getLanguageContent(primaryLanguage);
  const comparisonContent = getLanguageContent(comparisonLanguage);

  const renderContentBlock = (content: ReturnType<typeof getLanguageContent>, langCode: string, side: 'primary' | 'comparison') => {
    const borderColor = side === 'primary' ? 'border-amber-400/30' : 'border-blue-400/30';
    const headerBg = side === 'primary' ? 'bg-amber-400/10' : 'bg-blue-400/10';
    const headerText = side === 'primary' ? 'text-amber-300' : 'text-blue-300';

    if (content.type === 'none') {
      return (
        <div className={`bg-neutral-900 border border-neutral-800 rounded-lg p-8`}>
          <p className="text-neutral-500 text-center">No content available for {getLanguageLabel(langCode)}</p>
        </div>
      );
    }

    if (content.type === 'structured') {
      return (
        <div className={`bg-neutral-900 border ${borderColor} rounded-lg overflow-hidden`}>
          <div className={`${headerBg} px-6 py-3 border-b border-neutral-800`}>
            <h4 className={`font-medium ${headerText}`}>{getLanguageLabel(langCode)} (Structured)</h4>
          </div>
          <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
            {content.blocks.map((block: any, idx: number) => (
              <div key={block.id || idx} className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-neutral-200">
                    {block.heading || `${(block.type || 'section').toUpperCase()} ${idx + 1}`}
                  </h5>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">
                    {block.type || 'section'}
                  </span>
                </div>
                <div className="space-y-1">
                  {(Array.isArray(block.lines) ? block.lines : []).map((line: string, lineIndex: number) => (
                    <p key={lineIndex} className="text-neutral-300 leading-relaxed text-base font-serif">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (content.type === 'legacy') {
      return (
        <div className={`bg-neutral-900 border ${borderColor} rounded-lg overflow-hidden`}>
          <div className={`${headerBg} px-6 py-3 border-b border-neutral-800`}>
            <h4 className={`font-medium ${headerText}`}>{getLanguageLabel(langCode)}</h4>
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto">
            <div className="space-y-3">
              {content.rows.map((row: any, idx: number) => {
                const text = row?.translation || row?.transliteration || row?.urdu || row?.text || '';
                if (!text) return null;
                return (
                  <p key={idx} className="text-neutral-300 whitespace-pre-line leading-relaxed text-base font-serif">
                    {text}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (content.type === 'subtitles') {
      return (
        <div className={`bg-neutral-900 border ${borderColor} rounded-lg overflow-hidden`}>
          <div className={`${headerBg} px-6 py-3 border-b border-neutral-800`}>
            <h4 className={`font-medium ${headerText}`}>{getLanguageLabel(langCode)} (Subtitles)</h4>
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto">
            <div className="space-y-3">
              {content.cues.map((cue: any, idx: number) => (
                <div key={idx} className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-neutral-600 font-mono">
                      {cue.startTime || '--:--'}
                    </span>
                    <span className="text-[10px] text-neutral-600">#{cue.cueNumber}</span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed text-sm">{cue.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="pt-8">
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Columns className="w-5 h-5 text-neutral-400" />
            <h3 className="text-xl font-medium text-neutral-100">Side-by-Side Comparison</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Side-by-Side Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primary Language */}
          <div>
            {renderContentBlock(primaryContent, primaryLanguage, 'primary')}
          </div>

          {/* Comparison Language */}
          <div>
            {renderContentBlock(comparisonContent, comparisonLanguage, 'comparison')}
          </div>
        </div>

        {/* Sync Indicator */}
        <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <span>
            Comparing: <span className="text-amber-400">{primaryLabel}</span> ↔ <span className="text-blue-400">{comparisonLabel}</span>
          </span>
          {primaryContent.type === 'structured' && comparisonContent.type === 'structured' && (
            <span className="text-emerald-500">✓ Block-aligned</span>
          )}
        </div>
      </div>
    </div>
  );
});

SideBySideComparison.displayName = 'SideBySideComparison';
