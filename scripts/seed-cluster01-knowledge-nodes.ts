import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { entityStore } from '../lib/atlas/atlas-entity';
import { relationshipStore } from '../lib/atlas/atlas-relationship';
import { EntityType, RelationshipType, PrimaryDomain } from '../lib/atlas/atlas-types';

const DATA_DIR = path.join(process.cwd(), '.data');

const supportingEntities = [
  {
    canonicalName: "Lal Ded",
    slug: "lal-ded",
    entityType: "Poet" as EntityType,
    primaryDomain: "historical_poetry" as PrimaryDomain,
    shortDescription: "A 14th-century Shaivite mystic whose asceticism profoundly influenced Nund Rishi and the Kashmiri spiritual tradition.",
    sufipulseJustification: "Lal Ded is the indispensable predecessor to Nund Rishi. You cannot understand Kashmiri Sufism without understanding her Vakhs (aphorisms).",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 85,
    advantageScore: 80,
    authorityMetadata: {
      "Birth": "1320",
      "Tradition": "Kashmir Shaivism",
      "Key Forms": ["Vakhs"]
    }
  },
  {
    canonicalName: "Shah Hamadan",
    slug: "shah-hamadan",
    entityType: "Saint" as EntityType,
    primaryDomain: "historical_lineage" as PrimaryDomain,
    shortDescription: "Mir Sayyid Ali Hamadani, the Persian Sufi master who introduced Central Asian institutional Sufism to Kashmir.",
    sufipulseJustification: "Represents the cosmopolitan counterpart to Nund Rishi's indigenous mysticism, forming the dual pillars of Kashmiri Sufism.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 88,
    advantageScore: 75,
    authorityMetadata: {
      "Birth": "1314",
      "Order": "Kubrawiya",
      "Origin": "Hamadan, Persia"
    }
  },
  {
    canonicalName: "Rishi Tradition",
    slug: "rishi-tradition",
    entityType: "Tradition" as EntityType,
    primaryDomain: "regional_heritage" as PrimaryDomain,
    shortDescription: "The unique indigenous Sufi order of Kashmir founded by Nund Rishi, characterized by strict asceticism, vegetarianism, and environmental stewardship.",
    sufipulseJustification: "The defining theological and sociological framework of Kashmiriyat, essential for capturing long-tail discovery traffic.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 92,
    advantageScore: 90,
    authorityMetadata: {
      "Founder": "Nund Rishi",
      "Region": "Kashmir",
      "Core Values": ["Asceticism", "Vegetarianism", "Ecology"]
    }
  },
  {
    canonicalName: "Kashmiriyat",
    slug: "kashmiriyat",
    entityType: "Concept" as EntityType,
    primaryDomain: "sufi_philosophy" as PrimaryDomain,
    shortDescription: "The ethno-national, social consciousness, and cultural values of the Kashmiri people, deeply rooted in the syncretic traditions of the Rishis and Sufis.",
    sufipulseJustification: "A high-volume cultural keyword that routes directly back to the spiritual poetry and musical heritage of the region.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 90,
    advantageScore: 85,
    authorityMetadata: {
      "Key Figures": ["Nund Rishi", "Lal Ded"]
    }
  },
  {
    canonicalName: "Kashmiri Sufiyana",
    slug: "kashmiri-sufiyana",
    entityType: "Tradition" as EntityType,
    primaryDomain: "musical_genre" as PrimaryDomain,
    shortDescription: "The classical choral devotional music of Kashmir, known for preserving the poetry of Nund Rishi and other Sufi masters.",
    sufipulseJustification: "The direct musical outcome of the Kashmiri spiritual synthesis, essential for routing historical traffic into SufiPulse acoustic performances.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 88,
    advantageScore: 95,
    authorityMetadata: {
      "Instruments": ["Santoor", "Rabab", "Tumbaknari", "Saaz-e-Kashmir"],
      "Key Forms": ["Shruks", "Kalam"]
    }
  }
];

async function run() {
  console.log('🚀 Building Cluster 01 Knowledge Nodes...');
  
  const nundRishi = entityStore.findBySlug('nund-rishi');
  if (!nundRishi) {
    console.log('❌ Nund Rishi entity not found. Cannot bind cluster.');
    return;
  }

  const createdEntities = [];

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
      createdEntities.push(entity);
      
      // Bind relationship
      const relId = crypto.randomUUID();
      try {
        relationshipStore.create({
          id: relId,
          sourceEntityId: nundRishi.id,
          targetEntityId: entity.id,
          relationshipType: 'INFLUENCED_BY' as RelationshipType, // Simplification for seeder
          description: `Internal cluster routing for Cluster 01: Nund Rishi -> ${entity.canonicalName}`
        });
        console.log(`🔗 Created relationship: Nund Rishi -> ${entity.canonicalName}`);
      } catch(e: any) {
        if (!e.message.includes('Duplicate')) {
          console.error(e.message);
        }
      }
    }
  }

  console.log('🎉 Cluster 01 Knowledge Nodes seeded successfully!');
}

run().catch(console.error);
