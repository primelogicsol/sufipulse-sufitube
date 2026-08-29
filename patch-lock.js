const fs = require('fs');
const file = 'lib/sync-lock-manager.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /await client\.query\('SELECT pg_advisory_unlock\(\$1::bigint\) AS released', \[YOUTUBE_SYNC_LOCK_KEY\]\);\s*client\.release\(\);/g;
const replacement = `const result = await client.query('SELECT pg_advisory_unlock($1::bigint) AS released', [YOUTUBE_SYNC_LOCK_KEY]);
      if (result.rows[0]?.released !== true) {
        const error = new Error('YouTube sync advisory lock was not released');
        client.release(error as any);
        throw error;
      }
      client.release();`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
