'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge } from '../../components/primitives/Badge';
import {
    Search, Eye, Check, X, Calendar, User, Music, DollarSign,
    AlertCircle, BarChart3, Users, Target, TrendingUp, Rocket,
    Loader2, Globe, CreditCard, ExternalLink, RefreshCw,
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { SongAdoption, SongAdoptionSponsor } from '../../types/adoption.types';

interface AdoptionWithSponsor extends SongAdoption {
    sponsor?: SongAdoptionSponsor;
    googleAdsCustomerId?: string;
    oauthConnected?: boolean;
    billingEnabled?: boolean;
    paymentRoute?: string;
    estimatedImpressionsMin?: number;
    estimatedImpressionsMax?: number;
}

interface ServerPaymentRecord {
    adoptionId: string;
    paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed';
    adoptionStatus: string;
    amountPaid: number;
    stripeSessionId?: string;
    lastEventType?: string;
    updatedAt: string;
}

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

export default function AdminSongAdoptions() {
    const [adoptions, setAdoptions] = useState<AdoptionWithSponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [serverPaymentRecords, setServerPaymentRecords] = useState<Record<string, ServerPaymentRecord | null>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [methodFilter, setMethodFilter] = useState<string>('all');
    const [selectedAdoption, setSelectedAdoption] = useState<AdoptionWithSponsor | null>(null);
    const [launchState, setLaunchState] = useState<LaunchState>(defaultLaunch());
    const [googleAdsSummary, setGoogleAdsSummary] = useState<any | null>(null);
    const [googleAdsError, setGoogleAdsError] = useState<string | null>(null);
    const [insightsLoading, setInsightsLoading] = useState(false);

    useEffect(() => { loadAdoptions(); }, []);

    const loadAdoptions = async () => {
        try {
            const allAdoptions = await storage.getSongAdoptions();
            const sponsors = await storage.getAll('song_adoption_sponsor');
            const googleAdsRecords = await storage.getAll('song_adoption_google_ads');
            const packages = await storage.getSongAdoptionPackages();
            const events = await storage.getAll('song_adoption_event');

            const sponsorMap = new Map<string, SongAdoptionSponsor>(sponsors.map((s: any) => [s.adoption_id, s]));
            const gadsMap = new Map<string, any>(googleAdsRecords.map((r: any) => [r.adoption_id, r]));
            const pkgMap = new Map<string, any>(packages.map((p: any) => [p.id, p]));
            const eventMap = new Map<string, any[]>();
            for (const ev of events) {
                const arr = eventMap.get(ev.adoption_id) || [];
                arr.push(ev);
                eventMap.set(ev.adoption_id, arr);
            }

            const result: AdoptionWithSponsor[] = allAdoptions.map((a: SongAdoption) => {
                const gads = gadsMap.get(a.id);
                const pkg = a.package_id ? pkgMap.get(a.package_id) : null;
                const evs = eventMap.get(a.id) || [];
                const submitEv = evs.find((e: any) => e.event_type === 'submitted' || e.event_type === 'payment_route_selected');
                const paymentRoute = (a as any).payment_route || submitEv?.metadata?.payment_route || gads?.payment_route || null;
                return {
                    ...a,
                    sponsor: sponsorMap.get(a.id),
                    googleAdsCustomerId: gads?.customer_id,
                    oauthConnected: !!gads?.oauth_connected,
                    billingEnabled: !!gads?.billing_enabled,
                    paymentRoute,
                    estimatedImpressionsMin: pkg?.estimated_impressions_min || 0,
                    estimatedImpressionsMax: pkg?.estimated_impressions_max || 0,
                };
            });

            setAdoptions(result);

            const paymentEntries = await Promise.all(
                result.map(async (item) => {
                    try {
                        const res = await fetch(`/api/adoptions/${item.id}`);
                        if (!res.ok) return [item.id, null] as const;
                        const payload = await res.json();
                        return [item.id, (payload?.payment_record || null) as ServerPaymentRecord | null] as const;
                    } catch { return [item.id, null] as const; }
                })
            );
            setServerPaymentRecords(Object.fromEntries(paymentEntries));

            const customerIds = result.map((i) => i.googleAdsCustomerId).filter((id): id is string => Boolean(id));
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

    const updateAdoptionStatus = async (adoptionId: string, status: string) => {
        await storage.updateSongAdoption(adoptionId, { adoption_status: status });
        await storage.createSongAdoptionEvent({
            adoption_id: adoptionId,
            event_type: 'status_changed',
            event_label: `Status changed to ${status}`,
            actor_type: 'admin',
            metadata: { new_status: status },
        });
        await loadAdoptions();
    };

    const approvePublicListing = async (adoptionId: string, approved: boolean) => {
        await storage.updateSongAdoption(adoptionId, { public_listing_approved: approved });
        await loadAdoptions();
    };

    const canLaunch = (adoption: AdoptionWithSponsor) => {
        const serverRecord = serverPaymentRecords[adoption.id];
        const effectivePayment = serverRecord?.paymentStatus || adoption.payment_status;
        const paymentOk = effectivePayment === 'paid' || adoption.paymentRoute === 'google_direct';
        return adoption.adoption_status === 'approved' && paymentOk && !hasPaymentMismatch(adoption);
    };

    const openLaunchPanel = (adoption: AdoptionWithSponsor) => {
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
        if (!adoption.release_id) {
            setLaunchState(prev => ({ ...prev, error: 'Release ID missing from adoption record.' }));
            return;
        }

        setLaunchState(prev => ({ ...prev, step: 'launching', error: '' }));

        try {
            let releaseTitle = `Release ${adoption.release_id}`;
            try {
                const relRes = await fetch(`/api/releases/${adoption.release_id}`);
                if (relRes.ok) { const rel = await relRes.json(); releaseTitle = rel.title || releaseTitle; }
            } catch {}

            const body: Record<string, any> = {
                adoption_id: adoption.id,
                method_type: adoption.method_type,
                youtube_video_id: launchState.youtubeId.trim(),
                release_title: releaseTitle,
                budget_usd: adoption.amount_due,
                target_regions: adoption.target_regions || ['US', 'GB', 'AE'],
                target_languages: adoption.target_languages || ['en', 'ur'],
                campaign_objective: adoption.campaign_objective || 'awareness',
            };
            if (adoption.method_type === 'use_my_google_ads') {
                body.sponsor_customer_id = adoption.googleAdsCustomerId;
            }

            const res = await fetch('/api/admin/google-ads/create-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Campaign creation failed');

            await storage.updateSongAdoption(adoption.id, {
                adoption_status: 'scheduled',
                google_ads_campaign_resource: data.campaign_resource_name,
            });
            await storage.createSongAdoptionEvent({
                adoption_id: adoption.id,
                event_type: 'campaign_created',
                event_label: `Google Ads campaign created — status: ${data.status}`,
                actor_type: 'admin',
                metadata: { campaign_resource_name: data.campaign_resource_name, customer_id: data.customer_id },
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
            a.sponsor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.sponsor?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || a.adoption_status === statusFilter;
        const matchesMethod = methodFilter === 'all' || a.method_type === methodFilter;
        return matchesSearch && matchesStatus && matchesMethod;
    });

    const hasPaymentMismatch = (a: AdoptionWithSponsor) => {
        const server = serverPaymentRecords[a.id];
        return !!server && server.paymentStatus !== a.payment_status && a.paymentRoute !== 'google_direct';
    };

    const getEffectivePaymentStatus = (a: AdoptionWithSponsor) => {
        if (a.paymentRoute === 'google_direct') return 'google_direct';
        return serverPaymentRecords[a.id]?.paymentStatus || a.payment_status;
    };

    const getStatusBadge = (status: string) => {
        const cfg: Record<string, { variant: any; label: string }> = {
            draft: { variant: 'neutral', label: 'Draft' },
            pending_review: { variant: 'neutral', label: 'Pending Review' },
            approved: { variant: 'success', label: 'Approved' },
            scheduled: { variant: 'gold', label: 'Scheduled' },
            live: { variant: 'success', label: 'Live' },
            completed: { variant: 'success', label: 'Completed' },
            cancelled: { variant: 'error', label: 'Cancelled' },
        };
        const c = cfg[status] || cfg.pending_review;
        return <Badge variant={c.variant}>{c.label}</Badge>;
    };

    const getPaymentBadge = (a: AdoptionWithSponsor) => {
        const status = getEffectivePaymentStatus(a);
        if (status === 'google_direct') return <Badge variant="success">Google Direct</Badge>;
        const cfg: Record<string, { variant: any; label: string }> = {
            unpaid: { variant: 'error', label: 'Unpaid' },
            pending: { variant: 'gold', label: 'Pending' },
            paid: { variant: 'success', label: 'Paid' },
            failed: { variant: 'error', label: 'Failed' },
            refunded: { variant: 'neutral', label: 'Refunded' },
        };
        const c = cfg[status] || cfg.unpaid;
        return <Badge variant={c.variant}>{c.label}</Badge>;
    };

    const totalCampaigns = adoptions.length;
    const paidCampaigns = adoptions.filter((a) => a.payment_status === 'paid' || a.paymentRoute === 'google_direct').length;
    const totalBudget = adoptions.reduce((s, a) => s + Number(a.amount_due || 0), 0);
    const totalAdopters = new Set(adoptions.map((a) => a.sponsor?.email || a.sponsor?.id).filter(Boolean)).size;
    const objectiveCounts = adoptions.reduce<Record<string, number>>((acc, a) => {
        const o = a.campaign_objective || 'awareness';
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
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--dash-text-primary)]">Song Adoptions</h1>
                        <p className="text-sm text-[var(--dash-text-secondary)] mt-1">Manage sponsorship requests, campaign performance, and platform impact.</p>
                    </div>
                    <button onClick={loadAdoptions} className="flex items-center gap-2 text-sm text-[var(--dash-text-secondary)] hover:text-[var(--dash-text-primary)] transition-colors">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Campaigns', value: totalCampaigns, sub: `Confirmed: ${paidCampaigns}`, icon: BarChart3 },
                        { label: 'Unique Sponsors', value: totalAdopters, sub: 'People / organizations', icon: Users },
                        { label: 'Campaign Budget', value: `$${totalBudget.toLocaleString()}`, sub: `${adoptions.filter(a => a.adoption_status === 'live').length} live`, icon: DollarSign },
                        { label: 'Google Ads Linked', value: adoptions.filter(a => a.googleAdsCustomerId).length, sub: `OAuth connected: ${adoptions.filter(a => a.oauthConnected).length}`, icon: Target },
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

                {/* Insights */}
                <div className="dashboard-card">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-[var(--dash-accent)]" />
                        <h3 className="font-semibold text-[var(--dash-text-primary)]">Campaign Impact Overview</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-[var(--dash-text-secondary)] mb-2">Objective Distribution</p>
                            <div className="space-y-1 text-sm">
                                {Object.keys(objectiveCounts).length === 0
                                    ? <p className="text-[var(--dash-text-muted)]">No campaign data yet.</p>
                                    : Object.entries(objectiveCounts).map(([obj, cnt]) => (
                                        <div key={obj} className="flex justify-between text-[var(--dash-text-secondary)]">
                                            <span className="capitalize">{obj.replace(/_/g, ' ')}</span>
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

                {/* Filters */}
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
                        <option value="approved">Approved</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="live">Live</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="dashboard-input max-w-56">
                        <option value="all">All Methods</option>
                        <option value="managed_sufitube">Managed by SufiTube</option>
                        <option value="use_my_google_ads">Use My Google Ads</option>
                    </select>
                </div>

                {/* Table */}
                <div className="dashboard-table-container">
                    <div className="overflow-x-auto">
                        <table className="dashboard-table w-full">
                            <thead>
                                <tr>
                                    <th>Sponsor</th>
                                    <th>Method</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Payment</th>
                                    <th>OAuth</th>
                                    <th>Payment Route</th>
                                    <th>Campaign ID</th>
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
                                                    <div className="text-sm font-medium text-[var(--dash-text-primary)]">{adoption.sponsor?.full_name || 'Unknown'}</div>
                                                    <div className="text-xs text-[var(--dash-text-muted)]">{adoption.sponsor?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-sm text-[var(--dash-text-secondary)] capitalize">
                                                {adoption.method_type === 'managed_sufitube' ? 'SufiTube' : 'My Google Ads'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-sm text-[var(--dash-text-secondary)]">${adoption.amount_due}</span>
                                        </td>
                                        <td>{getStatusBadge(adoption.adoption_status)}</td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                {getPaymentBadge(adoption)}
                                                {hasPaymentMismatch(adoption) && (
                                                    <span title="Payment status mismatch"><AlertCircle className="w-3.5 h-3.5 text-amber-400" /></span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {adoption.method_type === 'use_my_google_ads' ? (
                                                adoption.oauthConnected
                                                    ? <span className="text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Yes</span>
                                                    : <span className="text-xs text-red-400 flex items-center gap-1"><X className="w-3 h-3" /> No</span>
                                            ) : <span className="text-xs text-neutral-600">—</span>}
                                        </td>
                                        <td>
                                            {adoption.paymentRoute
                                                ? <span className="text-xs text-neutral-400">{adoption.paymentRoute === 'google_direct' ? 'Google' : 'Stripe'}</span>
                                                : <span className="text-xs text-neutral-600">—</span>}
                                        </td>
                                        <td>
                                            {(adoption as any).google_ads_campaign_resource ? (
                                                <span className="text-xs font-mono text-blue-400 truncate max-w-[120px] block" title={(adoption as any).google_ads_campaign_resource}>
                                                    {(adoption as any).google_ads_campaign_resource?.split('/').pop()}
                                                </span>
                                            ) : <span className="text-xs text-neutral-600">—</span>}
                                        </td>
                                        <td>
                                            <span className="text-sm text-[var(--dash-text-secondary)]">
                                                {new Date(adoption.created_at).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => { setSelectedAdoption(adoption); setLaunchState(defaultLaunch()); }} className="p-1 text-neutral-400 hover:text-neutral-200" title="View Details">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {adoption.adoption_status === 'pending_review' && (
                                                    <>
                                                        <button onClick={() => updateAdoptionStatus(adoption.id, 'approved')} className="p-1 text-green-400 hover:text-green-300" title="Approve"><Check className="w-4 h-4" /></button>
                                                        <button onClick={() => updateAdoptionStatus(adoption.id, 'cancelled')} className="p-1 text-red-400 hover:text-red-300" title="Reject"><X className="w-4 h-4" /></button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => approvePublicListing(adoption.id, !adoption.public_listing_approved)}
                                                    className={`p-1 ${adoption.public_listing_approved ? 'text-blue-400' : 'text-neutral-500'} hover:text-blue-300`}
                                                    title={adoption.public_listing_approved ? 'Hide from public' : 'Show publicly'}
                                                >
                                                    <Eye className="w-4 h-4" />
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

                {/* Detail + Launch Modal */}
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
                                {/* Status row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1.5">Status</label>
                                        {getStatusBadge(selectedAdoption.adoption_status)}
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1.5">Payment</label>
                                        <div className="flex items-center gap-2">
                                            {getPaymentBadge(selectedAdoption)}
                                            {hasPaymentMismatch(selectedAdoption) && (
                                                <span className="text-xs text-amber-400">Mismatch</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {hasPaymentMismatch(selectedAdoption) && (
                                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                                        Local status: <strong>{selectedAdoption.payment_status}</strong> · Server: <strong>{serverPaymentRecords[selectedAdoption.id]?.paymentStatus}</strong>. Resolve before launching.
                                    </div>
                                )}

                                {/* Sponsor */}
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-300 mb-2 flex items-center gap-2"><User className="w-4 h-4" /> Sponsor</h4>
                                    <div className="bg-neutral-800 rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
                                        <div><span className="text-neutral-500">Name</span><div className="text-neutral-200">{selectedAdoption.sponsor?.full_name || '—'}</div></div>
                                        <div><span className="text-neutral-500">Email</span><div className="text-neutral-200">{selectedAdoption.sponsor?.email || '—'}</div></div>
                                        <div><span className="text-neutral-500">Type</span><div className="text-neutral-200 capitalize">{selectedAdoption.sponsor?.adopter_type || '—'}</div></div>
                                        <div><span className="text-neutral-500">Location</span><div className="text-neutral-200">{selectedAdoption.sponsor?.city ? `${selectedAdoption.sponsor.city}, ` : ''}{selectedAdoption.sponsor?.country || '—'}</div></div>
                                    </div>
                                </div>

                                {/* Adoption details */}
                                <div>
                                    <h4 className="text-sm font-semibold text-neutral-300 mb-2 flex items-center gap-2"><Music className="w-4 h-4" /> Campaign Details</h4>
                                    <div className="bg-neutral-800 rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
                                        <div><span className="text-neutral-500">Method</span><div className="text-neutral-200 capitalize">{selectedAdoption.method_type.replace(/_/g, ' ')}</div></div>
                                        <div><span className="text-neutral-500">Amount</span><div className="text-neutral-200">${selectedAdoption.amount_due}</div></div>
                                        <div><span className="text-neutral-500">Objective</span><div className="text-neutral-200 capitalize">{selectedAdoption.campaign_objective?.replace(/_/g, ' ') || '—'}</div></div>
                                        <div><span className="text-neutral-500">Regions</span><div className="text-neutral-200">{selectedAdoption.target_regions?.join(', ') || '—'}</div></div>
                                        <div><span className="text-neutral-500">Payment Route</span>
                                            <div className="text-neutral-200">{selectedAdoption.paymentRoute === 'google_direct' ? 'Pay Google Directly' : selectedAdoption.paymentRoute === 'stripe_sufipulse' ? 'SufiPulse Stripe' : '—'}</div>
                                        </div>
                                        <div><span className="text-neutral-500">Reference</span><div className="text-neutral-400 font-mono text-xs">{selectedAdoption.id}</div></div>
                                    </div>
                                </div>

                                {/* Google Ads block */}
                                {selectedAdoption.method_type === 'use_my_google_ads' && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-300 mb-2 flex items-center gap-2"><Globe className="w-4 h-4" /> Google Ads</h4>
                                        <div className="bg-neutral-800 rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
                                            <div><span className="text-neutral-500">Customer ID</span><div className="text-neutral-200 font-mono">{selectedAdoption.googleAdsCustomerId || '—'}</div></div>
                                            <div><span className="text-neutral-500">OAuth Connected</span>
                                                <div className={selectedAdoption.oauthConnected ? 'text-green-400' : 'text-red-400'}>
                                                    {selectedAdoption.oauthConnected ? 'Yes' : 'No'}
                                                </div>
                                            </div>
                                            <div><span className="text-neutral-500">Billing Enabled</span><div className="text-neutral-200">{selectedAdoption.billingEnabled ? 'Yes' : 'No'}</div></div>
                                            <div><span className="text-neutral-500">Campaign Resource</span>
                                                <div className="text-neutral-400 font-mono text-xs truncate" title={(selectedAdoption as any).google_ads_campaign_resource || ''}>
                                                    {(selectedAdoption as any).google_ads_campaign_resource || '—'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedAdoption.dedication_message && (
                                    <div className="bg-neutral-800 rounded-lg p-4">
                                        <p className="text-xs text-neutral-500 mb-1">Dedication</p>
                                        <p className="text-neutral-300 italic text-sm">"{selectedAdoption.dedication_message}"</p>
                                    </div>
                                )}

                                {/* Status actions */}
                                {selectedAdoption.adoption_status === 'pending_review' && launchState.step === 'idle' && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { updateAdoptionStatus(selectedAdoption.id, 'approved'); setSelectedAdoption(prev => prev ? { ...prev, adoption_status: 'approved' } : prev); }}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                                        >Approve</button>
                                        <button
                                            onClick={() => { updateAdoptionStatus(selectedAdoption.id, 'cancelled'); setSelectedAdoption(null); }}
                                            className="px-4 py-2 border border-red-600 text-red-400 hover:bg-red-600/10 rounded-lg transition-colors text-sm"
                                        >Reject</button>
                                    </div>
                                )}

                                {/* Launch Campaign Panel */}
                                {canLaunch(selectedAdoption) && launchState.step !== 'done' && (
                                    <div className="border border-amber-600/30 bg-amber-900/10 rounded-xl p-5 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Rocket className="w-5 h-5 text-amber-400" />
                                            <h4 className="text-sm font-semibold text-amber-300">Launch Google Ads Campaign</h4>
                                        </div>
                                        <p className="text-xs text-neutral-400 leading-relaxed">
                                            Campaign will be created in <strong className="text-amber-300">PAUSED</strong> state in Google Ads. Activate it manually in Google Ads Manager after final review.
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

                                {/* Launch success */}
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
                                        <a
                                            href="https://ads.google.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                                        >
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
