import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getFfmpegPath, probeMediaFile } from './video-renderer';

const run = promisify(execFile);

/**
 * Reject frozen placeholder videos posing as dynamic productions.
 *
 * Important: do NOT decode the whole source. Long 4K Canva exports can take
 * longer than the old 30s watchdog just to scan. Instead, seek directly to
 * several timestamps, decode one tiny grayscale frame at each point, and
 * compare the frame hashes.
 */
export async function hasChangingVideoFrames(filePath: string, intervalSeconds = 45): Promise<boolean> {
  try {
    const probe = await probeMediaFile(filePath);
    if (!probe.isValid || !probe.hasVideo || !probe.durationSeconds || probe.durationSeconds <= 0.2) {
      return false;
    }

    const duration = probe.durationSeconds;
    const maxT = Math.max(0.05, duration - 0.12);
    const candidates = duration <= 6
      ? [0.08, duration * 0.25, duration * 0.5, duration * 0.75, maxT]
      : [
          Math.min(1, maxT),
          Math.min(Math.max(intervalSeconds, duration * 0.2), maxT),
          Math.min(duration * 0.5, maxT),
          Math.min(duration * 0.8, maxT),
          maxT,
        ];

    const times = [...new Set(candidates.map((t) => Math.max(0, Math.min(maxT, Number(t.toFixed(3))))))];
    const hashes: string[] = [];

    for (const t of times) {
      const { stdout } = await run(getFfmpegPath(), [
        '-hide_banner', '-loglevel', 'error',
        '-ss', String(t), '-i', filePath,
        '-an', '-frames:v', '1',
        '-vf', 'scale=64:36,format=gray',
        '-f', 'md5', '-',
      ], {
        timeout: 15_000,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      });

      const match = String(stdout || '').match(/MD5=([0-9a-f]{32})/i);
      if (match?.[1]) hashes.push(match[1].toLowerCase());

      // Two different decoded frames are sufficient to prove the source is dynamic.
      if (new Set(hashes).size >= 2) return true;
    }

    return hashes.length >= 2 && new Set(hashes).size >= 2;
  } catch {
    return false;
  }
}
