"use client";

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { 
    CircleCheck as CheckCircle, 
    Circle as UncheckedCircle, 
    Clock, 
    Eye, 
    User, 
    CircleAlert as AlertCircle, 
    RefreshCw, 
    FileText,
    Music,
    Search,
    Video,
    XCircle,
    Layers,
    Cpu,
    Globe,
    X,
    ShieldCheck,
    Settings,
    HardDrive,
    Activity,
    Mic,
    Building,
    History as HistoryIcon,
    ArrowRight
} from 'lucide-react';
import { StudioProfileType } from '@/app/types/studio.types';
import { useAuth } from '@/app/contexts/AuthContext';

export default function AdminStudioApplications() {
    const { loading: authLoading } = useAuth();
    const [applications, setApplications] = useState<StudioProfileType[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<StudioProfileType | null>(null);
    const [filter, setFilter] = useState<string>('pending');
    const [processingAction, setProcessingAction] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        if (!authLoading) {
            loadApplications();
        }
    }, [authLoading]);

    async function loadApplications() {
        try {
            setLoading(true);
            const res = await fetch('/api/studio');
            const data = await res.json();
            setApplications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[AdminStudioApplications] Error loading applications:', error);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }

    const filteredApplications = applications.filter((app) => {
        const matchesSearch =
            (app.studio_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.primary_contact_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.email || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || (app.profile_status || 'pending') === filter;
        return matchesSearch && matchesFilter;
    });

    const statusCounts = {
        all: applications.length,
        pending: applications.filter((a) => (a.profile_status || 'pending') === 'pending').length,
        under_review: applications.filter((a) => a.profile_status === 'under_review').length,
        revision_requested: applications.filter((a) => a.profile_status === 'revision_requested').length,
        approved: applications.filter((a) => a.profile_status === 'approved').length,
        rejected: applications.filter((a) => a.profile_status === 'rejected').length,
    };

    function getStatusBadgeClass(status: string) {
        switch (status) {
            case 'approved': return 'dashboard-badge-success';
            case 'rejected': return 'dashboard-badge-danger';
            case 'pending': return 'dashboard-badge-pending';
            case 'under_review': return 'dashboard-badge-pending';
            case 'revision_requested': return 'dashboard-badge-draft';
            default: return 'dashboard-badge-draft';
        }
    }

    const handleUpdateStatus = async (id: string | undefined, status: string) => {
        if (!id) return;
        try {
            setProcessingAction(true);
            const res = await fetch(`/api/studio/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile_status: status, admin_note: adminNote }),
            });
            if (!res.ok) throw new Error('Failed to update status');
            setSelectedApp(null);
            setAdminNote('');
            loadApplications();
        } catch (err: any) {
            setActionError(err?.message || 'Failed to update status');
        } finally {
            setProcessingAction(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Building className="text-amber-400" />
                            Karkhana-e-Sada Registry
                        </h1>
                        <p className="text-neutral-500 text-sm mt-1">Network Studio / Technical Audit Queue</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={loadApplications}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-all"
                            title="Refresh registry"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {actionError && (
                    <div className="p-4 rounded-xl text-sm flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/20 text-red-400 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={18} />
                            <span className="font-medium">{actionError}</span>
                        </div>
                        <button type="button" onClick={() => setActionError(null)} className="p-1 hover:bg-white/5 rounded-md">
                            <X size={18} />
                        </button>
                    </div>
                )}

                <div className="dashboard-card border-none bg-neutral-900/40 backdrop-blur-xl">
                    <div className="flex flex-col gap-6 mb-8">
                        {/* Search & Filter */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-4 relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-amber-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search registry (Studio Name, Contact, Email)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-amber-400/50 focus:outline-none transition-all"
                                />
                            </div>

                            <div className="lg:col-span-8 overflow-x-auto">
                                <div className="flex p-1 bg-black/20 rounded-xl border border-white/5 min-w-max">
                                    {(['pending', 'under_review', 'revision_requested', 'approved', 'all'] as const).map((s) => (
                                        <button 
                                            key={s}
                                            onClick={() => setFilter(s)} 
                                            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                                filter === s 
                                                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/10' 
                                                : 'text-neutral-500 hover:text-neutral-300'
                                            }`}
                                        >
                                            {s.replace(/_/g, ' ')} 
                                            <span className={`ml-2 px-1.5 py-0.5 rounded-md ${filter === s ? 'bg-black/10' : 'bg-white/5'}`}>
                                                {statusCounts[s as keyof typeof statusCounts] ?? statusCounts.all}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-24 text-center">
                            <RefreshCw className="w-10 h-10 text-amber-400/20 animate-spin mx-auto mb-4" />
                            <p className="text-neutral-600 font-bold uppercase tracking-widest text-xs">Accessing Studio Registry...</p>
                        </div>
                    ) : (
                        <div className="dashboard-table-container">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Studio Identity</th>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Primary Contact</th>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Operation</th>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Submission Date</th>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Status</th>
                                        <th className="text-right text-[10px] font-black uppercase tracking-widest text-neutral-500">Governance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {filteredApplications.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-20">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                                        <Building className="w-8 h-8 text-neutral-800" />
                                                    </div>
                                                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">
                                                        {searchQuery ? 'No matching registry records' : 'Intake queue is empty'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredApplications.map((app) => (
                                            <tr key={(app as any).id} className="hover:bg-white/[0.01] transition-colors group">
                                                <td>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-amber-400/20 to-transparent flex items-center justify-center border border-amber-400/10">
                                                            <Settings className="w-5 h-5 text-amber-400" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white text-sm">
                                                                {app.studio_name}
                                                            </div>
                                                            <div className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">
                                                                {app.city}, {app.country}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div className="font-bold text-neutral-300 text-xs uppercase tracking-wider">{app.primary_contact_name}</div>
                                                        <div className="text-[10px] text-neutral-500 truncate max-w-[150px]">{app.email}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                                        {app.years_in_operation} Years
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                                                        {(app as any).created_at ? new Date((app as any).created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={`flex items-center gap-1.5 w-fit px-3 py-1 rounded-lg border ${getStatusBadgeClass(app.profile_status || 'pending')} text-[9px] font-black uppercase tracking-widest`}>
                                                        <div className="w-1 h-1 rounded-full bg-current" />
                                                        {(app.profile_status || 'pending').replace(/_/g, ' ')}
                                                    </div>
                                                </td>
                                                <td className="text-right">
                                                    <button
                                                        onClick={() => setSelectedApp(app)}
                                                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:bg-amber-400 hover:text-black hover:border-amber-400 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        Review Audit
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

                {selectedApp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !processingAction && setSelectedApp(null)} />
                        
                        <div className="relative w-full max-w-4xl bg-neutral-900 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                            {/* Modal Header */}
                            <div className="px-10 py-8 bg-black/20 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-400/10 rounded-2xl border border-amber-400/20 text-amber-400">
                                        <Building size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white tracking-tight">Studio Network Audit</h2>
                                        <p className="text-neutral-500 text-sm font-medium uppercase tracking-widest">Registry ID: {(selectedApp as any).id?.slice(-8).toUpperCase()}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedApp(null)}
                                    className="p-2 hover:bg-white/5 rounded-xl text-neutral-500 hover:text-white transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    {/* Column 1: Identity */}
                                    <div className="md:col-span-1 space-y-8">
                                        <section>
                                            <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <Building size={14} /> Facility Identity
                                            </h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[9px] text-neutral-700 uppercase font-black tracking-widest">Studio Name</p>
                                                    <p className="text-white font-bold text-sm">{selectedApp.studio_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-neutral-700 uppercase font-black tracking-widest">Primary Contact</p>
                                                    <p className="text-amber-400 font-bold text-sm">{selectedApp.primary_contact_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-neutral-700 uppercase font-black tracking-widest">Email Address</p>
                                                    <p className="text-white font-medium text-xs truncate">{selectedApp.email}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-neutral-700 uppercase font-black tracking-widest">Location</p>
                                                    <p className="text-white font-bold text-xs">{selectedApp.city}, {selectedApp.country}</p>
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <HistoryIcon size={14} /> Audit Status
                                            </h3>
                                            <div className={`px-4 py-2 rounded-xl border ${getStatusBadgeClass(selectedApp.profile_status || 'pending')} inline-block text-[10px] font-black uppercase tracking-[0.2em]`}>
                                                {(selectedApp.profile_status || 'pending').replace(/_/g, ' ')}
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <Clock size={14} /> Experience
                                            </h3>
                                            <p className="text-white font-bold text-sm">{selectedApp.years_in_operation} Years in Operation</p>
                                        </section>
                                    </div>

                                    {/* Column 2 & 3: Technical */}
                                    <div className="md:col-span-2 space-y-10">
                                        <section>
                                            <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <HardDrive size={14} /> Technical Infrastructure
                                            </h3>
                                            <div className="p-6 bg-black/40 border border-white/5 rounded-2xl">
                                                <p className="text-neutral-400 text-sm leading-relaxed italic">{selectedApp.equipment_overview}</p>
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <Mic size={14} /> Recording Capabilities
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedApp.recording_capabilities?.map(cap => (
                                                    <span key={cap} className="px-3 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                                        {cap}
                                                    </span>
                                                ))}
                                            </div>
                                        </section>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <section>
                                                <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                    <Globe size={14} /> Previous Work
                                                </h3>
                                                {selectedApp.previous_work_link ? (
                                                    <a 
                                                        href={selectedApp.previous_work_link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-amber-500 transition-colors"
                                                    >
                                                        View Facility Record <ArrowRight size={12} />
                                                    </a>
                                                ) : (
                                                    <span className="text-neutral-700 text-[10px] font-black uppercase tracking-widest">No record provided</span>
                                                )}
                                            </section>
                                            <section>
                                                <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                    <ShieldCheck size={14} /> Operational Alignment
                                                </h3>
                                                <div className="space-y-2">
                                                    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${selectedApp.agree_centralized_validation ? 'text-emerald-500' : 'text-neutral-700'}`}>
                                                        {selectedApp.agree_centralized_validation ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                        Centralized Review
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${selectedApp.agree_centralized_authorization ? 'text-emerald-500' : 'text-neutral-700'}`}>
                                                        {selectedApp.agree_centralized_authorization ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                        Authorization Authority
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer (Actions) */}
                            <div className="p-8 bg-black/40 border-t border-white/5 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Technical Audit Note (Sent in status update email)</label>
                                    <textarea 
                                        value={adminNote}
                                        onChange={e => setAdminNote(e.target.value)}
                                        className="w-full bg-black/60 border border-white/5 rounded-xl p-4 text-sm text-white placeholder:text-neutral-700 focus:border-amber-400/30 focus:outline-none transition-all h-20"
                                        placeholder="Add context for approval, rejection, or technical revision..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <button
                                        onClick={() => handleUpdateStatus((selectedApp as any).id, 'approved')}
                                        disabled={processingAction}
                                        className="py-4 bg-emerald-500 text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={16} /> Authorize Facility
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus((selectedApp as any).id, 'under_review')}
                                        disabled={processingAction}
                                        className="py-4 bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Clock size={16} /> Mark Under Audit
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus((selectedApp as any).id, 'revision_requested')}
                                        disabled={processingAction}
                                        className="py-4 bg-amber-400/10 border border-amber-400/30 text-amber-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-amber-400/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw size={16} /> Request Revision
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus((selectedApp as any).id, 'rejected')}
                                        disabled={processingAction}
                                        className="py-4 bg-red-500/10 border border-red-500/30 text-red-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={16} /> Reject Intake
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(212, 175, 55, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(212, 175, 55, 0.3);
                }
            `}</style>
        </DashboardLayout>
    );
}
