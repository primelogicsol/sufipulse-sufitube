import { NextResponse } from 'next/server';
import { entityGetAll } from '@/lib/entity-storage-server';

export async function GET() {
  try {
    const items = entityGetAll('articles');
    
    // Filter for articles that are approved or published
    const published = items.filter((a: any) => 
      a.status === 'approved' || 
      a.status === 'published'
    );

    // Sort by publication date or update date descending
    const sorted = published.sort((a: any, b: any) =>
      new Date(b.published_at || b.updated_at || b.created_at || 0).getTime() -
      new Date(a.published_at || a.updated_at || a.created_at || 0).getTime()
    );

    // Map public fields to prevent exposing sensitive author/admin internal fields
    const mapped = sorted.map((a: any) => ({
      id: a.id,
      title: a.title || 'Untitled',
      subtitle: a.abstract || a.subtitle || null,
      slug: a.slug || `article-${a.id}`,
      category: a.category || a.article_type || 'reflective_essay',
      content: a.content || '',
      excerpt: a.excerpt || (a.content || '').replace(/<[^>]*>/g, '').slice(0, 200) + '...',
      reading_time_minutes: Math.max(1, Math.ceil(((a.content || '').replace(/<[^>]*>/g, '').split(' ').length) / 200)),
      featured: !!a.featured,
      published_at: a.published_at || a.updated_at || a.created_at || new Date().toISOString(),
      tags: Array.isArray(a.tags) ? a.tags : (a.author_domain ? a.author_domain.split(',').map((t: string) => t.trim()) : []),
      author_id: a.user_id || '',
      author_name: a.author_name || a.author_full_name || 'Ahl-e-Tahreer',
      author_professional_name: a.author_professional_name || '',
      author_country: a.author_country || '',
      author_city: a.author_city || '',
      author_domain: a.author_domain || '',
      author_photo: a.author_photo || '',
    }));

    return NextResponse.json(mapped, {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600',
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
