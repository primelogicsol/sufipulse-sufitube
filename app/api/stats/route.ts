import { NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { entityGetAll } from '@/lib/entity-storage-server';

export async function GET() {
  try {
    const releases = cmsServerStorage.getAllReleases({ status: 'published' });
    const writers = entityGetAll('writers');
    const partnerships = entityGetAll('partnerships');
    const storageInfo = cmsServerStorage.getInfo();

    return NextResponse.json({
      releases: Array.isArray(releases) ? releases.length : 0,
      writers: Array.isArray(writers) ? writers.length : 0,
      institutions: Array.isArray(partnerships) ? partnerships.length : 0,
      // Persistence guard — active data source observability.
      // Expected in production: dataSource = "disk", isSeedFallback = false.
      // If isSeedFallback = true, persistent storage is missing or was empty.
      dataSource: storageInfo.dataSource,
      isSeedFallback: storageInfo.isSeedFallback,
      hydratedCount: storageInfo.hydratedCount,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
