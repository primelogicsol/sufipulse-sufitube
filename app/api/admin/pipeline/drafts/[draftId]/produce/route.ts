import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage, isValidDraftId } from '@/server/storage/pipeline-draft-storage';
import { runProductionChain, isProductionRunning } from '@/server/services/production-runner';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** POST: start (or resume) the full automated chain in the background. Idempotent. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { draftId } = await params;
  if (!isValidDraftId(draftId)) return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
  const draft = pipelineDraftStorage.getDraft(draftId);
  if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  if (!draft.masterAudio?.filePath) {
    return NextResponse.json({ error: 'Render the genuine master WAV first.' }, { status: 422 });
  }
  if (isProductionRunning(draftId)) {
    return NextResponse.json({ started: false, alreadyRunning: true, productionStatus: (draft as any).productionStatus }, { status: 202 });
  }
  runProductionChain(draftId).catch((e: any) => {
    console.warn(`[produce] ${draftId} stopped: ${e?.message || e}`);
  });
  return NextResponse.json({ started: true }, { status: 202 });
}
