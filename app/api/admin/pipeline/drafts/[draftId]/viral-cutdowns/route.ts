/**
 * app/api/admin/pipeline/drafts/[draftId]/viral-cutdowns/route.ts
 *
 * Universal API endpoint to generate, list, and serve 9:16 vertical viral cutdowns
 * for both Hybrid Studio pipeline drafts and Universal CMS catalog releases.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import {
  generateViralCutdowns,
  generateCatalogCutdowns,
} from '@/server/services/viral-cutdown-generator';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const draft = pipelineDraftStorage.getDraft(draftId);
  const release = !draft ? cmsServerStorage.getRelease(draftId) : null;

  if (!draft && !release) {
    return NextResponse.json({ error: 'Release or Draft not found' }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const assetId = searchParams.get('asset');

  // If requesting metadata listing (no asset specified), require admin auth
  if (!assetId) {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    if (draft) {
      const existing = (draft as any).viralCutdowns;
      return NextResponse.json({
        draftId,
        viralCutdowns: existing?.items || [],
        youtubeShorts: (draft as any).youtubeShorts || {},
        generatedAt: existing?.generatedAt || null,
      });
    } else {
      const cutdowns = await generateCatalogCutdowns(draftId);
      return NextResponse.json({
        releaseId: draftId,
        viralCutdowns: cutdowns,
        youtubeShorts: release?.youtubeShorts || {},
        generatedAt: new Date().toISOString(),
      });
    }
  }

  // If requesting a video asset download/preview:
  // Public delivery is allowed if release/draft is approved/published, or if admin is logged in
  const isApprovedOrPublished = draft
    ? draft.downstreamStatus?.approvalStatus === 'approved_for_publishing' ||
      draft.productionStatus?.state === 'done' ||
      (draft as any).status === 'published'
    : release?.status === 'published' || release?.status === 'approved' || release?.visibility === 'public';

  if (!isApprovedOrPublished) {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;
  }

  // Ephemeral video storage in OS tmpdir (zero disk footprint in repository)
  const draftDir = path.join(os.tmpdir(), 'sufipulse-cutdowns', draftId);

  const filenameMap: Record<string, string> = {
    hook_15s: 'viral_cutdown_hook_15s.mp4',
    chorus_30s: 'viral_cutdown_chorus_30s.mp4',
    climax_45s: 'viral_cutdown_climax_45s.mp4',
  };

  const targetFile = filenameMap[assetId];
  if (!targetFile) {
    return NextResponse.json({ error: 'Invalid asset ID' }, { status: 400 });
  }

  const candidateFiles = [
    targetFile,
    targetFile.replace('viral_', ''),
    assetId === 'hook_15s' ? 'cutdown_15s_hook.mp4' : '',
    assetId === 'chorus_30s' ? 'cutdown_30s_chorus.mp4' : '',
    assetId === 'climax_45s' ? 'cutdown_45s_climax.mp4' : '',
  ].filter(Boolean);

  let resolvedPath = '';
  for (const f of candidateFiles) {
    const p = path.join(draftDir, f);
    if (fs.existsSync(p)) {
      resolvedPath = p;
      break;
    }
  }

  if (!resolvedPath) {
    try {
      if (draft) {
        await generateViralCutdowns(draftId);
      } else {
        await generateCatalogCutdowns(draftId);
      }

      for (const f of candidateFiles) {
        const p = path.join(draftDir, f);
        if (fs.existsSync(p)) {
          resolvedPath = p;
          break;
        }
      }
    } catch (genErr: any) {
      console.error('[ViralCutdowns] Auto-generation error:', genErr?.message);
    }
  }

  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    return NextResponse.json({ error: 'Cutdown file not yet generated' }, { status: 404 });
  }

  const stat = fs.statSync(resolvedPath);
  const range = request.headers.get('range');

  const createSafeWebStream = (start?: number, end?: number) => {
    const fileStream = fs.createReadStream(resolvedPath, { start, end });
    return new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => {
          try {
            controller.enqueue(chunk);
          } catch {}
        });
        fileStream.on('end', () => {
          try {
            controller.close();
          } catch {}
        });
        fileStream.on('error', (err) => {
          try {
            controller.error(err);
          } catch {}
        });
      },
      cancel() {
        fileStream.destroy();
      },
    });
  };

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = end - start + 1;
    const webStream = createSafeWebStream(start, end);

    return new NextResponse(webStream as any, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': 'video/mp4',
        'Content-Disposition': `inline; filename="${targetFile}"`,
      },
    });
  }

  const webStream = createSafeWebStream();
  return new NextResponse(webStream as any, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(stat.size),
      'Accept-Ranges': 'bytes',
      'Content-Disposition': `inline; filename="${targetFile}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { draftId } = await params;
  const draft = pipelineDraftStorage.getDraft(draftId);

  try {
    if (draft) {
      const result = await generateViralCutdowns(draftId);
      return NextResponse.json({
        success: true,
        draftId,
        cutdowns: result.cutdowns,
        sourceVideoUsed: result.sourceVideoUsed,
        sourceOrientation: result.sourceOrientation,
      });
    } else {
      const cutdowns = await generateCatalogCutdowns(draftId);
      return NextResponse.json({
        success: true,
        releaseId: draftId,
        cutdowns,
        sourceVideoUsed: 'catalog_artwork',
        sourceOrientation: 'portrait',
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to generate viral cutdowns' },
      { status: 500 }
    );
  }
}
