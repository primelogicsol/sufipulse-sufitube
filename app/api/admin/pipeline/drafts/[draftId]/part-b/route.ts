import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage, isValidDraftId } from '@/server/storage/pipeline-draft-storage';
import { probeMediaFile } from '@/server/services/media-prober';

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
        canvaUrl: body.canvaUrl || draft.video.partB?.canvaUrl || 'https://canva.link/qvmwwc830dm623g',
        title: body.title || draft.video.partB?.title || 'Part 2',
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

    // MP4 File Upload: supports both direct binary streaming and multipart/form-data
    if (
      contentType.includes('application/octet-stream') ||
      contentType.includes('video/') ||
      contentType.includes('multipart/form-data')
    ) {
      let fileBuffer: Buffer | null = null;
      let fileName = 'canva_part_b.mp4';
      let canvaDesignId = 'DAHa7eJOcbI';
      let playbackMode: any = 'full_19_scenes';
      let audioMode: any = 'preserve_canva_audio';

      // 1. Try reading headers first (for direct octet-stream upload)
      const fileNameHeader = request.headers.get('x-file-name');
      if (fileNameHeader) fileName = decodeURIComponent(fileNameHeader);
      if (request.headers.get('x-canva-design-id')) canvaDesignId = request.headers.get('x-canva-design-id')!;
      if (request.headers.get('x-playback-mode')) playbackMode = request.headers.get('x-playback-mode') as any;
      if (request.headers.get('x-audio-mode')) audioMode = request.headers.get('x-audio-mode') as any;

      // 2. If multipart/form-data, try parsing form-data with error resilience
      if (contentType.includes('multipart/form-data')) {
        try {
          const formData = await request.formData();
          const file = formData.get('file') as File | null;
          if (file) {
            fileName = file.name;
            fileBuffer = Buffer.from(await file.arrayBuffer());
          }
          if (formData.get('canvaDesignId')) canvaDesignId = String(formData.get('canvaDesignId'));
          if (formData.get('playbackMode')) playbackMode = formData.get('playbackMode') as any;
          if (formData.get('audioMode')) audioMode = formData.get('audioMode') as any;
        } catch (formErr) {
          console.warn('[part-b] request.formData() failed, attempting raw arrayBuffer fallback:', formErr);
        }
      }

      // 3. If fileBuffer not yet extracted, read raw body stream
      if (!fileBuffer) {
        try {
          const arrayBuffer = await request.arrayBuffer();
          if (arrayBuffer && arrayBuffer.byteLength > 0) {
            fileBuffer = Buffer.from(arrayBuffer);
          }
        } catch (bodyErr) {
          console.error('[part-b] Error reading body buffer:', bodyErr);
        }
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        return NextResponse.json({ error: 'No video file data received' }, { status: 400 });
      }

      const videoDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video');
      fs.mkdirSync(videoDir, { recursive: true });

      const ext = path.extname(fileName) || '.mp4';
      const targetFileName = `canva_part_b_${Date.now()}${ext}`;
      const targetPath = path.join(videoDir, targetFileName);

      fs.writeFileSync(targetPath, fileBuffer);

      // Authoritative Media Probe for duration, dimensions, stream health
      const probe = await probeMediaFile(targetPath);
      console.log(`[part-b] Probed media for ${targetPath}:`, probe);

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
        canvaUrl: 'https://canva.link/qvmwwc830dm623g',
        title: 'Part 2',
        sceneCount: 19,
        filePath: targetPath,
        fileName,
        durationSeconds: probe.durationSeconds > 0 ? probe.durationSeconds : undefined,
        width: probe.width,
        height: probe.height,
        hasAudio: probe.hasAudio,
        validationStatus: probe.isValid ? 'VALID' : 'FAILED',
        validationError: probe.error,
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
