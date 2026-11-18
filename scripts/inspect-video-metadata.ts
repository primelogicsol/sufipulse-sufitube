import fs from 'fs';
import path from 'path';

const draftPath = path.resolve('.data/pipeline-drafts/draft_1794752884539_0eb391d5/draft.json');
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));

console.log('partA:', draft.partA);
console.log('partB:', draft.partB);
console.log('partC:', draft.partC);
console.log('masterAudio:', draft.masterAudio);
console.log('renderedVideos:', draft.renderedVideos);
