import { promises as fs } from 'fs';
import path from 'path';

type AdoptionPaymentRecord = {
  adoptionId: string;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed';
  adoptionStatus: string;
  amountPaid: number;
  stripeSessionId?: string;
  lastEventType?: string;
  updatedAt: string;
};

type PaymentStore = {
  processedEventIds: string[];
  adoptions: Record<string, AdoptionPaymentRecord>;
};

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'adoption-payments.json');

const defaultStore = (): PaymentStore => ({
  processedEventIds: [],
  adoptions: {},
});

async function ensureStoreFile() {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify(defaultStore(), null, 2), 'utf8');
  }
}

async function readStore(): Promise<PaymentStore> {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as PaymentStore;
    return {
      processedEventIds: Array.isArray(parsed?.processedEventIds) ? parsed.processedEventIds : [],
      adoptions: parsed?.adoptions && typeof parsed.adoptions === 'object' ? parsed.adoptions : {},
    };
  } catch {
    return defaultStore();
  }
}

async function writeStore(store: PaymentStore): Promise<void> {
  await ensureStoreFile();
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export async function getAdoptionPaymentRecord(adoptionId: string): Promise<AdoptionPaymentRecord | null> {
  const store = await readStore();
  return store.adoptions[adoptionId] || null;
}

export async function upsertAdoptionPaymentRecord(
  adoptionId: string,
  patch: Partial<Omit<AdoptionPaymentRecord, 'adoptionId' | 'updatedAt'>>,
): Promise<AdoptionPaymentRecord> {
  const store = await readStore();
  const existing = store.adoptions[adoptionId];

  const next: AdoptionPaymentRecord = {
    adoptionId,
    paymentStatus: patch.paymentStatus || existing?.paymentStatus || 'unpaid',
    adoptionStatus: patch.adoptionStatus || existing?.adoptionStatus || 'pending_review',
    amountPaid: patch.amountPaid ?? existing?.amountPaid ?? 0,
    stripeSessionId: patch.stripeSessionId ?? existing?.stripeSessionId,
    lastEventType: patch.lastEventType ?? existing?.lastEventType,
    updatedAt: new Date().toISOString(),
  };

  store.adoptions[adoptionId] = next;
  await writeStore(store);
  return next;
}

export async function applyWebhookEventIfNew(params: {
  eventId: string;
  adoptionId: string;
  paymentStatus: 'paid' | 'failed';
  adoptionStatus?: string;
  amountPaid?: number;
  stripeSessionId?: string;
  eventType?: string;
}): Promise<{ applied: boolean; record: AdoptionPaymentRecord }> {
  const store = await readStore();

  if (store.processedEventIds.includes(params.eventId)) {
    const existing =
      store.adoptions[params.adoptionId] ||
      ({
        adoptionId: params.adoptionId,
        paymentStatus: 'unpaid',
        adoptionStatus: 'pending_review',
        amountPaid: 0,
        updatedAt: new Date().toISOString(),
      } as AdoptionPaymentRecord);
    return { applied: false, record: existing };
  }

  const prev = store.adoptions[params.adoptionId];
  const next: AdoptionPaymentRecord = {
    adoptionId: params.adoptionId,
    paymentStatus: params.paymentStatus,
    adoptionStatus: params.adoptionStatus || prev?.adoptionStatus || 'pending_review',
    amountPaid: params.amountPaid ?? prev?.amountPaid ?? 0,
    stripeSessionId: params.stripeSessionId ?? prev?.stripeSessionId,
    lastEventType: params.eventType ?? prev?.lastEventType,
    updatedAt: new Date().toISOString(),
  };

  store.adoptions[params.adoptionId] = next;
  store.processedEventIds.push(params.eventId);

  if (store.processedEventIds.length > 5000) {
    store.processedEventIds = store.processedEventIds.slice(-2000);
  }

  await writeStore(store);
  return { applied: true, record: next };
}