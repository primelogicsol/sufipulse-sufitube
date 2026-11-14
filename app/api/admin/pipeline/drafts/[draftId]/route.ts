import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  pipelineDraftStorage,
  isValidDraftId,
  BASE_DATA_DIR,
} from '@/server/storage/pipeline-draft-storage';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { draftId } = await params;
    if (!isValidDraftId(draftId)) {
      return NextResponse.json(
        { error: `Invalid draft ID format: "${draftId}"`, code: 'INVALID_DRAFT_ID', draftId },
        { status: 400 }
      );
    }

    if (!fs.existsSync(BASE_DATA_DIR)) {
      return NextResponse.json(
        { error: 'Draft storage directory unavailable', code: 'DRAFT_STORAGE_UNAVAILABLE' },
        { status: 500 }
      );
    }

    const draft = pipelineDraftStorage.getDraft(draftId);
    if (!draft) {
      return NextResponse.json(
        { error: `Pipeline draft not found: ${draftId}`, code: 'DRAFT_NOT_FOUND', draftId },
        { status: 404 }
      );
    }
    return NextResponse.json({ draft });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: 'DRAFT_STORAGE_UNAVAILABLE' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { draftId } = await params;
    if (!isValidDraftId(draftId)) {
      return NextResponse.json(
        { error: `Invalid draft ID format: "${draftId}"`, code: 'INVALID_DRAFT_ID', draftId },
        { status: 400 }
      );
    }

    const draft = pipelineDraftStorage.getDraft(draftId);
    if (!draft) {
      return NextResponse.json(
        { error: `Pipeline draft not found: ${draftId}`, code: 'DRAFT_NOT_FOUND', draftId },
        { status: 404 }
      );
    }

    const body = await request.json();
    if (body.title) draft.title = String(body.title).trim();
    if (body.slug) draft.slug = String(body.slug).trim();
    if (body.canonicalLyrics) {
      draft.canonicalLyrics = {
        ...draft.canonicalLyrics,
        ...body.canonicalLyrics,
      };
    }
    if (body.activeVariantId && draft.variants[body.activeVariantId]) {
      draft.activeVariantId = body.activeVariantId;
    }
    if (body.approvalStatus) {
      draft.downstreamStatus.approvalStatus = body.approvalStatus;
      if (body.approvalStatus === 'approved_for_publishing') {
        draft.canonicalLyrics.status = 'APPROVED';
        draft.canonicalLyrics.approvedAt = new Date().toISOString();
        draft.canonicalLyrics.approvedBy = (auth as any)?.email || (auth as any)?.id || 'admin';
      }
    }

    pipelineDraftStorage.saveDraft(draft);
    return NextResponse.json({ draft });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: 'DRAFT_STORAGE_UNAVAILABLE' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { draftId } = await params;
    if (!isValidDraftId(draftId)) {
      return NextResponse.json(
        { error: `Invalid draft ID format: "${draftId}"`, code: 'INVALID_DRAFT_ID', draftId },
        { status: 400 }
      );
    }

    const deleted = pipelineDraftStorage.deleteDraft(draftId);
    if (!deleted) {
      return NextResponse.json(
        { error: `Pipeline draft not found: ${draftId}`, code: 'DRAFT_NOT_FOUND', draftId },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, deletedDraftId: draftId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: 'DRAFT_STORAGE_UNAVAILABLE' }, { status: 500 });
  }
}
