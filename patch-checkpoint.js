const fs = require('fs');
const file = 'lib/sync-checkpoint.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /getCheckpoint\(\): string \{[\s\S]*?return '';\s*\}/;
const replacement = `getCheckpoint(): string {
    if (!fs.existsSync(CHECKPOINT_FILE)) {
      return '';
    }
    let data;
    try {
      const raw = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
      data = JSON.parse(raw);
    } catch (e) {
      throw new Error('SyncCheckpoint: Checkpoint file exists but is unreadable or corrupted JSON.');
    }
    
    if (!data || typeof data !== 'object') {
      throw new Error('SyncCheckpoint: Checkpoint data is invalid.');
    }
    
    return data.lastSuccessfulYouTubeSyncAt || '';
  }`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
