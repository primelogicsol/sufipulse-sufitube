import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { buildStudioCmsAutofill } from '@/server/services/studio-cms-autofill';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const release = cmsServerStorage.getRelease(id);
  if (!release) return NextResponse.json({ error: 'Release not found' }, { status: 404 });
  try {
    const suggestion = buildStudioCmsAutofill(release);
    return NextResponse.json(suggestion, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Studio auto-fill unavailable' }, { status: 422 });
  }
}
