import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';
import { analyzeVariantQuality } from '@/server/services/audio-quality-analyzer';
import { reconcileMasterTimestamps } from '@/server/services/timestamp-reconciler';
import type { AudioAssemblyEDL } from '@/server/types/pipeline-draft';

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

    const activeVar = draft.variants[draft.activeVariantId];
    const otherVars = Object.values(draft.variants).filter((v) => v.variantId !== draft.activeVariantId);
    const anomalies = activeVar ? analyzeVariantQuality(activeVar, otherVars) : [];

    // Preliminary timeline reconciliation preview
    const recon = reconcileMasterTimestamps(draft.assembly, draft.variants);

    return NextResponse.json({
      assembly: draft.assembly,
      currentRevision: draft.currentRevision,
      revisions: draft.assemblyRevisions.map((r) => ({
        revision: r.revision,
        updatedAt: r.updatedAt,
        changeNote: r.changeNote,
      })),
      previewTimeline: recon.timeline,
      anomalies,
      warnings: recon.warnings,
      errors: recon.errors,
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

    const body = await request.json();
    const action = String(body.action || 'update_assembly');

    if (action === 'rollback') {
      const targetRev = Number(body.targetRevision);
      if (!targetRev) return NextResponse.json({ error: 'targetRevision is required' }, { status: 400 });
      const updated = pipelineDraftStorage.rollbackAssembly(draftId, targetRev);
      return NextResponse.json({ success: true, draft: updated });
    }

    if (action === 'update_assembly') {
      const newEDL = body.edl as AudioAssemblyEDL;
      if (!newEDL || !Array.isArray(newEDL.segments)) {
        return NextResponse.json({ error: 'Valid EDL with segments array is required' }, { status: 400 });
      }

      const note = String(body.changeNote || 'Manual assembly edit');
      const updated = pipelineDraftStorage.updateAssembly(draftId, newEDL, note);

      return NextResponse.json({ success: true, draft: updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
