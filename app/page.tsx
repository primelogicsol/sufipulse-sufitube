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

export const metadata: Metadata = {
  title: "SufiPulse USA | Sacred Sufi Music, Poetry & Kalam",
  description: "Discover original Sufi music, mystical poetry and Kashmiri kalam from SufiPulse USA. Watch full-length recordings and explore sacred music, lyrics and cultural heritage.",
  alternates: {
    canonical: "https://sufipulse.com",
  },
};

// We can allow Next.js to revalidate this periodically 
export const revalidate = 900; 

export default async function Home() {
  // 1. Stats
  const rawReleases = cmsServerStorage.getAllReleases({ status: 'published' });
  const writers = entityGetAll('writers');
  const partnerships = entityGetAll('partnerships');

  const verifiedBaseline = {
    impressions: 994300,
    views: 160611,
    watchHours: 10410,
    geographies: 53,
  };
  const reachIndex = globalReachGrowthEngine.getPublicPayload(verifiedBaseline);

  const kpiStats = {
    releases: Array.isArray(rawReleases) && rawReleases.length > 0 ? rawReleases.length : 91,
    writers: Array.isArray(writers) && writers.length > 0 ? writers.length : literaryArticles.length,
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
