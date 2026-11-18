import fs from 'fs';
import path from 'path';

const draftPath = path.resolve('.data/pipeline-drafts/draft_1794752884539_0eb391d5/draft.json');
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
const lines = draft.masterTimeline?.lines || [];

console.log('--- Lines with duration < 2.2s ---');
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.isProductionDirection) continue;
  const dur = (l.endSeconds || 0) - (l.startSeconds || 0);
  if (dur < 2.2) {
    const nextStart = lines[i + 1] ? lines[i + 1].startSeconds : 346.76;
    const gap = nextStart - l.endSeconds;
    console.log(`Line ${i} (Vocal #${l.vocalIndex || i+1}): [${l.startSeconds?.toFixed(2)}s - ${l.endSeconds?.toFixed(2)}s] dur: ${dur.toFixed(2)}s | gap to next: ${gap.toFixed(2)}s | ${l.text}`);
  }
}
