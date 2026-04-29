import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { requireAdmin } from '@/server/middleware/authenticate';

const AUDIO_DIR = join(process.cwd(), '.data', 'audio');
const MAX_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB
const ALLOWED_EXTS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac']);
const MIME: Record<string, string> = {
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.ogg':  'audio/ogg',
  '.m4a':  'audio/mp4',
  '.aac':  'audio/aac',
  '.flac': 'audio/flac',
};

// Send file as raw binary (application/octet-stream) to avoid Next.js FormData body limit.
// Pass the original filename in X-Filename header.
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const originalName = request.headers.get('x-filename') || 'upload.mp3';
    const ext = extname(originalName).toLowerCase();

    if (!ALLOWED_EXTS.has(ext)) {
      return NextResponse.json(
        { error: `Unsupported format. Allowed: ${[...ALLOWED_EXTS].join(', ')}` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await request.arrayBuffer());

    if (buffer.byteLength === 0) {
      return NextResponse.json({ error: 'Empty file received' }, { status: 400 });
    }

    if (buffer.byteLength > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum is ${MAX_SIZE_BYTES / 1024 / 1024} MB` },
        { status: 400 }
      );
    }

    if (!existsSync(AUDIO_DIR)) {
      await mkdir(AUDIO_DIR, { recursive: true });
    }

    const filename = `${randomUUID()}${ext}`;
    const filePath = join(AUDIO_DIR, filename);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/api/audio/${filename}`,
      filename,
      size: buffer.byteLength,
      mimeType: MIME[ext] || 'audio/mpeg',
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
