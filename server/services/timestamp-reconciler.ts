/**
 * server/services/timestamp-reconciler.ts
 *
 * Authoritative Master Timestamp Reconciler for Multi-Variant Assembly.
 * Implements non-destructive mathematical time mapping:
 *   t_master = t_source - t_cut_start + t_dest_start
 * with deep validation of crossfades, word boundaries, and monotonicity.
 */

import type {
  AudioAssemblyEDL,
  VariantSource,
  ReconciledMasterTimeline,
  ReconciledLine,
  ReconciledWord,
} from '@/server/types/pipeline-draft';

const EPSILON = 0.001; // 1 millisecond tolerance

export interface TimestampReconciliationResult {
  timeline: ReconciledMasterTimeline;
  warnings: string[];
  errors: string[];
  isValid: boolean;
}

export function reconcileMasterTimestamps(
  edl: AudioAssemblyEDL,
  variants: Record<string, VariantSource>,
  renderedAudioDurationSeconds?: number
): TimestampReconciliationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  const enabledSegments = (edl.segments || [])
    .filter((s) => s.enabled)
    .sort((a, b) => a.destinationStartSeconds - b.destinationStartSeconds);

  if (enabledSegments.length === 0) {
    return {
      timeline: {
        revision: edl.version,
        durationSeconds: 0,
        lines: [],
        words: [],
        stats: { lineCount: 0, wordCount: 0, overlapCount: 0, crossfadeBoundaryWarnings: 0 },
        validation: { isMonotonic: true, boundaryClashes: [], confidenceScore: 100 },
      },
      warnings: ['No enabled segments in EDL'],
      errors: [],
      isValid: true,
    };
  }

  const reconciledLines: ReconciledLine[] = [];
  const allWords: ReconciledWord[] = [];
  let calculatedDuration = 0;
  let crossfadeWarningsCount = 0;

  for (let sIdx = 0; sIdx < enabledSegments.length; sIdx++) {
    const seg = enabledSegments[sIdx];
    const variant = variants[seg.sourceVariantId];

    if (!variant) {
      errors.push(`Segment ${seg.segmentId} references missing variant ${seg.sourceVariantId}`);
      continue;
    }

    const sourceIn = Math.max(0, seg.sourceInSeconds);
    const sourceOut = Math.min(variant.durationSeconds, seg.sourceOutSeconds || variant.durationSeconds);
    const destStart = Math.max(0, seg.destinationStartSeconds);
    const segDuration = sourceOut - sourceIn;

    if (segDuration <= 0) {
      errors.push(`Segment ${seg.segmentId} has non-positive duration (${segDuration.toFixed(3)}s)`);
      continue;
    }

    const segEnd = destStart + segDuration;
    if (segEnd > calculatedDuration) {
      calculatedDuration = segEnd;
    }

    // Check crossfade overlap with previous segment
    if (sIdx > 0 && seg.transition?.type === 'crossfade') {
      const prevSeg = enabledSegments[sIdx - 1];
      const prevEnd = prevSeg.destinationStartSeconds + (prevSeg.sourceOutSeconds - prevSeg.sourceInSeconds);
      const xfadeDuration = seg.transition.durationSeconds || 0.5;

      if (destStart > prevEnd) {
        warnings.push(
          `Segment ${seg.segmentId} specifies crossfade but begins after previous segment ends (gap of ${(destStart - prevEnd).toFixed(3)}s)`
        );
      } else {
        const overlap = prevEnd - destStart;
        if (Math.abs(overlap - xfadeDuration) > 0.05) {
          warnings.push(
            `Crossfade duration (${xfadeDuration}s) does not match segment timing overlap (${overlap.toFixed(3)}s)`
          );
        }
      }
    }

    const alignment = variant.rawAlignment;
    if (!alignment || !alignment.lines || alignment.lines.length === 0) {
      // Instrumental or unaligned segment: timeline remains valid for audio, no lyric lines to map
      continue;
    }

    const excluded = new Set<number>(seg.excludedLineIndexes || []);

    for (const srcLine of alignment.lines) {
      if (excluded.has(srcLine.index)) continue;

      // Check if line falls within the trimmed source window
      if (srcLine.endSeconds <= sourceIn + EPSILON || srcLine.startSeconds >= sourceOut - EPSILON) {
        continue; // Line is outside the trimmed bounds
      }

      // Mathematical mapping formula:
      // t_master = t_source - sourceIn + destStart
      const clippedSourceStart = Math.max(srcLine.startSeconds, sourceIn);
      const clippedSourceEnd = Math.min(srcLine.endSeconds, sourceOut);

      const masterStart = destStart + (clippedSourceStart - sourceIn);
      const masterEnd = destStart + (clippedSourceEnd - sourceIn);

      // Reconcile words
      const lineWords: ReconciledWord[] = [];
      const srcWords = srcLine.words || [];

      for (const srcWord of srcWords) {
        if (srcWord.endSeconds <= sourceIn + EPSILON || srcWord.startSeconds >= sourceOut - EPSILON) {
          continue;
        }

        const clippedWordStart = Math.max(srcWord.startSeconds, sourceIn);
        const clippedWordEnd = Math.min(srcWord.endSeconds, sourceOut);

        if (clippedWordEnd > clippedWordStart + EPSILON) {
          const wMaster: ReconciledWord = {
            text: srcWord.text,
            startSeconds: Number((destStart + (clippedWordStart - sourceIn)).toFixed(3)),
            endSeconds: Number((destStart + (clippedWordEnd - sourceIn)).toFixed(3)),
            sourceVariantId: seg.sourceVariantId,
            sourceStartSeconds: srcWord.startSeconds,
            sourceEndSeconds: srcWord.endSeconds,
          };
          lineWords.push(wMaster);
          allWords.push(wMaster);
        }
      }

      const isDirection =
        srcLine.text.trim().startsWith('[') || srcLine.text.trim().startsWith('(');

      reconciledLines.push({
        lineIndex: reconciledLines.length + 1,
        segmentId: seg.segmentId,
        sourceVariantId: seg.sourceVariantId,
        sourceLineIndex: srcLine.index,
        startSeconds: Number(masterStart.toFixed(3)),
        endSeconds: Number(masterEnd.toFixed(3)),
        text: srcLine.text,
        isProductionDirection: isDirection,
        words: lineWords,
      });
    }
  }

  // Sort lines monotonically
  reconciledLines.sort((a, b) => a.startSeconds - b.startSeconds || a.endSeconds - b.endSeconds);
  allWords.sort((a, b) => a.startSeconds - b.startSeconds);

  // Validate Monotonicity & Clashes
  const boundaryClashes: string[] = [];
  let overlapCount = 0;

  for (let i = 1; i < reconciledLines.length; i++) {
    const prev = reconciledLines[i - 1];
    const curr = reconciledLines[i];

    if (curr.startSeconds < prev.endSeconds - EPSILON) {
      overlapCount++;
      const overlapSec = (prev.endSeconds - curr.startSeconds).toFixed(3);
      const clashMsg = `Overlap between Line ${prev.lineIndex} ("${prev.text.slice(0, 20)}...") and Line ${curr.lineIndex} ("${curr.text.slice(0, 20)}...") by ${overlapSec}s`;
      boundaryClashes.push(clashMsg);

      // Distinguish minor crossfade vocal blend (< 0.6s) from severe clash
      if (Number(overlapSec) > 0.6) {
        warnings.push(`Significant vocal overlap detected: ${clashMsg}`);
        crossfadeWarningsCount++;
      }
    }
  }

  // Word-level boundary verification
  for (let w = 1; w < allWords.length; w++) {
    const prevW = allWords[w - 1];
    const currW = allWords[w];
    if (currW.startSeconds < prevW.endSeconds - 0.05) {
      // Overlapping words
      crossfadeWarningsCount++;
    }
  }

  // Validate against rendered audio duration if provided
  const finalDuration = renderedAudioDurationSeconds || calculatedDuration;
  if (renderedAudioDurationSeconds && Math.abs(calculatedDuration - renderedAudioDurationSeconds) > 0.25) {
    warnings.push(
      `Calculated assembly duration (${calculatedDuration.toFixed(3)}s) differs from rendered audio file (${renderedAudioDurationSeconds.toFixed(3)}s) by more than 250ms`
    );
  }

  // Check if any line overflows final duration
  for (const line of reconciledLines) {
    if (line.endSeconds > finalDuration + 0.1) {
      errors.push(
        `Line ${line.lineIndex} end time (${line.endSeconds}s) exceeds final master duration (${finalDuration.toFixed(3)}s)`
      );
    }
  }

  const confidenceScore = Math.max(
    0,
    100 - boundaryClashes.length * 5 - warnings.length * 3 - errors.length * 20
  );

  const timeline: ReconciledMasterTimeline = {
    revision: edl.version,
    durationSeconds: Number(finalDuration.toFixed(3)),
    lines: reconciledLines,
    words: allWords,
    stats: {
      lineCount: reconciledLines.length,
      wordCount: allWords.length,
      overlapCount,
      crossfadeBoundaryWarnings: crossfadeWarningsCount,
    },
    validation: {
      isMonotonic: boundaryClashes.length === 0,
      boundaryClashes,
      confidenceScore,
    },
  };

  return {
    timeline,
    warnings,
    errors,
    isValid: errors.length === 0,
  };
}
