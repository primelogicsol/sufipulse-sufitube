import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  pipelineDraftStorage,
  getDraftAudioDir,
} from '@/server/storage/pipeline-draft-storage';
import { renderMasterWav } from '@/server/services/audio-splicer';
import { reconcileMasterTimestamps } from '@/server/services/timestamp-reconciler';

export const dynamic = 'force-dynamic';

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

    if (!draft.assembly.segments.length) {
      return NextResponse.json({ error: 'No assembly segments to render' }, { status: 400 });
    }

    const audioDir = getDraftAudioDir(draftId);
    const masterWavPath = path.join(audioDir, `master_rev${draft.currentRevision}.wav`);

    // 1. Lossless intermediate master render
    const renderResult = await renderMasterWav(draft.assembly, draft.variants, masterWavPath);

    // 2. Authoritative timestamp reconciliation & boundary validation
    const recon = reconcileMasterTimestamps(
      draft.assembly,
      draft.variants,
      renderResult.durationSeconds
    );

    if (!recon.isValid) {
      return NextResponse.json(
        {
          error: 'Master timestamp reconciliation failed validation',
          errors: recon.errors,
          warnings: recon.warnings,
        },
        { status: 422 }
      );
    }

    // 3. Commit master render to draft
    const updatedDraft = pipelineDraftStorage.commitMasterRender(
      draftId,
      renderResult.outputPath,
      renderResult.durationSeconds,
      recon.timeline
    );

    return NextResponse.json({
      success: true,
      masterAudio: updatedDraft.masterAudio,
      timeline: updatedDraft.masterTimeline,
      engineUsed: renderResult.engineUsed,
      warnings: recon.warnings,
      draft: updatedDraft,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
