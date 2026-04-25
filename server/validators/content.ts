/**
 * server/validators/content.ts
 *
 * Zod schemas for content submissions:
 *   kalams, sadas, articles, contact messages, partnerships.
 */

import { z } from 'zod';

export const kalamSchema = z.object({
  title: z.string().min(3).max(255),
  content: z.string().min(10),
  language: z.string().min(2).max(50),
  themes: z.array(z.string()).min(1, 'At least one theme required'),
  notes: z.string().max(1000).optional(),
  writing_style: z.string().max(100).optional(),
});

export const sadaSchema = z.object({
  title: z.string().min(3).max(255),
  kalam_id: z.string().optional(),
  recording_link: z.string().url().optional().or(z.literal('')),
  performance_notes: z.string().max(1000).optional(),
  language: z.string().min(2).max(50),
  performance_style: z.string().max(100).optional(),
});

export const articleSchema = z.object({
  title: z.string().min(3).max(500),
  slug: z.string().min(3).max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  content: z.string().min(50),
  excerpt: z.string().max(500).optional(),
  category: z.string().min(2).max(100),
  tags: z.array(z.string()).min(1, 'At least one tag required'),
  featured_image: z.string().url().optional().or(z.literal('')),
});

export const contactMessageSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  subject: z.string().min(3).max(255),
  message: z.string().min(10).max(5000),
});

export const partnershipSchema = z.object({
  organization_name: z.string().min(2).max(255),
  contact_name: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  website: z.string().url().optional().or(z.literal('')),
  partnership_type: z.string().min(2).max(100),
  proposal_details: z.string().min(50).max(5000),
});

export type KalamInput = z.infer<typeof kalamSchema>;
export type SadaInput = z.infer<typeof sadaSchema>;
export type ArticleInput = z.infer<typeof articleSchema>;
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
export type PartnershipInput = z.infer<typeof partnershipSchema>;
