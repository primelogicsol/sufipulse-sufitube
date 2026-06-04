import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { registriesStorage, registryItemSchema, type RegistriesData } from '@/lib/registries-storage';

export const dynamic = 'force-dynamic';

// GET /api/admin/registries
// Returns the entire registry database
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Force re-hydration to get any updates written by other instances/terminal scripts
    registriesStorage.forceHydrate();
    const data = registriesStorage.getRawData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/registries
// Adds or updates a registry item
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { type, item } = body;

    // Validate registry type
    const validTypes: Array<keyof RegistriesData> = [
      'concepts', 'themes', 'moods', 'regions', 'languages', 'diasporaMarkets', 'playlists'
    ];

    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid registry type: ${type}. Allowed types: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (!item) {
      return NextResponse.json({ error: 'Missing registry item parameters' }, { status: 400 });
    }

    // Force date stamp and admin authorship fields
    const now = new Date().toISOString();
    const itemToValidate = {
      ...item,
      slug: String(item.slug || '').trim().toLowerCase(),
      createdAt: item.createdAt || now,
      updatedAt: now,
      createdBy: item.createdBy || authResult.email,
      updatedBy: authResult.email
    };

    // Zod validation
    const parsed = registryItemSchema.safeParse(itemToValidate);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Save item
    const saved = registriesStorage.saveItem(type, parsed.data as any);
    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
