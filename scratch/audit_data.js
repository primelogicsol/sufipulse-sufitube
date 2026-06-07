const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), '.data');

function analyzeFile(filename) {
  const filepath = path.join(dataDir, filename);
  if (!fs.existsSync(filepath)) return null;
  try {
    const raw = fs.readFileSync(filepath, 'utf-8');
    const data = JSON.parse(raw);
    const count = Array.isArray(data) ? data.length : (data.entities ? data.entities.length : Object.keys(data).length);
    
    // Sample the first item to get its schema
    let sample = Array.isArray(data) ? data[0] : (data.entities ? data.entities[0] : null);
    if (!sample && !Array.isArray(data)) {
        sample = data[Object.keys(data)[0]];
    }

    // Try to find types/classes
    let classes = new Set();
    if (Array.isArray(data)) {
        data.forEach(item => {
            if (item.class) classes.add(item.class);
            if (item.type) classes.add(item.type);
            if (item.entityType) classes.add(item.entityType);
        });
    }

    return { filename, count, classes: Array.from(classes), sampleKeys: sample ? Object.keys(sample) : [] };
  } catch (e) {
    return { filename, error: e.message };
  }
}

const filesToAudit = [
  'atlas_entities.json',
  'atlas_relationships.json',
  'cms-releases.json',
  'knowledge-registry.json',
  'vocalists.json',
  'writers.json',
  'constitutional_core.json'
];

const results = filesToAudit.map(analyzeFile);
console.log(JSON.stringify(results, null, 2));
