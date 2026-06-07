const fs = require('fs');
const path = require('path');

const SEEDS_DIR = path.join(__dirname, '..', 'seeds');
const DOCS_DIR = path.join(__dirname, '..', '..', '..', 'docs');

const songs = require(path.join(SEEDS_DIR, 'gold_songs.json'));
const writers = require(path.join(SEEDS_DIR, 'gold_writers.json'));
const singers = require(path.join(SEEDS_DIR, 'gold_singers.json'));
const concepts = require(path.join(SEEDS_DIR, 'gold_concepts.json'));
const languages = require(path.join(SEEDS_DIR, 'seed_languages.json'));
const regions = require(path.join(SEEDS_DIR, 'seed_regions.json'));
const qa = require(path.join(SEEDS_DIR, 'gold_questions.json'));
const sources = require(path.join(SEEDS_DIR, 'gold_sources.json'));

const langMap = new Map(languages.map(l => [l.id, l.name.toLowerCase()]));
const regMap = new Map(regions.map(r => [r.id, r.name.toLowerCase()]));

// Targeted Categories for Analysis
const geoTargets = {
  'Persian': ['khorasan', 'shiraz', 'isfahan', 'tabriz', 'nishapur', 'balkh'],
  'Turkish': ['anatolia', 'konya', 'istanbul'],
  'Arabic': ['baghdad', 'basra', 'mecca', 'medina', 'damascus', 'cairo', 'aleppo'],
  'Central Asian': ['bukhara', 'samarkand', 'herat'],
  'South Asian': ['punjab', 'sindh', 'delhi', 'ajmer', 'kashmir', 'multan', 'lahore', 'karachi'],
  'Balkan': ['bosnia', 'albania', 'kosovo'],
  'African': ['senegal', 'morocco', 'west africa', 'north africa', 'east africa'],
  'Western': ['europe', 'america']
};

const traditionTargets = ['chishti', 'qadiri', 'naqshbandi', 'suhrawardi', 'mevlevi', 'shadhili', 'rifa\'i', 'bektashi'];

const langTargets = ['arabic', 'persian', 'urdu', 'punjabi', 'kashmiri', 'turkish', 'sindhi', 'pashto', 'saraiki', 'english'];

const geoCounts = {}; Object.keys(geoTargets).forEach(k => geoCounts[k] = 0);
const tradCounts = {}; traditionTargets.forEach(k => tradCounts[k] = 0);
const langCounts = {}; langTargets.forEach(k => langCounts[k] = 0);

// Helper to categorize regions
function getGeoCategory(regId) {
  const name = regMap.get(regId) || '';
  for (const [cat, keywords] of Object.entries(geoTargets)) {
    if (keywords.some(k => name.includes(k))) return cat;
  }
  return 'Other';
}

// 1. Analyze Writers
writers.forEach(w => {
  (w.regionIds || []).forEach(r => {
    const cat = getGeoCategory(r);
    if (geoCounts[cat] !== undefined) geoCounts[cat]++;
  });
  
  const bio = (w.biography || '').toLowerCase();
  const order = (w.associatedOrder || '').toLowerCase();
  traditionTargets.forEach(t => {
    if (bio.includes(t) || order.includes(t)) tradCounts[t]++;
  });
});

// 2. Analyze Songs for Languages
songs.forEach(s => {
  (s.languageIds || []).forEach(l => {
    const name = langMap.get(l) || '';
    langTargets.forEach(t => {
      if (name.includes(t)) langCounts[t]++;
    });
  });
});

const totalEntities = songs.length + writers.length + singers.length + concepts.length;

// Generate Report
let md = `# COVERAGE GAP ANALYSIS — Phase 5A

## Current Database Scale
* **Songs:** ${songs.length} / 1000
* **Writers:** ${writers.length} / 250
* **Singers:** ${singers.length} / 250
* **Concepts:** ${concepts.length} / 250
* **Sources:** ${sources.length} / 500+
* **Questions:** ${qa.length} / 25000+

---

## 1. Geographic Coverage (Based on Writer Origins)

| Region | Count | Status |
|---|---|---|
`;
Object.keys(geoCounts).forEach(k => {
  const c = geoCounts[k];
  let status = c > 10 ? 'Healthy' : (c > 0 ? 'Sparse' : 'CRITICAL GAP');
  md += `| ${k} | ${c} | ${status} |\n`;
});

md += `
## 2. Tradition Coverage (Based on Writer Lineages)

| Sufi Order | Count | Status |
|---|---|---|
`;
Object.keys(tradCounts).forEach(k => {
  const c = tradCounts[k];
  let status = c > 5 ? 'Healthy' : (c > 0 ? 'Sparse' : 'CRITICAL GAP');
  md += `| ${k.charAt(0).toUpperCase() + k.slice(1)} | ${c} | ${status} |\n`;
});

md += `
## 3. Language Coverage (Based on Song Compositions)

| Language | Count | Status |
|---|---|---|
`;
Object.keys(langCounts).forEach(k => {
  const c = langCounts[k];
  let status = c > 15 ? 'Healthy' : (c > 0 ? 'Sparse' : 'CRITICAL GAP');
  md += `| ${k.charAt(0).toUpperCase() + k.slice(1)} | ${c} | ${status} |\n`;
});

md += `
---

## Authority Density Baseline
*Average Density Metrics across current active entities:*
* Average Songs per Writer: ${(songs.length / writers.length).toFixed(1)}
* Average Questions per Entity: ${(qa.length / totalEntities).toFixed(1)}
* Source Depth: ${(qa.reduce((acc, q) => acc + q.sourceIds.length, 0) / qa.length).toFixed(1)} sources per answer

## Expansion Strategy (Phase 5B Priority)
1. **Targeting Geographic Gaps:** Heavy focus on missing African, Balkan, and Western Sufi representations.
2. **Targeting Tradition Gaps:** Expansion into Bektashi, Shadhili, and Rifa'i orders.
3. **Targeting Language Gaps:** English, Kashmiri, Pashto, and Turkish need massive augmentation.
`;

fs.writeFileSync(path.join(DOCS_DIR, 'COVERAGE_GAPS.md'), md, 'utf-8');
console.log('Coverage Gaps Analysis generated successfully.');
