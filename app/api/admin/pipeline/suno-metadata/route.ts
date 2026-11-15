import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';

export const dynamic = 'force-dynamic';

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * GET /api/admin/pipeline/suno-metadata?url=<suno url or asset id>
 * Reads the PUBLIC page metadata (og:title) of a Suno song to prefill the
 * canonical title. Does not download audio and never touches credentials.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const raw = (request.nextUrl.searchParams.get('url') || '').trim();
  const match = raw.match(UUID_RE);
  if (!match) {
    return NextResponse.json({ error: 'No valid Suno song ID found', code: 'INVALID_SUNO_ID' }, { status: 400 });
  }
  const assetId = match[0].toLowerCase();

  // Only ever fetch suno.com/song/<uuid> (no user-controlled host => no SSRF).
  const target = `https://suno.com/song/${assetId}`;
  try {
    const res = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0 (SufiPulse Studio)' },
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Suno returned ${res.status}`, code: 'SUNO_FETCH_FAILED', assetId }, { status: 502 });
    }
    const html = await res.text();
    const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i);
    const pageTitle = html.match(/<title>([^<]*)<\/title>/i);
    const artistMatch = pageTitle?.[1]?.match(/^(.*?)\s+by\s+(.+?)\s*\|\s*Suno/i);

    const title = decodeEntities(og?.[1] || artistMatch?.[1] || '');
    if (!title) {
      return NextResponse.json({ error: 'Title not found on Suno page', code: 'TITLE_NOT_FOUND', assetId }, { status: 404 });
    }
    return NextResponse.json({
      assetId,
      title,
      artist: artistMatch ? decodeEntities(artistMatch[2]) : undefined,
      url: target,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Suno fetch failed', code: 'SUNO_FETCH_FAILED', assetId }, { status: 502 });
  }
}
