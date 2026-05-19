// app/api/admin/google-ads/intelligence/plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { getIntelligencePlan, upsertIntelligencePlan } from '@/app/lib/server/google-ads-intelligence-store';
import { IntelligencePlan } from '@/lib/google-ads/intelligence-types';

/**
 * GET /api/admin/google-ads/intelligence/plan?adoptionId=...
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const adoptionId = searchParams.get('adoptionId');
  if (!adoptionId) return NextResponse.json({ error: 'adoptionId required' }, { status: 400 });

  const plan = await getIntelligencePlan(adoptionId);
  return NextResponse.json(plan || { adoptionId, exists: false });
}

/**
 * POST /api/admin/google-ads/intelligence/plan
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const plan: IntelligencePlan = await request.json();
    if (!plan.adoptionId) return NextResponse.json({ error: 'adoptionId required' }, { status: 400 });

    const saved = await upsertIntelligencePlan({
      ...plan,
      preparedBy: authResult.id
    });

    return NextResponse.json(saved);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
