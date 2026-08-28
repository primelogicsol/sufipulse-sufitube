import 'server-only';
import { type CMSRelease } from '@/lib/cms-storage';

export function isMateriallyChanged(existing: CMSRelease, mapped: CMSRelease): boolean {
  const excludedKeys = new Set(['updatedAt', 'lastYoutubeSyncAt', 'youtubeTitleLastSyncedAt']);
  
  const allKeys = new Set([...Object.keys(existing), ...Object.keys(mapped)]);
  
  for (const key of allKeys) {
    if (excludedKeys.has(key)) continue;
    
    const valE = (existing as any)[key];
    const valM = (mapped as any)[key];
    
    // Deep compare
    if (JSON.stringify(valE) !== JSON.stringify(valM)) {
      return true;
    }
  }
  
  return false;
}
