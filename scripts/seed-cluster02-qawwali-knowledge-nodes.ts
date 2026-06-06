import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { entityStore } from '../lib/atlas/atlas-entity';
import { relationshipStore } from '../lib/atlas/atlas-relationship';
import { EntityType, RelationshipType, PrimaryDomain } from '../lib/atlas/atlas-types';

const DATA_DIR = path.join(process.cwd(), '.data');

const coreNode = {
  canonicalName: "Qawwali",
  slug: "qawwali",
  entityType: "Tradition" as EntityType,
  primaryDomain: "musical_genre" as PrimaryDomain,
  shortDescription: "The energetic, rhythmic devotional music of the Chishti Sufi order, tracing its roots to 13th-century South Asia.",
  sufipulseJustification: "The single highest-demand search node for South Asian Sufi music. Establishing authority here routes massive traffic to SufiPulse-USA.",
  status: 'published' as any,
  isPublic: true,
  strategicGPS: 95,
  advantageScore: 85,
  authorityMetadata: {
    "Origins": "13th Century, Delhi Sultanate",
    "Founder": "Amir Khusrau",
    "Order": "Chishti Order",
    "Key Forms": ["Hamd", "Naat", "Manqabat", "Ghazal", "Kafi"]
  }
};

const supportingEntities = [
  {
    canonicalName: "Amir Khusrau",
    slug: "amir-khusrau",
    entityType: "Poet" as EntityType,
    primaryDomain: "historical_poetry" as PrimaryDomain,
    shortDescription: "The iconic 13th-century Sufi poet, musician, and scholar credited with inventing the Qawwali framework and integrating Persian and Hindustani traditions.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 90,
    advantageScore: 80
  },
  {
    canonicalName: "Chishti Order",
    slug: "chishti-order",
    entityType: "Order" as EntityType,
    primaryDomain: "sufi_philosophy" as PrimaryDomain,
    shortDescription: "The dominant Sufi order of South Asia, known for its emphasis on Sama (spiritual listening) and the historical incubator of Qawwali.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 85,
    advantageScore: 75
  },
  {
    canonicalName: "Nusrat Fateh Ali Khan",
    slug: "nusrat-fateh-ali-khan",
    entityType: "Singer" as EntityType,
    primaryDomain: "modern_artist" as PrimaryDomain,
    shortDescription: "The monumental Pakistani vocalist often referred to as the 'Shahenshah-e-Qawwali' (King of Kings of Qawwali), responsible for globalizing the genre.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 98,
    advantageScore: 85
  },
  {
    canonicalName: "Abida Parveen",
    slug: "abida-parveen",
    entityType: "Singer" as EntityType,
    primaryDomain: "modern_artist" as PrimaryDomain,
    shortDescription: "One of the foremost exponents of Sufi music, blending Qawwali, Kafi, and Ghazal forms into unparalleled spiritual performances.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 92,
    advantageScore: 85
  },
  {
    canonicalName: "Rahat Fateh Ali Khan",
    slug: "rahat-fateh-ali-khan",
    entityType: "Singer" as EntityType,
    primaryDomain: "modern_artist" as PrimaryDomain,
    shortDescription: "The heir to the family's Qawwali legacy who bridged classical devotional music with massive global and cinematic appeal.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 85,
    advantageScore: 70
  },
  {
    canonicalName: "Sabri Brothers",
    slug: "sabri-brothers",
    entityType: "Singer" as EntityType, // Technically a group
    primaryDomain: "modern_artist" as PrimaryDomain,
    shortDescription: "Pioneering Qawwali ensemble who achieved massive international fame in the 20th century with their powerful, chorus-driven style.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 85,
    advantageScore: 80
  },
  {
    canonicalName: "Sama",
    slug: "sama",
    entityType: "Tradition" as EntityType,
    primaryDomain: "sufi_philosophy" as PrimaryDomain,
    shortDescription: "The Sufi practice of spiritual listening and remembrance, serving as the theological justification for music in the Chishti order.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 85,
    advantageScore: 85
  },
  {
    canonicalName: "Sufi Music",
    slug: "sufi-music",
    entityType: "Concept" as EntityType,
    primaryDomain: "musical_genre" as PrimaryDomain,
    shortDescription: "The broad umbrella term capturing all musical expressions of Islamic mysticism across cultures and regions.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 95,
    advantageScore: 70
  },
  {
    canonicalName: "Tajdar-e-Haram",
    slug: "tajdar-e-haram",
    entityType: "Song" as EntityType,
    primaryDomain: "musical_genre" as PrimaryDomain,
    shortDescription: "One of the most iconic Qawwalis of the 20th century, originally popularized by the Sabri Brothers.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 85,
    advantageScore: 75
  },
  {
    canonicalName: "Mustt Mustt",
    slug: "mustt-mustt",
    entityType: "Album" as EntityType,
    primaryDomain: "musical_genre" as PrimaryDomain,
    shortDescription: "The groundbreaking 1990 fusion album by Nusrat Fateh Ali Khan that introduced Qawwali to Western pop and world music audiences.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 80,
    advantageScore: 80
  },
  {
    canonicalName: "Dama Dam Mast Qalandar",
    slug: "dama-dam-mast-qalandar",
    entityType: "Song" as EntityType,
    primaryDomain: "musical_genre" as PrimaryDomain,
    shortDescription: "The legendary spiritual anthem dedicated to Jhulelal, performed by nearly every major Sufi vocalist across traditions.",
    status: 'published' as any,
    isPublic: true,
    strategicGPS: 90,
    advantageScore: 80
  }
];

async function run() {
  console.log('🚀 Building Cluster 02 (Qawwali) Knowledge Nodes...');
  
  // Create or update Core Node
  let qawwaliEntity = entityStore.findBySlug(coreNode.slug);
  if (!qawwaliEntity) {
    entityStore.create(coreNode);
    qawwaliEntity = entityStore.findBySlug(coreNode.slug);
    console.log(`✅ Created CORE node: ${coreNode.canonicalName}`);
  } else {
    entityStore.update(qawwaliEntity.id, coreNode);
    console.log(`✅ Updated CORE node: ${coreNode.canonicalName}`);
  }

  if (!qawwaliEntity) {
    console.error("Failed to fetch Qawwali entity");
    return;
  }

  for (const node of supportingEntities) {
    let entity = entityStore.findBySlug(node.slug);
    if (!entity) {
      entityStore.create({
        ...node,
        sufipulseJustification: `Supporting knowledge node for Flagship Cluster 02: Qawwali`
      });
      entity = entityStore.findBySlug(node.slug);
      console.log(`✅ Created supporting node: ${node.canonicalName}`);
    } else {
      entityStore.update(entity.id, {
        ...node,
        sufipulseJustification: `Supporting knowledge node for Flagship Cluster 02: Qawwali`
      });
      console.log(`✅ Updated supporting node: ${node.canonicalName}`);
    }
    
    if (entity) {
      // Bind relationship (both ways for cluster density)
      try {
        relationshipStore.create({
          id: crypto.randomUUID(),
          sourceEntityId: qawwaliEntity.id,
          targetEntityId: entity.id,
          relationshipType: 'INFLUENCED_BY' as RelationshipType,
          description: `Internal cluster routing: Qawwali -> ${entity.canonicalName}`
        });
        console.log(`🔗 Created relationship: Qawwali -> ${entity.canonicalName}`);
      } catch(e: any) {
        if (!e.message.includes('Duplicate')) console.error(e.message);
      }
    }
  }

  console.log('🎉 Cluster 02 (Qawwali) Knowledge Nodes seeded successfully!');
}

run().catch(console.error);
