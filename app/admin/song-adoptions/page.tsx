'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge } from '../../components/primitives/Badge';
import {
    Search, Eye, Check, X, User, Music, DollarSign,
    AlertCircle, BarChart3, Users, Target, TrendingUp, Rocket,
    Loader2, Globe, ExternalLink, RefreshCw, Play, Activity,
    Flag, FileText, CheckCircle
} from 'lucide-react';
import Link from 'next/link';

/**
 * Institutional Lifecycle Transitions
 */
const LIFECYCLE_NEXT: Record<string, { status: string; label: string; icon: any; color: string }> = {
    submitted:         { status: 'under_review',     label: 'Mark Under Review', icon: Search,     color: 'text-amber-400 hover:text-amber-300' },
    payment_pending:   { status: 'payment_received', label: 'Confirm Payment',   icon: DollarSign,   color: 'text-green-400 hover:text-green-300' },
    payment_received:  { status: 'under_review',     label: 'Mark Under Review', icon: Search,     color: 'text-amber-400 hover:text-amber-300' },
    under_review:      { status: 'approved',         label: 'Approve Adoption',  icon: Check,      color: 'text-green-400 hover:text-green-300' },
    approved:          { status: 'live',             label: 'Mark Live',         icon: Play,       color: 'text-emerald-400 hover:text-emerald-300' },
    live:              { status: 'completed',        label: 'Mark Completed',    icon: Flag,       color: 'text-blue-400 hover:text-blue-300' },
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
        const res = await fetch(`/api/adoptions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(patch),
        });
        if (res.ok) {
            const updated = await res.json();
            setAdoptions(prev => prev.map(a => a.id === id ? updated : a));
            if (selectedAdoption?.id === id) setSelectedAdoption(updated);
        }
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
        const paymentOk = adoption.paymentStatus === 'paid' || adoption.methodType === 'use_my_google_ads' || adoption.adoptionStatus === 'payment_received';
        return (adoption.adoptionStatus === 'approved' || adoption.adoptionStatus === 'live') && paymentOk;
    };

    const openLaunchPanel = (adoption: any) => {
        setLaunchState({ ...defaultLaunch(), step: 'input', youtubeId: adoption.youtubeId || '' });
        setSelectedAdoption(adoption);
    };

    const executeLaunch = async () => {
        if (!selectedAdoption) return;
        const adoption = selectedAdoption;

        if (!launchState.youtubeId.trim()) {
            setLaunchState(prev => ({ ...prev, error: 'YouTube Video ID is required.' }));
            return;
        }

        setLaunchState(prev => ({ ...prev, step: 'launching', error: '' }));

        try {
            let releaseTitle = adoption.releaseTitle || `Release ${adoption.releaseId}`;
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
                adoptionStatus: 'live',
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
            (a.sponsorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.sponsorEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.releaseTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.id || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || a.adoptionStatus === statusFilter;
        const matchesMethod = methodFilter === 'all' || a.methodType === methodFilter;
        return matchesSearch && matchesStatus && matchesMethod;
    });

    const getEffectivePaymentStatus = (a: any) => {
        if (a.methodType === 'use_my_google_ads') return 'not_required';
        if (a.adoptionStatus === 'payment_received') return 'paid';
        return a.paymentStatus || 'unpaid';
    };

    const getStatusBadge = (status: string) => {
        const cfg: Record<string, { variant: any; label: string }> = {
            submitted:                           { variant: 'neutral', label: 'Submitted' },
            payment_pending:                     { variant: 'gold',    label: 'Payment Pending' },
            payment_received:                    { variant: 'success', label: 'Payment Received' },
            under_review:                        { variant: 'gold',    label: 'Under Review' },
            approved:                            { variant: 'success', label: 'Approved' },
            live:                                { variant: 'success', label: 'Live' },
            completed:                           { variant: 'success', label: 'Completed' },
            hidden:                              { variant: 'neutral', label: 'Hidden' },
            rejected:                            { variant: 'error',   label: 'Rejected' },
            archived:                            { variant: 'neutral', label: 'Archived' },
            cancelled:                           { variant: 'error',   label: 'Cancelled' },
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
    const paidCampaigns = adoptions.filter((a) => a.paymentStatus === 'paid' || a.methodType === 'use_my_google_ads' || a.adoptionStatus === 'payment_received').length;
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
                        <input type="text" placeholder="Search by sponsor name, email, or release title…" value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} className="dashboard-input has-icon" />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="dashboard-input max-w-48">
                        <option value="all">All Statuses</option>
                        <option value="submitted">Submitted</option>
                        <option value="payment_pending">Payment Pending</option>
                        <option value="payment_received">Payment Received</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="live">Live</option>
                        <option value="completed">Completed</option>
                        <option value="hidden">Hidden</option>
                        <option value="rejected">Rejected</option>
                        <option value="archived">Archived</option>
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
                                    <th>Tier / Amount</th>
                                    <th>Status</th>
                                    <th>Payment</th>
                                    <th>Country</th>
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
                                            <div className="text-sm text-[var(--dash-text-secondary)] truncate max-w-[150px]" title={adoption.releaseTitle}>
                                                {adoption.releaseTitle || '—'}
                                            </div>
                                            {adoption.youtubeId && (
                                              <div className="text-[10px] font-mono text-[var(--dash-text-muted)] mt-0.5">{adoption.youtubeId}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <Badge variant="neutral">{adoption.selectedTierLabel || adoption.paymentLinkTier || '—'}</Badge>
                                                <span className="text-xs text-[var(--dash-text-secondary)] mt-1">${adoption.amountDue || 0}</span>
                                            </div>
                                        </td>
                                        <td>{getStatusBadge(adoption.adoptionStatus)}</td>
                                        <td>{getPaymentBadge(adoption)}</td>
                                        <td>
                                            <span className="text-sm text-[var(--dash-text-secondary)]">{adoption.sponsorCountry || '—'}</span>
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
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">Institutional Adoption Detail</h3>
                                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Ref: {selectedAdoption.id.slice(0,8).toUpperCase()}</p>
                                </div>
                                <button onClick={() => { setSelectedAdoption(null); setLaunchState(defaultLaunch()); }} className="text-neutral-400 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Process Status</label>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(selectedAdoption.adoptionStatus)}
                                            <select 
                                                value={selectedAdoption.adoptionStatus}
                                                onChange={(e) => updateAdoptionStatus(selectedAdoption.id, e.target.value)}
                                                className="bg-black border border-white/5 rounded-lg px-2 py-1 text-[10px] text-neutral-400 outline-none focus:border-amber-400"
                                            >
                                                <option value="submitted">Submitted</option>
                                                <option value="payment_pending">Payment Pending</option>
                                                <option value="payment_received">Payment Received</option>
                                                <option value="under_review">Under Review</option>
                                                <option value="approved">Approved</option>
                                                <option value="live">Live</option>
                                                <option value="completed">Completed</option>
                                                <option value="hidden">Hidden</option>
                                                <option value="rejected">Rejected</option>
                                                <option value="archived">Archived</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Payment</label>
                                        {getPaymentBadge(selectedAdoption)}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[11px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <User className="w-3.5 h-3.5" /> Sponsor Identity & Visibility
                                    </h4>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                            <div><span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Legal Name</span><div className="text-neutral-200 font-medium">{selectedAdoption.sponsorName || '—'}</div></div>
                                            <div><span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Institutional Email</span><div className="text-neutral-200">{selectedAdoption.sponsorEmail || '—'}</div></div>
                                            <div><span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Adopter Type</span><div className="text-neutral-200 capitalize font-medium">{selectedAdoption.adopterType || '—'}</div></div>
                                            <div><span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Location</span><div className="text-neutral-200">{selectedAdoption.sponsorCity ? `${selectedAdoption.sponsorCity}, ` : ''}{selectedAdoption.sponsorCountry || '—'}</div></div>
                                        </div>

                                        <div className="pt-6 border-t border-white/5 space-y-5">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-bold text-white block">Public Listing Approved</span>
                                                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Controls appearance in 'Recent Adopters'</span>
                                                </div>
                                                <button 
                                                    onClick={() => approvePublicListing(selectedAdoption.id, !selectedAdoption.publicListingApproved)}
                                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${selectedAdoption.publicListingApproved ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/30'}`}
                                                >
                                                    {selectedAdoption.publicListingApproved ? 'Authorized' : 'Suppressed'}
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-bold text-white block">Anonymous Sponsorship</span>
                                                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Overrides name with 'Anonymous' publicly</span>
                                                </div>
                                                <button 
                                                    onClick={() => { patchAdoption(selectedAdoption.id, { isAnonymous: !selectedAdoption.isAnonymous }).then(() => loadAdoptions()); }}
                                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${selectedAdoption.isAnonymous ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/30'}`}
                                                >
                                                    {selectedAdoption.isAnonymous ? 'Anonymous' : 'Named'}
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest block ml-1">Public Display Name (Override)</label>
                                                <input 
                                                    type="text"
                                                    defaultValue={selectedAdoption.sponsorName}
                                                    onBlur={(e) => patchAdoption(selectedAdoption.id, { sponsorName: e.target.value })}
                                                    placeholder="Enter name as it should appear publicly..."
                                                    className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[11px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <Music className="w-3.5 h-3.5" /> Campaign Context
                                    </h4>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
                                        <div><span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Target Release</span><div className="text-neutral-200 font-bold tracking-tight">{selectedAdoption.releaseTitle || '—'}</div></div>
                                        <div><span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Methodology</span><div className="text-neutral-200 font-medium">{selectedAdoption.methodType === 'managed_sufitube' ? 'SufiPulse Managed' : 'Google Ads Direct'}</div></div>
                                        <div><span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Sponsorship Amount</span><div className="text-amber-400 font-bold">${selectedAdoption.amountDue || 0}</div></div>
                                        <div><span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Stated Intention</span><div className="text-neutral-200 font-medium">{INTENTION_LABELS[selectedAdoption.campaignIntention] || selectedAdoption.campaignIntention || '—'}</div></div>
                                        <div className="col-span-2"><span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Target Regions</span><div className="text-neutral-400 text-xs">{selectedAdoption.targetRegions?.join(', ') || '—'}</div></div>
                                    </div>
                                </div>

                                {selectedAdoption.dedicationMessage && (
                                    <div>
                                        <h4 className="text-[11px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-3">Sponsor Dedication</h4>
                                        <div className="bg-amber-400/[0.02] border border-amber-400/10 rounded-2xl p-6">
                                            <p className="text-neutral-300 italic text-base leading-relaxed">"{selectedAdoption.dedicationMessage}"</p>
                                        </div>
                                    </div>
                                )}

                                {/* Admin Management */}
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4">Institutional Oversight</h4>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Internal Coordination Notes</label>
                                            <textarea
                                                defaultValue={selectedAdoption.adminNote || ''}
                                                onBlur={async (e) => {
                                                    await patchAdoption(selectedAdoption.id, { adminNote: e.target.value });
                                                }}
                                                placeholder="Add internal notes for governance team..."
                                                rows={3}
                                                className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-xs text-neutral-300 placeholder-neutral-700 focus:border-amber-400 outline-none resize-none transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Official Report URL</label>
                                            <div className="relative">
                                                <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                                <input
                                                    type="url"
                                                    defaultValue={selectedAdoption.reportUrl || ''}
                                                    onBlur={async (e) => {
                                                        if (e.target.value !== (selectedAdoption.reportUrl || '')) {
                                                            await patchAdoption(selectedAdoption.id, { reportUrl: e.target.value || null });
                                                        }
                                                    }}
                                                    placeholder="https://analytics.sufipulse.com/..."
                                                    className="w-full bg-black border border-white/5 rounded-xl pl-12 pr-4 py-3 text-xs text-blue-400 placeholder-neutral-700 focus:border-amber-400 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {canLaunch(selectedAdoption) && launchState.step !== 'done' && (
                                    <div className="border border-amber-400/20 bg-amber-400/[0.02] rounded-3xl p-8 space-y-6 shadow-2xl">
                                        <div className="flex items-center gap-3">
                                            <Rocket className="w-6 h-6 text-amber-400" />
                                            <h4 className="text-base font-bold text-white tracking-tight">Activate Ad Campaign</h4>
                                        </div>
                                        <p className="text-xs text-neutral-400 leading-relaxed">
                                            Proceed to generate a PAUSED campaign in Google Ads. Institutional team must activate manually after creative review.
                                        </p>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Validated YouTube Video ID</label>
                                            <input
                                                type="text"
                                                value={launchState.youtubeId}
                                                onChange={(e) => setLaunchState(prev => ({ ...prev, youtubeId: e.target.value, error: '' }))}
                                                placeholder="e.g. q58mRXIsi-Y"
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-700 focus:border-amber-400 outline-none"
                                            />
                                        </div>

                                        {launchState.error && (
                                            <div className="text-xs font-bold uppercase tracking-wider text-red-400 border border-red-500/20 bg-red-500/5 rounded-xl px-4 py-3">
                                                {launchState.error}
                                            </div>
                                        )}

                                        <button
                                            onClick={executeLaunch}
                                            disabled={launchState.step === 'launching' || !launchState.youtubeId.trim()}
                                            className="w-full py-4 bg-amber-400 hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl"
                                        >
                                            {launchState.step === 'launching'
                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating Protocol…</>
                                                : <><Rocket className="w-4 h-4" /> Create Institutional Campaign</>}
                                        </button>
                                    </div>
                                )}

                                {launchState.step === 'done' && (
                                    <div className="border border-emerald-500/20 bg-emerald-500/[0.02] rounded-3xl p-8 space-y-4 shadow-2xl animate-in fade-in zoom-in">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                                            <h4 className="text-base font-bold text-white tracking-tight">Campaign Logged</h4>
                                        </div>
                                        <div className="space-y-3 pt-2">
                                            <div><p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">Resource Path</p><p className="font-mono text-[10px] text-neutral-300 truncate">{launchState.campaignResource}</p></div>
                                            <div><p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">Customer ID</p><p className="font-mono text-[10px] text-neutral-300">{launchState.customerId}</p></div>
                                        </div>
                                        <a href="https://ads.google.com" target="_blank" rel="noopener noreferrer"
                                            className="w-full py-3 bg-white/[0.03] hover:bg-white/5 border border-white/10 text-neutral-400 hover:text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-xl transition-all flex items-center justify-center gap-2 mt-4">
                                            Open Ads Manager <ExternalLink size={12} />
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
