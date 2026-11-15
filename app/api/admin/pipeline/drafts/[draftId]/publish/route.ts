import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';

export const dynamic = 'force-dynamic';

// Fail closed. The former implementation generated fake YouTube IDs,
// then incorrectly marked CMS releases as publicly published.
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({
    error: 'YouTube publishing is not implemented in this Studio workflow. Use Approve Final & Transfer to CMS first. A real authenticated YouTube upload with verified video ID and caption tracks is required before public publishing.',
    code: 'YOUTUBE_DELIVERY_NOT_IMPLEMENTED',
  }, { status: 501 });
}
