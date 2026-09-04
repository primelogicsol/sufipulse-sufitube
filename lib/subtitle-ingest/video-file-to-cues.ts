/**
 * Client-side video OCR ingestor — runs entirely in the browser.
 *
 * Uses native HTML5 video decoding + canvas for frame extraction,
 * and Tesseract.js (WASM) for text recognition.
 *
 * Architecture (Streaming):
 *   Loop: seek video -> draw to canvas -> worker.recognize(canvas) -> incremental group -> overwrite canvas
 *
 * Browser-only — do not import from server-side code.
 */

import { IngestCue } from './normalizeParsedCues';

// ── Types ───────────────────────────────────────────────────────────────────────

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
  /** Optional cancellation signal */
  signal?: AbortSignal;
};

// ── Language map ────────────────────────────────────────────────────────────────

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

// ── Constants & Helpers ─────────────────────────────────────────────────────────

const SEEK_TIMEOUT_MS = 8000;
const METADATA_TIMEOUT_MS = 30_000;
const MIN_OCR_CONFIDENCE = 30;

const secondsToCueTime = (sec: number): string => {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

const isSimilarText = (a: string, b: string): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.includes(shorter)) return true;

  const maxDist = Math.max(2, Math.floor(longer.length * 0.15));
  let dist = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) dist++;
    if (dist > maxDist) return false;
  }
  return true;
};

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

// ── Public API ──────────────────────────────────────────────────────────────────

/**
 * Extract burned-in subtitle cues from a local video file using a bounded-memory
 * streaming pipeline.
 *
 * Runs entirely in the browser — the video is never uploaded to the server.
 */
export async function videoFileToParsedCues(
  input: File | string,
  options: VideoOcrOptions = {}
): Promise<IngestCue[]> {
  const fps = Math.max(0.5, Math.min(5, options.fps ?? 2));
  const subtitleZoneFraction = Math.max(0.1, Math.min(0.5, options.subtitleZone ?? 0.25));
  const ocrLang = options.ocrLang ?? 'eng';
  const { onProgress, signal } = options;

  let worker: any = null;
  let video: HTMLVideoElement | null = null;
  const isFile = input instanceof File;
  const src = isFile ? URL.createObjectURL(input) : (input as string);
  const fileMeta = isFile ? `${input.name} — ${(input.size / 1024 / 1024).toFixed(1)} MB — ${input.type || 'unknown type'}` : input;

  const cleanup = async () => {
    if (worker) {
      try { await worker.terminate(); } catch (e) {}
    }
    if (video) {
      video.removeAttribute('src');
      video.load();
      video = null;
    }
    if (isFile) {
      URL.revokeObjectURL(src);
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
      mediaErrorCode: video?.error?.code ?? null,
      mediaErrorMessage: video?.error?.message ?? null,
      readyState: video?.readyState ?? null,
      networkState: video?.networkState ?? null,
      duration: video?.duration ?? null,
      videoWidth: video?.videoWidth ?? null,
      videoHeight: video?.videoHeight ?? null,
      currentTime: video?.currentTime ?? null,
      ...extra
    };
    throw finalErr;
  };

  try {
    if (signal?.aborted) throw new Error('Cancelled');

    // 1. Boot Tesseract Worker
    onProgress?.('ocr', 0, 'Loading OCR engine…');
    let createWorker: any;
    try {
      const tesseract = await import('tesseract.js');
      createWorker = tesseract.createWorker;
    } catch (err: any) {
      rejectWithDiagnostic('tesseract_import', err);
    }

    try {
      worker = await createWorker(ocrLang, 1, {
        workerPath: '/tesseract/worker/worker.min.js',
        corePath: '/tesseract/core',
        langPath: '/tesseract/lang'
      });
    } catch (err: any) {
      rejectWithDiagnostic('worker_create', err, {
        lang: ocrLang,
        locationOrigin: typeof location !== 'undefined' ? location.origin : 'unknown'
      });
    }

    if (signal?.aborted) throw new Error('Cancelled');

    // 2. Load Video
    onProgress?.('frames', 0, 'Loading MP4 metadata…');
    video = document.createElement('video');
    video.muted = true;
    video.preload = 'auto';
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      const metadataTimer = setTimeout(() => {
        rejectWithDiagnostic('metadata', `Timed out waiting for video metadata. The file may be too large or corrupted. (${fileMeta})`);
      }, METADATA_TIMEOUT_MS);

      const decodeErrorMsg = "This MP4 cannot be decoded by your browser. Re-export it using your video editor's standard MP4 or YouTube export preset and try again.";

      video!.addEventListener('error', () => {
        clearTimeout(metadataTimer);
        const code = video!.error?.code;
        if (code === MediaError.MEDIA_ERR_DECODE || code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
          rejectWithDiagnostic('playback_probe', decodeErrorMsg);
        } else if (code === MediaError.MEDIA_ERR_NETWORK) {
          rejectWithDiagnostic('playback_probe', `Failed to read the video file from disk. Try again. File: ${fileMeta}`);
        } else {
          rejectWithDiagnostic('playback_probe', `Could not load video file. Make sure it is a valid MP4/WebM/MOV file. File: ${fileMeta}`);
        }
      });

      video!.addEventListener('loadedmetadata', () => {
        clearTimeout(metadataTimer);
        if (!Number.isFinite(video!.duration) || video!.duration <= 0) {
          rejectWithDiagnostic('metadata', 'Could not determine video duration.');
        } else {
          resolve();
        }
      });

      video!.src = src;
      video!.load();
    });

    if (signal?.aborted) throw new Error('Cancelled');

    // 3. Playback Probe
    onProgress?.('frames', 0, 'Testing browser playback…');
    await new Promise<void>((res, rej) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        video!.removeEventListener('seeked', onSeeked);
        const err = new Error('Probe seek timed out - browser cannot decode this video.') as any;
        err.stageOverride = 'playback_probe';
        rej(err);
      }, SEEK_TIMEOUT_MS);

      const onSeeked = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        res();
      };

      video!.addEventListener('seeked', onSeeked, { once: true });
      video!.currentTime = Math.min(0.05, video!.duration / 2);
    }).catch(err => rejectWithDiagnostic(err.stageOverride || 'playback_probe', err));

    if (video!.videoWidth === 0 || video!.videoHeight === 0) {
      rejectWithDiagnostic('dimensions', "This MP4 cannot be decoded by your browser. Re-export it using your video editor's standard MP4 or YouTube export preset and try again.");
    }
    
    // 4. Setup Canvas
    const canvas = document.createElement('canvas');
    canvas.width = video!.videoWidth;
    canvas.height = video!.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      rejectWithDiagnostic('canvas_probe', 'Canvas 2D context unavailable in this browser.');
    }
    
    ctx!.drawImage(video!, 0, 0, canvas.width, canvas.height);
    onProgress?.('frames', 0, 'Browser playback confirmed');

    // 5. Streaming Pipeline
    const interval = 1 / fps;
    const totalFrames = Math.ceil(video!.duration / interval);
    
    const srcW = video!.videoWidth;
    const srcH = video!.videoHeight;
    const cropH = Math.max(1, Math.floor(srcH * subtitleZoneFraction));
    const cropY = srcH - cropH;
    canvas.width = srcW;
    canvas.height = cropH;

    const cues: IngestCue[] = [];
    let currentText = '';
    let cueStart = 0;
    let cueLastSeen = 0;

    const finalizeCue = (endTimestamp: number) => {
      if (currentText) {
        cues.push({ startTime: secondsToCueTime(cueStart), endTime: secondsToCueTime(endTimestamp + 0.5), text: currentText });
        currentText = '';
      }
    };

    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) throw new Error('Cancelled');
      const t = i * interval;

      // a) Seek
      await new Promise<void>((res, rej) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          video!.removeEventListener('seeked', onSeeked);
          const err = new Error(`Seek timed out at ${t.toFixed(1)}s — video may be malformed.`) as any;
          err.stageOverride = 'frame_seek';
          rej(err);
        }, SEEK_TIMEOUT_MS);

        const onSeeked = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          res();
        };

        video!.addEventListener('seeked', onSeeked, { once: true });
        video!.currentTime = t;
      }).catch(err => rejectWithDiagnostic(err.stageOverride || 'frame_seek', err));

      if (signal?.aborted) throw new Error('Cancelled');

      // b) Capture
      ctx!.drawImage(video!, 0, cropY, srcW, cropH, 0, 0, srcW, cropH);

      // c) OCR
      let data;
      try {
        const result = await worker.recognize(canvas);
        data = result.data;
      } catch (err: any) {
        if (i === 0) {
          rejectWithDiagnostic('recognize', err, { frameIndex: i, frameCount: totalFrames });
        }
        // If not first frame, log and continue resiliently
        onProgress?.('ocr', Math.round(((i + 1) / totalFrames) * 100), `OCR ${i + 1}/${totalFrames}`);
        continue;
      }

      // d) Group Incremental
      let text = '';
      if ((data.confidence || 0) >= MIN_OCR_CONFIDENCE) {
        text = (data.text || '').replace(/\s+/g, ' ').trim().normalize('NFC');
      }

      if (!text) {
        finalizeCue(cueLastSeen);
      } else {
        if (isSimilarText(text, currentText)) {
          cueLastSeen = t;
        } else {
          finalizeCue(cueLastSeen);
          currentText = text;
          cueStart = t;
          cueLastSeen = t;
        }
      }

      onProgress?.('ocr', Math.round(((i + 1) / totalFrames) * 100), `OCR ${i + 1}/${totalFrames}`);
    }

    // Finalize any trailing cue
    finalizeCue(cueLastSeen);

    onProgress?.('grouping', 100, `Found ${cues.length} cues`);
    
    return cues;
  } finally {
    await cleanup();
  }
}
