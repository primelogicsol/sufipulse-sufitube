import { db } from '@/server/db/postgres';
import type { PoolClient } from 'pg';

// Using a distinct constant lock key for YouTube synchronization
const YOUTUBE_SYNC_LOCK_KEY = 1001001;

export class SyncLockManager {
  private client: PoolClient | null = null;

  async tryAcquire(): Promise<boolean> {
    if (this.client) return false;
    
    try {
      this.client = await db.connect();
      const res = await this.client.query('SELECT pg_try_advisory_lock() AS acquired', [YOUTUBE_SYNC_LOCK_KEY]);
      if (res.rows[0]?.acquired) {
        return true;
      }
      
      // If lock not acquired, release the client immediately
      this.client.release();
      this.client = null;
      return false;
    } catch (e) {
      if (this.client) {
        this.client.release();
        this.client = null;
      }
      return false;
    }
  }

  async release(): Promise<void> {
    if (!this.client) return;
    
    try {
      await this.client.query('SELECT pg_advisory_unlock()', [YOUTUBE_SYNC_LOCK_KEY]);
    } catch (e) {
      // Ignore unlock failure, the connection release will drop the lock anyway
    } finally {
      this.client.release();
      this.client = null;
    }
  }
}
