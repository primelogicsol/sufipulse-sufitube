import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

import { DATA_DIR } from '@/lib/server-data-dir';
import type { NormalizedPrivateAudioAlignment } from '@/server/integrations/private-audio-alignment';

export type SubtitleRollbackSnapshot = {
  capturedAt: string;
  masterTimingVersion?: number;
  subtitleCues?: unknown[];
  subtitleTranslations?: Record<string, Record<string, string>>;
  subtitleLanguageStatuses?: Record<string, string>;
  subtitleCueMetadata?: Record<string, unknown>;
  availableLanguages?: string[];
  defaultLanguage?: string;
};

export type PrivateProductionSourceRecord = {
  releaseId: string;
  providerKey: string;
  sourceAssetId: string;
  sourceUrl?: string;
  retrievedAt: string;
  updatedAt: string;
  alignment: NormalizedPrivateAudioAlignment;
  rollbackSnapshot?: SubtitleRollbackSnapshot;
  publicAudioPreviewEnabled?: boolean;
  publicAudioPreviewUpdatedAt?: string;
};

type PrivateProductionSourceFile = {
  version: 1;
  releases: Record<string, PrivateProductionSourceRecord>;
};

const DATA_FILE = path.join(DATA_DIR, 'private-production-sources.json');

const emptyStore = (): PrivateProductionSourceFile => ({ version: 1, releases: {} });

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
};

const load = (): PrivateProductionSourceFile => {
  try {
    if (!fs.existsSync(DATA_FILE)) return emptyStore();
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '{}');
    if (!parsed || parsed.version !== 1 || typeof parsed.releases !== 'object') return emptyStore();
    return parsed as PrivateProductionSourceFile;
  } catch (error) {
    console.error('[PRIVATE-PRODUCTION] Failed to load private source store:', error);
    return emptyStore();
  }
};

const persist = (store: PrivateProductionSourceFile) => {
  ensureDataDir();
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), { mode: 0o600 });
  fs.renameSync(tempFile, DATA_FILE);
  try {
    fs.chmodSync(DATA_FILE, 0o600);
  } catch {
    // Some deployment filesystems do not support chmod; DATA_DIR still remains non-public.
  }
};

export const privateProductionSourceStorage = {
  get(releaseId: string): PrivateProductionSourceRecord | null {
    const store = load();
    return store.releases[releaseId] || null;
  },

  save(record: PrivateProductionSourceRecord): PrivateProductionSourceRecord {
    const store = load();
    const next: PrivateProductionSourceRecord = {
      ...record,
      updatedAt: new Date().toISOString(),
    };
    store.releases[record.releaseId] = next;
    persist(store);
    return next;
  },

  setRollbackSnapshot(releaseId: string, rollbackSnapshot: SubtitleRollbackSnapshot): PrivateProductionSourceRecord | null {
    const store = load();
    const existing = store.releases[releaseId];
    if (!existing) return null;

    const next: PrivateProductionSourceRecord = {
      ...existing,
      rollbackSnapshot,
      updatedAt: new Date().toISOString(),
    };
    store.releases[releaseId] = next;
    persist(store);
    return next;
  },

  setPublicAudioPreviewEnabled(releaseId: string, enabled: boolean): PrivateProductionSourceRecord | null {
    const store = load();
    const existing = store.releases[releaseId];
    if (!existing) return null;

    const now = new Date().toISOString();
    const next: PrivateProductionSourceRecord = {
      ...existing,
      publicAudioPreviewEnabled: enabled,
      publicAudioPreviewUpdatedAt: now,
      updatedAt: now,
    };
    store.releases[releaseId] = next;
    persist(store);
    return next;
  },

  delete(releaseId: string): boolean {
    const store = load();
    if (!store.releases[releaseId]) return false;
    delete store.releases[releaseId];
    persist(store);
    return true;
  },

  getInfo() {
    return {
      dataFile: DATA_FILE,
      exists: fs.existsSync(DATA_FILE),
    };
  },
};
