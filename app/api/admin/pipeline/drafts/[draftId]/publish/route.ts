import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';
import { executePublishingWorkflow } from '@/server/services/youtube-publisher';

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

    const body = await request.json().catch(() => ({}));

    // MANDATORY HUMAN APPROVAL GUARD:
    // Requires explicit admin confirmation flag in request payload
    if (body.adminApprovalConfirmed !== true) {
      return NextResponse.json({
        error: 'Mandatory human approval required: adminApprovalConfirmed must be explicitly set to true.',
        approvalStatus: draft.downstreamStatus.approvalStatus,
      }, { status: 403 });
    }

    const targetVisibility = (body.visibility === 'unlisted' ? 'unlisted' : 'public') as 'public' | 'unlisted';
    const videoFormat = (body.videoFormat === 'clean_cinematic' ? 'clean_cinematic' : 'lyric_master') as 'lyric_master' | 'clean_cinematic';
    const simulateOnly = body.simulateOnly !== false; // Default to simulate/safe dry-run unless live explicitly ordered

    const result = await executePublishingWorkflow({
      draftId,
      targetVisibility,
      videoFormat,
      simulateOnly,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
