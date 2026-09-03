import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

import { DATA_DIR } from '@/lib/server-data-dir';
import type { NormalizedPrivateAudioAlignment } from '@/server/integrations/private-audio-alignment';
import type { PrivateAudioAssemblyDefinition } from '@/server/integrations/private-audio-assembly';

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

export type PrivateProductionSourceAsset = {
  providerKey: string;
  sourceAssetId: string;
  sourceUrl?: string;
  retrievedAt: string;
  updatedAt: string;
  alignment: NormalizedPrivateAudioAlignment;
};

export type PrivateProductionSourceRecord = {
  releaseId: string;

  // Backward-compatible primary-source view used by the existing single-source
  // alignment/stream routes. Multi-source production data lives in `sources`.
  providerKey: string;
  sourceAssetId: string;
  sourceUrl?: string;
  retrievedAt: string;
  updatedAt: string;
  alignment: NormalizedPrivateAudioAlignment;

  sources?: Record<string, PrivateProductionSourceAsset>;
  assembly?: PrivateAudioAssemblyDefinition;
  assemblyHistory?: PrivateAudioAssemblyDefinition[];
  rollbackSnapshot?: SubtitleRollbackSnapshot;
  publicAudioPreviewEnabled?: boolean;
  publicAudioPreviewUpdatedAt?: string;
};

type PrivateProductionSourceFile = {
  version: 2;
  releases: Record<string, PrivateProductionSourceRecord>;
};

type LegacyPrivateProductionSourceFile = {
  version: 1;
  releases: Record<string, PrivateProductionSourceRecord>;
};

const DATA_FILE = path.join(DATA_DIR, 'private-production-sources.json');
const MAX_ASSEMBLY_HISTORY = 20;

const emptyStore = (): PrivateProductionSourceFile => ({ version: 2, releases: {} });

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
};

const assetFromRecord = (record: PrivateProductionSourceRecord): PrivateProductionSourceAsset => ({
  providerKey: record.providerKey,
  sourceAssetId: record.sourceAssetId,
  sourceUrl: record.sourceUrl,
  retrievedAt: record.retrievedAt,
  updatedAt: record.updatedAt,
  alignment: record.alignment,
});

const normalizeRecord = (record: PrivateProductionSourceRecord): PrivateProductionSourceRecord => ({
  ...record,
  sources: {
    ...(record.sources || {}),
    [record.sourceAssetId]: assetFromRecord(record),
  },
  assemblyHistory: Array.isArray(record.assemblyHistory)
    ? record.assemblyHistory.slice(-MAX_ASSEMBLY_HISTORY)
    : [],
});

const migrateLegacyStore = (legacy: LegacyPrivateProductionSourceFile): PrivateProductionSourceFile => ({
  version: 2,
  releases: Object.fromEntries(
    Object.entries(legacy.releases || {}).map(([releaseId, record]) => [
      releaseId,
      normalizeRecord(record),
    ]),
  ),
});

const load = (): PrivateProductionSourceFile => {
  try {
    if (!fs.existsSync(DATA_FILE)) return emptyStore();
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '{}');
    if (!parsed || typeof parsed.releases !== 'object') return emptyStore();

    if (parsed.version === 1) {
      return migrateLegacyStore(parsed as LegacyPrivateProductionSourceFile);
    }
    if (parsed.version !== 2) return emptyStore();

    const store = parsed as PrivateProductionSourceFile;
    return {
      version: 2,
      releases: Object.fromEntries(
        Object.entries(store.releases || {}).map(([releaseId, record]) => [
          releaseId,
          normalizeRecord(record),
        ]),
      ),
    };
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

  getSource(releaseId: string, sourceAssetId: string): PrivateProductionSourceAsset | null {
    const record = this.get(releaseId);
    if (!record) return null;
    return record.sources?.[sourceAssetId] || (record.sourceAssetId === sourceAssetId ? assetFromRecord(record) : null);
  },

  listSources(releaseId: string): PrivateProductionSourceAsset[] {
    const record = this.get(releaseId);
    if (!record) return [];
    return Object.values(record.sources || { [record.sourceAssetId]: assetFromRecord(record) });
  },

  getAssemblyHistory(releaseId: string): PrivateAudioAssemblyDefinition[] {
    const record = this.get(releaseId);
    return record?.assemblyHistory ? [...record.assemblyHistory] : [];
  },

  save(record: PrivateProductionSourceRecord): PrivateProductionSourceRecord {
    const store = load();
    const existing = store.releases[record.releaseId];
    const now = new Date().toISOString();
    const primaryAsset: PrivateProductionSourceAsset = {
      providerKey: record.providerKey,
      sourceAssetId: record.sourceAssetId,
      sourceUrl: record.sourceUrl,
      retrievedAt: record.retrievedAt,
      updatedAt: now,
      alignment: record.alignment,
    };

    const next: PrivateProductionSourceRecord = {
      ...existing,
      ...record,
      sources: {
        ...(existing?.sources || {}),
        ...(record.sources || {}),
        [record.sourceAssetId]: primaryAsset,
      },
      assembly: record.assembly ?? existing?.assembly,
      assemblyHistory: record.assemblyHistory ?? existing?.assemblyHistory ?? [],
      updatedAt: now,
    };
    store.releases[record.releaseId] = next;
    persist(store);
    return next;
  },

  upsertSource(releaseId: string, source: PrivateProductionSourceAsset): PrivateProductionSourceRecord | null {
    const store = load();
    const existing = store.releases[releaseId];
    if (!existing) return null;

    const now = new Date().toISOString();
    const normalizedSource: PrivateProductionSourceAsset = {
      ...source,
      updatedAt: now,
    };
    const next: PrivateProductionSourceRecord = {
      ...existing,
      sources: {
        ...(existing.sources || {}),
        [source.sourceAssetId]: normalizedSource,
      },
      ...(existing.sourceAssetId === source.sourceAssetId
        ? {
            providerKey: normalizedSource.providerKey,
            sourceUrl: normalizedSource.sourceUrl,
            retrievedAt: normalizedSource.retrievedAt,
            alignment: normalizedSource.alignment,
          }
        : {}),
      updatedAt: now,
    };
    store.releases[releaseId] = next;
    persist(store);
    return next;
  },

  setAssembly(releaseId: string, assembly: PrivateAudioAssemblyDefinition): PrivateProductionSourceRecord | null {
    const store = load();
    const existing = store.releases[releaseId];
    if (!existing) return null;

    const sourceIds = new Set(Object.keys(existing.sources || {}));
    for (const segment of assembly.segments) {
      if (!sourceIds.has(segment.sourceAssetId)) {
        throw new Error(`Assembly source ${segment.sourceAssetId} is not linked to release ${releaseId}.`);
      }
    }

    const now = new Date().toISOString();
    const normalizedAssembly: PrivateAudioAssemblyDefinition = {
      ...assembly,
      updatedAt: now,
    };
    const history = [...(existing.assemblyHistory || [])];
    if (existing.assembly && existing.assembly.version !== normalizedAssembly.version) {
      const withoutSameVersion = history.filter((item) => item.version !== existing.assembly!.version);
      withoutSameVersion.push(existing.assembly);
      history.splice(0, history.length, ...withoutSameVersion.slice(-MAX_ASSEMBLY_HISTORY));
    }

    const next: PrivateProductionSourceRecord = {
      ...existing,
      assembly: normalizedAssembly,
      assemblyHistory: history.slice(-MAX_ASSEMBLY_HISTORY),
      updatedAt: now,
    };
    store.releases[releaseId] = next;
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
