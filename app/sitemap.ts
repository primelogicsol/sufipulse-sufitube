import { MetadataRoute } from 'next';
import { literaryArticles } from './data/literary-articles';
import fs from 'fs';
import path from 'path';

function getReleases(): { slug: string; updatedAt?: string }[] {
  try {
    const file = path.join(process.cwd(), '.data', 'cms-releases.json');
    if (!fs.existsSync(file)) return [];
    const releases = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(releases)) return [];
    return releases
      .filter((r: any) => r.slug && r.contentReadinessState !== 'draft')
      .map((r: any) => ({ slug: r.slug, updatedAt: r.updatedAt || r.createdAt }));
  } catch {
    return [];
  }
}

function getRegistryItems(type: 'concepts' | 'themes' | 'regions' | 'moods'): { slug: string; updatedAt?: string }[] {
  try {
    const file = path.join(process.cwd(), '.data', 'registries.json');
    if (!fs.existsSync(file)) return [];
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const items = data[type];
    if (!Array.isArray(items)) return [];
    return items
      .filter((item: any) => item.slug && item.isActive && item.isPublic)
      .map((item: any) => ({ slug: item.slug, updatedAt: item.updatedAt || item.createdAt }));
  } catch {
    return [];
  }
}

function getKnowledgeEntities(): { class: string; slug: string; updatedAt?: string }[] {
  try {
    const file = path.join(process.cwd(), '.data', 'unified_knowledge.json');
    if (!fs.existsSync(file)) return [];
    const entities = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(entities)) return [];
    return entities
      .filter((e: any) => e.slug && e.class)
      .map((e: any) => ({
        class: e.class,
        slug: e.slug,
        updatedAt: e.metadata?.lastVerified || e.createdAt,
      }));
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';
  const now = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl,                                    lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/knowledge`,                     lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${baseUrl}/releases`,                      lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${baseUrl}/literary-journal`,              lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/about/what-is-sufipulse`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/writers`,                       lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/vocalists`,                     lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/producers`,                     lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/studio`,                        lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about/founder`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/governance`,                    lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/governance/royalty-transparency`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/governance/production-oversight`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/royalty-policy`,                lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contributor-policy`,            lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contact`,                       lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${baseUrl}/verification`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/official-channels`,             lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const knowledgeRoutes: MetadataRoute.Sitemap = getKnowledgeEntities().map((e) => ({
    url: `${baseUrl}/knowledge/${e.class}/${e.slug}`,
    lastModified: e.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  const releaseRoutes: MetadataRoute.Sitemap = getReleases().map((r) => ({
    url: `${baseUrl}/release-detail/${r.slug}`,
    lastModified: r.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  const articleRoutes: MetadataRoute.Sitemap = literaryArticles.map((a) => ({
    url: `${baseUrl}/literary-journal/${a.slug}`,
    lastModified: a.published_at || now,
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  const conceptRoutes: MetadataRoute.Sitemap = getRegistryItems('concepts').map((c) => ({
    url: `${baseUrl}/concepts/${c.slug}`,
    lastModified: c.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const themeRoutes: MetadataRoute.Sitemap = getRegistryItems('themes').map((t) => ({
    url: `${baseUrl}/themes/${t.slug}`,
    lastModified: t.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const moodRoutes: MetadataRoute.Sitemap = getRegistryItems('moods').map((m) => ({
    url: `${baseUrl}/moods/${m.slug}`,
    lastModified: m.updatedAt || now,
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  const regionRoutes: MetadataRoute.Sitemap = getRegistryItems('regions').map((reg) => ({
    url: `${baseUrl}/regions/${reg.slug}`,
    lastModified: reg.updatedAt || now,
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  return [
    ...staticRoutes, 
    ...knowledgeRoutes,
    ...releaseRoutes, 
    ...articleRoutes, 
    ...conceptRoutes, 
    ...themeRoutes, 
    ...moodRoutes, 
    ...regionRoutes
  ];
}
