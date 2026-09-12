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
import { WriterFormData } from '@/app/types/writer.types';
import { ZarfImportTool } from './zarf-import';

type EditorialStatus = 
    | 'pending' 
    | 'under_editorial_screening' 
    | 'revision_requested' 
    | 'approved_as_writer' 
    | 'archived_not_advanced';

interface AdminWriterProfile extends WriterFormData {
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

export default function WriterEditorialReviewQueue() {
    const { user, loading: authLoading } = useAuth();
    const [applications, setApplications] = useState<AdminWriterProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<AdminWriterProfile | null>(null);
    const [writerKalams, setWriterKalams] = useState<any[]>([]);
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
                    setWriterKalams(data.filter(k => k.user_id === selectedApp.id));
                }
            }).catch(() => setWriterKalams([]));
        } else {
            setWriterKalams([]);
        }
    }, [selectedApp]);

    async function loadApplications() {
        try {
            setLoading(true);
            const res = await fetch('/api/writers');
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
            
            const res = await fetch(`/api/writers/${id}`, {
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

    const getReferenceId = (app: AdminWriterProfile) => {
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
        approved_as_writer: { label: 'Approved as Writer', color: 'emerald', icon: CheckCircle },
        archived_not_advanced: { label: 'Archived / Not Advanced', color: 'slate', icon: Archive },
        // Compat mappings
        under_review: { label: 'Under Editorial Screening', color: 'blue', icon: Search },
        approved: { label: 'Approved as Writer', color: 'emerald', icon: CheckCircle },
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

    const isDrZarf = selectedApp?.id === 'writers_ed6c98ae-bac7-44cd-8765-2f9fc35ef9a9';
    const legacyBaseline = isDrZarf 
        ? { total: 120, draft: 120, review: 105, approved: 94, released: 94 }
        : { total: 0, draft: 0, review: 0, approved: 0, released: 0 };

    const uniqueKalams = Array.from(new Map(writerKalams.map(k => [k.id, k])).values());
    const postBaselineKalams = uniqueKalams.filter((k: any) => !k.is_legacy_backfill);

    const liveCounts = {
        total: postBaselineKalams.length,
        draft: postBaselineKalams.length, // Any existing work implies at least draft
        review: postBaselineKalams.filter(k => ['editorial_review', 'approved', 'released'].includes(k.status)).length,
        approved: postBaselineKalams.filter(k => ['approved', 'released'].includes(k.status)).length,
        released: postBaselineKalams.filter(k => k.status === 'released').length,
    };

    const finalCounts = {
        total: legacyBaseline.total + liveCounts.total,
        draft: legacyBaseline.draft + liveCounts.draft,
        review: legacyBaseline.review + liveCounts.review,
        approved: legacyBaseline.approved + liveCounts.approved,
        released: legacyBaseline.released + liveCounts.released,
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--dash-text-primary)]">Ahl-e-Qalam Editorial Review Queue</h1>
                        <p className="text-sm text-[var(--dash-text-muted)]">Manage writer intake and editorial screening process.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-400/10 border border-amber-400/20 rounded-lg max-w-md">
                        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                        <p className="text-[10px] leading-tight text-amber-200/80">
                            Writer approval confirms eligibility for participation in the SufiPulse ecosystem. 
                            It does not constitute kalam approval or production authorization.
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
                            <button onClick={() => setFilter('approved_as_writer')} className={`dashboard-tab ${filter === 'approved_as_writer' ? 'active' : ''}`}>Approved</button>
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
                                        <th>Applicant</th>
                                        <th>Languages</th>
                                        <th>Country</th>
                                        <th>Submitted</th>
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
                                                        <span className="font-semibold text-[var(--dash-text-primary)]">{app.public_name || app.full_name}</span>
                                                        <span className="text-xs text-[var(--dash-text-muted)]">{app.pen_name || 'No Pen Name'}</span>
                                                        <span className="text-[10px] text-[var(--dash-text-tertiary)]">{app.email || 'Internal Workflow'}</span>
                                                    </div>
                                                </td>
                                                <td className="text-xs text-[var(--dash-text-secondary)] max-w-[150px] truncate">
                                                    {Array.isArray(app.primary_languages) ? app.primary_languages.join(', ') : app.primary_languages}
                                                </td>
                                                <td className="text-xs text-[var(--dash-text-secondary)]">
                                                    {app.country || '—'}
                                                </td>
                                                <td className="text-[10px] text-[var(--dash-text-muted)]">
                                                    {new Date(app.submitted_at || app.created_at || '').toLocaleDateString()}
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
                                                        {app.profile_status === 'approved_as_writer' ? 'View Profile' : 'Review'}
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
                        <div className="dashboard-modal w-[92vw] max-w-[1360px] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <div className="dashboard-modal-header border-b border-[var(--dash-border)] shrink-0 sticky top-0 z-10 bg-[#0a0a0a] rounded-t-xl relative flex p-6">
                                <div className="flex items-start sm:items-center justify-between gap-4 w-full pr-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
                                            <FileText className="w-6 h-6 text-amber-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-lg font-bold text-white mb-0">{selectedApp.profile_status === 'approved_as_writer' ? 'Profile:' : 'Editorial Review:'} {selectedApp.public_name || selectedApp.full_name}</h2>
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
                                                        ? new Date(selectedApp.joined_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
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

                            <div className="dashboard-modal-body p-0 flex-1 min-h-0 overflow-y-auto">
                                <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,0.32fr)_minmax(0,0.68fr)] h-full min-h-max">
                                    {/* Left Panel: Institutional Intake Profile */}
                                    <div className="lg:border-r border-[var(--dash-border)] p-6 lg:p-8 bg-neutral-950/20">
                                    <div className="space-y-8">
                                        <div className="pb-4 border-b border-neutral-900">
                                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Institutional Intake Profile</h2>
                                        </div>

                                        <section>
                                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Identity & Background</h3>
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{selectedApp.public_name ? 'Canonical Name' : 'Full Name'}</label>
                                                    <p className="text-base text-slate-100 font-medium">{selectedApp.public_name || selectedApp.full_name}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Pen Name / Takhallus</label>
                                                    {selectedApp.pen_name ? (
                                                        <p className="text-base text-slate-100 font-medium">{selectedApp.pen_name}</p>
                                                    ) : (
                                                        <p className="text-sm text-slate-300 italic">Not provided</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Contact Identity</label>
                                                    {selectedApp.email ? (
                                                        <p className="text-base text-slate-100 font-medium">{selectedApp.email}</p>
                                                    ) : (
                                                        <p className="text-sm text-slate-300 italic">Internal Workflow</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Location</label>
                                                    <p className="text-base text-slate-100 font-medium">{[selectedApp.city, selectedApp.country].filter(Boolean).join(', ') || <span className="text-sm text-slate-300 italic">Not provided</span>}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Writer Type</label>
                                                    <p className="text-base text-slate-100 font-medium">{(selectedApp as any).writer_category || <span className="text-sm text-slate-300 italic">External Applicant</span>}</p>
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Literary & Linguistic Profile</h3>
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Literary Languages</label>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {(Array.isArray(selectedApp.primary_languages) ? selectedApp.primary_languages : ((selectedApp as any).primary_language ? [(selectedApp as any).primary_language] : [])).length > 0 
                                                            ? (Array.isArray(selectedApp.primary_languages) ? selectedApp.primary_languages : [(selectedApp as any).primary_language]).map(l => (
                                                                <span key={l} className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 rounded-md">{l}</span>
                                                            ))
                                                            : <span className="text-sm text-slate-300 italic">Not provided</span>
                                                        }
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Forms & Styles</label>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {selectedApp.writing_styles && selectedApp.writing_styles.length > 0
                                                            ? selectedApp.writing_styles.map(s => (
                                                                <span key={s} className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 rounded-md">{s}</span>
                                                            ))
                                                            : <span className="text-sm text-slate-300 italic">Not provided</span>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Thematic Orientation</h3>
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Thematic Focus</label>
                                                    {selectedApp.thematic_focus ? (
                                                        <p className="text-sm text-slate-100 leading-relaxed font-medium">{selectedApp.thematic_focus}</p>
                                                    ) : (
                                                        <p className="text-sm text-slate-300 italic">Not provided</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Conceptual Orientation</label>
                                                    {(selectedApp as any).conceptual_orientation ? (
                                                        <p className="text-sm text-slate-100 leading-relaxed font-medium">{(selectedApp as any).conceptual_orientation}</p>
                                                    ) : (
                                                        <p className="text-sm text-slate-300 italic">Not provided</p>
                                                    )}
                                                </div>
                                                {(selectedApp as any).creative_orientation && (
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Creative Orientation</label>
                                                        <p className="text-sm text-slate-100 leading-relaxed font-medium">{(selectedApp as any).creative_orientation}</p>
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
                                    
                                {/* Right Panel: Sample Kalam & Actions */}
                                <div className="p-6 lg:p-8 bg-[#0a0a0a]">
                                    <div className="space-y-6">
                                            {/* Works / Kalam or Sample Kalam */}
                                            {selectedApp.profile_status === 'approved_as_writer' ? (
                                                <section>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <StickyNote className="w-4 h-4 text-emerald-400" />
                                                            Works / Kalam
                                                        </h3>
                                                        <span className="text-xs text-neutral-500 font-mono">Total: {finalCounts.total}</span>
                                                    </div>
                                                    <div className="space-y-2 mb-6 p-4 bg-neutral-900/30 border border-neutral-800/50 rounded-lg font-mono">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">DRAFT</span>
                                                            <span className="text-sm font-bold text-slate-300">{finalCounts.draft}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">REVIEW</span>
                                                            <span className="text-sm font-bold text-amber-400/90">{finalCounts.review}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">APPROVED</span>
                                                            <span className="text-sm font-bold text-emerald-400/90">{finalCounts.approved}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">RELEASED</span>
                                                            <span className="text-sm font-bold text-blue-400/90">{finalCounts.released}</span>
                                                        </div>
                                                    </div>
                                                    {writerKalams.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {writerKalams.slice(0, 5).map(k => (
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
                                                            {writerKalams.length > 5 && (
                                                                <p className="text-xs text-neutral-500 text-center py-2">+ {writerKalams.length - 5} more works in catalog</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-[#111] border border-neutral-800 rounded-xl p-8 shadow-inner flex items-center justify-center">
                                                            <p className="text-xs text-neutral-500 italic">No works found in catalog</p>
                                                        </div>
                                                    )}
                                                </section>
                                            ) : (
                                                <section>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <StickyNote className="w-4 h-4 text-amber-400" />
                                                            Sample Kalam Submission
                                                        </h3>
                                                    </div>
                                                    <div className="bg-[#111] border border-neutral-800 rounded-xl p-8 shadow-inner overflow-x-auto">
                                                        <pre className="text-base text-neutral-200 font-mono whitespace-pre-wrap leading-loose">
                                                            {selectedApp.sample_kalam || 'Not provided'}
                                                        </pre>
                                                    </div>
                                                </section>
                                            )}

                                            {/* Previous Publications */}
                                            {selectedApp.previous_publications && (
                                                <section>
                                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Previous Publications</h3>
                                                    <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-4 text-sm text-slate-100 leading-relaxed font-medium">
                                                        {selectedApp.previous_publications}
                                                    </div>
                                                </section>
                                            )}

                                            {/* Literary Background */}
                                            {selectedApp.literary_background && (
                                                <section>
                                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Literary Background</h3>
                                                    <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-4 text-sm text-slate-100 leading-relaxed font-medium">
                                                        {selectedApp.literary_background}
                                                    </div>
                                                </section>
                                            )}

                                            {/* Privileged Workflow for Zarf-e-Noori */}
                                            {selectedApp.id === 'writers_ed6c98ae-bac7-44cd-8765-2f9fc35ef9a9' && (
                                                <div className="pt-2">
                                                    <ZarfImportTool writerId={selectedApp.id} />
                                                </div>
                                            )}

                                            {/* Editorial / Governance */}
                                            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-6 border-t border-neutral-900 min-w-0">
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
                                                                        {selectedApp.id === 'writers_ed6c98ae-bac7-44cd-8765-2f9fc35ef9a9' ? (
                                                                            <>Canonical writer status <span className="text-amber-400 font-medium">synchronized with institutional registry</span></>
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
                                                            <span className="text-xs text-neutral-400 min-w-0 flex-1 break-words">Editorial Covenant</span>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0 sm:text-right">Acknowledged</span>
                                                        </div>
                                                        <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                                                            <span className="text-xs text-neutral-400 min-w-0 flex-1 break-words">Institutional Governance</span>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0 sm:text-right">Acknowledged</span>
                                                        </div>
                                                        <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                                                            <span className="text-xs text-neutral-400 min-w-0 flex-1 break-words">Contributor Verification</span>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0 sm:text-right">Verified</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>

                                            {/* Registry Status */}
                                            {selectedApp.profile_status === 'approved_as_writer' && (
                                                <section className="pt-6 border-t border-neutral-900">
                                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Registry Status</h3>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                                                        <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg">
                                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Writer Status</p>
                                                            <p className="text-xs text-emerald-400 font-bold">APPROVED</p>
                                                        </div>
                                                        <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg">
                                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Contributor Status</p>
                                                            <p className="text-xs text-emerald-400 font-bold">ACTIVE</p>
                                                        </div>
                                                        <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg">
                                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Intake Status</p>
                                                            <p className="text-xs text-blue-400 font-bold">COMPLETED</p>
                                                        </div>
                                                        <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg">
                                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Works Count</p>
                                                            <p className="text-xs text-slate-100 font-bold">{finalCounts.total}</p>
                                                        </div>
                                                        <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg">
                                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Release Linkage</p>
                                                            <p className="text-xs text-slate-100 font-bold">ACTIVE</p>
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
                                <div className="w-full flex flex-col md:flex-row items-center gap-6">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Editorial Internal Note / Feedback to Writer</label>
                                        <textarea 
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            placeholder="Add internal evaluation or feedback for revision request..."
                                            className="dashboard-textarea h-11 text-sm resize-none"
                                        />
                                    </div>
                                    <div className="w-full md:w-auto grid grid-cols-2 sm:flex items-center gap-3 self-end">
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
                                            onClick={() => handleUpdateStatus(selectedApp.id, 'approved_as_writer')}
                                            disabled={processingAction}
                                            className="dashboard-btn-primary bg-emerald-600 hover:bg-emerald-500 text-[11px] h-11 uppercase tracking-wider font-bold min-w-[120px]"
                                        >
                                            Approve
                                        </button>
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
