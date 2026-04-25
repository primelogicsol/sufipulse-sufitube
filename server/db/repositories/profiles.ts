/**
 * server/db/repositories/profiles.ts
 *
 * CRUD operations for all contributor profile types:
 *   - writer_profiles
 *   - vocalist_profiles
 *   - producer_profiles
 *   - literary_contributor_profiles
 *   - studio_profiles
 */

import { db, generateId } from '@/lib/database';
import type {
  WriterProfile,
  VocalistProfile,
  ProducerProfile,
  LiteraryContributorProfile,
  StudioProfile,
} from '@/server/types';

type ProfileStatus = 'pending' | 'approved' | 'revision' | 'rejected';

// ─── Generic helpers ──────────────────────────────────────────────────────────

function makeRepo<T extends { id: string; user_id: string; profile_status: ProfileStatus; created_at: string; updated_at: string }>(
  tableName: string
) {
  const table = () => db.table<T>(tableName);
  const now = () => new Date().toISOString();

  return {
    findById: (id: string) => table().findById(id),
    findByUserId: (userId: string) => table().findOne({ user_id: userId } as Partial<T>),
    listAll: () => table().getAll(),
    listByStatus: (status: ProfileStatus) => table().find({ profile_status: status } as Partial<T>),
    count: () => table().count(),

    create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): T {
      const ts = now();
      return table().insert({ ...data, id: generateId(), created_at: ts, updated_at: ts } as T);
    },

    update(id: string, data: Partial<Omit<T, 'id' | 'created_at'>>): T | null {
      return table().update(id, { ...data, updated_at: now() } as Partial<T>);
    },

    setStatus(id: string, status: ProfileStatus, adminFeedback?: string): T | null {
      return table().update(id, {
        profile_status: status,
        ...(adminFeedback !== undefined && { admin_feedback: adminFeedback }),
        updated_at: now(),
      } as Partial<T>);
    },

    delete: (id: string) => table().delete(id),
  };
}

// ─── Per-table repositories ───────────────────────────────────────────────────

export const writerProfilesRepository = makeRepo<WriterProfile>('writer_profiles');
export const vocalistProfilesRepository = makeRepo<VocalistProfile>('vocalist_profiles');
export const producerProfilesRepository = makeRepo<ProducerProfile>('producer_profiles');
export const literaryContributorProfilesRepository = makeRepo<LiteraryContributorProfile>('literary_contributor_profiles');
export const studioProfilesRepository = makeRepo<StudioProfile>('studio_profiles');

// ─── Convenience lookup by role ───────────────────────────────────────────────

export const profilesRepository = {
  writer: writerProfilesRepository,
  vocalist: vocalistProfilesRepository,
  producer: producerProfilesRepository,
  literary: literaryContributorProfilesRepository,
  studio: studioProfilesRepository,
} as const;
