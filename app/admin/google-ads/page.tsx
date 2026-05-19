'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge } from '../../components/primitives/Badge';
import {
  Search, Check, X, RefreshCw, Loader2, AlertCircle,
  DollarSign, Target, ExternalLink, Clock, CheckCircle2,
  MessageSquare, Rocket, ChevronDown, ChevronUp, User, Link2,
  ShieldCheck, Activity, Database, AlertTriangle, Fingerprint, List, Network
} from 'lucide-react';
import type { GoogleAdsCampaignRequest, CampaignRequestStatus } from '../../lib/server/google-ads-campaign-request-store';

type VerificationResult = {
  oauth: { connected: boolean; valid: boolean; tokenExpired: boolean; hasRefreshToken: boolean; googleEmail: string | null; error?: string | null };
  account: { customerId: string | null; exists: boolean; accessible: boolean; viaMcc: boolean; error?: string | null };
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
  submitted:              { label: 'Submitted',             color: 'bg-neutral-800 text-neutral-400 border-neutral-700' },
  under_review:           { label: 'Under Review',          color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  prepared:               { label: 'Prepared',              color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  awaiting_user_approval: { label: 'Awaiting User Approval',color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  approved:               { label: 'Approved',              color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  launch_ready:           { label: 'Launch Ready',          color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  live:                   { label: 'Live',                  color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  monitoring:             { label: 'Monitoring',            color: 'bg-teal-500/15 text-teal-400 border-teal-500/30' },
  completed:              { label: 'Completed',             color: 'bg-neutral-500/15 text-neutral-300 border-neutral-500/30' },
  report_ready:           { label: 'Report Ready',          color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  rejected:               { label: 'Rejected',              color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  changes_requested:      { label: 'Changes Requested',     color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  campaign_failed:        { label: 'Campaign Failed',       color: 'bg-red-700/20 text-red-300 border-red-700/30' },
  // Legacy
  pending_review:         { label: 'Pending Review',        color: 'bg-neutral-800 text-neutral-400 border-neutral-700' },
  pending_manual_review:  { label: 'Manual Review Required', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  campaign_created:       { label: 'Campaign Created',      color: 'bg-green-500/15 text-green-400 border-green-500/30' },
};

function StatusBadge({ status }: { status: CampaignRequestStatus }) {
  const { label, color } = STATUS_LABELS[status] ?? { label: status, color: 'bg-neutral-800 text-neutral-400 border-neutral-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${color}`}>
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
  const [prepForm, setPrepForm] = useState<Record<string, { proposedTargeting: string; proposedBudget: string; proposedKeywords: string; proposedAdCopy: string }>>({});
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

    const savedPreps = localStorage.getItem('googleAds_preps');
    if (savedPreps) {
      try { setPrepForm(JSON.parse(savedPreps)); } catch (e) {}
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

  useEffect(() => {
    localStorage.setItem('googleAds_preps', JSON.stringify(prepForm));
  }, [prepForm]);

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
    action: string,
    extra?: Record<string, unknown>
  ) => {
    setActionLoading({ adoptionId, action });
    setActionResult((prev) => ({ ...prev, [adoptionId]: { ok: true, msg: '' } }));
    try {
      const prep = prepForm[adoptionId] || {};
      const res = await fetch('/api/admin/google-ads/campaign-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          adoptionId,
          action,
          adminNote: adminNote[adoptionId] || undefined,
          ...prep,
          ...extra,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setActionResult((prev) => ({ ...prev, [adoptionId]: { ok: true, msg: 'Stage updated.' } }));
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
      <div className="p-6 max-w-7xl mx-auto space-y-6 text-neutral-100">
        {oauthError && (
          <div className="p-3 rounded-lg text-sm flex items-center justify-between gap-2 bg-red-500/10 border border-red-500/25 text-red-400">
            <span>{oauthError}</span>
            <button type="button" onClick={() => setOauthError(null)} className="shrink-0 opacity-50 hover:opacity-100 text-lg leading-none">×</button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Google Ads Operations</h1>
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
              {refreshingDiagnostics ? 'Running Diagnostics…' : 'Infrastructure Check'}
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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Verification Matrix</h3>
                </div>
                {studioStatus?.verification?.account.error && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] animate-pulse">
                    Error: {studioStatus.verification.account.error}
                  </Badge>
                )}
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
            { label: 'Pending',  key: 'submitted',        count: (counts.submitted ?? 0) + (counts.pending_review ?? 0) },
            { label: 'Review',   key: 'under_review',     count: counts.under_review ?? 0 },
            { label: 'Prepared', key: 'prepared',         count: counts.prepared ?? 0 },
            { label: 'Live',     key: 'live',             count: (counts.live ?? 0) + (counts.campaign_created ?? 0) },
            { label: 'Failed',   key: 'campaign_failed',  count: counts.campaign_failed ?? 0 },
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
              placeholder="Search requests…"
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
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
            <p className="text-sm">No requests found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => {
              const isExpanded = expanded === req.adoptionId;
              const form = createForm[req.adoptionId] ?? { youtubeId: req.youtubeVideoId ?? '', customerId: req.googleAdsCustomerId ?? '', budget: String(req.budgetAmount), dryRun: true };
              const prep = prepForm[req.adoptionId] ?? { proposedTargeting: req.proposedTargeting || '', proposedBudget: String(req.proposedBudget || req.budgetAmount), proposedKeywords: req.proposedKeywords || '', proposedAdCopy: req.proposedAdCopy || '' };
              const result = actionResult[req.adoptionId];
              const isActing = actionLoading?.adoptionId === req.adoptionId;

              return (
                <div key={req.adoptionId} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
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
                      </div>
                      <div className="flex flex-wrap gap-4 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {req.sponsorName || 'Anonymous'} · {req.sponsorEmail || '—'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          ${req.budgetAmount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2 mt-1">
                      {req.releaseSlug && (
                        <a href={`/release-detail/${req.releaseSlug}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-neutral-800 p-6 space-y-8 bg-neutral-950/30">
                      {/* Grid Sections */}
                      <div className="grid lg:grid-cols-2 gap-8">
                        {/* Info Column */}
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Fingerprint className="w-3 h-3" /> Identity & Logistics
                            </h4>
                            <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800/50 space-y-3 text-xs">
                              <div className="flex justify-between"><span className="text-neutral-500">Adoption ID</span><code className="text-neutral-300">{req.adoptionId}</code></div>
                              <div className="flex justify-between"><span className="text-neutral-500">Method</span><span className={req.methodType === 'managed_sufitube' ? 'text-amber-400' : 'text-blue-400'}>{req.methodType === 'managed_sufitube' ? 'Managed by SufiTube' : 'Use My Google Ads'}</span></div>
                              {req.methodType !== 'managed_sufitube' && <div className="flex justify-between"><span className="text-neutral-500">Customer ID</span><span className="text-neutral-200">{req.googleAdsCustomerId || '—'}</span></div>}
                              <div className="flex justify-between"><span className="text-neutral-500">Regions</span><span className="text-neutral-300">{req.targetRegions.join(', ')}</span></div>
                              <div className="flex justify-between"><span className="text-neutral-500">Objective</span><span className="text-neutral-300">{req.campaignObjective}</span></div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Clock className="w-3 h-3" /> Audit Timeline
                            </h4>
                            <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800/50 space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                              {req.events?.length === 0 ? (
                                <p className="text-[10px] text-neutral-600 italic">No events recorded.</p>
                              ) : (
                                req.events.map((evt) => (
                                  <div key={evt.id} className="relative pl-4 border-l border-neutral-800 pb-4 last:pb-0">
                                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-neutral-800 border border-neutral-700" />
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[9px] font-bold uppercase text-neutral-400">{evt.eventType.replace(/_/g, ' ')}</span>
                                      <span className="text-[8px] text-neutral-600">{new Date(evt.createdAt).toLocaleString()}</span>
                                    </div>
                                    {evt.message && <p className="text-[10px] text-neutral-500 leading-relaxed">{evt.message}</p>}
                                    {evt.internalOnly && <Badge className="mt-1 bg-red-500/10 text-red-400 border-red-500/20 text-[8px] px-1 py-0 uppercase">Internal</Badge>}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Moderation Column */}
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Rocket className="w-3 h-3" /> Campaign Intelligence Engine
                            </h4>
                            <div className="bg-neutral-900/50 rounded-xl p-5 border border-neutral-800/50 space-y-6">
                              {/* Intelligence Selectors */}
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Linguistic Intelligence</label>
                                  <div className="flex flex-wrap gap-2">
                                    {['Urdu', 'Kashmiri', 'Punjabi', 'English'].map(lang => (
                                      <button key={lang} className="px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-[10px] font-bold uppercase tracking-tight text-neutral-400 hover:border-blue-500/30 hover:text-blue-400 transition-all">
                                        {lang}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Devotional Targeting Presets</label>
                                  <div className="flex flex-wrap gap-2">
                                    {['Global Sufi', 'Islamic Reflection', 'Spiritual Poetry', 'Healing'].map(preset => (
                                      <button key={preset} className="px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-[10px] font-bold uppercase tracking-tight text-neutral-400 hover:border-amber-500/30 hover:text-amber-400 transition-all">
                                        {preset}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] text-neutral-500 font-bold uppercase mb-1.5">Proposed Targeting (Regions/Audience)</label>
                                  <input 
                                    value={prep.proposedTargeting} 
                                    onChange={(e) => setPrepForm(p => ({ ...p, [req.adoptionId]: { ...prep, proposedTargeting: e.target.value }}))}
                                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50 transition-colors" 
                                    placeholder="e.g. US, UK, South Asia - Spiritual/Sufi enthusiasts"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] text-neutral-500 font-bold uppercase mb-1.5">Proposed Budget ($)</label>
                                    <input 
                                      type="number"
                                      value={prep.proposedBudget} 
                                      onChange={(e) => setPrepForm(p => ({ ...p, [req.adoptionId]: { ...prep, proposedBudget: e.target.value }}))}
                                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50" 
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-neutral-500 font-bold uppercase mb-1.5">Keywords (Comma separated)</label>
                                    <input 
                                      value={prep.proposedKeywords} 
                                      onChange={(e) => setPrepForm(p => ({ ...p, [req.adoptionId]: { ...prep, proposedKeywords: e.target.value }}))}
                                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50" 
                                      placeholder="Sufi, Kalam, Devotional..."
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-neutral-500 font-bold uppercase mb-1.5">Proposed Ad Copy / Headlines</label>
                                  <textarea 
                                    value={prep.proposedAdCopy} 
                                    onChange={(e) => setPrepForm(p => ({ ...p, [req.adoptionId]: { ...prep, proposedAdCopy: e.target.value }}))}
                                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50 h-16 resize-none" 
                                    placeholder="H1: Experience the Sufi Way..."
                                  />
                                </div>
                              </div>

                              <div className="pt-2">
                                <label className="block text-[10px] text-neutral-500 font-bold uppercase mb-1.5 flex items-center gap-1.5">
                                  <MessageSquare className="w-2.5 h-2.5" /> Internal Moderation Note
                                </label>
                                <div className="flex gap-2">
                                  <input 
                                    value={adminNote[req.adoptionId] || ''} 
                                    onChange={(e) => setAdminNote(p => ({ ...p, [req.adoptionId]: e.target.value }))}
                                    placeholder="Add a private note to the audit log..."
                                    className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
                                  />
                                  <button 
                                    onClick={() => doAction(req.adoptionId, 'add_note')}
                                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors text-[10px] font-bold uppercase"
                                  >
                                    Save Note
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Result / Feedback */}
                      {result?.msg && (
                        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-xs font-medium ${
                          result.ok ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                          {result.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          {result.msg}
                        </div>
                      )}

                      {/* Stage Transition Controls */}
                      <div className="pt-6 border-t border-neutral-800/50 space-y-4">
                        <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                          <Activity className="w-3 h-3" /> Workflow Orchestration
                        </h4>
                        
                        <div className="flex flex-wrap gap-2">
                          {(req.status === 'submitted' || req.status === 'pending_review') && (
                            <button onClick={() => doAction(req.adoptionId, 'start_review')} className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[10px] font-bold uppercase rounded-lg transition-all">Begin Institutional Review</button>
                          )}
                          {req.status === 'under_review' && (
                            <button onClick={() => doAction(req.adoptionId, 'prepare')} className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-500 text-[10px] font-bold uppercase rounded-lg transition-all">Save Campaign Preparation</button>
                          )}
                          {req.status === 'prepared' && (
                            <button onClick={() => doAction(req.adoptionId, 'request_user_approval')} className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-500 text-[10px] font-bold uppercase rounded-lg transition-all">Send for Sponsor Approval</button>
                          )}
                          {req.status === 'awaiting_user_approval' && (
                            <button onClick={() => doAction(req.adoptionId, 'mark_launch_ready')} className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-500 text-[10px] font-bold uppercase rounded-lg transition-all">Confirm Approval & Mark Launch Ready</button>
                          )}
                          {req.status !== 'rejected' && req.status !== 'completed' && (
                            <button onClick={() => doAction(req.adoptionId, 'reject')} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase rounded-lg transition-all">Reject Request</button>
                          )}
                        </div>
                      </div>

                      {/* Launch Console (Visible when ready or failed) */}
                      {(req.status === 'launch_ready' || req.status === 'prepared' || req.status === 'approved' || req.status === 'campaign_failed' || req.status === 'live') && (
                        <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-6 space-y-6 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h5 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                                <Rocket className="w-4 h-4" /> Google Ads Launch API
                              </h5>
                              <p className="text-[10px] text-neutral-500">Push campaign structure to Google Ads API</p>
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Dry Run Safety</span>
                              <div className="relative">
                                <input type="checkbox" className="sr-only peer" checked={form.dryRun} onChange={(e) => setCreateForm((p) => ({ ...p, [req.adoptionId]: { ...form, dryRun: e.target.checked } }))} />
                                <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                              </div>
                            </label>
                          </div>

                          <div className="grid sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-wider">YouTube ID</label>
                              <input value={form.youtubeId} onChange={(e) => setCreateForm((p) => ({ ...p, [req.adoptionId]: { ...form, youtubeId: e.target.value } }))} className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-blue-500/50" />
                            </div>
                            {req.methodType !== 'managed_sufitube' && (
                              <div className="space-y-1.5">
                                <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Customer ID</label>
                                <input value={form.customerId} onChange={(e) => setCreateForm((p) => ({ ...p, [req.adoptionId]: { ...form, customerId: e.target.value } }))} className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-blue-500/50" />
                              </div>
                            )}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Launch Budget ($)</label>
                              <input type="number" value={form.budget} onChange={(e) => setCreateForm((p) => ({ ...p, [req.adoptionId]: { ...form, budget: e.target.value } }))} className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-blue-500/50" />
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              disabled={isActing || !form.youtubeId || (req.methodType !== 'managed_sufitube' && !form.customerId)}
                              onClick={() => doAction(req.adoptionId, 'launch', { youtubeVideoId: form.youtubeId, selectedCustomerId: req.methodType === 'managed_sufitube' ? undefined : form.customerId, budgetAmount: Number(form.budget), dry_run: form.dryRun })}
                              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 ${form.dryRun ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'}`}
                            >
                              {isActing && actionLoading?.action === 'launch' ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {form.dryRun ? 'Validating…' : 'Launching…'}</>
                              ) : (
                                <>{form.dryRun ? <ShieldCheck className="w-3.5 h-3.5" /> : <Rocket className="w-3.5 h-3.5" />} {form.dryRun ? 'Validate Campaign Structure' : 'Push Live to Google Ads'}</>
                              )}
                            </button>
                            {req.status === 'live' && (
                              <button onClick={() => doAction(req.adoptionId, 'complete')} className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-neutral-700 transition-all">Mark as Completed</button>
                            )}
                          </div>
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
