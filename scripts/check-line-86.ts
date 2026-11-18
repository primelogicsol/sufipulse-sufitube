import fs from 'fs';
import path from 'path';

const asrPath = path.resolve('.data/pipeline-drafts/draft_1794752884539_0eb391d5/alignment/auto_alignment.asr.json');
const asr = JSON.parse(fs.readFileSync(asrPath, 'utf8'));

const words = asr.asrWords || [];

console.log('--- Words between 300s and 315s ---');
for (const w of words) {
  if (w.end >= 300 && w.start <= 315) {
    console.log(`[${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s] ${w.text} (prob: ${w.probability?.toFixed(2)})`);
  }
}
