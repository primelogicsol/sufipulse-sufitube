/**
 * server/db/repositories/content.ts
 *
 * CRUD operations for user-submitted content:
 *   - kalams       (poetry submissions by writers)
 *   - sadas        (vocal performances by vocalists)
 *   - articles     (literary articles by contributors)
 *   - contact_messages
 *   - partnership_proposals
 *   - notifications
 */

import { db, generateId } from '@/lib/database';
import type {
  Kalam,
  Sada,
  Article,
  InstitutionalInquiry,
  PartnershipProposal,
  Notification,
} from '@/server/types';

type ContentStatus = 'pending' | 'approved' | 'revision' | 'rejected';

const now = () => new Date().toISOString();

// ─── Kalams ───────────────────────────────────────────────────────────────────

const kalamsTable = () => db.table<Kalam>('kalams');

export const kalamsRepository = {
  findById: (id: string) => kalamsTable().findById(id),
  findByWriter: (writerId: string) => kalamsTable().find({ writer_id: writerId }),
  findByUser: (userId: string) => kalamsTable().find({ user_id: userId }),
  listAll: () => kalamsTable().getAll(),
  listByStatus: (status: ContentStatus) => kalamsTable().find({ status }),
  count: () => kalamsTable().count(),

  create(data: Omit<Kalam, 'id' | 'created_at' | 'updated_at'>): Kalam {
    const ts = now();
    return kalamsTable().insert({ ...data, id: generateId(), created_at: ts, updated_at: ts });
  },

  update(id: string, data: Partial<Omit<Kalam, 'id' | 'created_at'>>): Kalam | null {
    return kalamsTable().update(id, { ...data, updated_at: now() });
  },

  setStatus(id: string, status: ContentStatus, adminFeedback?: string): Kalam | null {
    return kalamsTable().update(id, {
      status,
      ...(adminFeedback !== undefined && { admin_feedback: adminFeedback }),
      updated_at: now(),
    });
  },

  delete: (id: string) => kalamsTable().delete(id),
};

// ─── Sadas ────────────────────────────────────────────────────────────────────

const sadasTable = () => db.table<Sada>('sadas');

export const sadasRepository = {
  findById: (id: string) => sadasTable().findById(id),
  findByVocalist: (vocalistId: string) => sadasTable().find({ vocalist_id: vocalistId }),
  findByUser: (userId: string) => sadasTable().find({ user_id: userId }),
  findByKalam: (kalamId: string) => sadasTable().find({ kalam_id: kalamId }),
  listAll: () => sadasTable().getAll(),
  listByStatus: (status: ContentStatus) => sadasTable().find({ status }),
  count: () => sadasTable().count(),

  create(data: Omit<Sada, 'id' | 'created_at' | 'updated_at'>): Sada {
    const ts = now();
    return sadasTable().insert({ ...data, id: generateId(), created_at: ts, updated_at: ts });
  },

  update(id: string, data: Partial<Omit<Sada, 'id' | 'created_at'>>): Sada | null {
    return sadasTable().update(id, { ...data, updated_at: now() });
  },

  setStatus(id: string, status: ContentStatus, adminFeedback?: string): Sada | null {
    return sadasTable().update(id, {
      status,
      ...(adminFeedback !== undefined && { admin_feedback: adminFeedback }),
      updated_at: now(),
    });
  },

  delete: (id: string) => sadasTable().delete(id),
};

// ─── Articles ─────────────────────────────────────────────────────────────────

const articlesTable = () => db.table<Article>('articles');

export const articlesRepository = {
  findById: (id: string) => articlesTable().findById(id),
  findBySlug: (slug: string) => articlesTable().findOne({ slug }),
  findByContributor: (contributorId: string) => articlesTable().find({ contributor_id: contributorId }),
  findByUser: (userId: string) => articlesTable().find({ user_id: userId }),
  listAll: () => articlesTable().getAll(),
  listPublished: () => articlesTable().find({ status: 'published' }),
  listByCategory: (category: string) => articlesTable().find({ category }),
  count: () => articlesTable().count(),

  create(data: Omit<Article, 'id' | 'created_at' | 'updated_at'>): Article {
    const ts = now();
    return articlesTable().insert({ ...data, id: generateId(), created_at: ts, updated_at: ts });
  },

  update(id: string, data: Partial<Omit<Article, 'id' | 'created_at'>>): Article | null {
    return articlesTable().update(id, { ...data, updated_at: now() });
  },

  publish(id: string): Article | null {
    return articlesTable().update(id, {
      status: 'published',
      published_at: now(),
      updated_at: now(),
    });
  },

  delete: (id: string) => articlesTable().delete(id),
};

// ─── Institutional Inquiries ──────────────────────────────────────────────────

const inquiryTable = () => db.table<InstitutionalInquiry>('inquiries');

export const inquiryRepository = {
  findById: (id: string) => inquiryTable().findById(id),
  listAll: () => inquiryTable().getAll(),
  listByStatus: (status: InstitutionalInquiry['status']) => inquiryTable().find({ status }),
  count: () => inquiryTable().count(),

  create(data: Omit<InstitutionalInquiry, 'id' | 'created_at' | 'updated_at'>): InstitutionalInquiry {
    const ts = now();
    return inquiryTable().insert({ ...data, id: generateId(), created_at: ts, updated_at: ts });
  },

  update(id: string, data: Partial<Omit<InstitutionalInquiry, 'id' | 'created_at'>>): InstitutionalInquiry | null {
    return inquiryTable().update(id, { ...data, updated_at: now() });
  },

  delete: (id: string) => inquiryTable().delete(id),
};

// ─── Partnership proposals ────────────────────────────────────────────────────

const partnershipTable = () => db.table<PartnershipProposal>('partnership_proposals');

export const partnershipRepository = {
  findById: (id: string) => partnershipTable().findById(id),
  listAll: () => partnershipTable().getAll(),
  listByStatus: (status: PartnershipProposal['status']) => partnershipTable().find({ status }),
  count: () => partnershipTable().count(),

  create(data: Omit<PartnershipProposal, 'id' | 'created_at' | 'updated_at'>): PartnershipProposal {
    const ts = now();
    return partnershipTable().insert({ ...data, id: generateId(), created_at: ts, updated_at: ts });
  },

  update(id: string, data: Partial<Omit<PartnershipProposal, 'id' | 'created_at'>>): PartnershipProposal | null {
    return partnershipTable().update(id, { ...data, updated_at: now() });
  },

  delete: (id: string) => partnershipTable().delete(id),
};

// ─── Notifications ────────────────────────────────────────────────────────────

const notifTable = () => db.table<Notification>('notifications');

export const notificationsRepository = {
  findById: (id: string) => notifTable().findById(id),
  findByUser: (userId: string) => notifTable().find({ user_id: userId }),
  listUnread: (userId: string) => notifTable().find({ user_id: userId, is_read: false }),
  countUnread: (userId: string) => notifTable().count({ user_id: userId, is_read: false } as Partial<Notification>),

  create(data: Omit<Notification, 'id' | 'created_at'>): Notification {
    return notifTable().insert({
      ...data,
      id: generateId(),
      created_at: now(),
    });
  },

  markRead(id: string): Notification | null {
    return notifTable().update(id, { is_read: true });
  },

  markAllRead(userId: string): number {
    return notifTable().updateMany({ user_id: userId, is_read: false } as Partial<Notification>, { is_read: true });
  },

  delete: (id: string) => notifTable().delete(id),
  deleteAllForUser: (userId: string) => notifTable().deleteMany({ user_id: userId }),
};
