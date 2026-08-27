import { NextResponse } from 'next/server';
import { youtubeService } from '@/lib/youtube-service';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const configuredApiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
    const channelId = process.env.YOUTUBE_CHANNEL_ID || process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || 'UCraDr3i5A3k0j7typ6tOOsQ';
    const envLoaded = Boolean(configuredApiKey);
    const uploadsPlaylistId = channelId.startsWith('UC') ? `UU${channelId.slice(2)}` : '';
    const apiKeyPresent = Boolean(configuredApiKey && !configuredApiKey.includes('YOUR_'));

    let latestVideosFromYouTube: any[] = [];
    try {
      latestVideosFromYouTube = await youtubeService.getLatestVideos(5);
    } catch (e: any) {
      latestVideosFromYouTube = [{ error: e.message }];
    }

    const cmsFilePath = path.join(process.cwd(), '.data', 'cms-releases.json');
    let cmsWritable = false;
    try {
      if (!fs.existsSync(path.dirname(cmsFilePath))) {
        fs.mkdirSync(path.dirname(cmsFilePath), { recursive: true });
      }
      fs.accessSync(path.dirname(cmsFilePath), fs.constants.W_OK);
      cmsWritable = true;
    } catch {
      cmsWritable = false;
    }

    const allReleases = cmsServerStorage.getAllReleases();

    return NextResponse.json({
      envLoaded,
      channelId,
      uploadsPlaylistId,
      apiKeyPresent,
      latestVideosFromYouTube: latestVideosFromYouTube.map((v: any) => v.id || v.error),
      cmsFilePath,
      cmsWritable,
      cmsTotalRecords: allReleases.length,
      note: 'Diagnostic route exposes configuration presence only; API key values are never returned.',
      lastImportResult: 'Check server logs for POST /api/releases/import-youtube',
      lastAnalyticsRefreshResult: 'Check server logs for POST /api/admin/youtube-analytics/global-reach/refresh',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
