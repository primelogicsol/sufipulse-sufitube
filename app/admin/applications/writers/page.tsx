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
}

export default function WriterEditorialReviewQueue() {
    const { user, loading: authLoading } = useAuth();
    const [applications, setApplications] = useState<AdminWriterProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<AdminWriterProfile | null>(null);
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
            app.email.toLowerCase().includes(query) ||
            app.full_name?.toLowerCase().includes(query) ||
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
                                                        <span className="font-semibold text-[var(--dash-text-primary)]">{app.full_name}</span>
                                                        <span className="text-xs text-[var(--dash-text-muted)]">{app.pen_name || 'No Pen Name'}</span>
                                                        <span className="text-[10px] text-[var(--dash-text-tertiary)]">{app.email}</span>
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
                                                        Review
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

                {/* Detail View Modal */}
                {selectedApp && (
                    <div className="dashboard-modal-overlay" onClick={() => !processingAction && setSelectedApp(null)}>
                        <div className="dashboard-modal max-w-5xl" onClick={(e) => e.stopPropagation()}>
                            <div className="dashboard-modal-header border-b border-[var(--dash-border)]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-lg font-bold text-white mb-0">Editorial Review: {selectedApp.full_name}</h2>
                                            <StatusBadge status={selectedApp.profile_status || 'pending'} />
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="font-mono text-xs text-amber-400/80">{getReferenceId(selectedApp)}</span>
                                            <button 
                                                onClick={() => handleCopy(getReferenceId(selectedApp))}
                                                className="p-1 hover:bg-white/5 rounded transition-colors"
                                            >
                                                {copiedId === getReferenceId(selectedApp) ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-500" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-white/5 rounded-lg text-neutral-500 hover:text-white transition-colors">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="dashboard-modal-body p-0 grid md:grid-cols-12 max-h-[80vh] overflow-hidden">
                                {/* Left Panel: Profile Details */}
                                <div className="md:col-span-4 border-r border-[var(--dash-border)] overflow-y-auto p-6 bg-neutral-950/20">
                                    <div className="space-y-8">
                                        <section>
                                            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">Identity & Background</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] text-neutral-600 uppercase mb-1">Full Name</label>
                                                    <p className="text-sm text-neutral-200">{selectedApp.full_name}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-neutral-600 uppercase mb-1">Pen Name</label>
                                                    <p className="text-sm text-neutral-200">{selectedApp.pen_name || '—'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-neutral-600 uppercase mb-1">Email</label>
                                                    <p className="text-sm text-neutral-200">{selectedApp.email}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-neutral-600 uppercase mb-1">Location</label>
                                                    <p className="text-sm text-neutral-200">{selectedApp.city ? `${selectedApp.city}, ` : ''}{selectedApp.country}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-neutral-600 uppercase mb-1">Experience</label>
                                                    <p className="text-sm text-neutral-200">{selectedApp.years_experience} Years</p>
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">Literary Focus</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] text-neutral-600 uppercase mb-1">Languages</label>
                                                    <p className="text-sm text-neutral-200">{Array.isArray(selectedApp.primary_languages) ? selectedApp.primary_languages.join(', ') : selectedApp.primary_languages}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-neutral-600 uppercase mb-1">Styles / Forms</label>
                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                        {selectedApp.writing_styles?.map(s => (
                                                            <span key={s} className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 rounded-md">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-neutral-600 uppercase mb-1">Thematic Focus</label>
                                                    <p className="text-xs text-neutral-400 italic leading-relaxed">{selectedApp.thematic_focus || 'Not specified'}</p>
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">Governance</h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs p-2 bg-neutral-900/50 rounded border border-neutral-800">
                                                    <span className="text-neutral-500">Revision Ack.</span>
                                                    {selectedApp.revision_acknowledged ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                                                </div>
                                                <div className="flex items-center justify-between text-xs p-2 bg-neutral-900/50 rounded border border-neutral-800">
                                                    <span className="text-neutral-500">Institutional Ack.</span>
                                                    {selectedApp.institutional_acknowledged ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </div>

                                {/* Right Panel: Sample Kalam & Actions */}
                                <div className="md:col-span-8 flex flex-col h-full bg-[#0a0a0a]">
                                    <div className="flex-1 overflow-y-auto p-8">
                                        <div className="space-y-8">
                                            {/* Sample Kalam */}
                                            <section>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                                        <StickyNote className="w-4 h-4 text-amber-400" />
                                                        Sample Kalam Submission
                                                    </h3>
                                                </div>
                                                <div className="bg-[#111] border border-neutral-800 rounded-xl p-8 shadow-inner overflow-x-auto">
                                                    <pre className="text-base text-neutral-200 font-mono whitespace-pre-wrap leading-loose">
                                                        {selectedApp.sample_kalam}
                                                    </pre>
                                                </div>
                                            </section>

                                            {/* Previous Publications */}
                                            {selectedApp.previous_publications && (
                                                <section>
                                                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Previous Publications</h3>
                                                    <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-4 text-sm text-neutral-400 leading-relaxed">
                                                        {selectedApp.previous_publications}
                                                    </div>
                                                </section>
                                            )}

                                            {/* Literary Background */}
                                            {selectedApp.literary_background && (
                                                <section>
                                                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Literary Background</h3>
                                                    <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-4 text-sm text-neutral-400 leading-relaxed">
                                                        {selectedApp.literary_background}
                                                    </div>
                                                </section>
                                            )}

                                            {/* Review History */}
                                            <section className="pt-8 border-t border-neutral-900">
                                                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <History className="w-4 h-4" />
                                                    Editorial Review History
                                                </h3>
                                                <div className="space-y-4">
                                                    {selectedApp.reviewed_at ? (
                                                        <div className="flex gap-4">
                                                            <div className="w-0.5 bg-neutral-800 relative">
                                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-neutral-700" />
                                                            </div>
                                                            <div className="pb-4">
                                                                <p className="text-[10px] text-neutral-600 mb-1">
                                                                    {new Date(selectedApp.reviewed_at).toLocaleString()}
                                                                </p>
                                                                <p className="text-sm text-neutral-300">
                                                                    Status updated to <span className="text-amber-400 font-medium">{(selectedApp.profile_status || '').replace(/_/g, ' ')}</span>
                                                                </p>
                                                                {selectedApp.admin_notes && (
                                                                    <div className="mt-2 p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg text-xs text-neutral-500 italic">
                                                                        &ldquo;{selectedApp.admin_notes}&rdquo;
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-neutral-600 italic">No previous review activity recorded.</p>
                                                    )}
                                                </div>
                                            </section>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="p-6 bg-neutral-900/40 border-t border-[var(--dash-border)]">
                                        <div className="mb-4">
                                            <label className="block text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-2">Editorial Internal Note / Feedback to Writer</label>
                                            <textarea 
                                                value={adminNote}
                                                onChange={(e) => setAdminNote(e.target.value)}
                                                placeholder="Add internal evaluation or feedback for revision request..."
                                                className="dashboard-textarea h-20 text-sm"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 gap-3">
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedApp.id, 'under_editorial_screening')}
                                                disabled={processingAction}
                                                className="dashboard-btn-secondary text-[11px] h-11 uppercase tracking-wider font-bold"
                                            >
                                                Screening
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedApp.id, 'revision_requested')}
                                                disabled={processingAction}
                                                className="dashboard-btn-secondary text-[11px] h-11 uppercase tracking-wider font-bold text-orange-400 border-orange-500/20"
                                            >
                                                Req Revision
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedApp.id, 'approved_as_writer')}
                                                disabled={processingAction}
                                                className="dashboard-btn-primary bg-emerald-600 hover:bg-emerald-500 text-[11px] h-11 uppercase tracking-wider font-bold"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedApp.id, 'archived_not_advanced')}
                                                disabled={processingAction}
                                                className="dashboard-btn-danger text-[11px] h-11 uppercase tracking-wider font-bold opacity-60 hover:opacity-100"
                                            >
                                                Archive
                                            </button>
                                        </div>
                                        <p className="mt-4 text-[9px] text-neutral-600 text-center uppercase tracking-widest">
                                            Updating status triggers institutional email notification to writer.
                                        </p>
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
