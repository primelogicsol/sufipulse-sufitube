/**
 * app/api/admin/pipeline/drafts/[draftId]/upload-short/route.ts
 *
 * Ephemeral YouTube Shorts Generation and Upload API.
 * Uploads 9:16 vertical hooks directly to YouTube Shorts with zero disk retention.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import {
  uploadShortToYouTube,
  uploadAllShortsToYouTube,
  type ShortAssetId,
} from '@/server/services/youtube-shorts-uploader';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { draftId } = await params;
  const draft = pipelineDraftStorage.getDraft(draftId);
  const release = !draft ? cmsServerStorage.getRelease(draftId) : null;

  if (!draft && !release) {
    return NextResponse.json({ error: 'Release or Draft not found' }, { status: 404 });
  }

  const shorts = draft ? (draft as any).youtubeShorts : release?.youtubeShorts;

  return NextResponse.json({
    targetId: draftId,
    youtubeShorts: shorts || {},
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { draftId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const asset = searchParams.get('asset');

  let body: any = {};
  try {
    body = await request.json();
  } catch {}

  const privacyStatus = (body.privacyStatus || 'public') as 'public' | 'unlisted' | 'private';
  const customTitle = body.customTitle as string | undefined;

  try {
    if (asset === 'all') {
      const results = await uploadAllShortsToYouTube(draftId, privacyStatus);
      return NextResponse.json({
        success: true,
        batch: true,
        results,
      });
    }

    if (!asset || !['hook_15s', 'chorus_30s', 'climax_45s'].includes(asset)) {
      return NextResponse.json(
        { error: 'Valid asset query param required: hook_15s, chorus_30s, climax_45s, or all' },
        { status: 400 }
      );
    }

    const result = await uploadShortToYouTube({
      targetId: draftId,
      assetId: asset as ShortAssetId,
      privacyStatus,
      customTitle,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    console.error('[UploadShort API] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate and upload YouTube Short' },
      { status: 500 }
    );
  }
}
