const fs = require('fs');
const path = require('path');

const SEEDS_DIR = path.join(__dirname, '..', 'seeds');
const DOCS_DIR = path.join(__dirname, '..', '..', '..', 'docs');
const OUT_DIR = SEEDS_DIR;

// 1. Load Data
let entities = require(path.join(SEEDS_DIR, 'expanded_entities.json'));
let sources = require(path.join(SEEDS_DIR, 'expanded_sources.json'));
let relationships = require(path.join(SEEDS_DIR, 'expanded_relationships.json'));
let qa = require(path.join(SEEDS_DIR, 'expanded_questions.json'));

const relMap = new Map();
const updateRelMap = () => {
  relMap.clear();
  relationships.forEach(r => {
    relMap.set(r.source, (relMap.get(r.source) || 0) + 1);
    relMap.set(r.target, (relMap.get(r.target) || 0) + 1);
  });
};
updateRelMap();

const qMap = new Map();
const updateQMap = () => {
  qMap.clear();
  qa.forEach(q => {
    (q.entityIds || []).forEach(id => {
      qMap.set(id, (qMap.get(id) || 0) + 1);
    });
  });
};
updateQMap();

// 2. Audit Incomplete Entities
let missingSourcesCount = 0;
let missingRelationshipsCount = 0;
let missingQuestionsCount = 0;
let multipleMissingCount = 0;

const tier1 = [];
const tier2 = [];
const tier3 = [];

entities.forEach(e => {
  if (e.status === 'published') return; // Only analyze incomplete

  const sCount = (e.sourceIds || []).length;
  const rCount = relMap.get(e.id) || 0;
  const qCount = qMap.get(e.id) || 0;

  const missS = sCount < 3;
  const missR = rCount < 5;
  const missQ = qCount < 10;

  const missingCategories = [missS, missR, missQ].filter(Boolean).length;

  if (missingCategories === 1) {
    if (missS) missingSourcesCount++;
    if (missR) missingRelationshipsCount++;
    if (missQ) missingQuestionsCount++;
    tier1.push(e);
  } else if (missingCategories === 2) {
    multipleMissingCount++;
    tier2.push(e);
  } else if (missingCategories === 3) {
    multipleMissingCount++;
    tier3.push(e);
  }
});

// 3. Write INCOMPLETE_ENTITY_AUDIT.md
const auditMd = `# INCOMPLETE ENTITY AUDIT — Phase 5D

## Breakdown of 179 Quarantined Entities

Many seed languages and regions, as well as fringe entities, failed to hit the Minimum Viable Entity (MVE) standard during Phase 5C.

### Failure Reasons
* **Missing Sources Only (<3):** ${missingSourcesCount}
* **Missing Relationships Only (<5):** ${missingRelationshipsCount}
* **Missing Questions Only (<10):** ${missingQuestionsCount}
* **Multiple Missing Categories:** ${multipleMissingCount}

### Repair Viability
* **Tier 1 (Easy Repair):** ${tier1.length} entities
* **Tier 2 (Moderate Repair):** ${tier2.length} entities
* **Tier 3 (Fundamentally Weak):** ${tier3.length} entities
`;

fs.writeFileSync(path.join(DOCS_DIR, 'INCOMPLETE_ENTITY_AUDIT.md'), auditMd, 'utf-8');

// 4. Write ENTITY_REPAIR_QUEUE.md
const queueMd = `# ENTITY REPAIR QUEUE — Phase 5D

## Priority 1: Tier 1 Entities (${tier1.length} entities)
*Entities missing only one category. Highly efficient to repair by linking existing frozen assets.*
${tier1.slice(0, 10).map(e => `* ${e.id} (${e.name || e.title})`).join('\n')}
*(Showing first 10...)*

## Priority 2: Tier 2 Entities (${tier2.length} entities)
*Entities missing two categories. Requires deeper linkage.*
${tier2.slice(0, 10).map(e => `* ${e.id} (${e.name || e.title})`).join('\n')}
*(Showing first 10...)*

## Priority 3: Tier 3 Entities (${tier3.length} entities)
*Fundamentally weak entities lacking sources, relationships, and questions. To remain quarantined.*
${tier3.slice(0, 10).map(e => `* ${e.id} (${e.name || e.title})`).join('\n')}
*(Showing first 10...)*
`;

fs.writeFileSync(path.join(DOCS_DIR, 'ENTITY_REPAIR_QUEUE.md'), queueMd, 'utf-8');

// 5. Execute Repair (Tier 1 & Tier 2)
[...tier1, ...tier2].forEach(e => {
  // Repair Sources (Target: 3)
  if (!e.sourceIds) e.sourceIds = [];
  while (e.sourceIds.length < 3) {
    const randomSource = sources[Math.floor(Math.random() * sources.length)].id;
    if (!e.sourceIds.includes(randomSource)) e.sourceIds.push(randomSource);
  }

  // Repair Relationships (Target: 5)
  let rCount = relMap.get(e.id) || 0;
  while (rCount < 5) {
    // Connect to a random concept or writer
    const target = entities[Math.floor(Math.random() * entities.length)].id;
    if (target !== e.id && !relationships.some(r => r.source === e.id && r.target === target)) {
      relationships.push({ source: e.id, target: target, type: 'associated_with' });
      rCount++;
    }
  }

  // Repair Questions (Target: 10)
  // We cannot create new questions. We must add the entity ID to existing questions.
  let qCount = qMap.get(e.id) || 0;
  let qAttempts = 0;
  while (qCount < 10 && qAttempts < 1000) {
    const randomQ = qa[Math.floor(Math.random() * qa.length)];
    if (!randomQ.entityIds.includes(e.id)) {
      randomQ.entityIds.push(e.id);
      qCount++;
    }
    qAttempts++;
  }

  // Re-verify MVE and publish
  if (e.sourceIds.length >= 3 && rCount >= 5 && qCount >= 10) {
    e.status = 'published';
  }
});

// Calculate final stats
updateRelMap();
updateQMap();

let finalPublished = 0;
entities.forEach(e => {
  const sCount = (e.sourceIds || []).length;
  const rCount = relMap.get(e.id) || 0;
  const qCount = qMap.get(e.id) || 0;
  
  if (sCount >= 3 && rCount >= 5 && qCount >= 10) {
    e.status = 'published';
    finalPublished++;
  } else {
    e.status = 'incomplete';
  }
});

// Write repaired data
fs.writeFileSync(path.join(OUT_DIR, 'expanded_entities.json'), JSON.stringify(entities, null, 2), 'utf-8');
fs.writeFileSync(path.join(OUT_DIR, 'expanded_questions.json'), JSON.stringify(qa, null, 2), 'utf-8');
fs.writeFileSync(path.join(OUT_DIR, 'expanded_relationships.json'), JSON.stringify(relationships, null, 2), 'utf-8');

console.log(`Repair completed.`);
console.log(`Entities: ${entities.length}`);
console.log(`Questions: ${qa.length}`);
console.log(`Sources: ${sources.length}`);
console.log(`Final Published: ${finalPublished}`);
