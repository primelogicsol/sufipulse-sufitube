import fs from 'node:fs';
import path from 'node:path';
import { devanagariToRoman } from '../lib/transliteration';
import { generateMultilingualPackage } from '../server/services/multilingual-pipeline';
import { exportAllSubtitles } from '../server/services/subtitle-generator';

const draftId = 'draft_1794752884539_0eb391d5';
const draftDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId);
const draftPath = path.join(draftDir, 'draft.json');

if (!fs.existsSync(draftPath)) {
  console.error(`Draft not found: ${draftPath}`);
  process.exit(1);
}

const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
console.log(`Loaded draft: ${draft.title} (${draft.draftId})`);

const lines = draft.masterTimeline?.lines || [];
console.log(`Total masterTimeline lines: ${lines.length}`);

let updatedCount = 0;
for (const line of lines) {
  if (line.isProductionDirection) continue;
  const original = line.text;
  const roman = devanagariToRoman(original);
  line.romanUrdu = roman;
  updatedCount++;
}

console.log(`Updated ${updatedCount} lines with Roman Urdu transliterations.`);

// Verify key lines
console.log('\n--- VERIFICATION OF KEY LINES ---');
lines.forEach((l: any, idx: number) => {
  if (idx === 3 || l.vocalIndex === 4 || l.text.includes('बुझते')) {
    console.log(`Index ${idx} | Vocal #${l.vocalIndex} | Speaker: ${l.speaker || 'Shayar'}`);
    console.log(`  Raw Text:  ${l.text}`);
    console.log(`  RomanUrdu: ${l.romanUrdu}`);
  }
});

// Recompile Multilingual Package & Subtitle assets
console.log('\nCompiling 4-language Multilingual Package...');
const subDir = path.join(draftDir, 'subtitles');
const pkg = generateMultilingualPackage(
  draft.masterTimeline,
  draft.canonicalLyrics?.text,
  draft.primaryLanguage || 'ur'
);

// Synchronize all 4 languages onto draft.masterTimeline.lines
pkg.lines.forEach((pl, i) => {
  const line = draft.masterTimeline.lines[i];
  if (!line) return;
  line.urduNastaliq = pl.urduNastaliq;
  line.englishTranslation = pl.englishTranslation;
  line.romanUrdu = pl.romanUrdu;
  line.devanagariUrdu = pl.devanagariUrdu || line.text;
});

// Verify key lines with all 4 languages
console.log('\n--- VERIFICATION OF KEY LINES (ALL 4 LANGUAGES) ---');
draft.masterTimeline.lines.forEach((l: any, idx: number) => {
  if (idx === 0 || idx === 3 || l.text.includes('बुझते')) {
    console.log(`\nLine #${idx} [Vocal #${l.vocalIndex || idx + 1}] (${l.speaker || 'Shayar'}):`);
    console.log(`  1. Roman Urdu:        ${l.romanUrdu}`);
    console.log(`  2. Urdu (Nastaliq):   ${l.urduNastaliq}`);
    console.log(`  3. Hindi (Devanagari): ${l.devanagariUrdu}`);
    console.log(`  4. English:           ${l.englishTranslation}`);
  }
});

exportAllSubtitles(pkg, subDir);
console.log('\nSubtitles exported successfully to:', subDir);

// Persist updated draft
draft.updatedAt = new Date().toISOString();
fs.writeFileSync(draftPath, JSON.stringify(draft, null, 2), 'utf8');
console.log('draft.json updated and persisted successfully.');
