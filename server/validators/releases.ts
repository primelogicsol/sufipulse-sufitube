/**
 * server/validators/releases.ts
 *
 * Zod schemas for CMS release management.
 */

import { z } from 'zod';

export const createReleaseSchema = z.object({
  title: z.string().min(3).max(500),
  slug: z.string().min(3).max(500).regex(/^[a-z0-9-]+$/, 'Slug: lowercase letters, numbers, hyphens'),
  youtubeId: z.string().max(100).optional().or(z.literal('')),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  youtubeChannelId: z.string().optional(),
  youtubeChannelUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().max(5000).optional(),
  releaseDate: z.string().optional(),
  category: z.string().max(100).optional(),
  releaseType: z.string().max(100).optional(),
  writer: z.string().max(255).optional(),
  vocalist: z.string().max(255).optional(),
  producer: z.string().max(255).optional(),
  webOnly: z.boolean().optional(),
  status: z.enum(['draft', 'in_review', 'approved', 'published', 'unpublished', 'archived']).optional(),
  enableLyrics: z.boolean().optional(),
  enableCommentary: z.boolean().optional(),
  enableSponsors: z.boolean().optional(),
  enableAdoption: z.boolean().optional(),
  enableCredits: z.boolean().optional(),
});

export const updateReleaseSchema = createReleaseSchema.partial();

export const importYoutubeSchema = z.object({
  channelId: z.string().optional(),
  playlistId: z.string().optional(),
  maxResults: z.number().int().min(1).max(50).optional(),
});

export type CreateReleaseInput = z.infer<typeof createReleaseSchema>;
export type UpdateReleaseInput = z.infer<typeof updateReleaseSchema>;
export type ImportYoutubeInput = z.infer<typeof importYoutubeSchema>;
