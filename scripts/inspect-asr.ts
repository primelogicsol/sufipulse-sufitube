import fs from 'fs';
import path from 'path';

const asrPath = path.resolve('.data/pipeline-drafts/draft_1794752884539_0eb391d5/alignment/auto_alignment.asr.json');
const asr = JSON.parse(fs.readFileSync(asrPath, 'utf8'));

console.log('Total ASR segments:', asr.segments?.length);

console.log('\n--- ASR Segments between 90s and 140s ---');
for (const s of asr.segments || []) {
  if (s.end >= 90 && s.start <= 140) {
    console.log(`[${s.start.toFixed(2)} - ${s.end.toFixed(2)}] ${s.text}`);
  }
}

console.log('\n--- ASR Segments between 180s and 210s ---');
for (const s of asr.segments || []) {
  if (s.end >= 180 && s.start <= 210) {
    console.log(`[${s.start.toFixed(2)} - ${s.end.toFixed(2)}] ${s.text}`);
  }
}

console.log('\n--- ASR Segments between 340s and 350s ---');
for (const s of asr.segments || []) {
  if (s.end >= 340 && s.start <= 350) {
    console.log(`[${s.start.toFixed(2)} - ${s.end.toFixed(2)}] ${s.text}`);
  }
}
