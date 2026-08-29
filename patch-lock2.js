const fs = require('fs');
const file = 'lib/sync-lock-manager.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /async release\(\): Promise<void> \{[\s\S]*?\}\s*\}/;
const newRelease = `async release(): Promise<void> {
    if (!this.client) return;
    
    const client = this.client;
    this.client = null;
    
    try {
      const result = await client.query('SELECT pg_advisory_unlock($1::bigint) AS released', [YOUTUBE_SYNC_LOCK_KEY]);
      if (result.rows[0]?.released !== true) {
        throw new Error('YouTube sync advisory lock was not released');
      }
      client.release();
    } catch (e: any) {
      const error = e instanceof Error ? e : new Error('Unknown advisory unlock failure');
      // Pass truthy/error to destroy connection rather than returning to pool
      client.release(error as any);
      throw error;
    }
  }`;

content = content.replace(regex, newRelease);
fs.writeFileSync(file, content);
