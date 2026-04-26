import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';

export const dynamic = 'force-dynamic';

const BACKUP_DIR = path.join(process.cwd(), '.data', 'backups');

const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

// GET /api/backup - List backups
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.json'));
    const backups = files.map((file) => {
      const stats = fs.statSync(path.join(BACKUP_DIR, file));
      return {
        filename: file,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(1),
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString(),
      };
    });

    return NextResponse.json({ backups });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/backup - Create backup
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    ensureBackupDir();

    const body = await request.json().catch(() => ({}));
    const label = body.label || 'manual';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}-${label}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    const releases = cmsServerStorage.getAllReleases();

    fs.writeFileSync(filepath, JSON.stringify({
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      label,
      releaseCount: releases.length,
      data: releases,
    }, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      filename,
      releaseCount: releases.length,
      sizeKB: (fs.statSync(filepath).size / 1024).toFixed(1),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/backup - Delete a backup file
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename || !filename.match(/^backup-[\w-]+\.json$/)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    fs.unlinkSync(filepath);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
