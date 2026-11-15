import 'server-only';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { promisify } from 'node:util';
import { ingestAuthorizedAudio } from './ingest-authorized-audio';

const run = promisify(execFile);
let exportInProgress = false;

export function isLocalSunoBrowserAvailable(): boolean {
  return process.platform === 'win32' && process.env.NODE_ENV === 'development' &&
    Boolean(process.env.LOCALAPPDATA) &&
    fs.existsSync(path.join(process.cwd(), 'node_modules', 'playwright', 'package.json'));
}

export async function ingestSunoBrowserAudio(assetId: string, destination: string) {
  if (exportInProgress) throw new Error('A Suno export is already running. Retry when it finishes.');
  exportInProgress = true;
  let directory: string | undefined;
  try {
    directory = await fsp.mkdtemp(path.join(os.tmpdir(), 'sufipulse-suno-'));
    const exportPath = path.join(directory, 'suno-export');
    try {
      await run(process.execPath, [path.join(process.cwd(), 'scripts', 'export-suno-audio.cjs'), assetId, exportPath], {
        timeout: 300_000,
        windowsHide: true,
      });
    } catch (error) {
      const detail = (error as { stderr?: string }).stderr?.trim();
      throw new Error(detail || 'The Suno browser export timed out. Open Fetch from Suno and retry.');
    }
    return await ingestAuthorizedAudio(assetId, destination, async () => {
      const size = (await fsp.stat(exportPath)).size;
      const body = Readable.toWeb(fs.createReadStream(exportPath)) as ReadableStream<Uint8Array>;
      return new Response(body, { headers: { 'Content-Length': String(size) } });
    });
  } finally {
    exportInProgress = false;
    if (directory) await fsp.rm(directory, { recursive: true, force: true }).catch(() => undefined);
  }
}
