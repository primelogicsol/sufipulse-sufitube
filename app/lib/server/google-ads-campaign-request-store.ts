import { promises as fs } from 'fs';
import path from 'path';

export type CampaignRequestStatus =
  | 'pending_review'
  | 'pending_manual_review'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'campaign_created'
  | 'campaign_failed';

export type CampaignRequestEvent = {
  id: string;
  eventType: 'submitted' | 'approved' | 'rejected' | 'changes_requested' | 'campaign_created' | 'campaign_failed' | 'note_added';
  actorType: 'user' | 'admin' | 'system';
  actorId?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type GoogleAdsCampaignRequest = {
  id: string;
  adoptionId: string;
  releaseId: string;
  releaseTitle?: string;
  releaseSlug?: string;
  youtubeVideoId?: string;
  userId?: string;
  sponsorEmail?: string;
  sponsorName?: string;
  budgetAmount: number;
  currency: string;
  campaignObjective: string;
  targetRegions: string[];
  targetLanguages: string[];
  googleAdsCustomerId?: string;
  googleEmail?: string;
  durationDays?: number;
  oauthConnected: boolean;
  methodType?: 'managed_sufitube' | 'use_my_google_ads';
  status: CampaignRequestStatus;
  reviewReason?: string;
  adminNote?: string;
  proposedTargeting?: string;
  proposedBudget?: number;
  proposedKeywords?: string;
  proposedAdCopy?: string;
  campaignResourceName?: string;
  events: CampaignRequestEvent[];
  createdAt: string;
  updatedAt: string;
};

type RequestStore = {
  requests: Record<string, GoogleAdsCampaignRequest>;
};

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'google-ads-campaign-requests.json');

function defaultStore(): RequestStore {
  return { requests: {} };
}

async function ensureStoreFile() {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify(defaultStore(), null, 2), 'utf8');
  }
}

async function readStore(): Promise<RequestStore> {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as RequestStore;
    return {
      requests:
        parsed?.requests && typeof parsed.requests === 'object' ? parsed.requests : {},
    };
  } catch {
    return defaultStore();
  }
}

async function writeStore(store: RequestStore): Promise<void> {
  await ensureStoreFile();
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export async function upsertCampaignRequest(
  record: Omit<GoogleAdsCampaignRequest, 'id' | 'events' | 'createdAt' | 'updatedAt'> &
    Partial<Pick<GoogleAdsCampaignRequest, 'id' | 'events' | 'createdAt' | 'updatedAt'>>
): Promise<GoogleAdsCampaignRequest> {
  const store = await readStore();
  const now = new Date().toISOString();
  const id = record.id ?? record.adoptionId;
  const existing = store.requests[id];

  const next: GoogleAdsCampaignRequest = {
    ...record,
    id,
    events: record.events ?? existing?.events ?? [],
    createdAt: record.createdAt ?? existing?.createdAt ?? now,
    updatedAt: now,
  };

  store.requests[id] = next;
  await writeStore(store);
  return next;
}

export async function addCampaignRequestEvent(
  adoptionId: string,
  event: Omit<CampaignRequestEvent, 'id' | 'createdAt'>
): Promise<GoogleAdsCampaignRequest | null> {
  const store = await readStore();
  const req = store.requests[adoptionId];
  if (!req) return null;

  const newEvent: CampaignRequestEvent = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  req.events = [...(req.events ?? []), newEvent];
  req.updatedAt = new Date().toISOString();
  store.requests[adoptionId] = req;
  await writeStore(store);
  return req;
}

export async function updateCampaignRequestStatus(
  adoptionId: string,
  status: CampaignRequestStatus,
  adminNote?: string,
  extra?: Partial<GoogleAdsCampaignRequest>
): Promise<GoogleAdsCampaignRequest | null> {
  const store = await readStore();
  const req = store.requests[adoptionId];
  if (!req) return null;

  req.status = status;
  if (adminNote !== undefined) req.adminNote = adminNote;
  if (extra) Object.assign(req, extra);
  req.updatedAt = new Date().toISOString();
  store.requests[adoptionId] = req;
  await writeStore(store);
  return req;
}

export async function getCampaignRequest(
  adoptionId: string
): Promise<GoogleAdsCampaignRequest | null> {
  const store = await readStore();
  return store.requests[adoptionId] ?? null;
}

export async function getAllCampaignRequests(): Promise<GoogleAdsCampaignRequest[]> {
  const store = await readStore();
  return Object.values(store.requests).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCampaignRequestsByRelease(
  releaseId: string
): Promise<GoogleAdsCampaignRequest[]> {
  const store = await readStore();
  return Object.values(store.requests)
    .filter((r) => r.releaseId === releaseId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getCampaignRequestsByStatus(
  status: CampaignRequestStatus
): Promise<GoogleAdsCampaignRequest[]> {
  const store = await readStore();
  return Object.values(store.requests)
    .filter((r) => r.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
