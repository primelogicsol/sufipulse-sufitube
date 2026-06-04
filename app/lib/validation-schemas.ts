import { z } from 'zod';
import {
  REGION_CODES,
  DIASPORA_CODES,
  LANGUAGE_CODES,
  SUFI_CONCEPT_CODES,
  THEME_CODES,
  MOOD_CODES
} from '@/lib/cms-taxonomy';

/**
 * Universal Security Audit & Hardening PASS
 * Standardizing max lengths across all public schemas:
 * - name: 120 chars
 * - email: 254 chars
 * - title/role: 160 chars
 * - short text: 300 chars
 * - long description: 5000 chars
 * - URLs: 500 chars
 */

/**
 * User Authentication Schemas
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(120),
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
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
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  pen_name: z.string().max(120).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  email: z.string().email('Invalid email address').max(254),
  years_experience: z.string().max(20).optional(),
  primary_languages: z.array(z.string().max(50)).min(1, 'At least one language required'),
  writing_styles: z.array(z.string().max(50)).optional(),
  literary_background: z.string().max(2000).optional(),
  thematic_focus: z.string().max(2000).optional(),
  sample_kalam: z.string().min(10, 'Sample kalam required').max(5000),
  previous_publications: z.string().max(2000).optional(),
  editorial_review_experience: z.boolean().optional(),
  willing_editorial_process: z.boolean().optional(),
  revision_acknowledged: z.boolean().refine(val => val === true, 'Must acknowledge revision process'),
  institutional_acknowledged: z.boolean().refine(val => val === true, 'Must acknowledge institutional framework'),
});

export const vocalistProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  performance_name: z.string().max(120).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  email: z.string().email('Invalid email address').max(254),
  years_experience: z.string().max(20).optional(),
  vocal_range: z.string().max(50).optional(),
  performance_styles: z.array(z.string().max(50)).optional(),
  languages_performed: z.array(z.string().max(50)).min(1, 'At least one language required'),
  musical_training: z.string().max(2000).optional(),
  sample_link: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  worked_in_studio: z.boolean().nullable().optional(),
  willing_editorial_approval: z.boolean().nullable().optional(),
  accept_producer_coordination: z.boolean().refine(val => val === true, 'Must acknowledge producer coordination'),
  accept_framework: z.boolean().refine(val => val === true, 'Must accept framework'),
});

export const producerProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  professional_name: z.string().max(120).optional(),
  email: z.string().email('Invalid email address').max(254),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  years_experience: z.string().max(20).optional(),
  primary_production_focus: z.array(z.string().max(100)).min(1, 'At least one focus area required'),
  primary_tools: z.string().max(1000).optional(),
  musical_background: z.string().max(2000).optional(),
  portfolio_link: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  worked_structured_production: z.boolean().nullable().optional(),
  willing_defined_sequence: z.boolean().nullable().optional(),
  acknowledge_centralized_control: z.boolean().refine(val => val === true, 'Must acknowledge centralized control'),
  accept_framework: z.boolean().refine(val => val === true, 'Must accept framework'),
});

export const literaryContributorProfileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(120),
  pen_name: z.string().max(120).optional().or(z.literal('')),
  email: z.string().email('Invalid email address').max(254),
  country: z.string().min(2, 'Country is required').max(100),
  city: z.string().min(2, 'City is required').max(100),
  years_experience: z.string().min(1, 'Years of experience is required').max(20),
  primary_languages: z.array(z.string().max(50)).min(1, 'At least one language is required'),
  writing_forms: z.array(z.string().max(100)).min(1, 'At least one writing form is required'),
  areas_of_interest: z.array(z.string().max(100)).min(1, 'At least one area of interest is required'),
  writing_sample_link: z.string().url('Invalid URL').max(500).or(z.literal('')).or(z.null()),
  short_bio: z.string().min(20, 'Short bio must be at least 20 characters').max(2000),
  publication_intent: z.string().min(20, 'Publication intent must be at least 20 characters').max(2000),
  acknowledge_editorial_control: z.boolean().refine(val => val === true, 'Must acknowledge editorial control'),
  accept_framework: z.boolean().refine(val => val === true, 'Must accept framework'),
});

export const studioProfileSchema = z.object({
  studio_name: z.string().min(2, 'Studio name must be at least 2 characters').max(200),
  email: z.string().email('Invalid email address').max(254),
  phone: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  primary_contact_name: z.string().min(2, 'Contact name must be at least 2 characters').max(120),
  years_in_operation: z.string().max(10).optional(),
  previous_work_link: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  agree_centralized_validation: z.boolean().nullable().optional(),
  agree_centralized_authorization: z.boolean().nullable().optional(),
  recording_capabilities: z.array(z.string().max(100)).optional(),
  equipment_overview: z.string().max(5000).optional(),
  accept_terms: z.boolean().refine(val => val === true, 'Must accept terms'),
});

/**
 * Content Submission Schemas
 */
export const kalamSubmissionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title is too long'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(10000),
  language: z.string().min(2, 'Language is required').max(50),
  form_style: z.string().min(2, 'Form/style is required').max(100),
  thematic_category: z.string().min(2, 'Thematic category is required').max(100),
  notes: z.string().max(2000).optional(),
  originality_confirmed: z.boolean().refine(val => val === true, 'Must confirm originality'),
  rights_confirmed: z.boolean().refine(val => val === true, 'Must confirm rights'),
  governance_acknowledged: z.boolean().refine(val => val === true, 'Must acknowledge governance'),
});

export const sadaSubmissionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title is too long'),
  kalam_id: z.string().max(100).optional(),
  recording_link: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  performance_notes: z.string().max(2000).optional(),
  language: z.string().min(2, 'Language is required').max(50),
});

export const articleSubmissionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(500, 'Title is too long'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(300).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  content: z.string().min(50, 'Content must be at least 50 characters').max(20000),
  excerpt: z.string().max(1000).optional(),
  category: z.string().min(2, 'Category is required').max(100),
  tags: z.array(z.string().max(50)).min(1, 'At least one tag required'),
  featured_image: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
});

/**
 * CMS Content Schemas
 */
export const lyricsRequestSchema = z.object({
  releaseId: z.string().min(1, 'Release ID is required').max(100),
  releaseSlug: z.string().min(1, 'Release slug is required').max(100),
  releaseTitle: z.string().min(1, 'Release title is required').max(200),
  youtubeId: z.string().max(100).optional(),
  languageCode: z.string().min(2).max(10),
  languageName: z.string().min(2).max(100),
  requesterName: z.string().max(120).optional(),
  requesterEmail: z.string().email().max(254).optional(),
  note: z.string().max(1000).optional(),
  notifyWhenPublished: z.boolean().optional(),
});

/**
 * CMS Release Schemas
 */
export const cmsReleaseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(500, 'Title is too long'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(500).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  youtubeId: z.string().max(100).optional().or(z.literal('')),
  youtubeUrl: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  description: z.string().max(10000).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  durationFormatted: z.string().max(20).optional(),
  status: z.enum(['draft', 'in_review', 'approved', 'published', 'unpublished', 'archived']).default('draft'),
  releaseType: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  thumbnailUrl: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  posterUrl: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  webOnly: z.boolean().optional(),
  releaseDate: z.string().max(50).optional().or(z.literal('')),
  writer: z.object({
    name: z.string().max(120),
    nameUrdu: z.string().max(120).optional(),
  }).optional(),
  vocalist: z.object({
    name: z.string().max(120),
    nameUrdu: z.string().max(120).optional(),
  }).optional(),
  producer: z.object({
    name: z.string().max(120),
  }).optional(),

  // Release Intelligence Fields
  targetRegions: z.array(z.string().refine(val => REGION_CODES.includes(val as any), "Invalid region code")).optional(),
  targetDiaspora: z.array(z.string().refine(val => DIASPORA_CODES.includes(val as any), "Invalid diaspora market")).optional(),
  targetLanguages: z.array(z.string().refine(val => LANGUAGE_CODES.includes(val as any), "Invalid language code")).optional(),
  sufiConcepts: z.array(z.string().refine(val => SUFI_CONCEPT_CODES.includes(val as any), "Invalid Sufi concept")).optional(),
  themes: z.array(z.string().refine(val => THEME_CODES.includes(val as any), "Invalid spiritual theme")).optional(),
  moods: z.array(z.string().refine(val => MOOD_CODES.includes(val as any), "Invalid mood code")).optional(),
  seoKeywords: z.array(z.string().max(100)).optional(),
  relatedReleases: z.array(z.string().max(100)).optional(),
  relatedPlaylists: z.array(z.string().max(100)).optional(),
  intelligenceStatus: z.enum(['draft', 'reviewed', 'approved']).default('draft'),
  intelligenceUpdatedAt: z.string().max(100).optional(),
}).refine((data) => {
  // Prevent relatedReleases from containing the current release ID
  if (data.id && data.relatedReleases && data.relatedReleases.includes(data.id)) {
    return false;
  }
  return true;
}, {
  message: "Related releases cannot include the current release itself",
  path: ['relatedReleases']
});

/**
 * Song Adoption Schemas
 */
export const adoptionSchema = z.object({
  full_name: z.string().min(2, 'Full name is required').max(120),
  email: z.string().email('Invalid email address').max(254),
  country: z.string().min(2, 'Country is required').max(100),
  city: z.string().max(100).optional(),
  adopter_type: z.string().min(1, 'Adopter type is required').max(100),
  preferred_audience_region: z.string().max(100).optional(),
  campaign_objective: z.string().max(100).optional(),
  google_ads_customer_id: z.string().max(50).optional(),
  dedication_message: z.string().max(2000).optional(),
  public_display_mode: z.string().max(50).optional(),
  public_location_mode: z.string().max(50).optional(),
});

export const adoptionApiSchema = z.object({
  releaseId: z.string().min(1, 'releaseId is required').max(100),
  releaseTitle: z.string().max(500).optional(),
  releaseSlug: z.string().max(500).optional(),
  youtubeId: z.string().max(100).optional(),
  thumbnailUrl: z.string().max(500).optional(),
  methodType: z.enum(['managed_sufitube', 'use_my_google_ads']),
  sponsorName: z.string().max(120).optional(),
  sponsorEmail: z.string().email('Invalid email').max(254).optional(),
  sponsorCountry: z.string().max(100).optional(),
  sponsorCity: z.string().max(100).optional(),
  adopterType: z.string().max(100).optional(),
  campaignIntention: z.string().max(100).optional(),
  dedicationMessage: z.string().max(2000).optional(),
  campaignObjective: z.string().max(100).optional(),
  targetRegions: z.array(z.string().max(100)).optional(),
  targetLanguages: z.array(z.string().max(50)).optional(),
  preferredAudienceRegion: z.string().max(100).optional(),
  amountDue: z.number().optional(),
  currency: z.string().max(10).optional(),
  googleAdsCustomerId: z.string().max(50).optional(),
  googleAdsAccountEmail: z.string().max(254).optional(),
  googleAdsConnectionStatus: z.string().max(50).optional(),
  googleAdsAccessStatus: z.string().max(50).optional(),
  googleAdsTokenStatus: z.string().max(50).optional(),
  googleAdsCampaignId: z.string().max(100).optional(),
  googleAdsCampaignName: z.string().max(200).optional(),
  googleAdsCampaignStatus: z.string().max(50).optional(),
  publicDisplayMode: z.string().max(50).optional(),
  publicLocationMode: z.string().max(50).optional(),
  isAnonymous: z.boolean().optional(),
  adoptionStatus: z.string().max(50).optional(),
  agreementAccepted: z.boolean().optional(),
  publicMentionAccepted: z.boolean().optional(),
  institutionalClausesAccepted: z.boolean().optional(),
  selectedTier: z.string().max(50).optional(),
  selectedTierLabel: z.string().max(100).optional(),
  paymentLinkUrl: z.string().url().max(500).optional(),
});

export const adoptionsQuerySchema = z.object({
  me: z.string().optional(),
  all: z.string().optional(),
  releaseId: z.string().optional(),
});

export const releasesQuerySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  key: z.string().optional(),
  slug: z.string().optional(),
  youtubeId: z.string().optional(),
  t: z.string().optional(),
  forceHydrate: z.string().optional(),
});

/**
 * Contact Form Schema (Institutional Inquiry)
 */
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().email('Invalid email address').max(254),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(300),
  category: z.enum([
    'general_inquiry',
    'contributor_inquiry',
    'studio_coordination',
    'partnership',
    'technical_support',
    'governance',
    'media_press',
    'institutional_collaboration',
    'other'
  ]).default('general_inquiry'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
});

/**
 * Studio Session & Access Request Schemas
 */
export const sessionRequestSchema = z.object({
  requester_name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().email('Invalid email address').max(254),
  approval_reference_code: z.string().min(1, 'Studio Authorization Reference is required').max(100),
  release_id: z.string().max(100).optional(),
  role_type: z.enum(['writer', 'vocalist', 'producer']),
  preferred_date_start: z.string().min(1, 'Start date is required').max(50),
  preferred_date_end: z.string().min(1, 'End date is required').max(50),
  production_reference: z.string().max(100).optional(),
  reason_for_access: z.string().min(10, 'Reason for session access is required').max(2000),
  additional_notes: z.string().max(2000).optional(),
  governance_acknowledgment: z.boolean().refine(val => val === true, 'Must acknowledge governance protocols'),
}).refine(data => {
  const start = new Date(data.preferred_date_start);
  const end = new Date(data.preferred_date_end);
  return end >= start;
}, {
  message: "End date must be the same as or after the start date",
  path: ["preferred_date_end"]
});

export const studioAccessCodeRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().email('Invalid email address').max(254),
  role: z.enum(['writer', 'vocalist', 'producer']),
  profile_reference: z.string().min(1, 'Profile reference is required').max(100),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(2000),
});

/**
 * Partnership Schema
 */
export const partnershipSchema = z.object({
  organization_name: z.string().min(2, 'Organization name must be at least 2 characters').max(255),
  contact_name: z.string().min(2, 'Contact name must be at least 2 characters').max(120),
  email: z.string().email('Invalid email address').max(254),
  phone: z.string().max(50).optional(),
  website: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  partnership_type: z.string().min(2, 'Partnership type is required').max(160),
  proposal_details: z.string().min(50, 'Proposal details must be at least 50 characters').max(5000),
});

/**
 * Infrastructure Schema
 */
export const infrastructureSchema = z.object({
  contact_name: z.string().min(2, 'Contact name must be at least 2 characters').max(120),
  email: z.string().email('Invalid email address').max(254),
  organization_name: z.string().min(2, 'Organization name must be at least 2 characters').max(255),
  role_title: z.string().max(160).optional(),
  proposal_type: z.string().min(2, 'Proposal type is required').max(160),
  website: z.string().url('Invalid URL').max(500).optional().or(z.literal('')),
  technical_description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  integration_scope: z.string().max(2000).optional(),
  compliance_notes: z.string().max(2000).optional(),
  timeline: z.string().max(300).optional(),
});

/**
 * Notification Schema
 */
export const notificationSchema = z.object({
  to: z.string().email('Invalid recipient email address').max(254),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(255),
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  role: z.string().max(100),
  event: z.string().max(100),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  action_url: z.string().url('Invalid action URL').max(500).optional().or(z.literal('')),
  reference: z.string().max(100).optional(),
});

/**
 * Subscription Schema
 */
export const subscriptionSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
});

/**
 * Translation Schema
 */
export const translationSchema = z.object({
  texts: z.array(z.string().max(10000)).min(1, 'At least one text is required'),
  sourceLang: z.string().min(2, 'Source language is required').max(10),
  targetLang: z.string().min(2, 'Target language is required').max(10),
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
  error.issues.forEach((err: z.ZodIssue) => {
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
  infrastructureSchema,
  sessionRequestSchema,
  studioAccessCodeRequestSchema,
  notificationSchema,
  subscriptionSchema,
  translationSchema,
  validateSchema,
  formatFieldErrors,
};
