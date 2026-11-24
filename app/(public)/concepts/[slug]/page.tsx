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
  const concept = registriesStorage.getItem('concepts', slug);

  if (!concept || !concept.isActive || !concept.isPublic) {
    return {
      title: 'Concept Not Found',
      robots: { index: false, follow: false },
    };
  }

  const url = canonicalUrl(`/concepts/${slug}`);
  return {
    title: `${concept.title} — Sufi Concepts`,
    description:
      concept.description ||
      `Browse full-length Sufi songs, kalam, and devotional releases connected to the Sufi concept of ${concept.title}.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${concept.title} — Sufi Concepts | SufiPulse USA`,
      description: concept.description,
      url,
      type: 'website',
    },
  };
}

export default async function ConceptDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <DiscoveryGraphNodeView
      slug={slug}
      type="concept"
      categoryLabel="Concept"
      categoryUrlPath="concepts"
    />
  );
}
