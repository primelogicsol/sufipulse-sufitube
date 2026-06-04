import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { registriesStorage, registryItemSchema, type RegistriesData } from '@/lib/registries-storage';

export const dynamic = 'force-dynamic';

// Helper to validate path params
function validateParams(type: string, slug: string) {
  const validTypes: Array<keyof RegistriesData> = [
    'concepts', 'themes', 'moods', 'regions', 'languages', 'diasporaMarkets', 'playlists'
  ];

  if (!validTypes.includes(type as any)) {
    return { error: `Invalid registry type: ${type}`, status: 400 };
  }

  if (!slug || slug.trim().length === 0) {
    return { error: 'Slug parameter is required', status: 400 };
  }

  return null;
}

// DELETE /api/admin/registries/[type]/[slug]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { type, slug } = await params;
    const errorResult = validateParams(type, slug);
    if (errorResult) return NextResponse.json({ error: errorResult.error }, { status: errorResult.status });

    const exists = registriesStorage.getItem(type as any, slug);
    if (!exists) {
      return NextResponse.json({ error: 'Registry item not found' }, { status: 404 });
    }

    const deleted = registriesStorage.deleteItem(type as any, slug);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
