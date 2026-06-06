import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { entityStore } from '../lib/atlas/atlas-entity';
import { relationshipStore } from '../lib/atlas/atlas-relationship';
import { EntityType, RelationshipType, PrimaryDomain } from '../lib/atlas/atlas-types';

const DATA_DIR = path.join(process.cwd(), '.data');

const supportingEntities = [
  {
    canonicalName: "Peter Gabriel",
    slug: "peter-gabriel",
    entityType: "Singer" as EntityType,
    primaryDomain: "modern_artist" as PrimaryDomain,
    shortDescription: "The British musician and founder of Real World Records, whose collaborations with Nusrat Fateh Ali Khan introduced Qawwali to the global mainstream.",
    sufipulseJustification: "Crucial crossover node. Bridges traditional Sufi music search intent with massive Western world music and pop audiences.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 85,
    advantageScore: 90
  },
  {
    canonicalName: "World Music",
    slug: "world-music",
    entityType: "Concept" as EntityType,
    primaryDomain: "musical_genre" as PrimaryDomain,
    shortDescription: "A global musical category that served as the primary vehicle for Nusrat Fateh Ali Khan's crossover success in Western markets.",
    sufipulseJustification: "Captures high-volume, generic acoustic and cultural music searches, routing them into authentic Sufi authority.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 80,
    advantageScore: 75
  }
];

const existingNodesToLink = [
  "amir-khusrau",
  "qawwali",
  "mustt-mustt",
  "tajdar-e-haram",
  "sabri-brothers",
  "abida-parveen",
  "sama",
  "sufi-music",
  "chishti-order"
];

async function run() {
  console.log('🚀 Elevating Cluster 03 (Nusrat Fateh Ali Khan) to Flagship Status...');
  
  // Elevate NFAK Core Node
  const nfakEntity = entityStore.findBySlug('nusrat-fateh-ali-khan');
  if (!nfakEntity) {
    console.error("Failed to fetch NFAK entity");
    return;
  }

  // Ensure NFAK is updated to reflect Flagship Authority
  entityStore.update(nfakEntity.id, {
    sufipulseJustification: "Flagship Cluster 03 Core Node. The ultimate bridge between traditional Qawwali authority and global commercial streaming.",
    strategicGPS: 99,
    advantageScore: 90
  });

  console.log(`✅ Elevated CORE node: ${nfakEntity.canonicalName}`);

  for (const node of supportingEntities) {
    let entity = entityStore.findBySlug(node.slug);
    if (!entity) {
      entityStore.create(node);
      entity = entityStore.findBySlug(node.slug);
      console.log(`✅ Created supporting node: ${node.canonicalName}`);
    } else {
      entityStore.update(entity.id, node);
      console.log(`✅ Updated supporting node: ${node.canonicalName}`);
    }
    
    if (entity) {
      try {
        relationshipStore.create({
          id: crypto.randomUUID(),
          sourceEntityId: nfakEntity.id,
          targetEntityId: entity.id,
          relationshipType: 'INFLUENCED_BY' as RelationshipType,
          description: `Internal cluster routing: NFAK -> ${entity.canonicalName}`
        });
        console.log(`🔗 Created relationship: NFAK -> ${entity.canonicalName}`);
      } catch(e: any) {
        if (!e.message.includes('Duplicate')) console.error(e.message);
      }
    }
  }

  for (const slug of existingNodesToLink) {
    const targetEntity = entityStore.findBySlug(slug);
    if (targetEntity) {
       try {
        relationshipStore.create({
          id: crypto.randomUUID(),
          sourceEntityId: nfakEntity.id,
          targetEntityId: targetEntity.id,
          relationshipType: 'INFLUENCED_BY' as RelationshipType,
          description: `Internal cluster routing: NFAK -> ${targetEntity.canonicalName}`
        });
        console.log(`🔗 Linked existing node: NFAK -> ${targetEntity.canonicalName}`);
      } catch(e: any) {
        if (!e.message.includes('Duplicate')) console.error(e.message);
      }
    }
  }

  console.log('🎉 Cluster 03 (NFAK) Knowledge Nodes configured successfully!');
}

run().catch(console.error);
