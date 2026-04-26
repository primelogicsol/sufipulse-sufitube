import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, X, Shield, Globe, CreditCard, CirclePlay as PlayCircle, Settings, Music, ChartBar as BarChart, Loader2 } from 'lucide-react';
import { storage } from '../../../lib/storage';
import { SongAdoption, SongAdoptionPackage, AdoptionFormData } from '../../../types/adoption.types';
import { useFormSecurity } from '../../../hooks/useFormSecurity';
import { adoptionSchema, validateSchema } from '../../../lib/validation-schemas';
import { sanitizeObject } from '../../../lib/sanitize';

interface AdoptTabProps {
  release: any;
}

export function AdoptTab({ release }: AdoptTabProps) {
  const { user } = useAuth();
  const studioGoogleAdsCustomerId = process.env.NEXT_PUBLIC_STUDIO_GOOGLE_ADS_CUSTOMER_ID;

  // ── Steps ────────────────────────────────────────────────────────────────
  // managed_sufitube:   0=intro  1=budget  2=form  3=review  4=success
  // use_my_google_ads:  0=intro  1=budget  2=connect  3=form  4=review  5=success
  const [step, setStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<'managed_sufitube' | 'use_my_google_ads' | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<SongAdoptionPackage | null>(null);
  const [packages, setPackages] = useState<SongAdoptionPackage[]>([]);
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
  const { botCheck, setBotCheck, verifySecurity } = useFormSecurity();
  const [adoption, setAdoption] = useState<SongAdoption | null>(null);

  // Google OAuth state
  const [oauthConnected, setOauthConnected] = useState(false);
  const [oauthChecked, setOauthChecked] = useState(false);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [accessibleCustomerIds, setAccessibleCustomerIds] = useState<string[]>([]);
  const [selectedGoogleCustomerId, setSelectedGoogleCustomerId] = useState('');
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [oauthLastVerified, setOauthLastVerified] = useState<string | null>(null);

  const stripeEnabled = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  // Custom budget modal (managed flow only)
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customModalAmount, setCustomModalAmount] = useState('');
  const [customModalError, setCustomModalError] = useState('');

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    storage.initializeAdoptionPackages().then(() =>
      storage.getSongAdoptionPackages().then(p => setPackages(p.filter(x => x.is_active)))
    );
  }, []);

  // Restore state after Google OAuth callback redirect
  useEffect(() => {
    const url = new URL(window.location.href);
    const oauthResult = url.searchParams.get('adoption_oauth');
    const returnedAdoptionId = url.searchParams.get('adoption_id');
    if (oauthResult !== 'success' || !returnedAdoptionId) return;

    storage.getSongAdoptionById(returnedAdoptionId).then((saved: any) => {
      if (saved) {
        setAdoption(saved);
        setSelectedMethod(saved.method_type);
        setOauthConnected(true);
        setOauthChecked(true);
        // Return to step 2 (connect step) so user sees connected account and can continue
        setStep(saved.method_type === 'use_my_google_ads' ? 2 : 3);
      }
    });

    url.searchParams.delete('adoption_oauth');
    url.searchParams.delete('adoption_id');
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Poll OAuth status whenever we have an adoption in use_my_google_ads mode
  useEffect(() => {
    if (!adoption?.id || selectedMethod !== 'use_my_google_ads') {
      setOauthConnected(false);
      setOauthChecked(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/adoptions/${adoption.id}/google-oauth/status/`);
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
      } catch {
        setOauthConfigured(false);
        setOauthConnected(false);
      } finally {
        setOauthChecked(true);
      }
    })();
  }, [adoption?.id, selectedMethod]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const successStep = selectedMethod === 'use_my_google_ads' ? 5 : 4;
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
    setOauthLastVerified(null);
  };

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleMethodSelect = (method: 'managed_sufitube' | 'use_my_google_ads') => {
    setSelectedMethod(method);
    setStep(1);
  };

  const handlePackageSelect = (pkg: SongAdoptionPackage) => {
    setSelectedPackage(pkg);
    setFormData(prev => ({ ...prev, selected_package_id: pkg.id }));
    setStep(2);
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
    setStep(2);
  };

  // Creates a minimal draft adoption so we have an adoptionId for the OAuth state param.
  // Called when the user clicks "Continue to Connect Account" from the budget step.
  const handleBudgetContinue = async () => {
    if (!formData.custom_budget || formData.custom_budget < 10) return;
    setIsSubmitting(true);
    try {
      const draft = await storage.createSongAdoption({
        release_id: release.id,
        user_id: user?.id,
        method_type: 'use_my_google_ads',
        adoption_status: 'draft',
        custom_budget: formData.custom_budget,
        currency: 'USD',
        amount_due: formData.custom_budget,
        amount_paid: 0,
        payment_status: 'unpaid',
        campaign_objective: 'awareness',
        target_regions: ['Global'],
        target_languages: ['All'],
        public_display_mode: 'full_name',
        public_location_mode: 'city_country',
        public_listing_approved: false,
        is_anonymous: false,
      });
      setAdoption(draft);
      setStep(2); // go to Connect Google Ads step
    } catch {
      alert('Could not initialise adoption. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    if (!adoption?.id || isDisconnecting) return;
    setIsDisconnecting(true);
    try {
      await fetch(`/api/adoptions/${adoption.id}/google-oauth`, { method: 'DELETE' });
    } finally {
      setOauthConnected(false);
      setOauthChecked(true);
      setAccessibleCustomerIds([]);
      setSelectedGoogleCustomerId('');
      setIsDisconnecting(false);
    }
  };

  const handleFormSubmit = async () => {
    if (!selectedMethod) return;
    setFieldErrors({});

    if (!formData.agree_to_terms || !formData.agree_to_promotional_use) {
      alert('Please accept both consent checkboxes to continue.');
      return;
    }

    if (!verifySecurity()) {
      alert('Security check failed.');
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
      let currentAdoption: SongAdoption;

      if (adoption) {
        // Draft already exists (use_my_google_ads) — update it with full form data
        await storage.updateSongAdoption(adoption.id, {
          adoption_status: 'pending_review',
          campaign_objective: formData.campaign_objective || 'awareness',
          target_regions: formData.target_regions || ['Global'],
          target_languages: formData.target_languages || ['All'],
          audience_type: formData.preferred_audience_region || 'global',
          special_instructions: formData.special_instructions,
          dedication_message: formData.dedication_message,
          sponsor_note: formData.sponsor_note,
          public_display_mode: formData.public_display_mode!,
          public_location_mode: formData.public_location_mode!,
          is_anonymous: formData.adopter_type === 'anonymous',
        });
        currentAdoption = adoption;
      } else {
        // managed_sufitube — create fresh adoption
        currentAdoption = await storage.createSongAdoption({
          release_id: release.id,
          user_id: user?.id,
          method_type: selectedMethod,
          adoption_status: 'pending_review',
          package_id: selectedPackage?.id,
          custom_budget: formData.custom_budget,
          currency: 'USD',
          amount_due: selectedPackage?.amount || formData.custom_budget || 0,
          amount_paid: 0,
          payment_status: 'unpaid',
          campaign_objective: formData.campaign_objective || 'awareness',
          target_regions: formData.target_regions || ['Global'],
          target_languages: formData.target_languages || ['All'],
          audience_type: formData.preferred_audience_region || 'global',
          special_instructions: formData.special_instructions,
          dedication_message: formData.dedication_message,
          sponsor_note: formData.sponsor_note,
          public_display_mode: formData.public_display_mode!,
          public_location_mode: formData.public_location_mode!,
          public_listing_approved: false,
          is_anonymous: formData.adopter_type === 'anonymous',
        });
      }

      await storage.createSongAdoptionSponsor({
        adoption_id: currentAdoption.id,
        full_name: cleanData.full_name!,
        organization_name: cleanData.organization_name,
        email: cleanData.email!,
        phone: cleanData.phone,
        country: cleanData.country!,
        city: cleanData.city,
        adopter_type: cleanData.adopter_type!,
        display_name_resolved:
          cleanData.public_display_mode === 'full_name' ? cleanData.full_name! :
          cleanData.public_display_mode === 'organization' && cleanData.organization_name ? cleanData.organization_name :
          cleanData.public_display_mode === 'initials_only'
            ? `${cleanData.full_name!.split(' ').map((n: string) => n[0]).join('')}.`
            : 'Anonymous',
        initials_resolved: cleanData.full_name!.split(' ').map((n: string) => n[0]).join(''),
      });

      if (selectedMethod === 'use_my_google_ads') {
        await storage.create('song_adoption_google_ads', {
          adoption_id: currentAdoption.id,
          customer_id: selectedGoogleCustomerId || cleanData.google_ads_customer_id,
          oauth_connected: oauthConnected,
          billing_enabled: formData.billing_enabled,
          setup_help_requested: formData.setup_help_requested,
          target_regions: formData.target_regions,
          target_languages: formData.target_languages,
          campaign_goal: formData.campaign_goal,
          auto_generate_copy: formData.auto_generate_copy,
          auto_generate_keywords: formData.auto_generate_keywords,
          asset_suggestions: formData.asset_suggestions,
        });
      }

      await storage.createSongAdoptionEvent({
        adoption_id: currentAdoption.id,
        event_type: 'form_submitted',
        event_label: 'Sponsor information submitted',
        actor_type: user ? 'user' : 'system',
        actor_id: user?.id,
        metadata: { method: selectedMethod, oauth_connected: oauthConnected },
      });

      setAdoption(currentAdoption);
      setStep(selectedMethod === 'use_my_google_ads' ? 4 : 3);
    } catch (error) {
      console.error('Error submitting adoption:', error);
      alert('Error submitting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!adoption) return;
    const nextStep = selectedMethod === 'use_my_google_ads' ? 5 : 4;

    if (selectedMethod === 'use_my_google_ads') {
      setIsSubmitting(true);
      try {
        await storage.updateSongAdoption(adoption.id, {
          payment_status: 'pending',
          adoption_status: 'pending_review',
        });
        await storage.createSongAdoptionEvent({
          adoption_id: adoption.id,
          event_type: 'submitted',
          event_label: 'Google Ads campaign request submitted — pending admin review',
          actor_type: 'user',
          metadata: {
            google_ads_customer_id: selectedGoogleCustomerId,
            oauth_connected: oauthConnected,
          },
        });
        setStep(nextStep);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (adoption.amount_due === 0) {
      await storage.updateSongAdoption(adoption.id, { payment_status: 'paid', adoption_status: 'pending_review' });
      await storage.createSongAdoptionEvent({
        adoption_id: adoption.id,
        event_type: 'payment_completed',
        event_label: 'Free adoption method (no payment required)',
        actor_type: 'system',
        metadata: {},
      });
      setStep(nextStep);
      return;
    }

    if (!stripeEnabled) {
      alert('Payment system is currently unavailable. Please contact support.');
      return;
    }

    setIsRedirectingToStripe(true);
    try {
      const res = await fetch(`/api/adoptions/${adoption.id}/checkout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUSD: adoption.amount_due,
          releaseTitle: release?.release_title,
          sponsorName: formData.full_name,
          sponsorEmail: formData.email,
          methodType: adoption.method_type,
          packageName: selectedPackage?.package_name,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Checkout failed');
      window.location.href = body.url;
    } catch (err: any) {
      alert(`Payment error: ${err.message}`);
      setIsRedirectingToStripe(false);
    }
  };

  // ── Renderers ─────────────────────────────────────────────────────────────

  const renderIntro = () => (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h3 className="text-3xl font-serif font-light text-neutral-100 mb-4">Adopt This Song</h3>
        <p className="text-neutral-400 text-lg leading-relaxed mb-6">
          Help this kalam reach hearts that need it. Choose how you want to sponsor the spread of this piece.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <button
          onClick={() => handleMethodSelect('managed_sufitube')}
          className="flex flex-col text-left p-8 bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-xl transition-all group hover:bg-neutral-800/80"
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
            <Shield className="w-6 h-6 text-amber-500" />
          </div>
          <h4 className="text-2xl font-medium text-neutral-100 mb-3 group-hover:text-amber-400 transition-colors">Managed by SufiTube</h4>
          <p className="text-neutral-400 flex-1 mb-6">
            We handle everything. Choose your budget, and we'll run the promotion from our managed systems using best practices.
          </p>
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <Check className="w-4 h-4 text-green-500" /> Easiest setup
            <span className="mx-2">·</span>
            <Check className="w-4 h-4 text-green-500" /> We manage campaign execution
          </div>
          {studioGoogleAdsCustomerId && (
            <div className="mt-3 text-xs text-neutral-600">Studio Ads ID: {studioGoogleAdsCustomerId}</div>
          )}
        </button>

        <button
          onClick={() => handleMethodSelect('use_my_google_ads')}
          className="flex flex-col text-left p-8 bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 rounded-xl transition-all group hover:bg-neutral-800/80"
        >
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
            <Settings className="w-6 h-6 text-blue-500" />
          </div>
          <h4 className="text-2xl font-medium text-neutral-100 mb-3 group-hover:text-blue-400 transition-colors">Use My Google Ads</h4>
          <p className="text-neutral-400 flex-1 mb-6">
            Connect your own Google Ads account. We prepare the campaign structure for this song — you remain the account owner and pay Google directly.
          </p>
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <Check className="w-4 h-4 text-green-500" /> Full ownership
            <span className="mx-2">·</span>
            <Check className="w-4 h-4 text-green-500" /> Pay Google directly
          </div>
        </button>
      </div>
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
          // Admin config error — shown to user, not a fake manual path
          <div className="border border-red-800/40 bg-red-900/10 rounded-xl p-6 text-center space-y-4">
            <div className="w-10 h-10 mx-auto rounded-full bg-red-900/30 flex items-center justify-center">
              <X className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-red-300 mb-1">Google Ads integration not configured</div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                This feature is not available yet. Please contact the site administrator to complete the Google Ads API setup before proceeding.
              </p>
            </div>
            <p className="text-xs text-neutral-700 font-mono border border-neutral-800 rounded px-3 py-2 text-left">
              Required server variables:<br />
              GOOGLE_ADS_CLIENT_ID<br />
              GOOGLE_ADS_CLIENT_SECRET<br />
              GOOGLE_ADS_DEVELOPER_TOKEN
            </p>
          </div>

        ) : oauthConnected ? (
          // Connected — show account selector and continue
          <div className="space-y-4">
            <div className="border border-green-800/40 bg-green-900/10 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-green-400">Google Ads Connected</div>
                  {oauthLastVerified && (
                    <div className="text-xs text-neutral-600">
                      Verified {new Date(oauthLastVerified).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {accessibleCustomerIds.length > 0 ? (
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Select Google Ads account for this campaign
                  </label>
                  <select
                    value={selectedGoogleCustomerId}
                    onChange={(e) => setSelectedGoogleCustomerId(e.target.value)}
                    className="w-full bg-neutral-900/70 border border-green-800/40 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500"
                  >
                    {accessibleCustomerIds.map((cid) => (
                      <option key={cid} value={cid}>{cid}</option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-600 mt-1">Customer ID retrieved and verified via Google OAuth</p>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-900/50 rounded-lg px-3 py-2">
                  <div className="text-xs text-neutral-600 mb-0.5">Account</div>
                  <div className="text-neutral-300 font-mono text-xs truncate">{selectedGoogleCustomerId || '—'}</div>
                </div>
                <div className="bg-neutral-900/50 rounded-lg px-3 py-2">
                  <div className="text-xs text-neutral-600 mb-0.5">Status</div>
                  <div className="text-green-400 text-xs font-semibold">Verified</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={accessibleCustomerIds.length > 0 && !selectedGoogleCustomerId}
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
            <div className="border border-neutral-800 bg-neutral-900/50 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    Click below to open Google's secure login. After granting access, your accessible Google Ads accounts will be listed here for selection.
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
                    <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> No spend without your approval</span>
                    <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> You remain account owner</span>
                    <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Revoke access anytime</span>
                  </div>
                </div>
              </div>
            </div>

            <a
              href={`/api/adoptions/${adoption.id}/google-oauth?returnSlug=${encodeURIComponent(release?.slug || '')}`}
              className="flex w-full items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              <Globe className="w-5 h-5" />
              Connect Google Ads Account
            </a>

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

      <div>
        <label className="block text-sm text-neutral-400 mb-2">Dedication Message (Optional)</label>
        <textarea
          name="dedication_message"
          value={formData.dedication_message || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, dedication_message: e.target.value }))}
          className={`w-full bg-neutral-900 border ${fieldErrors.dedication_message ? 'border-red-500' : 'border-neutral-800'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 h-24`}
          placeholder="Share the intention behind your sponsorship…"
        />
      </div>

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

      <button
        onClick={handleFormSubmit}
        disabled={isSubmitting || !formData.agree_to_terms || !formData.agree_to_promotional_use}
        className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
      >
        {isSubmitting ? 'Saving…' : 'Continue to Review'}
      </button>
    </div>
  );

  const renderReview = () => {
    const budget = selectedPackage?.amount || formData.custom_budget || adoption?.amount_due || 0;
    const impact = getImpactPreview(budget);

    return (
      <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-300">
        <h3 className="text-2xl font-medium text-neutral-100 mb-6 text-center">Review Your Campaign</h3>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <Music className="w-4 h-4 text-amber-500" />
            <span className="text-neutral-200 font-medium">{release?.release_title || 'Current Release'}</span>
          </div>

          {selectedMethod === 'use_my_google_ads' && (
            <div className="flex items-center justify-between py-2 border-b border-neutral-800">
              <span className="text-sm text-neutral-500">Google Ads Account</span>
              {oauthConnected && selectedGoogleCustomerId ? (
                <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                  <Check className="w-3.5 h-3.5" />
                  {selectedGoogleCustomerId}
                </span>
              ) : (
                <span className="text-amber-400 text-sm">Pending verification</span>
              )}
            </div>
          )}

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

        {selectedMethod === 'use_my_google_ads' ? (
          <button
            onClick={handlePayment}
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
              : <><Check className="w-5 h-5" /> Submit Campaign Request</>}
          </button>
        ) : (
          <>
            {!stripeEnabled && (
              <div className="text-sm text-red-400 border border-red-700/40 bg-red-900/20 rounded-lg px-4 py-3 text-center">
                Payment system unavailable. Contact support to complete your sponsorship.
              </div>
            )}
            <button
              onClick={handlePayment}
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
    const displayCustomerId = selectedGoogleCustomerId || formData.google_ads_customer_id;
    return (
      <div className="max-w-xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 mx-auto bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10 text-green-500" />
        </div>

        <h3 className="text-3xl font-serif font-light text-neutral-100 mb-2">
          {isGoogleAds ? 'Campaign Request Submitted' : 'Adoption Complete'}
        </h3>
        <p className="text-neutral-400 leading-relaxed mb-8">
          {isGoogleAds
            ? 'Your adoption has been recorded. Your connected Google Ads account and campaign request are pending SufiPulse review before launch.'
            : 'May your contribution bring ease and contemplation to whoever discovers this kalam. Your sponsorship has been recorded and will be reviewed shortly.'}
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
                  : <span className="text-amber-400 text-sm font-medium">Pending Verification</span>}
              </div>
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
                <span className="text-neutral-500 text-sm">Customer ID</span>
                <span className="text-neutral-300 text-sm font-mono">{displayCustomerId || '—'}</span>
              </div>
            </>
          )}

          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
            <span className="text-neutral-500 text-sm">Campaign Status</span>
            <span className="text-amber-400 text-sm font-medium bg-amber-900/40 px-2 py-0.5 rounded">Pending Review</span>
          </div>
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
            <span className="text-neutral-500 text-sm">Amount</span>
            <span className="text-neutral-300 text-sm font-medium">${adoption?.amount_due || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-sm">Method</span>
            <span className="text-neutral-300 text-sm font-medium capitalize">
              {selectedMethod?.replaceAll('_', ' ')}
            </span>
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
              Connect your Google Ads account to finalize the campaign setup.
            </p>
            <a
              href={`/api/adoptions/${adoption.id}/google-oauth?returnSlug=${encodeURIComponent(release?.slug || '')}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Connect Google Ads Account
            </a>
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
    if (step === 1) return renderPackageSelection();
    if (selectedMethod === 'use_my_google_ads') {
      if (step === 2) return renderGoogleConnect();
      if (step === 3) return renderForm();
      if (step === 4) return renderReview();
      if (step === 5) return renderSuccess();
    } else {
      if (step === 2) return renderForm();
      if (step === 3) return renderReview();
      if (step === 4) return renderSuccess();
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
                Step {step} <span className="text-neutral-700">of 4</span>
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
