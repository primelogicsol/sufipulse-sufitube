import fs from 'fs';
import path from 'path';

const draftPath = path.resolve('.data/pipeline-drafts/draft_1794752884539_0eb391d5/draft.json');
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));

console.log('Draft ID:', draft.draftId);
console.log('Production Stage:', draft.productionStage);
console.log('Total Lines in masterTimeline:', draft.masterTimeline?.lines?.length);

const lines = draft.masterTimeline?.lines || [];

let emptyEnglishCount = 0;
let emptyUrduCount = 0;
let emptyRomanCount = 0;
let emptyDevaCount = 0;

lines.forEach((l: any, i: number) => {
  if (!l.englishTranslation || !l.englishTranslation.trim()) emptyEnglishCount++;
  if (!l.urduNastaliq || !l.urduNastaliq.trim()) emptyUrduCount++;
  if (!l.romanUrdu || !l.romanUrdu.trim()) emptyRomanCount++;
  if (!l.devanagariUrdu || !l.devanagariUrdu.trim()) emptyDevaCount++;
});

console.log({
  emptyEnglishCount,
  emptyUrduCount,
  emptyRomanCount,
  emptyDevaCount,
});

console.log('Sample Line 0:', JSON.stringify(lines[0], null, 2));
console.log('Sample Line 23:', JSON.stringify(lines[23], null, 2));
console.log('Sample Line 53:', JSON.stringify(lines[53], null, 2));
console.log('Sample Line 93:', JSON.stringify(lines[93], null, 2));
