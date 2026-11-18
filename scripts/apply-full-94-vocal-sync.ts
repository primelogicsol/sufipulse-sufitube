import fs from 'fs';
import path from 'path';
import { pipelineDraftStorage } from '../server/storage/pipeline-draft-storage';
import { compileQuadMusicAss, exportAllSubtitles } from '../server/services/subtitle-generator';
import { generateMultilingualPackage } from '../server/services/multilingual-pipeline';
import { renderMasterVideoForDraft } from '../server/services/master-video-service';
import { FOOTPRINTS_BEHIND_LEXICON } from '../server/services/footprints-behind-lexicon';

const draftId = 'draft_1794752884539_0eb391d5';
const draft = pipelineDraftStorage.getDraft(draftId);

if (!draft) {
  console.error('Draft not found!');
  process.exit(1);
}

const lines = draft.masterTimeline?.lines || [];
console.log('Total lines loaded:', lines.length);

const sourceVarId = 'var_1794753177016_11a296';

function makeWords(sourceVar: string, defs: { text: string; start: number; end: number }[]) {
  return defs.map(d => ({
    text: d.text,
    startSeconds: d.start,
    endSeconds: d.end,
    sourceVariantId: sourceVar,
    sourceStartSeconds: d.start,
    sourceEndSeconds: d.end,
  }));
}

// 1. Line 22 (Vocal #23)
if (lines[22]) {
  lines[22].startSeconds = 99.24;
  lines[22].endSeconds = 101.58;
  lines[22].isProductionDirection = false;
  delete (lines[22] as any).section;
  lines[22].words = makeWords(sourceVarId, [
    { text: 'कभी', start: 99.24, end: 99.56 },
    { text: 'देखा', start: 99.56, end: 100.00 },
    { text: 'किसी', start: 100.00, end: 100.28 },
    { text: 'बुनकर', start: 100.28, end: 100.70 },
    { text: 'का', start: 100.70, end: 100.98 },
    { text: 'मकान,', start: 100.98, end: 101.58 },
  ]);
  console.log(`Line 22 updated: [${lines[22].startSeconds}s - ${lines[22].endSeconds}s]`);
}

// 2. Line 23 (Vocal #24)
if (lines[23]) {
  lines[23].startSeconds = 101.58;
  lines[23].endSeconds = 104.54;
  lines[23].confidence = 0.95;
  lines[23].isProductionDirection = false;
  delete (lines[23] as any).section;
  lines[23].words = makeWords(sourceVarId, [
    { text: 'उसकी', start: 101.58, end: 102.04 },
    { text: 'आँखों', start: 102.04, end: 102.74 },
    { text: 'में', start: 102.74, end: 103.02 },
    { text: 'सदियों', start: 103.02, end: 103.70 },
    { text: 'का', start: 103.70, end: 103.90 },
    { text: 'अरमान।', start: 103.90, end: 104.54 },
  ]);
  console.log(`Line 23 (Vocal #24) enabled: [${lines[23].startSeconds}s - ${lines[23].endSeconds}s]`);
}

// 3. Line 24 (Vocal #25)
if (lines[24]) {
  lines[24].startSeconds = 104.54;
  lines[24].endSeconds = 107.32;
  lines[24].confidence = 0.95;
  lines[24].isProductionDirection = false;
  delete (lines[24] as any).section;
  lines[24].words = makeWords(sourceVarId, [
    { text: 'सोज़नी', start: 104.54, end: 105.24 },
    { text: 'के', start: 105.24, end: 105.44 },
    { text: 'टाँकों', start: 105.44, end: 106.20 },
    { text: 'में', start: 106.20, end: 106.38 },
    { text: 'दर्द', start: 106.38, end: 106.86 },
    { text: 'मिला,', start: 106.86, end: 107.32 },
  ]);
  console.log(`Line 24 (Vocal #25) enabled: [${lines[24].startSeconds}s - ${lines[24].endSeconds}s]`);
}

// 4. Line 25 (Vocal #26)
if (lines[25]) {
  lines[25].startSeconds = 107.32;
  lines[25].endSeconds = 110.36;
  lines[25].confidence = 0.95;
  lines[25].isProductionDirection = false;
  delete (lines[25] as any).section;
  lines[25].words = makeWords(sourceVarId, [
    { text: 'कानी', start: 107.32, end: 108.46 },
    { text: 'के', start: 108.46, end: 108.64 },
    { text: 'रंगों', start: 108.64, end: 109.10 },
    { text: 'में', start: 109.10, end: 109.32 },
    { text: 'फ़ख़्र', start: 109.32, end: 109.92 },
    { text: 'मिला।', start: 109.92, end: 110.36 },
  ]);
  console.log(`Line 25 (Vocal #26) enabled: [${lines[25].startSeconds}s - ${lines[25].endSeconds}s]`);
}

// 5. Line 26 (Vocal #27)
if (lines[26]) {
  lines[26].startSeconds = 110.36;
  lines[26].endSeconds = 113.80;
  lines[26].confidence = 0.95;
  lines[26].isProductionDirection = false;
  delete (lines[26] as any).section;
  lines[26].words = makeWords(sourceVarId, [
    { text: 'पश्मीना', start: 110.36, end: 111.12 },
    { text: 'की', start: 111.12, end: 111.30 },
    { text: 'नरमी', start: 111.30, end: 112.06 },
    { text: 'में', start: 112.06, end: 112.30 },
    { text: 'मेहनत', start: 112.30, end: 112.92 },
    { text: 'का', start: 112.92, end: 113.16 },
    { text: 'नूर,', start: 113.16, end: 113.80 },
  ]);
  console.log(`Line 26 (Vocal #27) enabled: [${lines[26].startSeconds}s - ${lines[26].endSeconds}s]`);
}

// 6. Line 27 (Vocal #28)
if (lines[27]) {
  lines[27].startSeconds = 113.80;
  lines[27].endSeconds = 116.56;
  lines[27].confidence = 0.95;
  lines[27].isProductionDirection = false;
  delete (lines[27] as any).section;
  lines[27].words = makeWords(sourceVarId, [
    { text: 'कालीन', start: 113.80, end: 114.34 },
    { text: 'की', start: 114.34, end: 114.50 },
    { text: 'गिरहों', start: 114.50, end: 115.16 },
    { text: 'में', start: 115.16, end: 115.30 },
    { text: 'बरसों', start: 115.30, end: 115.86 },
    { text: 'का', start: 115.86, end: 116.00 },
    { text: 'सुरूर।', start: 116.00, end: 116.56 },
  ]);
  console.log(`Line 27 (Vocal #28) enabled: [${lines[27].startSeconds}s - ${lines[27].endSeconds}s]`);
}

// 7. Line 28 (Vocal #29)
if (lines[28]) {
  lines[28].startSeconds = 116.56;
  lines[28].endSeconds = 119.80;
  lines[28].confidence = 0.95;
  lines[28].isProductionDirection = false;
  delete (lines[28] as any).section;
  lines[28].words = makeWords(sourceVarId, [
    { text: 'अख़रोट', start: 116.56, end: 117.40 },
    { text: 'की', start: 117.40, end: 117.54 },
    { text: 'लकड़ी', start: 117.54, end: 118.14 },
    { text: 'पे', start: 118.14, end: 118.38 },
    { text: 'उभरता', start: 118.38, end: 119.16 },
    { text: 'जमाल,', start: 119.16, end: 119.80 },
  ]);
  console.log(`Line 28 (Vocal #29) enabled: [${lines[28].startSeconds}s - ${lines[28].endSeconds}s]`);
}

// 8. Line 29 (Vocal #30)
if (lines[29]) {
  lines[29].startSeconds = 119.80;
  lines[29].endSeconds = 122.70;
  lines[29].confidence = 0.95;
  lines[29].isProductionDirection = false;
  delete (lines[29] as any).section;
  lines[29].words = makeWords(sourceVarId, [
    { text: 'दस्तकार', start: 119.80, end: 120.62 },
    { text: 'के', start: 120.62, end: 120.80 },
    { text: 'हाथों', start: 120.80, end: 121.22 },
    { text: 'में', start: 121.22, end: 121.38 },
    { text: 'बेमिसाल', start: 121.38, end: 122.22 },
    { text: 'कमाल।', start: 122.22, end: 122.70 },
  ]);
  console.log(`Line 29 (Vocal #30) enabled: [${lines[29].startSeconds}s - ${lines[29].endSeconds}s]`);
}

// 9. Line 30 (Vocal #31)
if (lines[30]) {
  lines[30].startSeconds = 122.70;
  lines[30].endSeconds = 125.54;
  lines[30].confidence = 0.95;
  lines[30].isProductionDirection = false;
  delete (lines[30] as any).section;
  lines[30].words = makeWords(sourceVarId, [
    { text: 'जब', start: 122.70, end: 122.96 },
    { text: 'हुनर', start: 122.96, end: 123.52 },
    { text: 'की', start: 123.52, end: 123.80 },
    { text: 'क़ीमत', start: 123.80, end: 124.18 },
    { text: 'घटाई', start: 124.18, end: 125.14 },
    { text: 'गई,', start: 125.14, end: 125.54 },
  ]);
  console.log(`Line 30 (Vocal #31) enabled: [${lines[30].startSeconds}s - ${lines[30].endSeconds}s]`);
}

// 10. Line 31 (Vocal #32)
if (lines[31]) {
  lines[31].startSeconds = 125.56;
  lines[31].endSeconds = 128.74;
  lines[31].isProductionDirection = false;
  delete (lines[31] as any).section;
  console.log(`Line 31 (Vocal #32) verified: [${lines[31].startSeconds}s - ${lines[31].endSeconds}s]`);
}

// 11. Line 51 (Vocal #52)
if (lines[51]) {
  lines[51].startSeconds = 186.36;
  lines[51].endSeconds = 189.16;
  lines[51].isProductionDirection = false;
  delete (lines[51] as any).section;
  if (lines[51].words && lines[51].words.length > 0) {
    lines[51].words[lines[51].words.length - 1].endSeconds = 189.16;
  }
  console.log(`Line 51 (Vocal #52) ends adjusted: [${lines[51].startSeconds}s - ${lines[51].endSeconds}s]`);
}

// 12. Line 52 (Vocal #53)
if (lines[52]) {
  lines[52].startSeconds = 189.16;
  lines[52].endSeconds = 192.20;
  lines[52].confidence = 0.95;
  lines[52].isProductionDirection = false;
  delete (lines[52] as any).section;
  lines[52].words = makeWords(sourceVarId, [
    { text: 'न', start: 189.16, end: 189.40 },
    { text: 'ताज', start: 189.40, end: 189.94 },
    { text: 'की', start: 189.94, end: 190.18 },
    { text: 'ख़्वाहिश,', start: 190.18, end: 190.84 },
    { text: 'न', start: 190.84, end: 190.96 },
    { text: 'तख़्त', start: 190.96, end: 191.38 },
    { text: 'का', start: 191.38, end: 191.68 },
    { text: 'गुमाँ,', start: 191.68, end: 192.20 },
  ]);
  console.log(`Line 52 (Vocal #53) enabled: [${lines[52].startSeconds}s - ${lines[52].endSeconds}s]`);
}

// 13. Line 53 (Vocal #54)
if (lines[53]) {
  lines[53].startSeconds = 192.20;
  lines[53].endSeconds = 198.76;
  lines[53].confidence = 0.95;
  lines[53].isProductionDirection = false;
  delete (lines[53] as any).section;
  lines[53].words = makeWords(sourceVarId, [
    { text: 'बस', start: 192.20, end: 192.52 },
    { text: 'दिलों', start: 192.52, end: 192.92 },
    { text: 'में', start: 192.92, end: 193.14 },
    { text: 'अपना', start: 193.14, end: 193.58 },
    { text: 'मकाँ', start: 193.58, end: 193.96 },
    { text: 'छोड़', start: 193.96, end: 195.00 },
    { text: 'जाते', start: 195.00, end: 195.64 },
    { text: 'हैं।', start: 195.64, end: 198.76 },
  ]);
  console.log(`Line 53 (Vocal #54) enabled: [${lines[53].startSeconds}s - ${lines[53].endSeconds}s]`);
}

// 14. Line 54 (Vocal #55)
if (lines[54]) {
  lines[54].startSeconds = 202.76;
  lines[54].endSeconds = 207.92;
  lines[54].isProductionDirection = false;
  delete (lines[54] as any).section;
}

// 15. Line 85 (Vocal #86) - HOLD FOR 5.2s
if (lines[85]) {
  lines[85].startSeconds = 302.60;
  lines[85].endSeconds = 307.80;
  lines[85].isProductionDirection = false;
  if (lines[85].words && lines[85].words.length > 0) {
    lines[85].words[lines[85].words.length - 1].endSeconds = 307.80;
  }
}

// 16. Line 93 (Vocal #94) - HOLD TO MASTER AUDIO END (346.76s)
if (lines[93]) {
  lines[93].startSeconds = 343.80;
  lines[93].endSeconds = 346.76;
  lines[93].isProductionDirection = false;
  if (lines[93].words && lines[93].words.length > 0) {
    lines[93].words[0].startSeconds = 343.80;
    lines[93].words[lines[93].words.length - 1].endSeconds = 346.76;
  }
}

// 17. Reconcile multilingual fields from lexicon
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

// Flatten all words into masterTimeline.words
draft.masterTimeline.words = lines.flatMap(l => l.words || []);
draft.masterTimeline.lines = lines;
draft.updatedAt = new Date().toISOString();
pipelineDraftStorage.saveDraft(draft);
console.log('Saved draft to pipelineDraftStorage. Total masterTimeline.words:', draft.masterTimeline.words.length);

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

console.log('All subtitle files recompiled with all 94 vocal lines enabled!');

// Re-render Video Masters
async function renderAll() {
  console.log('--- Rendering Landscape Lyric Master (16:9) with all 94 vocals ---');
  await renderMasterVideoForDraft(draftId, { format: 'lyric_master', orientation: 'landscape' });
  console.log('--- Landscape Render Complete ---');

  console.log('--- Rendering Portrait Lyric Master (9:16) with all 94 vocals ---');
  await renderMasterVideoForDraft(draftId, { format: 'lyric_master', orientation: 'portrait' });
  console.log('--- Portrait Render Complete ---');
}

renderAll().then(() => {
  console.log('ALL RENDERS COMPLETE SUCCESSFULLY!');
}).catch((err) => {
  console.error('Render error:', err);
  process.exit(1);
});
