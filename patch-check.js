const fs = require('fs');
const file = 'lib/sync-checkpoint.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /getCheckpoint\(\): string \{[\s\S]*?return data\.lastSuccessfulYouTubeSyncAt \|\| '';\s*\}/;
const replacement = `function requireValidCheckpointTimestamp(data: unknown): string {
  if (!data || typeof data !== 'object' || !('lastSuccessfulYouTubeSyncAt' in data)) {
    throw new Error('SyncCheckpoint: Missing checkpoint timestamp.');
  }

  const value = (data as Record<string, unknown>).lastSuccessfulYouTubeSyncAt;

  if (typeof value !== 'string' || !value.trim() || Number.isNaN(Date.parse(value))) {
    throw new Error('SyncCheckpoint: Invalid checkpoint timestamp.');
  }

  return value;
}

export const syncCheckpointService = {
  getCheckpoint(): string {
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
    
    return requireValidCheckpointTimestamp(data);
  }`;

content = content.replace(regex, replacement);

const advanceRegex = /advanceCheckpoint\(isoDate: string\): void \{/;
const advanceReplacement = `advanceCheckpoint(isoDate: string): void {
    requireValidCheckpointTimestamp({ lastSuccessfulYouTubeSyncAt: isoDate });`;

content = content.replace(advanceRegex, advanceReplacement);
fs.writeFileSync(file, content);
