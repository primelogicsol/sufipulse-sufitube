import 'server-only';
import { db } from '@/server/db/pool';
import type { PoolClient } from 'pg';

const YOUTUBE_SYNC_LOCK_KEY = 1001001;

export type LockResult = { acquired: true } | { acquired: false; reason: 'busy' };

export class SyncLockManager {
  private client: PoolClient | null = null;

  async tryAcquire(): Promise<LockResult> {
    if (this.client) return { acquired: false, reason: 'busy' };
    
    try {
      this.client = await db.connect();
      const res = await this.client.query('SELECT pg_try_advisory_lock(::bigint) AS acquired', [YOUTUBE_SYNC_LOCK_KEY]);
      if (res.rows[0]?.acquired) {
        return { acquired: true };
      }
      
      this.client.release();
      this.client = null;
      return { acquired: false, reason: 'busy' };
    } catch (e) {
      if (this.client) {
        this.client.release();
        this.client = null;
      }
      throw e;
    }
  }

  async release(): Promise<void> {
    if (!this.client) return;
    
    try {
      await this.client.query('SELECT pg_advisory_unlock(::bigint)', [YOUTUBE_SYNC_LOCK_KEY]);
    } catch (e) {
      // Ignore unlock failure
    } finally {
      this.client.release();
      this.client = null;
    }
  }
}
