import { NextResponse, NextRequest } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { privateProductionSourceStorage } from '@/server/storage/private-production-source-storage';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const allSources = privateProductionSourceStorage.listAll();
    const releases = cmsServerStorage.getAllReleases();
    const map = new Map(releases.map((r) => [r.id, r]));

    const items = allSources.map((source) => {
      const release = map.get(source.releaseId);
      const sourceCount = source.sources ? Object.keys(source.sources).length : 1;
      const status = source.rollbackSnapshot ? 'Caption Ready' : source.assembly ? 'Timing Review' : source.sources ? 'Needs Assembly' : 'Needs Source';
      return {
        releaseId: source.releaseId,
        title: release?.title || 'Unknown Release',
        sourceCount,
        status,
        updatedAt: source.updatedAt,
      };
    });

    return NextResponse.json({ queue: items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
