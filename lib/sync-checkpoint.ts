import * as fs from 'fs';
import * as path from 'path';
import { DATA_DIR } from './server-data-dir';

const CHECKPOINT_FILE = path.join(DATA_DIR, 'youtube-release-sync-checkpoint.json');
const AUDIT_FILE = path.join(DATA_DIR, 'youtube-release-sync-audit.jsonl');

export interface SyncAuditRun {
  runId: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  trigger: string;
  startedAt: string;
  completedAt?: string;
  checkpointBefore: string;
  checkpointAfter: string;
  checkedCount: number;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  failedCount: number;
  registryWrites: number;
  postgresWrites: number;
  canonicalTitleChanged: boolean;
  slugChanged: boolean;
  classificationDowngrades: boolean;
  failureStage?: string;
  errors: string[];
}

function requireValidCheckpointTimestamp(data: unknown): string {
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
  },

  advanceCheckpoint(isoDate: string): void {
    requireValidCheckpointTimestamp({ lastSuccessfulYouTubeSyncAt: isoDate });
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = CHECKPOINT_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify({ lastSuccessfulYouTubeSyncAt: isoDate }), 'utf8');
    fs.renameSync(tempFile, CHECKPOINT_FILE);
  },

  appendAudit(run: SyncAuditRun): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.appendFileSync(AUDIT_FILE, JSON.stringify(run) + "\n", 'utf8');
  }
};
