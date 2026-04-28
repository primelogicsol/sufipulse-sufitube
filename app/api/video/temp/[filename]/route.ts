import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, existsSync, statSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const TEMP_DIR = join(tmpdir(), 'sufipulse-video-temp');

// Only files with UUID-based names (created by /api/video/convert) are served
const VALID_FILENAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_output\.mp4$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!VALID_FILENAME.test(filename)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const filePath = join(TEMP_DIR, filename);
  if (!existsSync(filePath)) {
    return new NextResponse('File not found or expired', { status: 404 });
  }

  const { size: total } = statSync(filePath);
  const range = request.headers.get('range');

  function nodeStreamToWeb(start?: number, end?: number): ReadableStream<Uint8Array> {
    const nodeStream = createReadStream(filePath, start !== undefined ? { start, end } : undefined);
    return new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk as Uint8Array));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
      cancel() { nodeStream.destroy(); },
    });
  }

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
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Content-Length': String(end - start + 1),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, no-cache',
      },
    });
  }

  return new NextResponse(nodeStreamToWeb(), {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(total),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-cache',
    },
  });
}
