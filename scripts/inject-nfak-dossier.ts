import fs from 'fs';
import path from 'path';
import { entityStore } from '../lib/atlas/atlas-entity';
import { relationshipStore } from '../lib/atlas/atlas-relationship';
import crypto from 'crypto';

const DOSSIER_PATH = path.join(process.env.HOME || process.env.USERPROFILE || '', '.gemini/antigravity-cli/brain/f63e2fab-4304-41ad-b9fb-af19e2c13561/release03_publication_nfak.md');

async function run() {
  console.log('🚀 Injecting NFAK Cultural Intelligence Dossier & Routing Nodes...');
  
  if (!fs.existsSync(DOSSIER_PATH)) {
    throw new Error('Dossier markdown not found!');
  }
  
  const dossierMarkdown = fs.readFileSync(DOSSIER_PATH, 'utf-8');

  // 1. Ensure NFAK Entity Exists and Update It
  let nfak = entityStore.findBySlug('nusrat-fateh-ali-khan');
  if (!nfak) {
    throw new Error('NFAK entity not found. Cannot inject dossier.');
  }

  entityStore.update(nfak.id, {
    entityType: 'artist', // Fix the legacy 'Singer' type
    longDescription: dossierMarkdown,
    strategicGPS: 99,
    authorityOpportunityScore: 99,
    advantageScore: 98,
    connectionScore: 95,
    sufipulseJustification: 'The ultimate acquisition engine for global Sufi music discovery.',
    primaryDomain: 'global-discovery',
    recommendedAction: 'publish',
    status: 'published'
  });
  console.log('✅ Updated NFAK entity with the full Cultural Intelligence Dossier.');

  // 2. Ensure Required Connected Nodes Exist
  const requiredNodes = [
    { canonicalName: 'Allah Hoo', type: 'song', desc: 'The foundational Hamd that introduces Dhikr to global audiences.' },
    { canonicalName: 'Mustt Mustt', type: 'song', desc: 'The 1990 Michael Brook collaboration track that catalyzed the World Music movement.' },
    { canonicalName: 'Peter Gabriel', type: 'artist', desc: 'The institutional gateway providing global distribution infrastructure.' },
    { canonicalName: 'World Music', type: 'concept', desc: 'The global market category catalyzed by NFAK and Real World Records.' },
    { canonicalName: 'Amir Khusrau', type: 'poet', desc: 'The 13th-century foundational genius behind classical Qawwali poetry.' },
    { canonicalName: 'Chishti Order', type: 'order', desc: 'The spiritual lineage that mandates Sama and Qawwali.' },
    { canonicalName: 'Sama', type: 'concept', desc: 'The spiritual practice of listening that defines the Qawwali tradition.' },
    { canonicalName: 'Qawwali', type: 'tradition', desc: 'The 700-year-old acoustic technology of ecstatic devotion.' },
    { canonicalName: 'Dhikr', type: 'concept', desc: 'The repetitive remembrance of the Divine, mirrored by rhythmic escalation.' }
  ];

  const nodeMap = new Map();

  for (const nodeData of requiredNodes) {
    let node = entityStore.findBySlug(nodeData.canonicalName.toLowerCase().replace(/\s+/g, '-'));
    if (!node) {
      node = entityStore.create({
        canonicalName: nodeData.canonicalName,
        entityType: nodeData.type as any,
        alternateNames: [],
        nameTranslations: {},
        nameTransliterations: {},
        shortDescription: nodeData.desc,
        longDescription: nodeData.desc,
        connectionScore: 90,
        authorityOpportunityScore: 85,
        audienceCaptureScore: 85,
        seedAuthorityScore: 85,
        advantageScore: 90,
        strategicGPS: 85,
        discoveryReadinessScore: 90,
        releaseConnectionStrength: 90,
        contentGapScore: 30,
        winProbability: 25,
        competitionLevel: 'moderate',
        conversionTier: 1,
        hopsToSufiPulseContent: 1,
        hopsToYouTube: 1,
        sufipulseJustification: 'Critical node for the NFAK discovery routing ecosystem.',
        connectedReleaseIds: [],
        connectedVideoIds: [],
        connectedArticleIds: [],
        recommendedAsset: { assetType: 'release' },
        primaryDomain: 'global-discovery',
        sameAs: [],
        sourceReferences: [],
        schemaType: 'Thing',
        status: 'published',
        isPublic: true,
        isActive: true,
        verificationStatus: 'expert_verified',
        recommendedAction: 'publish'
      });
      console.log(`✅ Created Node: ${nodeData.canonicalName}`);
    }
    nodeMap.set(nodeData.canonicalName, node);
  }

  // 3. Establish Discovery Routing Edges (The Live Graph)
  const edgesToCreate = [
    { source: 'Allah Hoo', target: 'nusrat-fateh-ali-khan', type: 'performed_by', family: 'musical' }, // Song -> Artist
    { source: 'Mustt Mustt', target: 'nusrat-fateh-ali-khan', type: 'performed_by', family: 'musical' }, 
    { source: 'Peter Gabriel', target: 'nusrat-fateh-ali-khan', type: 'collaborator', family: 'meta' },
    { source: 'nusrat-fateh-ali-khan', target: 'World Music', type: 'influenced', family: 'meta' },
    { source: 'Amir Khusrau', target: 'nusrat-fateh-ali-khan', type: 'influenced', family: 'meta' },
    { source: 'nusrat-fateh-ali-khan', target: 'Chishti Order', type: 'affiliated_with_order', family: 'spiritual' },
    { source: 'nusrat-fateh-ali-khan', target: 'Qawwali', type: 'belongs_to_tradition', family: 'musical' },
    { source: 'Qawwali', target: 'Sama', type: 'expresses_concept', family: 'literary' },
    { source: 'Allah Hoo', target: 'Dhikr', type: 'expresses_concept', family: 'literary' }
  ];

  for (const edgeData of edgesToCreate) {
    const srcNode = edgeData.source === 'nusrat-fateh-ali-khan' ? nfak! : nodeMap.get(edgeData.source);
    const tgtNode = edgeData.target === 'nusrat-fateh-ali-khan' ? nfak! : nodeMap.get(edgeData.target);
    
    if (!srcNode || !tgtNode) continue;
    
    // Check if edge exists
    const existing = relationshipStore.findAll().find(
      e => e.sourceEntityId === srcNode.id && e.targetEntityId === tgtNode.id
    );
    
    if (!existing) {
      relationshipStore.create({
        sourceEntityId: srcNode.id,
        targetEntityId: tgtNode.id,
        relationshipType: edgeData.type as any,
        family: edgeData.family as any,
        confidence: 1.0,
        verification: 'expert_verified',
        createsConversionPath: true,
        conversionPathDelta: 1,
        authorityFlowWeight: 1.0
      });
      console.log(`🔗 Routed ${srcNode.canonicalName} -> ${tgtNode.canonicalName}`);
    }
  }

  const subEdges = [
    { src: 'Allah Hoo', tgt: 'Dhikr', type: 'expresses_concept', family: 'literary' },
    { src: 'Qawwali', tgt: 'Sama', type: 'expresses_concept', family: 'literary' },
    { src: 'Amir Khusrau', tgt: 'Chishti Order', type: 'affiliated_with_order', family: 'spiritual' },
    { src: 'Mustt Mustt', tgt: 'World Music', type: 'influenced', family: 'meta' },
    { src: 'Peter Gabriel', tgt: 'World Music', type: 'influenced', family: 'meta' }
  ];

  for (const edge of subEdges) {
    const src = nodeMap.get(edge.src);
    const tgt = nodeMap.get(edge.tgt);
    if (src && tgt) {
      const existing = relationshipStore.findAll().find(
        e => e.sourceEntityId === src.id && e.targetEntityId === tgt.id
      );
      if (!existing) {
        relationshipStore.create({
          sourceEntityId: src.id,
          targetEntityId: tgt.id,
          relationshipType: edge.type as any,
          family: edge.family as any,
          confidence: 1.0,
          verification: 'expert_verified',
          createsConversionPath: true,
          conversionPathDelta: 1,
          authorityFlowWeight: 1.0
        });
        console.log(`🔗 Routed ${edge.src} -> ${edge.tgt}`);
      }
    }
  }

  console.log('🎉 NFAK Discovery Network successfully injected and wired!');
}

run().catch(console.error);
