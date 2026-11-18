import fs from 'fs';
import path from 'path';
import { compileQuadMusicAss, exportAllSubtitles } from '../server/services/subtitle-generator';
import { generateMultilingualPackage } from '../server/services/multilingual-pipeline';

const draftPath = path.resolve('.data/pipeline-drafts/draft_1794752884539_0eb391d5/draft.json');
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));

const lines = draft.masterTimeline?.lines || [];

// 1. Fix Line 85 (Vocal #86)
if (lines[85]) {
  console.log(`Original Line 85 (${lines[85].text}): ${lines[85].startSeconds}s -> ${lines[85].endSeconds}s`);
  lines[85].startSeconds = 302.60;
  lines[85].endSeconds = 307.80; // Extended from 303.90s
  console.log(`Updated Line 85: ${lines[85].startSeconds}s -> ${lines[85].endSeconds}s (Duration: ${(lines[85].endSeconds - lines[85].startSeconds).toFixed(2)}s)`);
}

// 2. Fix Line 93 (Vocal #94)
if (lines[93]) {
  console.log(`Original Line 93 (${lines[93].text}): ${lines[93].startSeconds}s -> ${lines[93].endSeconds}s`);
  lines[93].startSeconds = 343.80;
  lines[93].endSeconds = 346.76;
  console.log(`Updated Line 93: ${lines[93].startSeconds}s -> ${lines[93].endSeconds}s (Duration: ${(lines[93].endSeconds - lines[93].startSeconds).toFixed(2)}s)`);
}

draft.masterTimeline.lines = lines;
draft.updatedAt = new Date().toISOString();
fs.writeFileSync(draftPath, JSON.stringify(draft, null, 2), 'utf8');
console.log('draft.json updated.');

// Re-generate Multilingual Package & Subtitle Files
const pkg = generateMultilingualPackage(draft.masterTimeline, undefined, 'ur');

const subDir = path.resolve('.data/pipeline-drafts/draft_1794752884539_0eb391d5/subtitles');
exportAllSubtitles(pkg, subDir);

// Burned ASS files for FFmpeg
const masterQuadAss = compileQuadMusicAss(pkg, 'landscape');
fs.writeFileSync(path.join(subDir, 'master_dual_urdu_english.ass'), masterQuadAss, 'utf8');
fs.writeFileSync(path.join(subDir, 'master_dual_urdu_english_burned.ass'), masterQuadAss, 'utf8');

const masterQuadAssPortrait = compileQuadMusicAss(pkg, 'portrait');
fs.writeFileSync(path.join(subDir, 'master_dual_urdu_english_portrait.ass'), masterQuadAssPortrait, 'utf8');
fs.writeFileSync(path.join(subDir, 'master_dual_urdu_english_portrait_burned.ass'), masterQuadAssPortrait, 'utf8');

console.log('Subtitles recompiled with extended hold times for #86 and #94!');
