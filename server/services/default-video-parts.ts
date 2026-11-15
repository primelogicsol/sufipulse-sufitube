import fs from 'node:fs';
import path from 'node:path';
import type { PipelineDraft } from '@/server/types/pipeline-draft';

const SHARED_DIR = path.join(process.cwd(), '.data', 'shared-assets');
export const SHARED_PART_B_BACKGROUND = path.join(SHARED_DIR, 'canva_part_a_DAHa7St5CYs.mp4');
export const SHARED_PART_C_PROMO = path.join(SHARED_DIR, 'promotional', 'canva_part_b_DAHa7eJOcbI.mp4');
const SHARED_PART_C_MANIFEST = path.join(SHARED_DIR, 'promotional', 'manifest_DAHa7eJOcbI.json');

/**
 * Fresh drafts (e.g. a newly fetched Suno song) get the reusable Canva branding assets automatically:
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
  if (partCMissing && fs.existsSync(SHARED_PART_C_PROMO) && fs.existsSync(SHARED_PART_C_MANIFEST)) {
    try {
      const m = JSON.parse(fs.readFileSync(SHARED_PART_C_MANIFEST, 'utf8'));
      if (m.verified === true && m.genuine === true) {
        video.partC = {
          enabled: true,
          canvaDesignId: 'DAHa7eJOcbI',
          canvaUrl: 'https://canva.link/qvmwwc830dm623g',
          title: 'Part 2',
          sceneCount: 19,
          formattedDuration: m.formattedDuration || '10:08',
          audioMode: 'preserve_canva_audio',
          playbackMode: 'full_19_scenes',
          ...(video.partC || {}),
          filePath: SHARED_PART_C_PROMO,
          fileName: 'Part 2.mp4',
          durationSeconds: m.durationSeconds,
          width: m.width,
          height: m.height,
          hasAudio: m.hasAudio,
          validationStatus: 'VALID',
          uploadedAt: m.verifiedAt || new Date().toISOString(),
        };
        changed = true;
      }
    } catch {}
  }
  return changed;
}
