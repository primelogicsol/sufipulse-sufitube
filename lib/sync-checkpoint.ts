import * as fs from 'fs';
import * as path from 'path';

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), '.data');

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

export const syncCheckpointService = {
  getCheckpoint(): string {
    try {
      if (fs.existsSync(CHECKPOINT_FILE)) {
        const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
        return data.lastSuccessfulYouTubeSyncAt || '';
      }
    } catch (e) {
      console.warn('[SyncCheckpoint] Failed to read checkpoint', e);
    }
    return '';
  },

  advanceCheckpoint(isoDate: string): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = CHECKPOINT_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify({ lastSuccessfulYouTubeSyncAt: isoDate }), 'utf8');
    fs.renameSync(tempFile, CHECKPOINT_FILE);
  },

  appendAudit(run: SyncAuditRun): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.appendFileSync(AUDIT_FILE, JSON.stringify(run) + '\n', 'utf8');
    } catch (e) {
      console.error('[SyncAudit] Failed to write audit log', e);
    }
  }
};
