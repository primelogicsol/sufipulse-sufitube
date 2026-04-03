/**
 * Safe localStorage helpers — handle SSR (window not defined), JSON parse errors,
 * and object-stored arrays consistently.
 *
 * These are pure utility functions, usable in both components and hooks.
 *
 * Usage:
 *   import { safeReadArray, safeWriteArray, safeReadObject } from '@/app/lib/local-storage';
 *
 *   const items = safeReadArray<MyType>('sufipulse_kalams');
 *   safeWriteArray('sufipulse_kalams', [...items, newItem]);
 */

/** Normalize data that may be stored as an array or as a { 0: …, 1: … } object. */
function normalizeArrayLike(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const keys = Object.keys(value as object);
    if (keys.every((k) => /^\d+$/.test(k))) return Object.values(value as object);
  }
  return [];
}

/**
 * Read a JSON-serialised array from localStorage.
 * Returns an empty array on any error or when running server-side.
 */
export function safeReadArray<T = unknown>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return normalizeArrayLike(parsed) as T[];
  } catch {
    return [];
  }
}

/**
 * Write an array to localStorage as JSON.
 * No-ops server-side or on serialisation errors.
 */
export function safeWriteArray<T = unknown>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota exceeded or serialisation error — silently ignore
  }
}

/**
 * Read a JSON-serialised object from localStorage.
 * Returns null on any error or when running server-side.
 */
export function safeReadObject<T extends object = Record<string, unknown>>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as T;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Write an object to localStorage as JSON.
 */
export function safeWriteObject<T extends object = Record<string, unknown>>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota exceeded or serialisation error — silently ignore
  }
}

/**
 * Count items in a stored array that match a set of "pending-like" statuses.
 * Useful for dashboard stat cards.
 */
const PENDING_STATES = new Set(['pending', 'submitted', 'under_review', 'revision_requested', 'unread']);

export function pendingCount(items: Record<string, unknown>[], field: string = 'status'): number {
  return items.filter((item) => PENDING_STATES.has(String(item?.[field] ?? '').toLowerCase())).length;
}
