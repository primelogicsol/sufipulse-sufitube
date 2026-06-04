import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { literaryArticles } from '../../../data/literary-articles';
import LiteraryArticleClient from './client';

export const dynamicParams = true;

export async function generateStaticParams() {
  return literaryArticles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  
  // 1. Try static list first
  let article = literaryArticles.find((a) => a.slug === slug);

  // 2. Try file-based database fallback
  if (!article) {
    try {
      const file = path.join(process.cwd(), '.data', 'articles.json');
      if (fs.existsSync(file)) {
        const dbArticles: any[] = JSON.parse(fs.readFileSync(file, 'utf8'));
        const dbMatch = dbArticles.find((a) => a.slug === slug && (a.status === 'approved' || a.status === 'published'));
        if (dbMatch) {
          article = {
            id: dbMatch.id,
            title: dbMatch.title || 'Untitled',
            subtitle: dbMatch.abstract || dbMatch.subtitle || null,
            slug: dbMatch.slug || slug,
            category: dbMatch.category || dbMatch.article_type || 'reflective_essay',
            content: dbMatch.content || '',
            excerpt: dbMatch.excerpt || (dbMatch.content || '').replace(/<[^>]*>/g, '').slice(0, 200) + '...',
            reading_time_minutes: Math.max(1, Math.ceil(((dbMatch.content || '').replace(/<[^>]*>/g, '').split(' ').length) / 200)),
            featured: !!dbMatch.featured,
            published_at: dbMatch.published_at || dbMatch.updated_at || dbMatch.created_at || new Date().toISOString(),
            tags: Array.isArray(dbMatch.tags) ? dbMatch.tags : (dbMatch.author_domain ? dbMatch.author_domain.split(',').map((t: string) => t.trim()) : []),
            author_id: dbMatch.user_id || '',
            author_name: dbMatch.author_name || dbMatch.author_full_name || 'Ahl-e-Tahreer',
            author_professional_name: dbMatch.author_professional_name || '',
            author_country: dbMatch.author_country || '',
            author_city: dbMatch.author_city || '',
            author_domain: dbMatch.author_domain || '',
            author_photo: dbMatch.author_photo || '',
          } as any;
        }
      }
    } catch (e) {
      console.error('[Literary Journal Metadata Error]', e);
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';

  if (!article) {
    return { title: "Article Not Found", robots: { index: false, follow: false } };
  }

  const title = article.title;
  const description = article.excerpt || article.subtitle || `Read "${article.title}" on SufiPulse Literary Journal.`;
  const canonicalUrl = `${baseUrl}/literary-journal/${slug}`;

  return {
    title,
    description,
    keywords: [
      ...(article.tags || []),
      "Sufi literature", "Sufi essay", "sacred poetry", "SufiPulse",
    ],
    authors: article.author_name ? [{ name: article.author_name }] : undefined,
    openGraph: {
      title: `${title} | SufiPulse Literary Journal`,
      description,
      type: "article",
      url: canonicalUrl,
      publishedTime: article.published_at,
      authors: article.author_name ? [article.author_name] : undefined,
      tags: article.tags,
      images: [{ url: `/og?title=${encodeURIComponent(title)}&subtitle=SufiPulse+Literary+Journal`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | SufiPulse`,
      description,
      images: [`/og?title=${encodeURIComponent(title)}&subtitle=SufiPulse+Literary+Journal`],
    },
    alternates: { canonical: canonicalUrl },
  };
}

export default function LiteraryArticlePage() {
  return <LiteraryArticleClient />;
}
