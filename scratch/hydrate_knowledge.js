const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), '.data');
const outputFile = path.join(dataDir, 'unified_knowledge.json');

const loadJson = (filename) => {
  try {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) return [];
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Array.isArray(data) ? data : (data.nodes || data.items || []);
  } catch (err) {
    console.error(`Failed to load ${filename}:`, err);
    return [];
  }
};

const atlasEntities = loadJson('atlas_entities.json');
const atlasRelationships = loadJson('atlas_relationships.json');
const cmsReleases = loadJson('cms-releases.json');
const constitutionalCore = loadJson('constitutional_core.json');
const knowledgeRegistry = loadJson('knowledge-registry.json');
const writers = loadJson('writers.json');
const vocalists = loadJson('vocalists.json');
const articles = loadJson('articles.json');

const unifiedMap = new Map();

const idMap = new Map(); // Maps original ID to merged ID

// Fuzzy matcher helper
const findExistingEntity = (title, aliases) => {
  const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z]/g, '');
  const tNorm = normalize(title);
  const aNorms = (aliases || []).map(normalize).filter(Boolean);
  
  if (!tNorm && aNorms.length === 0) return null;
  
  for (const [id, entity] of unifiedMap.entries()) {
    const eNorm = normalize(entity.title);
    const eaNorms = (entity.aliases || []).map(normalize).filter(Boolean);
    
    if (!eNorm && eaNorms.length === 0) continue;
    
    const isRumiMatch = (tNorm.includes('rumi') && eNorm.includes('rumi'));
    
    if (isRumiMatch || (tNorm && tNorm === eNorm) || (tNorm && eaNorms.includes(tNorm)) || (eNorm && aNorms.includes(eNorm))) {
      return id;
    }
  }
  return null;
};

// 1. Load Constitutional Core
constitutionalCore.forEach(c => {
  const id = c.id || c.slug;
  idMap.set(id, id);
  unifiedMap.set(id, {
    id: id,
    slug: c.slug,
    title: c.name || c.title,
    class: c.class === 'persons' ? 'person' : c.class,
    classes: [c.class === 'persons' ? 'person' : c.class],
    summary: c.canonicalImpact || '',
    aliases: c.aliases || [],
    source: 'constitutional_core',
    readinessScore: 100,
    resilienceScore: 100,
    evidenceRecords: c.evidenceRecords || 0,
    relationships: [],
    metadata: {},
    sections: {
      overview: c.canonicalImpact || '',
      biography: '',
      questions: []
    }
  });
});

// 2. Load Atlas Entities
atlasEntities.forEach(a => {
  const matchId = findExistingEntity(a.canonicalName || a.title || a.name || a.id, a.alternateNames || a.aliases);
  const id = matchId || a.id;
  idMap.set(a.id, id);

  if (!unifiedMap.has(id)) {
    unifiedMap.set(id, {
      id: id,
      slug: a.slug || a.id,
      title: a.canonicalName || a.title || a.name || a.id,
      class: a.entityType || a.type || a.class || 'concept',
      classes: [a.entityType || a.type || a.class || 'concept'],
      summary: a.shortDescription || a.description || a.summary || '',
      aliases: a.alternateNames || a.aliases || [],
      source: 'atlas',
      readinessScore: a.audienceCaptureScore || a.readinessScore || 70,
      resilienceScore: a.strategicGPS || a.resilienceScore || 70,
      verificationStatus: a.verificationStatus || 'unverified',
      confidenceLayer: a.confidenceLayer || 'bronze',
      disputeStatus: a.disputeStatus || 'none',
      evidenceRecords: a.sourceReferences?.length || a.evidenceRecords || 0,
      relationships: [],
      metadata: a.metadata || {},
      sections: {
        overview: a.longDescription || a.description || '',
        biography: '',
        questions: []
      }
    });
  } else {
    // Merge
    const existing = unifiedMap.get(id);
    existing.summary = existing.summary || a.shortDescription;
    existing.sections.overview = existing.sections.overview || a.longDescription;
    const aClass = a.entityType || a.type || a.class;
    if (aClass) {
      existing.classes = existing.classes || [existing.class];
      if (!existing.classes.includes(aClass)) existing.classes.push(aClass);
    }
    if (a.alternateNames) existing.aliases = [...new Set([...existing.aliases, ...a.alternateNames])];
  }
});

// 3. Load CMS Releases
cmsReleases.forEach(r => {
  const id = `release_${r.id || r.youtubeStats?.title?.replace(/\s+/g, '_').toLowerCase() || Math.random().toString(36).substr(2, 9)}`;
  idMap.set(r.id, id);
  unifiedMap.set(id, {
    id: id,
    slug: r.youtubeStats?.title ? encodeURIComponent(r.youtubeStats.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')) : id,
    title: r.youtubeStats?.title || 'Unknown Release',
    class: 'release',
    summary: r.youtubeStats?.title || 'Studio Release',
    longDescription: r.lyrics || '',
    source: 'cms-releases',
    readinessScore: 90,
    resilienceScore: 85,
    verificationStatus: 'verified',
    confidenceLayer: 'gold',
    disputeStatus: 'none',
    evidenceRecords: 1,
    relationships: [],
    metadata: { 
      youtubeId: r.youtubeStats?.youtubeId || r.youtubeVideoId || r.youtubeStats?.videoId || r.youtubeStats?.url?.split('v=')[1] || '', 
      duration: r.youtubeStats?.durationFormatted || r.youtubeStats?.duration || 0,
      views: r.youtubeStats?.viewCount || r.views || 0,
      thumbnailUrl: r.youtubeStats?.thumbnailUrl || r.thumbnailUrl || ''
    },
    sections: {
      overview: r.description || r.youtubeStats?.description || '',
      biography: '',
      questions: []
    }
  });
});

// 4. Load Knowledge Registry
knowledgeRegistry.forEach(k => {
  const matchId = findExistingEntity(k.name || k.title, k.alternateNames);
  const id = matchId || k.id || k.slug;
  idMap.set(k.id, id);
  if (k.slug) idMap.set(k.slug, id);
  
  if (!unifiedMap.has(id)) {
    unifiedMap.set(id, {
      id: id,
      slug: k.slug || k.id,
      title: k.name || k.title,
      class: k.type || 'concept',
      classes: [k.type || 'concept'],
      summary: k.shortDescription || '',
      aliases: k.alternateNames || [],
      source: 'knowledge_registry',
      readinessScore: k.knowledgeDensityScore || 50,
      resilienceScore: 50,
      evidenceRecords: k.sameAs?.length || 0,
      relationships: [],
      metadata: { wikidataId: k.wikidataId, sameAs: k.sameAs },
      sections: {
        overview: k.shortDescription || '',
        biography: k.longDescription || '',
        contributions: k.theologicalNotes || '',
        questions: []
      }
    });
  } else {
    // Merge if it already exists (e.g. from atlas or constitutional_core)
    const existing = unifiedMap.get(id);
    existing.summary = existing.summary || k.shortDescription;
    existing.longDescription = existing.longDescription || k.longDescription;
    existing.sections.biography = k.longDescription || existing.sections.biography;
    existing.sections.contributions = k.theologicalNotes || existing.sections.contributions;
    existing.evidenceRecords = existing.evidenceRecords || (k.sameAs?.length || 0);
    existing.metadata = { ...existing.metadata, wikidataId: k.wikidataId, sameAs: k.sameAs };
    if (k.type) {
      existing.classes = existing.classes || [existing.class];
      if (!existing.classes.includes(k.type)) {
        existing.classes.push(k.type);
      }
    }
    if (k.alternateNames) existing.aliases = [...new Set([...existing.aliases, ...k.alternateNames])];
  }
});

// 5. Load Writers
writers.forEach(w => {
  const id = w.id || w.pen_name || w.full_name;
  const slug = id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const matchId = findExistingEntity(w.pen_name || w.full_name, []);
  const finalId = matchId || id;
  idMap.set(id, finalId);

  if (!unifiedMap.has(finalId)) {
    unifiedMap.set(finalId, {
      id: finalId,
      slug: slug,
      title: w.pen_name ? `${w.full_name} (${w.pen_name})` : w.full_name,
      class: 'writer',
      summary: w.writing_styles || 'Literary Contributor',
      longDescription: w.sample_kalam || '',
      source: 'writers_registry',
      readinessScore: 85,
      resilienceScore: 80,
      verificationStatus: 'verified',
      confidenceLayer: 'silver',
      disputeStatus: 'none',
      evidenceRecords: 0,
      relationships: [],
      metadata: {
        country: w.country,
        city: w.city,
        experience: w.years_experience,
        languages: w.primary_languages
      },
      sections: {
        overview: w.literary_background || '',
        biography: w.thematic_focus || '',
        contributions: w.previous_publications || '',
        questions: []
      }
    });
  } else {
    const existing = unifiedMap.get(finalId);
    existing.longDescription = existing.longDescription || w.sample_kalam || '';
  }
});

// 6. Load Vocalists
vocalists.forEach(v => {
  const id = v.id || v.performance_name || v.full_name;
  const slug = id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const matchId = findExistingEntity(v.performance_name || v.full_name, []);
  const finalId = matchId || id;
  idMap.set(id, finalId);

  if (!unifiedMap.has(finalId)) {
    unifiedMap.set(finalId, {
      id: finalId,
      slug: slug,
      title: v.performance_name ? `${v.full_name} (${v.performance_name})` : v.full_name,
      class: 'singer',
      summary: v.performance_styles || 'Vocalist',
      longDescription: v.sample_link ? `Sample: ${v.sample_link}` : '',
      source: 'vocalists_registry',
      readinessScore: 85,
      resilienceScore: 80,
      verificationStatus: 'verified',
      confidenceLayer: 'silver',
      disputeStatus: 'none',
      evidenceRecords: 0,
      relationships: [],
      metadata: {
        country: v.country,
        city: v.city,
        experience: v.years_experience,
        languages: v.languages_performed,
        vocalRange: v.vocal_range
      },
      sections: {
        overview: v.musical_training || '',
        biography: '',
        contributions: '',
        questions: []
      }
    });
  }
});

// 7. Load Articles
articles.forEach(a => {
  const id = a.id || a.slug;
  const matchId = findExistingEntity(a.title, []);
  const finalId = matchId || id;
  idMap.set(a.id, finalId);

  if (!unifiedMap.has(finalId)) {
    unifiedMap.set(finalId, {
      id: finalId,
      slug: a.slug || id,
      title: a.title,
      class: 'article',
      summary: a.abstract || '',
      longDescription: a.content || '',
      source: 'articles_registry',
      readinessScore: 90,
      resilienceScore: 90,
      verificationStatus: 'verified',
      confidenceLayer: 'gold',
      disputeStatus: 'none',
      evidenceRecords: 0,
      relationships: [],
      metadata: {
        author: a.author_name,
        country: a.author_country,
        tags: a.tags
      },
      sections: {
        overview: a.abstract || '',
        biography: a.content || '',
        contributions: '',
        questions: []
      }
    });
  }
});

// Connect Relationships using idMap
atlasRelationships.forEach(rel => {
  const mappedSource = idMap.get(rel.source) || rel.source;
  const mappedTarget = idMap.get(rel.target) || rel.target;
  
  const sourceNode = unifiedMap.get(mappedSource);
  const targetNode = unifiedMap.get(mappedTarget);
  
  if (rel.id === 'rel_rumi_ibnarabi') {
    console.log('DEBUG REL:', rel.source, '->', mappedSource, 'target:', rel.target, '->', mappedTarget);
    console.log('SourceNode exists?', !!sourceNode, 'TargetNode exists?', !!targetNode);
  }
  
  if (sourceNode && targetNode && mappedSource !== mappedTarget) {
    sourceNode.relationships.push({
      type: 'outgoing',
      relation: rel.type,
      target: mappedTarget
    });
    targetNode.relationships.push({
      type: 'incoming',
      relation: rel.type,
      target: mappedSource
    });
  }
});

// Derived Questions
unifiedMap.forEach(entity => {
  if (!entity.sections) entity.sections = { overview: '', biography: '', questions: [] };
  if (!entity.sections.questions) entity.sections.questions = [];
  
  if (entity.class === 'singer' || entity.class === 'song' || entity.class === 'poet') {
    entity.sections.questions.push({ q: `What is the historical significance of ${entity.title}?`, status: 'needs_verification' });
    entity.sections.questions.push({ q: `Who are the primary inheritors of the tradition associated with ${entity.title}?`, status: 'needs_verification' });
  }
});

// Ensure all entities have classes array, normalize to lowercase, deduplicate
const finalEntities = Array.from(unifiedMap.values()).map(e => {
  e.class = (e.class || 'concept').toLowerCase();
  if (!e.classes) {
    e.classes = [e.class];
  }
  e.classes = [...new Set(e.classes.map(c => c.toLowerCase()))];
  return e;
});

const outputPath = path.join(__dirname, '../.data/unified_knowledge.json');
fs.writeFileSync(outputPath, JSON.stringify(finalEntities, null, 2));

console.log({
  totalEntitiesLoaded: atlasEntities.length,
  totalRelationshipsLoaded: atlasRelationships.length,
  totalReleasesLoaded: cmsReleases.length,
  totalRegistryLoaded: knowledgeRegistry.length,
  totalWritersLoaded: writers.length,
  totalVocalistsLoaded: vocalists.length,
  totalArticlesLoaded: articles.length,
  totalUnifiedEntities: finalEntities.length,
  songs: finalEntities.filter(e => e.class === 'song').length,
  singers: finalEntities.filter(e => e.class === 'singer').length,
  articles: finalEntities.filter(e => e.class === 'article').length,
  writers: finalEntities.filter(e => e.class === 'writer').length,
  concepts: finalEntities.filter(e => e.class === 'concept').length,
  derivedQuestions: finalEntities.reduce((acc, curr) => acc + (curr.sections?.questions?.length || 0), 0)
});
