'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge } from '../../components/primitives/Badge';
import {
    Search,
    Eye,
    Check,
    X,
    Calendar,
    User,
    Music,
    DollarSign,
    AlertCircle,
    BarChart3,
    Users,
    Target,
    TrendingUp,
    Rocket,
    Loader2,
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { SongAdoption, SongAdoptionSponsor } from '../../types/adoption.types';

interface AdoptionWithSponsor extends SongAdoption {
    sponsor?: SongAdoptionSponsor;
    googleAdsCustomerId?: string;
    googleAdsAccessToken?: string;
    estimatedImpressionsMin?: number;
    estimatedImpressionsMax?: number;
}

interface GoogleAdsSummary {
    impressions: number;
    clicks: number;
    conversions: number;
    costMicros: number;
    videoViews: number;
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

export default function AdminSongAdoptions() {
    const [adoptions, setAdoptions] = useState<AdoptionWithSponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [launchingId, setLaunchingId] = useState<string | null>(null);
    const [googleAdsSummary, setGoogleAdsSummary] = useState<GoogleAdsSummary | null>(null);
    const [googleAdsError, setGoogleAdsError] = useState<string | null>(null);
    const [serverPaymentRecords, setServerPaymentRecords] = useState<Record<string, ServerPaymentRecord | null>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [methodFilter, setMethodFilter] = useState<string>('all');
    const [selectedAdoption, setSelectedAdoption] = useState<AdoptionWithSponsor | null>(null);

    useEffect(() => {
        loadAdoptions();
    }, []);

    const loadAdoptions = async () => {
        try {
            const allAdoptions = await storage.getSongAdoptions();
            const sponsors = await storage.getAll('song_adoption_sponsor');
            const googleAdsRecords = await storage.getAll('song_adoption_google_ads');
            const packages = await storage.getSongAdoptionPackages();

            const sponsorByAdoptionId = new Map<string, SongAdoptionSponsor>();
            for (const sponsor of sponsors) {
                sponsorByAdoptionId.set(sponsor.adoption_id, sponsor);
            }

            const googleAdsByAdoptionId = new Map<string, any>();
            for (const record of googleAdsRecords) {
                googleAdsByAdoptionId.set(record.adoption_id, record);
            }

            const packageById = new Map<string, any>();
            for (const pkg of packages) {
                packageById.set(pkg.id, pkg);
            }

            const adoptionsWithSponsors: AdoptionWithSponsor[] = [];

            for (const adoption of allAdoptions) {
                const adoptionSponsor = sponsorByAdoptionId.get(adoption.id);
                const googleAds = googleAdsByAdoptionId.get(adoption.id);
                const pkg = adoption.package_id ? packageById.get(adoption.package_id) : null;
                adoptionsWithSponsors.push({
                    ...adoption,
                    sponsor: adoptionSponsor,
                    googleAdsCustomerId: googleAds?.customer_id,
                    googleAdsAccessToken: googleAds?.access_token,
                    estimatedImpressionsMin: pkg?.estimated_impressions_min || 0,
                    estimatedImpressionsMax: pkg?.estimated_impressions_max || 0,
                });
            }

            setAdoptions(adoptionsWithSponsors);

            const paymentEntries = await Promise.all(
                adoptionsWithSponsors.map(async (item) => {
                    try {
                        const res = await fetch(`/api/adoptions/${item.id}`);
                        if (!res.ok) return [item.id, null] as const;
                        const payload = await res.json();
                        return [item.id, (payload?.payment_record || null) as ServerPaymentRecord | null] as const;
                    } catch {
                        return [item.id, null] as const;
                    }
                })
            );

            setServerPaymentRecords(Object.fromEntries(paymentEntries));

            const customerIds = adoptionsWithSponsors
                .map((item) => item.googleAdsCustomerId)
                .filter((id): id is string => Boolean(id));

            if (customerIds.length > 0) {
                await loadGoogleAdsInsights(customerIds);
            } else {
                setGoogleAdsSummary(null);
                setGoogleAdsError('No Google Ads customer IDs linked yet for API insights.');
            }
        } catch (error) {
            console.error('Error loading adoptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGoogleAdsInsights = async (customerIds: string[]) => {
        try {
            setInsightsLoading(true);
            setGoogleAdsError(null);

            const response = await fetch('/api/admin/google-ads/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerIds }),
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || 'Failed to load Google Ads insights');
            }

            setGoogleAdsSummary(payload.summary || null);
        } catch (error: any) {
            setGoogleAdsSummary(null);
            setGoogleAdsError(error?.message || 'Google Ads insights unavailable');
        } finally {
            setInsightsLoading(false);
        }
    };

    const updateAdoptionStatus = async (adoptionId: string, status: string) => {
        try {
            await storage.updateSongAdoption(adoptionId, { adoption_status: status });
            await storage.createSongAdoptionEvent({
                adoption_id: adoptionId,
                event_type: 'status_changed',
                event_label: `Status changed to ${status}`,
                actor_type: 'admin',
                metadata: { new_status: status }
            });
            await loadAdoptions();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const approvePublicListing = async (adoptionId: string, approved: boolean) => {
        try {
            await storage.updateSongAdoption(adoptionId, { public_listing_approved: approved });
            await loadAdoptions();
        } catch (error) {
            console.error('Error updating public listing:', error);
        }
    };

    const launchCampaign = async (adoption: AdoptionWithSponsor) => {
        const serverRecord = serverPaymentRecords[adoption.id];
        const effectivePaymentStatus = serverRecord?.paymentStatus || adoption.payment_status;

        if (effectivePaymentStatus !== 'paid') {
            alert('Cannot launch campaign — payment not confirmed.');
            return;
        }

        if (serverRecord && serverRecord.paymentStatus !== adoption.payment_status) {
            alert('Payment status mismatch detected between local and server reconciliation. Please re-check this adoption before launching.');
            return;
        }
        if (!adoption.release_id) {
            alert('Cannot launch campaign — release ID missing.');
            return;
        }

        // We need the youtube video ID for the release. Try to fetch from CMS.
        let youtubeId = '';
        let releaseTitle = `Release ${adoption.release_id}`;
        try {
            const res = await fetch(`/api/releases/${adoption.release_id}`);
            if (res.ok) {
                const rel = await res.json();
                youtubeId = rel.youtubeId || '';
                releaseTitle = rel.title || releaseTitle;
            }
        } catch {}

        if (!youtubeId) {
            const manualId = prompt(
                `Enter the YouTube Video ID for release "${releaseTitle}" to create the ad:`
            );
            if (!manualId?.trim()) return;
            youtubeId = manualId.trim();
        }

        setLaunchingId(adoption.id);
        try {
            const body: Record<string, any> = {
                adoption_id: adoption.id,
                method_type: adoption.method_type,
                youtube_video_id: youtubeId,
                release_title: releaseTitle,
                budget_usd: adoption.amount_due,
                target_regions: adoption.target_regions || ['US', 'GB', 'AE'],
                target_languages: adoption.target_languages || ['en', 'ur'],
                campaign_objective: adoption.campaign_objective || 'awareness',
            };

            if (adoption.method_type === 'use_my_google_ads') {
                body.sponsor_customer_id = adoption.googleAdsCustomerId;
                body.sponsor_access_token = adoption.googleAdsAccessToken;
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
                event_label: 'Google Ads campaign created (PAUSED)',
                actor_type: 'admin',
                metadata: {
                    campaign_resource_name: data.campaign_resource_name,
                    customer_id: data.customer_id,
                },
            });

            alert(
                `Campaign created in PAUSED state.\nResource: ${data.campaign_resource_name}\nActivate it in Google Ads Manager when ready.`
            );
            await loadAdoptions();
        } catch (err: any) {
            alert(`Campaign launch failed: ${err.message}`);
        } finally {
            setLaunchingId(null);
        }
    };

    const filteredAdoptions = adoptions.filter(adoption => {
        const matchesSearch = !searchTerm ||
            adoption.sponsor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            adoption.sponsor?.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || adoption.adoption_status === statusFilter;
        const matchesMethod = methodFilter === 'all' || adoption.method_type === methodFilter;

        return matchesSearch && matchesStatus && matchesMethod;
    });

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending_review: { variant: 'neutral' as const, label: 'Pending Review' },
            approved: { variant: 'success' as const, label: 'Approved' },
            scheduled: { variant: 'gold' as const, label: 'Scheduled' },
            live: { variant: 'success' as const, label: 'Live' },
            completed: { variant: 'success' as const, label: 'Completed' },
            cancelled: { variant: 'error' as const, label: 'Cancelled' }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_review;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getPaymentStatusBadge = (status: string) => {
        const statusConfig = {
            unpaid: { variant: 'error' as const, label: 'Unpaid' },
            pending: { variant: 'gold' as const, label: 'Pending' },
            paid: { variant: 'success' as const, label: 'Paid' },
            failed: { variant: 'error' as const, label: 'Failed' },
            refunded: { variant: 'neutral' as const, label: 'Refunded' },
            partially_refunded: { variant: 'gold' as const, label: 'Partial Refund' }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unpaid;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const hasPaymentMismatch = (adoption: AdoptionWithSponsor) => {
        const server = serverPaymentRecords[adoption.id];
        return !!server && server.paymentStatus !== adoption.payment_status;
    };

    const getEffectivePaymentStatus = (adoption: AdoptionWithSponsor) => {
        return serverPaymentRecords[adoption.id]?.paymentStatus || adoption.payment_status;
    };

    const totalAdopters = new Set(
        adoptions.map((adoption) => adoption.sponsor?.email || adoption.sponsor?.id).filter(Boolean)
    ).size;
    const totalCampaigns = adoptions.length;
    const paidCampaigns = adoptions.filter((adoption) => adoption.payment_status === 'paid').length;
    const totalBudget = adoptions.reduce((sum, adoption) => sum + Number(adoption.amount_due || 0), 0);
    const totalPaid = adoptions.reduce((sum, adoption) => sum + Number(adoption.amount_paid || 0), 0);
    const estimatedReachMin = adoptions.reduce((sum, adoption) => sum + Number(adoption.estimatedImpressionsMin || 0), 0);
    const estimatedReachMax = adoptions.reduce((sum, adoption) => sum + Number(adoption.estimatedImpressionsMax || 0), 0);
    const objectiveCounts = adoptions.reduce<Record<string, number>>((acc, adoption) => {
        const objective = adoption.campaign_objective || 'awareness';
        acc[objective] = (acc[objective] || 0) + 1;
        return acc;
    }, {});

    if (loading) {
        return (
            <DashboardLayout>
                <div className="dashboard-loading">
                    <p>Loading adoptions...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--dash-text-primary)]">Song Adoptions</h1>
                            <p className="text-sm text-[var(--dash-text-secondary)] mt-1">Manage sponsorship requests, campaign performance, and platform impact.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-[var(--dash-text-secondary)]">
                                {filteredAdoptions.length} adoption{filteredAdoptions.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div className="dashboard-card">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-[var(--dash-text-secondary)]">Total Campaigns</p>
                                <BarChart3 className="w-4 h-4 text-[var(--dash-accent)]" />
                            </div>
                            <p className="text-2xl font-bold text-[var(--dash-text-primary)]">{totalCampaigns}</p>
                            <p className="text-xs text-[var(--dash-text-muted)]">Paid: {paidCampaigns}</p>
                        </div>
                        <div className="dashboard-card">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-[var(--dash-text-secondary)]">Unique Sponsors</p>
                                <Users className="w-4 h-4 text-[var(--dash-accent)]" />
                            </div>
                            <p className="text-2xl font-bold text-[var(--dash-text-primary)]">{totalAdopters}</p>
                            <p className="text-xs text-[var(--dash-text-muted)]">People/organizations engaged</p>
                        </div>
                        <div className="dashboard-card">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-[var(--dash-text-secondary)]">Campaign Budget</p>
                                <DollarSign className="w-4 h-4 text-[var(--dash-accent)]" />
                            </div>
                            <p className="text-2xl font-bold text-[var(--dash-text-primary)]">${totalBudget.toLocaleString()}</p>
                            <p className="text-xs text-[var(--dash-text-muted)]">Collected: ${totalPaid.toLocaleString()}</p>
                        </div>
                        <div className="dashboard-card">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-[var(--dash-text-secondary)]">Estimated Reach</p>
                                <Target className="w-4 h-4 text-[var(--dash-accent)]" />
                            </div>
                            <p className="text-2xl font-bold text-[var(--dash-text-primary)]">{estimatedReachMin.toLocaleString()} - {estimatedReachMax.toLocaleString()}</p>
                            <p className="text-xs text-[var(--dash-text-muted)]">Impressions from package forecasts</p>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-[var(--dash-accent)]" />
                            <h3 className="font-semibold text-[var(--dash-text-primary)]">Campaign Impact Overview</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-[var(--dash-text-secondary)] mb-2">Objective Distribution</p>
                                <div className="space-y-1 text-sm">
                                    {Object.keys(objectiveCounts).length === 0 ? (
                                        <p className="text-[var(--dash-text-muted)]">No campaign objective data yet.</p>
                                    ) : (
                                        Object.entries(objectiveCounts).map(([objective, count]) => (
                                            <div key={objective} className="flex justify-between text-[var(--dash-text-secondary)]">
                                                <span className="capitalize">{objective.replace(/_/g, ' ')}</span>
                                                <span className="font-medium">{count}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--dash-text-secondary)] mb-2">Google Ads API Insights (Last 30 Days)</p>
                                {insightsLoading ? (
                                    <p className="text-sm text-[var(--dash-text-muted)]">Loading Google Ads insights...</p>
                                ) : googleAdsSummary ? (
                                    <div className="space-y-1 text-sm text-[var(--dash-text-secondary)]">
                                        <div className="flex justify-between"><span>Impressions</span><span className="font-medium">{Number(googleAdsSummary.impressions || 0).toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span>Clicks</span><span className="font-medium">{Number(googleAdsSummary.clicks || 0).toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span>Conversions</span><span className="font-medium">{Number(googleAdsSummary.conversions || 0).toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span>Video Views</span><span className="font-medium">{Number(googleAdsSummary.videoViews || 0).toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span>Spend (USD est.)</span><span className="font-medium">${(Number(googleAdsSummary.costMicros || 0) / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-[var(--dash-text-muted)]">{googleAdsError || 'Google Ads insights unavailable.'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search by sponsor name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="dashboard-input has-icon"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="dashboard-input max-w-48"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending_review">Pending Review</option>
                            <option value="approved">Approved</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="live">Live</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <select
                            value={methodFilter}
                            onChange={(e) => setMethodFilter(e.target.value)}
                            className="dashboard-input max-w-56"
                        >
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
                                        <th>Release</th>
                                        <th>Method</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Payment</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAdoptions.map((adoption) => (
                                        <tr key={adoption.id}>
                                            <td>
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-neutral-400" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-[var(--dash-text-primary)]">
                                                            {adoption.sponsor?.full_name || 'Unknown'}
                                                        </div>
                                                        <div className="text-sm text-[var(--dash-text-muted)]">
                                                            {adoption.sponsor?.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center">
                                                    <Music className="w-4 h-4 text-neutral-400 mr-2" />
                                                    <span className="text-sm text-[var(--dash-text-secondary)]">Release #{adoption.release_id}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-sm text-[var(--dash-text-secondary)] capitalize">
                                                    {adoption.method_type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center">
                                                    <DollarSign className="w-4 h-4 text-neutral-400 mr-1" />
                                                    <span className="text-sm text-[var(--dash-text-secondary)]">{adoption.amount_due}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {getStatusBadge(adoption.adoption_status)}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    {getPaymentStatusBadge(getEffectivePaymentStatus(adoption))}
                                                    {hasPaymentMismatch(adoption) && (
                                                        <span title="Mismatch between local and server payment status">
                                                            <AlertCircle className="w-4 h-4 text-amber-400" />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 text-neutral-400 mr-1" />
                                                    <span className="text-sm text-[var(--dash-text-secondary)]">
                                                        {new Date(adoption.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedAdoption(adoption)}
                                                        className="p-1 text-neutral-400 hover:text-neutral-200"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {adoption.adoption_status === 'pending_review' && (
                                                        <>
                                                            <button
                                                                onClick={() => updateAdoptionStatus(adoption.id, 'approved')}
                                                                className="p-1 text-green-400 hover:text-green-300"
                                                                title="Approve"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => updateAdoptionStatus(adoption.id, 'cancelled')}
                                                                className="p-1 text-red-400 hover:text-red-300"
                                                                title="Reject"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => approvePublicListing(adoption.id, !adoption.public_listing_approved)}
                                                        className={`p-1 ${adoption.public_listing_approved ? 'text-blue-400' : 'text-neutral-500'} hover:text-blue-300`}
                                                        title={adoption.public_listing_approved ? 'Hide from public' : 'Show publicly'}
                                                    >
                                                        {adoption.public_listing_approved ? <Eye /> : <Eye className="opacity-50" />}
                                                    </button>
                                                    {/* Launch Campaign — visible once approved and paid */}
                                                    {(adoption.adoption_status === 'approved') && getEffectivePaymentStatus(adoption) === 'paid' && !hasPaymentMismatch(adoption) && (
                                                        <button
                                                            onClick={() => launchCampaign(adoption)}
                                                            disabled={launchingId === adoption.id}
                                                            className="p-1 text-amber-400 hover:text-amber-300 disabled:opacity-50"
                                                            title="Create Google Ads Campaign"
                                                        >
                                                            {launchingId === adoption.id
                                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                                : <Rocket className="w-4 h-4" />}
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

                    {/* Detail Modal */}
                    {selectedAdoption && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSelectedAdoption(null)}>
                            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-medium text-neutral-100">Adoption Details</h3>
                                    <button onClick={() => setSelectedAdoption(null)} className="text-neutral-400 hover:text-neutral-200">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-neutral-500 mb-1">Status</label>
                                            {getStatusBadge(selectedAdoption.adoption_status)}
                                        </div>
                                        <div>
                                            <label className="block text-sm text-neutral-500 mb-1">Payment</label>
                                            <div className="flex items-center gap-2">
                                                {getPaymentStatusBadge(getEffectivePaymentStatus(selectedAdoption))}
                                                {hasPaymentMismatch(selectedAdoption) && (
                                                    <span className="text-xs text-amber-400">Mismatch detected</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {hasPaymentMismatch(selectedAdoption) && (
                                        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                                            Local payment status is <strong>{selectedAdoption.payment_status}</strong>,
                                            but server reconciliation shows <strong>{serverPaymentRecords[selectedAdoption.id]?.paymentStatus}</strong>.
                                            Resolve this mismatch before launching campaigns.
                                        </div>
                                    )}

                                    <div>
                                        <h4 className="text-lg font-medium text-neutral-100 mb-3">Sponsor Information</h4>
                                        <div className="bg-neutral-800 rounded-lg p-4 space-y-2">
                                            <div><span className="text-neutral-500">Name:</span> {selectedAdoption.sponsor?.full_name}</div>
                                            <div><span className="text-neutral-500">Email:</span> {selectedAdoption.sponsor?.email}</div>
                                            <div><span className="text-neutral-500">Type:</span> {selectedAdoption.sponsor?.adopter_type}</div>
                                            <div><span className="text-neutral-500">Location:</span> {selectedAdoption.sponsor?.country}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-medium text-neutral-100 mb-3">Adoption Details</h4>
                                        <div className="bg-neutral-800 rounded-lg p-4 space-y-2">
                                            <div><span className="text-neutral-500">Method:</span> {selectedAdoption.method_type.replace('_', ' ')}</div>
                                            <div><span className="text-neutral-500">Amount:</span> ${selectedAdoption.amount_due}</div>
                                            <div><span className="text-neutral-500">Objective:</span> {selectedAdoption.campaign_objective}</div>
                                            <div><span className="text-neutral-500">Regions:</span> {selectedAdoption.target_regions.join(', ')}</div>
                                            <div><span className="text-neutral-500">Google Ads Customer ID:</span> {selectedAdoption.googleAdsCustomerId || 'Not linked'}</div>
                                        </div>
                                    </div>

                                    {selectedAdoption.dedication_message && (
                                        <div>
                                            <h4 className="text-lg font-medium text-neutral-100 mb-3">Dedication Message</h4>
                                            <div className="bg-neutral-800 rounded-lg p-4">
                                                <p className="text-neutral-300 italic">"{selectedAdoption.dedication_message}"</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        {selectedAdoption.adoption_status === 'pending_review' && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        updateAdoptionStatus(selectedAdoption.id, 'approved');
                                                        setSelectedAdoption(null);
                                                    }}
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                                >
                                                    Approve Adoption
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        updateAdoptionStatus(selectedAdoption.id, 'cancelled');
                                                        setSelectedAdoption(null);
                                                    }}
                                                    className="px-4 py-2 border border-red-600 text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                                                >
                                                    Reject Adoption
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        </DashboardLayout>
    );
}