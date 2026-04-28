import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, unlink, readdir, stat, mkdir } from 'fs/promises';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { requireAuth } from '@/server/middleware/authenticate';

const TEMP_DIR = join(tmpdir(), 'sufipulse-video-temp');
const TEMP_TTL_MS = 30 * 60 * 1000; // 30 min
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

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

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await ensureTempDir();
    void cleanStaleFiles(); // fire-and-forget

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large — max ${MAX_FILE_SIZE / 1024 / 1024} MB` }, { status: 413 });
    }

    const id = randomUUID();
    const ext = (file.name.split('.').pop()?.toLowerCase() ?? 'mp4').replace(/[^a-z0-9]/g, '');
    const inputPath = join(TEMP_DIR, `${id}_input.${ext}`);
    const outputPath = join(TEMP_DIR, `${id}_output.mp4`);

    const bytes = await file.arrayBuffer();
    await writeFile(inputPath, Buffer.from(bytes));

    try {
      await runFfmpeg(inputPath, outputPath);
    } finally {
      try { unlinkSync(inputPath); } catch {}
    }

    return NextResponse.json({
      url: `/api/video/temp/${id}_output.mp4`,
      originalName: file.name,
      sizeMB: (file.size / 1024 / 1024).toFixed(1),
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
