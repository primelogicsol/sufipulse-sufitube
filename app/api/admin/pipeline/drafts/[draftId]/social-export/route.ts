import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage, isValidDraftId } from '@/server/storage/pipeline-draft-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { draftId } = await params;
  if (!isValidDraftId(draftId)) return NextResponse.json({ error: 'Invalid draft' }, { status: 400 });
  const draft = pipelineDraftStorage.getDraft(draftId);
  if (!draft || draft.downstreamStatus?.approvalStatus !== 'approved_for_publishing') {
    return NextResponse.json({ error: 'Approved Studio draft required' }, { status: 403 });
  }
  const format = request.nextUrl.searchParams.get('format');
  const key = format === 'clean' ? 'clean_cinematic_portrait' : format === 'lyric' ? 'lyric_master_portrait' : null;
  if (!key) return NextResponse.json({ error: 'Choose lyric or clean' }, { status: 400 });
  const selected = draft.video?.formats?.[key];
  const file = selected?.outputPath;
  if (!selected?.sha256 || selected.width !== 1080 || selected.height !== 1920 || !file ||
      !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return NextResponse.json({ error: 'Portrait master is unavailable or unverified' }, { status: 409 });
  }
  const allowed = path.resolve(process.cwd(), '.data', 'pipeline-drafts', draftId, 'video');
  const actual = fs.realpathSync(file);
  const allowedReal = fs.realpathSync(allowed);
  if (!actual.toLowerCase().startsWith((allowedReal + path.sep).toLowerCase())) {
    return NextResponse.json({ error: 'Video path is outside the approved draft' }, { status: 403 });
  }
  const size = fs.statSync(actual).size;
  const range = request.headers.get('range');
  let start = 0, end = size - 1;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
    }
    if (!match[1]) {
      const suffix = Number(match[2]);
      if (!Number.isSafeInteger(suffix) || suffix < 1) return new NextResponse(null, { status: 416 });
      start = Math.max(0, size - suffix);
    } else {
      start = Number(match[1]);
      if (match[2]) end = Number(match[2]);
    }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
    }
    end = Math.min(end, size - 1);
  }
  const downloadName = 'SufiPulse_' + draftId + '_' + key + '.mp4';
  const headers: Record<string, string> = {
    'Content-Type': 'video/mp4',
    'Content-Disposition': 'attachment; filename="' + downloadName + '"',
    'Content-Length': String(end - start + 1),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  if (range) headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + size;
  const stream = Readable.toWeb(fs.createReadStream(actual, { start, end })) as ReadableStream;
  return new NextResponse(stream, { status: range ? 206 : 200, headers });
}
