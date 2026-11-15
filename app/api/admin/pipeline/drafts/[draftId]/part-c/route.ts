import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage, isValidDraftId } from '@/server/storage/pipeline-draft-storage';
import { probeMediaFile } from '@/server/services/media-prober';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getFfmpegPath } from '@/server/services/video-renderer';

export const dynamic = 'force-dynamic';

export async function GET(
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

    const sharedAssetPath = path.join(process.cwd(), '.data', 'shared-assets', 'promotional', 'canva_part_b_DAHa7eJOcbI.mp4');
    const sharedManifestPath = path.join(process.cwd(), '.data', 'shared-assets', 'promotional', 'manifest_DAHa7eJOcbI.json');
    let sharedManifest = null;
    if (fs.existsSync(sharedManifestPath)) {
      try {
        sharedManifest = JSON.parse(fs.readFileSync(sharedManifestPath, 'utf8'));
      } catch {}
    }

    return NextResponse.json({
      success: true,
      partC: draft.video?.partC,
      sharedAssetAvailable: fs.existsSync(sharedAssetPath),
      sharedAssetManifest: sharedManifest,
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
    if (!isValidDraftId(draftId)) return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });

    const draft = pipelineDraftStorage.getDraft(draftId);
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    if (!draft.video) {
      draft.video = {
        status: 'PENDING',
        renderedAt: new Date().toISOString(),
        formats: {},
      };
    }

    const contentType = request.headers.get('content-type') || '';

    // Action: Link to Shared Reusable Asset
    if (contentType.includes('application/json')) {
      const body = await request.json();

      if (body.action === 'use_shared_asset') {
        const sharedAssetPath = path.join(process.cwd(), '.data', 'shared-assets', 'promotional', 'canva_part_b_DAHa7eJOcbI.mp4');
        if (!fs.existsSync(sharedAssetPath)) {
          return NextResponse.json({ error: 'Shared Canva Part B asset not found on disk' }, { status: 404 });
        }

        const probe = await probeMediaFile(sharedAssetPath);
        draft.video.partC = {
          enabled: true,
          canvaDesignId: 'DAHa7eJOcbI',
          canvaUrl: 'https://canva.link/qvmwwc830dm623g',
          title: 'Part 2',
          sceneCount: 19,
          filePath: sharedAssetPath,
          fileName: 'Part 2.mp4',
          durationSeconds: probe.durationSeconds > 0 ? probe.durationSeconds : 608.0,
          formattedDuration: '10:08',
          width: probe.width || 1920,
          height: probe.height || 1080,
          hasAudio: probe.hasAudio ?? true,
          validationStatus: probe.isValid ? 'VALID' : 'FAILED',
          audioMode: body.audioMode || 'preserve_canva_audio',
          playbackMode: body.playbackMode || 'full_19_scenes',
          uploadedAt: new Date().toISOString(),
        };

        pipelineDraftStorage.saveDraft(draft);
        return NextResponse.json({ success: true, partC: draft.video.partC, draft });
      }

      // Settings update
      draft.video.partC = {
        enabled: body.enabled !== false,
        canvaDesignId: body.canvaDesignId || draft.video.partC?.canvaDesignId || 'DAHa7eJOcbI',
        canvaUrl: body.canvaUrl || draft.video.partC?.canvaUrl || 'https://canva.link/qvmwwc830dm623g',
        title: body.title || draft.video.partC?.title || 'Part 2',
        sceneCount: typeof body.sceneCount === 'number' ? body.sceneCount : 19,
        filePath: draft.video.partC?.filePath,
        fileName: draft.video.partC?.fileName || 'Part 2.mp4',
        durationSeconds: typeof body.durationSeconds === 'number' ? body.durationSeconds : (draft.video.partC?.durationSeconds || 608.0),
        formattedDuration: '10:08',
        audioMode: body.audioMode || draft.video.partC?.audioMode || 'preserve_canva_audio',
        playbackMode: body.playbackMode || draft.video.partC?.playbackMode || 'full_19_scenes',
        trimStartSeconds: body.trimStartSeconds,
        trimEndSeconds: body.trimEndSeconds,
      };

      pipelineDraftStorage.saveDraft(draft);
      return NextResponse.json({ success: true, partC: draft.video.partC, draft });
    }

    // Direct MP4 streaming / multipart upload
    if (
      contentType.includes('application/octet-stream') ||
      contentType.includes('video/') ||
      contentType.includes('multipart/form-data')
    ) {
      let fileBuffer: Buffer | null = null;
      let fileName = 'Part 2.mp4';
      let audioMode: any = 'preserve_canva_audio';
      let playbackMode: any = 'full_19_scenes';

      const fileNameHeader = request.headers.get('x-file-name');
      if (fileNameHeader) fileName = decodeURIComponent(fileNameHeader);

      if (contentType.includes('multipart/form-data')) {
        try {
          const formData = await request.formData();
          const file = formData.get('file') as File | null;
          if (file) {
            fileName = file.name;
            fileBuffer = Buffer.from(await file.arrayBuffer());
          }
          if (formData.get('audioMode')) audioMode = formData.get('audioMode') as any;
          if (formData.get('playbackMode')) playbackMode = formData.get('playbackMode') as any;
        } catch {}
      }

      if (!fileBuffer) {
        const arr = await request.arrayBuffer();
        if (arr && arr.byteLength > 0) fileBuffer = Buffer.from(arr);
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        return NextResponse.json({ error: 'No video data received' }, { status: 400 });
      }

      const videoDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video');
      fs.mkdirSync(videoDir, { recursive: true });
      const targetPath = path.join(videoDir, `canva_part_c_${Date.now()}.mp4`);
      fs.writeFileSync(targetPath, fileBuffer);

      // Move the MP4 index (moov) to the front so the browser can start playing at once
      // (lossless stream copy; Canva exports put it at the end of a 100 MB+ file).
      try {
        const fastPath = targetPath.replace(/\.mp4$/, '.faststart.mp4');
        await promisify(execFile)(
          getFfmpegPath(),
          ['-hide_banner', '-loglevel', 'error', '-y', '-i', targetPath, '-c', 'copy', '-movflags', '+faststart', fastPath],
          { timeout: 120_000 },
        );
        if (fs.existsSync(fastPath) && fs.statSync(fastPath).size > 0) {
          fs.renameSync(fastPath, targetPath);
        }
      } catch {
        // Keep the original file if remuxing fails.
      }

      const probe = await probeMediaFile(targetPath);
      draft.video.partC = {
        enabled: true,
        canvaDesignId: 'DAHa7eJOcbI',
        canvaUrl: 'https://canva.link/qvmwwc830dm623g',
        title: 'Part 2',
        sceneCount: 19,
        filePath: targetPath,
        fileName,
        durationSeconds: probe.durationSeconds > 0 ? probe.durationSeconds : 608.0,
        formattedDuration: '10:08',
        width: probe.width || 1920,
        height: probe.height || 1080,
        hasAudio: probe.hasAudio ?? true,
        validationStatus: probe.isValid ? 'VALID' : 'FAILED',
        audioMode,
        playbackMode,
        uploadedAt: new Date().toISOString(),
      };

      pipelineDraftStorage.saveDraft(draft);
      return NextResponse.json({ success: true, partC: draft.video.partC, draft });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
