import { NextRequest, NextResponse } from 'next/server';
import { youtubeService } from '@/lib/youtube-service';
import { getYouTubeAnalyticsAccessToken } from '@/lib/youtube-analytics-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const youtubeId = String(searchParams.get('youtubeId') || '').trim();

    if (!/^[A-Za-z0-9_-]{11}$/.test(youtubeId)) {
      return NextResponse.json({ error: 'Valid youtubeId is required' }, { status: 400 });
    }

    const videos = await youtubeService.getVideosByIds(youtubeId);
    const video = Array.isArray(videos) ? videos[0] : null;

    if (!video) {
      return NextResponse.json({ error: 'Video not found or metadata unavailable' }, { status: 404 });
    }

    const channelId = String(video.channelId || '').trim();
    const channelTitle = String(video.channelTitle || '').trim();
    const channelUrl = video.channelUrl || '';

    // Fetch category name
    let categoryName = undefined;
    if (video.categoryId) {
      try {
        const catRes = await fetch(`https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&id=${video.categoryId}&key=${process.env.YOUTUBE_API_KEY}`);
        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.items && catData.items.length > 0) {
            categoryName = catData.items[0].snippet.title;
          }
        }
      } catch (e) {
        console.error('Failed to fetch category name', e);
      }
    }

    // Fetch caption tracks
    let captionTracks = [];
    try {
      const token = await getYouTubeAnalyticsAccessToken();
      if (token) {
        const capRes = await fetch(`https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${youtubeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (capRes.ok) {
          const capData = await capRes.json();
          if (capData.items) {
            captionTracks = capData.items.map((item: any) => ({
              id: item.id,
              language: item.snippet.language,
              name: item.snippet.name,
              trackKind: item.snippet.trackKind,
              status: item.snippet.status,
              isDraft: item.snippet.isDraft,
              isCC: item.snippet.isCC,
              lastUpdated: item.snippet.lastUpdated
            }));
          }
        } else {
            console.error('Failed to fetch captions', await capRes.text());
        }
      }
    } catch (e) {
      console.error('Failed to fetch caption tracks', e);
    }

    return NextResponse.json({
      youtubeId,
      title: video.title || '',
      description: video.description || '',
      publishedAt: video.publishedDate,
      viewCount: video.views,
      durationSeconds: video.durationSeconds || 0,
      durationFormatted: video.durationFormatted || '0:00',
      thumbnailUrl: video.thumbnailUrl || '',
      defaultLanguage: video.defaultLanguage,
      defaultAudioLanguage: video.defaultAudioLanguage,
      captionsAvailable: video.captionsAvailable,
      captionTracks,
      recordingDate: video.recordingDate,
      categoryId: video.categoryId,
      categoryName,
      license: video.license,
      privacyStatus: video.privacyStatus,
      embeddable: video.embeddable,
      licensedContent: video.licensedContent,
      regionRestriction: video.regionRestriction,
      channelId,
      channelTitle,
      channelUrl,
      fetchedAt: video.fetchedAt || new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch YouTube video metadata' },
      { status: 500 }
    );
  }
}
