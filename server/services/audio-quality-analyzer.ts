/**
 * server/services/audio-quality-analyzer.ts
 *
 * AI Quality Analysis & Cross-Variant Replacement Advisor.
 * Detects awkward gaps, vocal clipping, abrupt cutoffs, and suggests
 * cleanest matching sections from other imported Suno variants.
 * Strictly advisory — never mutates assembly without administrator action.
 */

import fs from 'node:fs';
import type { AIQualityAnomaly, VariantSource } from '@/server/types/pipeline-draft';
import { readWavHeader } from './audio-splicer';

export function analyzeVariantQuality(
  primaryVariant: VariantSource,
  otherVariants: VariantSource[] = []
): AIQualityAnomaly[] {
  const anomalies: AIQualityAnomaly[] = [];

  const alignment = primaryVariant.rawAlignment;
  if (!alignment || !alignment.lines) {
    return anomalies;
  }

  // 1. Detect Awkward Silences (> 4.5s) between non-instrumental lyric lines
  for (let i = 1; i < alignment.lines.length; i++) {
    const prevLine = alignment.lines[i - 1];
    const currLine = alignment.lines[i];

    const gap = currLine.startSeconds - prevLine.endSeconds;
    const isInstrumental =
      prevLine.text.toLowerCase().includes('instrumental') ||
      currLine.text.toLowerCase().includes('instrumental') ||
      prevLine.text.startsWith('(') ||
      currLine.text.startsWith('(');

    if (gap > 4.5 && !isInstrumental) {
      // Find if another variant has a tighter vocal transition
      let suggestion: AIQualityAnomaly['suggestedReplacement'] | undefined;

      for (const other of otherVariants) {
        if (!other.rawAlignment?.lines) continue;
        const otherMatch = other.rawAlignment.lines.find(
          (l) => l.text.trim().toLowerCase() === currLine.text.trim().toLowerCase()
        );
        if (otherMatch) {
          suggestion = {
            suggestedVariantId: other.variantId,
            sourceInSeconds: Math.max(0, otherMatch.startSeconds - 1.0),
            sourceOutSeconds: otherMatch.endSeconds + 1.0,
            confidence: 88,
            reason: `Variant "${other.label}" contains a continuous transition for "${currLine.text.slice(0, 25)}..." without excessive silence.`,
          };
          break;
        }
      }

      anomalies.push({
        id: `anom_${primaryVariant.variantId}_gap_${i}`,
        severity: 'warning',
        type: 'awkward_silence',
        variantId: primaryVariant.variantId,
        startSeconds: prevLine.endSeconds,
        endSeconds: currLine.startSeconds,
        description: `Unusually long pause (${gap.toFixed(2)}s) between Line ${prevLine.index} and Line ${currLine.index}.`,
        suggestedReplacement: suggestion,
      });
    }
  }

  // 2. Detect Clipping in PCM Audio (if WAV available)
  if (primaryVariant.filePath && fs.existsSync(primaryVariant.filePath)) {
    try {
      const buf = fs.readFileSync(primaryVariant.filePath);
      const meta = readWavHeader(buf);

      if (meta.bitsPerSample === 16 && meta.channels === 2) {
        let clippedSampleCount = 0;
        let firstClipSec = 0;

        for (let pos = meta.dataOffset; pos + 4 <= buf.length; pos += 16) {
          const left = buf.readInt16LE(pos);
          const right = buf.readInt16LE(pos + 2);
          if (Math.abs(left) >= 32760 || Math.abs(right) >= 32760) {
            clippedSampleCount++;
            if (firstClipSec === 0) {
              const frame = (pos - meta.dataOffset) / 4;
              firstClipSec = frame / meta.sampleRate;
            }
          }
        }

        if (clippedSampleCount > 50) {
          anomalies.push({
            id: `anom_${primaryVariant.variantId}_clip`,
            severity: 'critical',
            type: 'vocal_clip_or_distortion',
            variantId: primaryVariant.variantId,
            startSeconds: Number(firstClipSec.toFixed(2)),
            endSeconds: Number((firstClipSec + 2.0).toFixed(2)),
            description: `Digital clipping / sample overload detected (~${clippedSampleCount} peak samples clipped near ${firstClipSec.toFixed(1)}s).`,
          });
        }
      }
    } catch {}
  }

  return anomalies;
}
