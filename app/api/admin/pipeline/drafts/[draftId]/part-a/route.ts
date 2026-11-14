import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage, isValidDraftId } from '@/server/storage/pipeline-draft-storage';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { draftId } = await params;
    if (!isValidDraftId(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    }

    const draft = pipelineDraftStorage.getDraft(draftId);
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';

    // Direct image upload (FormData)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const canvaDesignId = String(formData.get('canvaDesignId') || 'DAHa7St5CYs');
      const canvaUrl = String(formData.get('canvaUrl') || 'https://canva.link/ezqj8ymddv6yl2d');
      const title = String(formData.get('title') || 'Part A Background Theme');

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const videoDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video');
      fs.mkdirSync(videoDir, { recursive: true });

      const ext = path.extname(file.name) || '.png';
      const targetFileName = `part_a_background_${Date.now()}${ext}`;
      const targetPath = path.join(videoDir, targetFileName);

      const arrayBuffer = await file.arrayBuffer();
      fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));

      if (!draft.video) {
        draft.video = {
          status: 'PENDING',
          renderedAt: new Date().toISOString(),
          formats: {},
        };
      }

      draft.video.partA = {
        canvaDesignId,
        canvaUrl,
        title,
        filePath: targetPath,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
      };

      pipelineDraftStorage.saveDraft(draft);
      return NextResponse.json({ success: true, partA: draft.video.partA, draft });
    }

    // JSON metadata update
    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (!draft.video) {
        draft.video = {
          status: 'PENDING',
          renderedAt: new Date().toISOString(),
          formats: {},
        };
      }

      draft.video.partA = {
        canvaDesignId: body.canvaDesignId || draft.video.partA?.canvaDesignId || 'DAHa7St5CYs',
        canvaUrl: body.canvaUrl || draft.video.partA?.canvaUrl || 'https://canva.link/ezqj8ymddv6yl2d',
        title: body.title || draft.video.partA?.title || 'Part A Background Theme',
        filePath: draft.video.partA?.filePath,
        fileName: draft.video.partA?.fileName,
      };

      pipelineDraftStorage.saveDraft(draft);
      return NextResponse.json({ success: true, partA: draft.video.partA, draft });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
