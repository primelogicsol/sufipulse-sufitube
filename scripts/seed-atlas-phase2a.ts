/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE ATLAS — Phase 2A Seeder
 * ═══════════════════════════════════════════════════════════════════
 * Seeds 200 entities, 2,500+ relationships, runs GPS, and detects orphans.
 */

import { entityStore } from '../lib/atlas/atlas-entity';
import { relationshipStore } from '../lib/atlas/atlas-relationship';
import { domainStore } from '../lib/atlas/atlas-domain';
import { STRATEGIC_DOMAINS } from '../lib/atlas/atlas-strategic-domains';
import { calculateStrategicGPS, calculateAdvantageScore, calculateConnectionScore } from '../lib/atlas/atlas-scoring-engine';
import { buildGraphIndex, calculateHopsToContent, findOrphans, calculateGraphStats } from '../lib/atlas/atlas-graph-engine';
import type { AtlasEntity, EntityType, StrategicDomainId, RecommendedAction } from '../lib/atlas/atlas-types';
import { db, generateId } from '../lib/database';

async function seedPhase2A() {
  console.log('🌱 Starting Phase 2A Seed...');

  // 1. Seed Domains
  domainStore.seedInitialDomains();

  // Wipe existing Atlas data for clean seed
  console.log('🧹 Wiping existing Atlas data...');
  db.table('atlas_entities').deleteMany({});
  db.table('atlas_relationships').deleteMany({});

  // 2. Create "SufiPulse Originals" Anchor Entities (Hop 0)
  // This gives the graph something to connect to for Hop calculation.
  console.log('🔗 Creating SufiPulse Anchor Entities...');
  
  const anchorReleases = [
    { name: 'SufiPulse: Tajdar-e-Haram Interpretation', type: 'release' as EntityType, videoId: 'v_tajdar' },
    { name: 'SufiPulse: Rumi Session', type: 'release' as EntityType, videoId: 'v_rumi' },
    { name: 'SufiPulse: Qawwali Masterclass', type: 'release' as EntityType, videoId: 'v_qawwali' },
    { name: 'SufiPulse: Kashmiri Sufiana Demo', type: 'release' as EntityType, videoId: 'v_kashmiri' },
    { name: 'SufiPulse: Guide to Sufi Saints', type: 'publication' as EntityType, videoId: 'v_guide' },
  ];

  const anchorIds: string[] = [];

  for (const anchor of anchorReleases) {
    const entity = entityStore.create({
      entityType: anchor.type,
      canonicalName: anchor.name,
      alternateNames: [],
      nameTransliterations: {},
      nameTranslations: {},
      shortDescription: `Original SufiPulse content: ${anchor.name}`,
      longDescription: `Full details of original SufiPulse content: ${anchor.name}. This serves as a primary conversion anchor.`,
      connectionScore: 100,
      authorityOpportunityScore: 50,
      audienceCaptureScore: 100,
      seedAuthorityScore: 20,
      advantageScore: 100,
      strategicGPS: 100,
      contentGapScore: 35,
      winProbability: 30,
      competitionLevel: 'none',
      conversionTier: 1,
      hopsToSufiPulseContent: 0,
      hopsToYouTube: 0,
      sufipulseJustification: 'This is an original SufiPulse production.',
      connectedReleaseIds: [],
      connectedVideoIds: [anchor.videoId],
      connectedArticleIds: [],
      recommendedAsset: { assetType: 'release' },
      primaryDomain: 'sufipulse-originals',
      sameAs: [],
      sourceReferences: [],
      schemaType: 'MusicRelease',
      status: 'published',
      isPublic: true,
      isActive: true,
      verificationStatus: 'institutional_verified',
      recommendedAction: 'publish'
    });
    anchorIds.push(entity.id);
  }

  // 3. Generate 200 Entities
  console.log('👥 Generating 200 Seed Entities...');
  
  const entities: AtlasEntity[] = [];
  const registries = [
    { type: 'artist' as EntityType, prefix: 'Singer', domain: 'global-discovery', count: 25 },
    { type: 'album' as EntityType, prefix: 'Album', domain: 'global-discovery', count: 25 },
    { type: 'channel' as EntityType, prefix: 'Channel', domain: 'global-discovery', count: 25 },
    { type: 'saint' as EntityType, prefix: 'Saint', domain: 'sufi-saints', count: 25 },
    { type: 'poet' as EntityType, prefix: 'Poet', domain: 'sufi-poetry', count: 25 },
    { type: 'song' as EntityType, prefix: 'Song', domain: 'global-discovery', count: 25 },
    { type: 'concept' as EntityType, prefix: 'Concept', domain: 'sufi-concepts', count: 25 },
    { type: 'tradition' as EntityType, prefix: 'Tradition', domain: 'sufi-heritage', count: 25 },
  ];

  // Some real names mixed in for realism
  const realNames: Record<string, string[]> = {
    'artist': ['Nusrat Fateh Ali Khan', 'Abida Parveen', 'Rahat Fateh Ali Khan', 'Sabri Brothers', 'Sain Zahoor'],
    'saint': ['Jalaluddin Rumi', 'Moinuddin Chishti', 'Data Ganj Bakhsh', 'Lal Shahbaz Qalandar'],
    'poet': ['Bulleh Shah', 'Amir Khusro', 'Shah Abdul Latif Bhittai', 'Sultan Bahu'],
    'song': ['Tajdar-e-Haram', 'Dam Mast Qalandar', 'Allah Hoo', 'Kun Faya Kun'],
    'concept': ['Fana', 'Baqa', 'Ishq-e-Haqiqi', 'Sama'],
    'tradition': ['Qawwali', 'Sufiana Kalam', 'Kafi', 'Mevlevi'],
    'album': ['Mustt Mustt', 'Shahen-Shah', 'Raqs-e-Bismil'],
    'channel': ['Coke Studio', 'SUFISCORE', 'SufiPulse-USA']
  };

  for (const reg of registries) {
    const reals = realNames[reg.type] || [];
    for (let i = 0; i < reg.count; i++) {
      const isReal = i < reals.length;
      const name = isReal ? reals[i] : `${reg.prefix} ${i + 1}`;
      
      const seedAuthorityScore = isReal ? 90 : Math.floor(Math.random() * 50) + 30;
      const authorityOpportunityScore = isReal ? 85 : Math.floor(Math.random() * 50) + 20;
      const audienceCaptureScore = isReal ? 80 : Math.floor(Math.random() * 40) + 40;
      const contentGapScore = Math.floor(Math.random() * 20) + 10;
      const winProbability = Math.floor(Math.random() * 20) + 10;
      const advantageScore = calculateAdvantageScore(contentGapScore, winProbability, 15, 10);
      
      // Start connection score at 0, will recalculate after graph is built
      const strategicGPS = calculateStrategicGPS(0, authorityOpportunityScore, audienceCaptureScore, seedAuthorityScore, advantageScore);
      
      const entity = entityStore.create({
        entityType: reg.type,
        canonicalName: name,
        alternateNames: [],
        nameTransliterations: {},
        nameTranslations: {},
        shortDescription: `A prominent ${reg.type} in the global Sufi ecosystem.`,
        longDescription: `Detailed information about ${name}, a major ${reg.type}. This entity was seeded during Phase 2A to map the global search universe.`,
        connectionScore: 0,
        authorityOpportunityScore,
        audienceCaptureScore,
        seedAuthorityScore,
        advantageScore,
        strategicGPS,
        contentGapScore,
        winProbability,
        competitionLevel: 'moderate',
        conversionTier: 5,
        hopsToSufiPulseContent: Infinity,
        hopsToYouTube: Infinity,
        sufipulseJustification: 'High search volume and thematic relevance to SufiPulse catalog.',
        connectedReleaseIds: [],
        connectedVideoIds: [],
        connectedArticleIds: [],
        recommendedAsset: { assetType: 'production_candidate' },
        primaryDomain: reg.domain as StrategicDomainId,
        sameAs: [],
        sourceReferences: ['https://wikipedia.org', 'https://youtube.com'],
        schemaType: 'Thing',
        status: 'draft',
        isPublic: false,
        isActive: true,
        verificationStatus: 'web_verified',
        recommendedAction: 'productionCandidate'
      });
      entities.push(entity);
    }
  }

  // 4. Create Dense Relationships (~2,500 edges)
  console.log('🕸️ Weaving Graph Connections (2,500+ edges)...');
  let edgeCount = 0;

  // First, connect high-authority nodes to anchors to establish conversion paths
  for (const entity of entities) {
    if (Math.random() < 0.30 || entity.seedAuthorityScore > 80) {
      let type: any = 'featured_in_release';
      if (['concept', 'tradition', 'region', 'language'].includes(entity.entityType)) type = 'tagged_in_release';
      if (['saint', 'channel', 'album'].includes(entity.entityType)) type = 'discussed_in_article';

      const validAnchors = anchorIds.filter(id => {
        const a = entityStore.findById(id);
        if (type === 'discussed_in_article') return a?.entityType === 'publication';
        return a?.entityType === 'release';
      });

      if (validAnchors.length > 0) {
        const anchor = validAnchors[Math.floor(Math.random() * validAnchors.length)];
        try {
          relationshipStore.create({
            sourceEntityId: entity.id,
            targetEntityId: anchor,
            relationshipType: type,
            confidence: 1.0,
            verification: 'institutional_verified'
          });
          edgeCount++;
        } catch(e) {
          // Ignore constraint violations
        }
      }
    }

    // Connect to 10-15 random entities to build density
    const numEdges = Math.floor(Math.random() * 5) + 10;
    for (let i = 0; i < numEdges; i++) {
      const target = entities[Math.floor(Math.random() * entities.length)];
      if (target.id === entity.id) continue;
      
      // Determine valid relationship type based on constraints
      let type: any = 'related_to';
      if (entity.entityType === 'song' && target.entityType === 'artist') type = 'performed_by';
      if (entity.entityType === 'song' && target.entityType === 'poet') type = 'written_by';
      if (entity.entityType === 'artist' && target.entityType === 'tradition') type = 'belongs_to_tradition';
      
      try {
        relationshipStore.create({
          sourceEntityId: entity.id,
          targetEntityId: target.id,
          relationshipType: type,
          confidence: 0.8,
          verification: 'web_verified'
        });
        edgeCount++;
      } catch (e) {
        // Ignore duplicate edge errors
      }
    }
  }
  
  console.log(`✅ Created ${edgeCount} relationships.`);

  // 5. Run GPS & Graph Engine
  console.log('🧠 Running Graph Engine (Pathfinding & GPS)...');
  
  const allEntities = entityStore.findAll();
  const allEdges = relationshipStore.findAll();
  const graph = buildGraphIndex(allEntities, allEdges);

  let orphanCountBefore = 0;
  
  for (const entity of allEntities) {
    if (entity.hopsToSufiPulseContent === 0) continue; // Skip anchors

    const hops = calculateHopsToContent(entity.id, graph);
    if (hops > 3) orphanCountBefore++;

    // Calculate connection score based on hops
    const connectionScore = calculateConnectionScore({
      directReleaseCount: hops === 1 ? 1 : 0,
      directVideoCount: hops === 1 ? 1 : 0,
      directArticleCount: 0,
      indirectPathHops: hops,
      estimatedSearchVolume: entity.seedAuthorityScore * 1000,
      isInCoreTopicCluster: true
    });

    // Update entity
    const strategicGPS = calculateStrategicGPS(
      connectionScore,
      entity.authorityOpportunityScore,
      entity.audienceCaptureScore,
      entity.seedAuthorityScore,
      entity.advantageScore
    );

    entityStore.update(entity.id, {
      hopsToSufiPulseContent: hops,
      hopsToYouTube: hops,
      connectionScore,
      strategicGPS,
      conversionTier: hops === 1 ? 2 : hops === 2 ? 3 : hops === 3 ? 4 : 5
    });
  }

  const updatedGraph = buildGraphIndex(entityStore.findAll(), relationshipStore.findAll());
  const stats = calculateGraphStats(updatedGraph, relationshipStore.findAll());
  
  console.log('──────────────────────────────────────────────────');
  console.log('📊 SPRINT 2 RESULTS');
  console.log(`   Entities:     ${stats.totalEntities}`);
  console.log(`   Edges:        ${stats.totalEdges}`);
  console.log(`   Avg Hops:     ${stats.averageHops} (Target <= 1.6)`);
  console.log(`   Orphan Rate:  ${stats.orphanRate}% (Target < 10%)`);
  console.log(`   Avg GPS:      ${stats.averageGPS}`);
  console.log('──────────────────────────────────────────────────');
  
  if (stats.orphanRate > 10 || stats.averageHops > 1.6) {
    console.log('⚠️ Graph density is slightly off-target. In a real scenario, we would inject more content edges.');
  } else {
    console.log('🎯 Graph metrics achieved successfully.');
  }

}

seedPhase2A().catch(console.error);
