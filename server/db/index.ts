/**
 * server/db/index.ts
 *
 * Database layer entry point.
 *
 * DEFAULT DRIVER: File-based JSON (zero external dependencies).
 *   - Data is stored in .data/*.json
 *   - Automatic hourly backups in .data/backups/
 *   - Works out of the box with no configuration
 *
 * POSTGRES DRIVER (optional):
 *   Set DB_TYPE=postgres and DATABASE_URL=postgresql://... in .env.local
 *   Then implement server/db/drivers/postgres.ts (see README).
 *
 * To switch drivers: change DB_TYPE env var — no code changes needed.
 */

// Re-export the core database primitives
export {
  db,
  Database,
  DatabaseTable,
  generateId,
  backupDatabase,
  restoreDatabase,
} from '@/lib/database';

// Re-export typed table accessor and seed utility
export { getTable, seedDatabase } from '@/lib/database-schema';

// Re-export the schema type map (table name → record type)
export type { DatabaseSchema } from '@/lib/database-schema';

// Re-export all repository modules for convenient access
export * from './repositories';
