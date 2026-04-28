/**
 * Shared constants and types for the CMS release editor.
 * Extracted from app/admin/cms-releases/[id]/page.tsx for reuse and clarity.
 */

export type SubtitleStatus =
  | 'draft'
  | 'in_translation'
  | 'under_review'
  | 'verified'
  | 'published'
  | 'archived';

export type LyricsSectionType =
  | 'intro'
  | 'verse'
  | 'chorus'
  | 'bridge'
  | 'hook'
  | 'refrain'
  | 'outro'
  | 'other';

export const LYRICS_SECTION_TYPES: LyricsSectionType[] = [
  'intro', 'verse', 'chorus', 'bridge', 'hook', 'refrain', 'outro', 'other',
];

export const ALL_LANGUAGES: { code: string; label: string }[] = [
  { code: 'en',     label: 'English' },
  { code: 'ur',     label: 'Urdu' },
  { code: 'ar',     label: 'Arabic' },
  { code: 'fa',     label: 'Persian / Farsi' },
  { code: 'hi',     label: 'Hindi' },
  { code: 'pa',     label: 'Punjabi' },
  { code: 'tr',     label: 'Turkish' },
  { code: 'sd',     label: 'Sindhi' },
  { code: 'skr',    label: 'Saraiki' },
  { code: 'bal',    label: 'Balochi' },
  { code: 'ps',     label: 'Pashto' },
  { code: 'ks',     label: 'Kashmiri' },
  { code: 'bn',     label: 'Bengali' },
  { code: 'gu',     label: 'Gujarati' },
  { code: 'mr',     label: 'Marathi' },
  { code: 'ta',     label: 'Tamil' },
  { code: 'en-rom', label: 'Roman Transliteration' },
];

export type ASSStylePack = {
  fontFamily?: string;
  fontSize?: number;
  primaryColor?: string;
  secondaryColor?: string;
  outlineColor?: string;
  backColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  scaleX?: number;
  scaleY?: number;
  spacing?: number;
  angle?: number;
  outline?: number;
  shadow?: number;
  alignment?: number;
  marginL?: number;
  marginR?: number;
  marginV?: number;
  maxWidthPercent?: number;
};

export const DEFAULT_STYLE_NAME = 'Mystic_Default';

export const DEFAULT_STYLE_PACK: ASSStylePack = {
  fontFamily: 'Arial',
  fontSize: 42,
  primaryColor: '#FFFFFF',
  secondaryColor: '#FFFF00',
  outlineColor: '#202020',
  backColor: '#000000',
  bold: true,
  italic: false,
  underline: false,
  scaleX: 100,
  scaleY: 100,
  spacing: 0,
  angle: 0,
  outline: 2,
  shadow: 0,
  alignment: 2,
  marginL: 40,
  marginR: 40,
  marginV: 28,
  maxWidthPercent: 82,
};
