import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { requireAdmin } from '@/server/middleware/authenticate';

const AUDIO_DIR = join(process.cwd(), '.data', 'audio');
const MAX_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB
const ALLOWED_TYPES: Record<string, string> = {
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.ogg':  'audio/ogg',
  '.m4a':  'audio/mp4',
  '.aac':  'audio/aac',
  '.flac': 'audio/flac',
};

/**
 * POST /api/audio/upload
 * Admin only. Accepts multipart/form-data with field "file".
 * Saves to .data/audio/ and returns { url } pointing to /api/audio/[filename].
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const ext = extname(file.name).toLowerCase();
    if (!ALLOWED_TYPES[ext]) {
      return NextResponse.json(
        { error: `Unsupported format. Allowed: ${Object.keys(ALLOWED_TYPES).join(', ')}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_SIZE_BYTES / 1024 / 1024} MB` },
        { status: 400 }
      );
    }

    if (!existsSync(AUDIO_DIR)) {
      await mkdir(AUDIO_DIR, { recursive: true });
    }

    const filename = `${randomUUID()}${ext}`;
    const filePath = join(AUDIO_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    return NextResponse.json({
      url: `${appUrl}/api/audio/${filename}`,
      filename,
      size: file.size,
      mimeType: ALLOWED_TYPES[ext],
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
