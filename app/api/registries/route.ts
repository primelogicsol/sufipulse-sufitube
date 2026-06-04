import { NextRequest, NextResponse } from 'next/server';
import { registriesStorage } from '@/lib/registries-storage';

export const dynamic = 'force-dynamic';

const cacheHeaders = {
  'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
};

// GET /api/registries
// Public endpoint to fetch all active and public taxonomy items
export async function GET(request: NextRequest) {
  try {
    registriesStorage.forceHydrate();
    const raw = registriesStorage.getRawData();

    const publicData = {
      concepts: (raw.concepts || []).filter(item => item.isActive && item.isPublic),
      themes: (raw.themes || []).filter(item => item.isActive && item.isPublic),
      moods: (raw.moods || []).filter(item => item.isActive && item.isPublic),
      regions: (raw.regions || []).filter(item => item.isActive && item.isPublic),
      languages: (raw.languages || []).filter(item => item.isActive && item.isPublic),
      diasporaMarkets: (raw.diasporaMarkets || []).filter(item => item.isActive && item.isPublic),
      playlists: (raw.playlists || []).filter(item => item.isActive && item.isPublic)
    };

    return NextResponse.json(publicData, { headers: cacheHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
