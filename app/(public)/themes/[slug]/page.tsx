import React from 'react';
import type { Metadata } from 'next';
import { DiscoveryGraphNodeView } from '@/app/components/seo/DiscoveryGraphNodeView';
import { registriesStorage } from '@/lib/registries-storage';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { slug } = await params;
  
  registriesStorage.init();
  const theme = registriesStorage.getItem('themes', slug);

  if (!theme || !theme.isActive || !theme.isPublic) {
    return {
      title: 'Theme Not Found | SufiPulse Discover',
      description: 'The requested discover topic is private or does not exist.'
    };
  }

  return {
    title: `${theme.title} - Spiritual Themes | SufiPulse Discover`,
    description: theme.description || `Browse qawwalis, sufi music, and devotional releases associated with the theme of ${theme.title}.`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.sufipulse.com'}/themes/${slug}`
    },
    openGraph: {
      title: `${theme.title} - Spiritual Themes | SufiPulse Discover`,
      description: theme.description,
      type: 'website'
    }
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
