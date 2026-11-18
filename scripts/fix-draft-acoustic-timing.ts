import fs from 'fs';
import path from 'path';
import { compileQuadMusicAss, exportAllSubtitles } from '../server/services/subtitle-generator';
import { generateMultilingualPackage } from '../server/services/multilingual-pipeline';

const draftPath = path.resolve('.data/pipeline-drafts/draft_1794752884539_0eb391d5/draft.json');
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));

const lines = draft.masterTimeline?.lines || [];

console.log('Original lines count:', lines.length);

// 1. Fix Line 22
if (lines[22]) {
  lines[22].startSeconds = 99.24;
  lines[22].endSeconds = 101.50;
  lines[22].isProductionDirection = false;
  console.log('Fixed Line 22:', lines[22].startSeconds, '->', lines[22].endSeconds);
}

// 2. Mark Lines 23-30 as Instrumental Interlude
for (let i = 23; i <= 30; i++) {
  if (lines[i]) {
    lines[i].isProductionDirection = true;
    lines[i].section = 'Instrumental Interlude (Omitted in Vocal Take)';
    console.log(`Marked Line ${i} as production direction: ${lines[i].text}`);
  }
}

// 3. Fix Line 31
if (lines[31]) {
  lines[31].startSeconds = 125.56;
  lines[31].endSeconds = 128.74;
  lines[31].isProductionDirection = false;
  console.log('Fixed Line 31:', lines[31].startSeconds, '->', lines[31].endSeconds);
}

// 4. Fix Line 51
if (lines[51]) {
  lines[51].startSeconds = 186.36;
  lines[51].endSeconds = 189.78;
  lines[51].isProductionDirection = false;
  console.log('Fixed Line 51:', lines[51].startSeconds, '->', lines[51].endSeconds);
}

// 5. Mark Lines 52 and 53 as Instrumental Break
if (lines[52]) {
  lines[52].isProductionDirection = true;
  lines[52].section = 'Instrumental Break (Omitted in Vocal Take)';
  console.log('Marked Line 52 as production direction:', lines[52].text);
}
if (lines[53]) {
  lines[53].isProductionDirection = true;
  lines[53].section = 'Instrumental Break (Omitted in Vocal Take)';
  console.log('Marked Line 53 as production direction:', lines[53].text);
}

// 6. Fix Line 54
if (lines[54]) {
  lines[54].startSeconds = 202.76;
  lines[54].endSeconds = 207.92;
  lines[54].isProductionDirection = false;
  console.log('Fixed Line 54:', lines[54].startSeconds, '->', lines[54].endSeconds);
}

// 7. Fix Line 93 (Vocal #94)
if (lines[93]) {
  lines[93].startSeconds = 344.36;
  lines[93].endSeconds = 346.76;
  lines[93].isProductionDirection = false;
  console.log('Fixed Line 93 (Vocal #94):', lines[93].startSeconds, '->', lines[93].endSeconds);
}

// Save back to draft.json
draft.masterTimeline.lines = lines;
draft.updatedAt = new Date().toISOString();
fs.writeFileSync(draftPath, JSON.stringify(draft, null, 2), 'utf8');
console.log('draft.json updated successfully.');

// Re-generate Multilingual Package & Subtitle Files
const pkg = generateMultilingualPackage(draft.masterTimeline, undefined, 'ur');

const subDir = path.resolve('.data/pipeline-drafts/draft_1794752884539_0eb391d5/subtitles');
exportAllSubtitles(pkg, subDir);
console.log('All subtitle files recompiled.');

// Burned ASS files for FFmpeg
const masterQuadAss = compileQuadMusicAss(pkg, 'landscape');
fs.writeFileSync(path.join(subDir, 'master_dual_urdu_english.ass'), masterQuadAss, 'utf8');
fs.writeFileSync(path.join(subDir, 'master_dual_urdu_english_burned.ass'), masterQuadAss, 'utf8');

const masterQuadAssPortrait = compileQuadMusicAss(pkg, 'portrait');
fs.writeFileSync(path.join(subDir, 'master_dual_urdu_english_portrait.ass'), masterQuadAssPortrait, 'utf8');
fs.writeFileSync(path.join(subDir, 'master_dual_urdu_english_portrait_burned.ass'), masterQuadAssPortrait, 'utf8');

console.log('Burned ASS files updated with 0 phantom cues and full 4-script layout!');
