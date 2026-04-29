import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile, unlink, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { requireAdmin } from '@/server/middleware/authenticate';

const AUDIO_DIR = join(process.cwd(), '.data', 'audio');
const TMP_DIR   = join(process.cwd(), '.data', 'audio', 'tmp');
const MAX_TOTAL_BYTES = 150 * 1024 * 1024;  // 150 MB
const MAX_CHUNK_BYTES =  10 * 1024 * 1024;  // 10 MB per chunk (client sends 5 MB)
const ALLOWED_EXTS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac']);
const MIME: Record<string, string> = {
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.ogg':  'audio/ogg',
  '.m4a':  'audio/mp4',
  '.aac':  'audio/aac',
  '.flac': 'audio/flac',
};
const UPLOAD_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

async function ensureDirs() {
  if (!existsSync(AUDIO_DIR)) await mkdir(AUDIO_DIR, { recursive: true });
  if (!existsSync(TMP_DIR))   await mkdir(TMP_DIR,   { recursive: true });
}

async function readBodyToBuffer(request: NextRequest, maxBytes: number): Promise<Buffer> {
  if (!request.body) throw new Error('No request body');
  const reader = (request.body as ReadableStream<Uint8Array>).getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw new Error(`Chunk exceeds ${maxBytes / 1024 / 1024} MB limit`);
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(parts);
}

async function cleanTmpChunks(uploadId: string, totalChunks: number) {
  await Promise.allSettled(
    Array.from({ length: totalChunks }, (_, i) =>
      unlink(join(TMP_DIR, `${uploadId}_chunk_${i}.bin`))
    )
  );
}

/**
 * POST /api/audio/upload
 * Admin only. Chunked upload (5 MB chunks) — send headers:
 *   X-Upload-Id, X-Chunk-Index, X-Total-Chunks, X-Filename
 * On the final chunk the server merges and saves the audio file.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await ensureDirs();

    const uploadId      = request.headers.get('x-upload-id');
    const chunkIdxHdr   = request.headers.get('x-chunk-index');
    const totalChunksHdr= request.headers.get('x-total-chunks');
    const originalName  = decodeURIComponent(request.headers.get('x-filename') || 'upload.mp3');
    const ext = extname(originalName).toLowerCase();

    if (!ALLOWED_EXTS.has(ext)) {
      return NextResponse.json(
        { error: `Unsupported format. Allowed: ${[...ALLOWED_EXTS].join(', ')}` },
        { status: 400 }
      );
    }

    // ── Chunked upload path ────────────────────────────────────────────────
    if (uploadId !== null && chunkIdxHdr !== null && totalChunksHdr !== null) {
      if (!UPLOAD_ID_RE.test(uploadId)) {
        return NextResponse.json({ error: 'Invalid upload ID' }, { status: 400 });
      }
      const chunkIndex  = parseInt(chunkIdxHdr, 10);
      const totalChunks = parseInt(totalChunksHdr, 10);
      if (isNaN(chunkIndex) || isNaN(totalChunks) || chunkIndex < 0 || chunkIndex >= totalChunks) {
        return NextResponse.json({ error: 'Invalid chunk params' }, { status: 400 });
      }

      const chunkBuf = await readBodyToBuffer(request, MAX_CHUNK_BYTES);
      await writeFile(join(TMP_DIR, `${uploadId}_chunk_${chunkIndex}.bin`), chunkBuf);

      // Intermediate chunk — acknowledge
      if (chunkIndex < totalChunks - 1) {
        return NextResponse.json({ received: chunkIndex });
      }

      // ── Last chunk — merge all chunks ──────────────────────────────────
      const parts: Buffer[] = [];
      let totalSize = 0;
      for (let i = 0; i < totalChunks; i++) {
        const part = await readFile(join(TMP_DIR, `${uploadId}_chunk_${i}.bin`));
        totalSize += part.byteLength;
        if (totalSize > MAX_TOTAL_BYTES) {
          await cleanTmpChunks(uploadId, totalChunks);
          return NextResponse.json(
            { error: `File too large. Maximum is ${MAX_TOTAL_BYTES / 1024 / 1024} MB` },
            { status: 400 }
          );
        }
        parts.push(part);
      }

      const finalBuffer = Buffer.concat(parts);
      const filename  = `${randomUUID()}${ext}`;
      await writeFile(join(AUDIO_DIR, filename), finalBuffer);
      await cleanTmpChunks(uploadId, totalChunks);

      return NextResponse.json({
        url: `/api/audio/${filename}`,
        filename,
        size: finalBuffer.byteLength,
        mimeType: MIME[ext] || 'audio/mpeg',
      }, { status: 201 });
    }

    // ── Single-shot fallback (small files) ────────────────────────────────
    const buffer = await readBodyToBuffer(request, MAX_TOTAL_BYTES);
    if (buffer.byteLength === 0) {
      return NextResponse.json({ error: 'Empty file received' }, { status: 400 });
    }
    const filename = `${randomUUID()}${ext}`;
    await writeFile(join(AUDIO_DIR, filename), buffer);
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
