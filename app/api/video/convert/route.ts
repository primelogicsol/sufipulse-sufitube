import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { createWriteStream, createReadStream } from 'fs';
import { unlink, readdir, stat, mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { requireAuth } from '@/server/middleware/authenticate';

const TEMP_DIR = join(tmpdir(), 'sufipulse-video-temp');
const TEMP_TTL_MS = 30 * 60 * 1000;
const MAX_FILE_SIZE = 500 * 1024 * 1024;  // 500 MB total
const MAX_CHUNK_SIZE = 10 * 1024 * 1024;  // 10 MB per chunk (client sends 5 MB)

const UPLOAD_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ALLOWED_VIDEO_EXTS = new Set(['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', 'wmv', 'flv', 'ts', 'mts', 'm2ts', '3gp', 'hevc']);

async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) await mkdir(TEMP_DIR, { recursive: true });
}

async function cleanStaleFiles() {
  try {
    const files = await readdir(TEMP_DIR);
    const now = Date.now();
    await Promise.all(files.map(async (f) => {
      try {
        const p = join(TEMP_DIR, f);
        const s = await stat(p);
        if (now - s.mtimeMs > TEMP_TTL_MS) await unlink(p);
      } catch {}
    }));
  } catch {}
}

function runFfmpeg(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', [
      '-i', inputPath,
      '-c:v', 'libx264', '-crf', '20', '-preset', 'fast', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart',
      '-y', outputPath,
    ]);
    let stderr = '';
    proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited ${code}. ${stderr.slice(-500)}`));
    });
    proc.on('error', (err: NodeJS.ErrnoException) => {
      reject(err.code === 'ENOENT'
        ? new Error('FFmpeg not installed on this server')
        : err);
    });
  });
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

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await ensureTempDir();
  void cleanStaleFiles();

  const uploadId = request.headers.get('x-upload-id');
  const chunkIndexHeader = request.headers.get('x-chunk-index');
  const totalChunksHeader = request.headers.get('x-total-chunks');

  // ── Chunked upload ────────────────────────────────────────────────────────────
  if (uploadId !== null && chunkIndexHeader !== null && totalChunksHeader !== null) {
    if (!UPLOAD_ID_RE.test(uploadId)) {
      return NextResponse.json({ error: 'Invalid upload ID' }, { status: 400 });
    }

    const chunkIndex = parseInt(chunkIndexHeader, 10);
    const totalChunks = parseInt(totalChunksHeader, 10);

    if (
      isNaN(chunkIndex) || isNaN(totalChunks) ||
      chunkIndex < 0 || chunkIndex >= totalChunks ||
      totalChunks < 1 || totalChunks > 200
    ) {
      return NextResponse.json({ error: 'Invalid chunk parameters' }, { status: 400 });
    }

    const rawFilename = request.headers.get('x-filename') || 'video.mp4';
    const filename = decodeURIComponent(rawFilename);
    const ext = (filename.split('.').pop()?.toLowerCase() ?? 'mp4').replace(/[^a-z0-9]/g, '') || 'mp4';

    if (!ALLOWED_VIDEO_EXTS.has(ext)) {
      return NextResponse.json({ error: `File type .${ext} is not supported. Upload a video file (mp4, mov, mkv, etc.).` }, { status: 415 });
    }

    // Read this chunk into memory — 5 MB from client, well within Node limits
    let chunkBuf: Buffer;
    try {
      chunkBuf = await readBodyToBuffer(request, MAX_CHUNK_SIZE);
    } catch (err: any) {
      return NextResponse.json({ error: `Failed to read chunk ${chunkIndex}: ${err.message}` }, { status: 500 });
    }

    const chunkPath = join(TEMP_DIR, `${uploadId}_chunk_${chunkIndex}.bin`);
    try {
      await writeFile(chunkPath, chunkBuf);
    } catch (err: any) {
      return NextResponse.json({ error: `Failed to save chunk ${chunkIndex}: ${err.message}` }, { status: 500 });
    }

    // Intermediate chunk — acknowledge and wait for more
    if (chunkIndex < totalChunks - 1) {
      return NextResponse.json({ received: chunkIndex });
    }

    // ── Last chunk: assemble all chunks, run FFmpeg ───────────────────────────
    const inputPath = join(TEMP_DIR, `${uploadId}_input.${ext}`);
    const outputPath = join(TEMP_DIR, `${uploadId}_output.mp4`);

    try {
      // Verify all chunks are present before starting assembly
      for (let i = 0; i < totalChunks; i++) {
        if (!existsSync(join(TEMP_DIR, `${uploadId}_chunk_${i}.bin`))) {
          return NextResponse.json({ error: `Chunk ${i} is missing — please restart the upload` }, { status: 400 });
        }
      }

      // Assemble: read each 5 MB chunk buffer sequentially and stream into input file
      const assembleStream = createWriteStream(inputPath);
      let totalAssembled = 0;
      for (let i = 0; i < totalChunks; i++) {
        const cp = join(TEMP_DIR, `${uploadId}_chunk_${i}.bin`);
        const buf = await readFile(cp);
        totalAssembled += buf.byteLength;
        if (totalAssembled > MAX_FILE_SIZE) {
          assembleStream.destroy();
          throw new Error(`File too large — max ${MAX_FILE_SIZE / 1024 / 1024} MB`);
        }
        await new Promise<void>((resolve, reject) => {
          assembleStream.once('error', reject);
          if (!assembleStream.write(buf)) {
            assembleStream.once('drain', resolve);
          } else {
            resolve();
          }
        });
        try { unlinkSync(cp); } catch {}
      }
      await new Promise<void>((resolve, reject) =>
        assembleStream.end((err?: Error | null) => err ? reject(err) : resolve())
      );

      // Run FFmpeg on the assembled file
      try {
        await runFfmpeg(inputPath, outputPath);
      } finally {
        try { unlinkSync(inputPath); } catch {}
      }

      return NextResponse.json({
        url: `/api/video/temp/${uploadId}_output.mp4`,
        originalName: filename,
      }, { status: 201 });

    } catch (e: any) {
      try { unlinkSync(inputPath); } catch {}
      for (let i = 0; i < totalChunks; i++) {
        try { unlinkSync(join(TEMP_DIR, `${uploadId}_chunk_${i}.bin`)); } catch {}
      }
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // ── Legacy single-upload (kept for compatibility; will fail > ~10 MB on this server) ──
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large — max ${MAX_FILE_SIZE / 1024 / 1024} MB` },
      { status: 413 }
    );
  }

  if (!request.body) {
    return NextResponse.json({ error: 'No request body' }, { status: 400 });
  }

  try {
    const rawFilename = request.headers.get('x-filename') || 'video.mp4';
    const filename = decodeURIComponent(rawFilename);
    const ext = (filename.split('.').pop()?.toLowerCase() ?? 'mp4').replace(/[^a-z0-9]/g, '') || 'mp4';

    if (!ALLOWED_VIDEO_EXTS.has(ext)) {
      return NextResponse.json({ error: `File type .${ext} is not supported. Upload a video file (mp4, mov, mkv, etc.).` }, { status: 415 });
    }

    const id = randomUUID();
    const inputPath = join(TEMP_DIR, `${id}_input.${ext}`);
    const outputPath = join(TEMP_DIR, `${id}_output.mp4`);

    const reader = (request.body as ReadableStream<Uint8Array>).getReader();
    const writeStream = createWriteStream(inputPath);
    let bytesWritten = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytesWritten += value.byteLength;
        if (bytesWritten > MAX_FILE_SIZE) {
          writeStream.destroy();
          try { unlinkSync(inputPath); } catch {}
          return NextResponse.json(
            { error: `File too large — max ${MAX_FILE_SIZE / 1024 / 1024} MB` },
            { status: 413 }
          );
        }
        if (!writeStream.write(value)) {
          await new Promise<void>(resolve => writeStream.once('drain', resolve));
        }
      }
      await new Promise<void>((resolve, reject) =>
        writeStream.end((err?: Error | null) => err ? reject(err) : resolve())
      );
    } catch (err: any) {
      reader.releaseLock();
      writeStream.destroy();
      try { unlinkSync(inputPath); } catch {}
      return NextResponse.json({ error: `Upload failed: ${err.message}` }, { status: 500 });
    } finally {
      reader.releaseLock();
    }

    if (contentLength > 0 && Math.abs(bytesWritten - contentLength) > 1024) {
      try { unlinkSync(inputPath); } catch {}
      return NextResponse.json(
        { error: `Upload incomplete: received ${bytesWritten} of ${contentLength} bytes. Use chunked upload.` },
        { status: 400 }
      );
    }

    try {
      await runFfmpeg(inputPath, outputPath);
    } finally {
      try { unlinkSync(inputPath); } catch {}
    }

    return NextResponse.json({
      url: `/api/video/temp/${id}_output.mp4`,
      originalName: filename,
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
