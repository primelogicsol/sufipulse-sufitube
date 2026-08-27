import fs from 'node:fs';
import path from 'node:path';

const [, , basePath, headPath] = process.argv;
if (!basePath || !headPath) {
  console.error('Usage: node scripts/phase1-lint-differential.mjs <base-json> <head-json>');
  process.exit(2);
}

function load(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Unable to parse ESLint JSON ${file}:`, error);
    process.exit(2);
  }
}

function normalizeFile(filePath) {
  const relative = path.relative(process.cwd(), filePath).replaceAll('\\', '/');
  const basePrefix = '.phase1-base/';
  return relative.startsWith(basePrefix) ? relative.slice(basePrefix.length) : relative;
}

function errorCounts(results) {
  const map = new Map();
  for (const result of results) {
    const file = normalizeFile(result.filePath);
    const rules = new Map();
    for (const message of result.messages || []) {
      if (message.severity !== 2) continue;
      const rule = message.ruleId || '<fatal/config/parser>';
      rules.set(rule, (rules.get(rule) || 0) + 1);
    }
    map.set(file, rules);
  }
  return map;
}

const base = errorCounts(load(basePath));
const head = errorCounts(load(headPath));
const regressions = [];

for (const [file, headRules] of head) {
  const baseRules = base.get(file) || new Map();
  for (const [rule, headCount] of headRules) {
    const baseCount = baseRules.get(rule) || 0;
    if (headCount > baseCount) {
      regressions.push({ file, rule, baseCount, headCount, added: headCount - baseCount });
    }
  }
}

if (regressions.length > 0) {
  console.error('Phase 1 introduced new lint errors versus main:');
  for (const item of regressions) {
    console.error(` - ${item.file}: ${item.rule} ${item.baseCount} -> ${item.headCount} (+${item.added})`);
  }
  process.exit(1);
}

console.log('Phase 1 lint differential passed: no lint-error rule count increased versus main.');
