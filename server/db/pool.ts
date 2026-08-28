import 'server-only';
import { Pool } from 'pg';

const globalForDb = globalThis as unknown as {
  sufipulsePgPool?: Pool;
};

export const db =
  globalForDb.sufipulsePgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sufipulsePgPool = db;
}
