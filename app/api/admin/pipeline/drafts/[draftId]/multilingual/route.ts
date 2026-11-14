import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';
import { generateMultilingualPackage } from '@/server/services/multilingual-pipeline';

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
        error: 'Master audio must be rendered before generating multilingual translations',
      }, { status: 400 });
    }

    const pkg = generateMultilingualPackage(
      draft.masterTimeline,
      draft.canonicalLyrics.text,
      draft.primaryLanguage
    );

    return NextResponse.json({ success: true, package: pkg });
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
        error: 'Master audio must be rendered before generating multilingual translations',
      }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || 'generate');

    if (action === 'generate') {
      const pkg = generateMultilingualPackage(
        draft.masterTimeline,
        draft.canonicalLyrics.text,
        draft.primaryLanguage
      );

      pipelineDraftStorage.saveDraft(draft);
      return NextResponse.json({ success: true, package: pkg });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
