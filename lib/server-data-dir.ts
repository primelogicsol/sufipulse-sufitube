import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

export function resolveServerDataDir(): string {
  if (process.env.DATA_DIR) {
    return process.env.DATA_DIR;
  }

  if (fs.existsSync('/app/.data')) {
    return '/app/.data';
  }

  return path.join(process.cwd(), '.data');
}

export const DATA_DIR = resolveServerDataDir();
