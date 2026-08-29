const fs = require('fs');
const file = 'app/api/releases/import-youtube/route.ts';
let content = fs.readFileSync(file, 'utf8');

const analyticsImport = `import { queryYouTubeAnalytics } from '@/lib/youtube-analytics-client';
import { getValidYTAnalyticsAccessToken } from '@/app/lib/server/youtube-analytics-oauth-store';`;

if (!content.includes('queryYouTubeAnalytics')) {
  content = content.replace("import type { CMSRelease } from '@/lib/cms-storage';", "import type { CMSRelease } from '@/lib/cms-storage';\n" + analyticsImport);
}

const mapLogic = `let contentTypeMap = new Map<string, string>();
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

    let newCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const video of selected) {
      if (contentTypeMap.has(video.id)) {
        video.youtubeContentType = contentTypeMap.get(video.id);
        video.formatClassificationSource = 'youtube_analytics';
      }
      try {`;

content = content.replace(/let newCount = 0;\s+let updatedCount = 0;\s+let errorCount = 0;\s+for \(const video of selected\) \{\s+try \{/, mapLogic);

fs.writeFileSync(file, content);
