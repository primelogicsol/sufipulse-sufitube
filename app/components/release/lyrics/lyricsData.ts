export const LYRIC_LANGUAGES = [
  { key: "roman_urdu", label: "Roman Urdu", direction: "ltr", order: 1 },
  { key: "urdu", label: "Urdu", direction: "rtl", order: 2 },
  { key: "hindi", label: "Hindi", direction: "ltr", order: 3 },
  { key: "arabic", label: "Arabic", direction: "rtl", order: 4 },
  { key: "turkish", label: "Turkish", direction: "ltr", order: 5 },
  { key: "persian", label: "Persian", direction: "rtl", order: 6 },
  { key: "punjabi", label: "Punjabi", direction: "ltr", order: 7 },
  { key: "indonesian", label: "Indonesian", direction: "ltr", order: 8 },
  { key: "spanish", label: "Spanish", direction: "ltr", order: 9 },
  { key: "portuguese", label: "Portuguese", direction: "ltr", order: 10 },
  { key: "french", label: "French", direction: "ltr", order: 11 },
  { key: "german", label: "German", direction: "ltr", order: 12 },
  { key: "russian", label: "Russian", direction: "ltr", order: 13 },
  { key: "bengali", label: "Bengali", direction: "ltr", order: 14 },
  { key: "chinese", label: "Chinese", direction: "ltr", order: 15 },
  { key: "japanese", label: "Japanese", direction: "ltr", order: 16 },
  { key: "english", label: "English", direction: "ltr", order: 17 }
] as const;

export type LanguageKey = typeof LYRIC_LANGUAGES[number]["key"];

export type CaptionCue = {
  id: string;
  start: number;
  end: number;
  text: string;
  stanza?: number;
  line?: number;
  styleName?: string;
  alignment?: number;
  positionX?: number;
  positionY?: number;
  fontFamily?: string;
  fontSize?: number;
  primaryColor?: string;
  outlineColor?: string;
  backColor?: string;
  bold?: boolean;
  italic?: boolean;
  outline?: number;
  shadow?: number;
  maxWidthPercent?: number;
};

export type LyricsTrack = {
  languageKey: LanguageKey;
  label: string;
  direction: "ltr" | "rtl";
  versionType?: "original" | "translation" | "transliteration" | "adaptation";
  verified?: boolean;
  translator?: string;
  fullLyrics: { stanza: number; lines: string[] }[];
  cues: CaptionCue[];
};

