import { NextRequest, NextResponse } from 'next/server';
import { type CMSRelease } from '@/lib/cms-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';

const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
};

// GET /api/releases or /api/releases?slug=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const youtubeId = searchParams.get('youtubeId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    console.log(`[API /api/releases] GET: status=${status}, youtubeId=${youtubeId}, slug=${slug}`);

    if (slug) {
      const release = cmsServerStorage.getReleaseBySlug(slug);
      if (!release) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      if (release.status !== 'published') {
        const authResult = await requireAdmin(request);
        if (authResult instanceof NextResponse) {
          return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        return NextResponse.json({ ...release, resolution_source: 'cms_slug' }, {
          headers: { 'Cache-Control': 'no-store' },
        });
      }
      return NextResponse.json({
        ...release,
        resolution_source: 'cms_slug',
      }, { headers: cacheHeaders });
    }

    if (youtubeId) {
      const release = cmsServerStorage.getReleaseByYoutubeId(youtubeId);
      if (!release) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      if (release.status !== 'published') {
        const authResult = await requireAdmin(request);
        if (authResult instanceof NextResponse) {
          return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        return NextResponse.json({ ...release, resolution_source: 'cms_youtube_compat' }, {
          headers: { 'Cache-Control': 'no-store' },
        });
      }
      return NextResponse.json({
        ...release,
        resolution_source: 'cms_youtube_compat',
      }, { headers: cacheHeaders });
    }

    // Non-published status queries require admin access
    if (status && status !== 'published') {
      const authResult = await requireAdmin(request);
      if (authResult instanceof NextResponse) return authResult;
    }

    const sort = searchParams.get('sort');
    const format = searchParams.get('format') || '';
    const type = searchParams.get('type') || '';
    const duration = searchParams.get('duration') || '';
    const year = searchParams.get('year') || '';
    const search = (searchParams.get('search') || '').toLowerCase().trim();

    const normalize = (r: CMSRelease): CMSRelease => ({
      ...r,
      status: r.status || 'published',
      visibility: r.visibility || 'public',
      format: r.format || (r.durationSeconds <= 60 ? 'short' : 'video'),
      releaseType: r.releaseType || 'studio-release',
      releaseDate: r.releaseDate || (r.publishedAt ? r.publishedAt.slice(0,10) : (r.createdAt ? r.createdAt.slice(0,10) : new Date().toISOString().slice(0,10))),
    });

    const applyFilters = (releases: CMSRelease[]) => {
      return releases.map(normalize).filter((r) => {
        if (format && r.format !== format) return false;
        if (type && r.releaseType !== type) return false;
        if (duration) {
          const mins = (r.durationSeconds || 0) / 60;
          if (duration === 'short' && mins >= 3) return false;
          if (duration === 'standard' && (mins < 3 || mins > 8)) return false;
          if (duration === 'long' && mins <= 8) return false;
        }
        if (year) {
          const releaseYear = new Date(r.releaseDate).getFullYear();
          if (releaseYear !== parseInt(year)) return false;
        }
        if (search) {
          const haystack = `${r.title} ${r.description || ''}`.toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      });
    };

    // Default to published only for public access; pass ?status=all to get everything (admin)
    let base: CMSRelease[] = [];
    if (!status || status === 'published') {
      base = sort === 'ranked'
        ? cmsServerStorage.getRankedReleases(limit ? parseInt(limit) : undefined)
        : cmsServerStorage.getPublishedReleases(limit ? parseInt(limit) : undefined);
    } else {
      base = cmsServerStorage.getAllReleases(status !== 'all' ? { status } : undefined);
    }

    const filtered = (format || type || duration || year || search) ? applyFilters(base) : base.map(normalize);
    console.log(`[API /api/releases] Returning ${filtered.length} releases (out of ${base.length} base).`);
    if (filtered.length > 0) {
      console.log(`[API /api/releases] First 3:`, filtered.slice(0, 3).map(r => `${r.title} (${r.status}) [${r.releaseDate}]`));
    }

    return NextResponse.json(filtered, { headers: cacheHeaders });
  } catch (error: any) {
    console.error(`[API /api/releases] ERROR:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/releases (create new release — admin only)
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const body = await request.json();
    const isWebOnly = body.webOnly === true || body.isWebOnly === true;
    const normalizedSlug = String(body.slug || '').trim();
    const normalizedYoutubeId = String(body.youtubeId || '').trim();
    
    // Validate required fields
    if (!body.title || !normalizedSlug) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug' },
        { status: 400 }
      );
    }

    if (!normalizedYoutubeId && !isWebOnly) {
      return NextResponse.json(
        { error: 'Missing required field: youtubeId (or mark as webOnly release)' },
        { status: 400 }
      );
    }

    const existingBySlug = cmsServerStorage.getReleaseBySlug(normalizedSlug);
    if (existingBySlug) {
      return NextResponse.json(
        { error: `Release slug already exists: ${normalizedSlug}` },
        { status: 409 }
      );
    }

    if (normalizedYoutubeId) {
      const existingByYoutubeId = cmsServerStorage.getReleaseByYoutubeId(normalizedYoutubeId);
      if (existingByYoutubeId) {
        return NextResponse.json(
          { error: `YouTube ID already linked to release: ${normalizedYoutubeId}` },
          { status: 409 }
        );
      }
    }

    // Generate ID if not provided
    const release: CMSRelease = {
      id: body.id || `release_${Date.now()}`,
      title: body.title,
      subtitle: body.subtitle,
      slug: normalizedSlug,
      youtubeId: normalizedYoutubeId,
      youtubeUrl: body.youtubeUrl,
      youtubeChannelId: body.youtubeChannelId,
      youtubeChannelUrl: body.youtubeChannelUrl,
      thumbnailUrl: body.thumbnailUrl,
      posterUrl: body.posterUrl,
      description: body.description || '',
      releaseDate: body.releaseDate || new Date().toISOString().split('T')[0],
      durationSeconds: body.durationSeconds || 0,
      durationFormatted: body.durationFormatted || '0:00',
      viewCount: body.viewCount || 0,
      likeCount: body.likeCount || 0,
      status: body.status || 'draft',
      contentReadinessState: body.contentReadinessState || 'draft',
      category: body.category,
      releaseType: body.releaseType,
      format: body.format,
      audioUrl: body.audioUrl,
      webOnly: body.webOnly || false,
      writer: body.writer,
      vocalist: body.vocalist,
      chorusVocalists: Array.isArray(body.chorusVocalists) ? body.chorusVocalists : [],
      producer: body.producer,
      enableLyrics: body.enableLyrics !== false,
      enableCommentary: body.enableCommentary !== false,
      enableSponsors: body.enableSponsors || false,
      enableAdoption: body.enableAdoption !== false,
      enableCredits: body.enableCredits !== false,
      publicCommentary: Array.isArray(body.publicCommentary) ? body.publicCommentary : [
        {
          id: 'context',
          title: 'Historical Context',
          content: '',
          isPublished: true,
        },
        {
          id: 'theme',
          title: 'Thematic Interpretation',
          content: '',
          isPublished: true,
        },
      ],
      publicSponsorsIntro: body.publicSponsorsIntro || '',
      publicSponsors: Array.isArray(body.publicSponsors) ? body.publicSponsors : [],
      publicCredits: body.publicCredits || {},
      availableLanguages: body.availableLanguages || ['en', 'ur'],
      defaultLanguage: body.defaultLanguage || 'en',
      lyrics: body.lyrics || {},
      lyricsStructure: body.lyricsStructure || {},
      masterTimingVersion: body.masterTimingVersion || 1,
      subtitleCues: Array.isArray(body.subtitleCues) ? body.subtitleCues : [],
      subtitleTranslations: body.subtitleTranslations || {},
      subtitleLanguageStatuses: body.subtitleLanguageStatuses || {},
      subtitleLanguageAssignments: body.subtitleLanguageAssignments || {},
      masterAssSource: body.masterAssSource || '',
      subtitleCueMetadata: body.subtitleCueMetadata || {},
      subtitleStylePacks: body.subtitleStylePacks || {},
      languageStyleOverrides: body.languageStyleOverrides || {},
      translationPolicy: body.translationPolicy || {
        globalToneRules: [],
        languageProfiles: {},
        glossary: {},
      },
      subtitleReviewLogs: Array.isArray(body.subtitleReviewLogs) ? body.subtitleReviewLogs : [],
      youtubeSubtitleAutoSync: body.youtubeSubtitleAutoSync !== false,
      youtubeCaptionTracks: body.youtubeCaptionTracks || {},
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = cmsServerStorage.saveRelease(release);
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
