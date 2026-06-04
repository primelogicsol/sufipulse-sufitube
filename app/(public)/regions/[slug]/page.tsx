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
  const region = registriesStorage.getItem('regions', slug);

  if (!region || !region.isActive || !region.isPublic) {
    return {
      title: 'Region Not Found | SufiPulse Discover',
      description: 'The requested discover topic is private or does not exist.'
    };
  }

  return {
    title: `${region.title} - Target Regions | SufiPulse Discover`,
    description: region.description || `Browse qawwalis, sufi music, and devotional releases associated with the region of ${region.title}.`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.sufipulse.com'}/regions/${slug}`
    },
    openGraph: {
      title: `${region.title} - Target Regions | SufiPulse Discover`,
      description: region.description,
      type: 'website'
    }
  };
}

export default async function RegionDetailPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <DiscoveryGraphNodeView
      slug={slug}
      type="region"
      categoryLabel="Region"
      categoryUrlPath="regions"
    />
  );
}
