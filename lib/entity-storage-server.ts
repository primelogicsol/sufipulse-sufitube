import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.join(process.cwd(), '.data');

function validateEntity(entity: string): void {
  if (!/^[a-z0-9_-]+$/.test(entity)) {
    throw new Error(`Invalid entity name: ${entity}`);
  }
}

function filePath(entity: string): string {
  validateEntity(entity);
  return path.join(DATA_DIR, `${entity}.json`);
}

function readAll<T extends { id: string }>(entity: string): T[] {
  try {
    const fp = filePath(entity);
    if (!fs.existsSync(fp)) return [];
    const raw = fs.readFileSync(fp, 'utf8');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`[entity-storage] Failed to read ${entity}:`, e);
    return [];
  }
}

function writeAll<T>(entity: string, records: T[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const fp = filePath(entity);
  const tmp = `${fp}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(records, null, 2), 'utf8');
  fs.renameSync(tmp, fp);
}

export function entityGetAll<T extends { id: string }>(entity: string): T[] {
  return readAll<T>(entity);
}

export function entityGetById<T extends { id: string }>(entity: string, id: string): T | undefined {
  return readAll<T>(entity).find((r) => r.id === id);
}

export function entityCreate<T extends { id: string }>(entity: string, data: Omit<T, 'id'>): T {
  const records = readAll<T>(entity);
  const record = {
    ...data,
    id: `${entity}_${crypto.randomUUID()}`,
    created_at: (data as any).created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as T;
  records.push(record);
  writeAll(entity, records);
  return record;
}

export function entityUpdate<T extends { id: string }>(entity: string, id: string, patch: Partial<Omit<T, 'id'>>): T | null {
  const records = readAll<T>(entity);
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  records[idx] = { ...records[idx], ...patch, id, updated_at: new Date().toISOString() } as T;
  writeAll(entity, records);
  return records[idx];
}

export function entityDelete(entity: string, id: string): boolean {
  const records = readAll<{ id: string }>(entity);
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  records.splice(idx, 1);
  writeAll(entity, records);
  return true;
}
