import { MetadataRoute } from 'next';
import { literaryArticles } from './data/literary-articles';
import fs from 'fs';
import path from 'path';
import { getReleaseReadStore } from '@/server/storage/release-read-backend';
import { toCanonicalCMSRelease } from '@/server/storage/release-dto';
import { CANONICAL_ORIGIN, resolveCanonicalSongTitle } from '@/lib/canonical-seo';
import { getEntityRoute } from '@/lib/utils/pluralize';

interface SitemapReleaseRecord {
  slug: string;
  canonicalTitle: string;
  description: string;
  youtubeId?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  publishedAt?: string;
  updatedAt?: string;
}

// Consolidate overlapping entity slugs to a single authoritative canonical URL in sitemap.xml
const KNOWLEDGE_CANONICAL_ATLAS_SLUGS = new Set([
  'amir-khusrau',
  'nusrat-fateh-ali-khan',
  'abida-parveen',
  'rahat-fateh-ali-khan',
  'sabri-brothers',
]);
const CONCEPT_CANONICAL_KNOWLEDGE_SLUGS = new Set(['dhikr']);
const STATIC_BASELINE_DATE = new Date('2026-11-23T00:00:00.000Z');

async function getReleases(): Promise<SitemapReleaseRecord[]> {
  try {
    const store = getReleaseReadStore();
    const result = await store.query({
      status: 'published',
      page: 1,
      pageSize: 1000,
      paginate: false,
      requirePublicEligibility: true,
    });

    return result.items
      .map(toCanonicalCMSRelease)
      .filter((r: any) => r.slug && r.status === 'published' && (r.visibility || 'public') === 'public')
      .map((r: any) => ({
        slug: r.slug,
        canonicalTitle: resolveCanonicalSongTitle(r),
        description:
          String(r.description || '').trim() ||
          `Original full-length Sufi devotional kalam "${resolveCanonicalSongTitle(r)}" by SufiPulse USA.`,
        youtubeId: r.youtubeId && String(r.youtubeId).trim().length === 11 ? String(r.youtubeId).trim() : undefined,
        thumbnailUrl:
          r.canonicalThumbnail ||
          r.thumbnailUrl ||
          (r.youtubeId ? `https://i.ytimg.com/vi/${r.youtubeId}/hqdefault.jpg` : undefined),
        durationSeconds: Number(r.durationSeconds || 0) > 0 ? Math.round(Number(r.durationSeconds)) : undefined,
        publishedAt: r.publishedAt || r.releaseDate || r.createdAt,
        updatedAt: r.updatedAt || r.publishedAt || r.releaseDate || r.createdAt,
      }));
  } catch (error) {
    console.error('[sitemap] Failed to load releases from canonical storage:', error);
    return [];
  }
}

function getRegistryItems(type: 'concepts' | 'themes' | 'regions' | 'moods'): { slug: string; updatedAt?: string }[] {
  try {
    const file = path.join(process.cwd(), '.data', 'registries.json');
    if (!fs.existsSync(file)) return [];
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const list = data[type] || [];
    return list
      .filter((item: any) => item.isActive && item.isPublic && item.slug)
      .map((item: any) => ({ slug: item.slug, updatedAt: item.updatedAt || item.createdAt }));
  } catch {
    return [];
  }
}

function mapKnowledgeTypeToRouteClass(rawType: string): string {
  const t = (rawType || '').toLowerCase();
  if (['saint_poet', 'traditional_poet', 'poet', 'saint', 'scholar'].includes(t)) return 'poets';
  if (['singer'].includes(t)) return 'singers';
  if (['song', 'kalam'].includes(t)) return 'songs';
  if (['album'].includes(t)) return 'albums';
  if (['release'].includes(t)) return 'releases';
  if (['musicaltradition', 'literarytradition', 'order', 'tradition'].includes(t)) return 'traditions';
  return 'concepts';
}

function getKnowledgeItems(): { routeClass: string; slug: string; updatedAt?: string }[] {
  try {
    const file = path.join(process.cwd(), '.data', 'knowledge-registry.json');
    if (!fs.existsSync(file)) return [];
    const list = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(list)) return [];
    return list
      .filter(
        (item: any) =>
          item.slug &&
          item.isActive !== false &&
          item.isPublic !== false &&
          !CONCEPT_CANONICAL_KNOWLEDGE_SLUGS.has(item.slug)
      )
      .map((item: any) => ({
        routeClass: mapKnowledgeTypeToRouteClass(item.class || item.type),
        slug: item.slug,
        updatedAt: item.updatedAt || item.createdAt,
      }));
  } catch {
    return [];
  }
}

function getAtlasDiscoveryEntities(): { route: string; updatedAt?: string }[] {
  try {
    const file = path.join(process.cwd(), '.data', 'atlas_entities.json');
    if (!fs.existsSync(file)) return [];
    const list = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(list)) return [];
    return list
      .filter(
        (e: any) =>
          e.slug &&
          e.entityType &&
          e.status === 'published' &&
          e.isPublic !== false &&
          !KNOWLEDGE_CANONICAL_ATLAS_SLUGS.has(e.slug)
      )
      .map((e: any) => ({
        route: getEntityRoute(e.entityType, e.slug),
        updatedAt: e.updatedAt || e.createdAt,
      }));
  } catch {
    return [];
  }
}

function getAllApprovedArticles(): { slug: string; publishedAt?: string }[] {
  const map = new Map<string, string | undefined>();
  for (const a of literaryArticles) {
    if (a.slug) map.set(a.slug, a.published_at);
  }
  try {
    const file = path.join(process.cwd(), '.data', 'articles.json');
    if (fs.existsSync(file)) {
      const dbArticles: any[] = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const a of dbArticles) {
        if (a.slug && (a.status === 'approved' || a.status === 'published') && !map.has(a.slug)) {
          map.set(a.slug, a.published_at || a.updated_at || a.created_at);
        }
      }
    }
  } catch {}
  return Array.from(map.entries()).map(([slug, publishedAt]) => ({ slug, publishedAt }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = CANONICAL_ORIGIN;
  const releases = await getReleases();
  const latestReleaseModified =
    releases.reduce((latest, r) => {
      const t = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
      return !Number.isNaN(t) && t > latest ? t : latest;
    }, STATIC_BASELINE_DATE.getTime()) || STATIC_BASELINE_DATE.getTime();
  const dynamicHubDate = new Date(latestReleaseModified);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: dynamicHubDate, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/official-identity`, lastModified: dynamicHubDate, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/releases`, lastModified: dynamicHubDate, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/discovery`, lastModified: dynamicHubDate, changeFrequency: 'daily', priority: 0.95 },
    { url: `${baseUrl}/sufitube`, lastModified: dynamicHubDate, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/verification`, lastModified: dynamicHubDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/knowledge`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/literary-journal`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/official-channels`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${baseUrl}/release-premieres`, lastModified: dynamicHubDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about/what-is-sufipulse`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/about/founder`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${baseUrl}/about/zarf-e-noori`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/about/our-network`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about/institutional-partners`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/writers`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${baseUrl}/vocalists`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${baseUrl}/producers`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/studio`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/studio/music-production`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/studio-sessions`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/inside-studio`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/governance`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/governance/mithaq`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/governance/majlis-e-nazr`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${baseUrl}/governance/diwan-e-amanat`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${baseUrl}/governance/production-oversight`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${baseUrl}/contact`, lastModified: STATIC_BASELINE_DATE, changeFrequency: 'yearly', priority: 0.5 },
  ];

  const sanitizeXmlText = (s: string) =>
    s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, 1950);

  // Canonical full-song release URLs ONLY (with native Google Video XML Sitemap metadata)
  const releaseRoutes: MetadataRoute.Sitemap = releases.map((r) => ({
    url: `${baseUrl}/release-detail/${r.slug}`,
    lastModified: r.updatedAt ? new Date(r.updatedAt) : STATIC_BASELINE_DATE,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
    ...(r.youtubeId && r.thumbnailUrl
      ? {
          videos: [
            {
              title: sanitizeXmlText(r.canonicalTitle),
              thumbnail_loc: r.thumbnailUrl,
              description: sanitizeXmlText(r.description),
              player_loc: `https://www.youtube.com/embed/${r.youtubeId}`,
              ...(r.durationSeconds && r.durationSeconds <= 28800 ? { duration: r.durationSeconds } : {}),
              ...(r.publishedAt && !Number.isNaN(new Date(r.publishedAt).getTime())
                ? { publication_date: new Date(r.publishedAt).toISOString() }
                : {}),
              family_friendly: 'yes' as const,
            },
          ],
        }
      : {}),
  }));

  const articleRoutes: MetadataRoute.Sitemap = getAllApprovedArticles().map((article) => ({
    url: `${baseUrl}/literary-journal/${article.slug}`,
    lastModified: article.publishedAt ? new Date(article.publishedAt) : STATIC_BASELINE_DATE,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  const discoveryEntityRoutes: MetadataRoute.Sitemap = getAtlasDiscoveryEntities().map((e) => ({
    url: `${baseUrl}${e.route}`,
    lastModified: e.updatedAt ? new Date(e.updatedAt) : STATIC_BASELINE_DATE,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const conceptRoutes: MetadataRoute.Sitemap = getRegistryItems('concepts').map((item) => ({
    url: `${baseUrl}/concepts/${item.slug}`,
    lastModified: item.updatedAt ? new Date(item.updatedAt) : STATIC_BASELINE_DATE,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const themeRoutes: MetadataRoute.Sitemap = getRegistryItems('themes').map((item) => ({
    url: `${baseUrl}/themes/${item.slug}`,
    lastModified: item.updatedAt ? new Date(item.updatedAt) : STATIC_BASELINE_DATE,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const regionRoutes: MetadataRoute.Sitemap = getRegistryItems('regions').map((item) => ({
    url: `${baseUrl}/regions/${item.slug}`,
    lastModified: item.updatedAt ? new Date(item.updatedAt) : STATIC_BASELINE_DATE,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const moodRoutes: MetadataRoute.Sitemap = getRegistryItems('moods').map((item) => ({
    url: `${baseUrl}/moods/${item.slug}`,
    lastModified: item.updatedAt ? new Date(item.updatedAt) : STATIC_BASELINE_DATE,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  const knowledgeRoutes: MetadataRoute.Sitemap = getKnowledgeItems().map((item) => ({
    url: `${baseUrl}/knowledge/${item.routeClass}/${item.slug}`,
    lastModified: item.updatedAt ? new Date(item.updatedAt) : STATIC_BASELINE_DATE,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Deduplicate by exact URL
  const seen = new Set<string>();
  const all = [
    ...staticRoutes,
    ...releaseRoutes,
    ...discoveryEntityRoutes,
    ...conceptRoutes,
    ...themeRoutes,
    ...regionRoutes,
    ...moodRoutes,
    ...knowledgeRoutes,
    ...articleRoutes,
  ].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });

  return all;
}
