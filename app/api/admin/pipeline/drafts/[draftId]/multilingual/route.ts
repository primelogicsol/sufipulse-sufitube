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
      structuredClone(draft.masterTimeline),
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
        structuredClone(draft.masterTimeline),
        draft.canonicalLyrics.text,
        draft.primaryLanguage
      );

      // Persist generated language fields onto draft.masterTimeline so cues are never empty
      if (Array.isArray(draft.masterTimeline.lines)) {
        pkg.lines.forEach((pl: any, i: number) => {
          const cue: any = draft.masterTimeline!.lines[i];
          if (!cue) return;
          if (!cue.urduNastaliq && pl.urduNastaliq) cue.urduNastaliq = pl.urduNastaliq;
          if (!cue.englishTranslation && pl.englishTranslation) cue.englishTranslation = pl.englishTranslation;
          if (!cue.romanUrdu && pl.romanUrdu) cue.romanUrdu = pl.romanUrdu;
          if (!cue.devanagariUrdu && pl.devanagariUrdu) cue.devanagariUrdu = pl.devanagariUrdu;
        });
        pipelineDraftStorage.saveDraft(draft);
      }

      // Estimated phrase positions are previews, not verified source alignment.
      return NextResponse.json({ success: true, package: pkg, timingVerified: Boolean(draft.masterTimeline.lines.some(line => line.words?.length)), warning: 'Generated phrase times are estimates until synchronized against the recorded vocals.' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
