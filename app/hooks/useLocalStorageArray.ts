"use client";

import { useState, useCallback, useEffect } from 'react';
import { safeReadArray, safeWriteArray } from '@/app/lib/local-storage';

/**
 * React hook for a localStorage-persisted array.
 *
 * - SSR-safe (returns empty array during server render)
 * - JSON-serialised; handles parse errors gracefully
 * - Exposes `set` (replace all) for simple mutation patterns
 *
 * @example
 * const [items, setItems] = useLocalStorageArray<Partnership>('sufipulse_partnerships');
 */
export function useLocalStorageArray<T>(key: string): [T[], (next: T[]) => void] {
  const [items, setItemsState] = useState<T[]>(() => safeReadArray<T>(key));

  // Re-hydrate from storage when key changes
  useEffect(() => {
    setItemsState(safeReadArray<T>(key));
  }, [key]);

  const setItems = useCallback(
    (next: T[]) => {
      safeWriteArray<T>(key, next);
      setItemsState(next);
    },
    [key],
  );

  return [items, setItems];
}
