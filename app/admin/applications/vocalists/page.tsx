"use client";
import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
// import { supabase } from '../lib/supabase';
import { 
    CircleCheck as CheckCircle, 
    Circle as XCircle, 
    Clock, 
    Eye, 
    User, 
    CircleAlert as AlertCircle, 
    RefreshCw, 
    FileText,
    Mic,
    Search,
    Video,
    XCircle as CloseIcon
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { VocalistProfileType } from '@/app/types/vocalist.types';

interface WriterApplication {
    id: string;
    user_id: string | null;
    email: string | null;
    pen_name: string;
    bio: string;
    sample_work: string;
    previous_publications: string | null;
    status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';
    admin_notes: string | null;
    reviewed_by: string | null;
    submitted_at: string;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string | null;
    users: {
        id: string;
        email: string;
        full_name: string | null;
        auth_user_id: string | null;
    } | null;
    reviewer?: {
        full_name: string | null;
        email: string;
    } | null;
}

export default function AdminVocalistApplications() {
    const { user, loading: authLoading } = useAuth();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending_review' | 'approved' | 'rejected' | 'under_review' | 'revision_requested'>('pending_review');
    const [processingAction, setProcessingAction] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading) {
            loadApplications();
        }
    }, [authLoading]);

    async function loadApplications() {
        try {
            setLoading(true);
            const res = await fetch('/api/vocalists');
            const data = await res.json();
            setApplications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[AdminVocalistApplications] Error loading applications:', error);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }

    const filteredApplications = applications.filter((app) => {
        const statusMatch = app.status || app.profile_status;
        const matchesSearch =
            app.performance_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.referenceId?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = filter === 'all' || statusMatch === filter;

        return matchesSearch && matchesFilter;
    });

    const statusCounts = {
        all: applications.length,
        pending: applications.filter((a) => (a.status || a.profile_status) === 'pending_review').length,
        under_review: applications.filter((a) => (a.status || a.profile_status) === 'under_review').length,
        revision_requested: applications.filter((a) => (a.status || a.profile_status) === 'revision_requested').length,
        approved: applications.filter((a) => (a.status || a.profile_status) === 'approved').length,
        rejected: applications.filter((a) => (a.status || a.profile_status) === 'rejected').length,
    };

    function getStatusBadgeClass(status: string) {
        switch (status) {
            case 'approved': return 'dashboard-badge-success';
            case 'rejected': return 'dashboard-badge-danger';
            case 'pending_review': return 'dashboard-badge-pending';
            case 'revision_requested': return 'dashboard-badge-draft';
            case 'under_review': return 'dashboard-badge-info';
            default: return 'dashboard-badge-draft';
        }
    }

    const handleUpdateStatus = async (id: string | undefined, status: string) => {
        if (!id) return;
        try {
            setProcessingAction(true);
            const res = await fetch(`/api/vocalists/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    profile_status: status, 
                    status,
                    admin_note: adminNotes
                }),
            });
            if (!res.ok) throw new Error('Failed to update status');
            setSelectedApp(null);
            setAdminNotes('');
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Ahl-e-Sada Registry</h1>
                        <p className="text-neutral-500 text-sm">Manage institutional vocalist applications and performance credentials.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-400/10 border border-amber-400/20 rounded-lg">
                        <Mic className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">{applications.length} Registry Entries</span>
                    </div>
                </div>

                {actionError && (
                    <div className="p-4 rounded-xl text-sm flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/20 text-red-400">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-bold uppercase tracking-wider">{actionError}</span>
                        </div>
                        <button type="button" onClick={() => setActionError(null)} className="opacity-50 hover:opacity-100 text-lg">×</button>
                    </div>
                )}

                <div className="dashboard-card">
                    <div className="flex flex-col gap-6 mb-8">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                                type="text"
                                placeholder="Search by Reference ID, Performance Name, or Email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="dashboard-input pl-12 h-14 bg-neutral-900/50 border-white/5 rounded-xl"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'pending_review', label: 'New Intake', count: statusCounts.pending },
                                { id: 'under_review', label: 'Under Review', count: statusCounts.under_review },
                                { id: 'revision_requested', label: 'Revision', count: statusCounts.revision_requested },
                                { id: 'approved', label: 'Approved', count: statusCounts.approved },
                                { id: 'rejected', label: 'Rejected', count: statusCounts.rejected },
                                { id: 'all', label: 'All Entries', count: statusCounts.all },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilter(tab.id as any)}
                                    className={`px-5 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                                        filter === tab.id 
                                            ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/10' 
                                            : 'bg-white/5 text-neutral-500 hover:text-white hover:bg-white/10 border border-white/5'
                                    }`}
                                >
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
                            <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Accessing Registry...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 uppercase tracking-widest">Ahl-e-Sada Contributor</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 uppercase tracking-widest">Experience / Range</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 uppercase tracking-widest">Languages</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-neutral-500 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredApplications.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <p className="text-neutral-600 font-bold uppercase tracking-widest text-xs">No records found in registry.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredApplications.map((app) => (
                                            <tr key={app.id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                                                            <Mic size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white text-sm tracking-tight">{app.performance_name || app.full_name}</div>
                                                            <div className="text-[10px] text-neutral-500 font-mono tracking-wider mt-0.5">{app.referenceId || app.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="text-xs text-neutral-300 font-bold uppercase tracking-wider">{app.years_experience} Years Exp.</div>
                                                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">{app.vocal_range || 'Unknown Range'}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-wrap gap-1">
                                                        {(Array.isArray(app.languages_performed) ? app.languages_performed : []).slice(0, 2).map((l: string) => (
                                                            <span key={l} className="px-2 py-0.5 bg-white/5 rounded-md text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{l}</span>
                                                        ))}
                                                        {(app.languages_performed?.length > 2) && <span className="text-[9px] text-neutral-600 ml-1">+{app.languages_performed.length - 2} more</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                        (app.status || app.profile_status) === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                        (app.status || app.profile_status) === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                        (app.status || app.profile_status) === 'revision_requested' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                                        'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                    }`}>
                                                        {(app.status || app.profile_status)?.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedApp(app);
                                                            setAdminNotes(app.admin_notes || '');
                                                        }}
                                                        className="px-4 py-2 bg-white/5 hover:bg-amber-400 hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                                                    >
                                                        Review Dossier
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
                        <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl" onClick={() => !processingAction && setSelectedApp(null)} />
                        
                        <div className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                            {/* Modal Header */}
                            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                                        <Mic size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white tracking-tight">Performance Profile Dossier</h2>
                                        <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mt-1">
                                            {selectedApp.referenceId} • {selectedApp.email}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedApp(null)}
                                    className="p-2 hover:bg-white/5 rounded-xl text-neutral-500 hover:text-white transition-all"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    
                                    {/* Left: Metadata */}
                                    <div className="lg:col-span-2 space-y-8">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Legal Full Name</p>
                                                <p className="text-white font-bold">{selectedApp.full_name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Performance Name</p>
                                                <p className="text-white font-bold">{selectedApp.performance_name || '—'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Location</p>
                                                <p className="text-white font-bold">{selectedApp.city}, {selectedApp.country}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Experience / Range</p>
                                                <p className="text-white font-bold uppercase text-xs">{selectedApp.years_experience} Years • {selectedApp.vocal_range}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Languages Performed</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(Array.isArray(selectedApp.languages_performed) ? selectedApp.languages_performed : []).map((l: string) => (
                                                    <span key={l} className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-neutral-300 uppercase tracking-wider">{l}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Performance Styles</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(Array.isArray(selectedApp.performance_styles) ? selectedApp.performance_styles : []).map((s: string) => (
                                                    <span key={s} className="px-3 py-1 bg-amber-400/5 border border-amber-400/10 rounded-lg text-[10px] font-bold text-amber-400 uppercase tracking-wider">{s}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Performance Sample</p>
                                            <div className="p-4 bg-neutral-900 border border-white/5 rounded-2xl flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Video className="text-neutral-500" size={18} />
                                                    <span className="text-xs font-mono text-neutral-400 truncate max-w-md">{selectedApp.sample_link}</span>
                                                </div>
                                                <a href={selectedApp.sample_link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-white border border-white/10 transition-all">
                                                    Launch Sample
                                                </a>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Training & Heritage</p>
                                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                <p className="text-sm text-neutral-300 leading-relaxed italic">&ldquo;{selectedApp.musical_training || "No training data provided."}&rdquo;</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Governance */}
                                    <div className="space-y-8 lg:border-l lg:border-white/5 lg:pl-8">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Registry Controls</p>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                                    <CheckCircle size={14} className={selectedApp.worked_in_studio ? 'text-emerald-500' : 'text-neutral-700'} />
                                                    Studio Ready: {selectedApp.worked_in_studio ? 'Yes' : 'No'}
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                                    <CheckCircle size={14} className={selectedApp.accept_producer_coordination ? 'text-emerald-500' : 'text-neutral-700'} />
                                                    Producer Framework Accepted
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Governance Decision Notes</label>
                                            <textarea
                                                value={adminNotes}
                                                onChange={(e) => setAdminNotes(e.target.value)}
                                                placeholder="Add internal institutional notes or revision instructions..."
                                                className="w-full h-40 bg-neutral-900 border border-white/5 rounded-2xl p-4 text-xs text-white placeholder:text-neutral-700 outline-none focus:border-amber-400/30 transition-all"
                                            />
                                            <p className="text-[9px] text-neutral-600 uppercase font-bold tracking-widest leading-relaxed">
                                                Notes marked as 'Revision Instructions' will be visible to the applicant in their status portal.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-6 border-t border-white/5 bg-white/[0.01]">
                                <div className="flex flex-wrap items-center justify-end gap-3">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedApp.id, 'revision_requested')}
                                        disabled={processingAction}
                                        className="px-6 py-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-30"
                                    >
                                        Request Revision
                                    </button>
                                    <button
                                        onClick={() => confirm('Reject this application from the registry?') && handleUpdateStatus(selectedApp.id, 'rejected')}
                                        disabled={processingAction}
                                        className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-30"
                                    >
                                        Reject Entry
                                    </button>
                                    <div className="w-px h-8 bg-white/5 mx-2" />
                                    <button
                                        onClick={() => handleUpdateStatus(selectedApp.id, 'approved')}
                                        disabled={processingAction || (selectedApp.status || selectedApp.profile_status) === 'approved'}
                                        className="px-8 py-3 bg-linear-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all disabled:opacity-30"
                                    >
                                        Authorize Registry Admission
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
