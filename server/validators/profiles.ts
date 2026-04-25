/**
 * server/validators/profiles.ts
 *
 * Zod schemas for contributor profile submissions.
 * Uses Zod v4 API (message: string, not errorMap).
 */

import { z } from 'zod';

const mustBeTrue = (msg: string) =>
  z.literal(true, { message: msg });

export const writerProfileSchema = z.object({
  full_name: z.string().min(2).max(255),
  pen_name: z.string().max(255).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  years_writing: z.number().int().min(0).optional(),
  writing_languages: z.array(z.string()).min(1, 'At least one language required'),
  primary_themes: z.array(z.string()).optional(),
  previous_publications: z.string().optional(),
  sample_work_link: z.string().url().optional().or(z.literal('')),
  acknowledge_peer_review: mustBeTrue('Must acknowledge peer review'),
  acknowledge_editorial_control: mustBeTrue('Must acknowledge editorial control'),
  accept_framework: mustBeTrue('Must accept framework'),
});

export const vocalistProfileSchema = z.object({
  full_name: z.string().min(2).max(255),
  stage_name: z.string().max(255).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  years_performing: z.number().int().min(0).optional(),
  vocal_range: z.string().max(50).optional(),
  performance_languages: z.array(z.string()).min(1, 'At least one language required'),
  musical_training: z.string().optional(),
  performance_experience: z.string().optional(),
  sample_recording_link: z.string().url().optional().or(z.literal('')),
  acknowledge_direction: mustBeTrue('Must acknowledge direction'),
  acknowledge_validation: mustBeTrue('Must acknowledge validation'),
  accept_framework: mustBeTrue('Must accept framework'),
});

export const producerProfileSchema = z.object({
  full_name: z.string().min(2).max(255),
  professional_name: z.string().max(255).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  email: z.string().email(),
  years_experience: z.string().max(20).optional(),
  primary_production_focus: z.array(z.string()).min(1, 'At least one focus area required'),
  primary_tools: z.string().optional(),
  musical_background: z.string().optional(),
  portfolio_link: z.string().url().optional().or(z.literal('')),
  worked_structured_production: z.boolean().nullable().optional(),
  willing_defined_sequence: z.boolean().nullable().optional(),
  acknowledge_centralized_control: mustBeTrue('Must acknowledge centralized control'),
  accept_framework: mustBeTrue('Must accept framework'),
});

export const literaryContributorProfileSchema = z.object({
  full_name: z.string().min(2).max(255),
  professional_name: z.string().max(255).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  email: z.string().email(),
  years_experience: z.number().int().min(0).optional(),
  writing_focus: z.array(z.string()).min(1, 'At least one focus area required'),
  languages: z.array(z.string()).min(1, 'At least one language required'),
  background: z.string().optional(),
  portfolio_link: z.string().url().optional().or(z.literal('')),
  worked_editorial_process: z.boolean().nullable().optional(),
  willing_review_process: z.boolean().nullable().optional(),
  acknowledge_editorial_control: mustBeTrue('Must acknowledge editorial control'),
  accept_framework: mustBeTrue('Must accept framework'),
});

export const studioProfileSchema = z.object({
  studio_name: z.string().min(2).max(255),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  primary_contact_name: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  years_in_operation: z.string().max(10).optional(),
  previous_work_link: z.string().url().optional().or(z.literal('')),
  agree_centralized_validation: z.boolean().nullable().optional(),
  agree_centralized_authorization: z.boolean().nullable().optional(),
  recording_capabilities: z.array(z.string()).optional(),
  equipment_overview: z.string().optional(),
  accept_terms: mustBeTrue('Must accept terms'),
});

export type WriterProfileInput = z.infer<typeof writerProfileSchema>;
export type VocalistProfileInput = z.infer<typeof vocalistProfileSchema>;
export type ProducerProfileInput = z.infer<typeof producerProfileSchema>;
export type LiteraryContributorProfileInput = z.infer<typeof literaryContributorProfileSchema>;
export type StudioProfileInput = z.infer<typeof studioProfileSchema>;
