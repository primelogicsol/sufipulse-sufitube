const fs = require('fs');
const file = 'app/lib/validation-schemas.ts';
let content = fs.readFileSync(file, 'utf8');

// I will overwrite the fields I added previously.
const oldFields = `  canonicalTitle: z.string().max(500).optional().or(z.literal('')),
  youtubeTitle: z.string().max(500).optional().or(z.literal('')),
  youtubeTitleVariantA: z.string().max(500).optional().or(z.literal('')),
  youtubeTitleVariantB: z.string().max(500).optional().or(z.literal('')),
  youtubeTitleVariantC: z.string().max(500).optional().or(z.literal('')),
  youtubeWinningVariant: z.enum(['A', 'B', 'C', 'pending']).optional(),
  youtubeTitleLastSyncedAt: z.string().optional(),
  youtubeContentType: z.enum(['SHORTS', 'VIDEO_ON_DEMAND', 'LIVE_STREAM', 'STORY', 'UNSPECIFIED']).optional(),
  formatClassificationSource: z.enum(['youtube_analytics', 'channel_surface', 'dashboard', 'duration_heuristic']).optional(),`;

const newFields = `  canonicalTitle: z.string().max(500).optional().or(z.literal('')),
  youtubeTitle: z.string().max(500).optional().or(z.literal('')),
  youtubeTitleVariantA: z.string().max(500).optional(),
  youtubeTitleVariantB: z.string().max(500).optional(),
  youtubeTitleVariantC: z.string().max(500).optional(),
  youtubeWinningVariant: z.enum(['A', 'B', 'C', 'pending']).optional(),
  youtubeTitleLastSyncedAt: z.string().max(100).optional(),
  youtubeContentType: z.enum(['SHORTS', 'VIDEO_ON_DEMAND', 'LIVE_STREAM', 'UNSPECIFIED']).optional(),
  formatClassificationSource: z.enum([
    'youtube_analytics',
    'youtube_shorts_surface',
    'dashboard',
    'legacy',
    'inferred'
  ]).optional(),`;

if(content.includes(oldFields)) {
    content = content.replace(oldFields, newFields);
} else {
    console.log("Could not find the old block to replace!");
    // Wait, let's just use regex to replace from youtubeTitleVariantA to formatClassificationSource
}
fs.writeFileSync(file, content);
