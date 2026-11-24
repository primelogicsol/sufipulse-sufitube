import type { Metadata } from 'next';
import { Layout } from './components/layout/Layout';
import { literaryArticles } from './data/literary-articles';
import { getBestReleaseDate, resolveFlagshipRelease, resolvePremiereReleases, resolveRegistryHighlights, resolveRecentRegistryEntries, isPremiereRoomRelease } from '@/lib/release-utils';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { entityGetAll, resolveContributorPublicName } from '@/lib/entity-storage-server';

// Home components
import { HeroSection } from './components/home/HeroSection';
import { GovernanceSection } from './components/home/GovernanceSection';
import { ArchitectureSection } from './components/home/ArchitectureSection';
import { PipelineSection } from './components/home/PipelineSection';
import { RegistrySection } from './components/home/RegistrySection';
import { ArticlesSection } from './components/home/ArticlesSection';
import { NetworkSection } from './components/home/NetworkSection';
import { KnowledgeSection } from './components/home/KnowledgeSection';
import { FlagshipSpotlight } from './components/releases/FlagshipSpotlight';
import { PremiereRoomHomeSection } from './components/home/PremiereRoomHomeSection';
import { HomeMusicDiscoveryStrip } from './components/home/HomeMusicDiscoveryStrip';
import { HomeGlobalReachSection } from './components/home/HomeGlobalReachSection';
import { globalReachGrowthEngine } from '@/lib/global-reach-growth-engine';
import { youtubeAnalyticsService } from '@/lib/youtube-analytics-service';
import { syncYouTubeReachReports } from '@/lib/youtube-reach-reports';

export const metadata: Metadata = {
  title: {
    absolute: "SufiPulse (Sufi Pulse) — Official Website | SufiPulse USA & SufiTube Sacred Music",
  },
  description:
    "SufiPulse.com is the official website of SufiPulse (Sufi Pulse), SufiPulse USA, SufiPulse Studio USA, and SufiTube (Sufi Tube). Explore original full-length Sufi music, sacred kalam, mystical poetry, and verified releases.",
  keywords: [
    "SufiPulse",
    "Sufi Pulse",
    "SufiPulse.com",
    "SufiPulse USA",
    "SufiPulse Studio USA",
    "SufiTube",
    "Sufi Tube",
    "SufiPulse official website",
    "Sufi Pulse music",
  ],
  alternates: {
    canonical: "https://sufipulse.com",
  },
  openGraph: {
    title: "SufiPulse (Sufi Pulse) — Official Website | SufiPulse USA & SufiTube",
    description:
      "Official home of SufiPulse (Sufi Pulse), SufiPulse USA, SufiPulse Studio USA, and SufiTube (Sufi Tube) — original full-length Sufi music, sacred kalam, and mystical poetry.",
    url: "https://sufipulse.com",
    siteName: "SufiPulse",
    images: [
      {
        url: "/banner1.png",
        width: 1672,
        height: 941,
        alt: "SufiPulse Studio — Sacred Music & Recording Sessions",
      },
    ],
  },
};

// Dynamic rendering ensures CMS publish/unpublish/visibility changes reflect immediately on `/`
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  // 1. Strictly published + public CMS releases only
  const rawReleases = cmsServerStorage.getPublicReleases().filter(
    (r) => r.status === 'published' && (r.visibility || 'public') === 'public'
  );
  const writers = entityGetAll('writers');
  const partnerships = entityGetAll('partnerships');

  let verifiedMetrics = {
    impressions: 994300,
    views: 160611,
    watchHours: 10410,
    geographies: 53,
  };
  try {
    const [analytics, reach] = await Promise.all([
      youtubeAnalyticsService.getLifetimeGlobalReachAnalytics(false),
      syncYouTubeReachReports(false),
    ]);
    const liveImpressions =
      reach.verifiedLifetimeImpressions ??
      analytics.lifetimeSnapshot.performance.impressions ??
      994300;
    verifiedMetrics = {
      impressions: liveImpressions || 994300,
      views: analytics.lifetimeSnapshot.performance.views || 160611,
      watchHours: analytics.lifetimeSnapshot.performance.watchTimeHours || 10410,
      geographies: analytics.lifetimeSnapshot.geographies.totalCountries || 53,
    };
  } catch {
    // Preserve verified snapshot fallback if YouTube Analytics service is temporarily unavailable
  }
  const reachIndex = globalReachGrowthEngine.getPublicPayload(verifiedMetrics);

  // Deduplicated active writers across approved Kalam Writers registry, Ahl-e-Tahreer Literary Journal, and published CMS release credits
  const GENERIC_WRITER_CREDITS = new Set([
    'traditional sacred kalam',
    'sufipulse editorial',
    'ahl-e-tahreer archive',
    'unknown',
  ]);
  const activeWriterNames = new Set<string>();
  const addWriterCredit = (raw: unknown) => {
    if (typeof raw !== 'string') return;
    raw
      .split(/[,&/]|feat\.|ft\./i)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && !s.startsWith('writers_') && !GENERIC_WRITER_CREDITS.has(s.toLowerCase()))
      .forEach((s) => activeWriterNames.add(s.toLowerCase()));
  };

  if (Array.isArray(writers)) {
    for (const w of writers as any[]) {
      if (w?.contributor_status === 'REJECTED' || w?.profile_status === 'rejected') continue;
      addWriterCredit(w?.public_name || w?.public_credit || w?.name || w?.full_name);
    }
  }
  for (const article of literaryArticles) {
    addWriterCredit(article.author_name);
  }
  for (const r of rawReleases as any[]) {
    const rawWriter = typeof r?.writer === 'string'
      ? resolveContributorPublicName(r.writer, r.writer)
      : (r?.writer?.public_name || r?.writer?.name || '');
    addWriterCredit(rawWriter);
  }

  const kpiStats = {
    releases: Array.isArray(rawReleases) ? rawReleases.length : 0,
    writers: activeWriterNames.size,
    institutions: Array.isArray(partnerships) && partnerships.length > 0 ? partnerships.length : 4,
    globalReachImpressions: reachIndex.combinedIndex.impressions,
    countriesCount: reachIndex.combinedIndex.geographies,
  };

  const safeRawReleases = Array.isArray(rawReleases) ? rawReleases : [];

  // 2. Data Partitioning
  const rawFlagship = resolveFlagshipRelease(safeRawReleases);
  const rawViews = rawFlagship?.viewCount || rawFlagship?.views || rawFlagship?.youtubeDetails?.viewCount || rawFlagship?.youtube_details?.viewCount || rawFlagship?.statistics?.viewCount;
  const parsedViews = Number(rawViews);
  const finalViewCount = (!isNaN(parsedViews) && parsedViews > 0) ? parsedViews : undefined;

  const flagshipRelease = rawFlagship ? {
    ...rawFlagship,
    writer: resolveContributorPublicName(rawFlagship.writer, rawFlagship.writer),
    vocalist: resolveContributorPublicName(rawFlagship.vocalist, rawFlagship.vocalist),
    viewCount: finalViewCount
  } : null;

  const premiereReleases = resolvePremiereReleases(safeRawReleases);
  const registryHighlights = resolveRegistryHighlights(safeRawReleases, 5);
  const recentRegistryEntries = resolveRecentRegistryEntries(safeRawReleases, 8);

  // 3. Featured Articles
  const featuredArticles = literaryArticles
    .filter(a => a.featured)
    .slice(0, 3)
    .map(a => ({
      ...a,
      author_name: a.author_name || 'Ahl-e-Tahreer Archive'
    }));

  // Map to publication format for the RegistrySection
  const toPublication = (r: any) => {
    const videoId = r.youtubeId || r.youtube_video_id || r.videoId || '';
    return {
      id: r.id || videoId,
      type: 'music' as const,
      title: r.title,
      slug: r.slug || videoId,
      published_at: getBestReleaseDate(r),
      description: r.description,
      artwork_url: r.thumbnail || r.thumbnail_url || r.thumbnailUrl || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ''),
      youtube_video_id: videoId,
    };
  };

  const featuredReleases = registryHighlights.map(toPublication);
  const recentReleases = recentRegistryEntries.map(toPublication);

  const discoveryReleases = safeRawReleases.map((r: any) => ({
    id: r.id,
    slug: r.slug || r.youtubeId || r.id,
    title: r.title,
    canonicalTitle: r.canonicalTitle || r.title,
    youtubeId: r.youtubeId || r.youtube_video_id || r.videoId || '',
    thumbnailUrl: r.thumbnailUrl || r.thumbnail,
    canonicalThumbnail: r.canonicalThumbnail,
    durationFormatted: r.durationFormatted,
    writer: typeof r.writer === 'string' ? resolveContributorPublicName(r.writer, r.writer) : (r.writer?.name || r.writer?.public_name || ''),
    vocalist: typeof r.vocalist === 'string' ? resolveContributorPublicName(r.vocalist, r.vocalist) : (r.vocalist?.name || r.vocalist?.public_name || ''),
    tags: Array.isArray(r.tags) ? r.tags : [],
    themes: Array.isArray(r.themes) ? r.themes : [],
    description: r.description,
  }));

  return (
    <Layout>
      <HeroSection kpiStats={kpiStats} />
      
      <HomeMusicDiscoveryStrip releases={discoveryReleases} />

      <FlagshipSpotlight featuredRelease={flagshipRelease} />

      <PremiereRoomHomeSection premieres={premiereReleases} />
      
      <RegistrySection 
        featuredReleases={featuredReleases} 
        recentReleases={recentReleases} 
        loading={false} 
      />

      <HomeGlobalReachSection reachIndex={reachIndex} />

      <GovernanceSection />
      
      <ArchitectureSection />
      
      <PipelineSection />
      
      <KnowledgeSection />
      
      <ArticlesSection 
        featuredArticles={featuredArticles as any} 
        loading={false} 
      />
      
      <NetworkSection />
    </Layout>
  );
}
