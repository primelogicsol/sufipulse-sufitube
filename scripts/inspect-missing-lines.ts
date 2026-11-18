import fs from 'fs';
import path from 'path';

const draftPath = path.resolve('.data/pipeline-drafts/draft_1794752884539_0eb391d5/draft.json');
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
const lines = draft.masterTimeline?.lines || [];

console.log('=== LINES 20 to 32 ===');
for (let i = 20; i <= 32; i++) {
  const l = lines[i];
  if (!l) continue;
  console.log(`Line ${i} (Vocal #${l.vocalIndex || i+1}): [${l.startSeconds?.toFixed(2)}s - ${l.endSeconds?.toFixed(2)}s] dur: ${(l.endSeconds - l.startSeconds).toFixed(2)}s | conf: ${l.confidence} | dir: ${l.isProductionDirection} | ${l.text}`);
}

console.log('\n=== LINES 50 to 56 ===');
for (let i = 50; i <= 56; i++) {
  const l = lines[i];
  if (!l) continue;
  console.log(`Line ${i} (Vocal #${l.vocalIndex || i+1}): [${l.startSeconds?.toFixed(2)}s - ${l.endSeconds?.toFixed(2)}s] dur: ${(l.endSeconds - l.startSeconds).toFixed(2)}s | conf: ${l.confidence} | dir: ${l.isProductionDirection} | ${l.text}`);
}

console.log('\n=== LINES 90 to 93 ===');
for (let i = 90; i <= 93; i++) {
  const l = lines[i];
  if (!l) continue;
  console.log(`Line ${i} (Vocal #${l.vocalIndex || i+1}): [${l.startSeconds?.toFixed(2)}s - ${l.endSeconds?.toFixed(2)}s] dur: ${(l.endSeconds - l.startSeconds).toFixed(2)}s | conf: ${l.confidence} | dir: ${l.isProductionDirection} | ${l.text}`);
}
