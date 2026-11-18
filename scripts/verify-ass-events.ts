import fs from 'fs';
import path from 'path';

const assPath = path.resolve('.data/pipeline-drafts/draft_1794752884539_0eb391d5/subtitles/master_dual_urdu_english.ass');
const ass = fs.readFileSync(assPath, 'utf8');

const lines = ass.split('\n');
console.log('Total ASS lines:', lines.length);

console.log('\n--- Events between 0:01:35 and 0:02:15 ---');
for (const l of lines) {
  if (l.startsWith('Dialogue:') && (l.includes('0:01:3') || l.includes('0:01:4') || l.includes('0:02:0') || l.includes('0:02:1'))) {
    console.log(l);
  }
}

console.log('\n--- Events between 0:03:00 and 0:03:30 ---');
for (const l of lines) {
  if (l.startsWith('Dialogue:') && (l.includes('0:03:0') || l.includes('0:03:1') || l.includes('0:03:2'))) {
    console.log(l);
  }
}

console.log('\n--- Last 10 Dialogue lines ---');
const dialogues = lines.filter(l => l.startsWith('Dialogue:'));
for (const d of dialogues.slice(-10)) {
  console.log(d);
}
