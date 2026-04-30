import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, X, Globe, CreditCard, CirclePlay as PlayCircle, Settings, Music, ChartBar as BarChart, Loader2, Lock, ExternalLink, Clock } from 'lucide-react';
import { SongAdoptionPackage, AdoptionFormData } from '../../../types/adoption.types';

const ADOPTION_PACKAGES: SongAdoptionPackage[] = [
  { id: 'pkg_1', method_type: 'managed_sufitube', package_name: 'Quick Boost', description: 'Short visibility push and early testing — ideal for first-time sponsors', currency: 'USD', amount: 39, estimated_impressions_min: 500, estimated_impressions_max: 3000, duration_days: 4, regions_targeted: ['Local'], reporting_level: 'Basic', is_active: true, sort_order: 1 },
  { id: 'pkg_2', method_type: 'managed_sufitube', package_name: 'Starter Reach', description: 'Focused promotional push for one kalam with community engagement', currency: 'USD', amount: 75, estimated_impressions_min: 3000, estimated_impressions_max: 10000, duration_days: 7, regions_targeted: ['Regional'], reporting_level: 'Basic', is_active: true, sort_order: 2 },
  { id: 'pkg_3', method_type: 'managed_sufitube', package_name: 'Balanced Campaign', description: 'Stronger reach, better audience learning and diaspora discovery', currency: 'USD', amount: 199, estimated_impressions_min: 10000, estimated_impressions_max: 40000, duration_days: 14, regions_targeted: ['Regional', 'Diaspora'], reporting_level: 'Standard', is_active: true, sort_order: 3 },
  { id: 'pkg_4', method_type: 'managed_sufitube', package_name: 'Optimal Reach', description: 'Sustained promotion, wider discovery and stronger performance data', currency: 'USD', amount: 500, estimated_impressions_min: 50000, estimated_impressions_max: 150000, duration_days: 21, regions_targeted: ['Global'], reporting_level: 'Premium', is_active: true, sort_order: 4 },
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

  // Explicit verification — called when user clicks "Verify Google Ads Account"
  const verifyManualEntry = async (rawCustomerId: string) => {
    const normalized = rawCustomerId.replace(/-/g, '');
    if (!normalized || !adoption?.id) return;
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
        fetch(`/api/adoptions/${adoption.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            googleAdsCustomerId: formatted,
            googleAdsVerificationStatus: 'verified',
            adoptionStatus: 'google_ads_verified',
          }),
        }).catch(() => {});
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
        fetch(`/api/adoptions/${adoption.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            googleAdsCustomerId: formatted,
            googleAdsVerificationStatus: 'failed',
            adoptionStatus: 'google_ads_verification_failed',
          }),
        }).catch(() => {});
      }
    } catch {
      setVerifyError('error');
      setVerifyReasonCode('GOOGLE_ADS_API_CALL_FAILED');
      setVerifyErrorDetail({ error: 'Network error — unable to reach verification service.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualReview = async () => {
    if (!adoption?.id) return;
    setIsSubmittingManualReview(true);
    setSubmitError('');
    try {
      const normalized = enteredCustomerId.replace(/-/g, '');
      const formatted = /^\d{10}$/.test(normalized)
        ? normalized.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')
        : enteredCustomerId;
      const email = googleEmail || enteredEmail;

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

      await fetch('/api/google-ads/campaign-requests', {
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
    // Keep formData (full_name, email, country, city, budget etc.) intact
    // Take user to the sponsor info form — already filled, they just need to continue
    setStep(3);
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
        body: JSON.stringify({ paymentStatus: 'paid', adoptionStatus: 'admin_review' }),
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
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center">
        <h3 className="text-3xl font-serif font-light text-neutral-100 mb-3">Adopt This Song</h3>
        <p className="text-neutral-400 text-base leading-relaxed max-w-lg mx-auto">
          Help this kalam reach hearts that need it. Choose how you want to sponsor the spread of this piece.
        </p>
        <p className="text-neutral-600 text-sm leading-relaxed max-w-md mx-auto mt-2">
          Every campaign is reviewed before launch to ensure the message, audience, and budget remain aligned with the purpose of the release.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* ── LEFT CARD: Managed by SufiTube ── */}
        <div
          onClick={() => handleMethodSelect('managed_sufitube')}
          className="flex flex-col bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 rounded-2xl transition-all duration-200 cursor-pointer group select-none"
        >
          {/* Logo */}
          <div className="flex flex-col items-center pt-9 pb-5 px-8">
            <div className="h-14 flex items-center justify-center mb-3">
              <img
                src="/sufitube-logo-v5.png"
                alt="SufiTube"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = e.currentTarget.parentElement?.querySelector('[data-fallback]') as HTMLElement | null;
                  if (fb) fb.style.display = 'flex';
                }}
              />
              <div
                data-fallback=""
                style={{ display: 'none' }}
                className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 items-center justify-center"
              >
                <svg width="22" height="22" viewBox="0 0 27 27" fill="none" aria-hidden="true">
                  <path d="M10.5 7.5L22 13.5L10.5 19.5V7.5Z" fill="#C8A75E"/>
                  <path d="M3 22Q5.5 19.5 8 22Q10.5 24.5 13 22Q15.5 19.5 18 22Q20.5 24.5 23 22" stroke="#C8A75E" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
                </svg>
              </div>
            </div>
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-amber-500/70">SufiTube</span>
          </div>

          {/* Body */}
          <div className="flex flex-col flex-1 px-7 pb-7 gap-5">
            <div>
              <h4 className="text-[17px] font-semibold text-neutral-100 mb-2 group-hover:text-amber-400 transition-colors">
                Managed by SufiTube
              </h4>
              <p className="text-sm text-neutral-400 leading-[1.7]">
                Best for supporters who want SufiPulse to handle the campaign, or prefer a fully managed promotion experience without using their own Google Ads account.
              </p>
            </div>

            <div className="border-t border-neutral-800/80" />

            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm text-neutral-300">
                <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> Easiest setup
              </div>
              <div className="flex items-center gap-2.5 text-sm text-neutral-300">
                <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> We manage campaign execution
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); handleMethodSelect('managed_sufitube'); }}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-[#0F172A] text-sm font-bold rounded-xl transition-colors"
            >
              Sponsor Through SufiPulse
            </button>

            <p className="text-xs text-center text-neutral-600">Recommended for most users</p>
          </div>
        </div>

        {/* ── RIGHT CARD: Use My Google Ads ── always visible, state-aware */}
        <div
          onClick={() => googleAdsEnabled !== false ? handleMethodSelect('use_my_google_ads') : undefined}
          className={`flex flex-col bg-neutral-900 border rounded-2xl transition-all duration-200 select-none ${
            googleAdsEnabled !== false
              ? 'border-neutral-800 hover:border-blue-500/40 cursor-pointer group'
              : 'border-neutral-800/50 opacity-70 cursor-default'
          }`}
        >
          {/* Logo */}
          <div className="flex flex-col items-center pt-9 pb-5 px-8">
            <div className="h-14 flex items-center justify-center mb-3">
              <div className="flex items-center gap-2">
                <svg width="28" height="28" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span className="text-[17px] font-normal leading-none" style={{ fontFamily: 'Arial, sans-serif', letterSpacing: '-0.2px' }}>
                  <span style={{ color: '#4285F4' }}>G</span>
                  <span style={{ color: '#EA4335' }}>o</span>
                  <span style={{ color: '#FBBC04' }}>o</span>
                  <span style={{ color: '#4285F4' }}>g</span>
                  <span style={{ color: '#34A853' }}>l</span>
                  <span style={{ color: '#EA4335' }}>e</span>
                  <span className="font-semibold ml-1" style={{ color: '#4285F4' }}>Ads</span>
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-blue-400/60">Google Ads</span>
          </div>

          {/* Body */}
          <div className="flex flex-col flex-1 px-7 pb-7 gap-5">
            <div>
              <h4 className={`text-[17px] font-semibold mb-2 transition-colors ${
                googleAdsEnabled !== false ? 'text-neutral-100 group-hover:text-blue-400' : 'text-neutral-400'
              }`}>
                Use My Google Ads
              </h4>
              <p className="text-sm text-neutral-400 leading-[1.7]">
                Connect your own Google Ads account. We prepare the campaign structure and targeting inputs so you retain full control and ownership directly in your account.
              </p>
            </div>

            <div className="border-t border-neutral-800/80" />

            {googleAdsEnabled !== false ? (
              <>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-neutral-300">
                    <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> Full ownership
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-neutral-300">
                    <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> Pay Google directly
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleMethodSelect('use_my_google_ads'); }}
                  className="w-full py-3.5 bg-[#4285F4] hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Connect My Google Ads Account
                </button>
                <p className="text-xs text-center text-neutral-600">Secure connection via Google</p>
              </>
            ) : (
              <>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-neutral-500">
                    <Check className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" /> Full ownership of campaigns
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-neutral-500">
                    <Check className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" /> Direct billing through Google
                  </div>
                </div>
                <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Google Ads account connection is temporarily unavailable.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );

  const REGIONS = [
    'Global', 'South Asia', 'India', 'Pakistan',
    'United Kingdom', 'United States', 'Canada', 'Australia',
    'MENA', 'Europe', 'East Africa', 'Southeast Asia',
  ];
  const LANGUAGES = [
    'All', 'English', 'Urdu', 'Hindi', 'Arabic',
    'Punjabi', 'Kashmiri', 'Persian', 'Bengali', 'Turkish',
  ];
  const toggleRegion = (r: string) =>
    setFormData(prev => {
      const cur = prev.target_regions || [];
      return { ...prev, target_regions: cur.includes(r) ? cur.filter(x => x !== r) : [...cur, r] };
    });
  const toggleLanguage = (l: string) =>
    setFormData(prev => {
      const cur = prev.target_languages || [];
      return { ...prev, target_languages: cur.includes(l) ? cur.filter(x => x !== l) : [...cur, l] };
    });

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

  const renderIntention = () => (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
      <div className="text-center">
        <h3 className="text-2xl font-medium text-neutral-100 mb-2">Campaign Intention</h3>
        <p className="text-neutral-500 text-sm max-w-md mx-auto">What is your intention for sponsoring this kalam?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {INTENTIONS.map(({ value, label }) => {
          const selected = formData.campaign_objective === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, campaign_objective: value as AdoptionFormData['campaign_objective'] }))}
              className={`text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-150 ${
                selected
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              {selected && <span className="mr-1.5 text-amber-400">✓</span>}{label}
            </button>
          );
        })}
      </div>

      <div>
        <label className="block text-sm text-neutral-500 mb-2">Add a dedication or intention note <span className="text-neutral-700">(optional)</span></label>
        <textarea
          value={formData.dedication_message || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, dedication_message: e.target.value }))}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50 h-20 placeholder-neutral-700 resize-none"
          placeholder="e.g. In loving memory of… · For the seekers of the East · This Ramadan…"
        />
      </div>

      <button
        onClick={() => setStep(2)}
        disabled={!formData.campaign_objective}
        className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  const renderPackageSelection = () => {
    // ── use_my_google_ads: budget entry then connect ──
    if (selectedMethod === 'use_my_google_ads') {
      return (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
          <h3 className="text-2xl font-medium text-neutral-100 mb-2 text-center">Campaign Budget</h3>
          <p className="text-sm text-neutral-500 text-center mb-6">Set your total Google Ads spend for this kalam</p>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-sm divide-y divide-neutral-800">
            {[
              { label: 'Quick Boost', sub: '1–5 days · $2–10/day', range: '$10–$49' },
              { label: 'Starter Reach', sub: '5–10 days · $5–15/day', range: '$50–$99' },
              { label: 'Balanced Campaign', sub: '7–14 days · $10–25/day · Recommended', range: '$100–$299', highlight: true },
              { label: 'Optimal Reach', sub: '14–30 days · $15–35+/day', range: '$300+' },
            ].map(({ label, sub, range, highlight }) => (
              <div key={label} className="flex justify-between items-start py-3">
                <div>
                  <div className={highlight ? 'text-amber-400 font-medium' : 'text-neutral-300 font-medium'}>{label}</div>
                  <div className="text-neutral-600 text-xs mt-0.5">{sub}</div>
                </div>
                <span className={highlight ? 'text-amber-500/70 text-xs pt-0.5' : 'text-neutral-400 text-xs pt-0.5'}>{range}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm text-neutral-400 mb-2">Total Campaign Budget (USD) *</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm select-none">$</span>
              <input
                type="number"
                min="10"
                step="1"
                value={formData.custom_budget || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_budget: Number(e.target.value) || undefined }))}
                className={`w-full bg-neutral-900 border rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 ${
                  formData.custom_budget && formData.custom_budget < 10 ? 'border-red-500' : 'border-neutral-800'
                }`}
                placeholder="Minimum 10"
              />
            </div>
            {formData.custom_budget && formData.custom_budget < 10
              ? <p className="text-xs text-red-400 mt-1">Minimum campaign budget is $10.</p>
              : <p className="text-xs text-neutral-600 mt-1">Your budget goes directly to Google Ads — SufiPulse does not charge you.</p>
            }
          </div>

          {/* Target regions */}
          <div>
            <label className="block text-sm text-neutral-400 mb-3">
              Target Regions <span className="text-neutral-700 text-xs">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map(r => {
                const sel = (formData.target_regions || []).includes(r);
                return (
                  <button key={r} type="button" onClick={() => toggleRegion(r)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      sel ? 'border-blue-500/60 bg-blue-500/10 text-blue-300' : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                    }`}
                  >{r}</button>
                );
              })}
            </div>
          </div>

          {/* Target languages */}
          <div>
            <label className="block text-sm text-neutral-400 mb-3">
              Target Languages <span className="text-neutral-700 text-xs">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(l => {
                const sel = (formData.target_languages || []).includes(l);
                return (
                  <button key={l} type="button" onClick={() => toggleLanguage(l)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      sel ? 'border-blue-500/60 bg-blue-500/10 text-blue-300' : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                    }`}
                  >{l}</button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setStep(3)}
            disabled={!formData.custom_budget || formData.custom_budget < 10}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Continue to Sponsor Details <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // ── managed_sufitube: package cards ──
    return (
      <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
        <h3 className="text-2xl font-medium text-neutral-100 mb-6 text-center">Choose Your Budget</h3>
        <div className="grid gap-4">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handlePackageSelect(pkg)}
              className="flex items-center justify-between p-6 bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-xl transition-all group hover:bg-neutral-800/80"
            >
              <div className="text-left">
                <h4 className="text-lg font-medium text-neutral-100 mb-2">{pkg.package_name}</h4>
                <p className="text-neutral-400 text-sm mb-3">{pkg.description}</p>
                <div className="flex items-center gap-4 text-sm text-neutral-500">
                  <span>~{pkg.estimated_impressions_min.toLocaleString()}–{pkg.estimated_impressions_max.toLocaleString()} impressions</span>
                  <span>{pkg.duration_days} days</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-500">${pkg.amount}</div>
                <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-amber-500 transition-colors mt-2" />
              </div>
            </button>
          ))}
          <button
            onClick={handleCustomBudget}
            className="flex items-center justify-center p-6 bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-xl transition-all hover:bg-neutral-800/80"
          >
            <div className="text-center">
              <h4 className="text-lg font-medium text-neutral-100 mb-2">Custom Budget</h4>
              <p className="text-neutral-400 text-sm">Specify your own amount</p>
            </div>
          </button>
        </div>
      </div>
    );
  };

  // ── Step 4 for use_my_google_ads: Connect & Verify Google Ads Account ──────
  const renderGoogleConnect = () => {
    if (!adoption) return null;

    const cidNormalized = enteredCustomerId.replace(/-/g, '');
    const cidValid = /^\d{10}$/.test(cidNormalized);

    const startOAuth = async () => {
      setIsConnectingOAuth(true);
      setSubmitError('');
      // Persist entered values so they survive the OAuth redirect
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

    // ── Loading ───────────────────────────────────────────────────────────────
    if (!oauthChecked) {
      return (
        <div className="flex items-center justify-center gap-3 py-16 text-sm text-neutral-500">
          <Loader2 className="w-5 h-5 animate-spin" /> Checking connection status…
        </div>
      );
    }

    // ── Server not configured ─────────────────────────────────────────────────
    if (!oauthConfigured) {
      return (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="border border-amber-800/30 bg-amber-900/10 rounded-xl p-5 text-center space-y-2">
            <Settings className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-sm font-semibold text-neutral-200">Google Ads API connection is not available right now.</p>
            <p className="text-sm text-neutral-500 leading-relaxed">
              You can still submit your campaign request. SufiPulse will manually verify your Google Ads account and prepare the campaign structure.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Google Ads Customer ID <span className="text-neutral-600">(optional — provide if you have it)</span>
            </label>
            <input
              type="text"
              value={enteredCustomerId}
              onChange={e => setEnteredCustomerId(formatCustomerId(e.target.value))}
              placeholder="xxx-xxx-xxxx"
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-blue-500/60 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-neutral-700 outline-none transition-colors"
            />
            <p className="text-xs text-neutral-600 mt-1.5">
              Found in the top-right corner of your Google Ads account. Leave blank if you don&apos;t have it yet.
            </p>
          </div>

          {submitError && (
            <div className="text-sm text-red-400 border border-red-700/40 bg-red-900/20 rounded-xl px-4 py-3 text-center">
              {submitError}
            </div>
          )}

          <button
            type="button"
            disabled={isSubmittingManualReview || !adoption?.id}
            onClick={handleManualReview}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSubmittingManualReview
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
              : <><Check className="w-5 h-5" /> Submit for Manual Review</>}
          </button>

          <button
            type="button"
            onClick={switchToManaged}
            className="w-full py-3 border border-neutral-700 hover:border-amber-500/40 text-neutral-400 hover:text-amber-400 text-sm font-medium rounded-xl transition-colors"
          >
            Switch to Managed by SufiTube Instead
          </button>
        </div>
      );
    }

    // ── Verified ─────────────────────────────────────────────────────────────
    if (verifiedCustomerId && !isVerifying) {
      return (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="border border-green-800/30 bg-green-900/10 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-400">Google Ads account verified</p>
                {googleEmail && <p className="text-xs text-neutral-500">{googleEmail}</p>}
              </div>
            </div>
            <div className="bg-neutral-900/80 rounded-lg px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-neutral-500">Customer ID</span>
              <span className="font-mono text-sm text-neutral-200">{verifiedCustomerId}</span>
            </div>
          </div>

          <button
            onClick={() => setStep(5)}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Continue to Review <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleGoogleDisconnect}
            disabled={isDisconnecting}
            className="w-full text-xs text-neutral-600 hover:text-red-400 transition-colors py-1"
          >
            {isDisconnecting ? 'Disconnecting…' : 'Disconnect and use a different account'}
          </button>
        </div>
      );
    }

    // ── Verifying ─────────────────────────────────────────────────────────────
    if (isVerifying) {
      return (
        <div className="flex items-center justify-center gap-3 py-16 text-sm text-neutral-500">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" /> Verifying {enteredCustomerId || cidNormalized}…
        </div>
      );
    }

    // ── Verification failed ───────────────────────────────────────────────────
    if (verifyError) {
      const rc = verifyReasonCode || 'CUSTOMER_NOT_DIRECTLY_ACCESSIBLE';
      const connectedEmail = verifyErrorDetail?.connectedGoogleEmail || googleEmail || enteredEmail;

      const isTokenExpired = rc === 'OAUTH_TOKEN_EXPIRED' || rc === 'NO_OAUTH_TOKEN';

      const headlines: Record<string, string> = {
        NO_OAUTH_TOKEN:                        'Google Ads connection expired',
        OAUTH_TOKEN_EXPIRED:                   'Google Ads connection expired',
        MISSING_DEVELOPER_TOKEN:               'Google Ads API not configured on this server',
        GOOGLE_ACCOUNT_MISMATCH:               'Google account mismatch',
        GOOGLE_ADS_API_CALL_FAILED:            'Google Ads API returned an error',
        NO_ACCESSIBLE_CUSTOMERS:               'No Google Ads accounts found',
        CUSTOMER_NOT_DIRECTLY_ACCESSIBLE:      'Customer ID not found in this account',
        CUSTOMER_NOT_ACCESSIBLE_THROUGH_MCC:   'Customer ID not accessible (direct + manager accounts checked)',
      };
      const details: Record<string, string> = {
        NO_OAUTH_TOKEN:                      'Your Google Ads connection has expired or is incomplete. Please reconnect your Google Ads account to continue.',
        OAUTH_TOKEN_EXPIRED:                 'Your Google Ads connection has expired or is incomplete. Please reconnect your Google Ads account to continue.',
        MISSING_DEVELOPER_TOKEN:             'The server is missing GOOGLE_ADS_DEVELOPER_TOKEN. Contact the SufiPulse admin.',
        GOOGLE_ACCOUNT_MISMATCH:             `The connected Google account (${connectedEmail}) is different from the email you entered (${enteredEmail}). Sign in with the correct Google account.`,
        GOOGLE_ADS_API_CALL_FAILED:          verifyErrorDetail?.error || 'The Google Ads API rejected the request.',
        NO_ACCESSIBLE_CUSTOMERS:             `The connected Google account (${connectedEmail}) has no accessible Google Ads accounts. Check that the account has active Ads access.`,
        CUSTOMER_NOT_DIRECTLY_ACCESSIBLE:    `Customer ID ${enteredCustomerId} was not found in the accounts accessible to ${connectedEmail}. It may be under a manager account — or the Customer ID may be wrong.`,
        CUSTOMER_NOT_ACCESSIBLE_THROUGH_MCC: `Customer ID ${enteredCustomerId} was not found directly or through any manager accounts accessible to ${connectedEmail}. Verify the Customer ID and that this Google account has access.`,
      };

      const clearError = () => {
        setVerifyError(null);
        setVerifyReasonCode(null);
        setVerifyErrorDetail(null);
        setSubmitError('');
      };

      return (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold text-neutral-100">
              {headlines[rc] || 'Verification failed'}
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-sm mx-auto">
              {details[rc] || 'An unexpected error occurred during verification.'}
            </p>
          </div>

          <div className="flex justify-center">
            <span className="font-mono text-[10px] text-neutral-600 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
              {rc}
            </span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800 text-sm">
            {connectedEmail && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-neutral-500">Connected Google account</span>
                <span className="text-neutral-300">{connectedEmail}</span>
              </div>
            )}
            {enteredEmail && enteredEmail !== connectedEmail && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-neutral-500">Email you entered</span>
                <span className="text-yellow-400">{enteredEmail}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-neutral-500">Customer ID entered</span>
              <span className="font-mono text-neutral-300">{enteredCustomerId || '—'}</span>
            </div>
            {verifyErrorDetail?.accounts && verifyErrorDetail.accounts.length > 0 && (
              <div className="flex items-start justify-between px-4 py-3 gap-4">
                <span className="text-neutral-500 flex-shrink-0">Accounts found ({verifyErrorDetail.accounts.length})</span>
                <span className="font-mono text-neutral-400 text-xs text-right">{verifyErrorDetail.accounts.join(', ')}</span>
              </div>
            )}
            {rc === 'GOOGLE_ADS_API_CALL_FAILED' && verifyErrorDetail?.google_ads_error && (
              <div className="px-4 py-3">
                <span className="text-neutral-500 block mb-1 text-xs">API error detail</span>
                <pre className="text-[10px] text-red-400 whitespace-pre-wrap break-all">{JSON.stringify(verifyErrorDetail.google_ads_error, null, 2)}</pre>
              </div>
            )}
          </div>

          {submitError && (
            <div className="text-sm text-red-400 border border-red-700/40 bg-red-900/20 rounded-xl px-4 py-3 text-center">
              {submitError}
            </div>
          )}

          {isTokenExpired ? (
            <button
              type="button"
              onClick={() => { clearError(); setOauthConnected(false); setOauthChecked(true); setEnteredCustomerId(''); }}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Globe className="w-5 h-5" /> Reconnect Google Ads Account
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmittingManualReview}
              onClick={handleManualReview}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isSubmittingManualReview
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting request…</>
                : <><Check className="w-5 h-5" /> Submit Adoption Request for Manual Review</>}
            </button>
          )}

          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 border-t border-neutral-800" />
            <span className="text-xs text-neutral-700 flex-shrink-0">or</span>
            <div className="flex-1 border-t border-neutral-800" />
          </div>

          <div className="space-y-2">
            {!isTokenExpired && (
            <button
              type="button"
              onClick={() => { clearError(); setEnteredCustomerId(''); }}
              className="w-full py-3 border border-neutral-700 hover:border-neutral-500 text-neutral-300 text-sm font-medium rounded-xl transition-colors"
            >
              Try a Different Customer ID
            </button>
            )}
            <button
              type="button"
              onClick={() => { clearError(); setOauthConnected(false); setOauthChecked(true); setEnteredCustomerId(''); }}
              className="w-full py-3 border border-neutral-700 hover:border-neutral-500 text-neutral-300 text-sm font-medium rounded-xl transition-colors"
            >
              Reconnect a Different Google Account
            </button>
            <button
              type="button"
              onClick={switchToManaged}
              className="w-full py-3 border border-neutral-800 hover:border-amber-500/40 text-neutral-500 hover:text-amber-400 text-sm font-medium rounded-xl transition-colors"
            >
              Switch to Managed by SufiTube
            </button>
          </div>
        </div>
      );
    }

    // ── Entry form: not connected OR connected but not yet verified ────────────
    return (
      <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
        <div className="text-center">
          <h3 className="text-2xl font-medium text-neutral-100 mb-2">Verify Your Google Ads Account</h3>
          <p className="text-neutral-500 text-sm leading-relaxed max-w-md mx-auto">
            Enter your Google account email and Google Ads Customer ID. SufiPulse will verify access via the Google Ads API.
          </p>
        </div>

        {/* Connected badge */}
        {oauthConnected && googleEmail && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-green-900/15 border border-green-800/30 rounded-xl">
            <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            <span className="text-xs text-green-400">Connected as <span className="font-medium">{googleEmail}</span></span>
          </div>
        )}

        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Google account email</label>
            <input
              type="email"
              value={enteredEmail}
              onChange={e => setEnteredEmail(e.target.value)}
              placeholder="you@gmail.com"
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-blue-500/60 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-700 outline-none transition-colors"
            />
          </div>

          {/* Customer ID */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Google Ads Customer ID</label>
            <input
              type="text"
              value={enteredCustomerId}
              onChange={e => setEnteredCustomerId(formatCustomerId(e.target.value))}
              placeholder="xxx-xxx-xxxx"
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-blue-500/60 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-neutral-700 outline-none transition-colors"
            />
            <p className="text-xs text-neutral-600 mt-1.5">
              You can find this in the top-right corner of your Google Ads account.
            </p>
          </div>

          {/* Auto-discovery suggestions */}
          {oauthConnected && accessibleCustomerIds.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-neutral-600">Auto-detected accounts — click to fill:</p>
              <div className="flex flex-wrap gap-2">
                {accessibleCustomerIds.map(cid => (
                  <button
                    key={cid}
                    type="button"
                    onClick={() => setEnteredCustomerId(cid)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                      enteredCustomerId === cid
                        ? 'border-blue-500/60 bg-blue-500/10 text-blue-300'
                        : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                    }`}
                  >
                    {cid}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {submitError && (
          <div className="text-sm text-red-400 border border-red-700/40 bg-red-900/20 rounded-xl px-4 py-3 text-center">
            {submitError}
          </div>
        )}

        {/* Primary action */}
        {oauthConnected ? (
          <button
            type="button"
            disabled={!cidValid || isVerifying}
            onClick={() => verifyManualEntry(enteredCustomerId)}
            className="flex w-full items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            <Check className="w-5 h-5" /> Verify Google Ads Account
          </button>
        ) : (
          <button
            type="button"
            disabled={isConnectingOAuth}
            onClick={startOAuth}
            className="flex w-full items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            {isConnectingOAuth
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Connecting…</>
              : <><Globe className="w-5 h-5" /> Connect Google Account &amp; Verify</>
            }
          </button>
        )}

        <p className="text-xs text-neutral-700 text-center">
          {oauthConnected
            ? 'Google Ads API · account must be accessible to the connected Google profile'
            : 'Google OAuth 2.0 · Scope: Google Ads API read access'}
        </p>

        {oauthConnected && (
          <button
            type="button"
            onClick={handleGoogleDisconnect}
            disabled={isDisconnecting}
            className="w-full text-xs text-neutral-600 hover:text-red-400 transition-colors py-1"
          >
            {isDisconnecting ? 'Disconnecting…' : 'Disconnect and reconnect a different account'}
          </button>
        )}
      </div>
    );
  };

  const renderForm = () => (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-300">
      <input
        type="text"
        name="_bot_check"
        value={botCheck}
        onChange={(e) => setBotCheck(e.target.value)}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />
      <h3 className="text-2xl font-medium text-neutral-100 mb-6 text-center">Sponsor Information</h3>

      {/* Connected Google Ads badge — for use_my_google_ads only */}
      {selectedMethod === 'use_my_google_ads' && oauthConnected && selectedGoogleCustomerId && (
        <div className="flex items-center gap-3 px-4 py-3 border border-green-800/40 bg-green-900/10 rounded-xl">
          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold text-green-400">Google Ads Connected</div>
            <div className="text-xs text-neutral-500">Account: <span className="font-mono text-neutral-400">{selectedGoogleCustomerId}</span> · Status: Verified</div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm text-neutral-400 mb-2">Full Name *</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            className={`w-full bg-neutral-900 border ${fieldErrors.full_name ? 'border-red-500' : 'border-neutral-800'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500`}
            required
          />
          {fieldErrors.full_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.full_name}</p>}
        </div>
        <div>
          <label className="block text-sm text-neutral-400 mb-2">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className={`w-full bg-neutral-900 border ${fieldErrors.email ? 'border-red-500' : 'border-neutral-800'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500`}
            required
          />
          {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm text-neutral-400 mb-2">Country *</label>
          <input
            type="text"
            name="country"
            value={formData.country || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            className={`w-full bg-neutral-900 border ${fieldErrors.country ? 'border-red-500' : 'border-neutral-800'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500`}
            required
          />
          {fieldErrors.country && <p className="text-red-500 text-xs mt-1">{fieldErrors.country}</p>}
        </div>
        <div>
          <label className="block text-sm text-neutral-400 mb-2">City</label>
          <input
            type="text"
            name="city"
            value={formData.city || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className={`w-full bg-neutral-900 border ${fieldErrors.city ? 'border-red-500' : 'border-neutral-800'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500`}
          />
          {fieldErrors.city && <p className="text-red-500 text-xs mt-1">{fieldErrors.city}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm text-neutral-400 mb-2">Adopter Type *</label>
        <select
          name="adopter_type"
          value={formData.adopter_type || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, adopter_type: e.target.value as any }))}
          className={`w-full bg-neutral-900 border ${fieldErrors.adopter_type ? 'border-red-500' : 'border-neutral-800'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500`}
          required
        >
          <option value="">Select type</option>
          <option value="individual">Individual</option>
          <option value="family">Family</option>
          <option value="institution">Institution</option>
          <option value="trust">Trust</option>
          <option value="sponsor_circle">Sponsor Circle</option>
          <option value="anonymous">Anonymous</option>
        </select>
        {fieldErrors.adopter_type && <p className="text-red-500 text-xs mt-1">{fieldErrors.adopter_type}</p>}
      </div>

      {selectedMethod === 'managed_sufitube' && (
        <>
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Preferred Audience Region</label>
            <select
              name="preferred_audience_region"
              value={formData.preferred_audience_region || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, preferred_audience_region: e.target.value as any }))}
              className={`w-full bg-neutral-900 border ${fieldErrors.preferred_audience_region ? 'border-red-500' : 'border-neutral-800'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500`}
            >
              <option value="local">Local</option>
              <option value="national">National</option>
              <option value="international">International</option>
              <option value="diaspora">Diaspora</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Campaign Objective</label>
            <select
              name="campaign_objective"
              value={formData.campaign_objective || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, campaign_objective: e.target.value as AdoptionFormData['campaign_objective'] }))}
              className={`w-full bg-neutral-900 border ${fieldErrors.campaign_objective ? 'border-red-500' : 'border-neutral-800'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500`}
            >
              <option value="awareness">Awareness</option>
              <option value="devotional_reach">Devotional Reach</option>
              <option value="community_engagement">Community Engagement</option>
              <option value="event_support">Event Support</option>
              <option value="release_launch_support">Release Launch Support</option>
            </select>
          </div>
        </>
      )}

      {/* use_my_google_ads: campaign objective already chosen in step 1 — not repeated here */}

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-neutral-100">Privacy Settings</h4>
        <div>
          <label className="block text-sm text-neutral-400 mb-2">Public Display</label>
          <select
            name="public_display_mode"
            value={formData.public_display_mode || 'full_name'}
            onChange={(e) => setFormData(prev => ({ ...prev, public_display_mode: e.target.value as any }))}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="full_name">Full Name</option>
            <option value="initials_only">Initials Only</option>
            <option value="organization">Organization Name</option>
            <option value="anonymous">Anonymous</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-neutral-400 mb-2">Location Display</label>
          <select
            name="public_location_mode"
            value={formData.public_location_mode || 'city_country'}
            onChange={(e) => setFormData(prev => ({ ...prev, public_location_mode: e.target.value as any }))}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="city_country">City, Country</option>
            <option value="country_only">Country Only</option>
            <option value="hide">Hide Location</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.agree_to_terms || false}
            onChange={(e) => setFormData(prev => ({ ...prev, agree_to_terms: e.target.checked }))}
            className="rounded border-neutral-800"
            required
          />
          <span className="text-sm text-neutral-400">I agree to the terms of service</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.agree_to_promotional_use || false}
            onChange={(e) => setFormData(prev => ({ ...prev, agree_to_promotional_use: e.target.checked }))}
            className="rounded border-neutral-800"
            required
          />
          <span className="text-sm text-neutral-400">I agree to respectful promotional use of my sponsorship</span>
        </label>
      </div>

      {submitError && (
        <div className="text-sm text-red-400 border border-red-700/40 bg-red-900/20 rounded-lg px-4 py-3 text-center">
          {submitError}
        </div>
      )}

      <button
        onClick={() => { setSubmitError(''); handleFormSubmit(); }}
        disabled={isSubmitting || !formData.agree_to_terms || !formData.agree_to_promotional_use}
        className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</>
          : selectedMethod === 'use_my_google_ads'
            ? <>Continue to Connect Google Ads <ArrowRight className="w-4 h-4" /></>
            : 'Continue to Review'}
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
        <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-300">
          <div className="text-center">
            <h3 className="text-2xl font-medium text-neutral-100 mb-1">Review Campaign Request</h3>
            <p className="text-sm text-neutral-500">Confirm all details before submitting to SufiPulse for review.</p>
          </div>

          {/* Full campaign details table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800 text-sm">
            <div className="flex items-start justify-between px-5 py-3">
              <span className="text-neutral-500">Song</span>
              <span className="text-neutral-200 font-medium text-right max-w-[60%]">{release?.release_title || '—'}</span>
            </div>
            {ytId && (
              <div className="flex items-start justify-between px-5 py-3">
                <span className="text-neutral-500">YouTube URL</span>
                <a href={`https://www.youtube.com/watch?v=${ytId}`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono text-xs truncate max-w-[60%]">
                  youtube.com/watch?v={ytId}
                </a>
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Budget</span>
              <span className="text-amber-400 font-bold">${budget}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Duration</span>
              <span className="text-neutral-300">{dur.days} days</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Daily Spend</span>
              <span className="text-neutral-300">~${dur.daily}/day</span>
            </div>
            <div className="flex items-start justify-between px-5 py-3">
              <span className="text-neutral-500">Target Regions</span>
              <span className="text-neutral-300 text-right max-w-[60%]">{regions.join(', ')}</span>
            </div>
            <div className="flex items-start justify-between px-5 py-3">
              <span className="text-neutral-500">Languages</span>
              <span className="text-neutral-300 text-right max-w-[60%]">{languages.join(', ')}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Objective</span>
              <span className="text-neutral-300 capitalize">{(formData.campaign_objective || 'awareness').replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Sponsor</span>
              <span className="text-neutral-300">{formData.full_name || '—'}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Email</span>
              <span className="text-neutral-400 text-xs">{formData.email || '—'}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Google Ads Account</span>
              {selectedGoogleCustomerId && verifiedCustomerId ? (
                <span className="flex items-center gap-1.5 text-green-400 font-mono text-xs">
                  <Check className="w-3.5 h-3.5 shrink-0" />{selectedGoogleCustomerId}
                </span>
              ) : (
                <span className="text-red-400 text-xs">Not verified — go back to step 4</span>
              )}
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Payment Route</span>
              <span className="text-neutral-300">Pay Google Directly</span>
            </div>
            {formData.dedication_message && (
              <div className="px-5 py-3">
                <span className="text-neutral-500 block text-xs mb-1">Dedication</span>
                <span className="text-neutral-300 italic text-sm">"{formData.dedication_message}"</span>
              </div>
            )}
          </div>

          {/* Billing confirmation */}
          <div className="border border-neutral-800 bg-neutral-900/50 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.billing_enabled || false}
                onChange={(e) => setFormData(prev => ({ ...prev, billing_enabled: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded border-neutral-600 flex-shrink-0"
              />
              <span className="text-sm text-neutral-400 leading-relaxed">
                I confirm this Google Ads account has billing / payment configured inside Google Ads, or I will configure it before the campaign launches.
              </span>
            </label>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-500 leading-relaxed">
            You will not pay inside SufiPulse. Your ad spend will be billed by Google through your selected Google Ads account after the campaign is approved and launched.
          </div>

          {submitError && (
            <div className="text-sm text-red-400 border border-red-700/40 bg-red-900/20 rounded-lg px-4 py-3 text-center">
              {submitError}
            </div>
          )}

          {/* Verified path: normal submit */}
          {(selectedGoogleCustomerId && verifiedCustomerId) ? (
            <button
              onClick={() => { setSubmitError(''); handlePayment(); }}
              disabled={!canSubmit}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
                : <><Check className="w-5 h-5" /> Submit Campaign Request</>}
            </button>
          ) : (
            /* No verified customer ID — offer manual review or go back */
            <div className="space-y-3">
              <div className="text-sm text-amber-400 border border-amber-700/40 bg-amber-900/20 rounded-lg px-4 py-3 text-center">
                Google Ads account not yet verified. Submit for manual review or go back to verify.
              </div>
              <button
                type="button"
                disabled={isSubmittingManualReview}
                onClick={handleManualReview}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isSubmittingManualReview
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
                  : <><Check className="w-5 h-5" /> Submit for Manual Review</>}
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-full py-3 border border-neutral-700 hover:border-neutral-500 text-neutral-300 text-sm font-medium rounded-xl transition-colors"
              >
                Go Back to Verify Google Ads Account
              </button>
            </div>
          )}
        </div>
      );
    }

    // ── managed_sufitube ─────────────────────────────────────────────────────
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-300">
        <h3 className="text-2xl font-medium text-neutral-100 mb-6 text-center">Review Your Campaign</h3>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <Music className="w-4 h-4 text-amber-500" />
            <span className="text-neutral-200 font-medium">{release?.release_title || 'Current Release'}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-neutral-600 uppercase tracking-wider mb-1">Budget</div>
              <div className="text-amber-500 font-bold text-xl">${budget}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-600 uppercase tracking-wider mb-1">Objective</div>
              <div className="text-neutral-300 text-sm capitalize">
                {(formData.campaign_objective || 'awareness').replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          {impact && (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-neutral-800">
              <div className="text-center">
                <div className="text-xs text-neutral-600 mb-1">Est. Impressions</div>
                <div className="text-xs text-neutral-300 font-medium">~{impact.min}–{impact.max}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-neutral-600 mb-1">Duration</div>
                <div className="text-xs text-neutral-300 font-medium">{impact.days} days</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-neutral-600 mb-1">Tier</div>
                <div className="text-xs text-amber-400 font-semibold">{impact.tier}</div>
              </div>
            </div>
          )}

          {formData.dedication_message && (
            <div className="pt-3 border-t border-neutral-800">
              <div className="text-xs text-neutral-600 uppercase tracking-wider mb-1">Dedication</div>
              <div className="text-neutral-300 text-sm italic">"{formData.dedication_message}"</div>
            </div>
          )}
        </div>

        {submitError && !showAuthWall && (
          <div className="text-sm text-red-400 border border-red-700/40 bg-red-900/20 rounded-lg px-4 py-3 text-center">
            {submitError}
          </div>
        )}

        {showAuthWall ? (() => {
          const returnUrl = new URL(window.location.href);
          returnUrl.searchParams.set('adopt', '1');
          if (adoption?.id) returnUrl.searchParams.set('adoptionId', adoption.id);
          const returnTo = encodeURIComponent(returnUrl.pathname + returnUrl.search);
          return (
            <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-6 space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
                <h4 className="text-neutral-100 font-medium mb-1">Sign in to continue</h4>
                <p className="text-neutral-400 text-sm">A SufiPulse account is required to adopt a song. Your campaign details have been saved.</p>
              </div>
              <div className="space-y-3 pt-2">
                <a
                  href={`/login?returnTo=${returnTo}`}
                  className="block w-full py-3 bg-amber-600 hover:bg-amber-700 text-white text-center font-medium rounded-xl transition-colors"
                >
                  Sign In to Continue
                </a>
                <a
                  href={`/register?returnTo=${returnTo}`}
                  className="block w-full py-3 bg-neutral-700 hover:bg-neutral-600 text-white text-center font-medium rounded-xl transition-colors"
                >
                  Create Account
                </a>
                {adoption?.id && (
                  <a
                    href={`/adopt-song/request/${adoption.id}`}
                    className="block w-full py-3 bg-transparent border border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-neutral-200 text-center text-sm font-medium rounded-xl transition-colors"
                  >
                    Save and Continue Later
                  </a>
                )}
              </div>
              <p className="text-xs text-neutral-600 text-center">
                Your sponsorship details have been saved and can be completed after signing in.
              </p>
            </div>
          );
        })() : (
          <>
            {!stripeEnabled && (
              <div className="text-sm text-red-400 border border-red-700/40 bg-red-900/20 rounded-lg px-4 py-3 text-center">
                Payment system unavailable. Contact support to complete your sponsorship.
              </div>
            )}
            <button
              onClick={() => { setSubmitError(''); handlePayment(); }}
              disabled={isRedirectingToStripe || !stripeEnabled}
              className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isRedirectingToStripe
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting to Stripe…</>
                : <><CreditCard className="w-5 h-5" /> Confirm & Pay with Card</>}
            </button>
          </>
        )}
      </div>
    );
  };

  const renderSuccess = () => {
    // ── use_my_google_ads: dedicated thank-you / confirmation page ────────────
    if (selectedMethod === 'use_my_google_ads') {
      const budget = formData.custom_budget || adoption?.amountDue || 0;
      const dur = getDuration(budget);
      const regions = formData.target_regions?.length ? formData.target_regions : ['Global'];
      const languages = formData.target_languages?.length ? formData.target_languages : ['All'];
      const ytId = release?.youtube_video_id || release?.youtubeId || '';

      // ── Manual review confirmation ────────────────────────────────────────
      if (isManualReview) {
        return (
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-9 h-9 text-amber-400" />
              </div>
              <h3 className="text-2xl font-serif font-light text-neutral-100 leading-snug">
                Your Google Ads campaign request has been submitted for manual review.
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed max-w-md mx-auto">
                SufiPulse will verify your Google Ads account and prepare the campaign structure if the account is eligible. You remain the account owner and pay Google directly.
              </p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800 text-sm">
              <div className="flex items-start justify-between px-5 py-3">
                <span className="text-neutral-500">Song Adopted</span>
                <span className="text-neutral-200 font-medium text-right max-w-[60%]">{release?.release_title || '—'}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-neutral-500">Budget</span>
                <span className="text-amber-400 font-bold">${budget}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-neutral-500">Google Ads Account</span>
                <span className="text-amber-400 font-mono text-xs">{selectedGoogleCustomerId || enteredCustomerId || '—'}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-neutral-500">Review Status</span>
                <span className="text-amber-400 text-xs font-medium bg-amber-900/40 px-2 py-0.5 rounded">Pending Manual Review</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-neutral-500">Payment Route</span>
                <span className="text-neutral-300">Pay Google Directly</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-neutral-500">Reference ID</span>
                <span className="text-neutral-500 text-xs font-mono">{adoption?.id?.slice(-12) || '—'}</span>
              </div>
            </div>

            <div className="bg-amber-900/10 border border-amber-800/30 rounded-xl px-5 py-4 text-sm text-neutral-400 leading-relaxed">
              SufiPulse will be in touch once the account is verified. No payment is required through SufiPulse — you pay Google directly.
            </div>

            <button onClick={resetFlow} className="w-full text-neutral-400 hover:text-white transition-colors text-sm py-2">
              Return to Overview
            </button>
          </div>
        );
      }

      // ── Standard verified path ────────────────────────────────────────────
      return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-9 h-9 text-green-500" />
            </div>
            <h3 className="text-2xl font-serif font-light text-neutral-100 leading-snug">
              Campaign request submitted.
            </h3>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-md mx-auto">
              SufiPulse will prepare the campaign structure in your Google Ads account. You remain the account owner and pay Google directly.
            </p>
          </div>

          {/* Campaign status progression */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Campaign Status</p>
            {[
              { label: 'Google Ads account connected', done: true },
              { label: `Customer ID selected (${selectedGoogleCustomerId || '—'})`, done: !!selectedGoogleCustomerId },
              { label: 'Campaign request submitted to SufiPulse', done: true },
              { label: 'Awaiting campaign preparation', done: false, active: true },
              { label: 'Awaiting Google billing / approval', done: false },
            ].map(({ label, done, active }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${done ? 'bg-green-500/20 border border-green-500/40' : active ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-neutral-800 border border-neutral-700'}`}>
                  {done
                    ? <Check className="w-3 h-3 text-green-400" />
                    : active
                      ? <Loader2 className="w-3 h-3 text-amber-400" />
                      : <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />}
                </div>
                <span className={`text-sm ${done ? 'text-neutral-300' : active ? 'text-amber-400' : 'text-neutral-600'}`}>{label}</span>
              </div>
            ))}
          </div>

          {/* Full campaign confirmation table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800 text-sm">
            <div className="flex items-start justify-between px-5 py-3">
              <span className="text-neutral-500">Song Adopted</span>
              <span className="text-neutral-200 font-medium text-right max-w-[60%]">{release?.release_title || '—'}</span>
            </div>
            {ytId && (
              <div className="flex items-start justify-between px-5 py-3">
                <span className="text-neutral-500">YouTube</span>
                <a href={`https://www.youtube.com/watch?v=${ytId}`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono text-xs truncate max-w-[60%]">
                  watch?v={ytId}
                </a>
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Budget</span>
              <span className="text-amber-400 font-bold">${budget}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Duration</span>
              <span className="text-neutral-300">{dur.days} days</span>
            </div>
            <div className="flex items-start justify-between px-5 py-3">
              <span className="text-neutral-500">Target Regions</span>
              <span className="text-neutral-300 text-right max-w-[60%]">{regions.join(', ')}</span>
            </div>
            <div className="flex items-start justify-between px-5 py-3">
              <span className="text-neutral-500">Languages</span>
              <span className="text-neutral-300 text-right max-w-[60%]">{languages.join(', ')}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Google Ads Account</span>
              <span className="text-green-400 font-mono text-xs">{selectedGoogleCustomerId || '—'}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Payment Route</span>
              <span className="text-neutral-300">Pay Google Directly</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Reference ID</span>
              <span className="text-neutral-500 text-xs font-mono">{adoption?.id?.slice(-12) || '—'}</span>
            </div>
          </div>

          <div className="border border-neutral-800 bg-neutral-900/50 rounded-xl px-5 py-4 text-sm text-neutral-500 leading-relaxed">
            Google Ads account connected. SufiPulse will prepare the campaign structure in your account. You remain the owner and pay Google directly.
          </div>

          <button onClick={resetFlow} className="w-full text-neutral-400 hover:text-white transition-colors text-sm py-2">
            Return to Overview
          </button>
        </div>
      );
    }

    // ── managed_sufitube: existing success page ───────────────────────────────
    const ytId2 = release?.youtube_video_id || release?.youtubeId || '';

    return (
      <div className="max-w-xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 mx-auto bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10 text-green-500" />
        </div>

        <h3 className="text-3xl font-serif font-light text-neutral-100 mb-2">Adoption Complete</h3>
        <p className="text-neutral-400 leading-relaxed mb-8">
          May your contribution bring ease and contemplation to whoever discovers this kalam. Your sponsorship has been recorded and will be reviewed shortly.
        </p>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-left mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart className="w-5 h-5 text-neutral-400" />
            <div className="font-medium text-neutral-200">Adoption Status</div>
          </div>
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
            <span className="text-neutral-500 text-sm">Campaign Status</span>
            <span className="text-amber-400 text-sm font-medium bg-amber-900/40 px-2 py-0.5 rounded">Pending Review</span>
          </div>
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
            <span className="text-neutral-500 text-sm">Amount</span>
            <span className="text-neutral-300 text-sm font-medium">${adoption?.amountDue || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-sm">Reference ID</span>
            <span className="text-neutral-500 text-xs font-mono">{adoption?.id?.slice(-12) || '—'}</span>
          </div>
        </div>

        {ytId2 && (() => {
          const ytUrl = `https://www.youtube.com/watch?v=${ytId2}`;
          const shareText = encodeURIComponent(`🎵 Just adopted this sacred kalam — listen on YouTube: ${ytUrl}`);
          return (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-left space-y-3">
              <p className="text-sm font-medium text-neutral-200">Help this reach more listeners</p>
              <div className="flex flex-wrap gap-2">
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(ytUrl)}&text=${encodeURIComponent('🎵 Just adopted this sacred kalam on SufiPulse')}&hashtags=SufiMusic,Kalam,SufiPulse`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs text-neutral-300 transition-colors"
                >𝕏 Share on X</a>
                <a href={`https://wa.me/?text=${shareText}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs text-neutral-300 transition-colors"
                >WhatsApp</a>
                <a href={ytUrl}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 border border-red-800/40 rounded-lg text-xs text-red-300 transition-colors"
                >Watch on YouTube</a>
              </div>
            </div>
          );
        })()}

        <button onClick={resetFlow} className="text-neutral-400 hover:text-white transition-colors text-sm">
          Return to Overview
        </button>
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
        <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 sm:p-12 relative overflow-hidden">
          {step > 0 && !isSuccessScreen && (
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
              <div className="text-sm font-medium text-neutral-500">
                Step {step} <span className="text-neutral-700">of {selectedMethod === 'use_my_google_ads' ? 5 : 4}</span>
              </div>
              <button onClick={resetFlow} className="text-neutral-500 hover:text-white transition-colors p-2">
                <X className="w-5 h-5" />
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
