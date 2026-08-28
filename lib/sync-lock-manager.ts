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
      const res = await this.client.query('SELECT pg_try_advisory_lock($1::bigint) AS acquired', [YOUTUBE_SYNC_LOCK_KEY]);
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
    
    const client = this.client;
    this.client = null;
    
    try {
      const result = await client.query('SELECT pg_advisory_unlock($1::bigint) AS released', [YOUTUBE_SYNC_LOCK_KEY]);
      if (result.rows[0]?.released !== true) {
        const error = new Error('YouTube sync advisory lock was not released');
        client.release(error as any);
        throw error;
      }
      client.release();
    } catch (e: any) {
      // Pass truthy/error to destroy connection rather than returning to pool
      client.release(e instanceof Error ? e : true as any);
      throw e;
    }
  }
}
