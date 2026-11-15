import { NextResponse, NextRequest } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const drafts = pipelineDraftStorage.listDrafts();
    const items = drafts.map((draft) => {
      const variants = Object.values(draft.variants || {});
      const active = draft.activeVariantId ? draft.variants?.[draft.activeVariantId] : undefined;
      const enabledSegments = (draft.assembly?.segments || []).filter((s) => s.enabled);

      return {
        releaseId: draft.draftId,
        title: draft.title,
        sourceCount: variants.length,
        primarySourceId: active?.sourceAssetId || active?.fileName || 'None',
        extensionCount: Math.max(0, variants.length - 1),
        alignmentStatus: draft.downstreamStatus?.timestampsValid ? 'Verified' : 'Pending',
        assemblyStatus: enabledSegments.length > 1 ? 'Compiled' : enabledSegments.length === 1 ? 'Single Source' : 'Missing',
        masterTimingStatus: draft.masterAudio?.filePath ? 'Ready' : 'Pending',
        captionStatus: draft.downstreamStatus?.subtitlesValid ? 'Ready' : 'Pending',
        approvalStatus: draft.downstreamStatus?.approvalStatus || 'assembly_pending_review',
        updatedAt: draft.updatedAt,
      };
    });

    return NextResponse.json({ queue: items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
