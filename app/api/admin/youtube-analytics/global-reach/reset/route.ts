import { NextRequest, NextResponse } from 'next/server';
import { globalReachGrowthEngine } from '@/lib/global-reach-growth-engine';
import { requireAdmin } from '@/server/middleware/authenticate';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// POST /api/admin/youtube-analytics/global-reach/reset
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const adminUser = (request as any).user;
    const adminActor = adminUser?.email || adminUser?.name || 'admin';
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'reset'; // 'reset' | 'rollback'

    if (action === 'rollback') {
      const historyId = body.historyId;
      if (!historyId) {
        return NextResponse.json({ error: 'historyId is required for rollback' }, { status: 400 });
      }
      const ok = globalReachGrowthEngine.rollback(historyId, adminActor);
      if (!ok) {
        return NextResponse.json({ error: 'Reconciliation record not found' }, { status: 404 });
      }
    } else {
      globalReachGrowthEngine.resetAdjustments(adminActor);
    }

    try {
      revalidatePath('/');
      revalidatePath('/releases');
    } catch (e) {
      console.warn('[Reset API] Cache revalidation error:', e);
    }

    return NextResponse.json({
      success: true,
      message: action === 'rollback' ? 'Rolled back to selected reconciliation event.' : 'Adjustments and reconciliation history reset.',
      growthStore: globalReachGrowthEngine.getStore(),
    });
  } catch (error: any) {
    console.error('[API /api/admin/youtube-analytics/global-reach/reset] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
