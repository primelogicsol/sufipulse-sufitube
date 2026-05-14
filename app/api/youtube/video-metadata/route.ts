import { NextRequest, NextResponse } from 'next/server';
import { youtubeService } from '@/lib/youtube-service';

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

    const channelId = String(video?.snippet?.channelId || '').trim();
    const channelTitle = String(video?.snippet?.channelTitle || '').trim();
    const channelUrl = channelId ? `https://www.youtube.com/channel/${channelId}` : '';

    return NextResponse.json({
      youtubeId,
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
      thumbnailUrl: video.snippet?.thumbnails?.maxres?.url || video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url || '',
      durationSeconds: video.durationSeconds || 0,
      durationFormatted: video.durationFormatted || '0:00',
      channelId,
      channelTitle,
      channelUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch YouTube video metadata' },
      { status: 500 }
    );
  }
}
