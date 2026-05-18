import { NextRequest, NextResponse } from 'next/server';
import { entityGetById, entityUpdate } from '@/lib/entity-storage-server';
import { validateRequestBody } from '@/app/lib/api-middleware';
import { literaryContributorProfileSchema } from '@/app/lib/validation-schemas';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  const existing = entityGetById('literary', id) as any;
  if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

  // Security check: must have valid tracking token to submit revision without auth
  if (existing.trackingToken !== token) {
    return NextResponse.json({ error: 'Unauthorized revision' }, { status: 401 });
  }

  const validationResult = await validateRequestBody(request, literaryContributorProfileSchema);
  if (validationResult instanceof NextResponse) return validationResult;

  try {
    const body = validationResult.data;
    const updated = entityUpdate('literary', id, {
      ...body,
      profile_status: 'under_review', // Bump back to review after revision
      updated_at: new Date().toISOString(),
    });

    console.log(`[Literary Revision] Profile updated: ${id}`);

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
