import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { knowledgeStorage, knowledgeEntitySchema, type KnowledgeEntity } from '@/lib/knowledge-storage';

export const dynamic = 'force-dynamic';

// GET /api/admin/entities
// Returns all knowledge entities
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    knowledgeStorage.forceHydrate();
    const list = knowledgeStorage.getEntities();
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/entities
// Adds or updates a knowledge entity
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    
    // Auto stamp audit parameters
    const now = new Date().toISOString();
    const entityToValidate = {
      ...body,
      slug: String(body.slug || '').trim().toLowerCase(),
      createdAt: body.createdAt || now,
      updatedAt: now
    };

    // Zod validation
    const parsed = knowledgeEntitySchema.safeParse(entityToValidate);
    if (!parsed.success) {
      const errorStrings = parsed.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        { error: 'Validation failed', details: errorStrings },
        { status: 400 }
      );
    }

    const entity = parsed.data as KnowledgeEntity;

    // Enforce publication guidelines if setting isPublic to true
    if (entity.isPublic) {
      const pubCheck = knowledgeStorage.validatePublishReady(entity);
      if (!pubCheck.ready) {
        return NextResponse.json(
          { error: 'Cannot publish entity: Content does not meet minimum quality criteria.', details: pubCheck.errors },
          { status: 400 }
        );
      }
    }

    const saved = knowledgeStorage.saveEntity(entity);
    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
