const fs = require('fs');
const file = 'server/db/release-repository.ts';
let content = fs.readFileSync(file, 'utf8');

// The string in the repository looks like this:
/*
      if (query.duration === 'default') {
        whereSql += ` AND duration_seconds >= 180 AND format IS DISTINCT FROM 'short'`;
      } else if (query.duration === 'short') {
        whereSql += ` AND duration_seconds > 0 AND duration_seconds < 180`;
      } else if (query.duration === 'standard') {
        whereSql += ` AND duration_seconds >= 180 AND duration_seconds <= 480`;
      } else if (query.duration === 'long') {
        whereSql += ` AND duration_seconds > 480`;
      }
*/

content = content.replace(/whereSql \+= ` AND duration_seconds > 0 AND duration_seconds < 180`;/g, "whereSql += ` AND duration_seconds > 0 AND duration_seconds < 180 AND format IS DISTINCT FROM 'short'`;");
content = content.replace(/whereSql \+= ` AND duration_seconds >= 180 AND duration_seconds <= 480`;/g, "whereSql += ` AND duration_seconds >= 180 AND duration_seconds <= 480 AND format IS DISTINCT FROM 'short'`;");
content = content.replace(/whereSql \+= ` AND duration_seconds > 480`;/g, "whereSql += ` AND duration_seconds > 480 AND format IS DISTINCT FROM 'short'`;");

fs.writeFileSync(file, content);
