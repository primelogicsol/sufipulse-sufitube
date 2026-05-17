"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
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
    StickyNote,
    MessageSquare,
    BookOpen,
    Languages,
    Tag,
    Feather,
    Box,
    Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type KalamStatus = 
    | 'submitted' 
    | 'under_editorial_review' 
    | 'revision_requested' 
    | 'editorially_approved' 
    | 'not_advanced' 
    | 'registry_pre_allocated' 
    | 'production_consideration';

interface AdminKalam extends Record<string, any> {
    id: string;
    referenceId: string;
    title: string;
    language: string;
    form_style: string;
    thematic_category: string;
    content: string;
    status: KalamStatus;
    submitted_at: string;
    email: string;
    full_name: string;
    admin_notes?: string;
    revision_log?: Array<{
        note: string;
        requestedAt: string;
        requestedBy: string;
    }>;
}

function KalamEditorialQueueInner() {
    const { user, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const [kalams, setKalams] = useState<AdminKalam[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKalam, setSelectedKalam] = useState<AdminKalam | null>(null);
    const [adminNote, setAdminNote] = useState('');
    const [filter, setFilter] = useState<KalamStatus | 'all'>('submitted');
    const [processingAction, setProcessingAction] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading) {
            loadKalams();
        }
    }, [authLoading]);

    async function loadKalams() {
        try {
            setLoading(true);
            const res = await fetch('/api/kalams');
            const data = await res.json();
            setKalams(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[KalamQueue] Error loading kalams:', error);
            setKalams([]);
        } finally {
            setLoading(false);
        }
    }

    const handleCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleUpdateStatus = async (id: string, status: KalamStatus) => {
        try {
            setProcessingAction(true);
            setActionError(null);
            
            const res = await fetch(`/api/kalams/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status,
                    admin_note: adminNote 
                }),
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update status');
            }

            setSelectedKalam(null);
            setAdminNote('');
            await loadKalams();
        } catch (err: any) {
            setActionError(err?.message || 'Failed to update status');
        } finally {
            setProcessingAction(false);
        }
    };

    const filteredKalams = kalams.filter((k) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            k.title.toLowerCase().includes(query) ||
            k.email.toLowerCase().includes(query) ||
            k.full_name.toLowerCase().includes(query) ||
            k.referenceId.toLowerCase().includes(query);

        const matchesFilter = filter === 'all' || (k.status || 'submitted') === filter;
        return matchesSearch && matchesFilter;
    });

    const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
        submitted: { label: 'Submitted', color: 'amber', icon: Clock },
        under_editorial_review: { label: 'Under Review', color: 'blue', icon: Search },
        revision_requested: { label: 'Revision Requested', color: 'orange', icon: RefreshCw },
        editorially_approved: { label: 'Approved', color: 'emerald', icon: CheckCircle },
        not_advanced: { label: 'Not Advanced', color: 'slate', icon: Archive },
        registry_pre_allocated: { label: 'Pre-Allocated', color: 'purple', icon: Box },
        production_consideration: { label: 'Production Consideration', color: 'pink', icon: Activity },
    };

    function StatusBadge({ status }: { status: string }) {
        const config = statusConfig[status] || statusConfig.submitted;
        const Icon = config.icon;
        
        const colorClasses: Record<string, string> = {
            amber: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
            blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
            orange: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
            emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
            slate: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
            purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
            pink: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
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
                        <h1 className="text-2xl font-bold text-[var(--dash-text-primary)]">Kalam Editorial Review Queue</h1>
                        <p className="text-sm text-[var(--dash-text-muted)]">Evaluate sacred works for thematic and structural alignment.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg max-w-md">
                        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                        <p className="text-[10px] leading-tight text-blue-200/80">
                            Editorial approval confirms literary acceptance only. It does not authorize 
                            vocalist assignment, studio recording, or release authorization.
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
                                placeholder="Search by title, writer, or reference ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="dashboard-input has-icon w-full"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setFilter('all')} className={`dashboard-tab ${filter === 'all' ? 'active' : ''}`}>All</button>
                            <button onClick={() => setFilter('submitted')} className={`dashboard-tab ${filter === 'submitted' ? 'active' : ''}`}>New Submissions</button>
                            <button onClick={() => setFilter('under_editorial_review')} className={`dashboard-tab ${filter === 'under_editorial_review' ? 'active' : ''}`}>Under Review</button>
                            <button onClick={() => setFilter('revision_requested')} className={`dashboard-tab ${filter === 'revision_requested' ? 'active' : ''}`}>Revision</button>
                            <button onClick={() => setFilter('editorially_approved')} className={`dashboard-tab ${filter === 'editorially_approved' ? 'active' : ''}`}>Approved</button>
                            <button onClick={() => setFilter('registry_pre_allocated')} className={`dashboard-tab ${filter === 'registry_pre_allocated' ? 'active' : ''}`}>Pre-Allocated</button>
                            <button onClick={() => setFilter('production_consideration')} className={`dashboard-tab ${filter === 'production_consideration' ? 'active' : ''}`}>Production</button>
                        </div>
                    </div>

                    {/* Kalam Table */}
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
                                        <th>Ref ID</th>
                                        <th>Title</th>
                                        <th>Writer</th>
                                        <th>Lang/Style</th>
                                        <th>Submitted</th>
                                        <th>Status</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredKalams.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-20 text-[var(--dash-text-muted)]">
                                                No submissions found in this category.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredKalams.map((k) => (
                                            <tr key={k.id}>
                                                <td className="font-mono text-[10px] text-[var(--dash-accent)]">
                                                    {k.referenceId}
                                                </td>
                                                <td>
                                                    <span className="font-semibold text-[var(--dash-text-primary)]">{k.title}</span>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-[var(--dash-text-primary)]">{k.full_name}</span>
                                                        <span className="text-[9px] text-[var(--dash-text-muted)] uppercase">{k.email}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">{k.language}</span>
                                                        <span className="text-[10px] text-neutral-500 italic">{k.form_style}</span>
                                                    </div>
                                                </td>
                                                <td className="text-[10px] text-[var(--dash-text-muted)]">
                                                    {new Date(k.submitted_at || k.created_at || '').toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <StatusBadge status={k.status || 'submitted'} />
                                                </td>
                                                <td className="text-right">
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedKalam(k);
                                                            setAdminNote(k.admin_notes || '');
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
                {selectedKalam && (
                    <div className="dashboard-modal-overlay" onClick={() => !processingAction && setSelectedKalam(null)}>
                        <div className="dashboard-modal max-w-6xl" onClick={(e) => e.stopPropagation()}>
                            <div className="dashboard-modal-header border-b border-[var(--dash-border)]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-400/10 flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-lg font-bold text-white mb-0">Editorial Review: {selectedKalam.title}</h2>
                                            <StatusBadge status={selectedKalam.status || 'submitted'} />
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="font-mono text-xs text-blue-400/80">{selectedKalam.referenceId}</span>
                                            <button 
                                                onClick={() => handleCopy(selectedKalam.referenceId)}
                                                className="p-1 hover:bg-white/5 rounded transition-colors"
                                            >
                                                {copiedId === selectedKalam.referenceId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-500" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedKalam(null)} className="p-2 hover:bg-white/5 rounded-lg text-neutral-500 hover:text-white transition-colors">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="dashboard-modal-body p-0 grid md:grid-cols-12 max-h-[80vh] overflow-hidden">
                                {/* Left Panel: Metadata */}
                                <div className="md:col-span-3 border-r border-[var(--dash-border)] overflow-y-auto p-6 bg-neutral-950/20">
                                    <div className="space-y-8">
                                        <section>
                                            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">Work Metadata</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] text-neutral-600 uppercase mb-1">Writer</label>
                                                    <p className="text-sm text-neutral-200">{selectedKalam.full_name}</p>
                                                    <p className="text-[10px] text-neutral-500">{selectedKalam.email}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-neutral-600 uppercase mb-1">Language</label>
                                                    <div className="flex items-center gap-2 text-sm text-neutral-200">
                                                        <Languages className="w-3.5 h-3.5 text-blue-400" />
                                                        {selectedKalam.language}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-neutral-600 uppercase mb-1">Form / Style</label>
                                                    <div className="flex items-center gap-2 text-sm text-neutral-200">
                                                        <Feather className="w-3.5 h-3.5 text-amber-400" />
                                                        {selectedKalam.form_style}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-neutral-600 uppercase mb-1">Thematic Category</label>
                                                    <div className="flex items-center gap-2 text-sm text-neutral-200">
                                                        <Tag className="w-3.5 h-3.5 text-pink-400" />
                                                        {selectedKalam.thematic_category}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">Governance</h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-[10px] p-2 bg-neutral-900/50 rounded border border-neutral-800">
                                                    <span className="text-neutral-500">Originality</span>
                                                    {selectedKalam.originality_confirmed ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] p-2 bg-neutral-900/50 rounded border border-neutral-800">
                                                    <span className="text-neutral-500">Rights Auth</span>
                                                    {selectedKalam.rights_confirmed ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] p-2 bg-neutral-900/50 rounded border border-neutral-800">
                                                    <span className="text-neutral-500">Institutional Ack</span>
                                                    {selectedKalam.governance_acknowledged ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                                                </div>
                                            </div>
                                        </section>

                                        {/* Optional Writer Notes */}
                                        {selectedKalam.notes && (
                                            <section>
                                                <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-3">Writer Context</h3>
                                                <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed italic">
                                                    &ldquo;{selectedKalam.notes}&rdquo;
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                </div>

                                {/* Right Panel: Full Text & Actions */}
                                <div className="md:col-span-9 flex flex-col h-full bg-[#0a0a0a]">
                                    <div className="flex-1 overflow-y-auto p-8">
                                        <div className="space-y-8">
                                            {/* Full Text View */}
                                            <section>
                                                <div className="flex items-center justify-between mb-6">
                                                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                                        <StickyNote className="w-4 h-4 text-blue-400" />
                                                        Sacred Kalam Text
                                                    </h3>
                                                </div>
                                                <div className="bg-[#111] border border-neutral-800 rounded-2xl p-10 shadow-inner relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                                        <BookOpen size={120} />
                                                    </div>
                                                    <pre className="text-xl text-neutral-100 font-mono whitespace-pre-wrap leading-[2] text-center max-w-2xl mx-auto">
                                                        {selectedKalam.content}
                                                    </pre>
                                                </div>
                                            </section>

                                            {/* Revision History */}
                                            <section className="pt-8 border-t border-neutral-900">
                                                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <History className="w-4 h-4" />
                                                    Editorial Review History
                                                </h3>
                                                <div className="space-y-4">
                                                    {(selectedKalam.revision_log || []).length > 0 ? (
                                                        selectedKalam.revision_log?.map((entry, i) => (
                                                            <div key={i} className="flex gap-4">
                                                                <div className="w-0.5 bg-neutral-800 relative">
                                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-neutral-700" />
                                                                </div>
                                                                <div className="pb-4">
                                                                    <p className="text-[10px] text-neutral-600 mb-1">
                                                                        {new Date(entry.requestedAt).toLocaleString()} by {entry.requestedBy}
                                                                    </p>
                                                                    <div className="mt-2 p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg text-xs text-neutral-400 italic">
                                                                        &ldquo;{entry.note}&rdquo;
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-xs text-neutral-600 italic">No previous revision requests recorded.</p>
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
                                                placeholder="Add internal evaluation or specific feedback for revision request..."
                                                className="dashboard-textarea h-20 text-sm"
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedKalam.id, 'under_editorial_review')}
                                                disabled={processingAction}
                                                className="dashboard-btn-secondary px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold"
                                            >
                                                Mark Reviewing
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedKalam.id, 'revision_requested')}
                                                disabled={processingAction || !adminNote}
                                                className="dashboard-btn-secondary px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-orange-400 border-orange-500/20"
                                            >
                                                Req Revision
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedKalam.id, 'editorially_approved')}
                                                disabled={processingAction}
                                                className="dashboard-btn-primary bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedKalam.id, 'registry_pre_allocated')}
                                                disabled={processingAction}
                                                className="dashboard-btn-secondary px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-purple-400 border-purple-500/20"
                                            >
                                                Pre-Allocate
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedKalam.id, 'production_consideration')}
                                                disabled={processingAction}
                                                className="dashboard-btn-secondary px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-pink-400 border-pink-500/20"
                                            >
                                                Production Plan
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedKalam.id, 'not_advanced')}
                                                disabled={processingAction}
                                                className="dashboard-btn-danger px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold opacity-60 hover:opacity-100 ml-auto"
                                            >
                                                Archive
                                            </button>
                                        </div>
                                        <p className="mt-4 text-[9px] text-neutral-600 text-center uppercase tracking-widest">
                                            Status updates trigger formal institutional email notification to the writer.
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

export default function KalamEditorialReviewQueue() {
    return (
        <Suspense fallback={null}>
            <KalamEditorialQueueInner />
        </Suspense>
    );
}
