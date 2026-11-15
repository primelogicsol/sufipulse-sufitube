import 'server-only';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';
import { hasChangingVideoFrames } from '@/server/services/video-motion-validator';
import { render1080pMusicVideo, getFfmpegPath, probeMediaFile } from '@/server/services/video-renderer';
import { applyDefaultVideoParts } from '@/server/services/default-video-parts';

export class MasterVideoError extends Error {
  constructor(message: string, public status = 422, public code?: string) {
    super(message);
  }
}

export interface MasterVideoParams {
  format?: 'lyric_master' | 'clean_cinematic' | string;
  orientation?: 'landscape' | 'portrait' | string;
  partAEnabled?: boolean;
  partADurationSeconds?: number;
  partBPlaybackMode?: string;
  partCEnabled?: boolean;
  partCAudioMode?: string;
}

/**
 * Render one delivery master (Part A + Part B + Part C) for a draft and record it.
 * Shared by the render-video API route and the automated production chain.
 */
export async function renderMasterVideoForDraft(draftId: string, body: MasterVideoParams = {}) {
  const draft = pipelineDraftStorage.getDraft(draftId);
  if (!draft) throw new MasterVideoError('Draft not found', 404);
  if (applyDefaultVideoParts(draft)) pipelineDraftStorage.saveDraft(draft);

  if (!draft.masterAudio || !fs.existsSync(draft.masterAudio.filePath)) {
    throw new MasterVideoError('A real, readable master WAV is required before video rendering.');
  }
  if (!draft.masterTimeline?.lines?.some((line) => !line.isProductionDirection && line.text?.trim())) {
    throw new MasterVideoError('Phase 2 has no timed vocal lines. Generate and review actual caption timing before rendering.');
  }
  if (!draft.downstreamStatus.timestampsValid || !draft.downstreamStatus.subtitlesValid) {
    throw new MasterVideoError('Phase 2 timing and subtitle verification must pass before rendering.');
  }
  const alignedTo = (draft.masterTimeline as any)?.alignedToMasterSha256;
  if (alignedTo && alignedTo !== draft.masterAudio.sha256) {
    throw new MasterVideoError('The captions were aligned to a different recording than the current master. Run Auto-Sync again.', 422, 'CAPTIONS_STALE');
  }
  const assemblySources = draft.assembly.segments.filter((s) => s.enabled).map((s) => s.sourceVariantId);
  const selectedSources = assemblySources.length ? assemblySources : [draft.activeVariantId];
  if (selectedSources.some((id) => !draft.variants[id] || draft.variants[id].sourceType === 'suno_url')) {
    throw new MasterVideoError('Suno source audio is not verified. Re-ingest the genuine recording in Phase 1.');
  }

  const format = (body.format === 'clean_cinematic' ? 'clean_cinematic' : 'lyric_master') as 'lyric_master' | 'clean_cinematic';
  if (format === 'lyric_master' && (!draft.masterTimeline?.lines?.length || !draft.masterTimeline.lines.some((l) => l.words?.length))) {
    throw new MasterVideoError('Cannot burn unsynchronized captions: the master timeline has no verified source-aligned lyric words.', 422, 'CAPTION_ALIGNMENT_MISSING');
  }
  const orientation = (body.orientation === 'portrait' ? 'portrait' : 'landscape') as 'landscape' | 'portrait';

  const videoDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video');
  fs.mkdirSync(videoDir, { recursive: true });
  const key = `${format}_${orientation}`;
  const outputPath = path.join(videoDir, `video_${format}_${orientation}_rev${draft.currentRevision}.mp4`);
  const subDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'subtitles');
  const portraitSub = path.join(subDir, 'master_dual_urdu_english_portrait.ass');
  const defaultSub = path.join(subDir, 'master_dual_urdu_english.ass');
  const subPath = orientation === 'portrait' && fs.existsSync(portraitSub) ? portraitSub : defaultSub;

  const partAConfig = {
    enabled: body.partAEnabled !== false && draft.video?.partA?.enabled !== false,
    durationSeconds: Number(body.partADurationSeconds || draft.video?.partA?.durationSeconds || 5.0),
    imagePath: draft.video?.partA?.filePath || draft.video?.partA?.thumbnailPath,
    audioPolicy: draft.video?.partA?.audioPolicy || 'suno_starts_at_part_b',
  };

  const songVisualCandidate = draft.video?.partB?.filePath;
  if (!songVisualCandidate || !fs.existsSync(songVisualCandidate)) {
    throw new MasterVideoError('SOURCE VIDEO UNAVAILABLE: RECONNECT OR REPLACE PART B BACKGROUND. Silent fallbacks are disabled.', 422, 'MISSING_PART_B_SOURCE');
  }
  if (!(await hasChangingVideoFrames(songVisualCandidate, 0.5))) {
    throw new MasterVideoError('Part B source is frozen or cannot be decoded as dynamic video. Attach the real Canva 4-second background loop.', 422, 'STATIC_PART_B_SOURCE');
  }
  if (!partAConfig.imagePath || !fs.existsSync(partAConfig.imagePath)) {
    throw new MasterVideoError('The selected thumbnail file is missing. Save or upload the real Part A artwork first.', 422, 'MISSING_PART_A_THUMBNAIL');
  }
  const partBConfig = {
    videoPath: songVisualCandidate,
    audioPath: draft.masterAudio.filePath,
    durationSeconds: draft.masterAudio.durationSeconds || 285.16,
    subtitlesPath: format === 'lyric_master' ? subPath : undefined,
    playbackMode: (body.partBPlaybackMode || draft.video?.partB?.playbackMode || 'seamless_loop') as any,
    sourceDurationSeconds: draft.video?.partB?.sourceDurationSeconds || 4.0,
  };

  const promoCandidate = draft.video?.partC?.filePath;
  if (body.partCEnabled === false || draft.video?.partC?.enabled === false || !promoCandidate || !fs.existsSync(promoCandidate)) {
    throw new MasterVideoError('Part C is required for the final A+B+C master. Attach the genuine Canva promotional video.', 422, 'MISSING_PART_C_SOURCE');
  }
  if (!(await hasChangingVideoFrames(promoCandidate))) {
    throw new MasterVideoError('Part C is frozen, not a genuine multi-scene Canva production. Replace the placeholder MP4.', 422, 'STATIC_PART_C_SOURCE');
  }
  const partCConfig = {
    enabled: true,
    videoPath: promoCandidate,
    durationSeconds: draft.video?.partC?.durationSeconds || 608.0,
    audioMode: (body.partCAudioMode || draft.video?.partC?.audioMode || 'preserve_canva_audio') as any,
  };

  const result = await render1080pMusicVideo({
    draftId, outputPath, format, orientation,
    partA: partAConfig, partB: partBConfig, partC: partCConfig,
  } as any);

  // Lightweight Part B stream preview (lossless copy).
  const partBPreview = path.join(videoDir, 'part_b_' + result.sha256 + '.mp4');
  try {
    await promisify(execFile)(getFfmpegPath(), [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-ss', String(result.partASeconds || 0), '-i', result.outputPath,
      '-t', String(result.partBSeconds || 285.16), '-c', 'copy', '-movflags', '+faststart', partBPreview,
    ], { timeout: 60_000 });
  } catch {}

  // Verify the file we just made before recording it as READY.
  const probe = await probeMediaFile(result.outputPath);
  const expected = Math.round(((result.partASeconds || 0) + (result.partBSeconds || 0) + (result.partCSeconds || 0)) * 100) / 100;
  const problems: string[] = [];
  if (!probe.isValid || !probe.hasVideo) problems.push('output has no decodable video');
  if (!probe.hasAudio) problems.push('output has no audio');
  if (probe.width && probe.width !== result.width) problems.push(`width ${probe.width} != ${result.width}`);
  if (probe.height && probe.height !== result.height) problems.push(`height ${probe.height} != ${result.height}`);
  if (probe.durationSeconds && Math.abs(probe.durationSeconds - expected) > 1.5) {
    problems.push(`duration ${probe.durationSeconds}s differs from expected ${expected}s`);
  }
  if (problems.length) throw new MasterVideoError(`Rendered ${key} failed verification: ${problems.join('; ')}`, 500, 'RENDER_VERIFICATION_FAILED');

  const fresh = pipelineDraftStorage.getDraft(draftId)!;
  if (!fresh.video) fresh.video = { status: 'RENDERED', renderedAt: new Date().toISOString(), formats: {} } as any;
  fresh.video!.status = 'RENDERED';
  fresh.video!.renderedAt = new Date().toISOString();
  fresh.video!.activeFormat = format;
  fresh.video!.activeOrientation = orientation;
  fresh.video!.formats = fresh.video!.formats || {};

  const formatInfo = {
    format: key,
    outputPath: result.outputPath,
    sha256: result.sha256,
    durationSeconds: result.durationSeconds,
    hasBurnedSubtitles: format === 'lyric_master',
    partASeconds: result.partASeconds,
    partBSeconds: result.partBSeconds,
    partCSeconds: result.partCSeconds,
    width: result.width,
    height: result.height,
    verified: true,
  };
  fresh.video!.formats[key] = formatInfo as any;
  if (orientation === 'landscape') {
    fresh.video!.formats[format] = formatInfo as any;
    const flat = path.join(videoDir, `${format}.mp4`);
    if (outputPath !== flat) { try { fs.copyFileSync(outputPath, flat); } catch {} }
  } else {
    fresh.video!.formats[`${format}_portrait`] = formatInfo as any;
    const flat = path.join(videoDir, `${format}_portrait.mp4`);
    if (outputPath !== flat) { try { fs.copyFileSync(outputPath, flat); } catch {} }
  }
  fresh.downstreamStatus.videoValid = true;
  pipelineDraftStorage.saveDraft(fresh);
  return { result, draft: fresh };
}
