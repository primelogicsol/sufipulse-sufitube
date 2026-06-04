import { discoveryAnalytics } from '../lib/discovery-analytics';
import { graphResolver } from '../lib/graph-resolver';
import { registriesStorage } from '../lib/registries-storage';
import { cmsStorage } from '../lib/cms-storage';

async function testOptimizationEngine() {
  console.log('--- TESTING DISCOVERY OPTIMIZATION ENGINE ---');

  // Hydrate data
  discoveryAnalytics.init();
  registriesStorage.init();
  graphResolver.init();

  // 1. Grouped metrics helper
  const getGroupedMetrics = (type: 'concept' | 'theme' | 'region' | 'release' | 'playlist') => {
    const tallies = discoveryAnalytics.getTalliesForType(type);
    const groups: Record<string, { 
      slug: string; 
      video_clicks: number; 
      playlist_clicks: number; 
      subscribe_clicks: number; 
      page_views: number;
      total: number;
      conversion_rate: number;
    }> = {};

    tallies.forEach(t => {
      if (!groups[t.sourceSlug]) {
        groups[t.sourceSlug] = {
          slug: t.sourceSlug,
          video_clicks: 0,
          playlist_clicks: 0,
          subscribe_clicks: 0,
          page_views: 0,
          total: 0,
          conversion_rate: 0
        };
      }

      if (t.actionType === 'video_click') {
        groups[t.sourceSlug].video_clicks += t.count;
        groups[t.sourceSlug].total += t.count;
      } else if (t.actionType === 'playlist_click') {
        groups[t.sourceSlug].playlist_clicks += t.count;
        groups[t.sourceSlug].total += t.count;
      } else if (t.actionType === 'subscribe_click') {
        groups[t.sourceSlug].subscribe_clicks += t.count;
        groups[t.sourceSlug].total += t.count;
      } else if (t.actionType === 'page_view') {
        groups[t.sourceSlug].page_views += t.count;
      }
    });

    Object.values(groups).forEach(g => {
      if (g.page_views > 0) {
        g.conversion_rate = parseFloat(((g.total / g.page_views) * 100).toFixed(1));
      } else {
        g.conversion_rate = 0;
      }
    });

    return Object.values(groups).sort((a, b) => b.total - a.total);
  };

  const concepts = getGroupedMetrics('concept');
  const themes = getGroupedMetrics('theme');
  const regions = getGroupedMetrics('region');
  const releases = getGroupedMetrics('release');
  const playlists = getGroupedMetrics('playlist');

  console.log('\n✔ Successfully grouped metrics and calculated conversion rates.');

  // 2. Winners
  const winners = {
    concepts: concepts.slice(0, 2),
    themes: themes.slice(0, 2),
    regions: regions.slice(0, 2),
    playlists: playlists.slice(0, 2),
    releases: releases.slice(0, 2)
  };

  console.log('\n=== WINNERS (Top Performers) ===');
  console.log('Concepts:', winners.concepts.map(c => `${c.slug}: ${c.total} clicks, ${c.conversion_rate}% CR`));
  console.log('Regions:', winners.regions.map(r => `${r.slug}: ${r.total} clicks, ${r.conversion_rate}% CR`));

  // 3. Losers
  const losers = {
    no_clicks: [
      ...concepts.filter(x => x.page_views >= 50 && x.total === 0).map(x => ({ ...x, type: 'concept' })),
      ...themes.filter(x => x.page_views >= 50 && x.total === 0).map(x => ({ ...x, type: 'theme' })),
      ...regions.filter(x => x.page_views >= 50 && x.total === 0).map(x => ({ ...x, type: 'region' }))
    ],
    low_conversion: [
      ...concepts.filter(x => x.page_views >= 50 && x.total > 0 && x.conversion_rate < 10).map(x => ({ ...x, type: 'concept' })),
      ...regions.filter(x => x.page_views >= 50 && x.total > 0 && x.conversion_rate < 10).map(x => ({ ...x, type: 'region' }))
    ],
    no_continuation: [
      ...concepts.filter(x => x.video_clicks > 15 && x.playlist_clicks === 0).map(x => ({ ...x, type: 'concept' }))
    ]
  };

  console.log('\n=== LOSERS (Underperforming Pathways) ===');
  console.log('No Clicks:', losers.no_clicks.map(l => `${l.type}/${l.slug}: ${l.page_views} page views, 0 clicks`));
  console.log('Low Conversion:', losers.low_conversion.map(l => `${l.type}/${l.slug}: ${l.conversion_rate}% CR (${l.total}/${l.page_views} views)`));
  console.log('No Playlist Continuation:', losers.no_continuation.map(l => `${l.type}/${l.slug}: ${l.video_clicks} video clicks, 0 playlist clicks`));

  // 4. Dynamic Recommendations
  const recommendations: any[] = [];
  
  // Rule A: Detect Orphans
  const orphans = graphResolver.getOrphanReleases() || [];
  orphans.forEach(o => {
    recommendations.push({
      type: 'orphan',
      priority: 'high',
      title: `Orphan Release: ${o.title}`,
      message: `This release has no concept/region/playlist connections. Link it to drive discovery.`
    });
  });

  // Rule B: Density Gaps
  const activeConcepts = registriesStorage.getItems('concepts').filter(c => c.isActive && c.isPublic);
  activeConcepts.forEach(c => {
    const conn = graphResolver.getReleasesForRegistry(c.slug, 'concept') || [];
    const telemetry = concepts.find(x => x.slug === c.slug);
    const pageViews = telemetry ? telemetry.page_views : 0;

    if (conn.length === 0) {
      recommendations.push({
        type: 'density',
        priority: 'high',
        title: `Empty Concept: ${c.title}`,
        message: `Concept "${c.title}" has 0 connected releases. Link at least one release.`
      });
    } else if (conn.length < 2 && pageViews > 100) {
      recommendations.push({
        type: 'density',
        priority: 'medium',
        title: `Low Density Concept: ${c.title}`,
        message: `"${c.title}" has high traffic (${pageViews} views) but only 1 release connected.`
      });
    }
  });

  // Rule C: Regional Localizations
  regions.forEach(r => {
    if (r.page_views > 100 && r.conversion_rate < 8) {
      recommendations.push({
        type: 'localization',
        priority: 'medium',
        title: `Region Localization: ${r.slug}`,
        message: `Region "${r.slug}" has low click conversion (${r.conversion_rate}%). Localize subtitles.`
      });
    }
  });

  // Rule D: Subscriber Catalyst
  releases.forEach(rel => {
    if (rel.video_clicks > 100 && rel.subscribe_clicks < 5) {
      recommendations.push({
        type: 'subscribe',
        priority: 'medium',
        title: `Subscriber Catalyst: ${rel.slug}`,
        message: `Release "${rel.slug}" drives views but has low subscriber conversion.`
      });
    }
  });

  // Rule E: Playlist Continuation Gaps
  playlists.forEach(pl => {
    if (pl.page_views > 100 && pl.playlist_clicks === 0) {
      recommendations.push({
        type: 'playlist',
        priority: 'high',
        title: `Playlist Gap: ${pl.slug}`,
        message: `Playlist "${pl.slug}" is visited but receives 0 clicks. Check playlist validity.`
      });
    }
  });

  console.log('\n=== DYNAMIC GRAPH RECOMMENDATIONS ===');
  recommendations.forEach((rec, idx) => {
    console.log(`[${rec.priority.toUpperCase()}] ${rec.title}: ${rec.message}`);
  });
}

testOptimizationEngine().catch(console.error);
