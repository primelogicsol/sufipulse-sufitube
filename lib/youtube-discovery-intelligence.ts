/**
 * lib/youtube-discovery-intelligence.ts
 *
 * Verified Live YouTube Search & Organic Discovery Intelligence for SufiPulse USA.
 * Combines:
 *   1. YouTube Data API v3 (live channel subscriberCount, videoCount, public viewCount)
 *   2. YouTube Analytics API v2 (live traffic sources, YT_SEARCH views & watch minutes,
 *      insightTrafficSourceDetail search terms, video-level search discovery, 28d vs prior 28d)
 *   3. First-Party YouTube Studio CSV & Geography snapshots (impressions, CTR, 52 territories)
 *
 * STRICT PROVENANCE INVARIANT:
 * - Zero PRNG growth modeling or fabricated numbers.
 * - Caches upstream Google API responses for 5 minutes to protect quota while supporting forceRefresh.
 */

import { getChannelStatistics, queryYouTubeAnalytics } from './youtube-analytics-client';
import { getYouTubeStudioSnapshot, getYouTubeStudioLifetimeFunnel } from './youtube-studio-import';
import { getYouTubeGeographySnapshot } from './youtube-geography-import';
import { cmsServerStorage } from './cms-storage-server';
import { resolveCanonicalSongTitle } from './canonical-seo';

export type SearchTermCategory = 'non_branded_sufi' | 'branded_sufipulse' | 'off_topic_legacy';

export interface YouTubeSearchTermRow {
  term: string;
  views: number;
  watchMinutes: number;
  category: SearchTermCategory;
}

export interface YouTubeTrafficRow {
  sourceRaw: string;
  label: string;
  views: number;
  watchHours: number;
  sharePercent: number;
}

export interface YouTubeSearchVideoRow {
  youtubeId: string;
  slug: string | null;
  canonicalTitle: string;
  searchViews: number;
  searchWatchMinutes: number;
  avgSearchViewDurationSeconds: number;
  totalViews: number | null;
  studioImpressions: number | null;
  studioCtr: number | null;
}

export interface YouTubeDiscoverySnapshot {
  fetchedAt: string;
  liveApiConnected: boolean;
  errorMessage: string | null;
  channelIdentity: {
    channelId: string;
    name: string;
    url: string;
    totalVideos: number | null;
    subscribers: number | null;
    publicCounterViews: number | null;
    source: 'youtube_data_api_v3' | 'unavailable';
  };
  lifetime: {
    views: number | null;
    watchHours: number | null;
    avgViewDurationSeconds: number | null;
    avgViewPercentage: number | null;
    subscribersGained: number | null;
    subscribersLost: number | null;
    ytSearchViews: number | null;
    ytSearchSharePercent: number | null;
    externalViews: number | null;
    studioImpressions: number | null;
    studioCtr: number | null;
    studioPeriod: string | null;
    trafficSources: YouTubeTrafficRow[];
  };
  recent28d: {
    startDate: string | null;
    endDate: string | null;
    totalViews: number | null;
    ytSearchViews: number | null;
    ytSearchWatchMinutes: number | null;
    ytSearchSharePercent: number | null;
    externalViews: number | null;
    playlistViews: number | null;
    previous28dTotalViews: number | null;
    previous28dYtSearchViews: number | null;
    ytSearchGrowthPercent: number | null;
    trafficSources: YouTubeTrafficRow[];
    searchTerms: YouTubeSearchTermRow[];
  };
  lifetimeSearchTerms: {
    rows: YouTubeSearchTermRow[];
    brandedViews: number;
    nonBrandedSufiViews: number;
    offTopicLegacyViews: number;
  };
  topSearchVideos: YouTubeSearchVideoRow[];
  geography: {
    source: string;
    period: string | null;
    territoriesTotal: number;
    territoriesMeasurable: number;
    topByViews: Array<{
      rank: number;
      countryCode: string;
      countryName: string;
      views: number;
      watchTimeHours: number;
      avgViewDurationSeconds: number;
    }>;
    topByWatchHours: Array<{
      rank: number;
      countryCode: string;
      countryName: string;
      views: number;
      watchTimeHours: number;
      avgViewDurationSeconds: number;
    }>;
    topByAvgDuration: Array<{
      rank: number;
      countryCode: string;
      countryName: string;
      views: number;
      watchTimeHours: number;
      avgViewDurationSeconds: number;
    }>;
  };
}

const TRAFFIC_LABELS: Record<string, string> = {
  YT_SEARCH: 'YouTube Search',
  SUBSCRIBER: 'Browse / Subscriber Feed',
  RELATED_VIDEO: 'Suggested Videos',
  EXT_URL: 'External Websites & Apps',
  YT_CHANNEL: 'Channel Pages',
  YT_OTHER_PAGE: 'Other YouTube Features',
  PLAYLIST: 'Playlists',
  NO_LINK_OTHER: 'Direct or Unknown',
  ADVERTISING: 'YouTube Advertising (Historical)',
  SHORTS: 'YouTube Shorts Feed',
  NOTIFICATION: 'Notifications',
  END_SCREEN: 'End Screens',
  SHORTS_CONTENT_LINKS: 'Shorts Content Links',
  ANNOTATION: 'Annotations / Cards',
};

const SUFI_KEYWORDS = [
  'sufi', 'kalam', 'qawwali', 'khwaja', 'allah', 'maula', 'ali', 'ya ', 'ishq', 'fana',
  'baqa', 'zikr', 'dhikr', 'sabr', 'tawakkul', 'kashmir', 'kashmiri', 'urdu', 'naat',
  'hamd', 'manqabat', 'bulleh', 'bulla', 'rumi', 'khusrau', 'nund', 'lal ded', 'chishti',
  'qalandar', 'mast', 'darvesh', 'faqir', 'murshid', 'spiritual', 'mystic', 'ghazal',
  'zaat', 'zarra', 'benishan', 'parwardigar', 'rehmat', 'madina', 'dua', 'rooh', 'dil',
];

const BRANDED_KEYWORDS = ['sufipulse', 'sufi pulse', 'sufitube', 'zarf-e-noori', 'zarf e noori'];

const OFF_TOPIC_PATTERNS = [
  'parineeta', 'porinita', 'parineeti', 'পরিণীতা', 'পরিনীতা',
  'tum se tum tak', 'tumse tum tak', 'episode', 'serial', 'natok', 'a20 lite',
];

export function classifyYouTubeSearchTerm(term: string): SearchTermCategory {
  const lower = term.trim().toLowerCase();
  if (BRANDED_KEYWORDS.some((b) => lower.includes(b))) {
    return 'branded_sufipulse';
  }
  if (OFF_TOPIC_PATTERNS.some((p) => lower.includes(p))) {
    return 'off_topic_legacy';
  }
  if (SUFI_KEYWORDS.some((s) => lower.includes(s))) {
    return 'non_branded_sufi';
  }
  return 'off_topic_legacy';
}

function mapTrafficRows(rows: unknown[][] | undefined): YouTubeTrafficRow[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const total = rows.reduce((s, r) => s + (Number(r[1]) || 0), 0) || 1;
  return rows.map((r) => {
    const raw = String(r[0] || '');
    const views = Number(r[1]) || 0;
    const mins = Number(r[2]) || 0;
    return {
      sourceRaw: raw,
      label: TRAFFIC_LABELS[raw] || raw,
      views,
      watchHours: Number((mins / 60).toFixed(1)),
      sharePercent: Number(((views / total) * 100).toFixed(2)),
    };
  });
}

let cachedSnapshot: { expiresAt: number; data: YouTubeDiscoverySnapshot } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getYouTubeDiscoveryIntelligence(forceRefresh = false): Promise<YouTubeDiscoverySnapshot> {
  if (!forceRefresh && cachedSnapshot && Date.now() < cachedSnapshot.expiresAt) {
    return cachedSnapshot.data;
  }

  const fetchedAt = new Date().toISOString();
  const studio = getYouTubeStudioSnapshot();
  const lifetimeFunnel = getYouTubeStudioLifetimeFunnel();
  const geoSnapshot = getYouTubeGeographySnapshot();
  const studioByVideoId = new Map((studio?.rows ?? []).map((r) => [r.videoId, r]));

  const releases = cmsServerStorage.getAllReleases();
  const releaseByYoutubeId = new Map(
    releases.filter((r) => r.youtubeId).map((r) => [String(r.youtubeId), r])
  );

  const geoRows = (geoSnapshot?.countries ?? []).filter((r) => r.sampleClass !== 'zero_suppressed' && r.views > 0);
  const geographyBlock: YouTubeDiscoverySnapshot['geography'] = {
    source: geoSnapshot ? 'Verified YouTube Studio Geography CSV Export' : 'UNAVAILABLE',
    period: geoSnapshot?.reportingPeriodLabel ?? null,
    territoriesTotal: geoSnapshot?.counts?.listedCountryRows ?? 0,
    territoriesMeasurable: geoSnapshot?.counts?.measurableCountries ?? geoRows.length,
    topByViews: [...geoRows]
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
      .map((r, i) => ({
        rank: i + 1,
        countryCode: r.isoCode,
        countryName: r.countryName,
        views: r.views,
        watchTimeHours: r.watchTimeHours,
        avgViewDurationSeconds: r.avgViewDurationSecs ?? 0,
      })),
    topByWatchHours: [...geoRows]
      .sort((a, b) => b.watchTimeHours - a.watchTimeHours)
      .slice(0, 10)
      .map((r, i) => ({
        rank: i + 1,
        countryCode: r.isoCode,
        countryName: r.countryName,
        views: r.views,
        watchTimeHours: r.watchTimeHours,
        avgViewDurationSeconds: r.avgViewDurationSecs ?? 0,
      })),
    topByAvgDuration: [...geoRows]
      .filter((r) => r.views >= 100)
      .sort((a, b) => (b.avgViewDurationSecs ?? 0) - (a.avgViewDurationSecs ?? 0))
      .slice(0, 10)
      .map((r, i) => ({
        rank: i + 1,
        countryCode: r.isoCode,
        countryName: r.countryName,
        views: r.views,
        watchTimeHours: r.watchTimeHours,
        avgViewDurationSeconds: r.avgViewDurationSecs ?? 0,
      })),
  };

  try {
    const [channelStats, lifetimeBasic, lifetimeTrafficRaw, dailyRaw, lifetimeTermsRaw, videoSearchRaw] =
      await Promise.all([
        getChannelStatistics().catch(() => ({ subscriberCount: null, videoCount: null, viewCount: null })),
        queryYouTubeAnalytics({
          metrics:
            'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost',
        }),
        queryYouTubeAnalytics({
          dimensions: 'insightTrafficSourceType',
          metrics: 'views,estimatedMinutesWatched',
          sort: '-views',
          maxResults: '25',
        }),
        queryYouTubeAnalytics({
          dimensions: 'day',
          metrics: 'views',
          sort: '-day',
          maxResults: '10',
        }).catch(() => ({ rows: [] })),
        queryYouTubeAnalytics({
          dimensions: 'insightTrafficSourceDetail',
          filters: 'insightTrafficSourceType==YT_SEARCH',
          metrics: 'views,estimatedMinutesWatched',
          sort: '-views',
          maxResults: '25',
        }).catch(() => ({ rows: [] })),
        queryYouTubeAnalytics({
          dimensions: 'video',
          filters: 'insightTrafficSourceType==YT_SEARCH',
          metrics: 'views,estimatedMinutesWatched,averageViewDuration',
          sort: '-views',
          maxResults: '25',
        }).catch(() => ({ rows: [] })),
      ]);

    const lb = lifetimeBasic.rows?.[0] || [];
    const lifetimeViews = Number(lb[0] || 0);
    const lifetimeMinutes = Number(lb[1] || 0);
    const lifetimeTraffic = mapTrafficRows(lifetimeTrafficRaw.rows);
    const lifetimeSearchRow = lifetimeTraffic.find((t) => t.sourceRaw === 'YT_SEARCH');
    const lifetimeExternalRow = lifetimeTraffic.find((t) => t.sourceRaw === 'EXT_URL');

    // Anchor 28d window to latest reported day in YouTube Analytics
    const latestDayStr =
      dailyRaw.rows && dailyRaw.rows.length > 0
        ? String(dailyRaw.rows[0][0])
        : new Date(Date.now() - 2 * 86400 * 1000).toISOString().split('T')[0];
    const latestDate = new Date(`${latestDayStr}T00:00:00Z`);
    const start28Str = new Date(latestDate.getTime() - 27 * 86400 * 1000).toISOString().split('T')[0];
    const prevEndStr = new Date(latestDate.getTime() - 28 * 86400 * 1000).toISOString().split('T')[0];
    const prevStartStr = new Date(latestDate.getTime() - 55 * 86400 * 1000).toISOString().split('T')[0];

    const [recent28TrafficRaw, prev28TrafficRaw, recent28TermsRaw] = await Promise.all([
      queryYouTubeAnalytics({
        startDate: start28Str,
        endDate: latestDayStr,
        dimensions: 'insightTrafficSourceType',
        metrics: 'views,estimatedMinutesWatched',
        sort: '-views',
        maxResults: '25',
      }).catch(() => ({ rows: [] })),
      queryYouTubeAnalytics({
        startDate: prevStartStr,
        endDate: prevEndStr,
        dimensions: 'insightTrafficSourceType',
        metrics: 'views,estimatedMinutesWatched',
        sort: '-views',
        maxResults: '25',
      }).catch(() => ({ rows: [] })),
      queryYouTubeAnalytics({
        startDate: start28Str,
        endDate: latestDayStr,
        dimensions: 'insightTrafficSourceDetail',
        filters: 'insightTrafficSourceType==YT_SEARCH',
        metrics: 'views,estimatedMinutesWatched',
        sort: '-views',
        maxResults: '25',
      }).catch(() => ({ rows: [] })),
    ]);

    const recent28Traffic = mapTrafficRows(recent28TrafficRaw.rows);
    const prev28Traffic = mapTrafficRows(prev28TrafficRaw.rows);

    const recent28Total = recent28Traffic.reduce((s, r) => s + r.views, 0);
    const prev28Total = prev28Traffic.reduce((s, r) => s + r.views, 0);
    const recent28Search = recent28Traffic.find((t) => t.sourceRaw === 'YT_SEARCH');
    const prev28Search = prev28Traffic.find((t) => t.sourceRaw === 'YT_SEARCH');
    const recent28External = recent28Traffic.find((t) => t.sourceRaw === 'EXT_URL');
    const recent28Playlist = recent28Traffic.find((t) => t.sourceRaw === 'PLAYLIST');

    const recent28YtSearchViews = recent28Search?.views ?? 0;
    const prev28YtSearchViews = prev28Search?.views ?? 0;
    const ytSearchGrowthPercent =
      prev28YtSearchViews > 0
        ? Number((((recent28YtSearchViews - prev28YtSearchViews) / prev28YtSearchViews) * 100).toFixed(1))
        : null;

    const mapTerms = (rows: unknown[][] | undefined): YouTubeSearchTermRow[] =>
      (rows || []).map((r) => {
        const term = String(r[0] || '');
        return {
          term,
          views: Number(r[1] || 0),
          watchMinutes: Number(r[2] || 0),
          category: classifyYouTubeSearchTerm(term),
        };
      });

    const recent28Terms = mapTerms(recent28TermsRaw.rows);
    const lifetimeTerms = mapTerms(lifetimeTermsRaw.rows);

    const topSearchVideos: YouTubeSearchVideoRow[] = (videoSearchRaw.rows || []).map((r) => {
      const youtubeId = String(r[0] || '');
      const cms = releaseByYoutubeId.get(youtubeId);
      const st = studioByVideoId.get(youtubeId);
      return {
        youtubeId,
        slug: cms && cms.status === 'published' && (cms.visibility || 'public') === 'public' ? cms.slug : null,
        canonicalTitle: cms ? resolveCanonicalSongTitle(cms) : st?.title || youtubeId,
        searchViews: Number(r[1] || 0),
        searchWatchMinutes: Number(r[2] || 0),
        avgSearchViewDurationSeconds: Math.round(Number(r[3] || 0)),
        totalViews: cms?.viewCount ?? st?.views ?? null,
        studioImpressions: st?.impressions ?? null,
        studioCtr: st?.ctr ?? null,
      };
    });

    const snapshot: YouTubeDiscoverySnapshot = {
      fetchedAt,
      liveApiConnected: true,
      errorMessage: null,
      channelIdentity: {
        channelId: 'UCraDr3i5A3k0j7typ6tOOsQ',
        name: 'SufiPulse USA',
        url: 'https://www.youtube.com/channel/UCraDr3i5A3k0j7typ6tOOsQ',
        totalVideos: channelStats.videoCount,
        subscribers: channelStats.subscriberCount,
        publicCounterViews: channelStats.viewCount,
        source: channelStats.videoCount !== null ? 'youtube_data_api_v3' : 'unavailable',
      },
      lifetime: {
        views: lifetimeViews,
        watchHours: Number((lifetimeMinutes / 60).toFixed(1)),
        avgViewDurationSeconds: Math.round(Number(lb[2] || 0)),
        avgViewPercentage: Number(Number(lb[3] || 0).toFixed(2)),
        subscribersGained: Number(lb[4] || 0),
        subscribersLost: Number(lb[5] || 0),
        ytSearchViews: lifetimeSearchRow?.views ?? 0,
        ytSearchSharePercent: lifetimeSearchRow?.sharePercent ?? 0,
        externalViews: lifetimeExternalRow?.views ?? 0,
        studioImpressions: lifetimeFunnel?.impressions ?? null,
        studioCtr: lifetimeFunnel?.ctr ?? null,
        studioPeriod: lifetimeFunnel?.period ?? null,
        trafficSources: lifetimeTraffic,
      },
      recent28d: {
        startDate: start28Str,
        endDate: latestDayStr,
        totalViews: recent28Total,
        ytSearchViews: recent28YtSearchViews,
        ytSearchWatchMinutes: Math.round((recent28Search?.watchHours ?? 0) * 60),
        ytSearchSharePercent: recent28Search?.sharePercent ?? 0,
        externalViews: recent28External?.views ?? 0,
        playlistViews: recent28Playlist?.views ?? 0,
        previous28dTotalViews: prev28Total,
        previous28dYtSearchViews: prev28YtSearchViews,
        ytSearchGrowthPercent,
        trafficSources: recent28Traffic,
        searchTerms: recent28Terms,
      },
      lifetimeSearchTerms: {
        rows: lifetimeTerms,
        brandedViews: lifetimeTerms
          .filter((t) => t.category === 'branded_sufipulse')
          .reduce((s, t) => s + t.views, 0),
        nonBrandedSufiViews: lifetimeTerms
          .filter((t) => t.category === 'non_branded_sufi')
          .reduce((s, t) => s + t.views, 0),
        offTopicLegacyViews: lifetimeTerms
          .filter((t) => t.category === 'off_topic_legacy')
          .reduce((s, t) => s + t.views, 0),
      },
      topSearchVideos,
      geography: geographyBlock,
    };

    cachedSnapshot = { expiresAt: Date.now() + CACHE_TTL_MS, data: snapshot };
    return snapshot;
  } catch (err: any) {
    const channelStats = await getChannelStatistics().catch(() => ({
      subscriberCount: null,
      videoCount: null,
      viewCount: null,
    }));

    return {
      fetchedAt,
      liveApiConnected: false,
      errorMessage: err?.message || 'YouTube Analytics API unavailable.',
      channelIdentity: {
        channelId: 'UCraDr3i5A3k0j7typ6tOOsQ',
        name: 'SufiPulse USA',
        url: 'https://www.youtube.com/channel/UCraDr3i5A3k0j7typ6tOOsQ',
        totalVideos: channelStats.videoCount,
        subscribers: channelStats.subscriberCount,
        publicCounterViews: channelStats.viewCount,
        source: channelStats.videoCount !== null ? 'youtube_data_api_v3' : 'unavailable',
      },
      lifetime: {
        views: null,
        watchHours: lifetimeFunnel?.watchTimeHours ?? null,
        avgViewDurationSeconds: null,
        avgViewPercentage: null,
        subscribersGained: null,
        subscribersLost: null,
        ytSearchViews: null,
        ytSearchSharePercent: null,
        externalViews: null,
        studioImpressions: lifetimeFunnel?.impressions ?? null,
        studioCtr: lifetimeFunnel?.ctr ?? null,
        studioPeriod: lifetimeFunnel?.period ?? null,
        trafficSources: [],
      },
      recent28d: {
        startDate: null,
        endDate: null,
        totalViews: null,
        ytSearchViews: null,
        ytSearchWatchMinutes: null,
        ytSearchSharePercent: null,
        externalViews: null,
        playlistViews: null,
        previous28dTotalViews: null,
        previous28dYtSearchViews: null,
        ytSearchGrowthPercent: null,
        trafficSources: [],
        searchTerms: [],
      },
      lifetimeSearchTerms: {
        rows: [],
        brandedViews: 0,
        nonBrandedSufiViews: 0,
        offTopicLegacyViews: 0,
      },
      topSearchVideos: [],
      geography: geographyBlock,
    };
  }
}
