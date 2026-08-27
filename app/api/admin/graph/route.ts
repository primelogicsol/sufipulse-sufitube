import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { registriesStorage } from '@/lib/registries-storage';
import { graphResolver, type GraphJoin } from '@/lib/graph-resolver';

export const dynamic = 'force-dynamic';

type StandardRelationship = 'concept' | 'theme' | 'mood' | 'region' | 'language' | 'diasporaMarket' | 'playlist';

function getStructuralPerformance(
  registryId: string,
  relationshipType: StandardRelationship,
  rawJoins: GraphJoin[]
) {
  const connectedReleases = graphResolver.getReleasesForRegistry(registryId, relationshipType);
  const totalViews = connectedReleases.reduce((sum, release) => sum + (Number(release.viewCount) || 0), 0);
  const connectedReleaseIds = new Set(connectedReleases.map(release => release.id));

  const baseViewsScore = totalViews > 0 ? Math.min(60, Math.log10(totalViews) * 10) : 0;
  const connectivityScore = Math.min(40, connectedReleases.length * 4);
  const discoveryScore = Math.round(baseViewsScore + connectivityScore);

  const connectedCategories = new Set<string>();
  rawJoins.forEach(join => {
    if (join.releaseId && connectedReleaseIds.has(join.releaseId)) {
      if (join.registryId && join.registryId !== registryId) {
        connectedCategories.add(`${join.relationshipType}_${join.registryId}`);
      }
      if (join.targetEntityId && join.targetEntityId !== registryId) {
        connectedCategories.add(`${join.relationshipType}_${join.targetEntityId}`);
      }
      if (join.sourceEntityId && join.sourceEntityId !== registryId) {
        connectedCategories.add(`${join.relationshipType}_${join.sourceEntityId}`);
      }
    }

    if (join.targetEntityId === registryId) {
      const otherId = join.sourceEntityId || join.registryId;
      if (otherId && otherId !== registryId) connectedCategories.add(`${join.relationshipType}_${otherId}`);
    } else if (join.sourceEntityId === registryId) {
      const otherId = join.targetEntityId || join.registryId;
      if (otherId && otherId !== registryId) connectedCategories.add(`${join.relationshipType}_${otherId}`);
    } else if (join.registryId === registryId) {
      const otherId = join.sourceEntityId || join.targetEntityId;
      if (otherId && otherId !== registryId) connectedCategories.add(`${join.relationshipType}_${otherId}`);
    }
  });

  const releaseWeight = Math.min(40, connectedReleases.length * 4);
  const overlapWeight = Math.min(60, connectedCategories.size * 3);
  const authorityScore = Math.round(releaseWeight + overlapWeight);

  return {
    totalReleases: connectedReleases.length,
    totalViews,
    totalWatchTime: '—',
    averageCtr: '—',
    discoveryScore,
    authorityScore,
    unavailableMetrics: ['watchTime', 'ctr'],
    dataProvenance: {
      views: 'youtube_data_api_cached_in_cms',
      graphScores: 'derived_from_measured_views_and_verified_graph_structure',
      watchTime: 'unavailable',
      ctr: 'unavailable',
    },
  };
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Disk-backed hydration repopulates the shared CMS singleton used by graphResolver.
    cmsServerStorage.forceHydrate();
    registriesStorage.forceHydrate();
    graphResolver.forceHydrate();

    const rawJoins = graphResolver.getRawJoins();
    const orphans = graphResolver.getOrphanReleases();
    const rawRegistries = registriesStorage.getRawData();
    const performanceScores: Record<string, any> = {};

    const relationMapping: Record<string, StandardRelationship> = {
      concepts: 'concept',
      themes: 'theme',
      moods: 'mood',
      regions: 'region',
      languages: 'language',
      diasporaMarkets: 'diasporaMarket',
      playlists: 'playlist',
    };

    Object.entries(rawRegistries).forEach(([regType, items]) => {
      const relationshipType = relationMapping[regType];
      if (!relationshipType) return;

      items.forEach((item: any) => {
        performanceScores[item.slug] = {
          ...getStructuralPerformance(item.slug, relationshipType, rawJoins),
          slug: item.slug,
          title: item.title,
          type: regType,
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
        status: r.status,
      })),
      performance: performanceScores,
      dataProvenance: {
        releases: 'hydrated_cms_registry',
        joins: 'persisted_graph_joins',
        views: 'youtube_data_api_cached_in_cms',
        watchTime: 'unavailable',
        ctr: 'unavailable',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    cmsServerStorage.forceHydrate();
    registriesStorage.forceHydrate();
    graphResolver.forceHydrate();

    if (action === 'add') {
      const result = graphResolver.addJoin(releaseId, registryId, relationshipType, confidence ?? 1.0);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      const release = cmsServerStorage.getRelease(releaseId);
      if (release) {
        updateReleaseArraysFromJoins(release);
        cmsServerStorage.saveRelease(release);
      }

      return NextResponse.json({ success: true, join: result.join });
    }

    const success = graphResolver.removeJoin(releaseId, registryId, relationshipType);
    if (!success) {
      return NextResponse.json({ error: 'Join relationship not found' }, { status: 404 });
    }

    const release = cmsServerStorage.getRelease(releaseId);
    if (release) {
      updateReleaseArraysFromJoins(release);
      cmsServerStorage.saveRelease(release);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
