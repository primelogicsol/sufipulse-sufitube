'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge } from '../../components/primitives/Badge';
import {
    Search, Eye, Check, X, User, Music, DollarSign,
    AlertCircle, BarChart3, Users, Target, TrendingUp, Rocket,
    Loader2, Globe, ExternalLink, RefreshCw, Play, Activity,
    Flag, FileText,
} from 'lucide-react';

// Lifecycle transitions available per current status.
// Only forward moves are allowed; never backward.
const LIFECYCLE_NEXT: Record<string, { status: string; label: string; icon: any; color: string }> = {
    scheduled:  { status: 'live',        label: 'Mark Live',      icon: Play,     color: 'text-green-400 hover:text-green-300' },
    live:       { status: 'monitoring',  label: 'Mark Monitoring', icon: Activity, color: 'text-blue-400 hover:text-blue-300' },
    monitoring: { status: 'completed',   label: 'Mark Completed',  icon: Flag,     color: 'text-purple-400 hover:text-purple-300' },
    completed:  { status: 'report_ready',label: 'Report Ready',    icon: FileText, color: 'text-amber-400 hover:text-amber-300' },
};

interface LaunchState {
    step: 'idle' | 'input' | 'launching' | 'done';
    youtubeId: string;
    error: string;
    campaignResource: string;
    customerId: string;
}

const defaultLaunch = (): LaunchState => ({
    step: 'idle', youtubeId: '', error: '', campaignResource: '', customerId: '',
});

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

export default function AdminSongAdoptions() {
    const [adoptions, setAdoptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [methodFilter, setMethodFilter] = useState<string>('all');
    const [selectedAdoption, setSelectedAdoption] = useState<any | null>(null);
    const [launchState, setLaunchState] = useState<LaunchState>(defaultLaunch());
    const [googleAdsSummary, setGoogleAdsSummary] = useState<any | null>(null);
    const [googleAdsError, setGoogleAdsError] = useState<string | null>(null);
    const [insightsLoading, setInsightsLoading] = useState(false);

    useEffect(() => { loadAdoptions(); }, []);

    const loadAdoptions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/adoptions?all=1', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to load adoptions');
            const data = await res.json();
            setAdoptions(data);

            const customerIds = data
                .map((a: any) => a.googleAdsCustomerId)
                .filter((id: string | null | undefined): id is string => Boolean(id));
            if (customerIds.length > 0) loadGoogleAdsInsights(customerIds);
            else { setGoogleAdsSummary(null); setGoogleAdsError('No Google Ads customer IDs linked yet.'); }
        } catch (error) {
            console.error('Error loading adoptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGoogleAdsInsights = async (customerIds: string[]) => {
        setInsightsLoading(true);
        setGoogleAdsError(null);
        try {
            const res = await fetch('/api/admin/google-ads/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerIds }),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || 'Failed to load insights');
            setGoogleAdsSummary(payload.summary || null);
        } catch (err: any) {
            setGoogleAdsSummary(null);
            setGoogleAdsError(err?.message || 'Google Ads insights unavailable');
        } finally {
            setInsightsLoading(false);
        }
    };

    const patchAdoption = async (id: string, patch: Record<string, any>) => {
        await fetch(`/api/adoptions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(patch),
        });
    };

    const updateAdoptionStatus = async (adoptionId: string, status: string) => {
        await patchAdoption(adoptionId, { adoptionStatus: status });
        await loadAdoptions();
    };

    const approvePublicListing = async (adoptionId: string, approved: boolean) => {
        await patchAdoption(adoptionId, { publicListingApproved: approved });
        await loadAdoptions();
    };

    const canLaunch = (adoption: any) => {
        const paymentOk = adoption.paymentStatus === 'paid' || adoption.methodType === 'use_my_google_ads';
        return adoption.adoptionStatus === 'approved' && paymentOk;
    };

    const openLaunchPanel = (adoption: any) => {
        setLaunchState({ ...defaultLaunch(), step: 'input' });
        setSelectedAdoption(adoption);
    };

    const executeLaunch = async () => {
        if (!selectedAdoption) return;
        const adoption = selectedAdoption;

        if (!launchState.youtubeId.trim()) {
            setLaunchState(prev => ({ ...prev, error: 'YouTube Video ID is required.' }));
            return;
        }
        if (!adoption.releaseId) {
            setLaunchState(prev => ({ ...prev, error: 'Release ID missing from adoption record.' }));
            return;
        }

        setLaunchState(prev => ({ ...prev, step: 'launching', error: '' }));

        try {
            let releaseTitle = `Release ${adoption.releaseId}`;
            try {
                const relRes = await fetch(`/api/releases/${adoption.releaseId}`);
                if (relRes.ok) { const rel = await relRes.json(); releaseTitle = rel.title || releaseTitle; }
            } catch {}

            const body: Record<string, any> = {
                adoption_id: adoption.id,
                method_type: adoption.methodType,
                youtube_video_id: launchState.youtubeId.trim(),
                release_title: releaseTitle,
                budget_usd: adoption.amountDue,
                target_regions: adoption.targetRegions || ['US', 'GB', 'AE'],
                target_languages: adoption.targetLanguages || ['en', 'ur'],
                campaign_objective: adoption.campaignObjective || 'awareness',
            };
            if (adoption.methodType === 'use_my_google_ads') {
                body.sponsor_customer_id = adoption.googleAdsCustomerId;
            }

            const res = await fetch('/api/admin/google-ads/create-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Campaign creation failed');

            await patchAdoption(adoption.id, {
                adoptionStatus: 'scheduled',
                campaignResourceName: data.campaign_resource_name,
            });

            setLaunchState(prev => ({
                ...prev, step: 'done',
                campaignResource: data.campaign_resource_name,
                customerId: data.customer_id,
            }));
            await loadAdoptions();
        } catch (err: any) {
            setLaunchState(prev => ({ ...prev, step: 'input', error: err.message || 'Campaign launch failed.' }));
        }
    };

    const filteredAdoptions = adoptions.filter((a) => {
        const matchesSearch = !searchTerm ||
            a.sponsorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.sponsorEmail?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || a.adoptionStatus === statusFilter;
        const matchesMethod = methodFilter === 'all' || a.methodType === methodFilter;
        return matchesSearch && matchesStatus && matchesMethod;
    });

    const getEffectivePaymentStatus = (a: any) => {
        if (a.methodType === 'use_my_google_ads') return 'not_required';
        return a.paymentStatus || 'unpaid';
    };

    const getStatusBadge = (status: string) => {
        const cfg: Record<string, { variant: any; label: string }> = {
            draft:                               { variant: 'neutral', label: 'Draft' },
            submitted:                           { variant: 'neutral', label: 'Submitted' },
            pending_review:                      { variant: 'neutral', label: 'Pending Review' },
            pending_google_ads_manual_review:    { variant: 'gold',   label: 'Ads Manual Review' },
            google_ads_verification_pending:     { variant: 'gold',   label: 'Ads Verification…' },
            google_ads_verified:                 { variant: 'success', label: 'Ads Verified' },
            google_ads_verification_failed:      { variant: 'error',  label: 'Ads Verify Failed' },
            campaign_preparation_requested:      { variant: 'gold',   label: 'Campaign Prep Req.' },
            admin_review:                        { variant: 'gold',    label: 'Admin Review' },
            under_review:                        { variant: 'gold',    label: 'Under Review' },
            approved:                            { variant: 'success', label: 'Approved' },
            prepared:                            { variant: 'success', label: 'Prepared' },
            scheduled:                           { variant: 'gold',    label: 'Scheduled' },
            live:                                { variant: 'success', label: 'Live' },
            monitoring:                          { variant: 'success', label: 'Monitoring' },
            completed:                           { variant: 'success', label: 'Completed' },
            report_ready:                        { variant: 'success', label: 'Report Ready' },
            cancelled:                           { variant: 'error',   label: 'Cancelled' },
            failed:                              { variant: 'error',   label: 'Failed' },
        };
        const c = cfg[status] || { variant: 'neutral', label: status.replace(/_/g, ' ') };
        return <Badge variant={c.variant}>{c.label}</Badge>;
    };

    const getPaymentBadge = (a: any) => {
        const status = getEffectivePaymentStatus(a);
        if (status === 'not_required') return <Badge variant="neutral">Not Required</Badge>;
        const cfg: Record<string, { variant: any; label: string }> = {
            unpaid:   { variant: 'error',   label: 'Unpaid' },
            pending:  { variant: 'gold',    label: 'Pending' },
            paid:     { variant: 'success', label: 'Paid' },
            failed:   { variant: 'error',   label: 'Failed' },
            refunded: { variant: 'neutral', label: 'Refunded' },
        };
        const c = cfg[status] || cfg.unpaid;
        return <Badge variant={c.variant}>{c.label}</Badge>;
    };

    const totalCampaigns = adoptions.length;
    const paidCampaigns = adoptions.filter((a) => a.paymentStatus === 'paid' || a.methodType === 'use_my_google_ads').length;
    const totalBudget = adoptions.reduce((s, a) => s + Number(a.amountDue || 0), 0);
    const totalAdopters = new Set(adoptions.map((a) => a.sponsorEmail || a.userId).filter(Boolean)).size;
    const intentionCounts = adoptions.reduce<Record<string, number>>((acc, a) => {
        const o = a.campaignIntention || 'general_awareness';
        acc[o] = (acc[o] || 0) + 1;
        return acc;
    }, {});

    if (loading) return (
        <DashboardLayout>
            <div className="dashboard-loading"><p>Loading adoptions…</p></div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--dash-text-primary)]">Song Adoptions</h1>
                        <p className="text-sm text-[var(--dash-text-secondary)] mt-1">Manage sponsorship requests, campaign performance, and platform impact.</p>
                    </div>
                    <button onClick={loadAdoptions} className="flex items-center gap-2 text-sm text-[var(--dash-text-secondary)] hover:text-[var(--dash-text-primary)] transition-colors">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Campaigns', value: totalCampaigns, sub: `Confirmed: ${paidCampaigns}`, icon: BarChart3 },
                        { label: 'Unique Sponsors', value: totalAdopters, sub: 'People / organizations', icon: Users },
                        { label: 'Campaign Budget', value: `$${totalBudget.toLocaleString()}`, sub: `${adoptions.filter(a => a.adoptionStatus === 'live').length} live`, icon: DollarSign },
                        { label: 'Google Ads Linked', value: adoptions.filter(a => a.googleAdsCustomerId).length, sub: `OAuth connected: ${adoptions.filter(a => a.oauthStatus === 'connected').length}`, icon: Target },
                    ].map(({ label, value, sub, icon: Icon }) => (
                        <div key={label} className="dashboard-card">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-[var(--dash-text-secondary)]">{label}</p>
                                <Icon className="w-4 h-4 text-[var(--dash-accent)]" />
                            </div>
                            <p className="text-2xl font-bold text-[var(--dash-text-primary)]">{value}</p>
                            <p className="text-xs text-[var(--dash-text-muted)]">{sub}</p>
                        </div>
                    ))}
                </div>

                <div className="dashboard-card">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-[var(--dash-accent)]" />
                        <h3 className="font-semibold text-[var(--dash-text-primary)]">Campaign Impact Overview</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-[var(--dash-text-secondary)] mb-2">Intention Distribution</p>
                            <div className="space-y-1 text-sm">
                                {Object.keys(intentionCounts).length === 0
                                    ? <p className="text-[var(--dash-text-muted)]">No campaign data yet.</p>
                                    : Object.entries(intentionCounts).map(([intention, cnt]) => (
                                        <div key={intention} className="flex justify-between text-[var(--dash-text-secondary)]">
                                            <span>{INTENTION_LABELS[intention] || intention.replace(/_/g, ' ')}</span>
                                            <span className="font-medium">{cnt}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--dash-text-secondary)] mb-2">Google Ads API Insights (Last 30 Days)</p>
                            {insightsLoading ? (
                                <p className="text-sm text-[var(--dash-text-muted)]">Loading…</p>
                            ) : googleAdsSummary ? (
                                <div className="space-y-1 text-sm text-[var(--dash-text-secondary)]">
                                    <div className="flex justify-between"><span>Impressions</span><span className="font-medium">{Number(googleAdsSummary.impressions || 0).toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span>Clicks</span><span className="font-medium">{Number(googleAdsSummary.clicks || 0).toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span>Video Views</span><span className="font-medium">{Number(googleAdsSummary.videoViews || 0).toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span>Spend (est.)</span><span className="font-medium">${(Number(googleAdsSummary.costMicros || 0) / 1_000_000).toFixed(2)}</span></div>
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--dash-text-muted)]">{googleAdsError || 'Unavailable.'}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
                        <input type="text" placeholder="Search by sponsor name or email…" value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} className="dashboard-input has-icon" />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="dashboard-input max-w-48">
                        <option value="all">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="pending_review">Pending Review</option>
                        <option value="pending_google_ads_manual_review">Ads Manual Review</option>
                        <option value="google_ads_verification_failed">Ads Verify Failed</option>
                        <option value="google_ads_verified">Ads Verified</option>
                        <option value="admin_review">Admin Review</option>
                        <option value="approved">Approved</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="live">Live</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="dashboard-input max-w-56">
                        <option value="all">All Methods</option>
                        <option value="managed_sufitube">Managed by SufiPulse</option>
                        <option value="use_my_google_ads">Use My Google Ads</option>
                    </select>
                </div>

                <div className="dashboard-table-container">
                    <div className="overflow-x-auto">
                        <table className="dashboard-table w-full">
                            <thead>
                                <tr>
                                    <th>Sponsor</th>
                                    <th>Song</th>
                                    <th>Method</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Payment</th>
                                    <th>OAuth</th>
                                    <th>Campaign</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAdoptions.map((adoption) => (
                                    <tr key={adoption.id}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center shrink-0">
                                                    <User className="w-4 h-4 text-neutral-400" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-[var(--dash-text-primary)]">{adoption.sponsorName || 'Unknown'}</div>
                                                    <div className="text-xs text-[var(--dash-text-muted)]">{adoption.sponsorEmail || '—'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-sm text-[var(--dash-text-secondary)] truncate max-w-[120px] block" title={adoption.releaseTitle}>
                                                {adoption.releaseTitle || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-sm text-[var(--dash-text-secondary)]">
                                                {adoption.methodType === 'managed_sufitube' ? 'Managed' : 'My Google Ads'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-sm text-[var(--dash-text-secondary)]">${adoption.amountDue || 0}</span>
                                        </td>
                                        <td>{getStatusBadge(adoption.adoptionStatus)}</td>
                                        <td>{getPaymentBadge(adoption)}</td>
                                        <td>
                                            {adoption.methodType === 'use_my_google_ads' ? (
                                                adoption.oauthStatus === 'connected'
                                                    ? <span className="text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Yes</span>
                                                    : <span className="text-xs text-red-400 flex items-center gap-1"><X className="w-3 h-3" /> No</span>
                                            ) : <span className="text-xs text-neutral-600">—</span>}
                                        </td>
                                        <td>
                                            {adoption.campaignResourceName ? (
                                                <span className="text-xs font-mono text-blue-400 truncate max-w-[120px] block" title={adoption.campaignResourceName}>
                                                    {adoption.campaignResourceName.split('/').pop()}
                                                </span>
                                            ) : <span className="text-xs text-neutral-600">—</span>}
                                        </td>
                                        <td>
                                            <span className="text-sm text-[var(--dash-text-secondary)]">
                                                {new Date(adoption.createdAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => { setSelectedAdoption(adoption); setLaunchState(defaultLaunch()); }} className="p-1 text-neutral-400 hover:text-neutral-200" title="View Details">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {(adoption.adoptionStatus === 'pending_review' || adoption.adoptionStatus === 'admin_review') && (
                                                    <>
                                                        <button onClick={() => updateAdoptionStatus(adoption.id, 'approved')} className="p-1 text-green-400 hover:text-green-300" title="Approve"><Check className="w-4 h-4" /></button>
                                                        <button onClick={() => updateAdoptionStatus(adoption.id, 'cancelled')} className="p-1 text-red-400 hover:text-red-300" title="Reject"><X className="w-4 h-4" /></button>
                                                    </>
                                                )}
                                                {LIFECYCLE_NEXT[adoption.adoptionStatus] && (() => {
                                                    const next = LIFECYCLE_NEXT[adoption.adoptionStatus];
                                                    const Icon = next.icon;
                                                    return (
                                                        <button
                                                            onClick={() => updateAdoptionStatus(adoption.id, next.status)}
                                                            className={`p-1 ${next.color}`}
                                                            title={next.label}
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                        </button>
                                                    );
                                                })()}
                                                <button
                                                    onClick={() => approvePublicListing(adoption.id, !adoption.publicListingApproved)}
                                                    className={`p-1 ${adoption.publicListingApproved ? 'text-blue-400' : 'text-neutral-500'} hover:text-blue-300`}
                                                    title={adoption.publicListingApproved ? 'Hide from public' : 'Show publicly'}
                                                >
                                                    <Globe className="w-4 h-4" />
                                                </button>
                                                {canLaunch(adoption) && (
                                                    <button onClick={() => openLaunchPanel(adoption)} className="p-1 text-amber-400 hover:text-amber-300" title="Launch Campaign">
                                                        <Rocket className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {filteredAdoptions.length === 0 && (
                    <div className="dashboard-card text-center py-12">
                        <AlertCircle className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                        <p className="text-[var(--dash-text-secondary)]">No adoptions found matching your filters.</p>
                    </div>
                )}

                {selectedAdoption && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                        onClick={() => { setSelectedAdoption(null); setLaunchState(defaultLaunch()); }}>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-medium text-neutral-100">Adoption Details</h3>
                                <button onClick={() => { setSelectedAdoption(null); setLaunchState(defaultLaunch()); }} className="text-neutral-400 hover:text-neutral-200">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1.5">Status</label>
                                        {getStatusBadge(selectedAdoption.adoptionStatus)}
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1.5">Payment</label>
                                        {getPaymentBadge(selectedAdoption)}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-300 mb-2 flex items-center gap-2"><User className="w-4 h-4" /> Sponsor</h4>
                                    <div className="bg-neutral-800 rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
                                        <div><span className="text-neutral-500">Name</span><div className="text-neutral-200">{selectedAdoption.sponsorName || '—'}</div></div>
                                        <div><span className="text-neutral-500">Email</span><div className="text-neutral-200">{selectedAdoption.sponsorEmail || '—'}</div></div>
                                        <div><span className="text-neutral-500">Type</span><div className="text-neutral-200 capitalize">{selectedAdoption.adopterType || '—'}</div></div>
                                        <div><span className="text-neutral-500">Location</span><div className="text-neutral-200">{selectedAdoption.sponsorCity ? `${selectedAdoption.sponsorCity}, ` : ''}{selectedAdoption.sponsorCountry || '—'}</div></div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-300 mb-2 flex items-center gap-2"><Music className="w-4 h-4" /> Campaign Details</h4>
                                    <div className="bg-neutral-800 rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
                                        <div><span className="text-neutral-500">Song</span><div className="text-neutral-200">{selectedAdoption.releaseTitle || '—'}</div></div>
                                        <div><span className="text-neutral-500">Method</span><div className="text-neutral-200">{selectedAdoption.methodType === 'managed_sufitube' ? 'Managed by SufiPulse' : 'My Google Ads'}</div></div>
                                        <div><span className="text-neutral-500">Amount</span><div className="text-neutral-200">${selectedAdoption.amountDue || 0}</div></div>
                                        <div><span className="text-neutral-500">Intention</span><div className="text-neutral-200">{INTENTION_LABELS[selectedAdoption.campaignIntention] || selectedAdoption.campaignIntention || '—'}</div></div>
                                        <div><span className="text-neutral-500">Regions</span><div className="text-neutral-200">{selectedAdoption.targetRegions?.join(', ') || '—'}</div></div>
                                        <div><span className="text-neutral-500">Reference</span><div className="text-neutral-400 font-mono text-xs">{selectedAdoption.id}</div></div>
                                    </div>
                                </div>

                                {selectedAdoption.methodType === 'use_my_google_ads' && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-300 mb-2 flex items-center gap-2"><Globe className="w-4 h-4" /> Google Ads</h4>
                                        <div className="bg-neutral-800 rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
                                            <div><span className="text-neutral-500">Customer ID</span><div className="text-neutral-200 font-mono">{selectedAdoption.googleAdsCustomerId || '—'}</div></div>
                                            <div><span className="text-neutral-500">OAuth Status</span>
                                                <div className={selectedAdoption.oauthStatus === 'connected' ? 'text-green-400' : 'text-neutral-500'}>
                                                    {selectedAdoption.oauthStatus || 'not_connected'}
                                                </div>
                                            </div>
                                            <div><span className="text-neutral-500">Verification</span>
                                                <div className={
                                                    selectedAdoption.googleAdsVerificationStatus === 'verified' ? 'text-green-400' :
                                                    selectedAdoption.googleAdsVerificationStatus === 'failed' ? 'text-red-400' :
                                                    selectedAdoption.googleAdsVerificationStatus === 'manual_review_required' ? 'text-amber-400' :
                                                    'text-neutral-500'
                                                }>
                                                    {selectedAdoption.googleAdsVerificationStatus || 'not_verified'}
                                                </div>
                                            </div>
                                            <div><span className="text-neutral-500">Campaign Resource</span>
                                                <div className="text-neutral-400 font-mono text-xs truncate" title={selectedAdoption.campaignResourceName || ''}>
                                                    {selectedAdoption.campaignResourceName || '—'}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Manual review alert */}
                                        {(selectedAdoption.adoptionStatus === 'pending_google_ads_manual_review' ||
                                          selectedAdoption.googleAdsVerificationStatus === 'manual_review_required' ||
                                          selectedAdoption.googleAdsVerificationStatus === 'failed') && (
                                            <div className="mt-2 border border-amber-700/40 bg-amber-900/10 rounded-lg px-3 py-2 text-xs text-amber-400">
                                                Sponsor submitted for manual review — API verification was skipped or failed. Verify the Customer ID manually before launching a campaign.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedAdoption.dedicationMessage && (
                                    <div className="bg-neutral-800 rounded-lg p-4">
                                        <p className="text-xs text-neutral-500 mb-1">Dedication</p>
                                        <p className="text-neutral-300 italic text-sm">"{selectedAdoption.dedicationMessage}"</p>
                                    </div>
                                )}

                                {/* Admin note field */}
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-1.5">Admin Note</label>
                                    <textarea
                                        defaultValue={selectedAdoption.adminNote || ''}
                                        onBlur={async (e) => {
                                            await patchAdoption(selectedAdoption.id, { adminNote: e.target.value });
                                        }}
                                        placeholder="Add an internal note…"
                                        rows={2}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500 resize-none"
                                    />
                                </div>

                                {/* Report URL field */}
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-1.5">Report URL</label>
                                    <input
                                        type="url"
                                        defaultValue={selectedAdoption.reportUrl || ''}
                                        onBlur={async (e) => {
                                            if (e.target.value !== (selectedAdoption.reportUrl || '')) {
                                                await patchAdoption(selectedAdoption.id, { reportUrl: e.target.value || null });
                                            }
                                        }}
                                        placeholder="https://…"
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                                    />
                                </div>

                                {(['pending_review', 'admin_review', 'pending_google_ads_manual_review', 'google_ads_verification_failed', 'google_ads_verified'].includes(selectedAdoption.adoptionStatus)) && launchState.step === 'idle' && (
                                    <div className="space-y-2">
                                        {(selectedAdoption.adoptionStatus === 'pending_google_ads_manual_review' || selectedAdoption.adoptionStatus === 'google_ads_verification_failed') && (
                                            <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2">
                                                Google Ads manual review — verify the Customer ID in the panel above before approving.
                                            </p>
                                        )}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => { updateAdoptionStatus(selectedAdoption.id, 'approved'); setSelectedAdoption((prev: any) => prev ? { ...prev, adoptionStatus: 'approved' } : prev); }}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                                            >Approve</button>
                                            <button
                                                onClick={() => { updateAdoptionStatus(selectedAdoption.id, 'cancelled'); setSelectedAdoption(null); }}
                                                className="px-4 py-2 border border-red-600 text-red-400 hover:bg-red-600/10 rounded-lg transition-colors text-sm"
                                            >Reject</button>
                                        </div>
                                    </div>
                                )}

                                {LIFECYCLE_NEXT[selectedAdoption.adoptionStatus] && launchState.step === 'idle' && (() => {
                                    const next = LIFECYCLE_NEXT[selectedAdoption.adoptionStatus];
                                    const Icon = next.icon;
                                    return (
                                        <button
                                            onClick={() => {
                                                updateAdoptionStatus(selectedAdoption.id, next.status);
                                                setSelectedAdoption((prev: any) => prev ? { ...prev, adoptionStatus: next.status } : prev);
                                            }}
                                            className="w-full px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                                        >
                                            <Icon className="w-4 h-4" /> {next.label}
                                        </button>
                                    );
                                })()}

                                {canLaunch(selectedAdoption) && launchState.step !== 'done' && (
                                    <div className="border border-amber-600/30 bg-amber-900/10 rounded-xl p-5 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Rocket className="w-5 h-5 text-amber-400" />
                                            <h4 className="text-sm font-semibold text-amber-300">Launch Google Ads Campaign</h4>
                                        </div>
                                        <p className="text-xs text-neutral-400 leading-relaxed">
                                            Campaign will be created in <strong className="text-amber-300">PAUSED</strong> state. Activate manually in Google Ads Manager after review.
                                        </p>

                                        <div>
                                            <label className="block text-xs text-neutral-400 mb-1.5">YouTube Video ID *</label>
                                            <input
                                                type="text"
                                                value={launchState.youtubeId}
                                                onChange={(e) => setLaunchState(prev => ({ ...prev, youtubeId: e.target.value, error: '' }))}
                                                placeholder="e.g. dQw4w9WgXcQ"
                                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                                            />
                                            {launchState.youtubeId && (
                                                <a href={`https://www.youtube.com/watch?v=${launchState.youtubeId}`} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1">
                                                    <ExternalLink className="w-3 h-3" /> Preview on YouTube
                                                </a>
                                            )}
                                        </div>

                                        {launchState.error && (
                                            <div className="text-xs text-red-400 border border-red-700/40 bg-red-900/20 rounded-lg px-3 py-2">
                                                {launchState.error}
                                            </div>
                                        )}

                                        <button
                                            onClick={executeLaunch}
                                            disabled={launchState.step === 'launching' || !launchState.youtubeId.trim()}
                                            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            {launchState.step === 'launching'
                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating campaign…</>
                                                : <><Rocket className="w-4 h-4" /> Create Campaign (PAUSED)</>}
                                        </button>
                                    </div>
                                )}

                                {launchState.step === 'done' && (
                                    <div className="border border-green-600/30 bg-green-900/10 rounded-xl p-5 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Check className="w-5 h-5 text-green-400" />
                                            <h4 className="text-sm font-semibold text-green-300">Campaign Created (PAUSED)</h4>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <div><span className="text-neutral-500">Campaign:</span> <span className="font-mono text-xs text-neutral-300">{launchState.campaignResource}</span></div>
                                            <div><span className="text-neutral-500">Customer:</span> <span className="font-mono text-xs text-neutral-300">{launchState.customerId}</span></div>
                                        </div>
                                        <p className="text-xs text-neutral-400">Activate the campaign in Google Ads Manager when ready to go live.</p>
                                        <a href="https://ads.google.com" target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                                            <ExternalLink className="w-3 h-3" /> Open Google Ads Manager
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
