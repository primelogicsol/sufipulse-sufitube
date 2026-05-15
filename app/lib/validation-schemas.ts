import { z } from 'zod';

/**
 * User Authentication Schemas
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  password_confirm: z.string(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ['password_confirm'],
});

/**
 * Profile Schemas
 */
export const writerProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  pen_name: z.string().max(255).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  email: z.string().email('Invalid email address'),
  years_experience: z.string().optional(),
  primary_languages: z.array(z.string()).min(1, 'At least one language required'),
  writing_styles: z.array(z.string()).optional(),
  literary_background: z.string().optional(),
  thematic_focus: z.string().optional(),
  sample_kalam: z.string().min(10, 'Sample kalam required'),
  previous_publications: z.string().optional(),
  editorial_review_experience: z.boolean().optional(),
  willing_editorial_process: z.boolean().optional(),
  revision_acknowledged: z.boolean().refine(val => val === true, 'Must acknowledge revision process'),
  institutional_acknowledged: z.boolean().refine(val => val === true, 'Must acknowledge institutional framework'),
});

export const vocalistProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  performance_name: z.string().max(255).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  email: z.string().email('Invalid email address'),
  years_experience: z.string().optional(),
  vocal_range: z.string().max(50).optional(),
  performance_styles: z.array(z.string()).optional(),
  languages_performed: z.array(z.string()).min(1, 'At least one language required'),
  musical_training: z.string().optional(),
  sample_link: z.string().url('Invalid URL').optional().or(z.literal('')),
  worked_in_studio: z.boolean().nullable().optional(),
  willing_editorial_approval: z.boolean().nullable().optional(),
  accept_producer_coordination: z.boolean().refine(val => val === true, 'Must acknowledge producer coordination'),
  accept_framework: z.boolean().refine(val => val === true, 'Must accept framework'),
});

export const producerProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  professional_name: z.string().max(255).optional(),
  email: z.string().email('Invalid email address'),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  years_experience: z.string().max(20).optional(),
  primary_production_focus: z.array(z.string()).min(1, 'At least one focus area required'),
  primary_tools: z.string().optional(),
  musical_background: z.string().optional(),
  portfolio_link: z.string().url('Invalid URL').optional().or(z.literal('')),
  worked_structured_production: z.boolean().nullable().optional(),
  willing_defined_sequence: z.boolean().nullable().optional(),
  acknowledge_centralized_control: z.boolean().refine(val => val === true, 'Must acknowledge centralized control'),
  accept_framework: z.boolean().refine(val => val === true, 'Must accept framework'),
});

export const literaryContributorProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  professional_name: z.string().max(255).optional(),
  email: z.string().email('Invalid email address'),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  years_experience: z.string().optional(),
  writing_focus: z.array(z.string()).min(1, 'At least one focus area required'),
  languages: z.array(z.string()).min(1, 'At least one language required'),
  background: z.string().optional(),
  portfolio_link: z.string().url('Invalid URL').optional().or(z.literal('')),
  worked_editorial_process: z.boolean().nullable().optional(),
  willing_review_process: z.boolean().nullable().optional(),
  acknowledge_editorial_control: z.boolean().refine(val => val === true, 'Must acknowledge editorial control'),
  accept_framework: z.boolean().refine(val => val === true, 'Must accept framework'),
});

export const studioProfileSchema = z.object({
  studio_name: z.string().min(2, 'Studio name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  primary_contact_name: z.string().min(2, 'Contact name must be at least 2 characters').max(255),
  years_in_operation: z.string().max(10).optional(),
  previous_work_link: z.string().url('Invalid URL').optional().or(z.literal('')),
  agree_centralized_validation: z.boolean().nullable().optional(),
  agree_centralized_authorization: z.boolean().nullable().optional(),
  recording_capabilities: z.array(z.string()).optional(),
  equipment_overview: z.string().optional(),
  accept_terms: z.boolean().refine(val => val === true, 'Must accept terms'),
});

/**
 * Content Submission Schemas
 */
export const kalamSubmissionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title is too long'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  language: z.string().min(2, 'Language is required').max(50),
  themes: z.array(z.string()).min(1, 'At least one theme required'),
  notes: z.string().max(1000).optional(),
});

export const sadaSubmissionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title is too long'),
  kalam_id: z.string().uuid('Invalid kalam ID').optional(),
  recording_link: z.string().url('Invalid URL').optional().or(z.literal('')),
  performance_notes: z.string().max(1000).optional(),
  language: z.string().min(2, 'Language is required').max(50),
});

export const articleSubmissionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(500, 'Title is too long'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  excerpt: z.string().max(500).optional(),
  category: z.string().min(2, 'Category is required').max(100),
  tags: z.array(z.string()).min(1, 'At least one tag required'),
  featured_image: z.string().url('Invalid URL').optional().or(z.literal('')),
});

/**
 * CMS Release Schemas
 */
export const cmsReleaseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(500, 'Title is too long'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(500).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  youtubeId: z.string().max(100).optional().or(z.literal('')),
  youtubeUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().max(10000).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  durationFormatted: z.string().optional(),
  status: z.enum(['draft', 'in_review', 'approved', 'published', 'unpublished', 'archived']).default('draft'),
  releaseType: z.string().optional(),
  category: z.string().optional(),
  thumbnailUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  posterUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  webOnly: z.boolean().optional(),
  releaseDate: z.string().optional().or(z.literal('')),
  writer: z.object({
    name: z.string(),
    nameUrdu: z.string().optional(),
  }).optional(),
  vocalist: z.object({
    name: z.string(),
    nameUrdu: z.string().optional(),
  }).optional(),
  producer: z.object({
    name: z.string(),
  }).optional(),
});

export const releasesQuerySchema = z.object({
  key: z.string().optional(),
  slug: z.string().optional(),
  youtubeId: z.string().optional(),
  status: z.string().optional(),
  format: z.string().optional(),
  type: z.string().optional(),
  duration: z.string().optional(),
  year: z.string().optional(),
  search: z.string().optional(),
  refresh: z.string().optional(),
  nocache: z.string().optional(),
  t: z.string().optional(),
  forceHydrate: z.string().optional(),
});

/**
 * Song Adoption Schemas
 */
export const adoptionSchema = z.object({
  full_name: z.string().min(2, 'Full name is required').max(255),
  email: z.string().email('Invalid email address'),
  country: z.string().min(2, 'Country is required').max(100),
  city: z.string().max(100).optional(),
  adopter_type: z.string().min(1, 'Adopter type is required'),
  preferred_audience_region: z.string().optional(),
  campaign_objective: z.string().optional(),
  google_ads_customer_id: z.string().optional(),
  dedication_message: z.string().max(1000).optional(),
  public_display_mode: z.string().optional(),
  public_location_mode: z.string().optional(),
});

export const adoptionApiSchema = z.object({
  releaseId: z.string().min(1, 'releaseId is required'),
  releaseTitle: z.string().optional(),
  releaseSlug: z.string().optional(),
  methodType: z.enum(['managed_sufitube', 'use_my_google_ads']),
  sponsorName: z.string().optional(),
  sponsorEmail: z.string().email('Invalid email').optional(),
  sponsorCountry: z.string().optional(),
  sponsorCity: z.string().optional(),
  adopterType: z.string().optional(),
  campaignIntention: z.string().optional(),
  dedicationMessage: z.string().max(1000).optional(),
  campaignObjective: z.string().optional(),
  targetRegions: z.array(z.string()).optional(),
  targetLanguages: z.array(z.string()).optional(),
  amountDue: z.number().optional(),
  currency: z.string().optional(),
  googleAdsCustomerId: z.string().optional(),
  publicDisplayMode: z.string().optional(),
  publicLocationMode: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  adoptionStatus: z.string().optional(),
});

export const adoptionsQuerySchema = z.object({
  me: z.string().optional(),
  all: z.string().optional(),
  releaseId: z.string().optional(),
});

/**
 * Contact Form Schema
 */
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(255),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
});

/**
 * Studio Session & Access Request Schemas
 */
export const sessionRequestSchema = z.object({
  requester_name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  approval_reference_code: z.string().min(1, 'Reference code is required').max(100),
  release_id: z.string().optional(),
  role_type: z.enum(['writer', 'vocalist', 'producer']),
  preferred_date_start: z.string().min(1, 'Start date is required'),
  preferred_date_end: z.string().min(1, 'End date is required'),
  production_reference: z.string().optional(),
  additional_notes: z.string().max(2000).optional(),
});

export const studioAccessCodeRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  role: z.enum(['writer', 'vocalist', 'producer']),
  profile_reference: z.string().min(1, 'Profile reference is required').max(100),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(2000),
});

/**
 * Partnership Schema
 */
export const partnershipSchema = z.object({
  organization_name: z.string().min(2, 'Organization name must be at least 2 characters').max(255),
  contact_name: z.string().min(2, 'Contact name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(50).optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  partnership_type: z.string().min(2, 'Partnership type is required').max(100),
  proposal_details: z.string().min(50, 'Proposal details must be at least 50 characters').max(5000),
});

/**
 * Notification Schema
 */
export const notificationSchema = z.object({
  to: z.string().email('Invalid recipient email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(255),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.string(),
  event: z.string(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  action_url: z.string().url('Invalid action URL').optional().or(z.literal('')),
  reference: z.string().optional(),
});

/**
 * Translation Schema
 */
export const translationSchema = z.object({
  texts: z.array(z.string()).min(1, 'At least one text is required'),
  sourceLang: z.string().min(2, 'Source language is required'),
  targetLang: z.string().min(2, 'Target language is required'),
});

/**
 * Helper function to validate and parse
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: z.ZodError<T> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Helper to format Zod errors into a simple field-to-message mapping
 */
export function formatFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const key = err.path.map(String).join('.');
    if (key) {
      fieldErrors[key] = err.message;
    }
  });
  return fieldErrors;
}

export default {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  writerProfileSchema,
  vocalistProfileSchema,
  producerProfileSchema,
  literaryContributorProfileSchema,
  studioProfileSchema,
  kalamSubmissionSchema,
  sadaSubmissionSchema,
  articleSubmissionSchema,
  cmsReleaseSchema,
  adoptionSchema,
  contactFormSchema,
  partnershipSchema,
  sessionRequestSchema,
  studioAccessCodeRequestSchema,
  notificationSchema,
  translationSchema,
  validateSchema,
  formatFieldErrors,
};
