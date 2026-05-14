import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, X, Globe, CreditCard, CirclePlay as PlayCircle, Settings, Music, ChartBar as BarChart, Loader2, Lock, ExternalLink, Clock } from 'lucide-react';
import { SongAdoptionPackage, AdoptionFormData } from '../../../types/adoption.types';

const ADOPTION_PACKAGES: SongAdoptionPackage[] = [
  { id: 'pkg_1', method_type: 'managed_sufitube', package_name: 'Quick Boost', description: 'Short visibility push and early testing — ideal for first-time sponsors', currency: 'USD', amount: 39, estimated_impressions_min: 500, estimated_impressions_max: 3000, duration_days: 4, regions_targeted: ['Local'], reporting_level: 'Basic', is_active: true, sort_order: 1 },
  { id: 'pkg_2', method_type: 'managed_sufitube', package_name: 'Starter Reach', description: 'Focused promotional push for one kalam with community engagement', currency: 'USD', amount: 75, estimated_impressions_min: 3000, estimated_impressions_max: 10000, duration_days: 7, regions_targeted: ['Regional'], reporting_level: 'Basic', is_active: true, sort_order: 2 },
  { id: 'pkg_3', method_type: 'managed_sufitube', package_name: 'Balanced Campaign', description: 'Strong reach, better audience learning and diaspora discovery', currency: 'USD', amount: 199, estimated_impressions_min: 10000, estimated_impressions_max: 40000, duration_days: 14, regions_targeted: ['Regional', 'Diaspora'], reporting_level: 'Standard', is_active: true, sort_order: 3 },
  { id: 'pkg_4', method_type: 'managed_sufitube', package_name: 'Optimal Reach', description: 'Sustained promotion, wider discovery and stronger performance data', currency: 'USD', amount: 500, estimated_impressions_min: 50000, estimated_impressions_max: 150000, duration_days: 21, regions_targeted: ['Global'], reporting_level: 'Premium', is_active: true, sort_order: 4 },
];

const REGIONS = [
  'Global', 'South Asia', 'India', 'Pakistan',
  'United Kingdom', 'United States', 'Canada', 'Australia',
  'MENA', 'Europe', 'East Africa', 'Southeast Asia',
];

const LANGUAGES = [
  'All', 'English', 'Urdu', 'Hindi', 'Arabic',
  'Punjabi', 'Kashmiri', 'Persian', 'Bengali', 'Turkish',
];

const INTENTIONS = [
  { value: 'spiritual_reflection',  label: 'Spiritual Reflection' },
  { value: 'ramadan_sacred_season', label: 'Ramadan / Sacred Season' },
  { value: 'kashmiri_sufi_audience',label: 'Kashmiri Sufi Audience' },
  { value: 'urdu_hindi_listeners',  label: 'Urdu / Hindi Listeners' },
  { value: 'global_sufi_seekers',   label: 'Global Sufi Seekers' },
  { value: 'youth_new_listeners',   label: 'Youth & New Listeners' },
  { value: 'diaspora_outreach',     label: 'Diaspora Outreach' },
  { value: 'general_awareness',     label: 'General Awareness' },
  { value: 'memorial_dedication',   label: 'Memorial / Dedication' },
  { value: 'institutional_support', label: 'Institutional Support' },
];
import { useFormSecurity } from '../../../hooks/useFormSecurity';
import { adoptionSchema, validateSchema } from '../../../lib/validation-schemas';
import { sanitizeObject } from '../../../lib/sanitize';

interface AdoptTabProps {
  release: any;
}

export function AdoptTab({ release }: AdoptTabProps) {
  const { user } = useAuth();

  // ── Steps ────────────────────────────────────────────────────────────────
  // Both paths:         0=intro  1=intention  2=budget+targeting
  // managed_sufitube:   … 3=form  4=review  5=success
  // use_my_google_ads:  … 3=form  4=connect  5=review  6=success
  const [step, setStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<'managed_sufitube' | 'use_my_google_ads' | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<SongAdoptionPackage | null>(null);
  const packages = ADOPTION_PACKAGES;
  const [formData, setFormData] = useState<Partial<AdoptionFormData>>({
    public_display_mode: 'full_name',
    public_location_mode: 'city_country',
    agree_to_terms: false,
    agree_to_promotional_use: false,
    billing_enabled: false,
    setup_help_requested: false,
    auto_generate_copy: true,
    auto_generate_keywords: true,
    asset_suggestions: true,
    target_regions: [],
    target_languages: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<any>({});
  const [submitError, setSubmitError] = useState('');
  const [showAuthWall, setShowAuthWall] = useState(false);
  const { botCheck, setBotCheck, verifySecurity } = useFormSecurity();
  const [adoption, setAdoption] = useState<any | null>(null);

  // Google OAuth state
  const [googleAdsEnabled, setGoogleAdsEnabled] = useState<boolean | null>(null);
  const [googleAdsMissingVars, setGoogleAdsMissingVars] = useState<string[]>([]);
  const [oauthConnected, setOauthConnected] = useState(false);
  const [oauthChecked, setOauthChecked] = useState(false);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [accessibleCustomerIds, setAccessibleCustomerIds] = useState<string[]>([]);
  const [selectedGoogleCustomerId, setSelectedGoogleCustomerId] = useState('');
  const [verifiedCustomerId, setVerifiedCustomerId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [oauthLastVerified, setOauthLastVerified] = useState<string | null>(null);
  const [campaignResourceName, setCampaignResourceName] = useState<string | null>(null);
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false);
  const [isRecheckingAccounts, setIsRecheckingAccounts] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [justDetected, setJustDetected] = useState(false);
  const [enteredEmail, setEnteredEmail] = useState('');
  const [enteredCustomerId, setEnteredCustomerId] = useState('');
  const [isManualReview, setIsManualReview] = useState(false);
  const [isSubmittingManualReview, setIsSubmittingManualReview] = useState(false);
  const [verifyReasonCode, setVerifyReasonCode] = useState<string | null>(null);
  const [verifyErrorDetail, setVerifyErrorDetail] = useState<any>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [isDraftingCampaign, setIsDraftingCampaign] = useState(false);

  const stripeEnabled = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  // Custom budget modal (managed flow only)
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customModalAmount, setCustomModalAmount] = useState('');
  const [customModalError, setCustomModalError] = useState('');

  // ── Effects ───────────────────────────────────────────────────────────────


  // Check at mount whether Google Ads is configured on this server.
  // The status endpoint now returns configured/missing_vars even for unauthenticated requests.
  // If the fetch fails entirely, leave as null (show Connect button optimistically).
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/google-ads/status');
        const payload = await res.json();
        // Only mark disabled when server explicitly says not configured.
        // null = unknown (optimistic: show button); false = server said missing vars.
        setGoogleAdsEnabled(payload?.configured === false ? false : null);
        setGoogleAdsMissingVars(Array.isArray(payload?.missing_vars) ? payload.missing_vars : []);
      } catch {
        setGoogleAdsEnabled(null);
        setGoogleAdsMissingVars([]);
      }
    })();
  }, []);

  // Restore state after Google OAuth callback redirect
  // Handles both legacy (?adoption_oauth=success) and new (?step=google_ads_connected) URLs
  useEffect(() => {
    const url = new URL(window.location.href);
    const oauthResult = url.searchParams.get('adoption_oauth');
    const returnedStep = url.searchParams.get('step');
    const returnedAdoptionId = url.searchParams.get('adoption_id');
    const isOAuthReturn =
      (oauthResult === 'success' || returnedStep === 'google_ads_connected') && !!returnedAdoptionId;
    if (!isOAuthReturn) return;

    fetch(`/api/adoptions/${returnedAdoptionId}`)
      .then((r) => r.json())
      .then((saved: any) => {
        if (saved?.id) {
          setAdoption(saved);
          setSelectedMethod(saved.methodType);
          setOauthConnected(true);
          setOauthChecked(true);
          // Restore SufiPulse campaign inputs lost during OAuth redirect
          if (saved.methodType === 'use_my_google_ads') {
            setFormData(prev => ({
              ...prev,
              campaign_objective: saved.campaignIntention || saved.campaignObjective || prev.campaign_objective,
              dedication_message: saved.dedicationMessage || prev.dedication_message,
              full_name: saved.sponsorName || prev.full_name,
              email: saved.sponsorEmail || prev.email,
              country: saved.sponsorCountry || prev.country,
              city: saved.sponsorCity || prev.city,
              custom_budget: saved.amountDue || prev.custom_budget,
              target_regions: (Array.isArray(saved.targetRegions) && saved.targetRegions.length > 0)
                ? saved.targetRegions : (prev.target_regions || []),
              target_languages: (Array.isArray(saved.targetLanguages) && saved.targetLanguages.length > 0)
                ? saved.targetLanguages : (prev.target_languages || []),
            }));
          }
          // Step 4 for both: use_my_google_ads → connect/verify; managed → review
          setStep(4);

          // Restore customer ID and email pre-entered before the OAuth redirect
          const savedCid   = localStorage.getItem('sp_gads_cid');
          const savedEmail = localStorage.getItem('sp_gads_email');
          if (savedCid)   { setEnteredCustomerId(savedCid);   localStorage.removeItem('sp_gads_cid'); }
          if (savedEmail) { setEnteredEmail(savedEmail);      localStorage.removeItem('sp_gads_email'); }
        }
      })
      .catch(() => {});

    url.searchParams.delete('adoption_oauth');
    url.searchParams.delete('adoption_id');
    url.searchParams.delete('step');
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Restore adoption state when returning from login with ?adoptionId=
  useEffect(() => {
    const url = new URL(window.location.href);
    const adoptionId = url.searchParams.get('adoptionId');
    if (!adoptionId) return;

    fetch(`/api/adoptions/${adoptionId}`)
      .then(r => r.json())
      .then((saved: any) => {
        if (!saved?.id) return;
        setAdoption(saved);
        setSelectedMethod(saved.methodType);
        setFormData(prev => ({
          ...prev,
          campaign_objective: saved.campaignIntention || prev.campaign_objective,
          dedication_message: saved.dedicationMessage || prev.dedication_message,
          full_name: saved.sponsorName || prev.full_name,
          email: saved.sponsorEmail || prev.email,
          country: saved.sponsorCountry || prev.country,
          city: saved.sponsorCity || prev.city,
        }));
        const matchingPkg = ADOPTION_PACKAGES.find(p => p.amount === saved.amountDue);
        if (matchingPkg) {
          setSelectedPackage(matchingPkg);
        } else if (saved.amountDue > 0) {
          setFormData(prev => ({ ...prev, custom_budget: saved.amountDue }));
        }

        if (saved.methodType === 'use_my_google_ads') {
          // Restore Google Ads state based on what was saved in the adoption record
          if (saved.googleAdsVerificationStatus === 'verified' && saved.googleAdsCustomerId) {
            // Previously verified — jump straight to review
            setVerifiedCustomerId(saved.googleAdsCustomerId);
            setSelectedGoogleCustomerId(saved.googleAdsCustomerId);
            setStep(5);
          } else if (
            saved.adoptionStatus === 'pending_google_ads_manual_review' ||
            saved.googleAdsVerificationStatus === 'manual_review_required'
          ) {
            // Already submitted for manual review — show confirmation
            setIsManualReview(true);
            if (saved.googleAdsCustomerId) {
              setSelectedGoogleCustomerId(saved.googleAdsCustomerId);
              setEnteredCustomerId(saved.googleAdsCustomerId);
            }
            setStep(6);
          } else {
            // Needs verification — go to connect step; pre-fill customer ID if available
            if (saved.googleAdsCustomerId) setEnteredCustomerId(saved.googleAdsCustomerId);
            setStep(4);
          }
        } else {
          setStep(4); // managed_sufitube: jump to review
        }

        url.searchParams.delete('adoptionId');
        url.searchParams.delete('adopt');
        window.history.replaceState({}, '', url.toString());
      })
      .catch(() => {});
  }, []);

  // Poll OAuth + campaign status whenever we have an adoption in use_my_google_ads mode
  useEffect(() => {
    if (!adoption?.id || selectedMethod !== 'use_my_google_ads') {
      setOauthConnected(false);
      setOauthChecked(false);
      return;
    }
    setOauthChecked(false); // reset so the spinner shows while re-checking
    (async () => {
      try {
        const params = new URLSearchParams({ adoptionId: adoption.id });
        if (user?.id) params.set('userId', user.id);
        const res = await fetch(`/api/google-ads/status?${params}`);
        const payload = await res.json();
        setOauthConfigured(Boolean(payload?.configured));
        setOauthConnected(Boolean(payload?.connected));
        if (payload?.google_email) setGoogleEmail(payload.google_email);
        if (Array.isArray(payload?.accessible_customer_ids) && payload.accessible_customer_ids.length > 0) {
          setAccessibleCustomerIds(payload.accessible_customer_ids);
          const entered = formData.google_ads_customer_id?.trim();
          const match = payload.accessible_customer_ids.find(
            (cid: string) => cid.replace(/-/g, '') === entered?.replace(/-/g, '')
          );
          setSelectedGoogleCustomerId(match || payload.accessible_customer_ids[0]);
        }
        if (payload?.updated_at) setOauthLastVerified(payload.updated_at);
        if (payload?.campaign?.campaign_resource_name) {
          setCampaignResourceName(payload.campaign.campaign_resource_name);
        }
      } catch {
        setOauthConfigured(false);
        setOauthConnected(false);
      } finally {
        setOauthChecked(true);
      }
    })();
  }, [adoption?.id, selectedMethod]);

  // Explicit verification — returns true if verified, false otherwise
  const verifyManualEntry = async (rawCustomerId: string): Promise<boolean> => {
    const normalized = rawCustomerId.replace(/-/g, '');
    if (!normalized || !adoption?.id) return false;
    const formatted = normalized.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3');
    setVerifiedCustomerId(null);
    setVerifyError(null);
    setVerifyReasonCode(null);
    setVerifyErrorDetail(null);
    setIsVerifying(true);
    try {
      const res = await fetch('/api/google-ads/verify-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          adoptionId: adoption.id,
          userId: user?.id || '',
          customerId: normalized,
          enteredEmail: enteredEmail || googleEmail || '',
        }),
      });
      const data = await res.json();
      if (data.verified) {
        setVerifiedCustomerId(formatted);
        setSelectedGoogleCustomerId(formatted);
        setVerifiedAt(new Date().toISOString());
        setVerifyError(null);
        setVerifyReasonCode(data.reasonCode || 'VERIFIED_DIRECT');
        await fetch(`/api/adoptions/${adoption.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            googleAdsCustomerId: formatted,
            googleAdsVerificationStatus: 'verified',
            adoptionStatus: 'google_ads_verified',
          }),
        }).catch(() => {});
        return true;
      } else {
        const reasonCode = data.reasonCode ||
          (res.status === 401 ? 'OAUTH_TOKEN_EXPIRED' : res.ok ? 'CUSTOMER_NOT_DIRECTLY_ACCESSIBLE' : 'GOOGLE_ADS_API_CALL_FAILED');
        setVerifyError('not_verified');
        setVerifyReasonCode(reasonCode);
        setVerifyErrorDetail({
          error: data.error,
          google_ads_error: data.google_ads_error,
          connectedGoogleEmail: data.connectedGoogleEmail,
          accounts: data.accounts,
          httpStatus: res.status,
        });
        await fetch(`/api/adoptions/${adoption.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            googleAdsCustomerId: formatted,
            googleAdsVerificationStatus: 'failed',
            adoptionStatus: 'google_ads_verification_failed',
          }),
        }).catch(() => {});
        return false;
      }
    } catch {
      setVerifyError('error');
      setVerifyReasonCode('GOOGLE_ADS_API_CALL_FAILED');
      setVerifyErrorDetail({ error: 'Network error — unable to reach verification service.' });
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualReview = async () => {
    if (!adoption?.id) {
      setSubmitError('Session expired — please go back to the form and try again.');
      return;
    }
    setIsSubmittingManualReview(true);
    setSubmitError('');
    try {
      const normalized = enteredCustomerId.replace(/-/g, '');
      const formatted = /^\d{10}$/.test(normalized)
        ? normalized.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')
        : enteredCustomerId;
      const email = googleEmail || enteredEmail;

      // Persist CID so it survives page reloads (same as OAuth path)
      if (formatted) localStorage.setItem('sp_gads_cid', formatted);
      if (email)     localStorage.setItem('sp_gads_email', email);

      const patchRes = await fetch(`/api/adoptions/${adoption.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          googleAdsCustomerId: formatted,
          googleAdsVerificationStatus: 'manual_review_required',
          adoptionStatus: 'pending_google_ads_manual_review',
          paymentRoute: 'google_direct',
        }),
      });
      if (!patchRes.ok) throw new Error('Failed to save adoption');

      const crRes = await fetch('/api/google-ads/campaign-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          adoptionId: adoption.id,
          releaseId: release.id,
          releaseTitle: release.title || release.release_title,
          releaseSlug: release.slug,
          youtubeVideoId: release?.youtube_video_id || release?.youtubeId,
          methodType: 'use_my_google_ads',
          paymentRoute: 'google_direct',
          googleAdsCustomerId: formatted,
          googleEmail: email,
          budgetAmount: formData.custom_budget || adoption.amountDue || 0,
          targetRegions: formData.target_regions?.length ? formData.target_regions : ['Global'],
          targetLanguages: formData.target_languages?.length ? formData.target_languages : ['All'],
          campaignObjective: formData.campaign_objective || 'awareness',
          sponsorName: formData.full_name || adoption.sponsorName,
          sponsorEmail: formData.email || adoption.sponsorEmail || email,
          status: 'pending_manual_review',
          reviewReason: 'google_ads_auto_verification_failed',
        }),
      });
      if (!crRes.ok) {
        const errData = await crRes.json().catch(() => ({}));
        throw new Error((errData as any).error || `Failed to submit review request (${crRes.status})`);
      }

      setIsManualReview(true);
      setSelectedGoogleCustomerId(formatted);
      setVerifyError(null);
      setStep(6);
    } catch {
      setSubmitError('Could not submit for review. Please try again.');
    } finally {
      setIsSubmittingManualReview(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatCustomerId = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const successStep = selectedMethod === 'use_my_google_ads' ? 6 : 5;
  const isSuccessScreen = step === successStep;

  const getImpactPreview = (amount: number) => {
    if (isNaN(amount) || amount < 10) return null;
    if (amount < 50)  return { min: '2,000',  max: '8,000',   days: '1–5',   tier: 'Quick Boost' };
    if (amount < 100) return { min: '8,000',  max: '18,000',  days: '5–10',  tier: 'Starter Reach' };
    if (amount < 300) return { min: '18,000', max: '55,000',  days: '7–14',  tier: 'Community+' };
    return               { min: '55,000', max: '150,000', days: '14–30', tier: 'Optimal Reach' };
  };

  const resetFlow = () => {
    setStep(0); setSelectedMethod(null); setSelectedPackage(null);
    setAdoption(null); setOauthConnected(false); setOauthChecked(false);
    setOauthConfigured(false); setAccessibleCustomerIds([]); setSelectedGoogleCustomerId('');
    setVerifiedCustomerId(null); setIsVerifying(false); setVerifyError(null);
    setOauthLastVerified(null); setSubmitError(''); setShowAuthWall(false);
    setCampaignResourceName(null); setIsConnectingOAuth(false);
    setIsRecheckingAccounts(false); setVerifiedAt(null); setGoogleEmail(null); setJustDetected(false);
    setEnteredEmail(''); setEnteredCustomerId('');
    setIsManualReview(false); setIsSubmittingManualReview(false);
    setShowManualFallback(false); setIsDraftingCampaign(false);
    setFormData({
      public_display_mode: 'full_name', public_location_mode: 'city_country',
      agree_to_terms: false, agree_to_promotional_use: false, billing_enabled: false,
      setup_help_requested: false, auto_generate_copy: true, auto_generate_keywords: true,
      asset_suggestions: true, target_regions: [], target_languages: [],
    });
  };

  // Switch from use_my_google_ads to managed_sufitube while preserving sponsor info and budget.
  // Does NOT reset the form — takes user to step 3 (form already pre-populated).
  const switchToManaged = () => {
    setSelectedMethod('managed_sufitube');
    setAdoption(null); // Decouple from the use_my_google_ads draft (it stays in DB as abandoned draft)
    setOauthConnected(false);
    setOauthChecked(false);
    setOauthConfigured(false);
    setAccessibleCustomerIds([]);
    setSelectedGoogleCustomerId('');
    setVerifiedCustomerId(null);
    setIsVerifying(false);
    setVerifyError(null);
    setIsManualReview(false);
    setIsSubmittingManualReview(false);
    setSubmitError('');
    setEnteredEmail('');
    setEnteredCustomerId('');
    setShowManualFallback(false);
    setIsDraftingCampaign(false);
    // Keep formData (full_name, email, country, city, budget etc.) intact
    // Take user to the sponsor info form — already filled, they just need to continue
    setStep(3);
  };

  const startOAuth = async () => {
    if (!adoption?.id) return;
    setIsConnectingOAuth(true);
    setSubmitError('');
    if (enteredCustomerId) localStorage.setItem('sp_gads_cid', enteredCustomerId);
    if (enteredEmail)      localStorage.setItem('sp_gads_email', enteredEmail);
    try {
      const res = await fetch('/api/google-ads/oauth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adoptionId: adoption.id, userId: user?.id, returnSlug: release?.slug || '' }),
      });
      const data = await res.json();
      if (!res.ok || !data.authUrl) throw new Error(data.error || 'Could not start Google connection');
      window.location.href = data.authUrl;
    } catch (err: any) {
      setSubmitError(err.message || 'Could not start Google connection. Please try again.');
      setIsConnectingOAuth(false);
    }
  };

  const createCampaignDraft = async (cidOverride?: string) => {
    if (!adoption?.id) return;
    const cid = cidOverride || verifiedCustomerId || enteredCustomerId;
    if (!cid) return;
    setIsDraftingCampaign(true);
    try {
      await fetch('/api/google-ads/campaign-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          adoptionId: adoption.id,
          releaseId: release.id,
          userId: user?.id || '',
          youtubeVideoId: release?.youtube_video_id || release?.youtubeId || '',
          budgetAmount: formData.custom_budget || adoption.amountDue || 0,
          selectedCustomerId: cid,
        }),
      });
      await fetch(`/api/adoptions/${adoption.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          adoptionStatus: 'awaiting_user_approval',
          oauthStatus: oauthConnected ? 'connected' : 'not_connected',
        }),
      }).catch(() => {});
    } catch {
      // Non-fatal — proceed to review anyway
    } finally {
      setIsDraftingCampaign(false);
    }
  };

  const handleVerifyAndContinue = async (cidToVerify: string) => {
    const success = await verifyManualEntry(cidToVerify);
    if (success) {
      await createCampaignDraft(cidToVerify.replace(/-/g, '').replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3'));
      setStep(5);
    }
  };

  const recheckGoogleAdsAccounts = async () => {
    if (!adoption?.id) return;
    setIsRecheckingAccounts(true);
    setOauthChecked(false);
    try {
      const params = new URLSearchParams({ adoptionId: adoption.id, recheck: '1' });
      if (user?.id) params.set('userId', user.id);
      const res = await fetch(`/api/google-ads/status?${params}`);
      const payload = await res.json();
      setOauthConfigured(Boolean(payload?.configured));
      setOauthConnected(Boolean(payload?.connected));
      if (payload?.google_email) setGoogleEmail(payload.google_email);
      if (Array.isArray(payload?.accessible_customer_ids) && payload.accessible_customer_ids.length > 0) {
        setAccessibleCustomerIds(payload.accessible_customer_ids);
        setSelectedGoogleCustomerId(payload.accessible_customer_ids[0]);
        setJustDetected(true);
        setTimeout(() => setJustDetected(false), 5000);
      } else {
        setAccessibleCustomerIds([]);
      }
      if (payload?.updated_at) setOauthLastVerified(payload.updated_at);
    } catch {
      setOauthConnected(false);
    } finally {
      setOauthChecked(true);
      setIsRecheckingAccounts(false);
    }
  };

  // Window focus auto-recheck: user created a Google Ads account in another tab → auto-detect on return
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (
      step !== 4 ||
      selectedMethod !== 'use_my_google_ads' ||
      !oauthConnected ||
      !oauthChecked ||
      accessibleCustomerIds.length > 0 ||
      isRecheckingAccounts
    ) return;
    const onFocus = () => recheckGoogleAdsAccounts();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [step, selectedMethod, oauthConnected, oauthChecked, accessibleCustomerIds.length, isRecheckingAccounts]);

  const getDuration = (amount: number) => {
    if (amount < 50)  return { days: '1–5',   daily: Math.round(amount / 3) };
    if (amount < 100) return { days: '5–10',  daily: Math.round(amount / 7) };
    if (amount < 300) return { days: '7–14',  daily: Math.round(amount / 10) };
    return              { days: '14–30', daily: Math.round(amount / 20) };
  };

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleMethodSelect = (method: 'managed_sufitube' | 'use_my_google_ads') => {
    setSelectedMethod(method);
    setStep(1);
  };

  const handlePackageSelect = (pkg: SongAdoptionPackage) => {
    setSelectedPackage(pkg);
    setFormData(prev => ({ ...prev, selected_package_id: pkg.id }));
    setStep(3);
  };

  const handleCustomBudget = () => {
    setCustomModalAmount('');
    setCustomModalError('');
    setShowCustomModal(true);
  };

  const handleCustomModalConfirm = () => {
    const amount = Number(customModalAmount);
    if (!customModalAmount || isNaN(amount) || amount < 10) {
      setCustomModalError('Minimum contribution is $10');
      return;
    }
    setFormData(prev => ({ ...prev, custom_budget: amount }));
    setShowCustomModal(false);
    setStep(3);
  };

  // Creates a minimal draft adoption so we have an adoptionId for the OAuth state param.
  // Called when the user clicks "Continue to Connect Account" from the budget step.
  const handleBudgetContinue = async () => {
    if (!formData.custom_budget || formData.custom_budget < 10) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/adoptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          releaseId: release.id,
          releaseTitle: release.title || release.release_title,
          releaseSlug: release.slug,
          methodType: 'use_my_google_ads',
          campaignIntention: formData.campaign_objective || 'general_awareness',
          dedicationMessage: formData.dedication_message,
          amountDue: formData.custom_budget,
          currency: 'USD',
          adoptionStatus: 'draft',
        }),
      });
      const draft = await res.json();
      if (!res.ok) throw new Error(draft.error || 'Could not initialise adoption');
      setAdoption(draft);
      setStep(3);
    } catch (err: any) {
      setSubmitError(err.message || 'Could not initialise adoption. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    if (isDisconnecting) return;
    setIsDisconnecting(true);
    try {
      await fetch('/api/google-ads/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adoptionId: adoption?.id, userId: user?.id }),
      });
    } finally {
      setOauthConnected(false);
      setOauthChecked(true);
      setAccessibleCustomerIds([]);
      setSelectedGoogleCustomerId('');
      setVerifiedCustomerId(null);
      setVerifyError(null);
      setCampaignResourceName(null);
      setIsDisconnecting(false);
    }
  };

  const handleFormSubmit = async () => {
    if (!selectedMethod) return;
    setFieldErrors({});

    // Auth gate: require a SufiPulse account before submitting the adoption form.
    // For use_my_google_ads the draft was already created at the budget step so adoption.id
    // is available for the return URL. For managed_sufitube we create a minimal draft here
    // so the auth wall can pass adoptionId back after login for state restoration.
    if (!user) {
      if (!adoption?.id) {
        try {
          const res = await fetch('/api/adoptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              releaseId: release.id,
              releaseTitle: release.title || release.release_title,
              releaseSlug: release.slug,
              methodType: selectedMethod,
              amountDue: selectedPackage?.amount || formData.custom_budget || 0,
              currency: 'USD',
              adoptionStatus: 'draft',
            }),
          });
          if (res.ok) {
            const draft = await res.json();
            setAdoption(draft);
          }
        } catch { /* ignore — auth wall still shown without adoptionId */ }
      }
      setShowAuthWall(true);
      return;
    }

    if (!formData.agree_to_terms || !formData.agree_to_promotional_use) {
      setSubmitError('Please accept both consent checkboxes to continue.');
      return;
    }

    if (!verifySecurity()) {
      setSubmitError('Security check failed. Please refresh and try again.');
      return;
    }

    // Merge the OAuth-verified customer ID into formData before validation
    const dataToValidate = {
      ...formData,
      google_ads_customer_id: selectedGoogleCustomerId || formData.google_ads_customer_id,
    };

    const { success, data, errors } = validateSchema(adoptionSchema, dataToValidate);
    if (!success && errors) {
      const formattedErrors: any = {};
      errors.issues.forEach((issue: any) => { formattedErrors[issue.path[0]] = issue.message; });
      setFieldErrors(formattedErrors);
      const firstField = errors.issues[0]?.path[0] as string;
      if (firstField) {
        setTimeout(() => {
          const el = document.querySelector(`[name="${firstField}"]`) as HTMLElement;
          if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        }, 100);
      }
      return;
    }

    const cleanData = sanitizeObject(data as any, {
      full_name: 'text', email: 'email', country: 'text', city: 'text',
      google_ads_customer_id: 'text', dedication_message: 'text',
    });

    setIsSubmitting(true);
    try {
      let currentAdoption: any;

      // use_my_google_ads: always create a fresh draft here (OAuth/connect step comes next)
      // managed_sufitube: create adoption (may patch if one already exists from login restore)
      if (adoption?.id && selectedMethod === 'managed_sufitube') {
        const res = await fetch(`/api/adoptions/${adoption.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            adoptionStatus: 'pending_review',
            sponsorName: cleanData.full_name,
            sponsorEmail: cleanData.email,
            sponsorCountry: cleanData.country,
            sponsorCity: cleanData.city,
            adopterType: cleanData.adopter_type,
            campaignObjective: formData.campaign_objective || 'awareness',
            targetRegions: formData.target_regions?.length ? formData.target_regions : ['Global'],
            targetLanguages: formData.target_languages?.length ? formData.target_languages : ['All'],
            dedicationMessage: formData.dedication_message,
            publicDisplayMode: formData.public_display_mode,
            publicLocationMode: formData.public_location_mode,
            isAnonymous: formData.adopter_type === 'anonymous',
          }),
        });
        currentAdoption = await res.json();
        if (!res.ok) throw new Error(currentAdoption.error || 'Failed to update adoption');
      } else {
        // Create fresh adoption — for use_my_google_ads this is a draft (OAuth comes next)
        const res = await fetch('/api/adoptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            releaseId: release.id,
            releaseTitle: release.title || release.release_title,
            releaseSlug: release.slug,
            methodType: selectedMethod,
            campaignIntention: formData.campaign_objective || 'general_awareness',
            dedicationMessage: formData.dedication_message,
            campaignObjective: formData.campaign_objective || 'awareness',
            targetRegions: formData.target_regions?.length ? formData.target_regions : ['Global'],
            targetLanguages: formData.target_languages?.length ? formData.target_languages : ['All'],
            amountDue: selectedPackage?.amount || formData.custom_budget || 0,
            currency: 'USD',
            // use_my_google_ads: draft until OAuth + review; managed: pending_review immediately
            adoptionStatus: selectedMethod === 'use_my_google_ads' ? 'draft' : 'pending_review',
            sponsorName: cleanData.full_name,
            sponsorEmail: cleanData.email,
            sponsorCountry: cleanData.country,
            sponsorCity: cleanData.city,
            adopterType: cleanData.adopter_type,
            publicDisplayMode: formData.public_display_mode,
            publicLocationMode: formData.public_location_mode,
            isAnonymous: formData.adopter_type === 'anonymous',
          }),
        });
        currentAdoption = await res.json();
        if (!res.ok) throw new Error(currentAdoption.error || 'Failed to create adoption');
      }

      // Campaign request only for managed_sufitube at this point.
      // For use_my_google_ads the campaign request is sent after OAuth + review (in handlePayment).
      if (selectedMethod === 'managed_sufitube') {
        await fetch('/api/google-ads/campaign-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            adoptionId: currentAdoption.id,
            releaseId: release.id,
            releaseTitle: release.title || release.release_title,
            releaseSlug: release.slug,
            youtubeVideoId: release.youtubeId || release.youtube_video_id,
            budgetAmount: selectedPackage?.amount || formData.custom_budget,
            campaignObjective: formData.campaign_objective || 'awareness',
            targetRegions: formData.target_regions?.length ? formData.target_regions : ['Global'],
            targetLanguages: formData.target_languages?.length ? formData.target_languages : ['All'],
            methodType: selectedMethod,
            sponsorName: cleanData.full_name,
            sponsorEmail: cleanData.email,
          }),
        }).catch(() => {});
      }

      setAdoption(currentAdoption);
      // Both methods advance to step 4: use_my_google_ads → connect; managed_sufitube → review
      setStep(4);
    } catch (error) {
      console.error('Error submitting adoption:', error);
      setSubmitError('Error submitting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!adoption) return;

    // ── use_my_google_ads: no SufiPulse payment — post campaign request + advance ──
    if (selectedMethod === 'use_my_google_ads') {
      if (!selectedGoogleCustomerId || !verifiedCustomerId) {
        setSubmitError('A verified Google Ads customer ID is required. Go back to the Connect step.');
        return;
      }
      if (!formData.billing_enabled) {
        setSubmitError('Please confirm that billing is configured in your Google Ads account before submitting.');
        return;
      }
      setIsSubmitting(true);
      try {
        const budget = formData.custom_budget || adoption.amountDue || 0;
        const dur = getDuration(budget);
        const ytId = release?.youtube_video_id || release?.youtubeId || '';

        // Finalise the adoption record
        const patchRes = await fetch(`/api/adoptions/${adoption.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            paymentRoute: 'google_direct',
            googleAdsCustomerId: selectedGoogleCustomerId,
            oauthStatus: 'connected',
            adoptionStatus: 'pending_review',
            targetRegions: formData.target_regions?.length ? formData.target_regions : ['Global'],
            targetLanguages: formData.target_languages?.length ? formData.target_languages : ['All'],
            sponsorName: formData.full_name,
            sponsorEmail: formData.email,
            sponsorCountry: formData.country,
            sponsorCity: formData.city,
            adopterType: formData.adopter_type,
          }),
        });
        if (!patchRes.ok) {
          const errData = await patchRes.json().catch(() => ({}));
          throw new Error((errData as any).error || `Failed to save adoption (${patchRes.status})`);
        }

        // Post the full campaign request for admin review
        const crRes = await fetch('/api/google-ads/campaign-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            adoptionId: adoption.id,
            releaseId: release.id,
            releaseTitle: release.title || release.release_title,
            releaseSlug: release.slug,
            youtubeUrl: ytId ? `https://www.youtube.com/watch?v=${ytId}` : undefined,
            youtubeVideoId: ytId,
            methodType: 'use_my_google_ads',
            paymentRoute: 'google_direct',
            googleAdsCustomerId: selectedGoogleCustomerId,
            budgetAmount: budget,
            oauthConnected: true,
            targetRegions: formData.target_regions?.length ? formData.target_regions : ['Global'],
            targetLanguages: formData.target_languages?.length ? formData.target_languages : ['All'],
            campaignObjective: formData.campaign_objective || 'awareness',
            sponsorName: formData.full_name,
            sponsorEmail: formData.email,
            sponsorCountry: formData.country,
            sponsorCity: formData.city,
            billingReadinessConfirmed: true,
            accountVerifiedAt: verifiedAt,
            status: 'pending_review',
          }),
        });
        if (!crRes.ok) {
          const errData = await crRes.json().catch(() => ({}));
          throw new Error((errData as any).error || `Failed to submit campaign request (${crRes.status})`);
        }

        setStep(6);
      } catch (err: any) {
        setSubmitError(`Error: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ── managed_sufitube: SufiPulse Stripe checkout ───────────────────────
    const budget = selectedPackage?.amount || formData.custom_budget || adoption.amountDue || 0;

    if (budget === 0) {
      // Zero-amount (e.g. internal/override) — mark paid and advance
      await fetch(`/api/adoptions/${adoption.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentStatus: 'paid', adoptionStatus: 'campaign_preparation_requested' }),
      });
      setStep(5);
      return;
    }

    // Require login before opening Stripe
    if (!user) {
      setShowAuthWall(true);
      return;
    }

    if (!stripeEnabled) {
      setSubmitError('Payment system is currently unavailable. Please contact support.');
      return;
    }

    setIsRedirectingToStripe(true);
    try {
      const res = await fetch(`/api/adoptions/${adoption.id}/checkout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amountUSD: budget,
          releaseTitle: release?.release_title,
          sponsorName: formData.full_name,
          sponsorEmail: formData.email,
          packageName: selectedPackage?.package_name,
        }),
      });
      const body = await res.json();
      if (res.status === 401) {
        setShowAuthWall(true);
        setIsRedirectingToStripe(false);
        return;
      }
      if (!res.ok) {
        const msg = typeof body.error === 'string'
          ? body.error
          : body.error?.message || 'Checkout failed';
        throw new Error(msg);
      }
      window.location.href = body.url;
    } catch (err: any) {
      setSubmitError(`Payment error: ${err.message}`);
      setIsRedirectingToStripe(false);
    }
  };

  // ── Renderers ─────────────────────────────────────────────────────────────

  const renderIntro = () => (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center space-y-4">
        <h3 className="text-4xl md:text-5xl font-serif text-[var(--color-text-primary)] tracking-tight">
          Adopt This Song
        </h3>
        <p className="text-[var(--color-text-secondary)] text-lg leading-relaxed max-w-2xl mx-auto font-light">
          Help this kalam reach hearts that need it. Choose how you want to sponsor the spread of this piece.
        </p>
        <div className="flex items-center justify-center gap-2 text-[var(--color-text-tertiary)] text-xs uppercase tracking-[0.2em] font-medium pt-2">
          <span className="w-8 h-px bg-[var(--color-border-strong)]" />
          Professional Campaign Management
          <span className="w-8 h-px bg-[var(--color-border-strong)]" />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
        {/* ── LEFT CARD: Managed by SufiTube ── */}
        <div
          onClick={() => handleMethodSelect('managed_sufitube')}
          className="group relative flex flex-col bg-[var(--color-slate)]/40 border border-[var(--color-border-strong)] hover:border-[var(--color-gold)]/40 rounded-3xl transition-all duration-500 cursor-pointer overflow-hidden backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-gold)]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative p-10 flex flex-col h-full space-y-8">
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-gold-muted)] flex items-center justify-center border border-[var(--color-gold)]/20 group-hover:scale-110 transition-transform duration-500">
                <Music className="w-8 h-8 text-[var(--color-gold)]" />
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-gold)]/60 bg-[var(--color-gold)]/5 px-3 py-1 rounded-full border border-[var(--color-gold)]/10">
                Managed
              </span>
            </div>

            <div className="space-y-4">
              <h4 className="text-2xl font-serif text-[var(--color-text-primary)] group-hover:text-[var(--color-gold)] transition-colors duration-300">
                SufiPulse Managed
              </h4>
              <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
                The most seamless way to support. Our team handles every aspect of the campaign execution, targeting, and reporting.
              </p>
            </div>

            <ul className="space-y-3 flex-1">
              {[
                'Hassle-free setup',
                'Expert audience targeting',
                'Detailed performance reports',
                'Secure Stripe payment'
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                  <div className="w-5 h-5 rounded-full bg-[var(--color-gold)]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-[var(--color-gold)]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <button
              className="w-full py-4 bg-[var(--color-gold)] hover:bg-[var(--color-gold-hover)] text-[var(--color-midnight)] text-sm font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-[var(--color-gold)]/10 active:scale-[0.98]"
            >
              Sponsor Through SufiPulse
            </button>
          </div>
        </div>

        {/* ── RIGHT CARD: Use My Google Ads ── */}
        <div
          onClick={() => googleAdsEnabled !== false ? handleMethodSelect('use_my_google_ads') : undefined}
          className={`group relative flex flex-col bg-[var(--color-slate)]/40 border rounded-3xl transition-all duration-500 overflow-hidden backdrop-blur-sm ${
            googleAdsEnabled !== false
              ? 'border-[var(--color-border-strong)] hover:border-blue-500/40 cursor-pointer'
              : 'border-[var(--color-border-strong)]/50 opacity-60 cursor-default'
          }`}
        >
          {googleAdsEnabled !== false && (
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          )}

          <div className="relative p-10 flex flex-col h-full space-y-8">
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                <Globe className="w-8 h-8 text-blue-400" />
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-400/60 bg-blue-500/5 px-3 py-1 rounded-full border border-blue-500/10">
                Direct
              </span>
            </div>

            <div className="space-y-4">
              <h4 className={`text-2xl font-serif transition-colors duration-300 ${
                googleAdsEnabled !== false ? 'text-[var(--color-text-primary)] group-hover:text-blue-400' : 'text-[var(--color-text-tertiary)]'
              }`}>
                Google Ads Direct
              </h4>
              <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
                Connect your existing account. We provide the structure and targeting logic, while you maintain full billing control at Google.
              </p>
            </div>

            <ul className="space-y-3 flex-1">
              {[
                'Full account ownership',
                'Pay Google directly',
                'Retain performance data',
                'Transparent setup'
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-blue-400" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            {googleAdsEnabled !== false ? (
              <button
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/10 active:scale-[0.98]"
              >
                Connect Google Ads Account
              </button>
            ) : (
              <div className="bg-[var(--color-midnight)]/50 border border-[var(--color-border-strong)] rounded-2xl px-4 py-4 text-center">
                <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">
                  Google Ads integration is temporarily unavailable.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <p className="text-center text-[var(--color-text-tertiary)] text-xs max-w-md mx-auto leading-relaxed">
        Every campaign is reviewed by the SufiPulse team before launch to ensure alignment with the release's sacred purpose.
      </p>
    </div>
  );

  const renderIntention = () => (
    <div className="max-w-3xl mx-auto space-y-10 animate-in slide-in-from-right-12 duration-500">
      <div className="text-center space-y-3">
        <h3 className="text-3xl font-serif text-[var(--color-text-primary)] tracking-tight">Campaign Intention</h3>
        <p className="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto">
          What is your spiritual intention for sponsoring this kalam?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {INTENTIONS.map(({ value, label }) => {
          const selected = formData.campaign_objective === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, campaign_objective: value as AdoptionFormData['campaign_objective'] }))}
              className={`group relative text-left px-6 py-4 rounded-2xl border transition-all duration-300 ${
                selected
                  ? 'border-[var(--color-gold)] bg-[var(--color-gold-muted)] text-[var(--color-gold-bright)] ring-1 ring-[var(--color-gold)]/30'
                  : 'border-[var(--color-border-strong)] bg-[var(--color-slate)]/20 text-[var(--color-text-secondary)] hover:border-[var(--color-gold)]/30 hover:bg-[var(--color-slate)]/40 hover:text-[var(--color-text-primary)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium tracking-tight">{label}</span>
                {selected && (
                  <div className="w-5 h-5 rounded-full bg-[var(--color-gold)] flex items-center justify-center animate-in zoom-in duration-300">
                    <Check className="w-3 h-3 text-[var(--color-midnight)]" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest pl-1">
          Dedication or Intention Note
          <span className="normal-case font-normal text-[var(--color-text-tertiary)]/60">(Optional)</span>
        </label>
        <div className="relative group">
          <textarea
            value={formData.dedication_message || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, dedication_message: e.target.value }))}
            className="w-full bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] group-hover:border-[var(--color-border-strong)]/80 focus:border-[var(--color-gold)]/50 rounded-2xl px-5 py-4 text-[var(--color-text-primary)] text-sm focus:outline-none transition-all duration-300 min-h-[120px] placeholder-[var(--color-text-tertiary)]/50 resize-none shadow-inner"
            placeholder="e.g. In loving memory of… · For the seekers of the East · A gift for the community…"
          />
          <div className="absolute bottom-4 right-4 text-[10px] text-[var(--color-text-tertiary)]/40 pointer-events-none">
            Will be reviewed for appropriateness
          </div>
        </div>
      </div>

      <button
        onClick={() => setStep(2)}
        disabled={!formData.campaign_objective}
        className="group w-full py-5 bg-[var(--color-gold)] hover:bg-[var(--color-gold-hover)] disabled:bg-[var(--color-border-strong)] disabled:text-[var(--color-text-tertiary)] disabled:cursor-not-allowed text-[var(--color-midnight)] font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-[var(--color-gold)]/10 flex items-center justify-center gap-3 active:scale-[0.99]"
      >
        Continue to Budget Selection
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );

  const renderPackageSelection = () => {
    // ── use_my_google_ads: budget entry then connect ──
    if (selectedMethod === 'use_my_google_ads') {
      return (
        <div className="max-w-3xl mx-auto space-y-10 animate-in slide-in-from-right-12 duration-500">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-serif text-[var(--color-text-primary)] tracking-tight">Campaign Budget</h3>
            <p className="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto">Set your total Google Ads spend for this kalam</p>
          </div>

          <div className="bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
            <div className="p-6 border-b border-[var(--color-border-strong)] bg-[var(--color-slate)]/10">
              <div className="flex items-center gap-2 text-[var(--color-gold)] font-medium text-sm uppercase tracking-wider">
                <BarChart className="w-4 h-4" /> Reach Estimates
              </div>
            </div>
            <div className="divide-y divide-[var(--color-border-strong)]">
              {[
                { label: 'Quick Boost', sub: '1–5 days · $2–10/day', range: '$10–$49' },
                { label: 'Starter Reach', sub: '5–10 days · $5–15/day', range: '$50–$99' },
                { label: 'Balanced Campaign', sub: '7–14 days · $10–25/day · Recommended', range: '$100–$299', highlight: true },
                { label: 'Optimal Reach', sub: '14–30 days · $15–35+/day', range: '$300+' },
              ].map(({ label, sub, range, highlight }) => (
                <div key={label} className={`flex justify-between items-center px-6 py-4 transition-colors ${highlight ? 'bg-[var(--color-gold-muted)]/50' : 'hover:bg-white/[0.02]'}`}>
                  <div>
                    <div className={`text-sm font-semibold tracking-tight ${highlight ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-primary)]'}`}>
                      {label}
                      {highlight && <span className="ml-2 text-[10px] bg-[var(--color-gold)]/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Recommended</span>}
                    </div>
                    <div className="text-[var(--color-text-tertiary)] text-xs mt-0.5">{sub}</div>
                  </div>
                  <span className={`text-xs font-mono font-medium ${highlight ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-secondary)]'}`}>{range}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest pl-1">
                Total Campaign Budget <span className="text-[var(--color-text-tertiary)]/60">(USD)</span>
              </label>
              <div className="relative group">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-gold)] font-serif text-2xl select-none">$</span>
                <input
                  type="number"
                  min="10"
                  step="1"
                  value={formData.custom_budget || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_budget: Number(e.target.value) || undefined }))}
                  className={`w-full bg-[var(--color-slate)]/20 border rounded-2xl pl-12 pr-6 py-5 text-[var(--color-text-primary)] text-2xl font-serif focus:outline-none transition-all duration-300 ${
                    formData.custom_budget && formData.custom_budget < 10 ? 'border-[var(--color-error)]' : 'border-[var(--color-border-strong)] focus:border-[var(--color-gold)]/50'
                  }`}
                  placeholder="0"
                />
              </div>
              <p className="text-[10px] text-[var(--color-text-tertiary)] pl-1 leading-relaxed">
                Minimum budget is $10. Your budget goes directly to Google Ads — SufiPulse does not charge you.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest pl-1">Target Regions</label>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map(r => {
                    const sel = (formData.target_regions || []).includes(r);
                    return (
                      <button key={r} type="button" onClick={() => toggleRegion(r)}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                          sel ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-[var(--color-border-strong)] bg-[var(--color-slate)]/20 text-[var(--color-text-tertiary)] hover:border-[var(--color-text-tertiary)]/50 hover:text-[var(--color-text-secondary)]'
                        }`}
                      >{r}</button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest pl-1">Target Languages</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => {
                    const sel = (formData.target_languages || []).includes(l);
                    return (
                      <button key={l} type="button" onClick={() => toggleLanguage(l)}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                          sel ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-[var(--color-border-strong)] bg-[var(--color-slate)]/20 text-[var(--color-text-tertiary)] hover:border-[var(--color-text-tertiary)]/50 hover:text-[var(--color-text-secondary)]'
                        }`}
                      >{l}</button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(3)}
            disabled={!formData.custom_budget || formData.custom_budget < 10}
            className="group w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-[var(--color-border-strong)] disabled:text-[var(--color-text-tertiary)] disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3 active:scale-[0.99]"
          >
            Continue to Sponsor Details
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      );
    }

    // ── managed_sufitube: package cards ──
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-right-12 duration-500">
        <div className="text-center space-y-3">
          <h3 className="text-3xl md:text-4xl font-serif text-[var(--color-text-primary)] tracking-tight">Choose Your Budget</h3>
          <p className="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto">Select a sponsorship tier that aligns with your desired impact</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handlePackageSelect(pkg)}
              className="group relative flex flex-col items-stretch p-8 bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] hover:border-[var(--color-gold)]/40 rounded-3xl transition-all duration-500 text-left overflow-hidden backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-gold)]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-serif text-[var(--color-text-primary)] group-hover:text-[var(--color-gold)] transition-colors duration-300">{pkg.package_name}</h4>
                    <p className="text-[var(--color-text-secondary)] text-xs mt-1 leading-relaxed line-clamp-2">{pkg.description}</p>
                  </div>
                  <div className="text-2xl font-serif font-bold text-[var(--color-gold)]">${pkg.amount}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-[var(--color-border-strong)]/50">
                  <div className="space-y-1">
                    <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest">Est. Reach</div>
                    <div className="text-xs text-[var(--color-text-secondary)] font-medium">~{pkg.estimated_impressions_min.toLocaleString()}–{pkg.estimated_impressions_max.toLocaleString()}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest">Duration</div>
                    <div className="text-xs text-[var(--color-text-secondary)] font-medium">{pkg.duration_days} Days</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">
                  <span>{pkg.reporting_level} Reporting</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 group-hover:text-[var(--color-gold)] transition-all" />
                </div>
              </div>
            </button>
          ))}
          
          <button
            onClick={handleCustomBudget}
            className="group relative flex flex-col items-center justify-center p-8 bg-[var(--color-midnight)] border border-dashed border-[var(--color-border-strong)] hover:border-[var(--color-gold)]/40 rounded-3xl transition-all duration-500 space-y-4 min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-full bg-[var(--color-slate)]/40 flex items-center justify-center border border-[var(--color-border-strong)] group-hover:border-[var(--color-gold)]/30 transition-all">
              <Settings className="w-5 h-5 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-gold)] group-hover:rotate-90 transition-all duration-500" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-lg font-serif text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">Custom Budget</h4>
              <p className="text-[var(--color-text-tertiary)] text-xs">Specify your own sponsorship amount</p>
            </div>
          </button>
        </div>
      </div>
    );
  };

  // ── Step 4 for use_my_google_ads: Connect Google Ads ─────────────────────
  const renderGoogleConnect = () => {
    if (!adoption) return null;

    const cidNormalized = enteredCustomerId.replace(/-/g, '');
    const cidValid = /^\d{10}$/.test(cidNormalized);
    const serverConfigured = googleAdsEnabled !== false;

    // ── Loading: OAuth status poll in flight — show spinner to prevent phase flipping ──
    if (!oauthChecked && !verifiedCustomerId && !showManualFallback) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-7 h-7 text-neutral-600 animate-spin" />
          <p className="text-sm text-neutral-600">Checking connection…</p>
        </div>
      );
    }

    // ── Phase 4: Verified — ready to continue ─────────────────────────────────
    if (verifiedCustomerId) {
      return (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
          <div className="text-center">
            <h3 className="text-2xl font-medium text-neutral-100 mb-2">Google Ads Account Verified</h3>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-md mx-auto">
              Account confirmed. SufiPulse will prepare the campaign structure inside your account.
            </p>
          </div>

          <div className="bg-green-900/20 border border-green-700/40 rounded-xl px-5 py-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-300">Account Verified</p>
                <p className="text-xs text-green-500 font-mono">{verifiedCustomerId}</p>
              </div>
            </div>
            {googleEmail && (
              <p className="text-xs text-neutral-500 pl-11">Google account: {googleEmail}</p>
            )}
          </div>

          {submitError && (
            <div className="text-sm text-red-400 border border-red-700/40 bg-red-900/20 rounded-xl px-4 py-3 text-center">
              {submitError}
            </div>
          )}

          <button
            type="button"
            disabled={isDraftingCampaign}
            onClick={async () => {
              await createCampaignDraft(verifiedCustomerId);
              setStep(5);
            }}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isDraftingCampaign
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Preparing campaign draft…</>
              : <>Continue to Review <ArrowRight className="w-5 h-5" /></>}
          </button>

          <button
            type="button"
            onClick={switchToManaged}
            className="w-full py-3 border border-[var(--color-border-strong)] hover:border-[var(--color-gold)]/40 text-[var(--color-text-tertiary)] hover:text-[var(--color-gold)] text-sm font-medium rounded-xl transition-colors"
          >
            Switch to Managed by SufiTube Instead
          </button>
        </div>
      );
    }

    // ── Phase 3: OAuth connected — pick / verify account ─────────────────────
    // showManualFallback takes priority — let Phase 2 render if user clicked "Submit Manually"
    if (oauthConnected && oauthChecked && !showManualFallback) {
      const accountsToShow = accessibleCustomerIds.length > 0 ? accessibleCustomerIds : [];
      const targetCid = enteredCustomerId || (accountsToShow.length > 0 ? accountsToShow[0] : '');
      const targetNorm = targetCid.replace(/-/g, '');
      const targetValid = /^\d{10}$/.test(targetNorm);

      return (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
          <div className="text-center">
            <h3 className="text-2xl font-medium text-neutral-100 mb-2">Select Your Google Ads Account</h3>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-md mx-auto">
              Google sign-in successful. Select or confirm your Google Ads Customer ID to verify access.
            </p>
          </div>

          {/* Connected email badge */}
          {googleEmail && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] rounded-xl">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-sm text-neutral-300">Signed in as <span className="text-white font-medium">{googleEmail}</span></span>
            </div>
          )}

          {accountsToShow.length > 0 ? (
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Google Ads Account <span className="text-red-400">*</span>
              </label>
              <select
                value={enteredCustomerId || accountsToShow[0]}
                onChange={e => setEnteredCustomerId(e.target.value)}
                className="w-full bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] focus:border-blue-500/60 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none transition-colors"
              >
                {accountsToShow.map(cid => (
                  <option key={cid} value={cid}>{cid}</option>
                ))}
              </select>
              <p className="text-xs text-neutral-600 mt-1.5">{accountsToShow.length} account{accountsToShow.length > 1 ? 's' : ''} found on this Google account.</p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Google Ads Customer ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={enteredCustomerId}
                onChange={e => setEnteredCustomerId(formatCustomerId(e.target.value))}
                placeholder="xxx-xxx-xxxx"
                className="w-full bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] focus:border-blue-500/60 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-neutral-700 outline-none transition-colors"
              />
              <p className="text-xs text-neutral-600 mt-1.5">No accounts detected automatically. Enter your Customer ID manually (found in the top-right of your Google Ads dashboard).</p>
            </div>
          )}

          {verifyError && (
            <div className="text-sm text-red-400 border border-red-700/40 bg-red-900/20 rounded-xl px-4 py-3">
              <p className="font-medium mb-1">Verification failed</p>
              <p className="text-xs text-red-300/80">
                {verifyReasonCode === 'OAUTH_TOKEN_EXPIRED' && 'Your Google session expired. Please reconnect.'}
                {verifyReasonCode === 'CUSTOMER_NOT_DIRECTLY_ACCESSIBLE' && 'This account ID was not found under your Google account. Check you entered the correct Customer ID.'}
                {verifyReasonCode === 'GOOGLE_ADS_API_CALL_FAILED' && 'Could not reach the Google Ads API. Please try again.'}
                {!['OAUTH_TOKEN_EXPIRED', 'CUSTOMER_NOT_DIRECTLY_ACCESSIBLE', 'GOOGLE_ADS_API_CALL_FAILED'].includes(verifyReasonCode || '') && (verifyErrorDetail?.error || 'Verification failed. Please try a different account or submit manually.')}
              </p>
            </div>
          )}

          {submitError && (
            <div className="text-sm text-red-400 border border-red-700/40 bg-red-900/20 rounded-xl px-4 py-3 text-center">
              {submitError}
            </div>
          )}

          <button
            type="button"
            disabled={isVerifying || !targetValid}
            onClick={() => handleVerifyAndContinue(enteredCustomerId || (accountsToShow[0] ?? ''))}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isVerifying
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying account…</>
              : <><Check className="w-5 h-5" /> Verify & Continue</>}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setOauthConnected(false); setOauthChecked(false); setVerifyError(null); }}
              className="flex-1 py-3 border border-neutral-800 hover:border-neutral-600 text-neutral-500 hover:text-neutral-300 text-sm font-medium rounded-xl transition-colors"
            >
              Reconnect Google Account
            </button>
            <button
              type="button"
              onClick={() => { setShowManualFallback(true); setVerifyError(null); }}
              className="flex-1 py-3 border border-neutral-800 hover:border-neutral-600 text-neutral-500 hover:text-neutral-300 text-sm font-medium rounded-xl transition-colors"
            >
              Submit Manually Instead
            </button>
          </div>

          <button
            type="button"
            onClick={switchToManaged}
            className="w-full py-3 border border-amber-700/40 hover:border-amber-500/60 text-amber-600 hover:text-amber-400 text-sm font-medium rounded-xl transition-colors"
          >
            Switch to Managed by SufiPulse Instead
          </button>
        </div>
      );
    }

    // ── Phase 2: Manual fallback entry ────────────────────────────────────────
    if (showManualFallback || !serverConfigured) {
      return (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
          <div className="text-center">
            <h3 className="text-2xl font-medium text-neutral-100 mb-2">Enter Google Ads Details</h3>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-md mx-auto">
              SufiPulse will verify your account and set up your campaign within 24 hours.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Google account email <span className="text-neutral-600">(optional)</span>
              </label>
              <input
                type="email"
                value={enteredEmail}
                onChange={e => setEnteredEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] focus:border-blue-500/60 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-700 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Google Ads Customer ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={enteredCustomerId}
                onChange={e => setEnteredCustomerId(formatCustomerId(e.target.value))}
                placeholder="xxx-xxx-xxxx"
                className="w-full bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] focus:border-blue-500/60 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-neutral-700 outline-none transition-colors"
              />
              <p className="text-xs text-neutral-600 mt-1.5">Found in the top-right corner of your Google Ads dashboard.</p>
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-500 leading-relaxed">
            By submitting, you authorise SufiPulse to prepare a campaign structure inside your Google Ads account. You remain the account owner and pay Google directly.
          </div>

          {submitError && (
            <div className="text-sm text-red-400 border border-red-700/40 bg-red-900/20 rounded-xl px-4 py-3 text-center">
              {submitError}
            </div>
          )}

          <button
            type="button"
            disabled={isSubmittingManualReview || !cidValid}
            onClick={handleManualReview}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSubmittingManualReview
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
              : <><Check className="w-5 h-5" /> Submit for Review</>}
          </button>

          {serverConfigured && (
            <button
              type="button"
              onClick={() => setShowManualFallback(false)}
              className="w-full py-3 border border-neutral-800 hover:border-blue-500/40 text-neutral-500 hover:text-blue-400 text-sm font-medium rounded-xl transition-colors"
            >
              ← Sign in with Google instead
            </button>
          )}

          <button
            type="button"
            onClick={switchToManaged}
            className="w-full py-3 border border-[var(--color-border-strong)] hover:border-[var(--color-gold)]/40 text-[var(--color-text-tertiary)] hover:text-[var(--color-gold)] text-sm font-medium rounded-xl transition-colors"
          >
            Switch to Managed by SufiTube Instead
          </button>
        </div>
      );
    }

    // ── Phase 1 (default): Choose how to connect ─────────────────────────────
    return (
      <div className="space-y-5 animate-in slide-in-from-right-8 duration-300">
        <div className="text-center">
          <h3 className="text-2xl font-medium text-neutral-100 mb-2">Set Up Your Campaign</h3>
          <p className="text-neutral-500 text-sm leading-relaxed max-w-md mx-auto">
            Choose how you'd like to run your Google Ads campaign.
          </p>
        </div>

        {/* Option A: Enter Customer ID manually */}
        <button
          type="button"
          onClick={() => setShowManualFallback(true)}
          className="w-full text-left p-5 border border-neutral-700 hover:border-blue-500/50 bg-neutral-900 hover:bg-neutral-800/80 rounded-xl transition-colors group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-400 font-mono font-bold text-xs">ID</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-100 group-hover:text-white mb-0.5">Use My Google Ads Account</p>
              <p className="text-xs text-neutral-500 leading-relaxed">Enter your Google Ads Customer ID — our team verifies and sets up your campaign within 24 hours. You pay Google directly.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-blue-400 mt-1 flex-shrink-0 transition-colors" />
          </div>
        </button>

        {/* Option B: Switch to Managed */}
        <button
          type="button"
          onClick={switchToManaged}
          className="w-full text-left p-5 border border-amber-700/40 hover:border-amber-500/60 bg-amber-900/10 hover:bg-amber-900/20 rounded-xl transition-colors group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Music className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-300 group-hover:text-amber-200 mb-0.5">Let SufiPulse Manage Everything</p>
              <p className="text-xs text-neutral-500 leading-relaxed">Pay via Stripe — SufiPulse creates and runs the Google Ads campaign on your behalf. No Google account needed.</p>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-amber-400 mt-1 flex-shrink-0 transition-colors" />
          </div>
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800" /></div>
          <div className="relative flex justify-center text-xs text-neutral-600"><span className="bg-black px-3">or connect automatically</span></div>
        </div>

        {submitError && (
          <div className="text-sm text-red-400 border border-red-700/40 bg-red-900/20 rounded-xl px-4 py-3 text-center">
            {submitError}
          </div>
        )}

        <button
          type="button"
          disabled={isConnectingOAuth}
          onClick={startOAuth}
          className="w-full py-3 bg-white hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-3"
        >
          {isConnectingOAuth ? (
            <><Loader2 className="w-4 h-4 animate-spin text-neutral-600" /> Connecting…</>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>
        <p className="text-xs text-center text-neutral-700">Google sign-in is currently limited to approved testers while app verification is in progress.</p>
      </div>
    );
  };

  const renderForm = () => (
    <div className="max-w-3xl mx-auto space-y-12 animate-in slide-in-from-right-12 duration-500">
      <input
        type="text"
        name="_bot_check"
        value={botCheck}
        onChange={(e) => setBotCheck(e.target.value)}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />
      
      <div className="text-center space-y-3">
        <h3 className="text-3xl font-serif text-[var(--color-text-primary)] tracking-tight">Sponsor Information</h3>
        <p className="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto">Please provide your details for campaign coordination and institutional transparency</p>
      </div>

      {selectedMethod === 'use_my_google_ads' && oauthConnected && selectedGoogleCustomerId && (
        <div className="flex items-center gap-4 px-6 py-4 border border-green-800/30 bg-green-900/10 rounded-2xl animate-in fade-in duration-500">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-green-400 uppercase tracking-widest">Google Ads Connected</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">Verified Customer ID: <span className="font-mono text-[var(--color-text-primary)]">{selectedGoogleCustomerId}</span></div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest pl-1">Full Name *</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            className={`w-full bg-[var(--color-slate)]/20 border ${fieldErrors.full_name ? 'border-[var(--color-error)]' : 'border-[var(--color-border-strong)] focus:border-[var(--color-gold)]/50'} rounded-2xl px-5 py-4 text-[var(--color-text-primary)] text-sm focus:outline-none transition-all duration-300`}
            required
          />
          {fieldErrors.full_name && <p className="text-[var(--color-error)] text-[10px] pl-1 font-medium">{fieldErrors.full_name}</p>}
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest pl-1">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className={`w-full bg-[var(--color-slate)]/20 border ${fieldErrors.email ? 'border-[var(--color-error)]' : 'border-[var(--color-border-strong)] focus:border-[var(--color-gold)]/50'} rounded-2xl px-5 py-4 text-[var(--color-text-primary)] text-sm focus:outline-none transition-all duration-300`}
            required
          />
          {fieldErrors.email && <p className="text-[var(--color-error)] text-[10px] pl-1 font-medium">{fieldErrors.email}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest pl-1">Country *</label>
          <input
            type="text"
            name="country"
            value={formData.country || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            className={`w-full bg-[var(--color-slate)]/20 border ${fieldErrors.country ? 'border-[var(--color-error)]' : 'border-[var(--color-border-strong)] focus:border-[var(--color-gold)]/50'} rounded-2xl px-5 py-4 text-[var(--color-text-primary)] text-sm focus:outline-none transition-all duration-300`}
            required
          />
          {fieldErrors.country && <p className="text-[var(--color-error)] text-[10px] pl-1 font-medium">{fieldErrors.country}</p>}
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest pl-1">City</label>
          <input
            type="text"
            name="city"
            value={formData.city || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className={`w-full bg-[var(--color-slate)]/20 border ${fieldErrors.city ? 'border-[var(--color-error)]' : 'border-[var(--color-border-strong)] focus:border-[var(--color-gold)]/50'} rounded-2xl px-5 py-4 text-[var(--color-text-primary)] text-sm focus:outline-none transition-all duration-300`}
          />
          {fieldErrors.city && <p className="text-[var(--color-error)] text-[10px] pl-1 font-medium">{fieldErrors.city}</p>}
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest pl-1">Adopter Type *</label>
          <select
            name="adopter_type"
            value={formData.adopter_type || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, adopter_type: e.target.value as any }))}
            className={`w-full bg-[var(--color-slate)]/20 border ${fieldErrors.adopter_type ? 'border-[var(--color-error)]' : 'border-[var(--color-border-strong)] focus:border-[var(--color-gold)]/50'} rounded-2xl px-5 py-4 text-[var(--color-text-primary)] text-sm focus:outline-none transition-all duration-300 appearance-none`}
            required
          >
            <option value="" className="bg-[var(--color-midnight)]">Select type</option>
            <option value="individual" className="bg-[var(--color-midnight)]">Individual</option>
            <option value="family" className="bg-[var(--color-midnight)]">Family</option>
            <option value="institution" className="bg-[var(--color-midnight)]">Institution</option>
            <option value="trust" className="bg-[var(--color-midnight)]">Trust</option>
            <option value="sponsor_circle" className="bg-[var(--color-midnight)]">Sponsor Circle</option>
            <option value="anonymous" className="bg-[var(--color-midnight)]">Anonymous</option>
          </select>
          {fieldErrors.adopter_type && <p className="text-[var(--color-error)] text-[10px] pl-1 font-medium">{fieldErrors.adopter_type}</p>}
        </div>

        {selectedMethod === 'managed_sufitube' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest pl-1">Preferred Audience Region</label>
              <select
                name="preferred_audience_region"
                value={formData.preferred_audience_region || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, preferred_audience_region: e.target.value as any }))}
                className={`w-full bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] focus:border-[var(--color-gold)]/50 rounded-2xl px-5 py-4 text-[var(--color-text-primary)] text-sm focus:outline-none transition-all duration-300 appearance-none`}
              >
                <option value="local" className="bg-[var(--color-midnight)]">Local</option>
                <option value="national" className="bg-[var(--color-midnight)]">National</option>
                <option value="international" className="bg-[var(--color-midnight)]">International</option>
                <option value="diaspora" className="bg-[var(--color-midnight)]">Diaspora</option>
                <option value="custom" className="bg-[var(--color-midnight)]">Custom</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest pl-1">Campaign Objective</label>
              <select
                name="campaign_objective"
                value={formData.campaign_objective || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, campaign_objective: e.target.value as AdoptionFormData['campaign_objective'] }))}
                className={`w-full bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] focus:border-[var(--color-gold)]/50 rounded-2xl px-5 py-4 text-[var(--color-text-primary)] text-sm focus:outline-none transition-all duration-300 appearance-none`}
              >
                <option value="awareness" className="bg-[var(--color-midnight)]">Awareness</option>
                <option value="devotional_reach" className="bg-[var(--color-midnight)]">Devotional Reach</option>
                <option value="community_engagement" className="bg-[var(--color-midnight)]">Community Engagement</option>
                <option value="event_support" className="bg-[var(--color-midnight)]">Event Support</option>
                <option value="release_launch_support" className="bg-[var(--color-midnight)]">Release Launch Support</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-3.5 h-3.5 text-[var(--color-gold)]" />
          <h4 className="text-sm font-serif text-[var(--color-text-primary)]">Privacy & Governance</h4>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest pl-1">Public Display</label>
            <select
              name="public_display_mode"
              value={formData.public_display_mode || 'full_name'}
              onChange={(e) => setFormData(prev => ({ ...prev, public_display_mode: e.target.value as any }))}
              className="w-full bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] rounded-2xl px-5 py-4 text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-gold)]/50 transition-all appearance-none"
            >
              <option value="full_name" className="bg-[var(--color-midnight)]">Full Name</option>
              <option value="initials_only" className="bg-[var(--color-midnight)]">Initials Only</option>
              <option value="organization" className="bg-[var(--color-midnight)]">Organization Name</option>
              <option value="anonymous" className="bg-[var(--color-midnight)]">Anonymous</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest pl-1">Location Display</label>
            <select
              name="public_location_mode"
              value={formData.public_location_mode || 'city_country'}
              onChange={(e) => setFormData(prev => ({ ...prev, public_location_mode: e.target.value as any }))}
              className="w-full bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] rounded-2xl px-5 py-4 text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-gold)]/50 transition-all appearance-none"
            >
              <option value="city_country" className="bg-[var(--color-midnight)]">City, Country</option>
              <option value="country_only" className="bg-[var(--color-midnight)]">Country Only</option>
              <option value="hide" className="bg-[var(--color-midnight)]">Hide Location</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-[var(--color-border-strong)]">
          <label className="flex items-start gap-4 group cursor-pointer">
            <div className="mt-1 relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={formData.agree_to_terms || false}
                onChange={(e) => setFormData(prev => ({ ...prev, agree_to_terms: e.target.checked }))}
                className="w-5 h-5 rounded-lg border-[var(--color-border-strong)] bg-[var(--color-slate)]/40 text-[var(--color-gold)] focus:ring-[var(--color-gold)]/20 transition-all cursor-pointer"
                required
              />
            </div>
            <span className="text-xs text-[var(--color-text-secondary)] leading-relaxed group-hover:text-[var(--color-text-primary)] transition-colors">
              I agree to the SufiPulse Sponsorship Terms and Privacy Policy. I understand that all campaigns are subject to institutional review.
            </span>
          </label>
          <label className="flex items-start gap-4 group cursor-pointer">
            <div className="mt-1 relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={formData.agree_to_promotional_use || false}
                onChange={(e) => setFormData(prev => ({ ...prev, agree_to_promotional_use: e.target.checked }))}
                className="w-5 h-5 rounded-lg border-[var(--color-border-strong)] bg-[var(--color-slate)]/40 text-[var(--color-gold)] focus:ring-[var(--color-gold)]/20 transition-all cursor-pointer"
                required
              />
            </div>
            <span className="text-xs text-[var(--color-text-secondary)] leading-relaxed group-hover:text-[var(--color-text-primary)] transition-colors">
              I agree to the respectful public mention of my sponsorship in accordance with my privacy settings chosen above.
            </span>
          </label>
        </div>
      </div>

      {submitError && (
        <div className="text-sm text-[var(--color-error)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 rounded-2xl px-5 py-4 text-center animate-in shake duration-500">
          {submitError}
        </div>
      )}

      <button
        onClick={() => { setSubmitError(''); handleFormSubmit(); }}
        disabled={isSubmitting || !formData.agree_to_terms || !formData.agree_to_promotional_use}
        className={`group w-full py-5 font-bold rounded-2xl transition-all duration-500 shadow-xl flex items-center justify-center gap-3 active:scale-[0.99] ${
          selectedMethod === 'use_my_google_ads'
            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/10'
            : 'bg-[var(--color-gold)] hover:bg-[var(--color-gold-hover)] text-[var(--color-midnight)] shadow-[var(--color-gold)]/10'
        } disabled:bg-[var(--color-border-strong)] disabled:text-[var(--color-text-tertiary)] disabled:cursor-not-allowed`}
      >
        {isSubmitting ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Finalising Details…</>
        ) : (
          <>
            {selectedMethod === 'use_my_google_ads' ? 'Continue to Google Ads Connection' : 'Continue to Final Review'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </div>
  );

  const renderReview = () => {
    const budget = selectedPackage?.amount || formData.custom_budget || adoption?.amountDue || 0;
    const impact = getImpactPreview(budget);
    const dur = getDuration(budget);
    const ytId = (release?.youtube_video_id || release?.youtubeId || '') as string;

    // ── use_my_google_ads: full campaign review ──────────────────────────────
    if (selectedMethod === 'use_my_google_ads') {
      const regions = formData.target_regions?.length ? formData.target_regions : ['Global'];
      const languages = formData.target_languages?.length ? formData.target_languages : ['All'];
      const canSubmit = !isSubmitting && !!selectedGoogleCustomerId && !!verifiedCustomerId && !!formData.billing_enabled;

      return (
        <div className="max-w-2xl mx-auto space-y-10 animate-in slide-in-from-right-12 duration-500">
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-serif text-[var(--color-text-primary)] tracking-tight">Review Campaign Request</h3>
            <p className="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto">Confirm all details before submitting to SufiPulse for institutional review</p>
          </div>

          <div className="bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
            <div className="p-6 border-b border-[var(--color-border-strong)] bg-[var(--color-slate)]/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-gold-muted)] flex items-center justify-center">
                <Music className="w-4 h-4 text-[var(--color-gold)]" />
              </div>
              <span className="text-sm font-serif text-[var(--color-text-primary)] truncate">{release?.release_title || 'Sacred Kalam'}</span>
            </div>
            
            <div className="divide-y divide-[var(--color-border-strong)]/50">
              <div className="grid grid-cols-2">
                <div className="p-6 space-y-1 border-r border-[var(--color-border-strong)]/50">
                  <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Total Budget</div>
                  <div className="text-2xl font-serif text-[var(--color-gold)] font-bold">${budget}</div>
                </div>
                <div className="p-6 space-y-1">
                  <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Duration</div>
                  <div className="text-lg font-serif text-[var(--color-text-primary)]">{dur.days} Days <span className="text-[var(--color-text-tertiary)] text-xs font-sans">(~${dur.daily}/day)</span></div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Targeting</div>
                    <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{regions.join(', ')}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Languages</div>
                    <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{languages.join(', ')}</div>
                  </div>
                </div>
                <div className="space-y-1 pt-2">
                  <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Campaign Objective</div>
                  <div className="text-xs text-[var(--color-text-primary)] font-medium capitalize">{(formData.campaign_objective || 'awareness').replace(/_/g, ' ')}</div>
                </div>
              </div>

              <div className="p-6 space-y-4 bg-[var(--color-midnight)]/30">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Sponsor Account</div>
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{formData.full_name} <span className="text-[var(--color-text-tertiary)] text-[10px] font-normal font-mono ml-2">{formData.email}</span></div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Google Ads Account</div>
                    {selectedGoogleCustomerId ? (
                      <div className="flex items-center justify-end gap-1.5 text-blue-400 font-mono text-xs">
                        <Check className="w-3.5 h-3.5" /> {selectedGoogleCustomerId}
                      </div>
                    ) : (
                      <div className="text-[var(--color-error)] text-[10px]">Verification Pending</div>
                    )}
                  </div>
                </div>
                {formData.dedication_message && (
                  <div className="pt-2 border-t border-[var(--color-border-strong)]/30">
                    <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold mb-1.5">Spiritual Dedication</div>
                    <p className="text-xs italic text-[var(--color-text-secondary)] leading-relaxed font-light">"{formData.dedication_message}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-900/10 border border-blue-800/30 rounded-2xl p-6">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="mt-1 relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={formData.billing_enabled || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, billing_enabled: e.target.checked }))}
                    className="w-5 h-5 rounded-lg border-blue-800/50 bg-blue-900/20 text-blue-500 focus:ring-blue-500/20 transition-all cursor-pointer"
                  />
                </div>
                <span className="text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors leading-relaxed">
                  I confirm this Google Ads account has active billing configured. SufiPulse will not charge me; Google will bill my account directly after campaign launch.
                </span>
              </label>
            </div>

            {submitError && (
              <div className="text-sm text-[var(--color-error)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 rounded-2xl px-5 py-4 text-center animate-in shake duration-500">
                {submitError}
              </div>
            )}

            <button
              onClick={() => { setSubmitError(''); handlePayment(); }}
              disabled={!canSubmit}
              className="group w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-[var(--color-border-strong)] disabled:text-[var(--color-text-tertiary)] disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3 active:scale-[0.99]"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Submitting Request…</>
              ) : (
                <>
                  Submit Campaign Request
                  <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
            
            <button onClick={() => setStep(4)} className="w-full text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors text-xs uppercase tracking-widest font-bold py-2">
              ← Back to verification
            </button>
          </div>
        </div>
      );
    }

    // ── managed_sufitube ─────────────────────────────────────────────────────
    return (
      <div className="max-w-2xl mx-auto space-y-10 animate-in slide-in-from-right-12 duration-500">
        <div className="text-center space-y-3">
          <h3 className="text-3xl font-serif text-[var(--color-text-primary)] tracking-tight">Review Sponsorship</h3>
          <p className="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto">Please confirm your sponsorship details before proceeding to secure payment</p>
        </div>

        <div className="bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
          <div className="p-6 border-b border-[var(--color-border-strong)] bg-[var(--color-slate)]/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-gold-muted)] flex items-center justify-center">
              <Music className="w-4 h-4 text-[var(--color-gold)]" />
            </div>
            <span className="text-sm font-serif text-[var(--color-text-primary)] truncate">{release?.release_title || 'Sacred Kalam'}</span>
          </div>

          <div className="divide-y divide-[var(--color-border-strong)]/50">
            <div className="grid grid-cols-2">
              <div className="p-8 space-y-1 border-r border-[var(--color-border-strong)]/50">
                <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Total Contribution</div>
                <div className="text-3xl font-serif text-[var(--color-gold)] font-bold">${budget}</div>
              </div>
              <div className="p-8 space-y-2">
                <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Impact Tier</div>
                <div className="text-lg font-serif text-[var(--color-text-primary)]">{impact?.tier || 'Custom'}</div>
                <div className="text-[10px] bg-[var(--color-gold)]/5 text-[var(--color-gold)] px-2 py-0.5 rounded-full inline-block border border-[var(--color-gold)]/10 uppercase tracking-widest font-bold">SufiPulse Managed</div>
              </div>
            </div>

            {impact && (
              <div className="p-6 grid grid-cols-2 gap-8 bg-[var(--color-midnight)]/20">
                <div className="space-y-1">
                  <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Est. Reach</div>
                  <div className="text-sm font-medium text-[var(--color-text-secondary)]">~{impact.min} – {impact.max} <span className="text-[var(--color-text-tertiary)] text-[10px] uppercase ml-1">Impressions</span></div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Duration</div>
                  <div className="text-sm font-medium text-[var(--color-text-secondary)]">{impact.days} <span className="text-[var(--color-text-tertiary)] text-[10px] uppercase ml-1">Days</span></div>
                </div>
              </div>
            )}

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Sponsor Details</div>
                  <div className="text-sm font-medium text-[var(--color-text-primary)]">{formData.full_name}</div>
                  <div className="text-[10px] text-[var(--color-text-tertiary)] font-mono">{formData.email}</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Location</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">{formData.city}, {formData.country}</div>
                </div>
              </div>
              {formData.dedication_message && (
                <div className="pt-2 border-t border-[var(--color-border-strong)]/30">
                  <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold mb-1.5">Spiritual Dedication</div>
                  <p className="text-xs italic text-[var(--color-text-secondary)] leading-relaxed font-light">"{formData.dedication_message}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {submitError && !showAuthWall && (
          <div className="text-sm text-[var(--color-error)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 rounded-2xl px-5 py-4 text-center animate-in shake duration-500">
            {submitError}
          </div>
        )}

        {showAuthWall ? (() => {
          const returnUrl = new URL(window.location.href);
          returnUrl.searchParams.set('adopt', '1');
          if (adoption?.id) returnUrl.searchParams.set('adoptionId', adoption.id);
          const returnTo = encodeURIComponent(returnUrl.pathname + returnUrl.search);
          return (
            <div className="bg-[var(--color-slate)]/40 border border-[var(--color-gold)]/20 rounded-3xl p-8 space-y-6 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-[var(--color-gold)]/5 border border-[var(--color-gold)]/20 rounded-2xl flex items-center justify-center mb-2">
                  <Lock className="w-8 h-8 text-[var(--color-gold)]" />
                </div>
                <h4 className="text-xl font-serif text-[var(--color-text-primary)]">Sign in to continue</h4>
                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed max-w-sm mx-auto">A SufiPulse account is required to adopt a song. Your sponsorship details have been safely saved.</p>
              </div>
              <div className="grid gap-3 pt-2">
                <a href={`/login?returnTo=${returnTo}`} className="block w-full py-4 bg-[var(--color-gold)] hover:bg-[var(--color-gold-hover)] text-[var(--color-midnight)] text-center font-bold rounded-2xl transition-all shadow-lg shadow-[var(--color-gold)]/10">Sign In to Continue</a>
                <a href={`/register?returnTo=${returnTo}`} className="block w-full py-4 bg-[var(--color-slate)]/40 border border-[var(--color-border-strong)] hover:border-[var(--color-border-strong)]/80 text-[var(--color-text-primary)] text-center font-bold rounded-2xl transition-all">Create Account</a>
              </div>
            </div>
          );
        })() : (
          <div className="space-y-4">
            <button
              onClick={() => { setSubmitError(''); handlePayment(); }}
              disabled={isRedirectingToStripe || !stripeEnabled}
              className="group w-full py-5 bg-[var(--color-gold)] hover:bg-[var(--color-gold-hover)] disabled:bg-[var(--color-border-strong)] disabled:text-[var(--color-text-tertiary)] disabled:cursor-not-allowed text-[var(--color-midnight)] font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-[var(--color-gold)]/10 flex items-center justify-center gap-3 active:scale-[0.99]"
            >
              {isRedirectingToStripe ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Preparing Payment…</>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Confirm & Pay with Card
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-4 text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-widest font-bold">
              <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> SSL Secure</span>
              <span className="w-1 h-1 bg-[var(--color-border-strong)] rounded-full" />
              <span>Powered by Stripe</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSuccess = () => {
    const StatusDot = ({ done, active }: { done?: boolean; active?: boolean }) => (
      <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${done ? 'bg-green-500/20 border border-green-500/40' : active ? 'bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30' : 'bg-[var(--color-slate)] border border-[var(--color-border-strong)]'}`}>
        {done ? <Check className="w-3 h-3 text-green-400" /> : active ? <Loader2 className="w-3 h-3 text-[var(--color-gold)] animate-spin" /> : <div className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)]" />}
      </div>
    );

    // ── use_my_google_ads ─────────────────────────────────────────────────────
    if (selectedMethod === 'use_my_google_ads') {
      const budget = formData.custom_budget || adoption?.amountDue || 0;
      const dur = getDuration(budget);
      const regions = formData.target_regions?.length ? formData.target_regions : ['Global'];
      const languages = formData.target_languages?.length ? formData.target_languages : ['All'];
      const ytId = release?.youtube_video_id || release?.youtubeId || '';
      const displayCid = selectedGoogleCustomerId || enteredCustomerId || '—';
      const isViaOAuth = oauthConnected && !!verifiedCustomerId;

      const pathBSteps = [
        { label: 'Request Submitted', done: true },
        { label: 'Google Account Linked', done: isViaOAuth || isManualReview },
        { label: 'Account Verification', done: !!verifiedCustomerId || isManualReview },
        { label: 'Campaign Preparation', done: !!verifiedCustomerId, active: isManualReview },
        { label: 'Awaiting User Approval', done: false, active: !!verifiedCustomerId },
        { label: 'Campaign Launched', done: false },
        { label: 'Performance Monitoring', done: false },
        { label: 'Campaign Complete', done: false },
        { label: 'Impact Report Ready', done: false },
      ];

      return (
        <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="text-center space-y-6">
            <div className={`w-24 h-24 mx-auto ${isManualReview ? 'bg-[var(--color-gold)]/5 border border-[var(--color-gold)]/20' : 'bg-green-500/5 border border-green-500/20'} rounded-3xl flex items-center justify-center rotate-12`}>
              {isManualReview ? <Clock className="w-10 h-10 text-[var(--color-gold)] -rotate-12" /> : <Check className="w-10 h-10 text-green-500 -rotate-12" />}
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-serif text-[var(--color-text-primary)]">
                {isManualReview ? 'Request Submitted for Review' : 'Campaign Draft Ready'}
              </h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed max-w-md mx-auto">
                {isManualReview
                  ? 'SufiPulse will verify your Google Ads account and prepare the campaign structure. You will be notified via email within 24 hours.'
                  : 'SufiPulse has prepared the campaign structure inside your Google Ads account. Please sign in to your dashboard to review and approve the launch.'}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] border-b border-[var(--color-border-strong)] pb-3">
                  <span>Campaign Timeline</span>
                  <span className="text-[var(--color-gold)]">Path Direct</span>
                </div>
                <div className="space-y-3.5">
                  {pathBSteps.map(({ label, done, active }) => (
                    <div key={label} className="flex items-center gap-3">
                      <StatusDot done={done} active={active} />
                      <span className={`text-[11px] font-bold uppercase tracking-wide ${done ? 'text-[var(--color-text-primary)]' : active ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-tertiary)]'}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border-strong)]">
                <div className="p-5 flex justify-between items-center bg-[var(--color-slate)]/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">Reference ID</span>
                  <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">{adoption?.id?.slice(-12).toUpperCase()}</span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--color-text-tertiary)]">Budget</span>
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">${budget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--color-text-tertiary)]">Account ID</span>
                    <span className="text-xs font-mono text-blue-400">{displayCid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--color-text-tertiary)]">Status</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-gold)]">{isManualReview ? 'Manual Review' : 'Draft Prepared'}</span>
                  </div>
                </div>
                <div className="p-5">
                   <a href="/user/adoptions" className="flex items-center justify-between group">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-gold)]">View Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-[var(--color-gold)] group-hover:translate-x-1 transition-transform" />
                   </a>
                </div>
              </div>
              
              <div className="bg-[var(--color-midnight)] border border-[var(--color-border-strong)] rounded-2xl p-5">
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed italic">
                  {isManualReview 
                    ? "Our team is manually verifying your account connection. This usually takes 2 to 6 hours during institutional business days."
                    : "Your campaign is now waiting in your Google Ads account. No spend will occur until you explicitly click 'Launch' in your Google dashboard."}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border-strong)] flex justify-center">
            <button onClick={resetFlow} className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors">
              Finish and Close
            </button>
          </div>
        </div>
      );
    }

    // ── managed_sufitube ──────────────────────────────────────────────────────
    const pathASteps = [
      { label: 'Request Submitted', done: true },
      { label: 'Payment Received', done: adoption?.paymentStatus === 'paid', active: adoption?.paymentStatus === 'pending' },
      { label: 'Campaign Engineering', done: false, active: adoption?.paymentStatus === 'paid' },
      { label: 'Campaign Live', done: false },
      { label: 'Impact Monitoring', done: false },
      { label: 'Goal Reached', done: false },
      { label: 'Final Impact Report', done: false },
    ];

    return (
      <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-green-500/5 border border-green-500/20 rounded-3xl flex items-center justify-center rotate-12">
            <Check className="w-10 h-10 text-green-500 -rotate-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-4xl font-serif text-[var(--color-text-primary)]">Sponsorship Complete</h3>
            <p className="text-[var(--color-text-secondary)] text-lg leading-relaxed max-w-md mx-auto font-light">
              May your contribution bring ease and contemplation to every soul that discovers this sacred kalam.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] rounded-2xl p-8 space-y-6">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] border-b border-[var(--color-border-strong)] pb-4">
              <span>Sponsorship Path</span>
              <span className="text-[var(--color-gold)]">Managed by SufiPulse</span>
            </div>
            <div className="space-y-4">
              {pathASteps.map(({ label, done, active }) => (
                <div key={label} className="flex items-center gap-3">
                  <StatusDot done={done} active={active} />
                  <span className={`text-[11px] font-bold uppercase tracking-wide ${done ? 'text-[var(--color-text-primary)]' : active ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-tertiary)]'}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-[var(--color-midnight)] border border-[var(--color-border-strong)] rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="space-y-1">
                <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Contribution</div>
                <div className="text-2xl font-serif text-[var(--color-gold)] font-bold">${adoption?.amountDue || 0} <span className="text-xs font-sans text-[var(--color-text-secondary)] ml-1">USD</span></div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border-strong)]">
                <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Status</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${adoption?.paymentStatus === 'paid' ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'}`}>
                  {adoption?.paymentStatus === 'paid' ? 'Received' : 'Processing'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Ref ID</span>
                <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">{adoption?.id?.slice(-12).toUpperCase()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] text-center">Help Spread the Message</p>
              <div className="flex gap-2">
                <button className="flex-1 py-3 bg-[var(--color-slate)]/40 border border-[var(--color-border-strong)] hover:border-[var(--color-text-primary)] rounded-xl text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all flex items-center justify-center gap-2">
                   X Share
                </button>
                <button className="flex-1 py-3 bg-[var(--color-slate)]/40 border border-[var(--color-border-strong)] hover:border-[var(--color-text-primary)] rounded-xl text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all flex items-center justify-center gap-2">
                   WhatsApp
                </button>
              </div>
            </div>
            
            <a href="/user/adoptions" className="block w-full py-4 border border-[var(--color-gold)]/20 hover:border-[var(--color-gold)]/50 text-[var(--color-gold)] text-center text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl transition-all">
              Return to Your Adoptions
            </a>
          </div>
        </div>
      </div>
    );
  };

  // ── Custom Budget Modal (managed flow) ────────────────────────────────────
  const customModalImpact = getImpactPreview(Number(customModalAmount));
  const CUSTOM_PRESETS = [25, 50, 100, 250];

  // ── Step routing (method-aware) ───────────────────────────────────────────
  const getStepContent = () => {
    if (step === 0) return renderIntro();
    if (step === 1) return renderIntention();
    if (step === 2) return renderPackageSelection();
    if (selectedMethod === 'use_my_google_ads') {
      if (step === 3) return renderForm();
      if (step === 4) return renderGoogleConnect();
      if (step === 5) return renderReview();
      if (step === 6) return renderSuccess();
    } else {
      if (step === 3) return renderForm();
      if (step === 4) return renderReview();
      if (step === 5) return renderSuccess();
    }
    return null;
  };

  return (
    <>
      {/* ── Custom Budget Modal ── */}
      {showCustomModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCustomModal(false); }}
        >
          <div className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-xl font-serif font-semibold text-neutral-100">Set Your Custom Contribution</h3>
              <button onClick={() => setShowCustomModal(false)} className="text-neutral-500 hover:text-neutral-300 transition-colors ml-4 mt-0.5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-neutral-500 mb-6">Support this release with a budget that reflects your intent. Minimum $10.</p>

            <div className="flex gap-2 mb-5">
              {CUSTOM_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setCustomModalAmount(String(p)); setCustomModalError(''); }}
                  className={[
                    'flex-1 py-2 rounded-lg border text-sm font-semibold transition-all duration-150',
                    customModalAmount === String(p)
                      ? 'border-[#C8A75E] bg-[#C8A75E]/10 text-[#C8A75E]'
                      : 'border-white/10 text-neutral-400 hover:border-[#C8A75E]/50 hover:text-[#C8A75E]',
                  ].join(' ')}
                >${p}</button>
              ))}
            </div>

            <div className="mb-2">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium select-none">$</span>
                <input
                  type="number" min="10" step="1" autoFocus
                  placeholder="Enter amount"
                  value={customModalAmount}
                  onChange={(e) => { setCustomModalAmount(e.target.value); setCustomModalError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCustomModalConfirm(); }}
                  className={[
                    'w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border text-white text-lg font-medium placeholder:text-neutral-600 focus:outline-none transition-colors',
                    customModalError ? 'border-red-500' : 'border-white/10 focus:border-[#C8A75E]',
                  ].join(' ')}
                />
              </div>
              {customModalError && <p className="text-xs text-red-400 mt-1.5 pl-1">{customModalError}</p>}
            </div>

            {customModalImpact ? (
              <div className="mt-4 mb-6 rounded-xl border border-[#C8A75E]/20 bg-[#C8A75E]/5 px-5 py-4 space-y-2">
                <div className="text-xs text-[#C8A75E] uppercase tracking-wider font-semibold mb-3">Estimated Reach</div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Impressions</span>
                  <span className="text-neutral-200 font-medium">~{customModalImpact.min} – {customModalImpact.max}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Duration</span>
                  <span className="text-neutral-200 font-medium">{customModalImpact.days} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Visibility Tier</span>
                  <span className="text-[#C8A75E] font-semibold">{customModalImpact.tier}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 mb-6 h-[108px] rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center">
                <span className="text-xs text-neutral-600">Enter an amount to see estimated reach</span>
              </div>
            )}

            <p className="text-xs text-neutral-600 text-center mb-5 flex items-center justify-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Secure payment powered by Stripe
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-neutral-400 hover:text-neutral-200 hover:border-white/20 text-sm font-medium transition-colors"
              >Cancel</button>
              <button
                type="button"
                onClick={handleCustomModalConfirm}
                disabled={!customModalAmount}
                className="flex-[2] py-3 rounded-xl bg-[#C8A75E] hover:bg-[#D4B76D] disabled:opacity-40 disabled:cursor-not-allowed text-[#0F172A] font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                Continue to Secure Payment <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-8 min-h-[500px]">
        <div className="bg-[var(--color-slate)]/10 border border-[var(--color-border-strong)] rounded-3xl p-6 sm:p-12 relative overflow-hidden backdrop-blur-sm shadow-2xl">
          {/* ── Progress Bar ── */}
          {step > 0 && !isSuccessScreen && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-border-strong)]/30">
              <div 
                className="h-full bg-gradient-to-r from-[var(--color-gold-muted)] to-[var(--color-gold)] transition-all duration-700 ease-out"
                style={{ width: `${(step / (selectedMethod === 'use_my_google_ads' ? 5 : 4)) * 100}%` }}
              />
            </div>
          )}

          {step > 0 && !isSuccessScreen && (
            <div className="absolute top-4 left-0 right-0 px-8 flex justify-between items-center z-10">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] flex items-center gap-2">
                <span className="text-[var(--color-gold)]">Step {step}</span>
                <span className="w-1 h-1 bg-[var(--color-border-strong)] rounded-full" />
                <span>{selectedMethod === 'use_my_google_ads' ? 5 : 4} Total</span>
              </div>
              <button 
                onClick={resetFlow} 
                className="w-8 h-8 rounded-full bg-[var(--color-slate)]/40 border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-gold)]/40 transition-all group"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          )}

          {step > 0 && !isSuccessScreen && <div className="h-12" />}

          {getStepContent()}
        </div>
      </div>
    </>
  );
}
