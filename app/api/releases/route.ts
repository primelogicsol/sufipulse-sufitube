import { NextRequest, NextResponse } from 'next/server';
import { cmsStorage, type CMSRelease } from '@/lib/cms-storage';

// GET /api/releases or /api/releases?slug=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const youtubeId = searchParams.get('youtubeId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    if (slug) {
      const release = cmsStorage.getReleaseBySlug(slug);
      return NextResponse.json(release || { error: 'Not found' }, { status: release ? 200 : 404 });
    }

    if (youtubeId) {
      const release = cmsStorage.getReleaseByYoutubeId(youtubeId);
      return NextResponse.json(release || { error: 'Not found' }, { status: release ? 200 : 404 });
    }

    if (status === 'published') {
      const releases = cmsStorage.getPublishedReleases(limit ? parseInt(limit) : undefined);
      return NextResponse.json(releases);
    }

    const releases = cmsStorage.getAllReleases(status ? { status } : undefined);
    return NextResponse.json(releases);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/releases (create new release)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.slug || !body.youtubeId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, youtubeId' },
        { status: 400 }
      );
    }

    // Generate ID if not provided
    const release: CMSRelease = {
      id: body.id || `release_${Date.now()}`,
      title: body.title,
      subtitle: body.subtitle,
      slug: body.slug,
      youtubeId: body.youtubeId,
      youtubeUrl: body.youtubeUrl,
      thumbnailUrl: body.thumbnailUrl,
      posterUrl: body.posterUrl,
      description: body.description || '',
      releaseDate: body.releaseDate || new Date().toISOString().split('T')[0],
      durationSeconds: body.durationSeconds || 0,
      durationFormatted: body.durationFormatted || '0:00',
      viewCount: body.viewCount || 0,
      likeCount: body.likeCount || 0,
      status: body.status || 'draft',
      category: body.category,
      releaseType: body.releaseType,
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

    const saved = cmsStorage.saveRelease(release);
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
