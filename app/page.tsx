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

// We can allow Next.js to revalidate this periodically 
export const revalidate = 900; 

export default async function Home() {
  // 1. Stats
  const rawReleases = cmsServerStorage.getAllReleases({ status: 'published' });
  const writers = entityGetAll('writers');
  const partnerships = entityGetAll('partnerships');

  const kpiStats = {
    releases: Array.isArray(rawReleases) && rawReleases.length > 0 ? rawReleases.length : 91,
    writers: Array.isArray(writers) && writers.length > 0 ? writers.length : literaryArticles.length,
    institutions: Array.isArray(partnerships) && partnerships.length > 0 ? partnerships.length : 4,
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

  return (
    <Layout>
      <HeroSection kpiStats={kpiStats} />
      
      <section aria-label="Discover Kashmiri Sufi music" className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="rounded-2xl border border-emerald-800/30 bg-emerald-950 px-6 py-7 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Full-length listening collection</p>
          <h2 className="mt-2 text-2xl font-semibold">Kashmiri Sufi Music &amp; Kalam</h2>
          <p className="mt-2 max-w-2xl text-emerald-100">Explore original SufiPulse recordings about Kashmir, its spiritual heritage, its landscapes and the inward journey.</p>
          <a href="/kashmir" className="mt-5 inline-block rounded-md bg-amber-200 px-5 py-3 font-semibold text-emerald-950 hover:bg-amber-100">Explore Kashmir songs</a>
        </div>
      </section>

      <FlagshipSpotlight featuredRelease={flagshipRelease} />

      <PremiereRoomHomeSection premieres={premiereReleases} />
      
      <RegistrySection 
        featuredReleases={featuredReleases} 
        recentReleases={recentReleases} 
        loading={false} 
      />

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
