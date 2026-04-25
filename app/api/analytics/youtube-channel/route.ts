import { NextResponse } from 'next/server';

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCraDr3i5A3k0j7typ6tOOsQ';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

let _cache: { data: ChannelStats; at: number } | null = null;

export interface ChannelStats {
  views: string;
  viewsRaw: number;
  subscribers: string;
  subscribersRaw: number;
  videos: number;
  avgViewsPerVideo: string;
  engagementRate: string; // views / subscribers ratio label
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export async function GET() {
  if (_cache && Date.now() - _cache.at < CACHE_TTL) {
    return NextResponse.json(_cache.data);
  }

  const key = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!key) return NextResponse.json({ error: 'no_api_key' }, { status: 503 });

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${key}`;
    const res = await fetch(url, { next: { revalidate: 14400 } });
    if (!res.ok) throw new Error(`youtube_api_${res.status}`);

    const json = await res.json();
    const stats = json.items?.[0]?.statistics;
    if (!stats) throw new Error('no_channel_stats');

    const viewsRaw = Number(stats.viewCount || 0);
    const subscribersRaw = Number(stats.subscriberCount || 0);
    const videos = Number(stats.videoCount || 0);
    const avgRaw = videos > 0 ? Math.round(viewsRaw / videos) : 0;
    const engRate = subscribersRaw > 0
      ? `${((viewsRaw / subscribersRaw)).toFixed(1)}×`
      : '—';

    const data: ChannelStats = {
      views: fmt(viewsRaw),
      viewsRaw,
      subscribers: fmt(subscribersRaw),
      subscribersRaw,
      videos,
      avgViewsPerVideo: fmt(avgRaw),
      engagementRate: engRate,
    };

    _cache = { data, at: Date.now() };
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
