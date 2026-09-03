import 'server-only';

import type {
  NormalizedPrivateAudioAlignment,
  PrivateAlignedWord,
} from '@/server/integrations/private-audio-alignment';

export type PrivateAudioSourceRole =
  | 'primary'
  | 'extension'
  | 'alternate'
  | 'correction'
  | 'other';

export type PrivateAudioTransition = {
  type: 'cut' | 'crossfade';
  durationSeconds?: number;
};

export type PrivateAudioAssemblySegment = {
  segmentId: string;
  sourceAssetId: string;
  role: PrivateAudioSourceRole;
  parentSourceAssetId?: string;
  order: number;
  sourceInSeconds: number;
  sourceOutSeconds?: number;
  destinationStartSeconds: number;
  transition?: PrivateAudioTransition;
  excludedSourceLineIndexes?: number[];
  enabled?: boolean;
};

export type PrivateAudioAssemblyDefinition = {
  version: number;
  updatedAt: string;
  segments: PrivateAudioAssemblySegment[];
};

export type CompiledPrivateAudioWord = PrivateAlignedWord & {
  sourceStartSeconds: number;
  sourceEndSeconds: number;
};

export type CompiledPrivateAudioLine = {
  segmentId: string;
  sourceAssetId: string;
  sourceLineIndex: number;
  sourceStartSeconds: number;
  sourceEndSeconds: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  section?: string;
  isProductionDirection: boolean;
  clippedAtStart: boolean;
  clippedAtEnd: boolean;
  words: CompiledPrivateAudioWord[];
};

export type CompiledPrivateAudioAssembly = {
  assemblyVersion: number;
  lines: CompiledPrivateAudioLine[];
  durationSeconds: number;
  stats: {
    segmentCount: number;
    sourceCount: number;
    lineCount: number;
    publishableLineCount: number;
    productionDirectionCount: number;
    excludedLineCount: number;
    clippedLineCount: number;
    overlapCount: number;
  };
};

const EPSILON = 0.001;

const finiteNonNegative = (value: number, label: string) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite non-negative number.`);
  }
};

const validateSegment = (
  segment: PrivateAudioAssemblySegment,
  alignment: NormalizedPrivateAudioAlignment,
) => {
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(segment.segmentId)) {
    throw new Error(`Invalid segmentId: ${segment.segmentId}`);
  }
  if (!segment.sourceAssetId.trim()) {
    throw new Error(`Segment ${segment.segmentId} is missing sourceAssetId.`);
  }
  finiteNonNegative(segment.sourceInSeconds, `Segment ${segment.segmentId} sourceInSeconds`);
  finiteNonNegative(segment.destinationStartSeconds, `Segment ${segment.segmentId} destinationStartSeconds`);
  if (!Number.isFinite(segment.order) || segment.order < 0) {
    throw new Error(`Segment ${segment.segmentId} order must be a finite non-negative number.`);
  }

  const sourceOut = segment.sourceOutSeconds ?? alignment.durationSeconds;
  finiteNonNegative(sourceOut, `Segment ${segment.segmentId} sourceOutSeconds`);
  if (sourceOut <= segment.sourceInSeconds + EPSILON) {
    throw new Error(`Segment ${segment.segmentId} sourceOutSeconds must be after sourceInSeconds.`);
  }
  if (sourceOut > alignment.durationSeconds + 0.25) {
    throw new Error(
      `Segment ${segment.segmentId} sourceOutSeconds exceeds the aligned source duration (${alignment.durationSeconds.toFixed(3)}s).`,
    );
  }

  if (segment.transition?.type === 'crossfade') {
    const duration = segment.transition.durationSeconds ?? 0;
    finiteNonNegative(duration, `Segment ${segment.segmentId} crossfade duration`);
    if (duration <= 0) {
      throw new Error(`Segment ${segment.segmentId} crossfade duration must be greater than zero.`);
    }
  }
};

const transformWord = (
  word: PrivateAlignedWord,
  sourceIn: number,
  sourceOut: number,
  destinationStart: number,
): CompiledPrivateAudioWord | null => {
  const clippedStart = Math.max(word.startSeconds, sourceIn);
  const clippedEnd = Math.min(word.endSeconds, sourceOut);
  if (clippedEnd <= clippedStart + EPSILON) return null;

  return {
    text: word.text,
    startSeconds: destinationStart + (clippedStart - sourceIn),
    endSeconds: destinationStart + (clippedEnd - sourceIn),
    sourceStartSeconds: word.startSeconds,
    sourceEndSeconds: word.endSeconds,
  };
};

export function compilePrivateAudioAssembly(
  definition: PrivateAudioAssemblyDefinition,
  alignmentsBySourceAssetId: Record<string, NormalizedPrivateAudioAlignment>,
): CompiledPrivateAudioAssembly {
  if (!Number.isFinite(definition.version) || definition.version < 1) {
    throw new Error('Assembly version must be a positive number.');
  }
  if (!Array.isArray(definition.segments) || !definition.segments.length) {
    throw new Error('Assembly must contain at least one segment.');
  }

  const enabledSegments = definition.segments
    .filter((segment) => segment.enabled !== false)
    .sort((a, b) => a.order - b.order || a.destinationStartSeconds - b.destinationStartSeconds || a.segmentId.localeCompare(b.segmentId));

  if (!enabledSegments.length) {
    throw new Error('Assembly does not contain any enabled segments.');
  }

  const seenSegmentIds = new Set<string>();
  const lines: CompiledPrivateAudioLine[] = [];
  let excludedLineCount = 0;
  let durationSeconds = 0;

  for (const segment of enabledSegments) {
    if (seenSegmentIds.has(segment.segmentId)) {
      throw new Error(`Duplicate assembly segmentId: ${segment.segmentId}`);
    }
    seenSegmentIds.add(segment.segmentId);

    const alignment = alignmentsBySourceAssetId[segment.sourceAssetId];
    if (!alignment) {
      throw new Error(`No alignment is available for assembly source ${segment.sourceAssetId}.`);
    }
    validateSegment(segment, alignment);

    const sourceIn = segment.sourceInSeconds;
    const sourceOut = segment.sourceOutSeconds ?? alignment.durationSeconds;
    const excluded = new Set(segment.excludedSourceLineIndexes || []);
    durationSeconds = Math.max(
      durationSeconds,
      segment.destinationStartSeconds + (sourceOut - sourceIn),
    );

    for (const line of alignment.lines) {
      if (excluded.has(line.index)) {
        excludedLineCount += 1;
        continue;
      }

      const clippedSourceStart = Math.max(line.startSeconds, sourceIn);
      const clippedSourceEnd = Math.min(line.endSeconds, sourceOut);
      if (clippedSourceEnd <= clippedSourceStart + EPSILON) continue;

      const transformedWords = line.words
        .map((word) => transformWord(word, sourceIn, sourceOut, segment.destinationStartSeconds))
        .filter((word): word is CompiledPrivateAudioWord => Boolean(word));

      lines.push({
        segmentId: segment.segmentId,
        sourceAssetId: segment.sourceAssetId,
        sourceLineIndex: line.index,
        sourceStartSeconds: line.startSeconds,
        sourceEndSeconds: line.endSeconds,
        startSeconds: segment.destinationStartSeconds + (clippedSourceStart - sourceIn),
        endSeconds: segment.destinationStartSeconds + (clippedSourceEnd - sourceIn),
        text: line.text,
        section: line.section,
        isProductionDirection: line.isProductionDirection,
        clippedAtStart: line.startSeconds < sourceIn,
        clippedAtEnd: line.endSeconds > sourceOut,
        words: transformedWords,
      });
    }
  }

  lines.sort((a, b) =>
    a.startSeconds - b.startSeconds ||
    a.endSeconds - b.endSeconds ||
    a.segmentId.localeCompare(b.segmentId) ||
    a.sourceLineIndex - b.sourceLineIndex,
  );

  let overlapCount = 0;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].startSeconds < lines[index - 1].endSeconds - EPSILON) {
      overlapCount += 1;
    }
  }

  const productionDirectionCount = lines.filter((line) => line.isProductionDirection).length;
  const clippedLineCount = lines.filter((line) => line.clippedAtStart || line.clippedAtEnd).length;

  return {
    assemblyVersion: definition.version,
    lines,
    durationSeconds,
    stats: {
      segmentCount: enabledSegments.length,
      sourceCount: new Set(enabledSegments.map((segment) => segment.sourceAssetId)).size,
      lineCount: lines.length,
      publishableLineCount: lines.length - productionDirectionCount,
      productionDirectionCount,
      excludedLineCount,
      clippedLineCount,
      overlapCount,
    },
  };
}
