import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), '.data');

function filePath(entity: string): string {
  return path.join(DATA_DIR, `${entity}.json`);
}

function readAll<T extends { id: string }>(entity: string): T[] {
  try {
    const fp = filePath(entity);
    if (!fs.existsSync(fp)) return [];
    const raw = fs.readFileSync(fp, 'utf8');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll<T>(entity: string, records: T[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath(entity), JSON.stringify(records, null, 2), 'utf8');
}

export function entityGetAll<T extends { id: string }>(entity: string): T[] {
  return readAll<T>(entity);
}

export function entityGetById<T extends { id: string }>(entity: string, id: string): T | undefined {
  return readAll<T>(entity).find((r) => r.id === id);
}

export function entityCreate<T extends { id: string }>(entity: string, data: Omit<T, 'id'> & Partial<Pick<T, 'id'>>): T {
  const records = readAll<T>(entity);
  const record = {
    ...data,
    id: (data as any).id || `${entity}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    created_at: (data as any).created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as T;
  records.push(record);
  writeAll(entity, records);
  return record;
}

export function entityUpdate<T extends { id: string }>(entity: string, id: string, patch: Partial<T>): T | null {
  const records = readAll<T>(entity);
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  records[idx] = { ...records[idx], ...patch, updated_at: new Date().toISOString() } as T;
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
