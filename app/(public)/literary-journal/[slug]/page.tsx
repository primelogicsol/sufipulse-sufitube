import type { Metadata } from 'next';
import { literaryArticles } from '../../../data/literary-articles';
import LiteraryArticleClient from './client';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return literaryArticles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const article = literaryArticles.find((a) => a.slug === slug);
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
