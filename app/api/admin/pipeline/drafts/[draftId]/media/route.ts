import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';

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
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const asset = searchParams.get('asset') || 'audio';
    const variantId = searchParams.get('variantId');
    const lang = searchParams.get('lang');
    const format = searchParams.get('format') || 'lyric_master';

    let filePath: string | null = null;
    let contentType = 'application/octet-stream';

    if (asset === 'audio' || asset === 'master_audio') {
      contentType = 'audio/wav';
      const audioDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'audio');
      if (draft.masterAudio?.filePath && fs.existsSync(draft.masterAudio.filePath)) {
        filePath = draft.masterAudio.filePath;
      } else if (fs.existsSync(path.join(audioDir, `master_rev${draft.currentRevision}.wav`))) {
        filePath = path.join(audioDir, `master_rev${draft.currentRevision}.wav`);
      } else if (fs.existsSync(path.join(audioDir, 'master.wav'))) {
        filePath = path.join(audioDir, 'master.wav');
      } else if (fs.existsSync(audioDir)) {
        const wavs = fs.readdirSync(audioDir).filter((f) => f.endsWith('.wav'));
        if (wavs.length > 0) filePath = path.join(audioDir, wavs[0]);
      }
    } else if (asset === 'variant' && variantId) {
      const variant = draft.variants[variantId];
      if (variant) {
        filePath = variant.filePath;
        contentType = variant.format === 'wav' ? 'audio/wav' : 'audio/mpeg';
      }
    } else if (asset === 'video' || asset === 'master_video') {
      contentType = 'video/mp4';
      const videoType = (searchParams.get('format') === 'clean_cinematic' ? 'clean_cinematic' : 'lyric_master') as 'lyric_master' | 'clean_cinematic';
      const orientation = (searchParams.get('orientation') === 'portrait' ? 'portrait' : 'landscape') as 'landscape' | 'portrait';
      const formatKey = `${videoType}_${orientation}`;
      const videoDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video');

      // 1. Check draft video metadata format output path for exact key
      if (
        draft.video?.formats?.[formatKey]?.outputPath &&
        fs.existsSync(draft.video.formats[formatKey].outputPath)
      ) {
        filePath = draft.video.formats[formatKey].outputPath;
      }
      // 2. Check full revision-based filename (e.g. video_lyric_master_portrait_rev1.mp4)
      else if (
        fs.existsSync(path.join(videoDir, `video_${formatKey}_rev${draft.currentRevision}.mp4`))
      ) {
        filePath = path.join(videoDir, `video_${formatKey}_rev${draft.currentRevision}.mp4`);
      }
      // 3. Check un-versioned name (e.g. video_lyric_master_portrait.mp4 or lyric_master_portrait.mp4)
      else if (fs.existsSync(path.join(videoDir, `video_${formatKey}.mp4`))) {
        filePath = path.join(videoDir, `video_${formatKey}.mp4`);
      } else if (fs.existsSync(path.join(videoDir, `${formatKey}.mp4`))) {
        filePath = path.join(videoDir, `${formatKey}.mp4`);
      }
      // 4. If landscape, allow legacy fallbacks (never fall back to landscape when portrait is requested!)
      else if (orientation === 'landscape') {
        if (
          draft.video?.formats?.[videoType]?.outputPath &&
          fs.existsSync(draft.video.formats[videoType].outputPath)
        ) {
          filePath = draft.video.formats[videoType].outputPath;
        } else if (
          fs.existsSync(path.join(videoDir, `video_${videoType}_rev${draft.currentRevision}.mp4`))
        ) {
          filePath = path.join(videoDir, `video_${videoType}_rev${draft.currentRevision}.mp4`);
        } else if (fs.existsSync(path.join(videoDir, `${videoType}.mp4`))) {
          filePath = path.join(videoDir, `${videoType}.mp4`);
        } else if (fs.existsSync(path.join(videoDir, `video_${videoType}.mp4`))) {
          filePath = path.join(videoDir, `video_${videoType}.mp4`);
        }
      }
    } else if (asset === 'part_a_image' || asset === 'part_a_artwork' || asset === 'part_a_video') {
      const candidate = draft.video?.partA?.filePath ? path.resolve(process.cwd(), draft.video.partA.filePath) : null;
      if (candidate && fs.existsSync(candidate)) {
        filePath = candidate;
        if (filePath.endsWith('.mp4')) {
          contentType = 'video/mp4';
        } else if (filePath.endsWith('.mov')) {
          contentType = 'video/quicktime';
        } else if (filePath.endsWith('.png')) {
          contentType = 'image/png';
        } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
          contentType = 'image/jpeg';
        } else {
          contentType = 'image/webp';
        }
      } else {
        filePath = path.join(process.cwd(), 'public', 'banner1.png');
        contentType = 'image/png';
      }
    } else if (asset === 'part_a_thumbnail' || asset === 'thumbnail') {
      const thumb = draft.video?.partA?.thumbnailPath ? path.resolve(process.cwd(), draft.video.partA.thumbnailPath) : null;
      if (thumb && fs.existsSync(thumb)) {
        filePath = thumb;
        const ext = path.extname(thumb).toLowerCase();
        contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      } else {
        filePath = path.join(process.cwd(), 'public', 'banner1.png');
        contentType = 'image/png';
      }
    } else if (asset === 'part_b_preview') {
      const orientationParam = searchParams.get('orientation') === 'portrait' ? 'portrait' : 'landscape';
      const prev = (draft.video as any)?.partB?.preview;
      const prevPath = prev?.path && prev.orientation === orientationParam ? prev.path : null;
      if (prevPath && fs.existsSync(prevPath)) {
        filePath = prevPath;
        contentType = 'video/mp4';
      }
    } else if (asset === 'part_b_rendered') {
      const videoType = format === 'clean_cinematic' ? 'clean_cinematic' : 'lyric_master';
      const orientation = searchParams.get('orientation') === 'portrait' ? 'portrait' : 'landscape';
      const rendered = draft.video?.formats?.[videoType + '_' + orientation];
      const previewFile = rendered?.sha256 ? path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video', 'part_b_' + rendered.sha256 + '.mp4') : null;
      if (previewFile && fs.existsSync(previewFile)) {
        filePath = previewFile;
        contentType = 'video/mp4';
      } else if (rendered?.outputPath && fs.existsSync(rendered.outputPath)) {
        // Fall back to the rendered full master video if dedicated preview segment is not yet extracted
        filePath = rendered.outputPath;
        contentType = 'video/mp4';
      }
    } else if (asset === 'part_b_video' || asset === 'part_b') {
      const candidate = draft.video?.partB?.filePath ? path.resolve(process.cwd(), draft.video.partB.filePath) : null;
      const themeLocal = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video', 'canva_part_b_original_4s.mp4');
      const themeLocal2 = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video', 'part_a_theme.mp4');
      const sharedTheme = path.join(process.cwd(), '.data', 'shared-assets', 'canva_part_a_DAHa7St5CYs.mp4');

      if (candidate && fs.existsSync(candidate)) {
        filePath = candidate;
        contentType = 'video/mp4';
      } else if (fs.existsSync(themeLocal)) {
        filePath = themeLocal;
        contentType = 'video/mp4';
      } else if (fs.existsSync(themeLocal2)) {
        filePath = themeLocal2;
        contentType = 'video/mp4';
      } else if (fs.existsSync(sharedTheme)) {
        filePath = sharedTheme;
        contentType = 'video/mp4';
      }
    } else if (asset === 'part_c_video' || asset === 'part_c') {
      const candidate = draft.video?.partC?.filePath ? path.resolve(process.cwd(), draft.video.partC.filePath) : null;
      if (candidate && fs.existsSync(candidate)) {
        filePath = candidate;
        contentType = 'video/mp4';
      } else {
        const sharedPromo = path.join(process.cwd(), '.data', 'shared-assets', 'promotional', 'canva_part_b_DAHa7eJOcbI.mp4');
        if (fs.existsSync(sharedPromo)) {
          filePath = sharedPromo;
          contentType = 'video/mp4';
        }
      }
    } else if (asset === 'subtitle' && lang) {
      const subDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'subtitles');
      const ext = searchParams.get('ext') || 'vtt';
      filePath = path.join(subDir, `${lang}.${ext}`);
      contentType = ext === 'vtt' ? 'text/vtt' : ext === 'ass' ? 'text/x-ssa' : 'text/plain';
    }

    if (!filePath || !fs.existsSync(filePath)) {
      const errMsg = asset.startsWith('part_b')
        ? 'SOURCE VIDEO UNAVAILABLE: RECONNECT OR REPLACE PART B BACKGROUND'
        : `Asset ${asset} not found`;
      return NextResponse.json({ error: errMsg }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const range = request.headers.get('range');

    const createSafeWebStream = (start?: number, end?: number) => {
      const fileStream =
        typeof start === 'number' && typeof end === 'number'
          ? fs.createReadStream(filePath!, { start, end })
          : fs.createReadStream(filePath!);

      if (request.signal) {
        if (request.signal.aborted) {
          fileStream.destroy();
        } else {
          request.signal.addEventListener('abort', () => fileStream.destroy(), { once: true });
        }
      }

      return new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk: string | Buffer) => {
            try {
              if (typeof chunk === 'string') {
                controller.enqueue(new TextEncoder().encode(chunk));
              } else {
                controller.enqueue(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
              }
            } catch {
              fileStream.destroy();
            }
          });
          fileStream.on('end', () => {
            try {
              controller.close();
            } catch {}
          });
          fileStream.on('error', (err) => {
            try {
              controller.error(err);
            } catch {}
          });
        },
        cancel() {
          fileStream.destroy();
        },
      });
    };

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = end - start + 1;
      const webStream = createSafeWebStream(start, end);

      return new NextResponse(webStream as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': contentType,
        },
      });
    }

    const webStream = createSafeWebStream();
    return new NextResponse(webStream as any, {
      headers: {
        'Content-Length': stat.size.toString(),
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': asset === 'thumbnail' || asset === 'part_a_thumbnail' ? 'no-store, max-age=0' : 'private, max-age=0',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
