import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';
import { render1080pMusicVideo } from '@/server/services/video-renderer';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { draftId } = await params;
    const draft = pipelineDraftStorage.getDraft(draftId);
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    if (!draft.masterAudio) {
      return NextResponse.json({ error: 'Master audio must be rendered before generating video' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const format = (body.format === 'clean_cinematic' ? 'clean_cinematic' : 'lyric_master') as 'lyric_master' | 'clean_cinematic';

    const videoDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video');
    fs.mkdirSync(videoDir, { recursive: true });

    const outputPath = path.join(videoDir, `video_${format}_rev${draft.currentRevision}.mp4`);
    const artworkPath = body.artworkPath || path.join(process.cwd(), 'public', 'banner1.png');
    const subPath = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'subtitles', 'master_dual_urdu_english.ass');

    const result = await render1080pMusicVideo({
      draftId,
      audioPath: draft.masterAudio.filePath,
      artworkPath,
      subtitlesPath: format === 'lyric_master' ? subPath : undefined,
      outputPath,
      format,
      durationSeconds: draft.masterAudio.durationSeconds,
    });

    if (!draft.video) {
      draft.video = {
        status: 'RENDERED',
        renderedAt: new Date().toISOString(),
        formats: {},
      };
    }
    draft.video.status = 'RENDERED';
    draft.video.renderedAt = new Date().toISOString();
    draft.video.formats[format] = {
      format,
      outputPath: result.outputPath,
      sha256: result.sha256,
      durationSeconds: result.durationSeconds,
      hasBurnedSubtitles: format === 'lyric_master',
    };

    // Ensure canonical flat filename exists for direct access
    const canonicalFlat = path.join(videoDir, `${format}.mp4`);
    if (outputPath !== canonicalFlat) {
      try {
        fs.copyFileSync(outputPath, canonicalFlat);
      } catch {}
    }

    draft.downstreamStatus.videoValid = true;
    pipelineDraftStorage.saveDraft(draft);

    return NextResponse.json({
      success: true,
      video: result,
      draft,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
