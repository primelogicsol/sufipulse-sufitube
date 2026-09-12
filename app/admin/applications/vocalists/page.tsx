"use client";
import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { 
    CircleCheck as CheckCircle, 
    Circle as XCircle, 
    Clock, 
    Eye, 
    User, 
    CircleAlert as AlertCircle, 
    RefreshCw, 
    FileText, 
    Search,
    Copy,
    Check,
    Archive,
    ShieldCheck,
    History,
    StickyNote
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
type EditorialStatus = 
    | 'pending' 
    | 'under_editorial_screening' 
    | 'revision_requested' 
    | 'approved_as_vocalist' 
    | 'archived_not_advanced';

interface AdminVocalistProfile {
    [key: string]: any;
    id: string;
    referenceId?: string;
    submitted_at?: string;
    reviewed_at?: string;
    reviewed_by?: string;
    admin_notes?: string;
    public_name?: string;
    roles?: string[];
    created_at?: string;
    updated_at?: string;
    joined_at?: string;
}

export default function VocalistEditorialReviewQueue() {
    const { user, loading: authLoading } = useAuth();
    const [applications, setApplications] = useState<AdminVocalistProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<AdminVocalistProfile | null>(null);
    const [vocalistPerformances, setvocalistPerformances] = useState<any[]>([]);
    const [adminNote, setAdminNote] = useState('');
    const [filter, setFilter] = useState<EditorialStatus | 'all'>('pending');
    const [processingAction, setProcessingAction] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading) {
            loadApplications();
        }
    }, [authLoading]);

    useEffect(() => {
        if (selectedApp) {
            fetch('/api/kalams').then(r => r.json()).then(data => {
                if (Array.isArray(data)) {
                    setvocalistPerformances(data.filter(k => k.user_id === selectedApp.id));
                }
            }).catch(() => setvocalistPerformances([]));
        } else {
            setvocalistPerformances([]);
        }
    }, [selectedApp]);

    async function loadApplications() {
        try {
            setLoading(true);
            const res = await fetch('/api/vocalists');
            const data = await res.json();
            setApplications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[WriterQueue] Error loading applications:', error);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }

    const handleCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleUpdateStatus = async (id: string, status: EditorialStatus) => {
        try {
            setProcessingAction(true);
            setActionError(null);
            
            const res = await fetch(`/api/vocalists/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    profile_status: status,
                    admin_note: adminNote 
                }),
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update status');
            }

            setSelectedApp(null);
            setAdminNote('');
            await loadApplications();
        } catch (err: any) {
            setActionError(err?.message || 'Failed to update status');
        } finally {
            setProcessingAction(false);
        }
    };

    const getReferenceId = (app: AdminVocalistProfile) => {
        if (app.referenceId) return app.referenceId;
        return `SP-WRT-${new Date(app.created_at || Date.now()).getFullYear()}-${app.id.split('_')[1]?.slice(0, 8).toUpperCase() || 'REF'}`;
    };

    const filteredApplications = applications.filter((app) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            app.pen_name?.toLowerCase().includes(query) ||
            app.email?.toLowerCase().includes(query) ||
            app.full_name?.toLowerCase().includes(query) ||
            app.public_name?.toLowerCase().includes(query) ||
            getReferenceId(app).toLowerCase().includes(query);

        const matchesFilter = filter === 'all' || (app.profile_status || 'pending') === filter;
        return matchesSearch && matchesFilter;
    });

    const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
        pending: { label: 'Submitted', color: 'amber', icon: Clock },
        under_editorial_screening: { label: 'Under Editorial Screening', color: 'blue', icon: Search },
        revision_requested: { label: 'Revision Requested', color: 'orange', icon: RefreshCw },
        approved_as_vocalist: { label: 'Approved as Vocalist', color: 'emerald', icon: CheckCircle },
        archived_not_advanced: { label: 'Archived / Not Advanced', color: 'slate', icon: Archive },
        // Compat mappings
        under_review: { label: 'Under Editorial Screening', color: 'blue', icon: Search },
        approved: { label: 'Approved as Vocalist', color: 'emerald', icon: CheckCircle },
        rejected: { label: 'Archived / Not Advanced', color: 'slate', icon: Archive },
    };

    function StatusBadge({ status }: { status: string }) {
        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;
        
        const colorClasses: Record<string, string> = {
            amber: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
            blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
            orange: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
            emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
            slate: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colorClasses[config.color]}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
    }

    const finalCounts = {
        observedLegacy: selectedApp?.legacy_appearances || 0,
        confirmedCms: vocalistPerformances.length,
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--dash-text-primary)]">Ahl-e-Sada Vocalist Registry</h1>
                        <p className="text-sm text-[var(--dash-text-muted)]">Manage vocalist intake and institutional production profiles.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-400/10 border border-emerald-400/20 rounded-lg max-w-md">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                        <p className="text-[10px] leading-tight text-emerald-200/80">
                            Vocalist approval confirms identity verification and institutional production eligibility. 
                            It does not constitute performance assignments or royalty commitments.
                        </p>
                    </div>
                </div>

                {actionError && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {actionError}
                        </div>
                        <button onClick={() => setActionError(null)} className="hover:text-white">×</button>
                    </div>
                )}

                <div className="dashboard-card">
                    {/* Filters & Search */}
                    <div className="flex flex-col gap-6 mb-8">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or reference ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="dashboard-input has-icon w-full"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setFilter('all')} className={`dashboard-tab ${filter === 'all' ? 'active' : ''}`}>All</button>
                            <button onClick={() => setFilter('pending')} className={`dashboard-tab ${filter === 'pending' ? 'active' : ''}`}>Submitted</button>
                            <button onClick={() => setFilter('under_editorial_screening')} className={`dashboard-tab ${filter === 'under_editorial_screening' ? 'active' : ''}`}>Screening</button>
                            <button onClick={() => setFilter('revision_requested')} className={`dashboard-tab ${filter === 'revision_requested' ? 'active' : ''}`}>Revision</button>
                            <button onClick={() => setFilter('approved_as_vocalist')} className={`dashboard-tab ${filter === 'approved_as_vocalist' ? 'active' : ''}`}>Approved</button>
                            <button onClick={() => setFilter('archived_not_advanced')} className={`dashboard-tab ${filter === 'archived_not_advanced' ? 'active' : ''}`}>Archived</button>
                        </div>
                    </div>

                    {/* Applications Table */}
                    {loading ? (
                        <div className="py-20 text-center">
                            <RefreshCw className="w-8 h-8 text-[var(--dash-accent)] animate-spin mx-auto mb-4" />
                            <p className="text-[var(--dash-text-muted)]">Loading submissions...</p>
                        </div>
                    ) : (
                        <div className="dashboard-table-container">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Reference ID</th>
                                        <th>Vocalist</th>
                                        <th>Vocal Profile / Languages</th>
                                        <th>Country</th>
                                        <th>Joined / Created</th>
                                        <th>Status</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredApplications.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-20 text-[var(--dash-text-muted)]">
                                                No submissions found in this category.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredApplications.map((app) => (
                                            <tr key={app.id}>
                                                <td className="font-mono text-xs text-[var(--dash-accent)]">
                                                    {getReferenceId(app)}
                                                </td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-[var(--dash-text-primary)]">{app.stage_name || app.public_name || app.full_name}</span>
                                                        <span className="text-[10px] text-[var(--dash-text-tertiary)]">{app.identity_type === 'STUDIO_PSEUDONYM' ? 'Internal Workflow' : (app.email || '—')}</span>
                                                    </div>
                                                </td>
                                                <td className="text-xs text-[var(--dash-text-secondary)] max-w-[150px] truncate">
                                                    {Array.isArray(app.primary_languages) && app.primary_languages.length > 0 ? app.primary_languages.join(', ') : 'Not provided'}
                                                </td>
                                                <td className="text-xs text-[var(--dash-text-secondary)]">
                                                    {app.country || '—'}
                                                </td>
                                                <td className="text-[10px] text-[var(--dash-text-muted)]">
                                                    {new Date(app.joined_at || app.submitted_at || app.created_at || '').toLocaleDateString('en-US', { timeZone: 'UTC' })}
                                                </td>
                                                <td>
                                                    <StatusBadge status={app.profile_status || 'pending'} />
                                                </td>
                                                <td className="text-right">
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedApp(app);
                                                            setAdminNote(app.admin_notes || '');
                                                        }}
                                                        className="dashboard-btn-secondary py-1 text-xs"
                                                    >
                                                        {app.profile_status === 'approved_as_vocalist' ? 'View Profile' : 'Review'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Profile Detail Modal */}
                {selectedApp && (
                    <div className="dashboard-modal-overlay flex items-center justify-center p-4" onClick={() => !processingAction && setSelectedApp(null)}>
                        <div className="dashboard-modal flex flex-col" style={{ width: '94vw', maxWidth: '1500px', maxHeight: '92vh', padding: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                            <div className="dashboard-modal-header border-b border-[var(--dash-border)] shrink-0 sticky top-0 z-10 bg-[#0a0a0a] rounded-t-xl relative flex p-6">
                                <div className="flex items-start sm:items-center justify-between gap-4 w-full pr-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
                                            <FileText className="w-6 h-6 text-amber-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-lg font-bold text-white mb-0">{selectedApp.profile_status === 'approved_as_vocalist' ? 'Profile:' : 'Editorial Review:'} {selectedApp.public_name || selectedApp.full_name}</h2>
                                                <StatusBadge status={selectedApp.profile_status || 'pending'} />
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono text-xs text-amber-400/80">{getReferenceId(selectedApp)}</span>
                                                    <button 
                                                        onClick={() => handleCopy(getReferenceId(selectedApp))}
                                                        className="p-1 hover:bg-white/5 rounded transition-colors -ml-1"
                                                    >
                                                        {copiedId === getReferenceId(selectedApp) ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-500" />}
                                                    </button>
                                                </div>
                                                <span className="text-neutral-600 text-xs">•</span>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    Member Since: {selectedApp.joined_at 
                                                        ? new Date(selectedApp.joined_at).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })
                                                        : new Date(selectedApp.updated_at || selectedApp.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedApp(null)} className="absolute top-5 right-5 p-2 hover:bg-white/5 rounded-lg text-neutral-500 hover:text-white transition-colors">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="dashboard-modal-body p-0 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                                <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,0.34fr)_minmax(0,0.66fr)] xl:grid-cols-[minmax(260px,28%)_minmax(420px,42%)_minmax(300px,30%)] h-full min-h-max">
                                    {/* Left Panel: Institutional Intake Profile */}
                                    <div className="lg:border-r border-[var(--dash-border)] p-6 xl:p-8 bg-neutral-950/20 lg:row-span-2 xl:row-span-1 min-w-0">
                                    <div className="space-y-6">
                                        <div className="pb-3 border-b border-neutral-900">
                                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Institutional Intake Profile</h2>
                                        </div>

                                        <section>
                                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Identity & Background</h3>
                                            <div className="space-y-5">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Stage Name</label>
                                                    <p className="text-base text-slate-100 font-medium">{selectedApp.stage_name || selectedApp.public_name}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Public Name Type</label>
                                                    <p className="text-base text-slate-100 font-medium">{selectedApp.public_name_type || <span className="text-sm text-slate-300 italic">Not provided</span>}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Contact Identity</label>
                                                    <p className="text-base text-slate-100 font-medium">{selectedApp.email || <span className="text-sm text-slate-300 italic">Internal Workflow</span>}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Location</label>
                                                    <p className="text-base text-slate-100 font-medium">{[selectedApp.city, selectedApp.country].filter(Boolean).join(', ') || <span className="text-sm text-slate-300 italic">Not provided</span>}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Vocalist Type</label>
                                                    <p className="text-base text-slate-100 font-medium">{selectedApp.vocalist_type || <span className="text-sm text-slate-300 italic">Studio / Internal Vocalist</span>}</p>
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Vocal & Performance Profile</h3>
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Primary Languages</label>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {(Array.isArray(selectedApp.primary_languages) ? selectedApp.primary_languages : []).length > 0 
                                                            ? (Array.isArray(selectedApp.primary_languages) ? selectedApp.primary_languages : []).map((l: string) => (
                                                                <span key={l} className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 rounded-md">{l}</span>
                                                            ))
                                                            : <span className="text-sm text-slate-300 italic">Not provided</span>
                                                        }
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Styles / Genres</label>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {selectedApp.styles_genres && selectedApp.styles_genres.length > 0
                                                            ? selectedApp.styles_genres.map((s: string) => (
                                                                <span key={s} className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 rounded-md">{s}</span>
                                                            ))
                                                            : <span className="text-sm text-slate-300 italic">Not provided</span>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Vocal Characteristics</h3>
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Performance Character</label>
                                                    {selectedApp.performance_character ? (
                                                        <p className="text-sm text-slate-100 leading-relaxed font-medium">{selectedApp.performance_character}</p>
                                                    ) : (
                                                        <p className="text-sm text-slate-300 italic">Not provided</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Vocal Range</label>
                                                    {selectedApp.vocal_range ? (
                                                        <p className="text-sm text-slate-100 leading-relaxed font-medium">{selectedApp.vocal_range}</p>
                                                    ) : (
                                                        <p className="text-sm text-slate-300 italic">Not provided</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Vocal Register</label>
                                                    {selectedApp.vocal_register ? (
                                                        <p className="text-sm text-slate-100 leading-relaxed font-medium">{selectedApp.vocal_register}</p>
                                                    ) : (
                                                        <p className="text-sm text-slate-300 italic">Not provided</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Tone / Timbre</label>
                                                    {selectedApp.tone_timbre ? (
                                                        <p className="text-sm text-slate-100 leading-relaxed font-medium">{selectedApp.tone_timbre}</p>
                                                    ) : (
                                                        <p className="text-sm text-slate-300 italic">Not provided</p>
                                                    )}
                                                </div>
                                                {selectedApp.special_characteristics && selectedApp.special_characteristics.length > 0 && (
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Special Characteristics</label>
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            {selectedApp.special_characteristics.map((s: string) => (
                                                                <span key={s} className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 rounded-md">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </section>

                                        {selectedApp.roles && Array.isArray(selectedApp.roles) && selectedApp.roles.length > 0 && (
                                            <section>
                                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Canonical Roles</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedApp.roles.map(role => (
                                                        <span key={role} className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-md">
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                </div>
                                    
                                {/* Center Panel: Works & Production */}
                                <div className="p-6 xl:p-8 bg-[#0a0a0a] border-b lg:border-b-0 xl:border-r border-[var(--dash-border)] min-w-0">
                                    <div className="space-y-6">
                                            {selectedApp.profile_status === 'approved_as_vocalist' ? (
                                                <section>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <StickyNote className="w-4 h-4 text-emerald-400" />
                                                            Performances / Catalog
                                                        </h3>
                                                    </div>
                                                    <div className="space-y-2 mb-6 p-4 bg-neutral-900/30 border border-neutral-800/50 rounded-lg font-mono">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Observed Legacy References</span>
                                                            <span className="text-sm font-bold text-amber-400/90">{finalCounts.observedLegacy}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total Confirmed Assignments</span>
                                                            <span className="text-sm font-bold text-emerald-400/90">{finalCounts.confirmedCms}</span>
                                                        </div>
                                                    </div>
                                                    {vocalistPerformances.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {vocalistPerformances.slice(0, 5).map((k: any) => (
                                                                <div key={k.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-between">
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm text-neutral-200 font-medium truncate">{k.title}</p>
                                                                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{k.id}</p>
                                                                    </div>
                                                                    <div className="shrink-0 ml-4">
                                                                        <span className="px-2 py-1 text-[10px] uppercase font-bold rounded-full bg-neutral-800 text-neutral-400">
                                                                            {k.status?.replace(/_/g, ' ') || 'Unknown'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {vocalistPerformances.length > 5 && (
                                                                <p className="text-xs text-neutral-500 text-center py-2">+ {vocalistPerformances.length - 5} more performances in catalog</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-[#111] border border-neutral-800 rounded-xl p-8 shadow-inner flex items-center justify-center">
                                                            <p className="text-xs text-neutral-500 italic">No confirmed assignments yet</p>
                                                        </div>
                                                    )}
                                                </section>
                                            ) : (
                                                <section>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <StickyNote className="w-4 h-4 text-amber-400" />
                                                            Sample Performance Submission
                                                        </h3>
                                                    </div>
                                                    <div className="bg-[#111] border border-neutral-800 rounded-xl p-8 shadow-inner overflow-x-auto">
                                                        <pre className="text-base text-neutral-200 font-mono whitespace-pre-wrap leading-loose">
                                                            {selectedApp.sample_performance || 'Not provided'}
                                                        </pre>
                                                    </div>
                                                </section>
                                            )}


                                        </div>
                                    </div>

                                    {/* Right Panel: Governance & Registry */}
                                    <div className="p-6 xl:p-8 bg-neutral-950/40 flex flex-col h-full min-w-0">
                                        <div className="space-y-6 flex-1 flex flex-col min-w-0">
                                            {/* Editorial / Governance */}
                                            <section className="flex flex-col gap-6 min-w-0">
                                                <div className="min-w-0">
                                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <History className="w-4 h-4" />
                                                        Editorial Review History
                                                    </h3>
                                                    <div className="space-y-4 min-w-0">
                                                        {selectedApp.reviewed_at ? (
                                                            <div className="flex gap-4">
                                                                <div className="w-0.5 bg-neutral-800 relative shrink-0">
                                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-neutral-700" />
                                                                </div>
                                                                <div className="pb-4 min-w-0 flex-1">
                                                                    <p className="text-[10px] text-neutral-600 mb-1">
                                                                        {new Date(selectedApp.reviewed_at).toLocaleString()}
                                                                    </p>
                                                                    <p className="text-sm text-slate-100 break-words">
                                                                        {selectedApp.identity_type === 'STUDIO_PSEUDONYM' ? (
                                                                            <>Canonical Vocalist Status <span className="text-amber-400 font-medium">synchronized with institutional registry</span></>
                                                                        ) : (
                                                                            <>Status updated to <span className="text-amber-400 font-medium">{(selectedApp.profile_status || '').replace(/_/g, ' ')}</span></>
                                                                        )}
                                                                    </p>
                                                                    {selectedApp.admin_notes && (
                                                                        <div className="mt-2 p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg text-xs text-neutral-500 italic break-words">
                                                                            &ldquo;{selectedApp.admin_notes}&rdquo;
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-neutral-600 italic">No previous review activity recorded.</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Institutional Covenant</h3>
                                                    <div className="space-y-3 min-w-0">
                                                        <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                                                            <span className="text-xs text-neutral-400 min-w-0 flex-1 break-words">Performance Review Process</span>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0 sm:text-right">Acknowledged</span>
                                                        </div>
                                                        <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                                                            <span className="text-xs text-neutral-400 min-w-0 flex-1 break-words">Institutional Production Discretion</span>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0 sm:text-right">Acknowledged</span>
                                                        </div>
                                                        <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                                                            <span className="text-xs text-neutral-400 min-w-0 flex-1 break-words">Contributor Verification</span>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0 sm:text-right">{selectedApp.identity_type === 'STUDIO_PSEUDONYM' ? 'Internal Canonical State' : 'Verified'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>

                                            {/* Registry Status */}
                                            {selectedApp.profile_status === 'approved_as_vocalist' && (
                                                <section className="pt-6 border-t border-neutral-900">
                                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Registry Status</h3>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg">
                                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Vocalist Status</p>
                                                            <p className="text-xs text-emerald-400 font-bold">APPROVED</p>
                                                        </div>
                                                        <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg">
                                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Contributor Status</p>
                                                            <p className="text-xs text-emerald-400 font-bold">{selectedApp.contributor_status || 'ACTIVE'}</p>
                                                        </div>
                                                        <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg">
                                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Intake Status</p>
                                                            <p className="text-xs text-blue-400 font-bold">{selectedApp.identity_type === 'STUDIO_PSEUDONYM' ? 'INTERNAL' : 'COMPLETED'}</p>
                                                        </div>
                                                        <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg">
                                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Legacy Appearances</p>
                                                            <p className="text-xs text-slate-100 font-bold">{finalCounts.observedLegacy}</p>
                                                        </div>
                                                        <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg">
                                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Catalog Assignment</p>
                                                            <p className="text-[10px] text-slate-100 font-bold">{selectedApp.catalog_assignment?.replace(/_/g, ' ') || 'PENDING'}</p>
                                                        </div>
                                                        <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg">
                                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Last Activity</p>
                                                            <p className="text-xs text-slate-100 font-bold">{new Date(selectedApp.updated_at || Date.now()).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </section>
                                            )}

                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Full-Width Sticky Footer Actions */}
                            <div className="shrink-0 p-6 lg:px-8 bg-neutral-900 border-t border-[var(--dash-border)] sticky bottom-0 z-20 rounded-b-xl">
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
                                    <div className="min-w-0">
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Editorial Internal Note / Feedback to Writer</label>
                                        <textarea 
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            placeholder="Add internal evaluation or feedback for revision request..."
                                            className="dashboard-textarea w-full min-h-[80px] text-sm resize-none"
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        {selectedApp.profile_status !== 'approved_as_vocalist' && selectedApp.identity_type !== 'STUDIO_PSEUDONYM' && (
                                            <>
                                                <button 
                                                    onClick={() => handleUpdateStatus(selectedApp.id, 'under_editorial_screening')}
                                                    disabled={processingAction}
                                                    className="dashboard-btn-secondary text-[11px] h-11 uppercase tracking-wider font-bold min-w-[120px]"
                                                >
                                                    Screening
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateStatus(selectedApp.id, 'revision_requested')}
                                                    disabled={processingAction}
                                                    className="dashboard-btn-secondary text-[11px] h-11 uppercase tracking-wider font-bold text-orange-400 border-orange-500/20 min-w-[120px]"
                                                >
                                                    Req Revision
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateStatus(selectedApp.id, 'approved_as_vocalist')}
                                                    disabled={processingAction}
                                                    className="dashboard-btn-primary bg-emerald-600 hover:bg-emerald-500 text-[11px] h-11 uppercase tracking-wider font-bold min-w-[120px]"
                                                >
                                                    Approve
                                                </button>
                                            </>
                                        )}
                                        <button 
                                            onClick={() => handleUpdateStatus(selectedApp.id, 'archived_not_advanced')}
                                            disabled={processingAction}
                                            className="dashboard-btn-danger text-[11px] h-11 uppercase tracking-wider font-bold opacity-60 hover:opacity-100 min-w-[120px]"
                                        >
                                            Archive
                                        </button>
                                    </div>
                            </div>
                        </div>
                    </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

