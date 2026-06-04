import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { registriesStorage } from '@/lib/registries-storage';
import { graphResolver } from '@/lib/graph-resolver';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // 1. Force re-hydration to get fresh disk states
    cmsServerStorage.forceHydrate();
    registriesStorage.forceHydrate();
    graphResolver.forceHydrate();

    // 2. Fetch all raw joins & orphans
    const rawJoins = graphResolver.getRawJoins();
    const orphans = graphResolver.getOrphanReleases();

    // 3. Compile registry performance statistics
    const rawRegistries = registriesStorage.getRawData();
    const performanceScores: Record<string, any> = {};

    // Grouping mapping between registry property names and graph relationshipType
    const relationMapping: Record<string, 'concept' | 'theme' | 'mood' | 'region' | 'language' | 'diasporaMarket' | 'playlist'> = {
      concepts: 'concept',
      themes: 'theme',
      moods: 'mood',
      regions: 'region',
      languages: 'language',
      diasporaMarkets: 'diasporaMarket',
      playlists: 'playlist'
    };

    Object.entries(rawRegistries).forEach(([regType, items]) => {
      const relationshipType = relationMapping[regType];
      if (!relationshipType) return;

      items.forEach((item: any) => {
        const stats = graphResolver.getRegistryPerformanceScore(item.slug, relationshipType);
        performanceScores[item.slug] = {
          ...stats,
          slug: item.slug,
          title: item.title,
          type: regType
        };
      });
    });

    return NextResponse.json({
      joins: rawJoins,
      orphans: orphans.map(r => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        viewCount: r.viewCount,
        durationFormatted: r.durationFormatted,
        status: r.status
      })),
      performance: performanceScores
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/graph
// Used to manually add/remove joins from the Graph Explorer
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { action, releaseId, registryId, relationshipType, confidence } = body;

    if (!action || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "add" or "remove"' }, { status: 400 });
    }

    if (!releaseId || !registryId || !relationshipType) {
      return NextResponse.json({ error: 'Missing parameters: releaseId, registryId, and relationshipType are required.' }, { status: 400 });
    }

    // Load fresh states first
    cmsServerStorage.forceHydrate();
    registriesStorage.forceHydrate();
    graphResolver.forceHydrate();

    if (action === 'add') {
      const result = graphResolver.addJoin(releaseId, registryId, relationshipType, confidence ?? 1.0);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // Keep CMSRelease arrays in sync
      const release = cmsServerStorage.getRelease(releaseId);
      if (release) {
        // Sync arrays based on graphResolver source of truth
        updateReleaseArraysFromJoins(release);
        cmsServerStorage.saveRelease(release);
      }

      return NextResponse.json({ success: true, join: result.join });
    } else {
      const success = graphResolver.removeJoin(releaseId, registryId, relationshipType);
      if (!success) {
        return NextResponse.json({ error: 'Join relationship not found' }, { status: 404 });
      }

      // Keep CMSRelease arrays in sync
      const release = cmsServerStorage.getRelease(releaseId);
      if (release) {
        updateReleaseArraysFromJoins(release);
        cmsServerStorage.saveRelease(release);
      }

      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper to update CMSRelease string arrays based on current joins
function updateReleaseArraysFromJoins(release: any) {
  const releaseId = release.id;
  const joins = graphResolver.getRawJoins().filter(j => j.releaseId === releaseId);

  release.sufiConcepts = joins.filter(j => j.relationshipType === 'concept').map(j => j.registryId);
  release.themes = joins.filter(j => j.relationshipType === 'theme').map(j => j.registryId);
  release.moods = joins.filter(j => j.relationshipType === 'mood').map(j => j.registryId);
  release.targetRegions = joins.filter(j => j.relationshipType === 'region').map(j => j.registryId);
  release.targetLanguages = joins.filter(j => j.relationshipType === 'language').map(j => j.registryId);
  release.targetDiaspora = joins.filter(j => j.relationshipType === 'diasporaMarket').map(j => j.registryId);
  release.relatedPlaylists = joins.filter(j => j.relationshipType === 'playlist').map(j => j.registryId);
}
