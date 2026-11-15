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

      // If updating Suno song visual playback mode
      if (['seamless_loop', 'freeze_last_frame', 'stretch', 'custom_range'].includes(body.playbackMode)) {
        if (!draft.video.partB) {
          draft.video.partB = {
            canvaDesignId: 'DAHa7St5CYs',
            canvaUrl: 'https://canva.link/ezqj8ymddv6yl2d',
            title: 'Part B Background Theme',
            playbackMode: body.playbackMode,
          };
        } else {
          draft.video.partB.playbackMode = body.playbackMode;
          if (typeof body.loopStartSeconds === 'number') draft.video.partB.loopStartSeconds = body.loopStartSeconds;
          if (typeof body.loopEndSeconds === 'number') draft.video.partB.loopEndSeconds = body.loopEndSeconds;
        }
      } else {
        // Promo settings passed to legacy part-b: update partC and legacyPartB
        if (!draft.video.partC) {
          draft.video.partC = {
            enabled: body.enabled !== false,
            canvaDesignId: 'DAHa7eJOcbI',
            canvaUrl: 'https://canva.link/qvmwwc830dm623g',
            title: 'Part 2',
            sceneCount: 19,
            durationSeconds: 608.0,
            formattedDuration: '10:08',
            width: 1920,
            height: 1080,
            hasAudio: true,
            validationStatus: 'VALID',
            audioMode: body.audioMode || 'preserve_canva_audio',
            playbackMode: body.playbackMode || 'full_19_scenes',
          };
        } else {
          if (body.audioMode) draft.video.partC.audioMode = body.audioMode;
          if (body.playbackMode) draft.video.partC.playbackMode = body.playbackMode;
          if (typeof body.trimStartSeconds === 'number') draft.video.partC.trimStartSeconds = body.trimStartSeconds;
          if (typeof body.trimEndSeconds === 'number') draft.video.partC.trimEndSeconds = body.trimEndSeconds;
        }
      }

      pipelineDraftStorage.saveDraft(draft);
      return NextResponse.json({ success: true, partB: draft.video.partB, partC: draft.video.partC, draft });
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
        canvaDesignId: canvaDesignId || 'DAHa7St5CYs',
        canvaUrl: request.headers.get('x-canva-url') ? decodeURIComponent(request.headers.get('x-canva-url')!) : 'https://canva.link/ezqj8ymddv6yl2d',
        title: request.headers.get('x-title') ? decodeURIComponent(request.headers.get('x-title')!) : 'Part B Background Theme',
        filePath: targetPath,
        fileName,
        sourceDurationSeconds: probe.durationSeconds > 0 ? probe.durationSeconds : 4.0,
        targetDurationSeconds: draft.masterAudio?.durationSeconds || 285.16,
        durationSeconds: probe.durationSeconds > 0 ? probe.durationSeconds : 4.0,
        width: probe.width || 3840,
        height: probe.height || 2160,
        hasAudio: probe.hasAudio,
        validationStatus: probe.isValid ? 'VALID' : 'FAILED',
        validationError: probe.error,
        audioMode,
        playbackMode: playbackMode || 'seamless_loop',
        uploadedAt: new Date().toISOString(),
        hasBurnedSubtitles: true,
      };

      pipelineDraftStorage.saveDraft(draft);
      return NextResponse.json({ success: true, partB: draft.video.partB, draft });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
