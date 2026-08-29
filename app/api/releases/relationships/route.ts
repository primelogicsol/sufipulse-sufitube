import { getReleaseStorageBackend, getReleaseReadStore } from '@/server/storage/release-read-backend';
import { NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';

const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
};

export async function GET(request: Request) {
  try {
    const backend = getReleaseStorageBackend();
    
    if (backend === 'postgres') {
      const store = getReleaseReadStore();
      const result = await store.query({ status: 'published', paginate: false });
      const mappings = result.items.map((r: any) => ({
        id: r.id,
        title: r.canonicalTitle || r.title,
        slug: r.slug,
      }));
      return NextResponse.json(mappings, { headers: cacheHeaders });
    }

    const releases = cmsServerStorage.getAllReleases({ status: 'published' });
    const mappings = releases.map(r => ({
      id: r.id,
      title: (r as any).canonicalTitle || r.title,
      slug: r.slug,
    }));
    return NextResponse.json(mappings, { headers: cacheHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
