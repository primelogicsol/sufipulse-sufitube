import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  pipelineDraftStorage,
  getDraftAudioDir,
} from '@/server/storage/pipeline-draft-storage';
import { renderMasterWav } from '@/server/services/audio-splicer';
import { reconcileMasterTimestamps } from '@/server/services/timestamp-reconciler';
import { runProductionChain, isProductionRunning } from '@/server/services/production-runner';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { draftId } = await params;
    const body = await request.json().catch(() => null);
    const draft = pipelineDraftStorage.getDraft(draftId);
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    // URL-only Suno variants in older drafts were synthesized as reference tones.
    // Never turn those files back into an apparently authoritative audio master.
    const selected = body?.selectVariantId ? draft.variants[body.selectVariantId] : undefined;
    if (body?.selectVariantId && (!selected || selected.sourceType === 'suno_url')) {
      return NextResponse.json({ error: 'Choose an imported recording for the master.' }, { status: 422 });
    }
    if (selected) {
      draft.assembly = { ...draft.assembly, segments: [{
        segmentId: 'seg_master_' + selected.variantId,
        sourceVariantId: selected.variantId, sourceInSeconds: 0, sourceOutSeconds: selected.durationSeconds,
        destinationStartSeconds: 0, transition: { type: 'cut' }, trackType: 'full_mix', enabled: true,
      }] };
    }
    const referencedIds = draft.assembly.segments.filter(s => s.enabled).map(s => s.sourceVariantId);
    if (body?.expectedVariantId && (draft.masterAudio || draft.activeVariantId !== body.expectedVariantId ||
      referencedIds.length !== 1 || referencedIds[0] !== body.expectedVariantId)) {
      return NextResponse.json({ error: 'The selected assembly changed. Review it before rendering.' }, { status: 409 });
    }
    const sourceIds = referencedIds.length ? referencedIds : [draft.activeVariantId || Object.keys(draft.variants)[0]];
    if (sourceIds.some(id => draft.variants[id]?.sourceType === 'suno_url')) {
      return NextResponse.json({
        error: 'The selected Suno URL was imported as a synthetic reference tone, not original music. Upload the genuine Suno audio file and select it as the assembly source before re-rendering.',
        code: 'UNVERIFIED_SUNO_REFERENCE_AUDIO',
      }, { status: 422 });
    }

    if (!draft.assembly.segments.length) {
      const variantIds = Object.keys(draft.variants);
      if (variantIds.length === 0) {
        return NextResponse.json({ error: 'No variants ingested to render' }, { status: 400 });
      }
      const primaryId = draft.activeVariantId || variantIds[0];
      const primaryVariant = draft.variants[primaryId];
      draft.assembly.segments = [
        {
          segmentId: `seg_init_${Date.now()}`,
          sourceVariantId: primaryId,
          sourceInSeconds: 0,
          sourceOutSeconds: primaryVariant.durationSeconds,
          destinationStartSeconds: 0,
          transition: { type: 'cut' },
          trackType: 'full_mix',
          enabled: true,
        },
      ];
      pipelineDraftStorage.saveDraft(draft);
    }

    const audioDir = getDraftAudioDir(draftId);
    const targetRevision = draft.currentRevision + (selected ? 1 : 0);
    const masterWavPath = path.join(audioDir, `master_rev${targetRevision}.wav`);

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

    if (selected) {
      const latest = pipelineDraftStorage.getDraft(draftId);
      if (!latest || latest.currentRevision !== draft.currentRevision) {
        return NextResponse.json({ error: 'The assembly changed while rendering. Retry with the current draft.' }, { status: 409 });
      }
      draft.assembly.version = targetRevision;
      const updated = pipelineDraftStorage.updateAssembly(draftId, draft.assembly, 'Selected recording for master');
      updated.activeVariantId = selected.variantId;
      if (updated.video) { updated.video.status = 'PENDING'; updated.video.formats = {}; }
      pipelineDraftStorage.saveDraft(updated);
      recon.timeline.revision = targetRevision;
    }

    // 3. Commit master render to draft
    const updatedDraft = pipelineDraftStorage.commitMasterRender(
      draftId,
      renderResult.outputPath,
      renderResult.durationSeconds,
      recon.timeline
    );

    // A freshly fetched/uploaded recording has no word timing yet: start caption alignment
    // in the background so the editor does not have to click anything extra.
    const hasWordTiming = Boolean(updatedDraft.masterTimeline?.lines?.some((l: any) => l.words?.length));
    if (!hasWordTiming && updatedDraft.canonicalLyrics?.text?.trim() && !isProductionRunning(draftId)) {
      runProductionChain(draftId).catch((e: any) => {
        console.warn(`[render-master] production chain for ${draftId} stopped: ${e?.message || e}`);
      });
    }

    return NextResponse.json({
      success: true,
      masterAudio: updatedDraft.masterAudio,
      timeline: updatedDraft.masterTimeline,
      engineUsed: renderResult.engineUsed,
      warnings: recon.warnings,
      autoAlignStarted: !hasWordTiming,
      draft: updatedDraft,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
