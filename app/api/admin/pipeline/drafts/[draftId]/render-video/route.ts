import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getFfmpegPath } from '@/server/services/video-renderer';
import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';
import { hasChangingVideoFrames } from '@/server/services/video-motion-validator';
import { renderMasterVideoForDraft, MasterVideoError } from '@/server/services/master-video-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { draftId } = await params;
    const draft = pipelineDraftStorage.getDraft(draftId);
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    const videoDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video');
    const combinations = [
      'lyric_master_landscape',
      'clean_cinematic_landscape',
      'lyric_master_portrait',
      'clean_cinematic_portrait',
    ];

    const formatsStatus: Record<string, any> = {};
    for (const combo of combinations) {
      const entry = draft.video?.formats?.[combo];
      const revPath = path.join(videoDir, `video_${combo}_rev${draft.currentRevision}.mp4`);
      const unversionedPath = path.join(videoDir, `video_${combo}.mp4`);
      const flatPath = path.join(videoDir, `${combo}.mp4`);

      let resolvedPath: string | null = null;
      if (entry?.outputPath && fs.existsSync(entry.outputPath)) resolvedPath = entry.outputPath;
      else if (fs.existsSync(revPath)) resolvedPath = revPath;
      else if (fs.existsSync(unversionedPath)) resolvedPath = unversionedPath;
      else if (fs.existsSync(flatPath)) resolvedPath = flatPath;

      formatsStatus[combo] = {
        rendered: Boolean(resolvedPath),
        outputPath: resolvedPath,
        durationSeconds: entry?.durationSeconds,
        width: entry?.width || (combo.includes('portrait') ? 1080 : 1920),
        height: entry?.height || (combo.includes('portrait') ? 1920 : 1080),
        hasBurnedSubtitles: combo.startsWith('lyric_master'),
        orientation: combo.includes('portrait') ? 'portrait' : 'landscape',
        format: combo.startsWith('lyric_master') ? 'lyric_master' : 'clean_cinematic',
      };
    }

    return NextResponse.json({
      success: true,
      activeFormat: draft.video?.activeFormat || 'lyric_master',
      activeOrientation: draft.video?.activeOrientation || 'landscape',
      formats: formatsStatus,
      status: draft.video?.status || 'PENDING',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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

    const body = await request.json().catch(() => ({}));

    // Action: Save Preferences without rendering
    if (body.action === 'save_preferences') {
      if (!draft.video) {
        draft.video = {
          status: 'PENDING',
          renderedAt: new Date().toISOString(),
          formats: {},
        };
      }
      if (body.format && ['lyric_master', 'clean_cinematic'].includes(body.format)) {
        draft.video.activeFormat = body.format;
      }
      if (body.orientation && ['landscape', 'portrait'].includes(body.orientation)) {
        draft.video.activeOrientation = body.orientation;
      }
      pipelineDraftStorage.saveDraft(draft);
      return NextResponse.json({
        success: true,
        activeFormat: draft.video.activeFormat,
        activeOrientation: draft.video.activeOrientation,
      });
    }

    try {
      const { result, draft: updated } = await renderMasterVideoForDraft(draftId, body);
      return NextResponse.json({ success: true, video: result, draft: updated });
    } catch (e: any) {
      if (e instanceof MasterVideoError) {
        return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
      }
      throw e;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
