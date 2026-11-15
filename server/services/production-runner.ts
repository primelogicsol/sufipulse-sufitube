import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';
import { runAutoAlignForDraft, isAutoAlignRunning } from '@/server/services/auto-align-runner';
import { renderMasterVideoForDraft } from '@/server/services/master-video-service';

export type ProductionStage =
  | 'align' | 'subtitles' | 'render1' | 'render2' | 'render3' | 'render4' | 'complete' | 'failed';

const RENDER_QUEUE = [
  { format: 'lyric_master', orientation: 'landscape', label: 'Landscape Lyric', stage: 'render1' },
  { format: 'clean_cinematic', orientation: 'landscape', label: 'Landscape Clean', stage: 'render2' },
  { format: 'lyric_master', orientation: 'portrait', label: 'Portrait Lyric', stage: 'render3' },
  { format: 'clean_cinematic', orientation: 'portrait', label: 'Portrait Clean', stage: 'render4' },
] as const;

const running = new Set<string>();
const PRODUCTION_LOCK_MAX_AGE_MS = 6 * 60 * 60_000;

function productionLockPath(draftId: string) {
  return path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, '.production.lock');
}

function isPidAlive(pid: number) {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readLiveProductionLock(draftId: string) {
  const lockPath = productionLockPath(draftId);
  if (!fs.existsSync(lockPath)) return null;
  try {
    const stat = fs.statSync(lockPath);
    const data = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    const live = isPidAlive(Number(data?.pid));
    const fresh = Date.now() - stat.mtimeMs < PRODUCTION_LOCK_MAX_AGE_MS;
    if (live && fresh) return { lockPath, data };
  } catch {}
  fs.rmSync(lockPath, { force: true });
  return null;
}

function acquireProductionLock(draftId: string) {
  const existing = readLiveProductionLock(draftId);
  if (existing) throw new Error('Production is already running for this draft.');
  const lockPath = productionLockPath(draftId);
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  const fd = fs.openSync(lockPath, 'wx');
  fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }), 'utf8');
  fs.closeSync(fd);
  return lockPath;
}

function releaseProductionLock(lockPath?: string) {
  if (lockPath) fs.rmSync(lockPath, { force: true });
}

export function isProductionRunning(draftId: string) {
  return running.has(draftId) || Boolean(readLiveProductionLock(draftId));
}

function setProduction(draftId: string, patch: Record<string, unknown>) {
  const d = pipelineDraftStorage.getDraft(draftId);
  if (!d) return;
  (d as any).productionStatus = { ...((d as any).productionStatus || {}), ...patch, updatedAt: new Date().toISOString() };
  pipelineDraftStorage.saveDraft(d);
}

function hasWordTiming(draft: any) {
  return Boolean(draft?.masterTimeline?.lines?.some((l: any) => l.words?.length)) &&
    draft.downstreamStatus?.timestampsValid && draft.downstreamStatus?.subtitlesValid &&
    (!draft.masterTimeline.alignedToMasterSha256 || draft.masterTimeline.alignedToMasterSha256 === draft.masterAudio?.sha256);
}

function isMasterCurrent(draft: any, key: string) {
  const f = draft?.video?.formats?.[key];
  return Boolean(f?.verified && f?.outputPath) && draft.downstreamStatus?.videoValid !== false;
}

/**
 * One server-owned production chain (does not depend on an open browser tab):
 *   genuine master WAV  ->  vocal isolation + auto-sync  ->  subtitles (4 tracks)  ->  4 verified masters.
 * Safe to call repeatedly: it skips finished steps and never runs twice at once.
 */
export async function runProductionChain(draftId: string) {
  if (isProductionRunning(draftId)) return { alreadyRunning: true };
  const lockPath = acquireProductionLock(draftId);
  running.add(draftId);
  const startedAt = new Date().toISOString();
  const completed: string[] = [];
  try {
    let draft: any = pipelineDraftStorage.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');
    if (!draft.masterAudio?.filePath) {
      throw new Error('No master WAV yet. Fetch or upload the genuine Suno audio and render the master first.');
    }
    setProduction(draftId, { state: 'running', stage: 'align', startedAt, completed: [], error: null, message: 'Aligning lyrics to the recording…' });

    // 1. Auto-sync (+ subtitles are exported by the aligner)
    if (isAutoAlignRunning(draftId)) {
      // another trigger already started it: wait for it rather than failing
      while (isAutoAlignRunning(draftId)) await new Promise((r) => setTimeout(r, 4000));
    }
    draft = pipelineDraftStorage.getDraft(draftId);
    if (!hasWordTiming(draft)) {
      await runAutoAlignForDraft(draftId);
    }
    setProduction(draftId, { state: 'running', error: null, stage: 'subtitles', message: 'Subtitles ready (Urdu, English, Roman Urdu, Hindi).' });

    // 2. Four masters, strictly one after another
    for (const target of RENDER_QUEUE) {
      const key = `${target.format}_${target.orientation}`;
      draft = pipelineDraftStorage.getDraft(draftId);
      if (isMasterCurrent(draft, key)) {
        completed.push(target.label);
        continue;
      }
      setProduction(draftId, { state: 'running', error: null, stage: target.stage, completed: [...completed], message: `Rendering ${target.label}…` });
      try {
        await renderMasterVideoForDraft(draftId, { format: target.format, orientation: target.orientation });
      } catch (e: any) {
        throw new Error(`${target.label} failed after ${completed.length}/4 masters: ${e?.message || e}`);
      }
      completed.push(target.label);
    }

    setProduction(draftId, { state: 'done', stage: 'complete', completed, message: 'All four verified masters are ready.', error: null });
    return { alreadyRunning: false, completed };
  } catch (err: any) {
    setProduction(draftId, { state: 'failed', stage: 'failed', completed, error: String(err?.message || err).slice(0, 800), message: undefined });
    throw err;
  } finally {
    running.delete(draftId);
    releaseProductionLock(lockPath);
  }
}
