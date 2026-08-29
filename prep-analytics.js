const fs = require('fs');
const file = 'app/api/releases/import-youtube/route.ts';
let content = fs.readFileSync(file, 'utf8');

const importAnalytics = `import { queryYouTubeAnalytics } from '@/lib/youtube-analytics-client';
import { getValidYTAnalyticsAccessToken } from '@/app/lib/server/youtube-analytics-oauth-store';`;

// Add imports
if (!content.includes('queryYouTubeAnalytics')) {
  content = content.replace("import type { CMSRelease } from '@/lib/cms-storage';", "import type { CMSRelease } from '@/lib/cms-storage';\n" + importAnalytics);
}

// Find where to fetch the map. It's inside the GET or POST handler? Let's check.
fs.writeFileSync(file, content);
