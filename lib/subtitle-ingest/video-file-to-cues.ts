/**
 * Client-side video OCR ingestor — runs entirely in the browser.
 *
 * Uses native HTML5 video decoding + canvas for frame extraction (no FFmpeg binary),
 * and Tesseract.js (WASM) for text recognition.
 *
 * Architecture:
 *   File → extractFrames() → ocrFrames() → groupFramesIntoCues() → IngestCue[]
 *
 * Browser-only — do not import from server-side code.
 */

import { IngestCue } from './normalizeParsedCues';

// ── Types ─────────────────────────────────────────────────────────────────────

export type OcrProgressCallback = (stage: 'frames' | 'ocr' | 'grouping', progress: number, detail?: string) => void;

export type VideoOcrOptions = {
  /** Frames to sample per second (default 2). Higher = more accurate, slower. */
  fps?: number;
  /** Fraction of frame height from the bottom to crop as subtitle region (default 0.25). */
  subtitleZone?: number;
  /** Tesseract language code (default 'eng'). Use 'hin' for Devanagari, 'ara' for Arabic. */
  ocrLang?: string;
  /** Progress callback for UI feedback. */
  onProgress?: OcrProgressCallback;
};

type FrameResult = {
  timestampSec: number;
  text: string;
};

// ── Language map ──────────────────────────────────────────────────────────────

export const CMS_LANG_TO_TESSERACT: Record<string, string> = {
  en: 'eng',
  hi: 'hin',
  ur: 'urd',
  ar: 'ara',
  fa: 'fas',
  pa: 'pan',
  bn: 'ben',
  gu: 'guj',
  mr: 'mar',
  ta: 'tam',
  tr: 'tur',
};

/** Returns the Tesseract language code for a CMS language code. Falls back to 'eng'. */
export function cmsLangToTesseract(cmsLang: string): string {
  return CMS_LANG_TO_TESSERACT[cmsLang] || 'eng';
}

/** Returns true if the language has a known Tesseract pack. False means OCR will fall back to eng. */
export function isTesseractLangSupported(cmsLang: string): boolean {
  return cmsLang in CMS_LANG_TO_TESSERACT;
}

// ── Frame extraction ──────────────────────────────────────────────────────────

const SEEK_TIMEOUT_MS = 8000;
const METADATA_TIMEOUT_MS = 30_000;

async function extractFrames(
  file: File,
  fps: number,
  subtitleZoneFraction: number,
  onProgress?: OcrProgressCallback
): Promise<{ dataUrl: string; timestampSec: number }[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';

    // Pre-check: if browser reports zero support for this MIME type, fail fast
    if (file.type && video.canPlayType(file.type) === '') {
      reject(new Error(
        `Your browser cannot play ${file.type}. Try Chrome, or re-export the video as MP4 (H.264 codec).`
      ));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const fileMeta = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB · ${file.type || 'unknown type'}`;

    const metadataTimer = setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(
        `Timed out waiting for video metadata. The file may be too large or corrupted. (${fileMeta})`
      ));
    }, METADATA_TIMEOUT_MS);

    video.src = objectUrl;

    video.addEventListener('error', () => {
      clearTimeout(metadataTimer);
      URL.revokeObjectURL(objectUrl);
      const code = video.error?.code;
      let msg: string;
      if (code === MediaError.MEDIA_ERR_DECODE || code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        msg = `Codec not supported — re-export as MP4 with H.264 codec (not H.265/HEVC). File: ${fileMeta}`;
      } else if (code === MediaError.MEDIA_ERR_NETWORK) {
        msg = `Failed to read the video file from disk. Try again. File: ${fileMeta}`;
      } else {
        msg = `Could not load video file. Make sure it is a valid MP4/WebM/MOV file. File: ${fileMeta}`;
      }
      reject(new Error(msg));
    });

    video.addEventListener('loadedmetadata', async () => {
      clearTimeout(metadataTimer);
      // Wrap entire async body — errors inside async event handlers are otherwise silently swallowed
      try {
        const duration = video.duration;
        if (!Number.isFinite(duration) || duration <= 0) {
          throw new Error('Could not determine video duration.');
        }

        // Guard against metadata loaded but dimensions not yet available
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          throw new Error('Could not read video dimensions. The file may be corrupted or use an unsupported codec.');
        }

        const interval = 1 / fps;
        const totalFrames = Math.ceil(duration / interval);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable in this browser.');

        const frames: { dataUrl: string; timestampSec: number }[] = [];

        const seekAndCapture = (timestamp: number): Promise<void> =>
          new Promise((res, rej) => {
            let settled = false;

            const timer = setTimeout(() => {
              if (settled) return;
              settled = true;
              video.removeEventListener('seeked', onSeeked);
              rej(new Error(`Seek timed out at ${timestamp.toFixed(1)}s — video may be malformed.`));
            }, SEEK_TIMEOUT_MS);

            const onSeeked = () => {
              if (settled) return;
              settled = true;
              clearTimeout(timer);

              const srcW = video.videoWidth;
              const srcH = video.videoHeight;
              const cropH = Math.max(1, Math.floor(srcH * subtitleZoneFraction));
              const cropY = srcH - cropH;

              canvas.width = srcW;
              canvas.height = cropH;
              ctx.drawImage(video, 0, cropY, srcW, cropH, 0, 0, srcW, cropH);
              frames.push({ dataUrl: canvas.toDataURL('image/png', 0.85), timestampSec: timestamp });
              res();
            };

            video.addEventListener('seeked', onSeeked, { once: true });
            video.currentTime = timestamp;
          });

        for (let i = 0; i <= totalFrames; i++) {
          const ts = Math.min(i * interval, duration - 0.05);
          await seekAndCapture(ts);
          onProgress?.('frames', Math.round((i / totalFrames) * 100), `Frame ${i + 1}/${totalFrames + 1}`);
        }

        URL.revokeObjectURL(objectUrl);
        resolve(frames);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    });
  });
}

// ── OCR ───────────────────────────────────────────────────────────────────────

// Frames where Tesseract confidence is below this threshold are treated as empty
// (likely a blank/transition frame or pure noise).
const MIN_OCR_CONFIDENCE = 30;

async function ocrFrames(
  frames: { dataUrl: string; timestampSec: number }[],
  lang: string,
  onProgress?: OcrProgressCallback
): Promise<FrameResult[]> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(lang);

  const results: FrameResult[] = [];
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    try {
      const { data } = await worker.recognize(frame.dataUrl);

      let text = '';
      if ((data.confidence || 0) >= MIN_OCR_CONFIDENCE) {
        // NFC normalization is critical for Devanagari/Arabic Unicode — ensures
        // combining diacritics are in canonical form so text comparison works correctly.
        text = (data.text || '')
          .replace(/\s+/g, ' ')
          .trim()
          .normalize('NFC');
      }

      results.push({ timestampSec: frame.timestampSec, text });
    } catch {
      results.push({ timestampSec: frame.timestampSec, text: '' });
    }
    onProgress?.('ocr', Math.round(((i + 1) / frames.length) * 100), `OCR ${i + 1}/${frames.length}`);
  }

  await worker.terminate();
  return results;
}

// ── Cue grouping ──────────────────────────────────────────────────────────────

const secondsToCueTime = (sec: number): string => {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

/**
 * Check whether two OCR results are similar enough to be the same subtitle.
 *
 * Uses substring containment first (fast, handles OCR prefix/suffix trimming),
 * then positional character diff with a minimum tolerance of 2 characters.
 *
 * Minimum tolerance of 2 prevents zero-tolerance on short Hindi/Arabic lines
 * where Math.floor(len * 0.15) would otherwise be 0 or 1.
 */
const isSimilarText = (a: string, b: string): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  // Substring containment handles cases where OCR drops a word from the edge
  if (longer.includes(shorter)) return true;

  // Positional diff with minimum tolerance = max(2, 15% of longer string)
  const maxDist = Math.max(2, Math.floor(longer.length * 0.15));
  let dist = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) dist++;
    if (dist > maxDist) return false;
  }
  return true;
};

function groupFramesIntoCues(frames: FrameResult[]): IngestCue[] {
  const cues: IngestCue[] = [];
  let currentText = '';
  let cueStart = 0;
  let cueLastSeen = 0;

  for (const frame of frames) {
    const text = frame.text;
    if (!text) {
      if (currentText) {
        cues.push({ startTime: secondsToCueTime(cueStart), endTime: secondsToCueTime(cueLastSeen + 0.5), text: currentText });
        currentText = '';
      }
      continue;
    }

    if (isSimilarText(text, currentText)) {
      cueLastSeen = frame.timestampSec;
    } else {
      if (currentText) {
        cues.push({ startTime: secondsToCueTime(cueStart), endTime: secondsToCueTime(cueLastSeen + 0.5), text: currentText });
      }
      currentText = text;
      cueStart = frame.timestampSec;
      cueLastSeen = frame.timestampSec;
    }
  }

  if (currentText) {
    cues.push({ startTime: secondsToCueTime(cueStart), endTime: secondsToCueTime(cueLastSeen + 0.5), text: currentText });
  }

  return cues;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Extract burned-in subtitle cues from a local video file.
 * Runs entirely in the browser — the video is never uploaded to the server.
 *
 * Result is automatically passed through normalizeParsedCues() + validateParsedCues()
 * by the server endpoint before writing to the CMS.
 */
export async function videoFileToParsedCues(
  file: File,
  options: VideoOcrOptions = {}
): Promise<IngestCue[]> {
  const fps = Math.max(0.5, Math.min(5, options.fps ?? 2));
  const subtitleZone = Math.max(0.1, Math.min(0.5, options.subtitleZone ?? 0.25));
  const ocrLang = options.ocrLang ?? 'eng';
  const { onProgress } = options;

  onProgress?.('frames', 0, 'Starting frame extraction…');
  const frames = await extractFrames(file, fps, subtitleZone, onProgress);

  onProgress?.('ocr', 0, 'Loading OCR engine…');
  const ocrResults = await ocrFrames(frames, ocrLang, onProgress);

  onProgress?.('grouping', 0, 'Building cues…');
  const cues = groupFramesIntoCues(ocrResults);
  onProgress?.('grouping', 100, `Found ${cues.length} cues`);

  return cues;
}
