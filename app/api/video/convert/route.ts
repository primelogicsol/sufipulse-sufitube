import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { unlink, readdir, stat, mkdir } from 'fs/promises';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import Busboy from 'busboy';
import { requireAuth } from '@/server/middleware/authenticate';

const TEMP_DIR = join(tmpdir(), 'sufipulse-video-temp');
const TEMP_TTL_MS = 30 * 60 * 1000; // 30 min
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

// Ensure temp dir exists
async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

// Lazy GC — delete files older than TEMP_TTL_MS
async function cleanStaleFiles() {
  try {
    const files = await readdir(TEMP_DIR);
    const now = Date.now();
    await Promise.all(
      files.map(async (f) => {
        try {
          const p = join(TEMP_DIR, f);
          const s = await stat(p);
          if (now - s.mtimeMs > TEMP_TTL_MS) await unlink(p);
        } catch {}
      })
    );
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
      else reject(new Error(`FFmpeg exited with code ${code}. ${stderr.slice(-600)}`));
    });

    proc.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        reject(new Error('FFmpeg is not installed on this server. Run: apk add ffmpeg'));
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Stream multipart upload directly to disk using busboy.
 * Avoids request.formData() which buffers the entire body in memory and
 * fails for large files (300 MB+) in Next.js App Router.
 */
function saveUploadedFile(
  request: NextRequest,
  destPath: string
): Promise<{ filename: string; mimeType: string; bytesWritten: number }> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => { headers[key] = value; });

    const bb = Busboy({ headers, limits: { fileSize: MAX_FILE_SIZE } });
    let resolved = false;

    bb.on('file', (_field, stream, info) => {
      const writeStream = createWriteStream(destPath);
      let bytesWritten = 0;

      stream.on('data', (chunk: Buffer) => { bytesWritten += chunk.length; });

      stream.on('limit', () => {
        writeStream.destroy();
        try { unlinkSync(destPath); } catch {}
        if (!resolved) {
          resolved = true;
          reject(new Error(`File too large — max ${MAX_FILE_SIZE / 1024 / 1024} MB`));
        }
      });

      stream.pipe(writeStream);

      writeStream.on('finish', () => {
        if (!resolved) {
          resolved = true;
          resolve({ filename: info.filename, mimeType: info.mimeType, bytesWritten });
        }
      });

      writeStream.on('error', (err) => {
        if (!resolved) { resolved = true; reject(err); }
      });

      stream.on('error', (err: Error) => {
        if (!resolved) { resolved = true; reject(err); }
      });
    });

    bb.on('error', (err: Error) => {
      if (!resolved) { resolved = true; reject(err); }
    });

    // Pipe Web ReadableStream → Node.js Readable → busboy
    if (!request.body) {
      reject(new Error('No request body'));
      return;
    }
    const nodeStream = Readable.fromWeb(request.body as any);
    nodeStream.pipe(bb);
    nodeStream.on('error', (err) => {
      if (!resolved) { resolved = true; reject(err); }
    });
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await ensureTempDir();
    void cleanStaleFiles();

    const id = randomUUID();
    const inputPath = join(TEMP_DIR, `${id}_input.bin`);
    const outputPath = join(TEMP_DIR, `${id}_output.mp4`);

    let uploadInfo: { filename: string; mimeType: string; bytesWritten: number };
    try {
      uploadInfo = await saveUploadedFile(request, inputPath);
    } catch (err: any) {
      try { unlinkSync(inputPath); } catch {}
      return NextResponse.json({ error: err.message }, { status: err.message.includes('too large') ? 413 : 400 });
    }

    const { filename, bytesWritten } = uploadInfo;

    // Rename to proper extension for FFmpeg detection
    const ext = (filename.split('.').pop()?.toLowerCase() ?? 'mp4').replace(/[^a-z0-9]/g, '');
    const renamedInput = join(TEMP_DIR, `${id}_input.${ext}`);
    try {
      const { rename } = await import('fs/promises');
      await rename(inputPath, renamedInput);
    } catch {
      // If rename fails, FFmpeg will still try with the .bin file
    }

    const actualInput = existsSync(renamedInput) ? renamedInput : inputPath;

    try {
      await runFfmpeg(actualInput, outputPath);
    } finally {
      try { unlinkSync(actualInput); } catch {}
      try { unlinkSync(inputPath); } catch {}
    }

    return NextResponse.json({
      url: `/api/video/temp/${id}_output.mp4`,
      originalName: filename,
      sizeMB: (bytesWritten / 1024 / 1024).toFixed(1),
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
