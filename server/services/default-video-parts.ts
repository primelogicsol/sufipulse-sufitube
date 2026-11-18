import fs from 'node:fs';
import path from 'node:path';
import type { PipelineDraft } from '@/server/types/pipeline-draft';

const SHARED_DIR = path.join(process.cwd(), '.data', 'shared-assets');
export const SHARED_PART_A_COVER = path.join(SHARED_DIR, 'default_part_a_cover.jpg');
export const SHARED_PART_B_BACKGROUND = path.join(SHARED_DIR, 'canva_part_a_DAHa7St5CYs.mp4');
export const SHARED_PART_C_PROMO = path.join(SHARED_DIR, 'promotional', 'canva_part_b_DAHa7eJOcbI.mp4');
const SHARED_PART_C_MANIFEST = path.join(SHARED_DIR, 'promotional', 'manifest_DAHa7eJOcbI.json');

/**
 * Fresh drafts (e.g. a newly fetched Suno song) get the reusable Canva branding assets automatically:
 *  - Part A: Default SufiPulse opening cover/thumbnail (fallback if none uploaded yet)
 *  - Part B: Canva DAHa7St5CYs background loop
 *  - Part C: Canva DAHa7eJOcbI promotional video (only when the shared file is a verified, real video)
 * Existing choices are never overwritten. Returns true when the draft was modified.
 */
export function applyDefaultVideoParts(draft: PipelineDraft): boolean {
  let changed = false;
  if (!draft.video) {
    draft.video = { status: 'PENDING', renderedAt: new Date().toISOString(), formats: {} } as any;
    changed = true;
  }
  const video: any = draft.video;

  // Part A default cover (ensure an image path is always available so automated renders never fail)
  const fallbackCover = fs.existsSync(SHARED_PART_A_COVER)
    ? SHARED_PART_A_COVER
    : path.join(process.cwd(), 'public', 'banner28.jpg');

  const partAMissing = !video.partA?.filePath || !fs.existsSync(video.partA.filePath);
  if (partAMissing && fs.existsSync(fallbackCover)) {
    video.partA = {
      enabled: true,
      durationSeconds: video.partA?.durationSeconds || 5,
      sourceType: 'uploaded_image',
      audioPolicy: video.partA?.audioPolicy || 'suno_starts_at_part_b',
      thumbnailMode: 'default_cover',
      mediaType: 'image',
      fileName: path.basename(fallbackCover),
      validationStatus: 'VALID',
      uploadedAt: new Date().toISOString(),
      ...(video.partA || {}),
      filePath: (video.partA?.filePath && fs.existsSync(video.partA.filePath)) ? video.partA.filePath : fallbackCover,
    };
    changed = true;
  }

  // Part B background
  const partBMissing = !video.partB?.filePath || !fs.existsSync(video.partB.filePath);
  if (partBMissing && fs.existsSync(SHARED_PART_B_BACKGROUND)) {
    video.partB = {
      enabled: true,
      canvaDesignId: 'DAHa7St5CYs',
      canvaUrl: 'https://canva.link/ezqj8ymddv6yl2d',
      title: 'Part B Background Theme',
      sourceDurationSeconds: 4,
      playbackMode: 'seamless_loop',
      hasBurnedSubtitles: true,
      loopStartSeconds: 0,
      loopEndSeconds: 4,
      ...(video.partB || {}),
      filePath: SHARED_PART_B_BACKGROUND,
      fileName: 'canva_part_a_DAHa7St5CYs.mp4',
    };
    changed = true;
  }

  // Part C promo
  const partCMissing = !video.partC?.filePath || !fs.existsSync(video.partC.filePath);
  if (partCMissing && fs.existsSync(SHARED_PART_C_PROMO)) {
    let manifestData: any = {};
    if (fs.existsSync(SHARED_PART_C_MANIFEST)) {
      try {
        const raw = fs.readFileSync(SHARED_PART_C_MANIFEST, 'utf8').replace(/^\uFEFF/, '');
        manifestData = JSON.parse(raw);
      } catch {}
    }
    video.partC = {
      enabled: true,
      canvaDesignId: manifestData.canvaDesignId || 'DAHa7eJOcbI',
      canvaUrl: manifestData.canvaUrl || 'https://canva.link/qvmwwc830dm623g',
      title: manifestData.title || 'Part 2',
      sceneCount: manifestData.sceneCount || 19,
      formattedDuration: manifestData.formattedDuration || '10:08',
      audioMode: 'preserve_canva_audio',
      playbackMode: 'full_19_scenes',
      durationSeconds: manifestData.durationSeconds || 608.02,
      width: manifestData.width || 1920,
      height: manifestData.height || 1080,
      hasAudio: manifestData.hasAudio !== false,
      validationStatus: 'VALID',
      uploadedAt: manifestData.verifiedAt || new Date().toISOString(),
      fileName: 'Part 2.mp4',
      ...(video.partC || {}),
      filePath: SHARED_PART_C_PROMO,
    };
    changed = true;
  }
  return changed;
}
