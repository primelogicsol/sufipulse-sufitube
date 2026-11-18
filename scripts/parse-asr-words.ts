import fs from 'fs';
import path from 'path';

const asrPath = path.resolve('.data/pipeline-drafts/draft_1794752884539_0eb391d5/alignment/auto_alignment.asr.json');
const asr = JSON.parse(fs.readFileSync(asrPath, 'utf8'));

const words = asr.asrWords || [];

console.log('--- Words between 95s and 135s ---');
for (const w of words) {
  if (w.end >= 95 && w.start <= 135) {
    console.log(`[${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s] ${w.text} (prob: ${w.probability?.toFixed(2)})`);
  }
}

console.log('\n--- Words between 180s and 205s ---');
for (const w of words) {
  if (w.end >= 180 && w.start <= 205) {
    console.log(`[${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s] ${w.text} (prob: ${w.probability?.toFixed(2)})`);
  }
}

console.log('\n--- Words after 340s ---');
for (const w of words) {
  if (w.start >= 340) {
    console.log(`[${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s] ${w.text} (prob: ${w.probability?.toFixed(2)})`);
  }
}
