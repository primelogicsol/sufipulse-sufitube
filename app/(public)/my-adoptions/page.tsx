'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Music, ArrowRight, Loader2, LogIn } from 'lucide-react';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:                           { label: 'Draft',                color: 'text-neutral-500', bg: 'bg-neutral-800/60' },
  pending_review:                  { label: 'Pending Review',       color: 'text-amber-400',   bg: 'bg-amber-900/20' },
  admin_review:                    { label: 'Admin Review',         color: 'text-amber-400',   bg: 'bg-amber-900/20' },
  campaign_preparation_requested:  { label: 'Campaign Preparing',   color: 'text-amber-400',   bg: 'bg-amber-900/20' },
  approved:                        { label: 'Approved',             color: 'text-green-400',   bg: 'bg-green-900/20' },
  awaiting_user_approval:          { label: 'Awaiting Your Approval', color: 'text-amber-300', bg: 'bg-amber-900/30' },
  google_ads_verified:             { label: 'Ads Verified',         color: 'text-green-400',   bg: 'bg-green-900/20' },
  google_ads_verification_failed:  { label: 'Verification Failed',  color: 'text-red-400',     bg: 'bg-red-900/20' },
  pending_google_ads_manual_review:{ label: 'Ads Manual Review',    color: 'text-amber-400',   bg: 'bg-amber-900/20' },
  scheduled:                       { label: 'Scheduled',            color: 'text-blue-400',    bg: 'bg-blue-900/20' },
  live:                            { label: 'Live',                 color: 'text-green-300',   bg: 'bg-green-900/30' },
  monitoring:                      { label: 'Monitoring',           color: 'text-blue-300',    bg: 'bg-blue-900/20' },
  completed:                       { label: 'Completed',            color: 'text-neutral-300', bg: 'bg-neutral-800/40' },
  report_ready:                    { label: 'Report Ready',         color: 'text-green-300',   bg: 'bg-green-900/30' },
  cancelled:                       { label: 'Cancelled',            color: 'text-red-400',     bg: 'bg-red-900/20' },
};

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

export default function MyAdoptionsPage() {
  const [adoptions, setAdoptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notAuthenticated, setNotAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/adoptions?me=1', { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 401) { setNotAuthenticated(true); return; }
        if (!res.ok) return;
        const data = await res.json();
        const sorted = [...(data || [])].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAdoptions(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (notAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
            <LogIn className="w-7 h-7 text-neutral-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-200">Sign in to view your sponsorships</h2>
          <p className="text-neutral-500 text-sm">Your sponsored songs are linked to your account.</p>
          <Link href="/login">
            <button className="mt-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl transition-colors">
              Sign In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-16 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="mb-10">
          <h1 className="text-3xl font-serif font-light text-neutral-100 mb-2">My Sponsored Songs</h1>
          <p className="text-neutral-500 text-sm">
            Every kalam you've supported — track status, view details, and follow campaign progress.
          </p>
        </div>

        {adoptions.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <Music className="w-7 h-7 text-neutral-600" />
            </div>
            <p className="text-neutral-400 text-base">No sponsored songs yet.</p>
            <p className="text-neutral-600 text-sm max-w-xs mx-auto">
              Visit a release page and choose "Adopt This Song" to sponsor a kalam.
            </p>
            <Link href="/releases">
              <button className="mt-4 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl transition-colors">
                Browse Releases
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {adoptions.map((adoption) => {
              const meta = STATUS_META[adoption.adoptionStatus] || STATUS_META.draft;
              const budget = adoption.amountDue || 0;
              const intention = INTENTION_LABELS[adoption.campaignIntention] || adoption.campaignIntention || '—';
              const isManaged = adoption.methodType === 'managed_sufitube';
              const date = adoption.createdAt
                ? new Date(adoption.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : '—';

              return (
                <div
                  key={adoption.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Music className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span className="text-neutral-200 font-medium text-sm truncate">
                          {adoption.releaseTitle || 'Release'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 ml-6">{date}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${meta.color} ${meta.bg}`}>
                      {meta.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs mb-5">
                    <div>
                      <div className="text-neutral-600 mb-0.5">Method</div>
                      <div className="text-neutral-400">{isManaged ? 'Managed' : 'My Google Ads'}</div>
                    </div>
                    <div>
                      <div className="text-neutral-600 mb-0.5">Amount</div>
                      <div className="text-amber-400 font-semibold">{budget > 0 ? `$${budget}` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-neutral-600 mb-0.5">Intention</div>
                      <div className="text-neutral-400 truncate">{intention}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-5">
                    {(['pending_review', 'approved', 'live', 'completed'] as const).map((s) => {
                      const statuses = [
                        'draft',
                        'pending_review', 'pending_google_ads_manual_review', 'google_ads_verification_pending',
                        'google_ads_verified', 'google_ads_verification_failed',
                        'campaign_preparation_requested', 'admin_review', 'awaiting_user_approval',
                        'approved',
                        'campaign_prepared', 'prepared', 'scheduled',
                        'live', 'monitoring',
                        'completed', 'report_ready',
                      ];
                      const milestones: Record<string, string[]> = {
                        pending_review: ['pending_review', 'pending_google_ads_manual_review', 'google_ads_verification_pending', 'google_ads_verified', 'campaign_preparation_requested', 'admin_review', 'awaiting_user_approval'],
                        approved: ['approved'],
                        live: ['campaign_prepared', 'prepared', 'scheduled', 'live', 'monitoring'],
                        completed: ['completed', 'report_ready'],
                      };
                      const currentIdx = statuses.indexOf(adoption.adoptionStatus);
                      const milestoneStatuses = milestones[s] || [s];
                      const reached = milestoneStatuses.some(
                        (ms) => statuses.indexOf(ms) <= currentIdx && currentIdx >= 0
                      );
                      return (
                        <div
                          key={s}
                          className={`flex-1 h-1 rounded-full transition-colors ${reached ? 'bg-amber-500' : 'bg-neutral-800'}`}
                        />
                      );
                    })}
                  </div>

                  <Link href={`/adopt-song/request/${adoption.id}`}>
                    <button className="w-full flex items-center justify-between px-4 py-2.5 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 hover:border-neutral-600 rounded-xl text-sm text-neutral-300 hover:text-white transition-colors">
                      <span>View Details &amp; Timeline</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
