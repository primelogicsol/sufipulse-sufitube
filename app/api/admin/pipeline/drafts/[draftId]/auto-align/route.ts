import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { runAutoAlignForDraft, AutoAlignError } from '@/server/services/auto-align-runner';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { draftId } = await params;
    const body = await request.json().catch(() => ({}));
    const result = await runAutoAlignForDraft(draftId, {
      model: body.model ? String(body.model) : undefined,
      language: body.language ? String(body.language) : null,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    if (err instanceof AutoAlignError) {
      return NextResponse.json({ error: err.message, code: err.code, ...(err.extra || {}) }, { status: err.status });
    }
    const detail = String(err?.stderr || err?.message || err);
    return NextResponse.json({ error: detail.slice(-2000) }, { status: 500 });
  }
}
