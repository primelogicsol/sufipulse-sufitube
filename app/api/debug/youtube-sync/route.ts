import { NextResponse } from 'next/server';
import { youtubeService } from '@/lib/youtube-service';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const envLoaded = !!process.env.YOUTUBE_API_KEY;
    const channelId = youtubeService.config.channelId;
    const uploadsPlaylistId = channelId.replace('UC', 'UU');
    const apiKeyPresent = !!youtubeService.config.apiKey;
    
    // Check YouTube data API for latest uploads
    let latestVideosFromYouTube: any[] = [];
    try {
      latestVideosFromYouTube = await youtubeService.getLatestVideos(5);
    } catch (e: any) {
      latestVideosFromYouTube = [{ error: e.message }];
    }

    // Check CMS file
    const cmsFilePath = path.join(process.cwd(), '.data', 'cms-releases.json');
    let cmsWritable = false;
    try {
      if (!fs.existsSync(path.dirname(cmsFilePath))) {
        fs.mkdirSync(path.dirname(cmsFilePath), { recursive: true });
      }
      fs.accessSync(path.dirname(cmsFilePath), fs.constants.W_OK);
      cmsWritable = true;
    } catch (e) {
      cmsWritable = false;
    }

    const allReleases = cmsServerStorage.getAllReleases();
    const containsVideoId_Dbd0fhJty4A = !!allReleases.find(r => r.youtubeId === 'Dbd0fhJty4A' || r.id === 'Dbd0fhJty4A');

    return NextResponse.json({
      envLoaded,
      channelId,
      uploadsPlaylistId,
      apiKeyPresent,
      latestVideosFromYouTube: latestVideosFromYouTube.map((v: any) => v.id || v.error),
      cmsFilePath,
      cmsWritable,
      cmsTotalRecords: allReleases.length,
      containsVideoId_Dbd0fhJty4A,
      lastImportResult: 'Check server logs for POST /api/releases/import-youtube',
      lastAnalyticsRefreshResult: 'Check server logs for POST /api/admin/youtube-analytics/global-reach/refresh'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
