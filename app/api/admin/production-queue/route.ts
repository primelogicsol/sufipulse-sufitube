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
      
      const sourceMap = source.sources || {};
      const sourcesList = Object.values(sourceMap);
      const sourceCount = sourcesList.length;
      
      const primarySource = sourcesList.find(s => s.sourceAssetId === source.sourceAssetId);
      const extensionCount = sourceCount > 0 ? sourceCount - 1 : 0;

      const alignmentStatus = primarySource ? 'Configured' : 'Missing';
      const assemblyStatus = source.assembly ? 'Compiled' : (sourceCount > 1 ? 'Needs Assembly' : 'Bypass (Single Source)');
      const masterTimingStatus = source.rollbackSnapshot ? 'Applied' : 'Pending';
      const captionStatus = source.rollbackSnapshot ? 'Ready' : 'Pending';

      return {
        releaseId: source.releaseId,
        title: release?.title || 'Unknown Release',
        sourceCount,
        primarySourceId: primarySource?.sourceAssetId || 'None',
        extensionCount,
        alignmentStatus,
        assemblyStatus,
        masterTimingStatus,
        captionStatus,
        updatedAt: source.updatedAt,
      };
    });

    return NextResponse.json({ queue: items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
