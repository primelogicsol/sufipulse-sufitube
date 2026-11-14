/**
 * server/services/duration-parser.ts
 *
 * Robust duration parser for user inputs in SufiPulse Hybrid Studio:
 * Handles:
 * - "4:45" -> 285s
 * - "04:45" -> 285s
 * - "1:02:15" -> 3735s
 * - "4.45" (dot notation shorthand for 4m 45s) -> 285s
 * - "4m 45s", "4m45s", "4m", "285s"
 * - Raw seconds: 285.2
 */
export function parseDurationInput(val: any): number | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim().toLowerCase();
  if (!str) return null;

  // Handle format like "4m 45s", "4m45s", "4m"
  const mMatch = str.match(/^(\d+(?:\.\d+)?)\s*m(?:in)?(?:\s*(\d+(?:\.\d+)?)\s*s(?:ec)?)?$/);
  if (mMatch) {
    const mins = parseFloat(mMatch[1]);
    const secs = mMatch[2] ? parseFloat(mMatch[2]) : 0;
    return Math.round((mins * 60 + secs) * 100) / 100;
  }

  // Handle format like "285s", "285.2s"
  const sMatch = str.match(/^(\d+(?:\.\d+)?)\s*s(?:ec)?$/);
  if (sMatch) {
    return parseFloat(sMatch[1]);
  }

  // Handle format with colon: "M:SS", "MM:SS", "H:MM:SS"
  if (str.includes(':')) {
    const parts = str.split(':').map((p) => parseFloat(p));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return Math.round((parts[0] * 60 + parts[1]) * 100) / 100;
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return Math.round((parts[0] * 3600 + parts[1] * 60 + parts[2]) * 100) / 100;
    }
  }

  // Handle dot notation shorthand for MM.SS (e.g. "4.45" typed instead of "4:45")
  const dotParts = str.split('.');
  if (dotParts.length === 2) {
    const mins = parseInt(dotParts[0], 10);
    const secStr = dotParts[1];
    if (!isNaN(mins) && mins < 30 && secStr.length === 2) {
      const secs = parseInt(secStr, 10);
      if (secs < 60) {
        return mins * 60 + secs;
      }
    }
  }

  const num = parseFloat(str);
  if (!isNaN(num) && num > 0) {
    return num;
  }
  return null;
}
