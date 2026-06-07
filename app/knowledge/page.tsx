import React from 'react';
import fs from 'fs';
import path from 'path';
import KnowledgeClient from './KnowledgeClient';

export default async function KnowledgeHome() {
  const dataPath = path.join(process.cwd(), '.data', 'unified_knowledge.json');
  const entities = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // Calculate stats for the Knowledge Landing Page
  const stats = {
    totalEntities: entities.length,
    atlasNodes: 219,
    relationships: 2381,
    releases: entities.filter((e: any) => e.class === 'release').length,
    singers: entities.filter((e: any) => e.class === 'singer').length,
    songs: entities.filter((e: any) => e.class === 'song').length,
    albums: entities.filter((e: any) => e.class === 'album').length,
    poetsWriters: entities.filter((e: any) => ['poet', 'writer', 'person'].includes(e.class)).length,
    concepts: entities.filter((e: any) => e.class === 'concept').length,
    traditions: entities.filter((e: any) => e.class === 'tradition').length,
  };

  return <KnowledgeClient entities={entities} stats={stats} />;
}