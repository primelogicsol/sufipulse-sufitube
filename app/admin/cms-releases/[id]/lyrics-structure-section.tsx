"use client";

import type { CMSRelease } from '@/lib/cms-storage';
import {
  type LyricsSectionType,
  LYRICS_SECTION_TYPES,
} from './release-constants';

import Link from 'next/link';

type Props = {
  form: Partial<CMSRelease>;
  selectedLyricsStructureLanguage: string;
  setSelectedLyricsStructureLanguage: (lang: string) => void;
  addLyricsBlock: () => void;
  updateLyricsBlock: (index: number, key: 'type' | 'heading' | 'lines' | 'isPublished', value: string | boolean) => void;
  removeLyricsBlock: (index: number) => void;
  getLyricsBlocks: (language: string) => any[];
  getLanguageLabel: (code: string) => string;
  editorHref?: string;
};

export function LyricsStructureSection({
  form,
  selectedLyricsStructureLanguage,
  setSelectedLyricsStructureLanguage,
  addLyricsBlock,
  updateLyricsBlock,
  removeLyricsBlock,
  getLyricsBlocks,
  getLanguageLabel,
  editorHref,
}: Props) {
  const blocks = getLyricsBlocks(selectedLyricsStructureLanguage);

  return (
    <div id="lyrics-structure-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold" style={{color: 'var(--dash-text-primary)'}}>Lyrics System Structure</h2>
          {editorHref && (
            <Link
              href={editorHref}
              className="text-xs mt-0.5 inline-block hover:underline"
              style={{ color: 'var(--dash-accent)' }}
            >
              Open Lyrics Editor &rarr;
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedLyricsStructureLanguage}
            onChange={(e) => setSelectedLyricsStructureLanguage(e.target.value)}
            className="form-input"
          >
            {(form.availableLanguages || ['en']).map((lang) => (
              <option key={lang} value={lang}>{getLanguageLabel(lang)}</option>
            ))}
          </select>
          <button type="button" onClick={addLyricsBlock} className="dashboard-btn-secondary px-3 py-1 text-sm">Add Section</button>
        </div>
      </div>

      <p className="text-sm mb-3" style={{color: 'var(--dash-text-muted)'}}>
        Build lyrics in sections like intro, verse, chorus, bridge, and control per-block publish visibility.
      </p>

      <div className="space-y-3">
        {blocks.length === 0 && (
          <div className="p-3 rounded" style={{border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)', color: 'var(--dash-text-muted)'}}>
            No structured lyrics blocks for this language yet.
          </div>
        )}

        {blocks.map((block: any, index: number) => (
          <div key={block.id || index} className="p-4 rounded-lg" style={{border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)'}}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <select
                value={(block.type || 'verse') as LyricsSectionType}
                onChange={(e) => updateLyricsBlock(index, 'type', e.target.value)}
                className="form-input md:col-span-2"
              >
                {LYRICS_SECTION_TYPES.map((sectionType) => (
                  <option key={sectionType} value={sectionType}>{sectionType.toUpperCase()}</option>
                ))}
              </select>

              <input
                type="text"
                value={block.heading || ''}
                onChange={(e) => updateLyricsBlock(index, 'heading', e.target.value)}
                className="form-input md:col-span-4"
                placeholder="Optional heading (e.g., Verse 1)"
              />

              <label className="md:col-span-3 inline-flex items-center gap-2 text-sm" style={{color: 'var(--dash-text-primary)'}}>
                <input
                  type="checkbox"
                  checked={block.isPublished !== false}
                  onChange={(e) => updateLyricsBlock(index, 'isPublished', e.target.checked)}
                  style={{accentColor: 'var(--dash-accent)'}}
                />
                Published block
              </label>

              <button type="button" onClick={() => removeLyricsBlock(index)} className="dashboard-btn-danger md:col-span-3 text-sm">Delete Section</button>

              <textarea
                value={Array.isArray(block.lines) ? block.lines.join('\n') : ''}
                onChange={(e) => updateLyricsBlock(index, 'lines', e.target.value)}
                className="form-input md:col-span-12"
                rows={4}
                placeholder="One lyric line per row"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
