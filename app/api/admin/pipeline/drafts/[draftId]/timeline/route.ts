import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';
import { generateMultilingualPackage } from '@/server/services/multilingual-pipeline';
import { exportAllSubtitles } from '@/server/services/subtitle-generator';
import {
  parseCanonicalPoemDocument,
  alignVocalPhrasesToTimeline,
} from '@/server/services/lyric-parser';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { draftId } = await params;
    const draft = pipelineDraftStorage.getDraft(draftId);
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    if (!draft.masterTimeline) {
      return NextResponse.json({
        error: 'Master audio must be rendered before accessing timeline',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      masterTimeline: draft.masterTimeline,
      masterAudio: draft.masterAudio,
      canonicalLyrics: draft.canonicalLyrics,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { draftId } = await params;
    const draft = pipelineDraftStorage.getDraft(draftId);
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    if (!draft.masterTimeline) {
      return NextResponse.json({
        error: 'Master audio must be rendered before updating timeline',
      }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || 'save_lines');
    const masterDuration =
      draft.masterTimeline.durationSeconds ||
      draft.masterAudio?.durationSeconds ||
      285.2;

    if (action === 'save_lines') {
      const incomingLines = Array.isArray(body.lines) ? body.lines : [];
      if (incomingLines.length === 0) {
        return NextResponse.json({ error: 'No lines provided' }, { status: 400 });
      }

      // Never interpret proportional or hand-entered timestamps as verified audio alignment.
      // Reviewer must explicitly attest to checking the words against actual playback.
      if (body.audioAlignmentReviewed !== true) {
        return NextResponse.json({ error: 'Review the actual recording against every lyric cue and confirm audioAlignmentReviewed before saving synchronized captions.', code: 'AUDIO_REVIEW_REQUIRED' }, { status: 422 });
      }
      const invalid = incomingLines.find((l: any) =>
        !Number.isFinite(Number(l.startSeconds)) || !Number.isFinite(Number(l.endSeconds)) ||
        Number(l.startSeconds) < 0 || Number(l.endSeconds) <= Number(l.startSeconds) ||
        Number(l.endSeconds) > masterDuration + 0.05 || !String(l.text || '').trim() ||
        !Array.isArray(l.words) || l.words.length === 0 || l.words.some((w: any) =>
          !Number.isFinite(Number(w.startSeconds)) || !Number.isFinite(Number(w.endSeconds)) ||
          Number(w.startSeconds) < Number(l.startSeconds) - 0.05 ||
          Number(w.endSeconds) > Number(l.endSeconds) + 0.05 ||
          Number(w.endSeconds) <= Number(w.startSeconds) || !String(w.text || '').trim()
        )
      );
      if (invalid) {
        return NextResponse.json({ error: 'Each reviewed lyric cue requires a valid timestamp and source-aligned word timestamps within the audio duration.', code: 'INVALID_WORD_ALIGNMENT' }, { status: 422 });
      }
      // Validate & clean incoming lines
      const cleaned = incomingLines.map((l: any, idx: number) => {
        const start = Math.max(0, Number(l.startSeconds) || 0);
        const end = Math.min(
          masterDuration,
          Math.max(start + 0.1, Number(l.endSeconds) || start + 1.5)
        );

        return {
          lineIndex: idx,
          vocalIndex: l.vocalIndex || idx + 1,
          segmentId: l.segmentId || 'seg_vocal',
          sourceVariantId: l.sourceVariantId || 'primary',
          sourceLineIndex: l.sourceLineIndex ?? idx,
          startSeconds: Number(start.toFixed(2)),
          endSeconds: Number(end.toFixed(2)),
          text: String(l.text || '').trim(),
          speaker: l.speaker || 'शायर',
          section: l.section || 'आग़ाज़',
          confidence: Number.isFinite(Number(l.confidence)) ? Number(l.confidence) : 0,
          urduNastaliq: l.urduNastaliq,
          englishTranslation: l.englishTranslation,
          romanUrdu: l.romanUrdu,
          devanagariUrdu: l.devanagariUrdu || l.text,
          isProductionDirection: false,
          words: l.words || [],
        };
      });

      // Calculate stats
      let overlaps = 0;
      for (let i = 1; i < cleaned.length; i++) {
        if (cleaned[i].startSeconds < cleaned[i - 1].endSeconds) {
          overlaps++;
        }
      }

      if (overlaps > 0) {
        return NextResponse.json({ error: 'Overlapping lyric cues require correction before approval.', code: 'OVERLAPPING_CAPTIONS' }, { status: 422 });
      }
      draft.masterTimeline.lines = cleaned;
      draft.masterTimeline.words = cleaned.flatMap((line: any) => line.words);
      draft.masterTimeline.stats = {
        lineCount: cleaned.length,
        wordCount: cleaned.reduce((acc: number, l: any) => acc + l.words.length, 0),
        overlapCount: overlaps,
        crossfadeBoundaryWarnings: 0,
      };

      // Automatically recompile subtitles to sync disk files
      const subDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'subtitles');
      const pkg = generateMultilingualPackage(
        draft.masterTimeline,
        draft.canonicalLyrics.text,
        draft.primaryLanguage
      );
      exportAllSubtitles(pkg, subDir);

      draft.downstreamStatus.timestampsValid = true;
      draft.downstreamStatus.subtitlesValid = true;
      // Caption edits make every previously rendered master out of date.
      draft.downstreamStatus.videoValid = false;
      pipelineDraftStorage.saveDraft(draft);

      return NextResponse.json({
        success: true,
        masterTimeline: draft.masterTimeline,
        package: pkg,
      });
    }

    if (action === 'reset_alignment') {
      const doc = parseCanonicalPoemDocument(draft.canonicalLyrics.text);
      const aligned = alignVocalPhrasesToTimeline(doc.vocalLines, masterDuration);

      draft.masterTimeline.lines = aligned.map((v, idx) => ({
        lineIndex: idx,
        vocalIndex: v.vocalIndex,
        segmentId: 'seg_vocal',
        sourceVariantId: 'primary',
        sourceLineIndex: v.lineIndex,
        startSeconds: v.startSeconds || 0,
        endSeconds: v.endSeconds || 0,
        text: v.text,
        speaker: v.speaker,
        section: v.section,
        confidence: v.confidence ?? 0,
        urduNastaliq: v.urduNastaliq,
        englishTranslation: v.englishTranslation,
        romanUrdu: v.romanUrdu,
        devanagariUrdu: v.devanagariUrdu,
        isProductionDirection: false,
        words: [],
      }));

      draft.masterTimeline.words = [];
      draft.masterTimeline.stats = {
        lineCount: draft.masterTimeline.lines.length,
        wordCount: 0,
        overlapCount: 0,
        crossfadeBoundaryWarnings: 0,
      };

      const subDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'subtitles');
      const pkg = generateMultilingualPackage(
        draft.masterTimeline,
        draft.canonicalLyrics.text,
        draft.primaryLanguage
      );
      exportAllSubtitles(pkg, subDir);

      draft.downstreamStatus.timestampsValid = false;
      draft.downstreamStatus.subtitlesValid = false;
      draft.downstreamStatus.videoValid = false;
      if (draft.video) { draft.video.status = 'PENDING'; draft.video.formats = {}; }
      draft.downstreamStatus.approvalStatus = 'assembly_pending_review';
      pipelineDraftStorage.saveDraft(draft);

      return NextResponse.json({
        success: true,
        warning: 'Proportional lyric timing is an unverified preview, not synchronized captions. Review against actual audio before rendering.',
        masterTimeline: draft.masterTimeline,
        package: pkg,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
