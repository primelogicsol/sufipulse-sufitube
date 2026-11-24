import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { literaryArticles } from '../../../data/literary-articles';
import LiteraryArticleClient from './client';
import { CANONICAL_ORIGIN, canonicalUrl } from '@/lib/canonical-seo';

export const dynamicParams = true;

export async function generateStaticParams() {
  return literaryArticles.map((article) => ({
    slug: article.slug,
  }));
}

function resolveArticleBySlug(slug: string): any | null {
  const staticMatch = literaryArticles.find((a) => a.slug === slug);
  if (staticMatch) return staticMatch;

  try {
    const file = path.join(process.cwd(), '.data', 'articles.json');
    if (fs.existsSync(file)) {
      const dbArticles: any[] = JSON.parse(fs.readFileSync(file, 'utf8'));
      const dbMatch = dbArticles.find(
        (a) => a.slug === slug && (a.status === 'approved' || a.status === 'published')
      );
      if (dbMatch) {
        return {
          id: dbMatch.id,
          title: dbMatch.title || 'Untitled',
          subtitle: dbMatch.abstract || dbMatch.subtitle || null,
          slug: dbMatch.slug || slug,
          category: dbMatch.category || dbMatch.article_type || 'reflective_essay',
          content: dbMatch.content || '',
          excerpt:
            dbMatch.excerpt ||
            (dbMatch.content || '').replace(/<[^>]*>/g, '').slice(0, 200) + '...',
          reading_time_minutes: Math.max(
            1,
            Math.ceil((dbMatch.content || '').replace(/<[^>]*>/g, '').split(' ').length / 200)
          ),
          featured: !!dbMatch.featured,
          published_at:
            dbMatch.published_at || dbMatch.updated_at || dbMatch.created_at || new Date().toISOString(),
          tags: Array.isArray(dbMatch.tags)
            ? dbMatch.tags
            : dbMatch.author_domain
              ? dbMatch.author_domain.split(',').map((t: string) => t.trim())
              : [],
          author_id: dbMatch.user_id || '',
          author_name: dbMatch.author_name || dbMatch.author_full_name || 'Ahl-e-Tahreer',
          author_professional_name: dbMatch.author_professional_name || '',
          author_country: dbMatch.author_country || '',
          author_city: dbMatch.author_city || '',
          author_domain: dbMatch.author_domain || '',
          author_photo: dbMatch.author_photo || '',
        };
      }
    }
  } catch (e) {
    console.error('[Literary Journal Metadata Error]', e);
  }

  return null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const article = resolveArticleBySlug(slug);

  if (!article) {
    return { title: 'Article Not Found', robots: { index: false, follow: false } };
  }

  const title = article.title;
  const description =
    article.excerpt || article.subtitle || `Read "${article.title}" on SufiPulse Literary Journal.`;
  const resolvedCanonical = canonicalUrl(`/literary-journal/${slug}`);

  return {
    title,
    description,
    keywords: [
      ...(article.tags || []),
      'Sufi literature',
      'Sufi essay',
      'sacred poetry',
      'SufiPulse USA',
    ],
    authors: article.author_name ? [{ name: article.author_name }] : undefined,
    openGraph: {
      title: `${title} | SufiPulse Literary Journal`,
      description,
      type: 'article',
      url: resolvedCanonical,
      publishedTime: article.published_at,
      authors: article.author_name ? [article.author_name] : undefined,
      tags: article.tags,
      images: [
        {
          url: `/og?title=${encodeURIComponent(title)}&subtitle=SufiPulse+Literary+Journal`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | SufiPulse USA`,
      description,
      images: [`/og?title=${encodeURIComponent(title)}&subtitle=SufiPulse+Literary+Journal`],
    },
    alternates: { canonical: resolvedCanonical },
  };
}

export default async function LiteraryArticlePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const article = resolveArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const resolvedCanonical = canonicalUrl(`/literary-journal/${slug}`);
  const plainBody = String(article.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: CANONICAL_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Literary Journal', item: `${CANONICAL_ORIGIN}/literary-journal` },
          { '@type': 'ListItem', position: 3, name: article.title, item: resolvedCanonical },
        ],
      },
      {
        '@type': 'Article',
        '@id': `${resolvedCanonical}#article`,
        headline: article.title,
        description: article.excerpt || article.subtitle || article.title,
        url: resolvedCanonical,
        datePublished: article.published_at,
        author: {
          '@type': 'Person',
          name: article.author_name || 'SufiPulse Literary Contributor',
        },
        publisher: {
          '@type': 'Organization',
          '@id': `${CANONICAL_ORIGIN}/#organization`,
          name: 'SufiPulse USA',
          url: CANONICAL_ORIGIN,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="sr-only" data-ssr-article-authority="true">
        <h1>{article.title}</h1>
        {article.author_name && <p>By {article.author_name}</p>}
        <p>{plainBody}</p>
      </article>
      <LiteraryArticleClient />
    </>
  );
}
