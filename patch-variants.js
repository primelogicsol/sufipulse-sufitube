const fs = require('fs');
const file = 'lib/cms-storage.ts';
let content = fs.readFileSync(file, 'utf8');

const fields = `  youtubeTitle?: string; // Current YouTube packaging title
  youtubeTitleVariantA?: string;
  youtubeTitleVariantB?: string;
  youtubeTitleVariantC?: string;
  youtubeWinningVariant?: 'A' | 'B' | 'C' | 'pending';
  youtubeTitleLastSyncedAt?: string;`;

content = content.replace(/  youtubeTitle\?: string; \/\/ Current YouTube packaging title/, fields);

fs.writeFileSync(file, content);
