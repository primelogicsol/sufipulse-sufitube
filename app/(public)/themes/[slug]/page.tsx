import React from 'react';
import type { Metadata } from 'next';
import { DiscoveryGraphNodeView } from '@/app/components/seo/DiscoveryGraphNodeView';
import { registriesStorage } from '@/lib/registries-storage';
import { canonicalUrl } from '@/lib/canonical-seo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  registriesStorage.init();
  const theme = registriesStorage.getItem('themes', slug);

  if (!theme || !theme.isActive || !theme.isPublic) {
    return {
      title: 'Theme Not Found',
      robots: { index: false, follow: false },
    };
  }

  const url = canonicalUrl(`/themes/${slug}`);
  return {
    title: `${theme.title} — Spiritual Themes`,
    description:
      theme.description ||
      `Browse full-length Sufi songs, kalam, and devotional releases connected to the spiritual theme of ${theme.title}.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${theme.title} — Spiritual Themes | SufiPulse USA`,
      description: theme.description,
      url,
      type: 'website',
    },
  };
}

export default async function ThemeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <DiscoveryGraphNodeView
      slug={slug}
      type="theme"
      categoryLabel="Theme"
      categoryUrlPath="themes"
    />
  );
}
