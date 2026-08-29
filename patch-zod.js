const fs = require('fs');
const file = 'app/lib/validation-schemas.ts';
let content = fs.readFileSync(file, 'utf8');

const fields = `  canonicalTitle: z.string().max(500).optional().or(z.literal('')),
  youtubeTitle: z.string().max(500).optional().or(z.literal('')),
  youtubeTitleVariantA: z.string().max(500).optional().or(z.literal('')),
  youtubeTitleVariantB: z.string().max(500).optional().or(z.literal('')),
  youtubeTitleVariantC: z.string().max(500).optional().or(z.literal('')),
  youtubeWinningVariant: z.enum(['A', 'B', 'C', 'pending']).optional(),
  youtubeTitleLastSyncedAt: z.string().optional(),
  youtubeContentType: z.enum(['SHORTS', 'VIDEO_ON_DEMAND', 'LIVE_STREAM', 'STORY', 'UNSPECIFIED']).optional(),
  formatClassificationSource: z.enum(['youtube_analytics', 'channel_surface', 'dashboard', 'duration_heuristic']).optional(),
  canonicalStatus: z.enum(['verified', 'inferred', 'unresolved']).optional(),
  governanceOrigin: z.enum(['native_governed', 'legacy_registry', 'unresolved']).optional(),
  metadataStatus: z.enum(['synced', 'drift_detected', 'overridden']).optional(),
  canonicalThumbnail: z.string().optional(),
  youtubeThumbnailUrl: z.string().optional(),
  youtubeChannelId: z.string().optional(),
  youtubeChannelUrl: z.string().optional(),
  youtubePlaylistId: z.string().optional(),`;

content = content.replace(/  youtubeId: z\.string/, `${fields}\n  youtubeId: z.string`);

fs.writeFileSync(file, content);
