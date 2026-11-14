import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage, isValidDraftId } from '@/server/storage/pipeline-draft-storage';
import { probeAudioFile } from '@/server/services/audio-splicer';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { draftId } = await params;
    if (!isValidDraftId(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    }

    const draft = pipelineDraftStorage.getDraft(draftId);
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';

    // If JSON settings update
    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (!draft.video) {
        draft.video = {
          status: 'PENDING',
          renderedAt: new Date().toISOString(),
          formats: {},
        };
      }
      draft.video.partB = {
        enabled: body.enabled !== false,
        canvaDesignId: body.canvaDesignId || draft.video.partB?.canvaDesignId || 'DAHa7eJOcbI',
        canvaUrl: body.canvaUrl || draft.video.partB?.canvaUrl || 'https://www.canva.com/d/PmQwnpEWAbuVg4q',
        title: body.title || draft.video.partB?.title || 'Copy of Copy of Copy of PANI GAWAH HAI | KASHMIR WATER BEARS WITNESS',
        sceneCount: typeof body.sceneCount === 'number' ? body.sceneCount : (draft.video.partB?.sceneCount || 19),
        filePath: draft.video.partB?.filePath,
        fileName: draft.video.partB?.fileName,
        durationSeconds: typeof body.durationSeconds === 'number' ? body.durationSeconds : draft.video.partB?.durationSeconds,
        audioMode: body.audioMode || draft.video.partB?.audioMode || 'preserve_canva_audio',
        playbackMode: body.playbackMode || draft.video.partB?.playbackMode || 'full_19_scenes',
        trimStartSeconds: body.trimStartSeconds,
        trimEndSeconds: body.trimEndSeconds,
      };

      pipelineDraftStorage.saveDraft(draft);
      return NextResponse.json({ success: true, partB: draft.video.partB, draft });
    }

    // Direct MP4 file upload (FormData)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const canvaDesignId = String(formData.get('canvaDesignId') || 'DAHa7eJOcbI');
      const playbackMode = (formData.get('playbackMode') as any) || 'full_19_scenes';
      const audioMode = (formData.get('audioMode') as any) || 'preserve_canva_audio';

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const videoDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video');
      fs.mkdirSync(videoDir, { recursive: true });

      const ext = path.extname(file.name) || '.mp4';
      const targetFileName = `canva_part_b_${Date.now()}${ext}`;
      const targetPath = path.join(videoDir, targetFileName);

      const arrayBuffer = await file.arrayBuffer();
      fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));

      // Probe audio/video duration
      let probedDuration = 0;
      try {
        const probed = await probeAudioFile(targetPath);
        if (probed && probed.durationSeconds > 0) {
          probedDuration = probed.durationSeconds;
        }
      } catch (probeErr) {
        console.warn('[part-b] Could not probe MP4 duration:', probeErr);
      }

      if (!draft.video) {
        draft.video = {
          status: 'PENDING',
          renderedAt: new Date().toISOString(),
          formats: {},
        };
      }

      draft.video.partB = {
        enabled: true,
        canvaDesignId,
        canvaUrl: 'https://www.canva.com/d/PmQwnpEWAbuVg4q',
        title: 'Copy of Copy of Copy of PANI GAWAH HAI | KASHMIR WATER BEARS WITNESS',
        sceneCount: 19,
        filePath: targetPath,
        fileName: file.name,
        durationSeconds: probedDuration > 0 ? Number(probedDuration.toFixed(2)) : undefined,
        audioMode,
        playbackMode,
        uploadedAt: new Date().toISOString(),
      };

      pipelineDraftStorage.saveDraft(draft);
      return NextResponse.json({ success: true, partB: draft.video.partB, draft });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
