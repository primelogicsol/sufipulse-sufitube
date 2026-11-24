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
  const region = registriesStorage.getItem('regions', slug);

  if (!region || !region.isActive || !region.isPublic) {
    return {
      title: 'Region Not Found',
      robots: { index: false, follow: false },
    };
  }

  const url = canonicalUrl(`/regions/${slug}`);
  return {
    title: `${region.title} — Regional Sufi Heritage`,
    description:
      region.description ||
      `Browse full-length Sufi songs, kalam, and devotional releases connected to ${region.title}.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${region.title} — Regional Sufi Heritage | SufiPulse USA`,
      description: region.description,
      url,
      type: 'website',
    },
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
