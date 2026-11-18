import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  pipelineDraftStorage,
  isValidDraftId,
  BASE_DATA_DIR,
} from '@/server/storage/pipeline-draft-storage';
import { applyDefaultVideoParts } from '@/server/services/default-video-parts';

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
    // Fresh drafts automatically receive the shared Canva Part B background / verified Part C promo.
    if (applyDefaultVideoParts(draft)) pipelineDraftStorage.saveDraft(draft);
    return NextResponse.json(
      { draft },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
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

    // Canonical identity is frozen once the release is published.
    const isPublished =
      (draft as any).publishingTx?.status === 'VISIBILITY_UNVEILED' ||
      draft.downstreamStatus?.approvalStatus === 'published';
    if (isPublished && (body.title || body.slug)) {
      return NextResponse.json(
        { error: 'Canonical title and slug are frozen after publication.', code: 'CANONICAL_TITLE_FROZEN' },
        { status: 409 }
      );
    }

    if (body.title) draft.title = String(body.title).trim();
    if (body.slug) {
      const cleanSlug = String(body.slug)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (cleanSlug) draft.slug = cleanSlug;
    }
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
      if (body.approvalStatus === 'approved_for_publishing' && (!draft.masterTimeline?.lines?.length || !draft.masterTimeline.lines.some(line => line.words?.length))) {
        return NextResponse.json({ error: 'Cannot approve a lyric video with unverified caption alignment.', code: 'CAPTION_ALIGNMENT_MISSING' }, { status: 422 });
      }
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
