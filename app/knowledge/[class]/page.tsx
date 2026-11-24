import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { Layout } from '../../components/layout/Layout';
import KnowledgeClient from '../KnowledgeClient';
import { canonicalUrl } from '@/lib/canonical-seo';

const classMap: Record<string, string> = {
  songs: 'song',
  singers: 'singer',
  releases: 'release',
  albums: 'album',
  poets: 'poet',
  writers: 'writer',
  concepts: 'concept',
  traditions: 'tradition',
  regions: 'region',
  persons: 'person',
  orders: 'order',
  works: 'work',
};

const singularToCanonicalPlural: Record<string, string> = {
  song: 'songs',
  kalam: 'songs',
  singer: 'singers',
  release: 'releases',
  album: 'albums',
  poet: 'poets',
  saint: 'poets',
  saint_poet: 'poets',
  traditional_poet: 'poets',
  scholar: 'poets',
  writer: 'writers',
  concept: 'concepts',
  practice: 'concepts',
  spiritualstate: 'concepts',
  tradition: 'traditions',
  musicaltradition: 'traditions',
  literarytradition: 'traditions',
  order: 'orders',
  region: 'regions',
  person: 'persons',
  work: 'works',
};

export async function generateMetadata({ params }: { params: Promise<{ class: string }> }): Promise<Metadata> {
  const { class: rawClass } = await params;
  const canonicalClass = singularToCanonicalPlural[rawClass.toLowerCase()] || rawClass.toLowerCase();
  const label = canonicalClass.charAt(0).toUpperCase() + canonicalClass.slice(1);
  const url = canonicalUrl(`/knowledge/${canonicalClass}`);
  return {
    title: `Sufi ${label} — Knowledge Hub`,
    description: `Explore verified Sufi ${canonicalClass}, biographies, sacred traditions, and poetic archives on SufiPulse USA.`,
    alternates: { canonical: url },
    openGraph: {
      title: `Sufi ${label} — Knowledge Hub | SufiPulse USA`,
      description: `Explore verified Sufi ${canonicalClass} on SufiPulse USA.`,
      url,
      type: 'website',
    },
  };
}

export default async function KnowledgeClassHome({ params }: { params: Promise<{ class: string }> }) {
  const resolvedParams = await params;
  const urlClass = resolvedParams.class;
  const canonicalPlural = singularToCanonicalPlural[urlClass.toLowerCase()];
  if (canonicalPlural && canonicalPlural !== urlClass) {
    permanentRedirect(`/knowledge/${canonicalPlural}`);
  }
  const targetClass = classMap[urlClass] || urlClass;

  const dataPath = path.join(process.cwd(), '.data', 'knowledge-registry.json');
  let entities: any[] = [];
  try {
    if (fs.existsSync(dataPath)) {
      entities = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      if (Array.isArray(entities)) {
        entities = entities
          .filter((e) => e.isActive !== false && e.isPublic !== false)
          .map((e) => ({ ...e, class: e.class || e.type }));
      }
    }
  } catch {}

  return (
    <Layout>
      <Suspense fallback={<div className="min-h-screen bg-[var(--color-midnight)]" />}>
        <KnowledgeClient entities={entities} initialClass={targetClass} />
      </Suspense>
    </Layout>
  );
}
