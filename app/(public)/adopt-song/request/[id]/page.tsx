'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Clock, Loader2, AlertCircle, Music, ArrowLeft } from 'lucide-react';

const TIMELINE_STEPS = [
  { key: 'submitted',        label: 'Submitted',        detail: 'Your sponsorship request has been received.' },
  { key: 'payment_received', label: 'Payment Received', detail: 'Payment confirmed and recorded.' },
  { key: 'under_review',     label: 'Under Review',     detail: 'Our team is reviewing your campaign brief.' },
  { key: 'prepared',         label: 'Prepared',         detail: 'Campaign structure is ready for launch.' },
  { key: 'live',             label: 'Live',             detail: 'Your campaign is running and reaching listeners.' },
  { key: 'monitoring',       label: 'Monitoring',       detail: 'Campaign performance is being tracked.' },
  { key: 'completed',        label: 'Completed',        detail: 'Campaign has finished its run.' },
  { key: 'report_ready',     label: 'Report Ready',     detail: 'Your performance report is available.' },
] as const;

type TimelineKey = typeof TIMELINE_STEPS[number]['key'];

function resolveTimelineStep(adoption: any): TimelineKey {
  const status: string = adoption?.adoptionStatus || 'draft';
  const payment: string = adoption?.paymentStatus || 'unpaid';
  const methodType: string = adoption?.methodType || '';

  if (status === 'report_ready') return 'report_ready';
  if (status === 'completed' && adoption?.reportUrl) return 'report_ready';
  if (status === 'completed') return 'completed';
  if (status === 'monitoring') return 'monitoring';
  if (status === 'live') {
    const created = new Date(adoption.updatedAt || adoption.createdAt).getTime();
    return Date.now() - created > 3 * 86400000 ? 'monitoring' : 'live';
  }
  if (['scheduled', 'campaign_prepared', 'awaiting_user_approval', 'approved'].includes(status)) return 'prepared';
  if (['admin_review', 'google_ads_verified', 'pending_google_ads_manual_review', 'google_ads_verification_failed'].includes(status)) return 'under_review';
  if (status === 'campaign_preparation_requested') return 'payment_received';
  if (status === 'pending_review') {
    if (payment === 'paid' || methodType === 'use_my_google_ads') return 'under_review';
    return 'payment_received';
  }
  return 'submitted';
}

const INTENTION_LABELS: Record<string, string> = {
  spiritual_reflection:   'Spiritual Reflection',
  ramadan_sacred_season:  'Ramadan / Sacred Season',
  kashmiri_sufi_audience: 'Kashmiri Sufi Audience',
  urdu_hindi_listeners:   'Urdu / Hindi Listeners',
  global_sufi_seekers:    'Global Sufi Seekers',
  youth_new_listeners:    'Youth & New Listeners',
  diaspora_outreach:      'Diaspora Outreach',
  general_awareness:      'General Awareness',
  memorial_dedication:    'Memorial / Dedication',
  institutional_support:  'Institutional Support',
  awareness:              'General Awareness',
  devotional_reach:       'Devotional Reach',
  community_engagement:   'Community Engagement',
  event_support:          'Event Support',
  release_launch_support: 'Release Launch Support',
};

export default function AdoptionTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [adoption, setAdoption] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetch(`/api/adoptions/${id}`)
      .then((res) => res.ok ? res.json() : null)
      .then((record) => { setAdoption(record || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!adoption) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-neutral-600 mx-auto" />
          <h2 className="text-xl font-semibold text-neutral-300">Sponsorship not found</h2>
          <p className="text-neutral-500 text-sm">
            Reference ID: <span className="font-mono text-neutral-400">{id}</span>
          </p>
          <p className="text-neutral-600 text-xs">
            Contact us at{' '}
            <a href="mailto:support@sufipulse.com" className="text-amber-500 hover:underline">
              support@sufipulse.com
            </a>{' '}
            and quote your reference ID.
          </p>
          <Link href="/">
            <button className="mt-2 px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-sm transition-colors">
              Return Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = resolveTimelineStep(adoption);
  const currentIndex = TIMELINE_STEPS.findIndex(s => s.key === currentStep);
  const budget = adoption.amountDue || 0;
  const intention = INTENTION_LABELS[adoption.campaignIntention] || adoption.campaignIntention || '—';
  const isManaged = adoption.methodType === 'managed_sufitube';

  return (
    <div className="min-h-screen bg-neutral-950 py-16 px-4">
      <div className="max-w-xl mx-auto space-y-8">

        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-400 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Return Home
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Music className="w-4 h-4 text-amber-400" />
            </div>
            <h1 className="text-xl font-semibold text-neutral-100">Sponsorship Tracker</h1>
          </div>
          <p className="text-sm text-neutral-500 ml-11">Reference: <span className="font-mono text-neutral-400">{id?.slice(-12)}</span></p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-3 text-sm">
          {adoption.releaseTitle && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Song</span>
              <span className="text-neutral-200 font-medium text-right max-w-[60%] truncate">{adoption.releaseTitle}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-500">Method</span>
            <span className="text-neutral-300">{isManaged ? 'Managed by SufiPulse' : 'My Google Ads Account'}</span>
          </div>
          {budget > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Amount</span>
              <span className="text-amber-400 font-semibold">${budget}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-500">Intention</span>
            <span className="text-neutral-300">{intention}</span>
          </div>
          {adoption.dedicationMessage && (
            <div className="pt-2 border-t border-neutral-800">
              <span className="text-neutral-600 text-xs block mb-1">Dedication</span>
              <span className="text-neutral-400 italic text-xs">"{adoption.dedicationMessage}"</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">Status Timeline</h2>
          <div className="relative">
            <div className="absolute left-4 top-4 bottom-4 w-px bg-neutral-800" />
            <div className="space-y-0">
              {TIMELINE_STEPS.map((step, i) => {
                const done = i < currentIndex;
                const active = i === currentIndex;
                const future = i > currentIndex;
                return (
                  <div key={step.key} className="relative flex items-start gap-4 pb-6 last:pb-0">
                    <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      done   ? 'border-green-500 bg-green-500/20'  :
                      active ? 'border-amber-400 bg-amber-400/15'  :
                               'border-neutral-700 bg-neutral-950'
                    }`}>
                      {done   ? <Check className="w-3.5 h-3.5 text-green-400" /> :
                       active ? <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> :
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />}
                    </div>
                    <div className={`pt-1 ${future ? 'opacity-30' : ''}`}>
                      <div className={`text-sm font-medium ${
                        done ? 'text-neutral-300' : active ? 'text-amber-300' : 'text-neutral-600'
                      }`}>
                        {step.label}
                        {active && <span className="ml-2 text-xs font-normal text-amber-500/70 bg-amber-500/10 px-2 py-0.5 rounded-full">Current</span>}
                      </div>
                      {(done || active) && (
                        <p className="text-xs text-neutral-600 mt-0.5">{step.detail}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 text-sm text-neutral-400 leading-relaxed">
          {currentStep === 'submitted' && 'Your sponsorship has been submitted. Complete your payment to move to the next stage.'}
          {currentStep === 'payment_received' && 'Payment received. Our team will review your campaign brief within 1–2 business days.'}
          {currentStep === 'under_review' && 'Your campaign is under review. We will prepare the targeting and ad structure shortly.'}
          {currentStep === 'prepared' && 'Campaign is prepared and awaiting launch. You will be notified once it goes live.'}
          {currentStep === 'live' && 'Your campaign is live and reaching listeners right now.'}
          {currentStep === 'monitoring' && 'Campaign is in its monitoring phase. Performance data is being collected.'}
          {currentStep === 'completed' && 'Your campaign has completed. A detailed report will be prepared for you.'}
          {currentStep === 'report_ready' && 'Your performance report is ready. Thank you for supporting this kalam.'}
        </div>

        <p className="text-xs text-center text-neutral-700">
          Questions? Email{' '}
          <a href="mailto:support@sufipulse.com" className="text-amber-600 hover:underline">
            support@sufipulse.com
          </a>{' '}
          with reference ID{' '}
          <span className="font-mono">{id?.slice(-12)}</span>
        </p>
      </div>
    </div>
  );
}
