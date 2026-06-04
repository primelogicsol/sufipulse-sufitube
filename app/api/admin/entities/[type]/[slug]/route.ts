import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { knowledgeStorage, type KnowledgeEntityType } from '@/lib/knowledge-storage';
import { graphResolver } from '@/lib/graph-resolver';

export const dynamic = 'force-dynamic';

// DELETE /api/admin/entities/[type]/[slug]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { type, slug } = await params;
    
    // Check if entity type is valid
    const validTypes: KnowledgeEntityType[] = [
      'saint', 'scholar', 'poet', 'practice', 'quranicTheme', 'spiritualState', 'musicalTradition', 'literaryTradition'
    ];

    if (!validTypes.includes(type as any)) {
      return NextResponse.json({ error: `Invalid entity type: ${type}` }, { status: 400 });
    }

    knowledgeStorage.forceHydrate();
    const exists = knowledgeStorage.getEntity(slug, type as any);
    if (!exists) {
      return NextResponse.json({ error: 'Knowledge Entity not found' }, { status: 404 });
    }

    // Delete entity
    const deleted = knowledgeStorage.deleteEntity(slug, type as any);
    
    // Clean up graph joins connected to this entity target
    if (deleted) {
      graphResolver.forceHydrate();
      graphResolver.removeAllJoinsForRegistry(slug); // Cleans up any joins referencing this slug in graph
    }

    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
