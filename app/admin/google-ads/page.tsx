'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge } from '../../components/primitives/Badge';
import {
  Search, Check, X, RefreshCw, Loader2, AlertCircle,
  DollarSign, Target, ExternalLink, Clock, CheckCircle2,
  MessageSquare, Rocket, ChevronDown, ChevronUp, User, Link2, Unlink,
} from 'lucide-react';
import type { GoogleAdsCampaignRequest, CampaignRequestStatus } from '../../lib/server/google-ads-campaign-request-store';

type StudioStatus = {
  connected: boolean;
  customerId: string | null;
  expiresAt: string | null;
  updatedAt: string | null;
};

type ActionLoading = { adoptionId: string; action: string } | null;

const STATUS_LABELS: Record<CampaignRequestStatus, { label: string; color: string }> = {
  pending_review:        { label: 'Pending Review',        color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  pending_manual_review: { label: 'Manual Review Required', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  approved:              { label: 'Approved',               color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  rejected:              { label: 'Rejected',               color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  changes_requested:     { label: 'Changes Requested',      color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  campaign_created:      { label: 'Campaign Created',       color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  campaign_failed:       { label: 'Campaign Failed',        color: 'bg-red-700/20 text-red-300 border-red-700/30' },
};

function StatusBadge({ status }: { status: CampaignRequestStatus }) {
  const { label, color } = STATUS_LABELS[status] ?? { label: status, color: 'bg-neutral-800 text-neutral-400 border-neutral-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
}

export default function AdminGoogleAdsPage() {
  const [requests, setRequests] = useState<GoogleAdsCampaignRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<ActionLoading>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignRequestStatus | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});
  const [createForm, setCreateForm] = useState<Record<string, { youtubeId: string; customerId: string; budget: string }>>({});
  const [actionResult, setActionResult] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [studioStatus, setStudioStatus] = useState<StudioStatus | null>(null);
  const [connectingStudio, setConnectingStudio] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/google-ads/campaign-requests', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStudioStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/google-ads/studio-status', { credentials: 'include' });
      if (!res.ok) return;
      setStudioStatus(await res.json());
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => { loadRequests(); loadStudioStatus(); }, [loadRequests, loadStudioStatus]);

  const handleConnectStudio = async () => {
    setConnectingStudio(true);
    try {
      const res = await fetch('/api/admin/google-ads/studio-oauth/start', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start OAuth');
      window.location.href = data.authUrl;
    } catch (err: any) {
      setOauthError(`Could not start OAuth: ${err.message}`);
      setConnectingStudio(false);
    }
  };

  const doAction = async (
    adoptionId: string,
    action: 'approve' | 'reject' | 'request_changes' | 'create_campaign',
    extra?: Record<string, unknown>
  ) => {
    setActionLoading({ adoptionId, action });
    setActionResult((prev) => ({ ...prev, [adoptionId]: { ok: true, msg: '' } }));
    try {
      const res = await fetch('/api/admin/google-ads/campaign-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          adoptionId,
          action,
          adminNote: adminNote[adoptionId] || undefined,
          ...extra,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setActionResult((prev) => ({ ...prev, [adoptionId]: { ok: true, msg: 'Done.' } }));
      await loadRequests();
    } catch (e: any) {
      setActionResult((prev) => ({ ...prev, [adoptionId]: { ok: false, msg: e.message } }));
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = requests.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.releaseTitle?.toLowerCase().includes(q) ||
      r.sponsorName?.toLowerCase().includes(q) ||
      r.sponsorEmail?.toLowerCase().includes(q) ||
      r.googleAdsCustomerId?.includes(q) ||
      r.adoptionId.includes(q);
    return matchesStatus && matchesSearch;
  });

  const counts = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {oauthError && (
          <div className="p-3 rounded-lg text-sm flex items-center justify-between gap-2 bg-red-500/10 border border-red-500/25 text-red-400">
            <span>{oauthError}</span>
            <button type="button" onClick={() => setOauthError(null)} className="shrink-0 opacity-50 hover:opacity-100 text-lg leading-none">×</button>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-100">Google Ads Campaign Requests</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Review, approve, and launch Google Ads campaigns for song adoptions.
            </p>
          </div>
          <button
            onClick={loadRequests}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Studio Account Status */}
        <div className={`flex items-center justify-between px-5 py-4 rounded-xl border ${
          studioStatus?.connected
            ? 'bg-green-500/5 border-green-500/20'
            : 'bg-amber-500/5 border-amber-500/20'
        }`}>
          <div className="flex items-center gap-3">
            {studioStatus?.connected
              ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              : <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            }
            <div>
              <p className="text-sm font-medium text-neutral-200">
                SufiTube Managed Account
                {studioStatus?.customerId && (
                  <span className="ml-2 text-xs text-neutral-500 font-normal">ID: {studioStatus.customerId}</span>
                )}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {studioStatus?.connected
                  ? `Connected · token expires ${studioStatus.expiresAt ? new Date(studioStatus.expiresAt).toLocaleString() : 'unknown'}`
                  : 'Not connected — managed_sufitube campaigns cannot be created until this account is linked'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleConnectStudio}
            disabled={connectingStudio}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-neutral-900 font-semibold rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {connectingStudio
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
              : studioStatus?.connected
                ? <><Link2 className="w-4 h-4" /> Reconnect</>
                : <><Link2 className="w-4 h-4" /> Connect Account</>
            }
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total',    key: 'all',              count: requests.length },
            { label: 'Pending',  key: 'pending_review',   count: counts.pending_review ?? 0 },
            { label: 'Approved', key: 'approved',          count: counts.approved ?? 0 },
            { label: 'Created',  key: 'campaign_created',  count: counts.campaign_created ?? 0 },
            { label: 'Rejected', key: 'rejected',          count: counts.rejected ?? 0 },
            { label: 'Failed',   key: 'campaign_failed',   count: counts.campaign_failed ?? 0 },
          ].map(({ label, key, count }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key as any)}
              className={`text-left p-3 rounded-xl border transition-colors ${
                statusFilter === key
                  ? 'border-amber-500/50 bg-amber-500/10'
                  : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
              }`}
            >
              <div className="text-2xl font-bold text-neutral-100">{count}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{label}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by release, sponsor, customer ID…"
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-300 focus:outline-none"
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-neutral-600">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading requests…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-neutral-600">
            <Target className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No campaign requests found.</p>
            <p className="text-xs mt-1 text-neutral-700">
              Requests appear when sponsors choose "Use My Google Ads" on a release page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => {
              const isExpanded = expanded === req.adoptionId;
              const form = createForm[req.adoptionId] ?? { youtubeId: req.youtubeVideoId ?? '', customerId: req.googleAdsCustomerId ?? '', budget: String(req.budgetAmount) };
              const result = actionResult[req.adoptionId];
              const isActing = actionLoading?.adoptionId === req.adoptionId;

              return (
                <div
                  key={req.adoptionId}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden"
                >
                  {/* Row header */}
                  <div
                    className="flex items-start gap-4 p-5 cursor-pointer hover:bg-neutral-800/30 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : req.adoptionId)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-neutral-100 truncate">
                          {req.releaseTitle || req.releaseId}
                        </span>
                        <StatusBadge status={req.status} />
                        {req.oauthConnected && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> OAuth Connected
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {req.sponsorName || 'Anonymous'} · {req.sponsorEmail || '—'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          ${req.budgetAmount} {req.currency}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" />
                          {req.campaignObjective}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {req.releaseSlug && (
                        <a
                          href={`/release-detail/${req.releaseSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-neutral-800 p-5 space-y-5">

                      {/* Details grid */}
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-neutral-500 mb-0.5">Adoption ID</p>
                          <code className="text-neutral-300 text-xs break-all">{req.adoptionId}</code>
                        </div>
                        <div>
                          <p className="text-neutral-500 mb-0.5">Method</p>
                          <span className={`text-sm font-medium ${req.methodType === 'managed_sufitube' ? 'text-amber-400' : 'text-blue-400'}`}>
                            {req.methodType === 'managed_sufitube' ? 'Managed by SufiTube' : 'Use My Google Ads'}
                          </span>
                        </div>
                        {req.methodType !== 'managed_sufitube' && (
                          <div>
                            <p className="text-neutral-500 mb-0.5">Google Ads Customer ID</p>
                            <span className="text-neutral-300">{req.googleAdsCustomerId || '—'}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-neutral-500 mb-0.5">Target Regions</p>
                          <span className="text-neutral-300">{req.targetRegions.join(', ')}</span>
                        </div>
                        <div>
                          <p className="text-neutral-500 mb-0.5">Target Languages</p>
                          <span className="text-neutral-300">{req.targetLanguages.join(', ')}</span>
                        </div>
                        <div>
                          <p className="text-neutral-500 mb-0.5">YouTube Video ID</p>
                          <span className="text-neutral-300">{req.youtubeVideoId || '—'}</span>
                        </div>
                        <div>
                          <p className="text-neutral-500 mb-0.5">Campaign Resource</p>
                          <code className="text-neutral-300 text-xs break-all">{req.campaignResourceName || '—'}</code>
                        </div>
                      </div>

                      {/* Admin note */}
                      {req.adminNote && (
                        <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-lg px-4 py-3">
                          <p className="text-xs text-neutral-500 mb-1">Admin note</p>
                          <p className="text-sm text-neutral-300">{req.adminNote}</p>
                        </div>
                      )}

                      {/* Event timeline */}
                      {req.events && req.events.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Event History</p>
                          <div className="space-y-2">
                            {req.events.map((ev) => (
                              <div key={ev.id} className="flex items-start gap-3 text-sm">
                                <span className="text-neutral-600 text-xs mt-0.5 w-24 flex-shrink-0">
                                  {new Date(ev.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded text-xs capitalize flex-shrink-0">
                                  {ev.eventType.replace(/_/g, ' ')}
                                </span>
                                {ev.message && <span className="text-neutral-400">{ev.message}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action result */}
                      {result?.msg && (
                        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
                          result.ok
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                          {result.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          {result.msg}
                        </div>
                      )}

                      {/* Admin note input */}
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1.5">Admin Note (optional)</label>
                        <textarea
                          value={adminNote[req.adoptionId] ?? ''}
                          onChange={(e) => setAdminNote((p) => ({ ...p, [req.adoptionId]: e.target.value }))}
                          rows={2}
                          placeholder="Note to include with this action…"
                          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500/40 resize-none"
                        />
                      </div>

                      {/* Quick action buttons */}
                      {req.status !== 'campaign_created' && (
                        <div className="flex flex-wrap gap-2">
                          {req.status !== 'approved' && (
                            <button
                              disabled={isActing}
                              onClick={() => doAction(req.adoptionId, 'approve')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-sm rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {isActing && actionLoading?.action === 'approve' ? 'Approving…' : 'Approve'}
                            </button>
                          )}
                          {req.status !== 'rejected' && (
                            <button
                              disabled={isActing}
                              onClick={() => doAction(req.adoptionId, 'reject')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm rounded-lg transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              {isActing && actionLoading?.action === 'reject' ? 'Rejecting…' : 'Reject'}
                            </button>
                          )}
                          <button
                            disabled={isActing}
                            onClick={() => doAction(req.adoptionId, 'request_changes')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm rounded-lg transition-colors disabled:opacity-50"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Request Changes
                          </button>
                        </div>
                      )}

                      {/* Create Campaign panel */}
                      {(req.status === 'approved' || req.status === 'campaign_failed') && (
                        <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-xl p-4 space-y-4">
                          <p className="text-sm font-semibold text-neutral-300">
                            <Rocket className="w-4 h-4 inline-block mr-1.5 text-blue-400" />
                            Launch Google Ads Campaign
                          </p>

                          <div className="grid sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">YouTube Video ID</label>
                              <input
                                value={form.youtubeId}
                                onChange={(e) => setCreateForm((p) => ({ ...p, [req.adoptionId]: { ...form, youtubeId: e.target.value } }))}
                                placeholder="e.g. dQw4w9WgXcQ"
                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none"
                              />
                            </div>
                            {req.methodType !== 'managed_sufitube' && (
                              <div>
                                <label className="block text-xs text-neutral-500 mb-1">Google Ads Customer ID</label>
                                <input
                                  value={form.customerId}
                                  onChange={(e) => setCreateForm((p) => ({ ...p, [req.adoptionId]: { ...form, customerId: e.target.value } }))}
                                  placeholder="e.g. 123-456-7890"
                                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none"
                                />
                              </div>
                            )}
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">Budget (USD)</label>
                              <input
                                type="number"
                                value={form.budget}
                                onChange={(e) => setCreateForm((p) => ({ ...p, [req.adoptionId]: { ...form, budget: e.target.value } }))}
                                placeholder="e.g. 100"
                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none"
                              />
                            </div>
                          </div>

                          <button
                            disabled={isActing || !form.youtubeId || (req.methodType !== 'managed_sufitube' && !form.customerId)}
                            onClick={() =>
                              doAction(req.adoptionId, 'create_campaign', {
                                youtubeVideoId: form.youtubeId,
                                selectedCustomerId: req.methodType === 'managed_sufitube' ? undefined : form.customerId,
                                budgetAmount: Number(form.budget),
                                releaseId: req.releaseId,
                              })
                            }
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isActing && actionLoading?.action === 'create_campaign' ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Creating Campaign…</>
                            ) : (
                              <><Rocket className="w-4 h-4" /> Create Campaign in Google Ads</>
                            )}
                          </button>

                          <p className="text-xs text-neutral-600">
                            {req.methodType === 'managed_sufitube'
                              ? 'Campaign will be created using the SufiTube managed account in PAUSED state.'
                              : 'Campaign will be created in PAUSED state. Activate it in Google Ads Manager after review.'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
