import React, { Suspense } from 'react';
import fs from 'fs';
import path from 'path';
import KnowledgeClient from '../KnowledgeClient';

// Map plural URL slugs to singular entity classes
const classMap: Record<string, string> = {
  'songs': 'song',
  'singers': 'singer',
  'releases': 'release',
  'albums': 'album',
  'poets': 'poet',
  'writers': 'writer',
  'concepts': 'concept',
  'traditions': 'tradition',
  'regions': 'region',
  'persons': 'person',
  'orders': 'order',
  'works': 'work'
};

export default async function KnowledgeClassHome({ params }: { params: Promise<{ class: string }> }) {
  const resolvedParams = await params;
  const urlClass = resolvedParams.class;
  const targetClass = classMap[urlClass] || urlClass;

  const dataPath = path.join(process.cwd(), '.data', 'knowledge-registry.json');
  let entities: any[] = [];
  try {
    if (fs.existsSync(dataPath)) {
      entities = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      if (Array.isArray(entities)) {
          entities = entities.map(e => ({ ...e, class: e.class || e.type }));
      }
    }
  } catch (e) {}

  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-midnight)]" />}>
      <KnowledgeClient entities={entities} initialClass={targetClass} />
    </Suspense>
  );
}
