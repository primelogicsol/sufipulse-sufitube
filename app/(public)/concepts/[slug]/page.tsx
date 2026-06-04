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
  const concept = registriesStorage.getItem('concepts', slug);

  if (!concept || !concept.isActive || !concept.isPublic) {
    return {
      title: 'Concept Not Found | SufiPulse Discover',
      description: 'The requested discover topic is private or does not exist.'
    };
  }

  return {
    title: `${concept.title} - Sufi Concepts | SufiPulse Discover`,
    description: concept.description || `Browse qawwalis, sufi music, and devotional releases associated with the concept of ${concept.title}.`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.sufipulse.com'}/concepts/${slug}`
    },
    openGraph: {
      title: `${concept.title} - Sufi Concepts | SufiPulse Discover`,
      description: concept.description,
      type: 'website'
    }
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
