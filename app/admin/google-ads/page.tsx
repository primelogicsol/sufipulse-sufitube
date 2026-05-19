'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge } from '../../components/primitives/Badge';
import {
  Search, Check, X, RefreshCw, Loader2, AlertCircle,
  DollarSign, Target, ExternalLink, Clock, CheckCircle2,
  MessageSquare, Rocket, ChevronDown, ChevronUp, User, Link2, Unlink,
  ShieldCheck, Activity, Database, AlertTriangle, Fingerprint, List, Network
} from 'lucide-react';
import type { GoogleAdsCampaignRequest, CampaignRequestStatus } from '../../lib/server/google-ads-campaign-request-store';

type VerificationResult = {
  oauth: { connected: boolean; valid: boolean; tokenExpired: boolean; hasRefreshToken: boolean; googleEmail: string | null };
  account: { customerId: string | null; exists: boolean; accessible: boolean; viaMcc: boolean };
  suspension?: { isSuspended: boolean; reason?: string | null };
  timestamp: string;
};

type HierarchyAccount = {
  resourceName: string;
  customerId: string;
  formattedId: string;
};

type HierarchyData = {
  success: boolean;
  accounts: HierarchyAccount[];
  configuredIds: {
    loginCustomerId: string | null;
    studioCustomerId: string | null;
  };
  oauthScope: string;
  timestamp: string;
};

type StudioStatus = {
  connected: boolean;
  customerId: string | null;
  expiresAt: string | null;
  updatedAt: string | null;
  verification?: VerificationResult;
  signals?: {
    oauthActive: boolean;
    tokenExpired: boolean;
    tokenExpiring: boolean;
    mccAccessible: boolean;
    accountSuspended: boolean;
    infrastructureHealthy: boolean;
  };
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

function SignalBadge({ active, label, warning = false, error = false }: { active: boolean, label: string, warning?: boolean, error?: boolean }) {
  let color = 'bg-neutral-800/50 text-neutral-500 border-neutral-800';
  if (active) {
    if (error) color = 'bg-red-500/15 text-red-400 border-red-500/30';
    else if (warning) color = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    else color = 'bg-green-500/15 text-green-400 border-green-500/30';
  }
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${color}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${active ? (error ? 'bg-red-400' : (warning ? 'bg-amber-400' : 'bg-green-400')) : 'bg-neutral-600'}`} />
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
  const [createForm, setCreateForm] = useState<Record<string, { youtubeId: string; customerId: string; budget: string; dryRun: boolean }>>({});
  const [actionResult, setActionResult] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [studioStatus, setStudioStatus] = useState<StudioStatus | null>(null);
  const [connectingStudio, setConnectingStudio] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [refreshingDiagnostics, setRefreshingDiagnostics] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [hierarchyData, setHierarchyData] = useState<HierarchyData | null>(null);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  // Load persistence on mount
  useEffect(() => {
    const savedExpanded = localStorage.getItem('googleAds_expanded');
    if (savedExpanded) setExpanded(savedExpanded);

    const savedForms = localStorage.getItem('googleAds_forms');
    if (savedForms) {
      try { setCreateForm(JSON.parse(savedForms)); } catch (e) {}
    }
  }, []);

  // Save persistence on change
  useEffect(() => {
    if (expanded) localStorage.setItem('googleAds_expanded', expanded);
    else localStorage.removeItem('googleAds_expanded');
  }, [expanded]);

  useEffect(() => {
    localStorage.setItem('googleAds_forms', JSON.stringify(createForm));
  }, [createForm]);

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
    setRefreshingDiagnostics(true);
    try {
      const res = await fetch('/api/admin/google-ads/status', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setStudioStatus({
        connected: data.studioAccount?.connected,
        customerId: data.studioAccount?.customerId,
        expiresAt: data.studioAccount?.expiresAt,
        updatedAt: data.studioAccount?.updatedAt,
        verification: data.studioAccount?.verification,
        signals: data.signals
      });
    } catch {
      // non-fatal
    } finally {
      setRefreshingDiagnostics(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/google-ads/logs', { credentials: 'include' });
      if (!res.ok) return;
      setLogs(await res.json());
    } catch {
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const loadHierarchy = useCallback(async () => {
    setLoadingHierarchy(true);
    try {
      const res = await fetch('/api/admin/google-ads/hierarchy', { credentials: 'include' });
      if (!res.ok) return;
      setHierarchyData(await res.json());
    } catch {
    } finally {
      setLoadingHierarchy(false);
    }
  }, []);

  useEffect(() => { 
    loadRequests(); 
    loadStudioStatus(); 
    loadLogs(); 
    loadHierarchy(); 
  }, [loadRequests, loadStudioStatus, loadLogs, loadHierarchy]);

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
      await loadLogs();
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
            <h1 className="text-2xl font-semibold text-neutral-100">Google Ads Operations</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Internal console for managing managed_sufitube infrastructure and sponsor campaign requests.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadStudioStatus}
              disabled={refreshingDiagnostics}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingDiagnostics ? 'animate-spin' : ''}`} /> 
              {refreshingDiagnostics ? 'Running Diagnostics…' : 'Run Infrastructure Check'}
            </button>
            <button
              onClick={loadRequests}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Requests
            </button>
          </div>
        </div>

        {/* Operations Console (Infrastructure Health) */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-neutral-800 bg-neutral-800/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Operations Console</h2>
            </div>
            {studioStatus?.connected && (
              <div className="flex items-center gap-2">
                <SignalBadge active={studioStatus.signals?.oauthActive ?? false} label="OAuth Active" />
                <SignalBadge active={studioStatus.signals?.tokenExpiring ?? false} label="Token Expiring" warning />
                <SignalBadge active={studioStatus.signals?.tokenExpired ?? false} label="Token Expired" error />
                <SignalBadge active={studioStatus.signals?.mccAccessible ?? false} label="MCC Accessible" />
                <SignalBadge active={studioStatus.signals?.accountSuspended ?? false} label="Account Suspended" error />
              </div>
            )}
          </div>
          
          <div className="grid lg:grid-cols-3 gap-0 divide-x divide-neutral-800">
            {/* Managed Account Status */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${studioStatus?.connected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Managed Infrastructure</p>
                  <p className="text-sm font-semibold text-neutral-200">SufiTube Ads Manager</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Connection</span>
                  <span className={studioStatus?.connected ? 'text-green-400' : 'text-red-400'}>
                    {studioStatus?.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Customer ID</span>
                  <span className="text-neutral-200 font-mono">{studioStatus?.customerId || '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Token Expires</span>
                  <span className="text-neutral-200">
                    {studioStatus?.expiresAt ? new Date(studioStatus.expiresAt).toLocaleTimeString() : '—'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleConnectStudio}
                disabled={connectingStudio}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs bg-amber-500 hover:bg-amber-400 text-neutral-900 font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
              >
                {connectingStudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                {studioStatus?.connected ? 'Reconnect Manager' : 'Link Managed Account'}
              </button>
            </div>

            {/* Verification Matrix Details */}
            <div className="p-6 lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Verification Matrix</h3>
              </div>
              
              {!studioStatus?.verification ? (
                <div className="h-32 flex items-center justify-center border border-dashed border-neutral-800 rounded-xl text-xs text-neutral-600">
                  Run diagnostics to populate verification data
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">OAuth Pipeline</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs p-2 bg-neutral-800/30 rounded-lg">
                        <span className="text-neutral-400">Valid Token</span>
                        {studioStatus.verification.oauth.valid ? <Check className="w-3.5 h-3.5 text-green-400" /> : <X className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                      <div className="flex items-center justify-between text-xs p-2 bg-neutral-800/30 rounded-lg">
                        <span className="text-neutral-400">Refresh Capability</span>
                        {studioStatus.verification.oauth.hasRefreshToken ? <Check className="w-3.5 h-3.5 text-green-400" /> : <X className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                      <div className="flex items-center justify-between text-xs p-2 bg-neutral-800/30 rounded-lg">
                        <span className="text-neutral-400">Google Account</span>
                        <span className="text-neutral-300 truncate max-w-[120px]">{studioStatus.verification.oauth.googleEmail || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Ads API Interface</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs p-2 bg-neutral-800/30 rounded-lg">
                        <span className="text-neutral-400">Account Found</span>
                        {studioStatus.verification.account.exists ? <Check className="w-3.5 h-3.5 text-green-400" /> : <X className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                      <div className="flex items-center justify-between text-xs p-2 bg-neutral-800/30 rounded-lg">
                        <span className="text-neutral-400">Direct Accessibility</span>
                        {studioStatus.verification.account.accessible ? <Check className="w-3.5 h-3.5 text-green-400" /> : <X className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                      <div className="flex items-center justify-between text-xs p-2 bg-neutral-800/30 rounded-lg">
                        <span className="text-neutral-400">MCC Verification</span>
                        {studioStatus.verification.account.viaMcc ? <Check className="w-3.5 h-3.5 text-green-400" /> : <X className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => {
              const isExpanded = expanded === req.adoptionId;
              const form = createForm[req.adoptionId] ?? { youtubeId: req.youtubeVideoId ?? '', customerId: req.googleAdsCustomerId ?? '', budget: String(req.budgetAmount), dryRun: true };
              const result = actionResult[req.adoptionId];
              const isActing = actionLoading?.adoptionId === req.adoptionId;

              return (
                <div
                  key={req.adoptionId}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm"
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
                          ${req.budgetAmount}
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
                          <span className="text-neutral-300 font-mono">{req.youtubeVideoId || '—'}</span>
                        </div>
                      </div>

                      {/* Admin note */}
                      {req.adminNote && (
                        <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-lg px-4 py-3">
                          <p className="text-xs text-neutral-500 mb-1">Admin note</p>
                          <p className="text-sm text-neutral-300">{req.adminNote}</p>
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

                      {/* Quick actions */}
                      {req.status !== 'campaign_created' && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-800/50">
                          {req.status !== 'approved' && (
                            <button
                              disabled={isActing}
                              onClick={() => doAction(req.adoptionId, 'approve')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-sm rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          )}
                          {req.status !== 'rejected' && (
                            <button
                              disabled={isActing}
                              onClick={() => doAction(req.adoptionId, 'reject')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm rounded-lg transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
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
                        <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-xl p-4 space-y-4 shadow-inner">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-neutral-300">
                              <Rocket className="w-4 h-4 inline-block mr-1.5 text-blue-400" />
                              Launch Google Ads Campaign
                            </p>
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={form.dryRun}
                                  onChange={(e) => setCreateForm((p) => ({ ...p, [req.adoptionId]: { ...form, dryRun: e.target.checked } }))}
                                />
                                <div className="w-8 h-4 bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 group-hover:text-neutral-400 transition-colors">Dry Run</span>
                            </label>
                          </div>

                          <div className="grid sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">YouTube Video ID</label>
                              <input
                                value={form.youtubeId}
                                onChange={(e) => setCreateForm((p) => ({ ...p, [req.adoptionId]: { ...form, youtubeId: e.target.value } }))}
                                placeholder="e.g. dQw4w9WgXcQ"
                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-200 focus:outline-none"
                              />
                            </div>
                            {req.methodType !== 'managed_sufitube' && (
                              <div>
                                <label className="block text-xs text-neutral-500 mb-1">Customer ID</label>
                                <input
                                  value={form.customerId}
                                  onChange={(e) => setCreateForm((p) => ({ ...p, [req.adoptionId]: { ...form, customerId: e.target.value } }))}
                                  placeholder="123-456-7890"
                                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-200 focus:outline-none"
                                />
                              </div>
                            )}
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">Budget (USD)</label>
                              <input
                                type="number"
                                value={form.budget}
                                onChange={(e) => setCreateForm((p) => ({ ...p, [req.adoptionId]: { ...form, budget: e.target.value } }))}
                                placeholder="50"
                                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-200 focus:outline-none"
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
                                dry_run: form.dryRun
                              })
                            }
                            className={`flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${form.dryRun ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-blue-600 hover:bg-blue-500'}`}
                          >
                            {isActing && actionLoading?.action === 'create_campaign' ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> {form.dryRun ? 'Validating…' : 'Creating…'}</>
                            ) : (
                              <>{form.dryRun ? <ShieldCheck className="w-4 h-4" /> : <Rocket className="w-4 h-4" />} {form.dryRun ? 'Run Campaign Validation (Dry Run)' : 'Create Campaign in Google Ads'}</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Hierarchy Diagnostics (Phase 3C) */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-neutral-800 bg-neutral-800/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Network className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Hierarchy Diagnostics</h2>
            </div>
            <button
              onClick={loadHierarchy}
              disabled={loadingHierarchy}
              className="flex items-center gap-2 px-3 py-1.5 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loadingHierarchy ? 'animate-spin' : ''}`} />
              {loadingHierarchy ? 'Querying Google…' : 'Refresh Hierarchy'}
            </button>
          </div>

          <div className="grid lg:grid-cols-2 divide-x divide-neutral-800">
            {/* Accessible Accounts */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Accessible Accounts (Source of Truth)</p>
                {hierarchyData?.accounts && (
                  <span className="text-[10px] font-mono text-neutral-500">{hierarchyData.accounts.length} linked</span>
                )}
              </div>

              {!hierarchyData ? (
                <div className="h-24 flex items-center justify-center border border-dashed border-neutral-800 rounded-xl text-xs text-neutral-600 italic">
                  {loadingHierarchy ? 'Waiting for Google API response...' : 'Run hierarchy check to see accessible accounts'}
                </div>
              ) : hierarchyData.accounts.length === 0 ? (
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-xs text-red-400">
                  No accounts found. This OAuth token (`{studioStatus?.verification?.oauth.googleEmail || 'unknown'}`) has no direct access to any Google Ads accounts.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {hierarchyData.accounts.map((acc: any) => {
                    const isConfigured = acc.customerId === hierarchyData.configuredIds.studioCustomerId?.replace(/-/g, '');
                    return (
                      <div key={acc.customerId} className={`flex items-center justify-between p-3 rounded-lg border ${isConfigured ? 'bg-amber-500/10 border-amber-500/30' : 'bg-neutral-800/30 border-neutral-800'}`}>
                        <div>
                          <p className="text-xs font-mono text-neutral-200">{acc.formattedId}</p>
                          <p className="text-[9px] text-neutral-500 truncate max-w-[200px]">{acc.resourceName}</p>
                        </div>
                        {isConfigured && (
                          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[9px]">Matched in Env</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Configured Hierarchy */}
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Configured Environment Topology</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="text-xs text-neutral-400">Login Customer ID (MCC)</span>
                    </div>
                    <code className="text-xs font-mono text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded">
                      {hierarchyData?.configuredIds.loginCustomerId || 'NOT_SET'}
                    </code>
                  </div>
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="text-xs text-neutral-400">Studio Customer ID (Target)</span>
                    </div>
                    <code className="text-xs font-mono text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded">
                      {hierarchyData?.configuredIds.studioCustomerId || 'NOT_SET'}
                    </code>
                  </div>
                </div>
              </div>

              {hierarchyData && (
                <div className="pt-4 border-t border-neutral-800 space-y-3">
                  <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Diagnostic Result</p>
                  {hierarchyData.accounts.some((a: any) => a.customerId === hierarchyData.configuredIds.studioCustomerId?.replace(/-/g, '')) ? (
                    <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                      <CheckCircle2 className="w-4 h-4" />
                      Target account is directly accessible. No MCC login ID required.
                    </div>
                  ) : hierarchyData.accounts.length > 0 ? (
                    <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      Target account not in direct list. Must be linked under Login Customer ID (MCC). Ensure MCC hierarchy is correct.
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Operational Logs Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-neutral-800 bg-neutral-800/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <List className="w-5 h-5 text-neutral-400" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Operational Logs</h2>
            </div>
            <button
              onClick={loadLogs}
              disabled={loadingLogs}
              className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-300 transition-all disabled:opacity-50"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto bg-black/20 font-mono text-[11px] leading-relaxed">
            {logs.length === 0 ? (
              <div className="p-10 text-center text-neutral-700 italic">No operational logs found.</div>
            ) : (
              <div className="divide-y divide-neutral-800/50">
                {logs.map((log, idx) => (
                  <div key={idx} className="p-3 hover:bg-neutral-800/30 transition-colors flex gap-4">
                    <span className="text-neutral-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          log.type.includes('error') ? 'bg-red-500/20 text-red-400' : 
                          log.type.includes('success') ? 'bg-green-500/20 text-green-400' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {log.type.replace(/_/g, ' ')}
                        </span>
                        {log.isDryRun && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">Dry Run</span>
                        )}
                        {log.step && <span className="text-neutral-500">Step: <span className="text-neutral-300">{log.step}</span></span>}
                      </div>
                      <div className="text-neutral-400 break-all">
                        {log.error ? <span className="text-red-400">{log.error}</span> : 
                         log.resourceName ? <span className="text-blue-400">{log.resourceName}</span> : 
                         log.adoption_id ? <span className="text-neutral-500">Adoption: {log.adoption_id}</span> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
