/**
 * Shared normalization and validation layer for subtitle ingestion.
 *
 * All caption sources (YouTube API, timedtext, future OCR) produce best-effort
 * IngestCue[] and pass through here before anything touches the CMS.
 *
 * Contract:
 *   raw source output → normalizeParsedCues() → validateParsedCues() → CMS writer
 */

export type IngestCue = {
  startTime: string; // HH:MM:SS.mmm
  endTime: string;   // HH:MM:SS.mmm
  text: string;
};

export type NormalizeResult = {
  cues: IngestCue[];
  stats: {
    input: number;
    removedInvalidTimestamp: number;
    removedTooShort: number;
    removedEmptyText: number;
    collapsed: number;
    output: number;
  };
};

export type ValidateResult = {
  ok: boolean;
  warnings: string[];
};

// ── Timestamp helpers (inlined — no browser deps) ────────────────────────────

const normalizeCueTime = (input: string): string => {
  const cleaned = (input || '').trim().replace(',', '.');
  const parts = cleaned.split(':');
  if (parts.length < 2) return '';
  const padded = [...parts];
  while (padded.length < 3) padded.unshift('00');
  const [hh, mm, ssMs] = padded;
  const [ss, ms = '000'] = (ssMs || '0').split('.');
  return `${String(Number(hh || 0)).padStart(2, '0')}:${String(Number(mm || 0)).padStart(2, '0')}:${String(Number(ss || 0)).padStart(2, '0')}.${String(Number(ms || 0)).padStart(3, '0').slice(0, 3)}`;
};

const toSeconds = (ts: string): number => {
  const normalized = normalizeCueTime(ts);
  if (!normalized) return NaN;
  const [hh, mm, ssMs] = normalized.split(':');
  const [ss, ms = '000'] = ssMs.split('.');
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss) + Number(ms) / 1000;
};

const isValidTimestamp = (ts: string): boolean => {
  const s = toSeconds(ts);
  return Number.isFinite(s) && s >= 0;
};

// ── Main normalizer ───────────────────────────────────────────────────────────

const MIN_DURATION_SECONDS = 0.2;

export function normalizeParsedCues(raw: IngestCue[]): NormalizeResult {
  const stats = {
    input: raw.length,
    removedInvalidTimestamp: 0,
    removedTooShort: 0,
    removedEmptyText: 0,
    collapsed: 0,
    output: 0,
  };

  // 1. Validate timestamps and clean text
  const step1 = raw.filter((c) => {
    if (!isValidTimestamp(c.startTime) || !isValidTimestamp(c.endTime)) {
      stats.removedInvalidTimestamp++;
      return false;
    }
    return true;
  }).map((c) => ({
    startTime: normalizeCueTime(c.startTime),
    endTime: normalizeCueTime(c.endTime),
    text: c.text.replace(/\s+/g, ' ').trim(),
  }));

  // 2. Sort by startTime
  step1.sort((a, b) => toSeconds(a.startTime) - toSeconds(b.startTime));

  // 3. Remove cues shorter than minimum duration
  const step2 = step1.filter((c) => {
    const dur = toSeconds(c.endTime) - toSeconds(c.startTime);
    if (dur < MIN_DURATION_SECONDS) {
      stats.removedTooShort++;
      return false;
    }
    return true;
  });

  // 4. Remove empty text after cleaning
  const step3 = step2.filter((c) => {
    if (!c.text) {
      stats.removedEmptyText++;
      return false;
    }
    return true;
  });

  // 5. Collapse overlapping duplicates (same text, overlapping time window)
  const step4 = step3.reduce<IngestCue[]>((acc, cue) => {
    const prev = acc[acc.length - 1];
    if (
      prev &&
      prev.text === cue.text &&
      toSeconds(cue.startTime) <= toSeconds(prev.endTime)
    ) {
      // Extend to the later end time — never shorten a cue
      if (toSeconds(cue.endTime) > toSeconds(prev.endTime)) {
        prev.endTime = cue.endTime;
      }
      stats.collapsed++;
      return acc;
    }
    return [...acc, { ...cue }];
  }, []);

  stats.output = step4.length;
  return { cues: step4, stats };
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function validateParsedCues(cues: IngestCue[]): ValidateResult {
  const warnings: string[] = [];

  if (cues.length === 0) {
    return { ok: false, warnings: ['No cues remain after normalization.'] };
  }

  // Check for any remaining NaN timestamps (should not happen after normalize, but guard anyway)
  const badTimestamps = cues.filter(
    (c) => !isValidTimestamp(c.startTime) || !isValidTimestamp(c.endTime)
  );
  if (badTimestamps.length > 0) {
    warnings.push(`${badTimestamps.length} cue(s) have invalid timestamps after normalization.`);
  }

  // Check for endTime <= startTime
  const inverted = cues.filter((c) => toSeconds(c.endTime) <= toSeconds(c.startTime));
  if (inverted.length > 0) {
    warnings.push(`${inverted.length} cue(s) have endTime ≤ startTime.`);
  }

  const ok = badTimestamps.length === 0 && inverted.length === 0;
  return { ok, warnings };
}
