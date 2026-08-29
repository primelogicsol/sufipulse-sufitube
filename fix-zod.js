const fs = require('fs');
const file = 'app/lib/validation-schemas.ts';
let content = fs.readFileSync(file, 'utf8');

const fieldsToMove = `  canonicalTitle: z.string().max(500).optional().or(z.literal('')),
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
  ]).optional(),
  canonicalStatus: z.enum(['verified', 'inferred', 'unresolved']).optional(),
  governanceOrigin: z.enum(['native_governed', 'legacy_registry', 'unresolved']).optional(),
  metadataStatus: z.enum(['synced', 'drift_detected', 'overridden']).optional(),
  canonicalThumbnail: z.string().optional(),
  youtubeThumbnailUrl: z.string().optional(),
  youtubeChannelId: z.string().optional(),
  youtubeChannelUrl: z.string().optional(),
  youtubePlaylistId: z.string().optional(),
`;

content = content.replace(fieldsToMove, '');
content = content.replace(/  youtubeId: z\.string\(\)\.max\(100\)\.optional\(\)\.or\(z\.literal\(''\)\),/, `${fieldsToMove}  youtubeId: z.string().max(100).optional().or(z.literal('')),`);

fs.writeFileSync(file, content);
