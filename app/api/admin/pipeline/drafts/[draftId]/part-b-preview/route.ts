import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage, isValidDraftId } from '@/server/storage/pipeline-draft-storage';
import { applyDefaultVideoParts } from '@/server/services/default-video-parts';
import { render1080pMusicVideo } from '@/server/services/video-renderer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Fingerprint of everything that changes what Part B looks/sounds like. */
function previewKey(draft: any, orientation: string, burn: boolean, assPath?: string): string {
  const b = draft.video?.partB || {};
  const assStat = assPath && fs.existsSync(assPath) ? fs.statSync(assPath) : null;
  return crypto.createHash('sha256').update(JSON.stringify([
    draft.masterAudio?.sha256, draft.masterAudio?.durationSeconds,
    b.filePath, b.playbackMode, b.loopStartSeconds, b.loopEndSeconds, b.sourceDurationSeconds,
    orientation, burn, assStat ? [assStat.size, Math.floor(assStat.mtimeMs)] : null,
  ])).digest('hex').slice(0, 16);
}

/**
 * POST: render Part B ONLY (background loop + full Suno master + burned lyrics when available).
 * No thumbnail and no promo are needed, so this works for any fresh song once the master exists.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { draftId } = await params;
    if (!isValidDraftId(draftId)) return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    const draft = pipelineDraftStorage.getDraft(draftId);
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    if (applyDefaultVideoParts(draft)) pipelineDraftStorage.saveDraft(draft);

    if (!draft.masterAudio?.filePath || !fs.existsSync(draft.masterAudio.filePath)) {
      return NextResponse.json({ error: 'Render the genuine master WAV first; Part B plays the full Suno song.' }, { status: 422 });
    }
    const bgPath = draft.video?.partB?.filePath;
    if (!bgPath || !fs.existsSync(bgPath)) {
      return NextResponse.json({
        error: 'SOURCE VIDEO UNAVAILABLE: RECONNECT OR REPLACE PART B BACKGROUND',
        code: 'MISSING_PART_B_SOURCE',
      }, { status: 422 });
    }

    const body = await request.json().catch(() => ({}));
    const orientation = (body.orientation === 'portrait' ? 'portrait' : 'landscape') as 'landscape' | 'portrait';
    const subDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'subtitles');
    const portraitSub = path.join(subDir, 'master_dual_urdu_english_portrait.ass');
    const defaultSub = path.join(subDir, 'master_dual_urdu_english.ass');
    const assPath = orientation === 'portrait' && fs.existsSync(portraitSub) ? portraitSub : defaultSub;
    const canBurn = draft.downstreamStatus.subtitlesValid && fs.existsSync(assPath);
    const format = (canBurn ? 'lyric_master' : 'clean_cinematic') as 'lyric_master' | 'clean_cinematic';

    const key = previewKey(draft, orientation, canBurn, canBurn ? assPath : undefined);
    const videoDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video');
    fs.mkdirSync(videoDir, { recursive: true });
    const outputPath = path.join(videoDir, `part_b_preview_${orientation}.mp4`);

    const existing: any = (draft.video as any).partB?.preview;
    if (!body.force && existing?.key === key && existing?.path && fs.existsSync(existing.path)) {
      return NextResponse.json({ success: true, cached: true, preview: existing });
    }

    const b: any = draft.video!.partB;
    const result = await render1080pMusicVideo({
      draftId,
      outputPath,
      format,
      orientation,
      partA: { enabled: false } as any,
      partB: {
        videoPath: bgPath,
        audioPath: draft.masterAudio.filePath,
        durationSeconds: draft.masterAudio.durationSeconds,
        subtitlesPath: canBurn ? assPath : undefined,
        playbackMode: (b.playbackMode || 'seamless_loop') as any,
        sourceDurationSeconds: b.sourceDurationSeconds || 4.0,
      } as any,
      partC: { enabled: false } as any,
    } as any);

    const preview = {
      key,
      path: outputPath,
      sha256: result.sha256,
      durationSeconds: result.durationSeconds,
      orientation,
      hasBurnedLyrics: canBurn,
      renderedAt: new Date().toISOString(),
    };
    (draft.video as any).partB = { ...(draft.video as any).partB, preview };
    pipelineDraftStorage.saveDraft(draft);
    return NextResponse.json({ success: true, cached: false, preview });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
