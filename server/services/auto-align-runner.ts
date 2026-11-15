import 'server-only';
import path from 'node:path';
import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';
import { generateMultilingualPackage } from '@/server/services/multilingual-pipeline';
import { exportAllSubtitles } from '@/server/services/subtitle-generator';
import { getFfmpegPath } from '@/server/services/video-renderer';

const run = promisify(execFile);
const running = new Set<string>();
const ALIGN_LOCK_MAX_AGE_MS = 60 * 60_000;

function alignmentLockPath(draftId: string) {
  return path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'alignment', '.auto-align.lock');
}

function acquireAlignmentLock(draftId: string) {
  const lockPath = alignmentLockPath(draftId);
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  if (fs.existsSync(lockPath)) {
    const age = Date.now() - fs.statSync(lockPath).mtimeMs;
    if (age > ALIGN_LOCK_MAX_AGE_MS) fs.rmSync(lockPath, { force: true });
    else throw new AutoAlignError('Auto-sync is already running for this draft.', 409, 'AUTO_ALIGN_RUNNING');
  }
  try {
    const fd = fs.openSync(lockPath, 'wx');
    fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }), 'utf8');
    fs.closeSync(fd);
  } catch (err: any) {
    if (err?.code === 'EEXIST') {
      throw new AutoAlignError('Auto-sync is already running for this draft.', 409, 'AUTO_ALIGN_RUNNING');
    }
    throw err;
  }
  return lockPath;
}

function releaseAlignmentLock(lockPath?: string) {
  if (lockPath) fs.rmSync(lockPath, { force: true });
}

export class AutoAlignError extends Error {
  constructor(message: string, public status = 500, public code?: string, public extra?: Record<string, unknown>) {
    super(message);
  }
}

/**
 * Speaker and section for every performed lyric line, in the same order the aligner sees them
 * (headings, "**[section | note]**" and "**speaker:**" lines are directions, not sung lines).
 */
export function parseLyricLineMeta(text: string): Array<{ speaker?: string; section?: string }> {
  const out: Array<{ speaker?: string; section?: string }> = [];
  let speaker: string | undefined;
  let section: string | undefined;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const t = raw.trim();
    if (!t || t.startsWith('#')) continue;
    let m = t.match(/^\*\*\[(.*)\]\*\*$/);
    if (m) { section = m[1].split('|')[0].trim(); continue; }
    m = t.match(/^\*\*(.*):\*\*$/);
    if (m) { speaker = m[1].trim(); continue; }
    if (/^\[.*\]$/.test(t)) continue;
    out.push({ speaker, section });
  }
  return out;
}

export function isAutoAlignRunning(draftId: string) {
  if (running.has(draftId)) return true;
  const lockPath = alignmentLockPath(draftId);
  if (!fs.existsSync(lockPath)) return false;
  const age = Date.now() - fs.statSync(lockPath).mtimeMs;
  if (age > ALIGN_LOCK_MAX_AGE_MS) {
    fs.rmSync(lockPath, { force: true });
    return false;
  }
  return true;
}

function setStatus(draftId: string, status: Record<string, unknown>) {
  const d = pipelineDraftStorage.getDraft(draftId);
  if (!d) return;
  (d as any).alignmentStatus = { ...status, updatedAt: new Date().toISOString() };
  pipelineDraftStorage.saveDraft(d);
}

/**
 * Align the canonical lyrics to the genuine master audio:
 * vocal isolation -> Whisper (large-v3) -> word matching -> timeline + all subtitle tracks.
 * One run per draft at a time.
 */
export async function runAutoAlignForDraft(draftId: string, options: { model?: string; language?: string | null } = {}) {
  if (isAutoAlignRunning(draftId)) {
    throw new AutoAlignError('Auto-sync is already running for this draft.', 409, 'AUTO_ALIGN_RUNNING');
  }
  const lockPath = acquireAlignmentLock(draftId);
  running.add(draftId);
  setStatus(draftId, { state: 'running', startedAt: new Date().toISOString(), message: 'Isolating vocals and aligning lyrics…' });
  try {
    const result = await alignOnce(draftId, options);
    setStatus(draftId, {
      state: 'done',
      message: `Aligned ${result.alignedLineCount} lyric lines (${result.wordCount} words).`,
      alignedLineCount: result.alignedLineCount,
    });
    return result;
  } catch (err: any) {
    const raw = String(err?.message || err);
    setStatus(draftId, {
      state: 'failed',
      message: raw.length > 1800 ? raw.slice(-1800) : raw,
      code: err?.code,
    });
    throw err;
  } finally {
    running.delete(draftId);
    releaseAlignmentLock(lockPath);
  }
}

async function alignOnce(draftId: string, options: { model?: string; language?: string | null }) {
  const draft = pipelineDraftStorage.getDraft(draftId);
  if (!draft) throw new AutoAlignError('Draft not found', 404);
  if (!draft.masterAudio?.filePath || !fs.existsSync(draft.masterAudio.filePath)) {
    throw new AutoAlignError('Render or import the genuine master WAV before auto-sync.', 422);
  }
  if (!draft.canonicalLyrics?.text?.trim()) {
    throw new AutoAlignError('Canonical lyrics are required before auto-sync.', 422);
  }

  // Fast path: if this revision decodes to the exact same verified master SHA,
  // reuse the existing aligned timeline instead of retranscribing identical audio.
  const existingTimeline: any = draft.masterTimeline;
  const existingLines = existingTimeline?.lines || [];
  const existingConfidence = Number(existingTimeline?.validation?.confidenceScore || 0);
  const sameMaster = existingTimeline?.alignedToMasterSha256 === draft.masterAudio.sha256;
  const hasVerifiedWords = existingLines.some((line: any) => Array.isArray(line.words) && line.words.length > 0);
  const noBoundaryClashes = !Array.isArray(existingTimeline?.validation?.boundaryClashes) ||
    existingTimeline.validation.boundaryClashes.length === 0;

  if (sameMaster && hasVerifiedWords && existingConfidence >= 45 && noBoundaryClashes) {
    const draftDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId);
    const pkg = generateMultilingualPackage(existingTimeline, draft.canonicalLyrics.text, draft.primaryLanguage);

    pkg.lines.forEach((pl: any, i: number) => {
      const cue: any = existingTimeline.lines[i];
      if (!cue) return;
      cue.urduNastaliq = pl.urduNastaliq || '';
      cue.englishTranslation = pl.englishTranslation || '';
      cue.romanUrdu = pl.romanUrdu || '';
      cue.devanagariUrdu = pl.devanagariUrdu || '';
    });

    exportAllSubtitles(pkg, path.join(draftDir, 'subtitles'));
    draft.downstreamStatus.timestampsValid = true;
    draft.downstreamStatus.subtitlesValid = true;
    draft.downstreamStatus.videoValid = false;
    pipelineDraftStorage.saveDraft(draft);

    return {
      engine: 'reused_verified_timeline',
      model: 'existing',
      detectedLanguage: draft.primaryLanguage,
      alignedLineCount: existingLines.length,
      wordCount: existingTimeline.words?.length || existingLines.reduce((n: number, l: any) => n + (l.words?.length || 0), 0),
      averageMatchConfidence: existingConfidence / 100,
      masterTimeline: existingTimeline,
      reusedVerifiedTimeline: true,
    };
  }

  const requestedModel = ['tiny', 'base', 'small', 'medium', 'large-v3'].includes(String(options.model)) ? String(options.model) : 'medium';
  let model = requestedModel;
  const draftDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId);
  const workDir = path.join(draftDir, 'alignment');
  fs.mkdirSync(workDir, { recursive: true });

  const lyricsPath = path.join(workDir, 'canonical_lyrics.txt');
  const outputPath = path.join(workDir, 'auto_alignment.json');
  fs.writeFileSync(lyricsPath, draft.canonicalLyrics.text, 'utf8');

  const python = path.join(process.cwd(), '.venv-align', 'Scripts', 'python.exe');
  const script = path.join(process.cwd(), 'scripts', 'alignment', 'auto_align.py');
  if (!fs.existsSync(python)) throw new AutoAlignError('Local alignment environment is not installed.', 503);

  const hasDevanagari = /[\u0900-\u097F]/.test(draft.canonicalLyrics.text);
  const makeArgs = (modelName: string) => {
    const args = [script, '--audio', draft.masterAudio!.filePath, '--lyrics', lyricsPath, '--output', outputPath, '--model', modelName];
    if (options.language) args.push('--language', String(options.language));
    else if (hasDevanagari) args.push('--language', 'hi');
    return args;
  };

  const executeModel = async (modelName: string) => {
    await run(python, makeArgs(modelName), {
      cwd: process.cwd(),
      windowsHide: true,
      timeout: 45 * 60_000,
      maxBuffer: 16 * 1024 * 1024,
      env: { ...process.env, FFMPEG_BIN: getFfmpegPath() },
    });
  };

  try {
    await executeModel(model);
  } catch (err: any) {
    if (requestedModel === 'medium') {
      model = 'small';
      setStatus(draftId, {
        state: 'running',
        message: 'Medium alignment engine stopped unexpectedly. Retrying with the stable small model under the same quality gates…',
        fallbackModel: model,
      });
      try {
        await executeModel(model);
      } catch (fallbackErr: any) {
        const stderr = String(fallbackErr?.stderr || '').trim();
        const stdout = String(fallbackErr?.stdout || '').trim();
        const detail = (stderr || stdout || String(fallbackErr?.message || fallbackErr)).slice(-5000);
        throw new AutoAlignError(`Alignment engine failed after automatic fallback.\n${detail}`, 500, 'ALIGNMENT_ENGINE_FAILED');
      }
    } else {
      const stderr = String(err?.stderr || '').trim();
      const stdout = String(err?.stdout || '').trim();
      const detail = (stderr || stdout || String(err?.message || err)).slice(-5000);
      throw new AutoAlignError(`Alignment engine failed.\n${detail}`, 500, 'ALIGNMENT_ENGINE_FAILED');
    }
  }

  if (!fs.existsSync(outputPath)) throw new AutoAlignError('Alignment engine completed without producing output.');
  const aligned = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  const lines = Array.isArray(aligned.lines) ? aligned.lines : [];
  if (!lines.length) throw new AutoAlignError('No lyric lines could be aligned to the recording.', 422);

  const canonicalLineCount = Math.max(1, Number(aligned.canonicalLineCount || lines.length));
  const anchorCoverage = Number(aligned.anchorCoverage ?? (lines.length / canonicalLineCount));
  const tokenCoverage = Number(aligned.tokenCoverage ?? 0);
  const averageConfidence = Number(aligned.averageMatchConfidence || 0);
  if (anchorCoverage < 0.55 || tokenCoverage < 0.30 || averageConfidence < 0.45) {
    throw new AutoAlignError(
      `Auto-sync quality is below the safe threshold: ${Math.round(anchorCoverage * 100)}% of lyric lines have direct audio anchors, ${Math.round(tokenCoverage * 100)}% token coverage, confidence ${Math.round(averageConfidence * 100)}%. Captions were NOT marked valid.`,
      422, 'AUTO_ALIGNMENT_LOW_CONFIDENCE', { anchorCoverage, tokenCoverage, averageConfidence, alignedLineCount: lines.length, canonicalLineCount },
    );
  }

  // Re-read the draft: it may have changed while the (long) alignment ran.
  const fresh = pipelineDraftStorage.getDraft(draftId);
  if (!fresh || fresh.masterAudio?.sha256 !== draft.masterAudio.sha256) {
    throw new AutoAlignError('The master audio changed while aligning. Run auto-sync again for the new audio.', 409, 'MASTER_CHANGED');
  }

  const lineMeta = parseLyricLineMeta(fresh.canonicalLyrics.text);
  const cleanLines = lines.map((l: any, idx: number) => ({
    lineIndex: idx,
    vocalIndex: idx + 1,
    segmentId: 'seg_auto_align',
    sourceVariantId: fresh.activeVariantId || 'primary',
    sourceLineIndex: Number(l.sourceLineIndex ?? idx),
    speaker: lineMeta[Number(l.sourceLineIndex ?? idx)]?.speaker,
    section: lineMeta[Number(l.sourceLineIndex ?? idx)]?.section,
    startSeconds: Number(l.startSeconds),
    endSeconds: Number(l.endSeconds),
    text: String(l.text || '').trim(),
    confidence: Number(l.confidence || 0),
    isProductionDirection: false,
    words: Array.isArray(l.words) ? l.words.map((w: any) => ({
      text: String(w.text || '').trim(),
      startSeconds: Number(w.startSeconds),
      endSeconds: Number(w.endSeconds),
      sourceVariantId: fresh.activeVariantId || 'primary',
      sourceStartSeconds: Number(w.startSeconds),
      sourceEndSeconds: Number(w.endSeconds),
    })) : [],
  })).filter((l: any) => l.text && l.endSeconds > l.startSeconds && l.words.length);

  if (!cleanLines.length) throw new AutoAlignError('Alignment did not produce valid timestamped lyric words.', 422);

  fresh.masterTimeline = {
    revision: fresh.currentRevision,
    durationSeconds: Number(fresh.masterAudio!.durationSeconds || aligned.durationSeconds || 0),
    lines: cleanLines,
    words: cleanLines.flatMap((l: any) => l.words),
    stats: {
      lineCount: cleanLines.length,
      wordCount: cleanLines.reduce((n: number, l: any) => n + l.words.length, 0),
      overlapCount: 0,
      crossfadeBoundaryWarnings: 0,
    },
    validation: { isMonotonic: true, boundaryClashes: [], confidenceScore: Math.round(averageConfidence * 100) },
    // Ties the captions to the exact audio they were aligned to (staleness check).
    alignedToMasterSha256: fresh.masterAudio!.sha256,
  } as any;

  const pkg = generateMultilingualPackage(fresh.masterTimeline!, fresh.canonicalLyrics.text, fresh.primaryLanguage);
  // Store the four script versions on each cue so every language tab in the editor shows its own text.
  pkg.lines.forEach((pl: any, i: number) => {
    const cue: any = fresh.masterTimeline!.lines[i];
    if (!cue) return;
    cue.urduNastaliq = pl.urduNastaliq;
    cue.englishTranslation = pl.englishTranslation;
    cue.romanUrdu = pl.romanUrdu;
    cue.devanagariUrdu = pl.devanagariUrdu || cue.text;
  });
  exportAllSubtitles(pkg, path.join(draftDir, 'subtitles'));

  fresh.downstreamStatus.timestampsValid = true;
  fresh.downstreamStatus.subtitlesValid = true;
  fresh.downstreamStatus.videoValid = false;
  pipelineDraftStorage.saveDraft(fresh);

  return {
    engine: aligned.engine,
    model: aligned.model,
    detectedLanguage: aligned.detectedLanguage,
    alignedLineCount: cleanLines.length,
    wordCount: fresh.masterTimeline!.words.length,
    averageMatchConfidence: aligned.averageMatchConfidence,
    masterTimeline: fresh.masterTimeline,
  };
}
