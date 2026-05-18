/**
 * server/types/index.ts
 *
 * Canonical TypeScript types for the entire backend.
 * Import types from here — never from lib/database-schema.ts directly.
 *
 * All types are re-exported from their canonical source so this file
 * is the single import point for any server-side type.
 */

// ─── Core domain types ────────────────────────────────────────────────────────
export type {
  User,
  WriterProfile,
  VocalistProfile,
  ProducerProfile,
  LiteraryContributorProfile,
  StudioProfile,
  Kalam,
  Sada,
  Article,
  PartnershipProposal,
  CMSRelease,
  SongAdoption,
  InstitutionalInquiry,
  SessionRequest,
  StudioAccessCode,
  PerformanceAssignment,
  RoyaltyRecord,
  MediaLibrary,
  Notification,
  DatabaseSchema,
} from '@/lib/database-schema';

// ─── CMS types ────────────────────────────────────────────────────────────────
export type { CMSRelease as CmsRelease } from '@/lib/cms-storage';

// ─── API response shapes ──────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
    fieldErrors?: Record<string, string[]>;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Auth token payload ───────────────────────────────────────────────────────

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

// ─── Email ────────────────────────────────────────────────────────────────────

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ─── Utility helpers ─────────────────────────────────────────────────────────

export type WithoutPassword<T extends { password_hash?: string }> = Omit<
  T,
  'password_hash'
>;

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
};
