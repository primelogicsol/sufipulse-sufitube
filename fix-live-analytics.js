const fs = require('fs');
const file = 'app/api/releases/import-youtube/live/route.ts';
let content = fs.readFileSync(file, 'utf8');

const replacement = `let contentTypeMap = new Map<string, string>();
    try {
      const token = await getValidYTAnalyticsAccessToken();
      if (token) {
        const res = await queryYouTubeAnalytics({
          metrics: 'views',
          dimensions: 'video,creatorContentType'
        }, token);
        if (res?.rows) {
          for (const row of res.rows) {
            contentTypeMap.set(String(row[0]), String(row[1]));
          }
        }
      }
    } catch (err) {
      console.warn('Analytics map fetch failed', err);
    }

    const toSave = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = await youtubeService.getVideosByIds(videoIds.slice(i, i + 50));
      for (const video of batch) {
        if (contentTypeMap.has(video.id)) {
          video.youtubeContentType = contentTypeMap.get(video.id);
          video.formatClassificationSource = 'youtube_analytics';
        } else {
          video.youtubeContentType = 'LIVE_STREAM';
          video.formatClassificationSource = 'inferred';
        }
        const existing = cmsServerStorage.getReleaseByYoutubeId(video.id);
        toSave.push(mapVideoToRelease(video, existing));
      }
    }`;

content = content.replace(/const toSave = \[\];\s*for \(let i = 0; i < videoIds\.length; i \+= 50\) \{\s*const batch = await youtubeService\.getVideosByIds\(videoIds\.slice\(i, i \+ 50\)\);\s*for \(const video of batch\) \{\s*const existing = cmsServerStorage\.getReleaseByYoutubeId\(video\.id\);\s*\/\/ Force format to 'live' if it's from this route, or let it infer\s*toSave\.push\(mapVideoToRelease\(video, existing\)\);\s*\}\s*\}/, replacement);

fs.writeFileSync(file, content);
