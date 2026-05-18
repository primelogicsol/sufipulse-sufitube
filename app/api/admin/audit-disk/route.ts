import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';

type DiskAuditStats = {
  docker: {
    path: string;
    exists: boolean;
    size: number;
    mtime: Date | null;
  };
  local: {
    path: string;
    exists: boolean;
    size: number;
    mtime: Date | null;
  };
  process: {
    pid: number;
    cwd: string;
  };
  actualCount?: number;
  error?: string;
};

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const dataFile = '/app/.data/cms-releases.json';
  const localFile = path.join(process.cwd(), '.data', 'cms-releases.json');
  
  const stats: DiskAuditStats = {
    docker: {
      path: dataFile,
      exists: fs.existsSync(dataFile),
      size: fs.existsSync(dataFile) ? fs.statSync(dataFile).size : 0,
      mtime: fs.existsSync(dataFile) ? fs.statSync(dataFile).mtime : null,
    },
    local: {
      path: localFile,
      exists: fs.existsSync(localFile),
      size: fs.existsSync(localFile) ? fs.statSync(localFile).size : 0,
      mtime: fs.existsSync(localFile) ? fs.statSync(localFile).mtime : null,
    },
    process: {
      pid: process.pid,
      cwd: process.cwd(),
    }
  };

  let sample = [];
  try {
    const activePath = stats.docker.exists ? dataFile : localFile;
    if (fs.existsSync(activePath)) {
      const content = fs.readFileSync(activePath, 'utf8');
      const data = JSON.parse(content);
      sample = data.slice(0, 5).map((r: any) => ({ id: r.id, title: r.title }));
      stats.actualCount = data.length;
    }
  } catch (err: any) {
    stats.error = err?.message || 'Unknown error during disk audit';
  }

  return NextResponse.json({
    proof: stats,
    sample
  });
}
