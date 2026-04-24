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
    const channelId = String(video?.snippet?.channelId || '').trim();
    const channelTitle = String(video?.snippet?.channelTitle || '').trim();
    const channelUrl = channelId ? `https://www.youtube.com/channel/${channelId}` : '';

    if (!channelId) {
      return NextResponse.json({ error: 'Channel metadata unavailable for this video' }, { status: 404 });
    }

    return NextResponse.json({
      youtubeId,
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
