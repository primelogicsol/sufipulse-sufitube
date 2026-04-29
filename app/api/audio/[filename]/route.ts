import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, existsSync, statSync } from 'fs';
import { join, extname } from 'path';

const AUDIO_DIR = join(process.cwd(), '.data', 'audio');
const VALID_FILENAME = /^[0-9a-f-]{36}\.(mp3|wav|ogg|m4a|aac|flac)$/i;
const MIME: Record<string, string> = {
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.ogg':  'audio/ogg',
  '.m4a':  'audio/mp4',
  '.aac':  'audio/aac',
  '.flac': 'audio/flac',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!VALID_FILENAME.test(filename)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const filePath = join(AUDIO_DIR, filename);
  if (!existsSync(filePath)) {
    return new NextResponse('File not found', { status: 404 });
  }

  const ext = extname(filename).toLowerCase();
  const contentType = MIME[ext] || 'audio/mpeg';
  const { size: total } = statSync(filePath);
  const range = request.headers.get('range');

  const nodeStreamToWeb = (start?: number, end?: number): ReadableStream<Uint8Array> => {
    const nodeStream = createReadStream(filePath, start !== undefined ? { start, end } : undefined);
    return new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk as Uint8Array));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
      cancel() { nodeStream.destroy(); },
    });
  };

  if (range) {
    const [, startStr, endStr] = range.match(/bytes=(\d+)-(\d*)/) ?? [];
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : total - 1;

    if (isNaN(start) || start >= total) {
      return new NextResponse('Range Not Satisfiable', {
        status: 416,
        headers: { 'Content-Range': `bytes */${total}` },
      });
    }

    return new NextResponse(nodeStreamToWeb(start, end), {
      status: 206,
      headers: {
        'Content-Type': contentType,
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Content-Length': String(end - start + 1),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  return new NextResponse(nodeStreamToWeb(), {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(total),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
