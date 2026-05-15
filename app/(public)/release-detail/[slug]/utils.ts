import { RTL_LANG_KEYS, LANGUAGE_OPTIONS } from './constants';
import { LanguageKey, LyricsTrack } from '../../../components/release/lyrics/lyricsData';

export const formatSecondsToTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const parseTimestampToSeconds = (timestamp?: string): number => {
  if (!timestamp) return 0;

  const normalized = timestamp.trim().replace(",", ".");
  const parts = normalized.split(":").map((part) => Number(part));

  if (parts.some((n) => Number.isNaN(n))) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
};

export const languageCandidates = (selected: string): string[] => {
  const aliases: Record<string, string[]> = {
    roman_urdu: ["roman_urdu", "roman-urdu", "roman", "ur_roman", "ur"],
    urdu: ["urdu", "ur"],
    english: ["english", "en"],
    persian: ["persian", "fa", "farsi"],
    arabic: ["arabic", "ar"],
  };

  const mapped = aliases[selected] || [selected];
  return Array.from(new Set(mapped.map((value) => value.toLowerCase())));
};

export const buildCmsCaptionTrack = (
  release: any,
  selected: string,
): LyricsTrack | null => {
  const subtitleCues = Array.isArray(release?.subtitleCues)
    ? release.subtitleCues
    : Array.isArray(release?.subtitle_cues)
      ? release.subtitle_cues
      : [];
  const subtitleTranslations =
    release?.subtitleTranslations || release?.subtitle_translations || {};
  const subtitleCueMetadata =
    release?.subtitle_cue_metadata || release?.subtitleCueMetadata || {};
  const subtitleStylePacks =
    release?.subtitle_style_packs || release?.subtitleStylePacks || {};
  const languageStyleOverrides =
    release?.language_style_overrides || release?.languageStyleOverrides || {};

  const candidates = languageCandidates(selected);
  const matchedLanguageKey = Object.keys(subtitleTranslations || {}).find(
    (lang) => candidates.includes(String(lang).toLowerCase()),
  );

  const translationMap = matchedLanguageKey
    ? subtitleTranslations?.[matchedLanguageKey]
    : null;
  const languageOverride =
    languageStyleOverrides?.[matchedLanguageKey || selected] ||
    languageStyleOverrides?.[selected] ||
    {};
  const defaultStyleName = languageOverride?.stylePack;

  if (
    subtitleCues.length > 0 &&
    translationMap &&
    typeof translationMap === "object"
  ) {
    const ordered = subtitleCues
      .filter((cue: any) => cue?.active !== false)
      .slice()
      .sort((a: any, b: any) => (a.cueNumber || 0) - (b.cueNumber || 0));

    const cues = ordered
      .map((cue: any, idx: number) => {
        const text = String(translationMap[cue.id] || "").trim();
        if (!text) return null;
        const cueMeta = subtitleCueMetadata?.[cue.id] || {};
        const styleName = cueMeta?.styleName || defaultStyleName;
        const stylePack = (styleName && subtitleStylePacks?.[styleName]) || {};
        return {
          id: cue.id || `cms-cue-${idx + 1}`,
          start: parseTimestampToSeconds(cue.startTime),
          end: parseTimestampToSeconds(cue.endTime),
          stanza: idx + 1,
          line: 1,
          text,
          styleName,
          alignment: cueMeta?.alignment ?? stylePack?.alignment,
          positionX: cueMeta?.positionX,
          positionY: cueMeta?.positionY,
          fontFamily: stylePack?.fontFamily,
          fontSize: stylePack?.fontSize,
          primaryColor: stylePack?.primaryColor,
          outlineColor: stylePack?.outlineColor,
          backColor: stylePack?.backColor,
          bold: stylePack?.bold,
          italic: stylePack?.italic,
          outline: stylePack?.outline,
          shadow: stylePack?.shadow,
          maxWidthPercent: stylePack?.maxWidthPercent,
        };
      })
      .filter(Boolean) as any[];

    if (cues.length > 0) {
      return {
        languageKey: (LANGUAGE_OPTIONS.some((option) => option.key === selected)
          ? selected
          : "english") as LanguageKey,
        label: selected.replace("_", " "),
        direction: RTL_LANG_KEYS.has(
          (matchedLanguageKey || selected).toLowerCase(),
        )
          ? "rtl"
          : "ltr",
        versionType: "translation",
        verified: true,
        fullLyrics: cues.map((cue, idx) => ({
          stanza: idx + 1,
          lines: [cue.text],
        })),
        cues,
      };
    }
  }

  const cmsLyrics = release?.lyrics || {};
  const matchedLyricsKey = Object.keys(cmsLyrics).find((lang) =>
    candidates.includes(String(lang).toLowerCase()),
  );

  const lyricRows = matchedLyricsKey ? cmsLyrics[matchedLyricsKey] : null;
  if (Array.isArray(lyricRows) && lyricRows.length > 0) {
    const cues = lyricRows
      .map((row: any, idx: number) => {
        const text = String(
          row?.text ||
            row?.translation ||
            row?.transliteration ||
            row?.urdu ||
            "",
        ).trim();
        if (!text) return null;
        const start = parseTimestampToSeconds(row?.timestamp);
        const nextStart = parseTimestampToSeconds(
          lyricRows[idx + 1]?.timestamp,
        );
        const end = nextStart > start ? nextStart : start + 4;
        return {
          id: `cms-lyric-${idx + 1}`,
          start,
          end,
          stanza: idx + 1,
          line: 1,
          text,
        };
      })
      .filter(Boolean) as any[];

    if (cues.length > 0) {
      return {
        languageKey: (LANGUAGE_OPTIONS.some((option) => option.key === selected)
          ? selected
          : "english") as LanguageKey,
        label: selected.replace("_", " "),
        direction: RTL_LANG_KEYS.has(
          (matchedLyricsKey || selected).toLowerCase(),
        )
          ? "rtl"
          : "ltr",
        versionType: "translation",
        verified: true,
        fullLyrics: cues.map((cue, idx) => ({
          stanza: idx + 1,
          lines: [cue.text],
        })),
        cues,
      };
    }
  }

  return null;
};

export const buildCaptionTrackFromPlainLyrics = (
  release: any,
  selected: string,
  durationSeconds?: number,
): LyricsTrack | null => {
  const cmsLyrics = release?.lyrics || {};
  const lyricsStructureMap =
    release?.lyrics_structure || release?.lyricsStructure || {};
  const candidates = languageCandidates(selected);
  const matchedLyricsKey =
    Object.keys(cmsLyrics || {}).find((lang) =>
      candidates.includes(String(lang).toLowerCase()),
    ) ||
    Object.keys(lyricsStructureMap || {}).find((lang) =>
      candidates.includes(String(lang).toLowerCase()),
    );

  const legacyRows = matchedLyricsKey ? cmsLyrics[matchedLyricsKey] : null;
  const structuredBlocks = matchedLyricsKey
    ? lyricsStructureMap[matchedLyricsKey]
    : null;

  if (
    Array.isArray(structuredBlocks) &&
    structuredBlocks.length > 0 &&
    durationSeconds &&
    durationSeconds > 0
  ) {
    const lines = structuredBlocks
      .filter((block: any) => block?.isPublished !== false)
      .flatMap((block: any) => (Array.isArray(block.lines) ? block.lines : []))
      .map((l) => String(l).trim())
      .filter(Boolean);

    if (lines.length > 0) {
      const cueDuration = durationSeconds / lines.length;
      const cues = lines.map((line: string, idx: number) => ({
        id: `struct-lyric-${idx + 1}`,
        start: idx * cueDuration,
        end: (idx + 1) * cueDuration,
        stanza: idx + 1,
        line: 1,
        text: line,
      }));

      return {
        languageKey: (LANGUAGE_OPTIONS.some((option) => option.key === selected)
          ? selected
          : "english") as LanguageKey,
        label: selected.replace("_", " "),
        direction: RTL_LANG_KEYS.has(
          (matchedLyricsKey || selected).toLowerCase(),
        )
          ? "rtl"
          : "ltr",
        versionType: "translation",
        verified: false,
        fullLyrics: cues.map((cue, idx) => ({
          stanza: idx + 1,
          lines: [cue.text],
        })),
        cues,
      };
    }
  }

  if (Array.isArray(legacyRows) && legacyRows.length > 0) {
    const hasTimestamps = legacyRows.some((row: any) => row?.timestamp);

    if (hasTimestamps) {
      const cues = legacyRows
        .map((row: any, idx: number) => {
          const text = String(
            row?.text ||
              row?.translation ||
              row?.transliteration ||
              row?.urdu ||
              "",
          ).trim();
          if (!text) return null;
          const start = parseTimestampToSeconds(row?.timestamp);
          const nextStart = parseTimestampToSeconds(
            legacyRows[idx + 1]?.timestamp,
          );
          const end = nextStart > start ? nextStart : start + 4;
          return {
            id: `cms-lyric-${idx + 1}`,
            start,
            end,
            stanza: idx + 1,
            line: 1,
            text,
          };
        })
        .filter(Boolean) as any[];

      if (cues.length > 0) {
        return {
          languageKey: (LANGUAGE_OPTIONS.some(
            (option) => option.key === selected,
          )
            ? selected
            : "english") as LanguageKey,
          label: selected.replace("_", " "),
          direction: RTL_LANG_KEYS.has(
            (matchedLyricsKey || selected).toLowerCase(),
          )
            ? "rtl"
            : "ltr",
          versionType: "translation",
          verified: false,
          fullLyrics: cues.map((cue, idx) => ({
            stanza: idx + 1,
            lines: [cue.text],
          })),
          cues,
        };
      }
    } else if (durationSeconds && durationSeconds > 0) {
      const lines = legacyRows
        .map((row: any) =>
          typeof row === "string"
            ? row
            : String(
                row?.text ||
                  row?.translation ||
                  row?.transliteration ||
                  row?.urdu ||
                  "",
              ),
        )
        .filter((l: string) => l.trim());

      if (lines.length > 0) {
        const cueDuration = durationSeconds / lines.length;
        const cues = lines.map((line: string, idx: number) => ({
          id: `legacy-lyric-${idx + 1}`,
          start: idx * cueDuration,
          end: (idx + 1) * cueDuration,
          stanza: idx + 1,
          line: 1,
          text: line,
        }));

        return {
          languageKey: (LANGUAGE_OPTIONS.some(
            (option) => option.key === selected,
          )
            ? selected
            : "english") as LanguageKey,
          label: selected.replace("_", " "),
          direction: RTL_LANG_KEYS.has(
            (matchedLyricsKey || selected).toLowerCase(),
          )
            ? "rtl"
            : "ltr",
          versionType: "translation",
          verified: false,
          fullLyrics: cues.map((cue, idx) => ({
            stanza: idx + 1,
            lines: [cue.text],
          })),
          cues,
        };
      }
    }
  }

  return null;
};
