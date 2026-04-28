import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { unlink, readdir, stat, mkdir } from 'fs/promises';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { requireAuth } from '@/server/middleware/authenticate';

const TEMP_DIR = join(tmpdir(), 'sufipulse-video-temp');
const TEMP_TTL_MS = 30 * 60 * 1000;
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

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

/**
 * Accepts the raw video file as the request body (Content-Type: application/octet-stream).
 * Filename is passed via X-Filename header.
 * Avoids all multipart parsing — no busboy, no boundary, no FormData.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

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
    await ensureTempDir();
    void cleanStaleFiles();

    const rawFilename = request.headers.get('x-filename') || 'video.mp4';
    const filename = decodeURIComponent(rawFilename);
    const ext = (filename.split('.').pop()?.toLowerCase() ?? 'mp4').replace(/[^a-z0-9]/g, '') || 'mp4';

    const id = randomUUID();
    const inputPath = join(TEMP_DIR, `${id}_input.${ext}`);
    const outputPath = join(TEMP_DIR, `${id}_output.mp4`);

    // Read Web ReadableStream chunk-by-chunk directly — avoids Readable.fromWeb
    // conversion which drops chunks for large bodies in Next.js App Router.
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
        // Respect backpressure
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

    // Verify completeness against Content-Length if provided
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 0 && Math.abs(bytesWritten - contentLength) > 1024) {
      try { unlinkSync(inputPath); } catch {}
      return NextResponse.json(
        { error: `Upload incomplete: received ${bytesWritten} of ${contentLength} bytes. Try again.` },
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
