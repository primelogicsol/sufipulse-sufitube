import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
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
      filePath = draft.masterAudio?.filePath || null;
      contentType = 'audio/wav';
    } else if (asset === 'variant' && variantId) {
      const variant = draft.variants[variantId];
      if (variant) {
        filePath = variant.filePath;
        contentType = variant.format === 'wav' ? 'audio/wav' : 'audio/mpeg';
      }
    } else if (asset === 'video' || asset === 'master_video') {
      const videoFileName = format === 'clean_cinematic' ? 'clean_cinematic.mp4' : 'lyric_master.mp4';
      filePath = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video', videoFileName);
      contentType = 'video/mp4';
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

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      return new NextResponse(fileStream as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': contentType,
        },
      });
    }

    const fileStream = fs.createReadStream(filePath);
    return new NextResponse(fileStream as any, {
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
