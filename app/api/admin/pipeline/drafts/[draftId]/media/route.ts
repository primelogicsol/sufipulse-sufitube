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
      const targetFormat = format === 'clean_cinematic' ? 'clean_cinematic' : 'lyric_master';
      const videoDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video');

      // 1. Check draft video metadata format output path
      if (
        draft.video?.formats?.[targetFormat]?.outputPath &&
        fs.existsSync(draft.video.formats[targetFormat].outputPath)
      ) {
        filePath = draft.video.formats[targetFormat].outputPath;
      }
      // 2. Check revision-based name (e.g. video_lyric_master_rev1.mp4)
      else if (
        fs.existsSync(path.join(videoDir, `video_${targetFormat}_rev${draft.currentRevision}.mp4`))
      ) {
        filePath = path.join(videoDir, `video_${targetFormat}_rev${draft.currentRevision}.mp4`);
      }
      // 3. Check legacy flat name (e.g. lyric_master.mp4)
      else if (fs.existsSync(path.join(videoDir, `${targetFormat}.mp4`))) {
        filePath = path.join(videoDir, `${targetFormat}.mp4`);
      }
      // 4. Check prefixed name (e.g. video_lyric_master.mp4)
      else if (fs.existsSync(path.join(videoDir, `video_${targetFormat}.mp4`))) {
        filePath = path.join(videoDir, `video_${targetFormat}.mp4`);
      }
      // 5. Fallback: match any mp4 in videoDir containing the format substring
      else if (fs.existsSync(videoDir)) {
        const matches = fs
          .readdirSync(videoDir)
          .filter((f) => f.includes(targetFormat) && f.endsWith('.mp4'));
        if (matches.length > 0) {
          filePath = path.join(videoDir, matches[matches.length - 1]);
        }
      }
    } else if (asset === 'part_a_image' || asset === 'part_a_artwork') {
      const candidate = draft.video?.partA?.filePath ? path.resolve(process.cwd(), draft.video.partA.filePath) : null;
      if (candidate && fs.existsSync(candidate)) {
        filePath = candidate;
        contentType = filePath.endsWith('.png') ? 'image/png' : filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') ? 'image/jpeg' : 'image/webp';
      } else {
        filePath = path.join(process.cwd(), 'public', 'banner1.png');
        contentType = 'image/png';
      }
    } else if (asset === 'part_b_video') {
      const candidate = draft.video?.partB?.filePath ? path.resolve(process.cwd(), draft.video.partB.filePath) : null;
      if (candidate && fs.existsSync(candidate)) {
        filePath = candidate;
        contentType = 'video/mp4';
      }
    } else if (asset === 'subtitle' && lang) {
      const subDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'subtitles');
      const ext = searchParams.get('ext') || 'vtt';
      filePath = path.join(subDir, `${lang}.${ext}`);
      contentType = ext === 'vtt' ? 'text/vtt' : ext === 'ass' ? 'text/x-ssa' : 'text/plain';
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json({ error: `Asset ${asset} not found` }, { status: 404 });
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
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
