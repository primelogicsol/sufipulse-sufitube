import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage, isValidDraftId } from '@/server/storage/pipeline-draft-storage';
import { probeMediaFile, getFfmpegPath } from '@/server/services/video-renderer';

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

    // Direct image or video upload: supports both direct binary stream and multipart/form-data
    if (
      contentType.includes('application/octet-stream') ||
      contentType.includes('image/') ||
      contentType.includes('video/') ||
      contentType.includes('multipart/form-data')
    ) {
      let fileBuffer: Buffer | null = null;
      let fileName = 'part_a_background.png';
      let canvaDesignId = 'DAHa7St5CYs';
      let canvaUrl = 'https://canva.link/ezqj8ymddv6yl2d';
      let title = 'Part A Background Theme';

      const fileNameHeader = request.headers.get('x-file-name');
      if (fileNameHeader) fileName = decodeURIComponent(fileNameHeader);
      if (request.headers.get('x-canva-design-id')) canvaDesignId = request.headers.get('x-canva-design-id')!;
      if (request.headers.get('x-canva-url')) canvaUrl = decodeURIComponent(request.headers.get('x-canva-url')!);
      if (request.headers.get('x-title')) title = decodeURIComponent(request.headers.get('x-title')!);

      if (contentType.includes('multipart/form-data')) {
        try {
          const formData = await request.formData();
          const file = formData.get('file') as File | null;
          if (file) {
            fileName = file.name;
            fileBuffer = Buffer.from(await file.arrayBuffer());
          }
          if (formData.get('canvaDesignId')) canvaDesignId = String(formData.get('canvaDesignId'));
          if (formData.get('canvaUrl')) canvaUrl = String(formData.get('canvaUrl'));
          if (formData.get('title')) title = String(formData.get('title'));
        } catch (formErr) {
          console.warn('[part-a] request.formData() failed, attempting raw arrayBuffer fallback:', formErr);
        }
      }

      if (!fileBuffer) {
        try {
          const arrayBuffer = await request.arrayBuffer();
          if (arrayBuffer && arrayBuffer.byteLength > 0) {
            fileBuffer = Buffer.from(arrayBuffer);
          }
        } catch (bodyErr) {
          console.error('[part-a] Error reading body buffer:', bodyErr);
        }
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        return NextResponse.json({ error: 'No media file data provided' }, { status: 400 });
      }

      const videoDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video');
      fs.mkdirSync(videoDir, { recursive: true });

      const ext = path.extname(fileName) || '.png';
      const targetFileName = `part_a_theme_${Date.now()}${ext}`;
      const targetPath = path.join(videoDir, targetFileName);

      fs.writeFileSync(targetPath, fileBuffer);

      let mediaType: 'image' | 'video' = 'image';
      let durationSeconds: number | undefined = undefined;
      let width: number | undefined = undefined;
      let height: number | undefined = undefined;
      let thumbnailPath: string | undefined = undefined;

      const isVideoFile = ext.toLowerCase() === '.mp4' || ext.toLowerCase() === '.mov' || ext.toLowerCase() === '.webm' || contentType.includes('video/');

      if (isVideoFile) {
        mediaType = 'video';
        try {
          const probe = await probeMediaFile(targetPath);
          if (probe.isValid) {
            durationSeconds = probe.durationSeconds;
            width = probe.width;
            height = probe.height;
          }
        } catch (probeErr) {
          console.warn('[part-a] Video probe warning:', probeErr);
        }

        // Extract initial frame (t=0) as default thumbnail
        const thumbFileName = `thumbnail_${Date.now()}.jpg`;
        const thumbFilePath = path.join(videoDir, thumbFileName);
        try {
          const ffBin = getFfmpegPath();
          const proc = spawn(ffBin, [
            '-ss', '0',
            '-i', targetPath,
            '-vframes', '1',
            '-q:v', '2',
            '-y',
            thumbFilePath,
          ]);
          await new Promise<void>((resolve) => {
            proc.on('close', () => resolve());
            proc.on('error', () => resolve());
          });
          if (fs.existsSync(thumbFilePath) && fs.statSync(thumbFilePath).size > 0) {
            thumbnailPath = thumbFilePath;
          }
        } catch (thumbErr) {
          console.warn('[part-a] Thumbnail extraction warning:', thumbErr);
        }
      }

      if (!draft.video) {
        draft.video = {
          status: 'PENDING',
          renderedAt: new Date().toISOString(),
          formats: {},
        };
      }

      draft.video.partA = {
        canvaDesignId,
        canvaUrl,
        title,
        mediaType,
        filePath: targetPath,
        fileName,
        thumbnailPath,
        durationSeconds,
        width,
        height,
        validationStatus: 'VALID',
        uploadedAt: new Date().toISOString(),
      };

      pipelineDraftStorage.saveDraft(draft);
      return NextResponse.json({ success: true, partA: draft.video.partA, draft });
    }

    // JSON metadata update
    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (!draft.video) {
        draft.video = {
          status: 'PENDING',
          renderedAt: new Date().toISOString(),
          formats: {},
        };
      }

      draft.video.partA = {
        canvaDesignId: body.canvaDesignId || draft.video.partA?.canvaDesignId || 'DAHa7St5CYs',
        canvaUrl: body.canvaUrl || draft.video.partA?.canvaUrl || 'https://canva.link/ezqj8ymddv6yl2d',
        title: body.title || draft.video.partA?.title || 'Part A Background Theme',
        filePath: draft.video.partA?.filePath,
        fileName: draft.video.partA?.fileName,
      };

      pipelineDraftStorage.saveDraft(draft);
      return NextResponse.json({ success: true, partA: draft.video.partA, draft });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
