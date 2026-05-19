// app/lib/server/google-ads-intelligence-store.ts
import { promises as fs } from 'fs';
import path from 'path';
import { IntelligencePlan } from '@/lib/google-ads/intelligence-types';

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE_PATH = path.join(DATA_DIR, 'google-ads-intelligence-plans.json');

type IntelligenceStore = {
  plans: Record<string, IntelligencePlan>; // Key: adoptionId
};

async function ensureDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readStore(): Promise<IntelligenceStore> {
  await ensureDirectory();
  try {
    const data = await fs.readFile(FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return { plans: {} };
  }
}

async function writeStore(store: IntelligenceStore): Promise<void> {
  await ensureDirectory();
  await fs.writeFile(FILE_PATH, JSON.stringify(store, null, 2));
}

export async function getIntelligencePlan(adoptionId: string): Promise<IntelligencePlan | null> {
  const store = await readStore();
  return store.plans[adoptionId] || null;
}

export async function upsertIntelligencePlan(plan: IntelligencePlan): Promise<IntelligencePlan> {
  const store = await readStore();
  store.plans[plan.adoptionId] = {
    ...plan,
    preparedAt: plan.preparedAt || new Date().toISOString()
  };
  await writeStore(store);
  return store.plans[plan.adoptionId];
}

export async function deleteIntelligencePlan(adoptionId: string): Promise<void> {
  const store = await readStore();
  delete store.plans[adoptionId];
  await writeStore(store);
}
