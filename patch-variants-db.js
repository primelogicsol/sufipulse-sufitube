const fs = require('fs');
const file = 'lib/database-schema.ts';
let content = fs.readFileSync(file, 'utf8');

const fields = `  youtube_title?: string;
  youtube_title_variant_a?: string;
  youtube_title_variant_b?: string;
  youtube_title_variant_c?: string;
  youtube_winning_variant?: 'A' | 'B' | 'C' | 'pending';
  youtube_title_last_synced_at?: string;`;

// Wait, I need to find the right spot to insert this. I'll just append it to the interface.
content = content.replace(/  youtube_id\?: string;/, `  youtube_id?: string;\n${fields}`);

fs.writeFileSync(file, content);
