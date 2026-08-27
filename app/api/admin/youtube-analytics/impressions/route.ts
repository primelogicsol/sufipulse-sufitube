import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  getYouTubeVideoTitleMap,
  queryYouTubeAnalytics,
  YouTubeAnalyticsUpstreamError,
} from '@/lib/youtube-analytics-client';

export interface VideoImpression {
  videoId: string;
  title: string;
  impressions: number | null;
  views: number;
  ctr: number | null;
  avgViewDurationSecs: number;
  watchTimeMinutes: number;
  source: 'youtube_analytics_api';
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const endDate = new Date().toISOString().split('T')[0];

  try {
    const json = await queryYouTubeAnalytics({
      dimensions: 'video',
      metrics: 'views,estimatedMinutesWatched,averageViewDuration',
      sort: '-views',
      maxResults: '200',
    });

    const videoIds = (json.rows ?? []).map((row: any[]) => String(row[0]));
    const { titles, warnings } = await getYouTubeVideoTitleMap(videoIds);

    const data: VideoImpression[] = (json.rows ?? []).map((row: any[]) => ({
      videoId: String(row[0]),
      title: titles[String(row[0])] ?? String(row[0]),
      impressions: null,
      views: Number(row[1]) || 0,
      watchTimeMinutes: Number(row[2]) || 0,
      ctr: null,
      avgViewDurationSecs: Math.round(Number(row[3])) || 0,
      source: 'youtube_analytics_api',
    }));

    return NextResponse.json({
      data,
      total: data.length,
      asOf: endDate,
      source: 'youtube_analytics_api',
      unavailableMetrics: ['impressions', 'impressionsCtr'],
      unavailableReason: 'Studio thumbnail impressions and Impressions CTR are not exposed by this channel Analytics API report. Import a YouTube Studio Advanced Mode CSV for those fields.',
      warnings,
    });
  } catch (error: any) {
    if (error instanceof YouTubeAnalyticsUpstreamError) {
      console.warn('[youtube-analytics/impressions] Google API returned error status:', error.status, error.body);
      return NextResponse.json(
        {
          error: 'youtube_analytics_api_error',
          message: 'YouTube Analytics could not be loaded. No synthetic fallback data was generated.',
          upstreamStatus: error.status,
          reconnectRequired: error.status === 401 || error.status === 403,
        },
        { status: 502 }
      );
    }

    const message = error?.message || 'YouTube Analytics is not connected.';
    return NextResponse.json(
      {
        error: 'not_connected',
        message,
        reconnectRequired: true,
      },
      { status: 401 }
    );
  }
}
