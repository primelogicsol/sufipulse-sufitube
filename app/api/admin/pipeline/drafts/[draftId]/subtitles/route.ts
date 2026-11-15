import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';
import { generateMultilingualPackage } from '@/server/services/multilingual-pipeline';
import { exportAllSubtitles } from '@/server/services/subtitle-generator';

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

    const subDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'subtitles');
    if (!fs.existsSync(subDir)) {
      return NextResponse.json({ subtitles: {} });
    }

    const files = fs.readdirSync(subDir);
    const available = files.map((f) => ({
      fileName: f,
      sizeBytes: fs.statSync(path.join(subDir, f)).size,
      format: path.extname(f).replace('.', ''),
    }));

    return NextResponse.json({ files: available });
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

    if (!draft.masterTimeline?.lines?.length || !draft.masterTimeline.lines.some(line => line.words?.length)) {
      return NextResponse.json({
        error: 'Caption timing not verified: master timeline has no source-aligned words. Import a genuine audio/lyric alignment before compiling synchronized subtitles.',
        code: 'CAPTION_ALIGNMENT_MISSING',
      }, { status: 422 });
    }

    const subDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'subtitles');
    const pkg = generateMultilingualPackage(
      draft.masterTimeline,
      draft.canonicalLyrics.text,
      draft.primaryLanguage
    );

    const exported = exportAllSubtitles(pkg, subDir);

    draft.downstreamStatus.subtitlesValid = true;
    pipelineDraftStorage.saveDraft(draft);

    return NextResponse.json({
      success: true,
      exportedLanguages: Object.keys(exported),
      outputDirectory: subDir,
      dualSubtitleAssAvailable: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
