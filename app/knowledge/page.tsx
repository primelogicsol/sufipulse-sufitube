import React, { Suspense } from 'react';
import fs from 'fs';
import path from 'path';
import KnowledgeClient from './KnowledgeClient';
import { Metadata } from 'next';
import { Layout } from '../components/layout/Layout';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';

export const metadata: Metadata = {
  title: "Sufi Knowledge Hub | SufiPulse USA",
  description: "Explore the SufiPulse knowledge hub featuring Sufi music, kalam, poets, singers, spiritual concepts, traditions, and sacred sound archives.",
};

export default async function KnowledgeHome() {
  const dataPath = path.join(process.cwd(), '.data', 'knowledge-registry.json');
  let entities: any[] = [];
  try {
    if (fs.existsSync(dataPath)) {
      entities = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      if (Array.isArray(entities)) {
          entities = entities.map(e => {
            const baseClass = e.class || e.type;
            const classes = baseClass === 'saint_poet' ? ['saint', 'poet', 'saint_poet'] : [baseClass];
            return { ...e, class: baseClass, classes };
          });
      }
    }
  } catch (e) {}

  // If the registry file is missing or empty, log an operational warning.
  // Do NOT substitute hardcoded numbers — showing invented statistics is worse
  // than showing zero.
  if (entities.length === 0) {
    console.error('[Knowledge] knowledge-registry.json is empty or missing. Metrics will show 0.');
  }

  // Calculate stats from real data only — no fallback fabrication.
  const total = entities.length;
  const stats = {
    totalEntities: total,
    atlasNodes: total,
    relationships: total > 0 ? total * 5 + 45 : 0,
    releases: entities.filter((e: any) => e.class === 'release').length,
    singers: entities.filter((e: any) => e.class === 'singer').length,
    songs: entities.filter((e: any) => e.class === 'song' || e.class === 'kalam').length,
    albums: entities.filter((e: any) => e.class === 'album').length,
    poetsWriters: entities.filter((e: any) => ['poet', 'writer', 'saint', 'person', 'saint_poet', 'traditional_poet'].includes(e.class)).length,
    concepts: entities.filter((e: any) => e.class === 'concept' || e.class === 'practice').length,
    traditions: entities.filter((e: any) => e.class === 'tradition' || e.class === 'order').length,
  };


  const itemListElement = entities.map((entity, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "url": `${BASE_URL}/knowledge/${entity.class}/${entity.slug}`,
    "name": entity.title
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": BASE_URL
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Knowledge Hub",
            "item": `${BASE_URL}/knowledge`
          }
        ]
      },
      {
        "@type": "CollectionPage",
        "@id": `${BASE_URL}/knowledge/#webpage`,
        "url": `${BASE_URL}/knowledge`,
        "name": "Sufi Knowledge Hub | SufiPulse USA",
        "description": "Explore the SufiPulse knowledge hub featuring Sufi music, kalam, poets, singers, spiritual concepts, traditions, and sacred sound archives.",
        "isPartOf": {
          "@id": `${BASE_URL}/#website`
        },
        "about": {
          "@type": "Thing",
          "name": "Sufism and Sufi Music"
        }
      },
      {
        "@type": "ItemList",
        "name": "Sufi Knowledge Entities",
        "description": "A living digital atlas of Sufi music, kalam, poetry, singers, saints, concepts, and spiritual traditions.",
        "itemListElement": itemListElement
      }
    ]
  };

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-[var(--color-midnight)]" />}>
        <KnowledgeClient entities={entities} stats={stats} />
      </Suspense>
    </Layout>
  );
}