import fs from 'fs';
import path from 'path';

const draftPath = path.resolve('.data/pipeline-drafts/draft_1794752884539_0eb391d5/draft.json');
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
const lines = draft.masterTimeline?.lines || [];

console.log('--- Checking all lines for duration < 0.8s or confidence < 0.5 ---');
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  const dur = (l.endSeconds || 0) - (l.startSeconds || 0);
  if (dur < 0.8 || (l.confidence !== undefined && l.confidence < 0.5)) {
    console.log(`Line ${i} (Vocal #${l.vocalIndex || i+1}): [${l.startSeconds?.toFixed(2)}s - ${l.endSeconds?.toFixed(2)}s] dur: ${dur.toFixed(2)}s | conf: ${l.confidence} | text: ${l.text}`);
  }
}
