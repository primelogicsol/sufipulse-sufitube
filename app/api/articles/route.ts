import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { requireAdmin, requireAuth } from '@/server/middleware/authenticate';
import { validatePublicSubmission } from '@/app/lib/security';
import { articleSubmissionSchema } from '@/app/lib/validation-schemas';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const items = entityGetAll('articles');
    const sorted = items.sort((a: any, b: any) =>
      new Date(b.updated_at || b.created_at || 0).getTime() -
      new Date(a.updated_at || a.created_at || 0).getTime()
    );
    const result = authResult.role === 'admin'
      ? sorted
      : sorted.filter((i: any) => i.user_id === authResult.id);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const validation = await validatePublicSubmission(request, articleSubmissionSchema, {
    rateLimit: 'standard',
    sanitizationRules: {
      title: 'text',
      slug: 'slug',
      content: 'rich_text',
      excerpt: 'text',
      category: 'text',
      featured_image: 'url'
    }
  });

  if (validation instanceof NextResponse) return validation;
  const body = validation.data;

  try {
    const record = entityCreate('articles', {
      ...body,
      user_id: authResult.id,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    });
    notifyAdminNewSubmission(
      'article submission',
      authResult.full_name || authResult.email,
      body.title
    ).catch((err) => console.error('[notify]', err?.message || err));
    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
