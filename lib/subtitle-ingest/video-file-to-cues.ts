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
  input: File | string,
  fps: number,
  subtitleZoneFraction: number,
  onProgress?: OcrProgressCallback
): Promise<{ dataUrl: string; timestampSec: number }[]> {
  return new Promise((resolve, reject) => {
    onProgress?.('frames', 0, 'Loading MP4 metadata…');

    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'auto';
    video.playsInline = true;

    const isFile = input instanceof File;
    const src = isFile ? URL.createObjectURL(input) : input;
    const fileMeta = isFile
      ? `${input.name} · ${(input.size / 1024 / 1024).toFixed(1)} MB · ${input.type || 'unknown type'}`
      : input;

    const rejectWithDiagnostic = (stage: string, msg: string) => {
      const err = new Error(msg) as any;
      err.diagnostic = {
        stage,
        mediaErrorCode: video.error?.code ?? null,
        mediaErrorMessage: video.error?.message ?? null,
        readyState: video.readyState,
        networkState: video.networkState,
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        currentTime: video.currentTime
      };
      reject(err);
    };

    const metadataTimer = setTimeout(() => {
      if (isFile) URL.revokeObjectURL(src);
      rejectWithDiagnostic('metadata', `Timed out waiting for video metadata. The file may be too large or corrupted. (${fileMeta})`);
    }, METADATA_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(metadataTimer);
      if (isFile) URL.revokeObjectURL(src);
    };

    const decodeErrorMsg = "This MP4 cannot be decoded by your browser. Re-export it using your video editor's standard MP4 or YouTube export preset and try again.";

    video.addEventListener('error', () => {
      cleanup();
      const code = video.error?.code;
      if (code === MediaError.MEDIA_ERR_DECODE || code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        rejectWithDiagnostic('playback_probe', decodeErrorMsg);
      } else if (code === MediaError.MEDIA_ERR_NETWORK) {
        rejectWithDiagnostic('playback_probe', `Failed to read the video file from disk. Try again. File: ${fileMeta}`);
      } else {
        rejectWithDiagnostic('playback_probe', `Could not load video file. Make sure it is a valid MP4/WebM/MOV file. File: ${fileMeta}`);
      }
    });

    video.addEventListener('loadedmetadata', async () => {
      clearTimeout(metadataTimer);
      try {
        if (!Number.isFinite(video.duration) || video.duration <= 0) {
          throw new Error('Could not determine video duration.');
        }

        onProgress?.('frames', 0, 'Testing browser playback…');

        await new Promise<void>((res, rej) => {
          let settled = false;
          const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            video.removeEventListener('seeked', onSeeked);
            rej(new Error('Probe seek timed out - browser cannot decode this video.'));
          }, SEEK_TIMEOUT_MS);

          const onSeeked = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            res();
          };

          video.addEventListener('seeked', onSeeked, { once: true });
          video.currentTime = Math.min(0.05, video.duration / 2);
        });

        if (video.videoWidth === 0 || video.videoHeight === 0) {
          const err = new Error(decodeErrorMsg) as any;
          err.stageOverride = 'dimensions';
          throw err;
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const err = new Error('Canvas 2D context unavailable in this browser.') as any;
          err.stageOverride = 'canvas_probe';
          throw err;
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        onProgress?.('frames', 0, 'Browser playback confirmed');

        const interval = 1 / fps;
        const totalFrames = Math.ceil(video.duration / interval);
        const frames: { dataUrl: string; timestampSec: number }[] = [];

        const seekAndCapture = (timestamp: number): Promise<void> =>
          new Promise((res, rej) => {
            let settled = false;

            const timer = setTimeout(() => {
              if (settled) return;
              settled = true;
              video.removeEventListener('seeked', onSeeked);
              const err = new Error(`Seek timed out at ${timestamp.toFixed(1)}s — video may be malformed.`) as any;
              err.stageOverride = 'frame_seek';
              rej(err);
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

        for (let i = 0; i < totalFrames; i++) {
          const t = i * interval;
          await seekAndCapture(t);
          if (i % 5 === 0) {
            onProgress?.('frames', Math.round((i / totalFrames) * 100), `Extracting frames… ${i}/${totalFrames}`);
          }
        }

        cleanup();
        resolve(frames);
      } catch (err: any) {
        cleanup();
        rejectWithDiagnostic(err.stageOverride || 'playback_probe', err.message);
      }
    });

    video.src = src;
    video.load();
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
  onProgress?.('ocr', 0, 'Loading OCR engine…');

  const safeRawValue = (err: unknown): string => {
    try {
      if (err instanceof Error) return err.toString();
      if (err && typeof err === 'object') {
        return JSON.stringify(err, Object.getOwnPropertyNames(err));
      }
      return String(err);
    } catch {
      return String(err);
    }
  };

  const rejectWithDiagnostic = (stage: string, err: any, extra?: any) => {
    let errorMsg = 'Unknown Tesseract error';
    if (err instanceof Error) errorMsg = err.message;
    else if (err && typeof err === 'string') errorMsg = err;
    else if (err && err.message) errorMsg = err.message;
    
    const finalErr = new Error(errorMsg) as any;
    finalErr.diagnostic = {
      stage,
      message: errorMsg,
      rawType: typeof err,
      rawValue: safeRawValue(err),
      ...extra
    };
    throw finalErr;
  };

  let createWorker;
  try {
    const tesseract = await import('tesseract.js');
    createWorker = tesseract.createWorker;
  } catch (err: any) {
    rejectWithDiagnostic('tesseract_import', err);
  }

  let worker;
  try {
    worker = await createWorker(lang, 1, {
      workerPath: '/tesseract/worker/worker.min.js',
      corePath: '/tesseract/core',
      langPath: '/tesseract/lang'
    });
  } catch (err: any) {
    rejectWithDiagnostic('worker_create', err, {
      lang,
      locationOrigin: typeof location !== 'undefined' ? location.origin : 'unknown'
    });
  }

  const results: FrameResult[] = [];
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];

    let data;
    try {
      const result = await worker.recognize(frame.dataUrl);
      data = result.data;
    } catch (err: any) {
      if (i === 0) {
        rejectWithDiagnostic('recognize', err, {
          frameIndex: i,
          frameCount: frames.length,
        });
      }

      results.push({
        timestampSec: frame.timestampSec,
        text: '',
      });

      onProgress?.(
        'ocr',
        Math.round(((i + 1) / frames.length) * 100),
        `OCR ${i + 1}/${frames.length}`
      );

      continue;
    }

    let text = '';
    if ((data.confidence || 0) >= MIN_OCR_CONFIDENCE) {
      text = (data.text || '').replace(/\s+/g, ' ').trim().normalize('NFC');
    }

    results.push({
      timestampSec: frame.timestampSec,
      text,
    });

    onProgress?.(
      'ocr',
      Math.round(((i + 1) / frames.length) * 100),
      `OCR ${i + 1}/${frames.length}`
    );
  }

  try { await worker.terminate(); } catch (e) {}

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
  input: File | string,
  options: VideoOcrOptions = {}
): Promise<IngestCue[]> {
  const fps = Math.max(0.5, Math.min(5, options.fps ?? 2));
  const subtitleZone = Math.max(0.1, Math.min(0.5, options.subtitleZone ?? 0.25));
  const ocrLang = options.ocrLang ?? 'eng';
  const { onProgress } = options;

  onProgress?.('frames', 0, 'Starting frame extraction…');
  const frames = await extractFrames(input, fps, subtitleZone, onProgress);

  onProgress?.('ocr', 0, 'Loading OCR engine…');
  const ocrResults = await ocrFrames(frames, ocrLang, onProgress);

  onProgress?.('grouping', 0, 'Building cues…');
  const cues = groupFramesIntoCues(ocrResults);
  onProgress?.('grouping', 100, `Found ${cues.length} cues`);

  return cues;
}
