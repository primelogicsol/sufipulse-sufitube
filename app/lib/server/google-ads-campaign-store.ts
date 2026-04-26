import { promises as fs } from 'fs';
import path from 'path';

export type GoogleAdsCampaignRecord = {
  adoptionId: string;
  releaseId: string;
  userId: string;
  selectedCustomerId: string;
  youtubeVideoId: string;
  budgetAmount: number;
  campaignResourceName?: string;
  budgetResourceName?: string;
  adGroupResourceName?: string;
  campaignStatus?: 'PAUSED' | 'ENABLED' | 'REMOVED';
  apiFailureReason?: string;
  createdAt: string;
  updatedAt: string;
};

type CampaignStore = {
  campaigns: Record<string, GoogleAdsCampaignRecord>;
};

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'google-ads-campaigns.json');

function defaultStore(): CampaignStore {
  return { campaigns: {} };
}

async function ensureStoreFile() {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify(defaultStore(), null, 2), 'utf8');
  }
}

async function readStore(): Promise<CampaignStore> {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as CampaignStore;
    return {
      campaigns:
        parsed?.campaigns && typeof parsed.campaigns === 'object' ? parsed.campaigns : {},
    };
  } catch {
    return defaultStore();
  }
}

async function writeStore(store: CampaignStore): Promise<void> {
  await ensureStoreFile();
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export async function upsertGoogleAdsCampaign(
  record: Omit<GoogleAdsCampaignRecord, 'createdAt' | 'updatedAt'> &
    Partial<Pick<GoogleAdsCampaignRecord, 'createdAt' | 'updatedAt'>>
): Promise<GoogleAdsCampaignRecord> {
  const store = await readStore();
  const now = new Date().toISOString();
  const existing = store.campaigns[record.adoptionId];

  const next: GoogleAdsCampaignRecord = {
    ...record,
    createdAt: record.createdAt ?? existing?.createdAt ?? now,
    updatedAt: now,
  };

  store.campaigns[record.adoptionId] = next;
  await writeStore(store);
  return next;
}

export async function getGoogleAdsCampaign(
  adoptionId: string
): Promise<GoogleAdsCampaignRecord | null> {
  const store = await readStore();
  return store.campaigns[adoptionId] || null;
}

export async function getGoogleAdsCampaignsByRelease(
  releaseId: string
): Promise<GoogleAdsCampaignRecord[]> {
  const store = await readStore();
  return Object.values(store.campaigns).filter((c) => c.releaseId === releaseId);
}

export async function getAllGoogleAdsCampaigns(): Promise<GoogleAdsCampaignRecord[]> {
  const store = await readStore();
  return Object.values(store.campaigns);
}
