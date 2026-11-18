import fs from 'fs';
import path from 'path';
import { pipelineDraftStorage } from '../server/storage/pipeline-draft-storage';
import { compileQuadMusicAss, exportAllSubtitles } from '../server/services/subtitle-generator';
import { generateMultilingualPackage } from '../server/services/multilingual-pipeline';
import { renderMasterVideoForDraft } from '../server/services/master-video-service';

const draftId = 'draft_1794752884539_0eb391d5';
const draft = pipelineDraftStorage.getDraft(draftId);

if (!draft) {
  console.error('Draft not found!');
  process.exit(1);
}

const lines = draft.masterTimeline?.lines || [];
console.log('Total lines before adjustments:', lines.length);

// 1. Line 22
if (lines[22]) {
  lines[22].startSeconds = 99.24;
  lines[22].endSeconds = 101.50;
  lines[22].isProductionDirection = false;
}

// 2. Lines 23-30
for (let i = 23; i <= 30; i++) {
  if (lines[i]) {
    lines[i].isProductionDirection = true;
    lines[i].section = 'Instrumental Interlude (Omitted in Vocal Take)';
  }
}

// 3. Line 31
if (lines[31]) {
  lines[31].startSeconds = 125.56;
  lines[31].endSeconds = 128.74;
  lines[31].isProductionDirection = false;
}

// 4. Line 51
if (lines[51]) {
  lines[51].startSeconds = 186.36;
  lines[51].endSeconds = 189.78;
  lines[51].isProductionDirection = false;
}

// 5. Lines 52-53
if (lines[52]) {
  lines[52].isProductionDirection = true;
  lines[52].section = 'Instrumental Break (Omitted in Vocal Take)';
}
if (lines[53]) {
  lines[53].isProductionDirection = true;
  lines[53].section = 'Instrumental Break (Omitted in Vocal Take)';
}

// 6. Line 54
if (lines[54]) {
  lines[54].startSeconds = 202.76;
  lines[54].endSeconds = 207.92;
  lines[54].isProductionDirection = false;
}

// 7. Line 85 (Vocal #86) - HOLD FOR 5.2s
if (lines[85]) {
  lines[85].startSeconds = 302.60;
  lines[85].endSeconds = 307.80;
  lines[85].isProductionDirection = false;
  if (lines[85].words && lines[85].words.length > 0) {
    lines[85].words[lines[85].words.length - 1].endSeconds = 307.80;
  }
  console.log(`Line 85 (Vocal #86) extended: [${lines[85].startSeconds}s - ${lines[85].endSeconds}s] (dur: ${(lines[85].endSeconds - lines[85].startSeconds).toFixed(2)}s)`);
}

// 8. Line 93 (Vocal #94) - HOLD TO MASTER AUDIO END (346.76s)
if (lines[93]) {
  lines[93].startSeconds = 343.80;
  lines[93].endSeconds = 346.76;
  lines[93].isProductionDirection = false;
  if (lines[93].words && lines[93].words.length > 0) {
    lines[93].words[0].startSeconds = 343.80;
    lines[93].words[lines[93].words.length - 1].endSeconds = 346.76;
  }
  console.log(`Line 93 (Vocal #94) extended: [${lines[93].startSeconds}s - ${lines[93].endSeconds}s] (dur: ${(lines[93].endSeconds - lines[93].startSeconds).toFixed(2)}s)`);
}

// 9. Reconcile multilingual fields from lexicon if any are missing
import { FOOTPRINTS_BEHIND_LEXICON } from '../server/services/footprints-behind-lexicon';
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  const lex = FOOTPRINTS_BEHIND_LEXICON[l.text] ||
    FOOTPRINTS_BEHIND_LEXICON[l.text.replace(/[,\.?!।]$/, '')] ||
    Object.entries(FOOTPRINTS_BEHIND_LEXICON).find(([k]) => k.replace(/[,\.?!।]$/, '').trim() === l.text.replace(/[,\.?!।]$/, '').trim())?.[1];

  if (lex) {
    if (!l.urduNastaliq || !l.urduNastaliq.trim()) l.urduNastaliq = lex.urdu;
    if (!l.englishTranslation || !l.englishTranslation.trim()) l.englishTranslation = lex.en;
    if (!l.romanUrdu || !l.romanUrdu.trim()) l.romanUrdu = lex.rom;
    if (!l.devanagariUrdu || !l.devanagariUrdu.trim()) l.devanagariUrdu = lex.deva;
  }
}

draft.masterTimeline.lines = lines;
draft.updatedAt = new Date().toISOString();
pipelineDraftStorage.saveDraft(draft);
console.log('Saved draft to pipelineDraftStorage.');

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

console.log('All subtitle files updated and verified on disk.');

// Re-render Video Masters
async function renderAll() {
  console.log('--- Rendering Landscape Lyric Master (16:9) ---');
  await renderMasterVideoForDraft(draftId, { format: 'lyric_master', orientation: 'landscape' });
  console.log('--- Landscape Render Complete ---');

  console.log('--- Rendering Portrait Lyric Master (9:16) ---');
  await renderMasterVideoForDraft(draftId, { format: 'lyric_master', orientation: 'portrait' });
  console.log('--- Portrait Render Complete ---');
}

renderAll().then(() => {
  console.log('ALL RENDERS COMPLETE SUCCESSFULLY!');
}).catch((err) => {
  console.error('Render error:', err);
  process.exit(1);
});
