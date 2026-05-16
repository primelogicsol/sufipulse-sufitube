import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const dataFile = '/app/.data/cms-releases.json';
  const localFile = path.join(process.cwd(), '.data', 'cms-releases.json');
  
  const stats = {
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
      sample = data.slice(0, 5).map(r => ({ id: r.id, title: r.title }));
      stats.actualCount = data.length;
    }
  } catch (err) {
    stats.error = err.message;
  }

  return NextResponse.json({
    proof: stats,
    sample
  });
}
