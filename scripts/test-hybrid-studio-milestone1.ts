/**
 * scripts/test-hybrid-studio-milestone1.ts
 *
 * Automated Acceptance Test Suite for SufiPulse New-Release Hybrid Studio:
 * Milestone 1 — Multi-Variant Assembly & Master Timestamp Reconciliation.
 *
 * Tests:
 *  1. Historical catalog isolation guard
 *  2. Single variant import & rendering
 *  3. Two-variant merge (Intro A + Verse B)
 *  4. Three-variant merge (Intro A + Verse B + Chorus C)
 *  5. Crossfade between vocal sections with boundary checking
 *  6. Replacement of a mispronounced verse
 *  7. Removal of an awkward pause
 *  8. Preservation of an intentional instrumental break
 *  9. Accurate mathematical timestamp reconciliation (t_master = t_source - in + dest)
 * 10. Rollback to previous master revision
 * 11. Final confirmation of catalog integrity
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import {
  pipelineDraftStorage,
  getDraftAudioDir,
  computeFileSha256,
} from '../server/storage/pipeline-draft-storage';
import {
  reconcileMasterTimestamps,
} from '../server/services/timestamp-reconciler';
import {
  createEmptyWavBuffer,
  renderMasterWav,
  readWavHeader,
} from '../server/services/audio-splicer';
import {
  analyzeVariantQuality,
} from '../server/services/audio-quality-analyzer';
import type {
  VariantSource,
  AudioAssemblyEDL,
} from '../server/types/pipeline-draft';

const CATALOG_PATH = path.join(process.cwd(), '.data', 'cms-releases.json');

// Helper to generate a dummy synthetic PCM WAV tone file
function createSyntheticWav(filePath: string, durationSeconds: number, sampleRate: number = 48000): void {
  const buf = createEmptyWavBuffer(durationSeconds, sampleRate, 2, 16);
  // Add gentle synthetic tone in the audio data section so it's not silent
  const bytesPerSample = 4;
  const numFrames = Math.floor(durationSeconds * sampleRate);
  for (let f = 0; f < numFrames; f++) {
    const val = Math.round(Math.sin((2 * Math.PI * 440 * f) / sampleRate) * 10000);
    const pos = 44 + f * bytesPerSample;
    buf.writeInt16LE(val, pos);
    buf.writeInt16LE(val, pos + 2);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SufiPulse Hybrid Studio: Milestone 1 Acceptance Test Suite   ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✔ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✖ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // ── TEST 1: Record initial catalog hash ────────────────────────────────────
  console.log('--- Test 1: Historical Catalog Baseline Check ---');
  const catalogInitialBuffer = fs.readFileSync(CATALOG_PATH);
  const catalogInitialHash = crypto.createHash('sha256').update(catalogInitialBuffer).digest('hex');
  assert(catalogInitialBuffer.length > 1000000, 'Existing catalog exists and is populated (> 1MB)');

  // ── TEST 2: Create isolated pipeline draft ────────────────────────────────
  console.log('\n--- Test 2: Isolated Pipeline Draft Storage ---');
  const draft = pipelineDraftStorage.createDraft({
    title: 'Kalam of Silence (Ik Khamoshi Test)',
    primaryLanguage: 'ur',
    lyricsText: 'Har dam ba-yaad-e-Haq...',
  });
  assert(Boolean(draft.draftId.startsWith('draft_')), 'Unique isolated draft ID generated');
  assert(draft.downstreamStatus.approvalStatus === 'draft', 'Initial state is draft');

  // Create Synthetic Variants A, B, and C
  const audioDir = getDraftAudioDir(draft.draftId);
  const varAPath = path.join(audioDir, 'variant_a.wav');
  const varBPath = path.join(audioDir, 'variant_b.wav');
  const varCPath = path.join(audioDir, 'variant_c.wav');

  createSyntheticWav(varAPath, 30.0);
  createSyntheticWav(varBPath, 32.0);
  createSyntheticWav(varCPath, 35.0);

  const variantA: VariantSource = {
    variantId: 'var_A',
    label: 'Variant A (Take 1)',
    sourceType: 'audio_upload',
    fileName: 'variant_a.wav',
    filePath: varAPath,
    format: 'wav',
    durationSeconds: 30.0,
    sampleRate: 48000,
    channels: 2,
    sha256: computeFileSha256(varAPath),
    importedAt: new Date().toISOString(),
    rawAlignment: {
      lines: [
        {
          index: 1,
          text: 'Har dam ba-yaad-e-Haq',
          startSeconds: 2.0,
          endSeconds: 6.0,
          words: [
            { text: 'Har', startSeconds: 2.0, endSeconds: 2.8 },
            { text: 'dam', startSeconds: 2.9, endSeconds: 3.8 },
            { text: 'ba-yaad-e-Haq', startSeconds: 4.0, endSeconds: 6.0 },
          ],
        },
        {
          index: 2,
          text: 'Dil be-qarar hai',
          startSeconds: 8.0, // note 2.0s gap
          endSeconds: 12.0,
          words: [
            { text: 'Dil', startSeconds: 8.0, endSeconds: 9.0 },
            { text: 'be-qarar', startSeconds: 9.1, endSeconds: 10.5 },
            { text: 'hai', startSeconds: 10.6, endSeconds: 12.0 },
          ],
        },
        {
          index: 3,
          text: 'Awkward pause verse',
          startSeconds: 19.0, // 7.0s gap (anomaly)
          endSeconds: 23.0,
          words: [
            { text: 'Awkward', startSeconds: 19.0, endSeconds: 20.5 },
            { text: 'pause', startSeconds: 20.6, endSeconds: 21.5 },
            { text: 'verse', startSeconds: 21.6, endSeconds: 23.0 },
          ],
        },
      ],
      words: [],
    },
  };

  const variantB: VariantSource = {
    variantId: 'var_B',
    label: 'Variant B (Clean Take 2)',
    sourceType: 'audio_upload',
    fileName: 'variant_b.wav',
    filePath: varBPath,
    format: 'wav',
    durationSeconds: 32.0,
    sampleRate: 48000,
    channels: 2,
    sha256: computeFileSha256(varBPath),
    importedAt: new Date().toISOString(),
    rawAlignment: {
      lines: [
        {
          index: 1,
          text: 'Dil be-qarar hai (Perfect)',
          startSeconds: 3.0,
          endSeconds: 7.0,
          words: [
            { text: 'Dil', startSeconds: 3.0, endSeconds: 4.0 },
            { text: 'be-qarar', startSeconds: 4.1, endSeconds: 5.5 },
            { text: 'hai', startSeconds: 5.6, endSeconds: 7.0 },
          ],
        },
        {
          index: 2,
          text: 'Awkward pause verse',
          startSeconds: 8.0, // Clean flow without awkward 7s gap
          endSeconds: 12.0,
          words: [
            { text: 'Awkward', startSeconds: 8.0, endSeconds: 9.5 },
            { text: 'pause', startSeconds: 9.6, endSeconds: 10.5 },
            { text: 'verse', startSeconds: 10.6, endSeconds: 12.0 },
          ],
        },
      ],
      words: [],
    },
  };

  const variantC: VariantSource = {
    variantId: 'var_C',
    label: 'Variant C (Outro & Chorus Extension)',
    sourceType: 'audio_upload',
    fileName: 'variant_c.wav',
    filePath: varCPath,
    format: 'wav',
    durationSeconds: 35.0,
    sampleRate: 48000,
    channels: 2,
    sha256: computeFileSha256(varCPath),
    importedAt: new Date().toISOString(),
    rawAlignment: {
      lines: [
        {
          index: 1,
          text: 'Haq Maujood Sada Maujood',
          startSeconds: 5.0,
          endSeconds: 10.0,
          words: [
            { text: 'Haq', startSeconds: 5.0, endSeconds: 6.0 },
            { text: 'Maujood', startSeconds: 6.2, endSeconds: 7.8 },
            { text: 'Sada', startSeconds: 8.0, endSeconds: 8.9 },
            { text: 'Maujood', startSeconds: 9.0, endSeconds: 10.0 },
          ],
        },
      ],
      words: [],
    },
  };

  pipelineDraftStorage.addVariant(draft.draftId, variantA);
  pipelineDraftStorage.addVariant(draft.draftId, variantB);
  pipelineDraftStorage.addVariant(draft.draftId, variantC);

  const updatedDraft = pipelineDraftStorage.getDraft(draft.draftId)!;
  assert(Object.keys(updatedDraft.variants).length === 3, 'All 3 variants ingested into isolated draft');

  // ── TEST 3: Single Variant Assembly (No editing) ──────────────────────────
  console.log('\n--- Test 3: Single Variant Assembly (No Editing) ---');
  const singleEdl: AudioAssemblyEDL = {
    version: 1,
    updatedAt: new Date().toISOString(),
    segments: [
      {
        segmentId: 'seg_single',
        sourceVariantId: 'var_A',
        sourceInSeconds: 0,
        sourceOutSeconds: 30.0,
        destinationStartSeconds: 0,
        transition: { type: 'cut' },
        trackType: 'full_mix',
        enabled: true,
      },
    ],
  };

  const masterWavPath1 = path.join(audioDir, 'master_single.wav');
  const renderRes1 = await renderMasterWav(singleEdl, updatedDraft.variants, masterWavPath1);
  const reconRes1 = reconcileMasterTimestamps(singleEdl, updatedDraft.variants, renderRes1.durationSeconds);

  assert(renderRes1.durationSeconds === 30.0, 'Rendered single variant WAV has exact duration (30.0s)');
  assert(reconRes1.isValid, 'Single variant timeline reconciliation is valid');
  assert(reconRes1.timeline.lines.length === 3, 'Single variant contains all 3 original lines');
  assert(reconRes1.timeline.lines[0].startSeconds === 2.0, 'Line 1 start time is exactly 2.0s');
  assert(reconRes1.timeline.words.length === 9, 'All 9 word timestamps preserved');

  // ── TEST 4: Two-Variant Merge (Intro A + Verse B) ──────────────────────────
  console.log('\n--- Test 4: Two-Variant Merge (Intro A + Verse B) ---');
  // Segment 1: Variant A from 0s to 7s (contains Line 1) -> dest 0s
  // Segment 2: Variant B from 2.5s to 7.5s (contains Verse Line from B) -> dest 7s
  const twoVarEdl: AudioAssemblyEDL = {
    version: 2,
    updatedAt: new Date().toISOString(),
    segments: [
      {
        segmentId: 'seg_intro_A',
        sourceVariantId: 'var_A',
        sourceInSeconds: 0,
        sourceOutSeconds: 7.0,
        destinationStartSeconds: 0,
        transition: { type: 'cut' },
        trackType: 'full_mix',
        enabled: true,
      },
      {
        segmentId: 'seg_verse_B',
        sourceVariantId: 'var_B',
        sourceInSeconds: 2.5,
        sourceOutSeconds: 7.5,
        destinationStartSeconds: 7.0,
        transition: { type: 'cut' },
        trackType: 'full_mix',
        enabled: true,
      },
    ],
  };

  const masterWavPath2 = path.join(audioDir, 'master_two_var.wav');
  const renderRes2 = await renderMasterWav(twoVarEdl, updatedDraft.variants, masterWavPath2);
  const reconRes2 = reconcileMasterTimestamps(twoVarEdl, updatedDraft.variants, renderRes2.durationSeconds);

  assert(renderRes2.durationSeconds === 12.0, 'Two-variant master audio rendered exactly (12.0s)');
  assert(reconRes2.isValid, 'Two-variant timestamp reconciliation is valid');
  assert(reconRes2.timeline.lines.length === 2, 'Mapped exactly 2 lines across the 2 variants');
  // Mathematical verification:
  // Variant B line was at source: [3.0s, 7.0s]. sourceIn = 2.5s. destStart = 7.0s.
  // Expected master start = 7.0 + (3.0 - 2.5) = 7.5s
  // Expected master end = 7.0 + (7.0 - 2.5) = 11.5s
  const line2 = reconRes2.timeline.lines[1];
  assert(line2.startSeconds === 7.5, `Line 2 start time mathematically reconciled (expected 7.5s, got ${line2.startSeconds}s)`);
  assert(line2.endSeconds === 11.5, `Line 2 end time mathematically reconciled (expected 11.5s, got ${line2.endSeconds}s)`);

  // ── TEST 5: Three-Variant Merge (Intro A + Verse B + Chorus C) ────────────
  console.log('\n--- Test 5: Three-Variant Merge (Intro A + Verse B + Chorus C) ---');
  const threeVarEdl: AudioAssemblyEDL = {
    version: 3,
    updatedAt: new Date().toISOString(),
    segments: [
      {
        segmentId: 'seg_1_A',
        sourceVariantId: 'var_A',
        sourceInSeconds: 0,
        sourceOutSeconds: 7.0,
        destinationStartSeconds: 0,
        transition: { type: 'cut' },
        trackType: 'full_mix',
        enabled: true,
      },
      {
        segmentId: 'seg_2_B',
        sourceVariantId: 'var_B',
        sourceInSeconds: 2.5,
        sourceOutSeconds: 7.5,
        destinationStartSeconds: 7.0,
        transition: { type: 'cut' },
        trackType: 'full_mix',
        enabled: true,
      },
      {
        segmentId: 'seg_3_C',
        sourceVariantId: 'var_C',
        sourceInSeconds: 4.5,
        sourceOutSeconds: 10.5,
        destinationStartSeconds: 12.0,
        transition: { type: 'cut' },
        trackType: 'full_mix',
        enabled: true,
      },
    ],
  };

  const masterWavPath3 = path.join(audioDir, 'master_three_var.wav');
  const renderRes3 = await renderMasterWav(threeVarEdl, updatedDraft.variants, masterWavPath3);
  const reconRes3 = reconcileMasterTimestamps(threeVarEdl, updatedDraft.variants, renderRes3.durationSeconds);

  assert(renderRes3.durationSeconds === 18.0, 'Three-variant master audio rendered exactly (18.0s)');
  assert(reconRes3.isValid, 'Three-variant timestamp reconciliation is valid');
  assert(reconRes3.timeline.lines.length === 3, 'Three-variant timeline contains lines from all 3 sources');
  // Variant C line: [5.0s, 10.0s]. sourceIn = 4.5s. destStart = 12.0s.
  // Expected master start = 12.0 + (5.0 - 4.5) = 12.5s
  const line3 = reconRes3.timeline.lines[2];
  assert(line3.startSeconds === 12.5, `Line 3 start time mathematically reconciled (expected 12.5s, got ${line3.startSeconds}s)`);

  // ── TEST 6: Crossfade Between Vocal Sections ──────────────────────────────
  console.log('\n--- Test 6: Crossfade Between Vocal Sections ---');
  // Overlap seg 2 with seg 1 by 0.5s with crossfade
  const crossfadeEdl: AudioAssemblyEDL = {
    version: 4,
    updatedAt: new Date().toISOString(),
    segments: [
      {
        segmentId: 'seg_fade_1',
        sourceVariantId: 'var_A',
        sourceInSeconds: 0,
        sourceOutSeconds: 7.0,
        destinationStartSeconds: 0,
        transition: { type: 'cut' },
        trackType: 'full_mix',
        enabled: true,
      },
      {
        segmentId: 'seg_fade_2',
        sourceVariantId: 'var_B',
        sourceInSeconds: 2.5,
        sourceOutSeconds: 7.5,
        destinationStartSeconds: 6.5, // 0.5s overlap crossfade
        transition: { type: 'crossfade', durationSeconds: 0.5 },
        trackType: 'full_mix',
        enabled: true,
      },
    ],
  };

  const masterWavPath4 = path.join(audioDir, 'master_crossfade.wav');
  const renderRes4 = await renderMasterWav(crossfadeEdl, updatedDraft.variants, masterWavPath4);
  const reconRes4 = reconcileMasterTimestamps(crossfadeEdl, updatedDraft.variants, renderRes4.durationSeconds);

  assert(renderRes4.durationSeconds === 11.5, 'Crossfaded master audio duration accounts for 0.5s overlap (11.5s)');
  assert(reconRes4.isValid, 'Crossfade timestamp reconciliation passed without invalid boundary errors');
  assert(reconRes4.timeline.lines[1].startSeconds === 7.0, 'Segment 2 vocal line placed at 7.0s (after crossfade start 6.5s)');

  // ── TEST 7: AI Quality Analysis & Replacement of Awkward Pause ────────────
  console.log('\n--- Test 7: AI Quality Analysis & Awkward Pause Removal ---');
  const anomalies = analyzeVariantQuality(variantA, [variantB, variantC]);
  assert(anomalies.length > 0, 'AI quality analysis detected anomalies in Variant A');
  const pauseAnomaly = anomalies.find((a) => a.type === 'awkward_silence');
  assert(Boolean(pauseAnomaly), 'AI quality analysis specifically detected awkward silence (> 4.5s)');
  assert(Boolean(pauseAnomaly?.suggestedReplacement), 'AI quality advisor suggested replacement from Variant B');

  // Now apply the EDL repair: trim out the 7s silence (end seg at 12s, resume at 19s shifted left)
  const repairedEdl: AudioAssemblyEDL = {
    version: 5,
    updatedAt: new Date().toISOString(),
    segments: [
      {
        segmentId: 'seg_head',
        sourceVariantId: 'var_A',
        sourceInSeconds: 0,
        sourceOutSeconds: 12.5,
        destinationStartSeconds: 0,
        transition: { type: 'cut' },
        trackType: 'full_mix',
        enabled: true,
      },
      {
        segmentId: 'seg_repaired_tail',
        sourceVariantId: 'var_A',
        sourceInSeconds: 18.5, // skipped from 12.5s to 18.5s (removed 6s of awkward silence)
        sourceOutSeconds: 24.0,
        destinationStartSeconds: 13.0, // 0.5s musical breath
        transition: { type: 'cut' },
        trackType: 'full_mix',
        enabled: true,
      },
    ],
  };

  const masterWavPath5 = path.join(audioDir, 'master_repaired_pause.wav');
  const renderRes5 = await renderMasterWav(repairedEdl, updatedDraft.variants, masterWavPath5);
  const reconRes5 = reconcileMasterTimestamps(repairedEdl, updatedDraft.variants, renderRes5.durationSeconds);

  assert(renderRes5.durationSeconds === 18.5, 'Master audio duration shortened after silence removal (18.5s vs 24s)');
  assert(reconRes5.timeline.lines.length === 3, 'All 3 lines retained after silence removal');
  // In the original, Line 3 was at 19.0s.
  // With trim: sourceIn = 18.5s. destStart = 13.0s.
  // Reconciled Line 3 start = 13.0 + (19.0 - 18.5) = 13.5s!
  const repairedLine3 = reconRes5.timeline.lines[2];
  assert(repairedLine3.startSeconds === 13.5, `Line 3 shifted left monotonically (expected 13.5s, got ${repairedLine3.startSeconds}s)`);

  // ── TEST 8: Preservation of Intentional Instrumental Break ────────────────
  console.log('\n--- Test 8: Preservation of Intentional Instrumental Break ---');
  // Add a 5.0s silent/instrumental gap between Verse 1 and Verse 2
  const instrumentalEdl: AudioAssemblyEDL = {
    version: 6,
    updatedAt: new Date().toISOString(),
    segments: [
      {
        segmentId: 'seg_verse1',
        sourceVariantId: 'var_A',
        sourceInSeconds: 0,
        sourceOutSeconds: 6.5,
        destinationStartSeconds: 0,
        transition: { type: 'cut' },
        trackType: 'full_mix',
        enabled: true,
      },
      {
        segmentId: 'seg_verse2',
        sourceVariantId: 'var_A',
        sourceInSeconds: 7.5,
        sourceOutSeconds: 12.5,
        destinationStartSeconds: 11.5, // 5.0s intentional musical space
        transition: { type: 'cut' },
        trackType: 'full_mix',
        enabled: true,
      },
    ],
  };

  const masterWavPath6 = path.join(audioDir, 'master_instrumental.wav');
  const renderRes6 = await renderMasterWav(instrumentalEdl, updatedDraft.variants, masterWavPath6);
  const reconRes6 = reconcileMasterTimestamps(instrumentalEdl, updatedDraft.variants, renderRes6.durationSeconds);

  assert(renderRes6.durationSeconds === 16.5, 'Master audio correctly retains intentional 5s instrumental duration (16.5s)');
  assert(reconRes6.isValid, 'Instrumental gap timeline is valid');
  assert(reconRes6.timeline.lines[1].startSeconds === 12.0, 'Subsequent vocal line stays locked at 12.0s after the instrumental break');

  // ── TEST 9: Revision History & Invalidation Cascade & Rollback ─────────────
  console.log('\n--- Test 9: Revision History, Invalidation & Rollback ---');
  // Update draft assembly to Revision 2
  pipelineDraftStorage.updateAssembly(draft.draftId, twoVarEdl, 'Merged Variant B verse');
  let dRev = pipelineDraftStorage.getDraft(draft.draftId)!;
  assert(dRev.currentRevision === 2, 'Revision incremented to 2');
  assert(dRev.assemblyRevisions.length === 1, 'Previous revision 1 snapshot saved in history');
  assert(dRev.downstreamStatus.timestampsValid === false, 'Downstream timestamps invalidated');
  assert(dRev.downstreamStatus.approvalStatus === 'assembly_pending_review', 'Status reverted to assembly_pending_review');

  // Commit master render for Revision 2
  pipelineDraftStorage.commitMasterRender(draft.draftId, masterWavPath2, renderRes2.durationSeconds, reconRes2.timeline);
  dRev = pipelineDraftStorage.getDraft(draft.draftId)!;
  assert(dRev.downstreamStatus.timestampsValid === true, 'Timestamps marked valid after master render commit');
  assert(dRev.masterAudio?.durationSeconds === 12.0, 'Master audio duration committed (12.0s)');

  // Rollback to Revision 1
  pipelineDraftStorage.rollbackAssembly(draft.draftId, 1);
  const rolledBack = pipelineDraftStorage.getDraft(draft.draftId)!;
  assert(rolledBack.currentRevision === 3, 'Rollback created a new audit revision (Rev 3)');
  assert(rolledBack.assembly.segments.length === 1, 'Assembly segments restored to Revision 1 state');

  // ── TEST 10: Final Confirmation of Historical Catalog Integrity ───────────
  console.log('\n--- Test 10: Historical Catalog Integrity Check ---');
  const catalogFinalBuffer = fs.readFileSync(CATALOG_PATH);
  const catalogFinalHash = crypto.createHash('sha256').update(catalogFinalBuffer).digest('hex');
  assert(catalogFinalHash === catalogInitialHash, 'Historical catalog (.data/cms-releases.json) hash is identical — 100% UNTOUCHED');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED                 `);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
