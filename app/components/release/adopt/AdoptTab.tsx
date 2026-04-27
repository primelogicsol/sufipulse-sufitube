import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, X, Globe, CreditCard, CirclePlay as PlayCircle, Settings, Music, ChartBar as BarChart, Loader2, Lock } from 'lucide-react';
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
  // Both paths:         0=intro  1=intention  2=budget
  // managed_sufitube:   … 3=form  4=review  5=success
  // use_my_google_ads:  … 3=connect  4=form  5=review  6=success
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

  const stripeEnabled = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  // Custom budget modal (managed flow only)
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customModalAmount, setCustomModalAmount] = useState('');
  const [customModalError, setCustomModalError] = useState('');

  // ── Effects ───────────────────────────────────────────────────────────────


  // Check at mount whether Google Ads is configured on this server
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/google-ads/status');
        const payload = await res.json();
        setGoogleAdsEnabled(Boolean(payload?.configured));
      } catch {
        setGoogleAdsEnabled(null);
      }
    })();
  }, []);

  // Restore state after Google OAuth callback redirect
  useEffect(() => {
    const url = new URL(window.location.href);
    const oauthResult = url.searchParams.get('adoption_oauth');
    const returnedAdoptionId = url.searchParams.get('adoption_id');
    if (oauthResult !== 'success' || !returnedAdoptionId) return;

    fetch(`/api/adoptions/${returnedAdoptionId}`)
      .then((r) => r.json())
      .then((saved: any) => {
        if (saved?.id) {
          setAdoption(saved);
          setSelectedMethod(saved.methodType);
          setOauthConnected(true);
          setOauthChecked(true);
          setStep(saved.methodType === 'use_my_google_ads' ? 3 : 4);
        }
      })
      .catch(() => {});

    url.searchParams.delete('adoption_oauth');
    url.searchParams.delete('adoption_id');
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
        // Jump directly to the review/payment step
        setStep(saved.methodType === 'use_my_google_ads' ? 5 : 4);
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

  // Auto-verify customer ID whenever the selection changes
  useEffect(() => {
    if (!selectedGoogleCustomerId || !adoption?.id) {
      setVerifiedCustomerId(null);
      return;
    }
    setVerifiedCustomerId(null);
    setVerifyError(null);
    setIsVerifying(true);
    (async () => {
      try {
        const res = await fetch('/api/google-ads/verify-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adoptionId: adoption.id,
            userId: user?.id || '',
            customerId: selectedGoogleCustomerId,
          }),
        });
        const data = await res.json();
        if (data.verified) {
          setVerifiedCustomerId(selectedGoogleCustomerId);
          setVerifyError(null);
        } else {
          setVerifyError('Account not accessible with your Google credentials.');
        }
      } catch {
        setVerifyError('Verification failed. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    })();
  }, [selectedGoogleCustomerId, adoption?.id]);

  // ── Helpers ───────────────────────────────────────────────────────────────

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
  };

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

      if (adoption?.id) {
        // Draft already exists (use_my_google_ads) — update it with full form data
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
            targetRegions: formData.target_regions || ['Global'],
            targetLanguages: formData.target_languages || ['All'],
            dedicationMessage: formData.dedication_message,
            publicDisplayMode: formData.public_display_mode,
            publicLocationMode: formData.public_location_mode,
            isAnonymous: formData.adopter_type === 'anonymous',
          }),
        });
        currentAdoption = await res.json();
        if (!res.ok) throw new Error(currentAdoption.error || 'Failed to update adoption');
      } else {
        // managed_sufitube — create fresh adoption server-side
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
            targetRegions: formData.target_regions || ['Global'],
            targetLanguages: formData.target_languages || ['All'],
            amountDue: selectedPackage?.amount || formData.custom_budget || 0,
            currency: 'USD',
            adoptionStatus: 'pending_review',
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

      // Register in the Google Ads campaign request tracker for both methods
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
          budgetAmount: formData.custom_budget,
          campaignObjective: formData.campaign_objective || 'awareness',
          targetRegions: formData.target_regions || ['Global'],
          targetLanguages: formData.target_languages || ['All'],
          googleAdsCustomerId: selectedMethod === 'use_my_google_ads'
            ? (selectedGoogleCustomerId || cleanData.google_ads_customer_id)
            : undefined,
          oauthConnected: selectedMethod === 'use_my_google_ads' ? oauthConnected : false,
          methodType: selectedMethod,
          sponsorName: cleanData.full_name,
          sponsorEmail: cleanData.email,
        }),
      }).catch(() => {}); // fire-and-forget — don't block the adoption flow

      setAdoption(currentAdoption);
      setStep(selectedMethod === 'use_my_google_ads' ? 5 : 4);
    } catch (error) {
      console.error('Error submitting adoption:', error);
      setSubmitError('Error submitting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!adoption) return;

    // ── use_my_google_ads: no SufiPulse payment — submit campaign request only ──
    if (selectedMethod === 'use_my_google_ads') {
      setIsSubmitting(true);
      try {
        // Update adoption record: payment not required for this path
        await fetch(`/api/adoptions/${adoption.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            paymentStatus: 'not_required',
            paymentRoute: 'google_ads_billing',
            googleAdsCustomerId: selectedGoogleCustomerId,
            oauthStatus: oauthConnected ? 'connected' : 'not_connected',
            adoptionStatus: 'pending_review',
          }),
        });
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
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
              <svg width="27" height="27" viewBox="0 0 27 27" fill="none" aria-hidden="true">
                <path d="M10.5 7.5L22 13.5L10.5 19.5V7.5Z" fill="#C8A75E"/>
                <path d="M3 22Q5.5 19.5 8 22Q10.5 24.5 13 22Q15.5 19.5 18 22Q20.5 24.5 23 22" stroke="#C8A75E" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
              </svg>
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
          onClick={() => googleAdsEnabled ? handleMethodSelect('use_my_google_ads') : undefined}
          className={`flex flex-col bg-neutral-900 border rounded-2xl transition-all duration-200 select-none ${
            googleAdsEnabled
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
                googleAdsEnabled ? 'text-neutral-100 group-hover:text-blue-400' : 'text-neutral-400'
              }`}>
                Use My Google Ads
              </h4>
              <p className="text-sm text-neutral-400 leading-[1.7]">
                Best for sponsors who want full control of billing and campaign execution using their own Google Ads account, while SufiPulse prepares the campaign structure.
              </p>
            </div>

            <div className="border-t border-neutral-800/80" />

            {googleAdsEnabled ? (
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
                    {googleAdsEnabled === null
                      ? 'Checking availability…'
                      : 'Google Ads integration is being configured. Use Managed by SufiTube in the meantime.'
                    }
                  </p>
                </div>
                <p className="text-xs text-center text-neutral-600">Currently unavailable on this server</p>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );

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

          <button
            onClick={handleBudgetContinue}
            disabled={!formData.custom_budget || formData.custom_budget < 10 || isSubmitting}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Starting…</> : <>Continue to Connect Account <ArrowRight className="w-4 h-4" /></>}
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

  // ── Step 2 for use_my_google_ads: Connect Google Ads Account ─────────────
  const renderGoogleConnect = () => {
    if (!adoption) return null;

    return (
      <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
        <div className="text-center">
          <h3 className="text-2xl font-medium text-neutral-100 mb-2">Connect Your Google Ads Account</h3>
          <p className="text-neutral-500 text-sm leading-relaxed max-w-md mx-auto">
            SufiPulse will prepare the campaign structure for this song. You remain the owner of the Ads account and pay Google directly.
          </p>
        </div>

        {!oauthChecked ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm text-neutral-500">
            <Loader2 className="w-5 h-5 animate-spin" /> Checking connection status…
          </div>

        ) : !oauthConfigured ? (
          // Server is missing required Google Ads env vars — show configuration error
          <div className="border border-red-800/30 bg-red-900/10 rounded-xl p-7 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Settings className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-neutral-200 mb-2">Google Ads Unavailable</h4>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-sm mx-auto">
                Google Ads integration is not configured on this server. Please contact support or choose a different method.
              </p>
            </div>
          </div>

        ) : oauthConnected ? (
          // Connected — show completed 8-state flow + account selector
          <div className="space-y-4">
            {/* Completed progress */}
            <div className="border border-green-800/30 bg-green-900/10 rounded-xl p-5 space-y-2.5">
              {[
                'Not connected',
                'Connecting to Google',
                'Google OAuth passed',
                'Checking Google Ads account',
                `Google Ads account found (${accessibleCustomerIds.length} account${accessibleCustomerIds.length !== 1 ? 's' : ''})`,
                'Select account for this release',
              ].map((label, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-400" />
                  </div>
                  <span className={`text-sm ${i === 5 ? 'text-green-300 font-medium' : 'text-neutral-500'}`}>{label}</span>
                </div>
              ))}
            </div>

            {/* Account selector */}
            {accessibleCustomerIds.length > 0 ? (
              <div className="border border-green-800/30 bg-neutral-900/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-green-400">Google Ads Connected</span>
                  {oauthLastVerified && (
                    <span className="text-xs text-neutral-600 ml-auto">
                      Verified {new Date(oauthLastVerified).toLocaleString()}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Select account for <span className="text-neutral-200">{release?.release_title || 'this release'}</span>
                  </label>
                  <select
                    value={selectedGoogleCustomerId}
                    onChange={(e) => setSelectedGoogleCustomerId(e.target.value)}
                    className="w-full bg-neutral-900 border border-green-800/40 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500"
                  >
                    {accessibleCustomerIds.map((cid) => (
                      <option key={cid} value={cid}>{cid}</option>
                    ))}
                  </select>
                  {isVerifying && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> Verifying account access…
                    </div>
                  )}
                  {!isVerifying && verifiedCustomerId === selectedGoogleCustomerId && selectedGoogleCustomerId && (
                    <div className="flex items-center gap-1.5 text-xs text-green-400 mt-1.5">
                      <Check className="w-3 h-3" /> Account verified
                    </div>
                  )}
                  {!isVerifying && verifyError && (
                    <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5">
                      <X className="w-3 h-3" /> {verifyError}
                    </div>
                  )}
                  {!isVerifying && !verifyError && !verifiedCustomerId && selectedGoogleCustomerId && (
                    <p className="text-xs text-neutral-600 mt-1">
                      Customer ID verified via Google OAuth · This adoption will be linked to this account
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-900/70 rounded-lg px-3 py-2">
                    <div className="text-xs text-neutral-600 mb-0.5">Selected Account</div>
                    <div className="text-neutral-300 font-mono text-xs truncate">{selectedGoogleCustomerId || '—'}</div>
                  </div>
                  <div className="bg-neutral-900/70 rounded-lg px-3 py-2">
                    <div className="text-xs text-neutral-600 mb-0.5">Campaign Target</div>
                    <div className="text-neutral-400 text-xs truncate">{release?.release_title || '—'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-amber-800/30 bg-amber-900/10 rounded-xl p-4 text-sm text-amber-400">
                Connected but no Google Ads accounts found. Ensure your Google account has access to at least one Google Ads customer account.
              </div>
            )}

            <button
              onClick={() => setStep(4)}
              disabled={
                isVerifying ||
                (accessibleCustomerIds.length > 0 && (
                  !selectedGoogleCustomerId ||
                  verifiedCustomerId !== selectedGoogleCustomerId
                ))
              }
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Continue to Sponsor Details <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleGoogleDisconnect}
              disabled={isDisconnecting}
              className="w-full text-xs text-neutral-600 hover:text-red-400 transition-colors py-1"
            >
              {isDisconnecting ? 'Disconnecting…' : 'Disconnect and reconnect a different account'}
            </button>
          </div>

        ) : (
          // OAuth configured, not yet connected — primary CTA
          <div className="space-y-5">
            {/* 8-state progress indicator */}
            <div className="border border-neutral-800 bg-neutral-900/50 rounded-xl p-5 space-y-3">
              {[
                { label: 'Not connected', done: false, active: !isConnectingOAuth },
                { label: 'Connecting to Google', done: false, active: isConnectingOAuth },
                { label: 'Google OAuth passed', done: false, active: false },
                { label: 'Checking Google Ads account', done: false, active: false },
                { label: 'Google Ads account found', done: false, active: false },
                { label: 'Ready to create campaign', done: false, active: false },
                { label: 'Campaign created (PAUSED)', done: false, active: false },
                { label: 'Promotion step completed', done: false, active: false },
              ].map(({ label, active }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-xs ${
                    active ? 'border-blue-400 bg-blue-500/20 text-blue-400' : 'border-neutral-700 text-neutral-700'
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-sm ${active ? 'text-blue-300 font-medium' : 'text-neutral-600'}`}>{label}</span>
                  {active && isConnectingOAuth && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 ml-auto" />}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600 px-1">
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> No spend without your approval</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> You remain account owner</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Revoke access anytime</span>
            </div>

            {submitError && (
              <div className="text-sm text-red-400 border border-red-700/40 bg-red-900/20 rounded-lg px-4 py-3 text-center">
                {submitError}
              </div>
            )}

            <button
              type="button"
              disabled={isConnectingOAuth}
              onClick={async () => {
                setIsConnectingOAuth(true);
                setSubmitError('');
                try {
                  const res = await fetch('/api/google-ads/oauth/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      adoptionId: adoption.id,
                      userId: user?.id,
                      returnSlug: release?.slug || '',
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok || !data.authUrl) {
                    throw new Error(data.error || 'Could not start Google connection');
                  }
                  window.location.href = data.authUrl;
                } catch (err: any) {
                  setSubmitError(err.message || 'Could not start Google connection. Please try again.');
                  setIsConnectingOAuth(false);
                }
              }}
              className="flex w-full items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              {isConnectingOAuth
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Connecting…</>
                : <><Globe className="w-5 h-5" /> Connect Google Ads Account</>
              }
            </button>

            <p className="text-xs text-neutral-700 text-center">
              Uses Google OAuth 2.0 · Scope: Google Ads API (adwords)
            </p>
          </div>
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

      {selectedMethod === 'use_my_google_ads' && (
        <div>
          <label className="block text-sm text-neutral-400 mb-2">Campaign Objective</label>
          <select
            name="campaign_objective"
            value={formData.campaign_objective || 'awareness'}
            onChange={(e) => setFormData(prev => ({ ...prev, campaign_objective: e.target.value as AdoptionFormData['campaign_objective'] }))}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="awareness">Awareness</option>
            <option value="devotional_reach">Devotional Reach</option>
            <option value="community_engagement">Community Engagement</option>
            <option value="event_support">Event Support</option>
            <option value="release_launch_support">Release Launch Support</option>
          </select>
        </div>
      )}

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
        className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
      >
        {isSubmitting ? 'Saving…' : 'Continue to Review'}
      </button>
    </div>
  );

  const renderReview = () => {
    const budget = selectedPackage?.amount || formData.custom_budget || adoption?.amountDue || 0;
    const impact = getImpactPreview(budget);
    const dur = getDuration(budget);
    const ytId = (release?.youtube_video_id || release?.youtubeId || '') as string;

    // ── use_my_google_ads: full campaign review + payment route ──────────────
    if (selectedMethod === 'use_my_google_ads') {
      return (
        <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-300">
          <div className="text-center">
            <h3 className="text-2xl font-medium text-neutral-100 mb-1">Campaign Review</h3>
            <p className="text-sm text-neutral-500">Verify your campaign details before submitting.</p>
          </div>

          <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl px-4 py-3 text-sm text-blue-300">
            You pay Google directly through your own Google Ads billing. SufiPulse does not collect your ad spend.
          </div>

          {/* Campaign details */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800 text-sm">
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Song</span>
              <span className="text-neutral-200 font-medium text-right max-w-[60%] truncate">{release?.release_title || 'Current Release'}</span>
            </div>
            {ytId && (
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-neutral-500">YouTube URL</span>
                <a href={`https://www.youtube.com/watch?v=${ytId}`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono text-xs truncate max-w-[60%]"
                >youtube.com/watch?v={ytId}</a>
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Google Ads Account</span>
              {oauthConnected && selectedGoogleCustomerId ? (
                <span className="flex items-center gap-1.5 text-green-400 font-mono text-xs">
                  <Check className="w-3.5 h-3.5 shrink-0" />{selectedGoogleCustomerId}
                </span>
              ) : (
                <span className="text-red-400 text-xs">Not connected — go back to connect</span>
              )}
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Total Budget</span>
              <span className="text-amber-500 font-bold">${budget}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Est. Duration</span>
              <span className="text-neutral-300">{dur.days} days</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Est. Daily Spend</span>
              <span className="text-neutral-300">~${dur.daily}/day</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-neutral-500">Campaign Objective</span>
              <span className="text-neutral-300 capitalize">{(formData.campaign_objective || 'awareness').replace(/_/g, ' ')}</span>
            </div>
            {impact && (
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-neutral-500">Est. Impressions</span>
                <span className="text-neutral-300">~{impact.min}–{impact.max}</span>
              </div>
            )}
            {formData.dedication_message && (
              <div className="px-5 py-3">
                <span className="text-neutral-500 block text-xs mb-1">Dedication</span>
                <span className="text-neutral-300 italic">"{formData.dedication_message}"</span>
              </div>
            )}
          </div>

          {submitError && (
            <div className="text-sm text-red-400 border border-red-700/40 bg-red-900/20 rounded-lg px-4 py-3 text-center">
              {submitError}
            </div>
          )}

          <button
            onClick={() => { setSubmitError(''); handlePayment(); }}
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
              : <><Check className="w-5 h-5" /> Submit Campaign Request</>}
          </button>
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
                <h4 className="text-neutral-100 font-medium mb-1">Sign in to complete your sponsorship</h4>
                <p className="text-neutral-400 text-sm">Please sign in to complete your sponsorship payment. Your campaign details have been saved.</p>
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
    const isGoogleAds = selectedMethod === 'use_my_google_ads';
    const isGoogleDirect = isGoogleAds;
    const isStripeSufipulse = false;
    const displayCustomerId = selectedGoogleCustomerId || formData.google_ads_customer_id;

    const title = isGoogleDirect
      ? 'Campaign Request Submitted'
      : isStripeSufipulse
        ? 'Payment Confirmed'
        : 'Adoption Complete';

    const description = isGoogleDirect
      ? 'Google Ads account connected. Campaign request submitted. Your Google Ads account will be charged for media spend after admin review and campaign launch — typically 1–2 business days.'
      : isStripeSufipulse
        ? 'Payment confirmed through SufiPulse. Campaign pending review and launch within 1–2 business days.'
        : 'May your contribution bring ease and contemplation to whoever discovers this kalam. Your sponsorship has been recorded and will be reviewed shortly.';

    return (
      <div className="max-w-xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 mx-auto bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10 text-green-500" />
        </div>

        <h3 className="text-3xl font-serif font-light text-neutral-100 mb-2">{title}</h3>
        <p className="text-neutral-400 leading-relaxed mb-8">{description}
        </p>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-left mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart className="w-5 h-5 text-neutral-400" />
            <div className="font-medium text-neutral-200">
              {isGoogleAds ? 'Campaign Request Summary' : 'Adoption Status'}
            </div>
          </div>

          {isGoogleAds && (
            <>
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
                <span className="text-neutral-500 text-sm">Google Ads Account</span>
                {oauthConnected
                  ? <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium"><Check className="w-3.5 h-3.5" /> Connected</span>
                  : <span className="text-red-400 text-sm font-medium">Not Connected</span>}
              </div>
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
                <span className="text-neutral-500 text-sm">Customer ID</span>
                <span className="text-neutral-300 text-sm font-mono">{displayCustomerId || '—'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
                <span className="text-neutral-500 text-sm">Payment Route</span>
                <span className="text-neutral-300 text-sm">
                  {isGoogleDirect ? 'Pay Google Directly' : 'SufiPulse via Stripe'}
                </span>
              </div>
              {campaignResourceName && (
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
                  <span className="text-neutral-500 text-sm">Campaign Resource</span>
                  <span className="text-blue-400 text-xs font-mono truncate max-w-[55%]">{campaignResourceName}</span>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
            <span className="text-neutral-500 text-sm">Campaign Status</span>
            {campaignResourceName
              ? <span className="text-blue-400 text-sm font-medium bg-blue-900/40 px-2 py-0.5 rounded">Created — PAUSED</span>
              : <span className="text-amber-400 text-sm font-medium bg-amber-900/40 px-2 py-0.5 rounded">Pending Review</span>
            }</div>
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
            <span className="text-neutral-500 text-sm">Amount</span>
            <span className="text-neutral-300 text-sm font-medium">
              {isGoogleDirect ? `$${adoption?.amountDue || 0} (billed by Google)` : `$${adoption?.amountDue || 0}`}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
            <span className="text-neutral-500 text-sm">Method</span>
            <span className="text-neutral-300 text-sm font-medium capitalize">
              {selectedMethod?.replaceAll('_', ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-sm">Reference ID</span>
            <span className="text-neutral-500 text-xs font-mono">{adoption?.id?.slice(-12) || '—'}</span>
          </div>
        </div>

        {(release?.youtube_video_id || release?.youtubeId) && (() => {
          const vid = release.youtube_video_id || release.youtubeId;
          const ytUrl = `https://www.youtube.com/watch?v=${vid}`;
          const shareText = encodeURIComponent(`🎵 Just adopted this sacred kalam — listen on YouTube: ${ytUrl}`);
          return (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-left space-y-3">
              <p className="text-sm font-medium text-neutral-200">Help this reach more listeners</p>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Share on YouTube to signal the algorithm and promote this kalam to new audiences.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(ytUrl)}&text=${encodeURIComponent('🎵 Just adopted this sacred kalam on SufiPulse')}&hashtags=SufiMusic,Kalam,SufiPulse`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs text-neutral-300 transition-colors"
                >𝕏 Share on X</a>
                <a
                  href={`https://wa.me/?text=${shareText}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs text-neutral-300 transition-colors"
                >WhatsApp</a>
                <a
                  href={ytUrl}
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

        {isGoogleAds && adoption && oauthConfigured && !oauthConnected && (
          <div className="mt-4 p-4 border border-blue-800/40 bg-blue-900/20 rounded-xl text-center space-y-3">
            <p className="text-sm text-neutral-400">
              Connect your Google Ads account to finalize the campaign setup for this release.
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch('/api/google-ads/oauth/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      adoptionId: adoption.id,
                      userId: user?.id,
                      returnSlug: release?.slug || '',
                    }),
                  });
                  const data = await res.json();
                  if (data.authUrl) window.location.href = data.authUrl;
                } catch {
                  // Ignore — user can try again
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Globe className="w-4 h-4" /> Connect Google Ads Account
            </button>
          </div>
        )}
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
      if (step === 3) return renderGoogleConnect();
      if (step === 4) return renderForm();
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
