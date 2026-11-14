import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
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

    const videoDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video');
    fs.mkdirSync(videoDir, { recursive: true });

    if (!draft.video) {
      draft.video = {
        status: 'PENDING',
        renderedAt: new Date().toISOString(),
        formats: {},
      };
    }

    const contentType = request.headers.get('content-type') || '';
    const { searchParams } = new URL(request.url);
    const isThumbnailUpload =
      request.headers.get('x-thumbnail-upload') === 'true' ||
      searchParams.get('asset') === 'thumbnail';

    // ─── 1. DEDICATED THUMBNAIL UPLOAD (Custom Thumbnail) ─────────────────────
    if (isThumbnailUpload) {
      const thumbFileName = `thumbnail_${Date.now()}.jpg`;
      const thumbFilePath = path.join(videoDir, thumbFileName);
      const canonicalThumb = path.join(videoDir, 'thumbnail.jpg');

      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) return NextResponse.json({ error: 'No thumbnail file provided' }, { status: 400 });
        const writeStream = fs.createWriteStream(thumbFilePath);
        await pipeline(Readable.fromWeb(file.stream() as any), writeStream);
      } else if (request.body) {
        const writeStream = fs.createWriteStream(thumbFilePath);
        await pipeline(Readable.fromWeb(request.body as any), writeStream);
      }

      if (fs.existsSync(thumbFilePath)) {
        try { fs.copyFileSync(thumbFilePath, canonicalThumb); } catch {}
      }

      if (!draft.video.partA) {
        draft.video.partA = {
          canvaDesignId: 'DAHa7St5CYs',
          canvaUrl: 'https://canva.link/ezqj8ymddv6yl2d',
          title: 'Part A Background Theme',
        };
      }
      draft.video.partA.thumbnailPath = thumbFilePath;
      draft.video.partA.thumbnailMode = 'custom_upload';

      pipelineDraftStorage.saveDraft(draft);
      return NextResponse.json({ success: true, partA: draft.video.partA, draft });
    }

    // ─── 2. JSON SETTINGS & ACTIONS (Playback mode, Frame extraction) ───────────
    if (contentType.includes('application/json')) {
      const body = await request.json();

      if (!draft.video.partA) {
        draft.video.partA = {
          canvaDesignId: 'DAHa7St5CYs',
          canvaUrl: 'https://canva.link/ezqj8ymddv6yl2d',
          title: 'Part A Background Theme',
        };
      }

      // Action: Extract specific frame from existing video as thumbnail
      if (body.action === 'extract_thumbnail_frame' && draft.video.partA.filePath) {
        const timestamp = typeof body.timestampSeconds === 'number' ? Math.max(0, body.timestampSeconds) : 0;
        const thumbFileName = `thumbnail_frame_${Date.now()}.jpg`;
        const thumbFilePath = path.join(videoDir, thumbFileName);
        const canonicalThumb = path.join(videoDir, 'thumbnail.jpg');

        const ffBin = getFfmpegPath();
        const proc = spawn(ffBin, [
          '-ss', String(timestamp),
          '-i', draft.video.partA.filePath,
          '-vframes', '1',
          '-q:v', '2',
          '-y',
          thumbFilePath,
        ]);

        await new Promise<void>((resolve, reject) => {
          proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`FFmpeg exited with code ${code}`));
          });
          proc.on('error', reject);
        });

        if (fs.existsSync(thumbFilePath)) {
          try { fs.copyFileSync(thumbFilePath, canonicalThumb); } catch {}
          draft.video.partA.thumbnailPath = thumbFilePath;
          draft.video.partA.thumbnailMode = timestamp === 0 ? 'first_frame' : 'custom_frame';
          draft.video.partA.thumbnailTimestampSeconds = timestamp;
        }

        pipelineDraftStorage.saveDraft(draft);
        return NextResponse.json({ success: true, partA: draft.video.partA, draft });
      }

      // Update Playback Mode and Loop Settings
      if (body.playbackMode) draft.video.partA.playbackMode = body.playbackMode;
      if (typeof body.loopStartSeconds === 'number') draft.video.partA.loopStartSeconds = body.loopStartSeconds;
      if (typeof body.loopEndSeconds === 'number') draft.video.partA.loopEndSeconds = body.loopEndSeconds;
      if (body.canvaDesignId) draft.video.partA.canvaDesignId = body.canvaDesignId;
      if (body.canvaUrl) draft.video.partA.canvaUrl = body.canvaUrl;
      if (body.title) draft.video.partA.title = body.title;

      // Always maintain dynamic duration matching with Master Audio
      draft.video.partA.playbackDurationSeconds = draft.masterAudio?.durationSeconds || draft.video.partA.playbackDurationSeconds || 285.2;

      pipelineDraftStorage.saveDraft(draft);
      return NextResponse.json({ success: true, partA: draft.video.partA, draft });
    }

    // ─── 3. BACKGROUND MEDIA UPLOAD (Direct Stream or Multipart) ───────────────
    if (
      contentType.includes('application/octet-stream') ||
      contentType.includes('image/') ||
      contentType.includes('video/') ||
      contentType.includes('multipart/form-data')
    ) {
      let fileName = 'part_a_theme.mp4';
      let canvaDesignId = 'DAHa7St5CYs';
      let canvaUrl = 'https://canva.link/ezqj8ymddv6yl2d';
      let title = 'Part A Background Theme';

      const fileNameHeader = request.headers.get('x-file-name');
      if (fileNameHeader) fileName = decodeURIComponent(fileNameHeader);
      if (request.headers.get('x-canva-design-id')) canvaDesignId = request.headers.get('x-canva-design-id')!;
      if (request.headers.get('x-canva-url')) canvaUrl = decodeURIComponent(request.headers.get('x-canva-url')!);
      if (request.headers.get('x-title')) title = decodeURIComponent(request.headers.get('x-title')!);

      const ext = path.extname(fileName) || '.mp4';
      const targetFileName = `part_a_theme_${Date.now()}${ext}`;
      const targetPath = path.join(videoDir, targetFileName);

      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) return NextResponse.json({ error: 'No media file provided' }, { status: 400 });
        fileName = file.name;
        const writeStream = fs.createWriteStream(targetPath);
        await pipeline(Readable.fromWeb(file.stream() as any), writeStream);
        if (formData.get('canvaDesignId')) canvaDesignId = String(formData.get('canvaDesignId'));
        if (formData.get('canvaUrl')) canvaUrl = String(formData.get('canvaUrl'));
        if (formData.get('title')) title = String(formData.get('title'));
      } else if (request.body) {
        const writeStream = fs.createWriteStream(targetPath);
        await pipeline(Readable.fromWeb(request.body as any), writeStream);
      }

      if (!fs.existsSync(targetPath) || fs.statSync(targetPath).size === 0) {
        return NextResponse.json({ error: 'Empty media file received' }, { status: 400 });
      }

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
        const canonicalThumb = path.join(videoDir, 'thumbnail.jpg');
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
            try { fs.copyFileSync(thumbFilePath, canonicalThumb); } catch {}
          }
        } catch (thumbErr) {
          console.warn('[part-a] Thumbnail extraction warning:', thumbErr);
        }
      }

      // Dynamic duration matching: Part A playback duration matches Master Audio duration
      const playbackDurationSeconds = draft.masterAudio?.durationSeconds || 285.2;

      draft.video.partA = {
        canvaDesignId,
        canvaUrl,
        title,
        mediaType,
        filePath: targetPath,
        fileName,
        thumbnailPath: thumbnailPath || draft.video.partA?.thumbnailPath,
        durationSeconds: durationSeconds || 4.0, // Source Canva duration
        playbackDurationSeconds, // Dynamic extended duration matching song
        playbackMode: draft.video.partA?.playbackMode || 'seamless_loop',
        thumbnailMode: draft.video.partA?.thumbnailMode || 'first_frame',
        width: width || 1920,
        height: height || 1080,
        validationStatus: 'VALID',
        uploadedAt: new Date().toISOString(),
      };

      pipelineDraftStorage.saveDraft(draft);
      return NextResponse.json({ success: true, partA: draft.video.partA, draft });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
