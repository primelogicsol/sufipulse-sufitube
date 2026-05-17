"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { 
    CheckCircle2, 
    Clock, 
    Eye, 
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
    Mic2,
    Music2,
    Settings,
    ChevronRight,
    Languages,
    Tag,
    Feather,
    XCircle
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

type ProductionStatus = 
    | 'under_production_consideration' 
    | 'vocal_suitability_review' 
    | 'musical_structure_review' 
    | 'hold_for_future_cycle' 
    | 'recommended_for_assignment' 
    | 'not_recommended_for_production';

interface ProductionKalam extends Record<string, any> {
    id: string;
    referenceId: string;
    title: string;
    language: string;
    form_style: string;
    thematic_category: string;
    content: string;
    status: string;
    production_status?: ProductionStatus;
    submitted_at: string;
    email: string;
    full_name: string;
    admin_notes?: string;
    production_notes?: string;
    reviewed_at?: string;
}

function ProductionConsiderationQueueInner() {
    const { user, loading: authLoading } = useAuth();
    const [kalams, setKalams] = useState<ProductionKalam[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKalam, setSelectedKalam] = useState<ProductionKalam | null>(null);
    const [prodNote, setProdNote] = useState('');
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
            // Entry rule: Only editorially approved or already in production consideration
            const filtered = (Array.isArray(data) ? data : []).filter((k: any) => 
                k.status === 'editorially_approved' || 
                k.status === 'production_consideration' ||
                k.production_status
            );
            setKalams(filtered);
        } catch (error) {
            console.error('[ProdQueue] Error loading kalams:', error);
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

    const handleUpdateStatus = async (id: string, prodStatus: ProductionStatus) => {
        try {
            setProcessingAction(true);
            setActionError(null);
            
            // Move main status to production_consideration if not already
            const payload: any = { 
                production_status: prodStatus,
                production_notes: prodNote 
            };
            
            if (prodStatus !== 'not_recommended_for_production') {
                payload.status = 'production_consideration';
            }

            const res = await fetch(`/api/kalams/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update production status');
            }

            setSelectedKalam(null);
            setProdNote('');
            await loadKalams();
        } catch (err: any) {
            setActionError(err?.message || 'Failed to update production status');
        } finally {
            setProcessingAction(false);
        }
    };

    const filteredKalams = kalams.filter((k) => {
        const query = searchQuery.toLowerCase();
        return (
            k.title.toLowerCase().includes(query) ||
            k.full_name.toLowerCase().includes(query) ||
            k.referenceId.toLowerCase().includes(query)
        );
    });

    const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
        under_production_consideration: { label: 'Under Consideration', color: 'pink', icon: Clock },
        vocal_suitability_review: { label: 'Vocal Review', color: 'purple', icon: Mic2 },
        musical_structure_review: { label: 'Musical Review', color: 'indigo', icon: Music2 },
        hold_for_future_cycle: { label: 'On Hold', color: 'amber', icon: Archive },
        recommended_for_assignment: { label: 'Recommended', color: 'emerald', icon: CheckCircle2 },
        not_recommended_for_production: { label: 'Not Recommended', color: 'slate', icon: XCircle },
    };

    function StatusBadge({ status }: { status: string }) {
        const config = statusConfig[status] || { label: 'Editorial Approved', color: 'blue', icon: ShieldCheck };
        const Icon = config.icon;
        
        const colorClasses: Record<string, string> = {
            pink: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
            purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
            indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
            amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
            emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
            slate: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
            blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
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
                        <h1 className="text-2xl font-bold text-[var(--dash-text-primary)]">Production Consideration Queue</h1>
                        <p className="text-sm text-[var(--dash-text-muted)]">Internal planning stage for approved sacred works.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-lg max-w-md">
                        <Settings className="w-5 h-5 text-pink-400 shrink-0" />
                        <p className="text-[10px] leading-tight text-pink-200/80">
                            Production consideration is an internal planning stage only. It does not authorize 
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
                    <div className="relative mb-8">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search by title, writer, or reference ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="dashboard-input has-icon w-full"
                        />
                    </div>

                    {/* Prod Table */}
                    {loading ? (
                        <div className="py-20 text-center">
                            <RefreshCw className="w-8 h-8 text-[var(--dash-accent)] animate-spin mx-auto mb-4" />
                            <p className="text-[var(--dash-text-muted)]">Loading planning queue...</p>
                        </div>
                    ) : (
                        <div className="dashboard-table-container">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Ref ID</th>
                                        <th>Title</th>
                                        <th>Writer</th>
                                        <th>Thematic Category</th>
                                        <th>Ed. Approval</th>
                                        <th>Prod. Status</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredKalams.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-20 text-[var(--dash-text-muted)]">
                                                No works currently in production consideration.
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
                                                    <span className="text-xs text-[var(--dash-text-primary)]">{k.full_name}</span>
                                                </td>
                                                <td className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">
                                                    {k.thematic_category}
                                                </td>
                                                <td className="text-[10px] text-[var(--dash-text-muted)]">
                                                    {k.reviewed_at ? new Date(k.reviewed_at).toLocaleDateString() : '—'}
                                                </td>
                                                <td>
                                                    <StatusBadge status={k.production_status || ''} />
                                                </td>
                                                <td className="text-right">
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedKalam(k);
                                                            setProdNote(k.production_notes || '');
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
                                    <div className="w-12 h-12 rounded-xl bg-pink-400/10 flex items-center justify-center">
                                        <Settings className="w-6 h-6 text-pink-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-lg font-bold text-white mb-0">Production Review: {selectedKalam.title}</h2>
                                            <StatusBadge status={selectedKalam.production_status || ''} />
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="font-mono text-xs text-pink-400/80">{selectedKalam.referenceId}</span>
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
                                {/* Left Panel: Context */}
                                <div className="md:col-span-3 border-r border-[var(--dash-border)] overflow-y-auto p-6 bg-neutral-950/20">
                                    <div className="space-y-8">
                                        <section>
                                            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">Editorial Context</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] text-neutral-600 uppercase mb-1">Writer Profile</label>
                                                    <p className="text-sm text-neutral-200">{selectedKalam.full_name}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-neutral-600 uppercase mb-1">Editorial Notes</label>
                                                    <p className="text-xs text-neutral-500 italic leading-relaxed">{selectedKalam.admin_notes || 'No editorial notes recorded.'}</p>
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">Characteristics</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                                    <Languages size={14} className="text-blue-400" />
                                                    {selectedKalam.language}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                                    <Feather size={14} className="text-amber-400" />
                                                    {selectedKalam.form_style}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                                    <Tag size={14} className="text-pink-400" />
                                                    {selectedKalam.thematic_category}
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </div>

                                {/* Right Panel: Text & Planning */}
                                <div className="md:col-span-9 flex flex-col h-full bg-[#0a0a0a]">
                                    <div className="flex-1 overflow-y-auto p-8">
                                        <div className="space-y-8">
                                            {/* Text View */}
                                            <section>
                                                <div className="bg-[#111] border border-neutral-800 rounded-2xl p-10 shadow-inner relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                                        <Settings size={120} />
                                                    </div>
                                                    <pre className="text-xl text-neutral-100 font-mono whitespace-pre-wrap leading-[2] text-center max-w-2xl mx-auto">
                                                        {selectedKalam.content}
                                                    </pre>
                                                </div>
                                            </section>

                                            {/* Planning History */}
                                            <section className="pt-8 border-t border-neutral-900">
                                                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <History className="w-4 h-4" />
                                                    Production Planning History
                                                </h3>
                                                <div className="space-y-4">
                                                    {selectedKalam.production_notes ? (
                                                        <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
                                                            <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-2">Internal Production Memo</p>
                                                            <p className="text-sm text-neutral-300 italic leading-relaxed">
                                                                &ldquo;{selectedKalam.production_notes}&rdquo;
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-neutral-600 italic">No previous production planning recorded.</p>
                                                    )}
                                                </div>
                                            </section>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="p-6 bg-neutral-900/40 border-t border-[var(--dash-border)]">
                                        <div className="mb-4">
                                            <label className="block text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-2">Production Internal Note (Planning/Readiness)</label>
                                            <textarea 
                                                value={prodNote}
                                                onChange={(e) => setProdNote(e.target.value)}
                                                placeholder="Notes on vocal suitability, musical structure, or studio requirements..."
                                                className="dashboard-textarea h-20 text-sm"
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedKalam.id, 'under_production_consideration')}
                                                disabled={processingAction}
                                                className="dashboard-btn-secondary px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold"
                                            >
                                                Under Consideration
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedKalam.id, 'vocal_suitability_review')}
                                                disabled={processingAction}
                                                className="dashboard-btn-secondary px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-purple-400 border-purple-500/20"
                                            >
                                                Vocal Review
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedKalam.id, 'musical_structure_review')}
                                                disabled={processingAction}
                                                className="dashboard-btn-secondary px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-indigo-400 border-indigo-500/20"
                                            >
                                                Musical Review
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedKalam.id, 'recommended_for_assignment')}
                                                disabled={processingAction}
                                                className="dashboard-btn-primary bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold"
                                            >
                                                Recommend Assignment
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedKalam.id, 'hold_for_future_cycle')}
                                                disabled={processingAction}
                                                className="dashboard-btn-secondary px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-amber-400 border-amber-500/20"
                                            >
                                                Hold Cycle
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedKalam.id, 'not_recommended_for_production')}
                                                disabled={processingAction}
                                                className="dashboard-btn-danger px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold opacity-60 hover:opacity-100 ml-auto"
                                            >
                                                Not Recommended
                                            </button>
                                        </div>
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

export default function ProductionConsiderationQueue() {
    return (
        <Suspense fallback={null}>
            <ProductionConsiderationQueueInner />
        </Suspense>
    );
}
