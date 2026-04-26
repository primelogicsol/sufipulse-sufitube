export interface SongAdoption {
  id: string;
  release_id: string;
  user_id?: string;
  method_type: 'managed_sufitube' | 'use_my_google_ads';
  adoption_status: 'draft' | 'pending_review' | 'approved' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  google_ads_campaign_resource?: string;
  payment_route?: 'google_direct' | 'stripe_sufipulse';
  package_id?: string;
  custom_budget?: number;
  currency: string;
  amount_due: number;
  amount_paid: number;
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  onboarding_fee?: number;
  campaign_objective: string;
  target_regions: string[];
  target_languages: string[];
  audience_type: string;
  special_instructions?: string;
  dedication_message?: string;
  sponsor_note?: string;
  public_display_mode: 'full_name' | 'initials_only' | 'organization' | 'anonymous';
  public_location_mode: 'city_country' | 'country_only' | 'hide';
  public_listing_approved: boolean;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface SongAdoptionSponsor {
  id: string;
  adoption_id: string;
  full_name: string;
  organization_name?: string;
  email: string;
  phone?: string;
  country: string;
  city?: string;
  adopter_type: 'individual' | 'family' | 'institution' | 'trust' | 'sponsor_circle' | 'anonymous';
  display_name_resolved: string;
  initials_resolved: string;
}

export interface SongAdoptionPackage {
  id: string;
  method_type: 'managed_sufitube' | 'use_my_google_ads';
  package_name: string;
  description: string;
  currency: string;
  amount: number;
  estimated_impressions_min: number;
  estimated_impressions_max: number;
  duration_days: number;
  regions_targeted: string[];
  reporting_level: string;
  is_active: boolean;
  sort_order: number;
}

export interface SongAdoptionGoogleAds {
  id: string;
  adoption_id: string;
  customer_id?: string;
  billing_enabled: boolean;
  setup_help_requested: boolean;
  target_regions: string[];
  target_languages: string[];
  campaign_goal: string;
  auto_generate_copy: boolean;
  auto_generate_keywords: boolean;
  asset_suggestions: boolean;
  account_status_note?: string;
}

export interface SongAdoptionEvent {
  id: string;
  adoption_id: string;
  event_type: string;
  event_label: string;
  actor_type: 'user' | 'admin' | 'system';
  actor_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Payment {
  id: string;
  adoption_id: string;
  provider: 'stripe' | 'paypal' | 'razorpay' | 'mock';
  provider_payment_id?: string;
  amount: number;
  currency: string;
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  paid_at?: string;
}

export interface AdoptionFormData {
  // Common fields
  full_name: string;
  organization_name?: string;
  email: string;
  phone?: string;
  country: string;
  city?: string;
  adopter_type: 'individual' | 'family' | 'institution' | 'trust' | 'sponsor_circle' | 'anonymous';
  dedication_message?: string;
  sponsor_note?: string;
  public_display_mode: 'full_name' | 'initials_only' | 'organization' | 'anonymous';
  public_location_mode: 'city_country' | 'country_only' | 'hide';
  agree_to_terms: boolean;
  agree_to_promotional_use: boolean;

  // Managed by SufiTube specific
  selected_package_id?: string;
  custom_budget?: number;
  preferred_audience_region: 'local' | 'national' | 'international' | 'diaspora' | 'custom';
  campaign_objective: 'awareness' | 'devotional_reach' | 'community_engagement' | 'event_support' | 'release_launch_support';
  preferred_start_timing: 'immediate' | 'scheduled';
  special_instructions?: string;

  // Use My Google Ads specific
  google_ads_customer_id?: string;
  billing_enabled: boolean;
  setup_help_requested: boolean;
  target_regions: string[];
  target_languages: string[];
  campaign_goal: string;
  auto_generate_copy: boolean;
  auto_generate_keywords: boolean;
  asset_suggestions: boolean;
}