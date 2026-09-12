/**
 * Safely parses standard timecodes (MM:SS, MM:SS.mmm, HH:MM:SS.mmm) to milliseconds.
 * Rejects malformed values by returning null.
 */
export function parseTimecodeToMs(tc: string): number | null {
  if (!tc || typeof tc !== 'string') return null;
  
  const trimmed = tc.trim();
  // Match MM:SS, MM:SS.mmm, HH:MM:SS, HH:MM:SS.mmm
  const regex = /^(?:(?:(\d+):)?([0-5]?\d):)?([0-5]?\d)(?:\.(\d{1,3}))?$/;
  const match = trimmed.match(regex);
  if (!match) return null;

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  
  let ms = 0;
  if (match[4]) {
    // Pad to 3 digits (e.g. .5 -> .500, .51 -> .510)
    ms = parseInt(match[4].padEnd(3, '0'), 10);
  }

  const totalMs = (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + ms;
  
  if (totalMs > 86400000 || totalMs < 0) return null;

  return totalMs;
}

/**
 * Formats milliseconds to MM:SS.mmm or HH:MM:SS.mmm
 */
export function formatMsToTimecode(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || isNaN(ms) || ms < 0) return '';
  
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  
  const hStr = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
  const mStr = minutes.toString().padStart(2, '0');
  const sStr = seconds.toString().padStart(2, '0');
  const msStr = milliseconds.toString().padStart(3, '0');
  
  return `${hStr}${mStr}:${sStr}.${msStr}`;
}
