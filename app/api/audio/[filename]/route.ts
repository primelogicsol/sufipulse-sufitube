import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
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
  const { size: total } = await stat(filePath);
  const range = request.headers.get('range');

  const cacheHeaders = {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
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

    const clampedEnd = Math.min(end, total - 1);
    const fileBuffer = await readFile(filePath);
    const chunk = fileBuffer.subarray(start, clampedEnd + 1);

    return new NextResponse(chunk, {
      status: 206,
      headers: {
        ...cacheHeaders,
        'Content-Type': contentType,
        'Content-Range': `bytes ${start}-${clampedEnd}/${total}`,
        'Content-Length': String(chunk.byteLength),
      },
    });
  }

  const fileBuffer = await readFile(filePath);
  return new NextResponse(fileBuffer, {
    headers: {
      ...cacheHeaders,
      'Content-Type': contentType,
      'Content-Length': String(total),
    },
  });
}
