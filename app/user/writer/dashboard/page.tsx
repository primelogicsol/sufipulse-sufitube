"use client";
import { useState, useEffect, Suspense } from 'react';
import { 
    Feather, 
    Send, 
    Clock, 
    FileCheck, 
    CircleAlert as AlertCircle, 
    ShieldCheck, 
    History, 
    StickyNote, 
    Languages, 
    Type, 
    Tag,
    Copy,
    Check,
    RefreshCw,
    MessageSquare,
    BookOpen,
    FileText,
    PencilLine
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { KalamUnderDraft, WriterProfileType } from '@/app/types/contributor.types';
import { Badge } from '@/app/components/primitives/Badge';
import { PrimaryButton } from '@/app/components/primitives/PrimaryButton';
import { Card } from '@/app/components/primitives/Card';

type KalamStatus = 
    | 'submitted' 
    | 'under_editorial_review' 
    | 'revision_requested' 
    | 'editorially_approved' 
    | 'not_advanced' 
    | 'registry_pre_allocated' 
    | 'production_consideration';

export interface KalamSubmission {
    id: string;
    referenceId: string;
    title: string;
    language: string;
    form_style: string;
    thematic_category: string;
    content: string;
    status: KalamStatus;
    submitted_at: string;
    notes?: string;
    admin_notes?: string;
    revision_notes?: string;
}

// Support for existing imports that expect 'Kalam'
export type Kalam = KalamSubmission;

function WriterDashboardInner() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [profileApproved, setProfileApproved] = useState<boolean | null>(null);
    const [kalams, setKalams] = useState<KalamSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'submit' | 'history'>('overview');
    
    // Form State
    const [formData, setFormData] = useState({
        title: '',
        language: '',
        form_style: '',
        thematic_category: '',
        content: '',
        notes: '',
        originality_confirmed: false,
        rights_confirmed: false,
        governance_acknowledged: false
    });
    
    // Revision State
    const [editingKalam, setEditingKalam] = useState<KalamSubmission | null>(null);
    const [submitting, setProcessing] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [successRef, setSuccessRef] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        const tab = searchParams?.get('tab');
        if (tab === 'submit' || tab === 'history' || tab === 'overview') {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!authLoading && user) {
            checkProfileStatus();
            loadKalams();
        } else if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user]);

    const checkProfileStatus = async () => {
        try {
            const res = await fetch('/api/writers');
            const data = await res.json();
            const profile = Array.isArray(data) ? data.find((p: any) => p.user_id === user?.id) : null;
            if (profile) {
                setProfileApproved(profile.profile_status === 'approved' || profile.profile_status === 'approved_as_writer');
            } else {
                setProfileApproved(false);
            }
        } catch {
            setProfileApproved(false);
        }
    };

    const loadKalams = async () => {
        try {
            const res = await fetch('/api/kalams');
            const data = await res.json();
            setKalams(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading kalams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSubmitKalam = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setFormError(null);
        setSuccessRef(null);

        try {
            const endpoint = editingKalam ? `/api/kalams/${editingKalam.id}` : '/api/kalams';
            const method = editingKalam ? 'PATCH' : 'POST';

            const res = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit kalam');

            setSuccessRef(data.referenceId || editingKalam?.referenceId);
            setFormData({
                title: '',
                language: '',
                form_style: '',
                thematic_category: '',
                content: '',
                notes: '',
                originality_confirmed: false,
                rights_confirmed: false,
                governance_acknowledged: false
            });
            setEditingKalam(null);
            await loadKalams();
            setTimeout(() => {
                setSuccessRef(null);
                setActiveTab('history');
            }, 3000);
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleEditRevision = (k: KalamSubmission) => {
        setEditingKalam(k);
        setFormData({
            title: k.title,
            language: k.language,
            form_style: k.form_style,
            thematic_category: k.thematic_category,
            content: k.content,
            notes: k.notes || '',
            originality_confirmed: true,
            rights_confirmed: true,
            governance_acknowledged: true
        });
        setActiveTab('submit');
    };

    const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
        submitted: { label: 'Submitted', color: 'amber', icon: Clock },
        under_editorial_review: { label: 'Under Editorial Review', color: 'blue', icon: SearchIcon },
        revision_requested: { label: 'Revision Requested', color: 'orange', icon: RefreshCw },
        editorially_approved: { label: 'Editorially Approved', color: 'emerald', icon: CheckCircle },
        not_advanced: { label: 'Not Advanced', color: 'slate', icon: AlertCircle },
        registry_pre_allocated: { label: 'Registry Pre-Allocated', color: 'purple', icon: ShieldCheck },
        production_consideration: { label: 'Production Consideration', color: 'pink', icon: History },
    };

    function SearchIcon(props: any) {
        return (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        );
    }

    function CheckCircle(props: any) {
        return (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        );
    }

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

    if (profileApproved === false) {
        return (
            <DashboardLayout>
                <div className="min-h-[70vh] flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-neutral-900 border border-amber-400/20 rounded-2xl p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-amber-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-8 h-8 text-amber-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-4">Editorial Approval Pending</h2>
                        <p className="text-neutral-400 text-sm leading-relaxed mb-8">
                            Your writer profile is still under editorial review. 
                            Dashboard access will activate after institutional approval.
                        </p>
                        <button onClick={() => router.push('/')} className="block w-full py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors border border-white/10">
                            Return to Website
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-white">Ahl-e-Qalam Dashboard</h1>
                            <StatusBadge status="approved_as_writer" />
                        </div>
                        <p className="text-sm text-neutral-400">Manage your submissions and editorial registry.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        <p className="text-[10px] leading-tight text-emerald-200/80 uppercase font-bold tracking-widest">Institutional Writer Verified</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-neutral-800">
                    <button onClick={() => setActiveTab('overview')} className={`px-6 py-4 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'overview' ? 'text-amber-400' : 'text-neutral-500 hover:text-white'}`}>
                        Overview
                        {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
                    </button>
                    <button onClick={() => { setEditingKalam(null); setActiveTab('submit'); }} className={`px-6 py-4 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'submit' ? 'text-amber-400' : 'text-neutral-500 hover:text-white'}`}>
                        {editingKalam ? 'Revise Kalam' : 'Submit New Kalam'}
                        {activeTab === 'submit' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`px-6 py-4 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'history' ? 'text-amber-400' : 'text-neutral-500 hover:text-white'}`}>
                        My Submissions
                        {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'overview' && (
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <Feather className="w-5 h-5 text-amber-400" />
                                    Welcome to the Registry
                                </h3>
                                <div className="prose prose-invert prose-sm">
                                    <p className="text-neutral-300 leading-relaxed">
                                        Your profile is formally recognized within the SufiPulse institutional registry. 
                                        You may now submit original works for editorial consideration.
                                    </p>
                                    <div className="bg-amber-400/5 border border-amber-400/10 rounded-xl p-6 my-6">
                                        <h4 className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Governance Notice
                                        </h4>
                                        <p className="text-[11px] text-amber-200/60 leading-relaxed mb-0">
                                            Editorial approval confirms literary acceptance only. It does not authorize 
                                            vocalist assignment, production, recording, publication, or release.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
                                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Recent Activity
                                </h3>
                                {loading ? (
                                    <div className="py-12 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-neutral-600" /></div>
                                ) : kalams.length === 0 ? (
                                    <p className="text-center py-12 text-neutral-600 text-sm italic">No recent activity recorded.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {kalams.slice(0, 3).map(k => (
                                            <div key={k.id} className="flex items-center justify-between p-4 bg-neutral-950/50 border border-neutral-800 rounded-xl">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center">
                                                        <FileText className="w-5 h-5 text-neutral-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{k.title}</p>
                                                        <p className="text-[10px] text-neutral-500 font-mono uppercase">{k.referenceId}</p>
                                                    </div>
                                                </div>
                                                <StatusBadge status={k.status} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                                <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4">Registry References</h3>
                                <div className="space-y-3">
                                    <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                                        <p className="text-[9px] text-neutral-600 uppercase font-bold mb-1">Contributor ID</p>
                                        <p className="text-xs font-mono text-amber-400">{user?.id.split('_')[1]?.slice(0, 8).toUpperCase() || '—'}</p>
                                    </div>
                                    <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                                        <p className="text-[9px] text-neutral-600 uppercase font-bold mb-1">Approved Date</p>
                                        <p className="text-xs text-neutral-300">April 2026</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'submit' && (
                    <div className="max-w-4xl">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-neutral-800 bg-neutral-950/30 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{editingKalam ? 'Revise Kalam Submission' : 'Submit New Kalam'}</h2>
                                    <p className="text-sm text-neutral-500 mt-1">
                                        {editingKalam ? `Addressing feedback for Ref: ${editingKalam.referenceId}` : 'Formal editorial intake for the Ahl-e-Qalam framework.'}
                                    </p>
                                </div>
                                {editingKalam && (
                                    <button 
                                        onClick={() => { setEditingKalam(null); setActiveTab('history'); }}
                                        className="text-xs text-neutral-500 hover:text-white uppercase font-bold tracking-widest"
                                    >
                                        Cancel Revision
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmitKalam} className="p-8 space-y-8">
                                {formError && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {formError}
                                    </div>
                                )}

                                {successRef && (
                                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                                        <div className="flex items-center gap-3 mb-2">
                                            <CheckCircle className="w-5 h-5" />
                                            <p className="font-bold">Submission Received Successfully</p>
                                        </div>
                                        <p className="text-sm text-emerald-200/70">
                                            Reference: <span className="font-mono">{successRef}</span>. Redirecting to history...
                                        </p>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Kalam Title</label>
                                        <div className="relative">
                                            <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                            <input
                                                required
                                                type="text"
                                                placeholder="e.g. Man Kunto Maula"
                                                value={formData.title}
                                                onChange={e => setFormData({...formData, title: e.target.value})}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-amber-400/50 focus:outline-none transition-colors shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Language</label>
                                        <div className="relative">
                                            <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                            <select
                                                required
                                                value={formData.language}
                                                onChange={e => setFormData({...formData, language: e.target.value})}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-amber-400/50 focus:outline-none transition-colors shadow-inner appearance-none"
                                            >
                                                <option value="">Select Language</option>
                                                <option value="Persian">Persian (Farsi)</option>
                                                <option value="Urdu">Urdu</option>
                                                <option value="Punjabi">Punjabi</option>
                                                <option value="Kashmiri">Kashmiri</option>
                                                <option value="Arabic">Arabic</option>
                                                <option value="Sindhi">Sindhi</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Form / Style</label>
                                        <div className="relative">
                                            <Feather className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                            <select
                                                required
                                                value={formData.form_style}
                                                onChange={e => setFormData({...formData, form_style: e.target.value})}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-amber-400/50 focus:outline-none transition-colors shadow-inner appearance-none"
                                            >
                                                <option value="">Select Style</option>
                                                <option value="Ghazal">Ghazal</option>
                                                <option value="Nazm">Nazm</option>
                                                <option value="Hamd">Hamd</option>
                                                <option value="Naat">Naat</option>
                                                <option value="Manqabat">Manqabat</option>
                                                <option value="Kafi">Kafi</option>
                                                <option value="Masnavi">Masnavi</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Thematic Category</label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                            <select
                                                required
                                                value={formData.thematic_category}
                                                onChange={e => setFormData({...formData, thematic_category: e.target.value})}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-amber-400/50 focus:outline-none transition-colors shadow-inner appearance-none"
                                            >
                                                <option value="">Select Theme</option>
                                                <option value="Ishq-e-Ilahi">Ishq-e-Ilahi (Divine Love)</option>
                                                <option value="Ishq-e-Rasool">Ishq-e-Rasool (Love of Prophet)</option>
                                                <option value="Wahdat-ul-Wajood">Wahdat-ul-Wajood (Oneness of Being)</option>
                                                <option value="Faqr">Faqr (Spiritual Poverty)</option>
                                                <option value="Zikr">Zikr (Remembrance)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Full Kalam Text</label>
                                    <textarea
                                        required
                                        rows={12}
                                        placeholder="Enter the full text of your kalam here..."
                                        value={formData.content}
                                        onChange={e => setFormData({...formData, content: e.target.value})}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-6 text-white text-base font-mono focus:border-amber-400/50 focus:outline-none transition-colors shadow-inner leading-relaxed"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Optional Notes</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Add any specific context or notes for the editorial board..."
                                        value={formData.notes}
                                        onChange={e => setFormData({...formData, notes: e.target.value})}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white text-sm focus:border-amber-400/50 focus:outline-none transition-colors shadow-inner"
                                    />
                                </div>

                                <div className="bg-neutral-950/50 border border-neutral-800 rounded-2xl p-6 space-y-4">
                                    <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-2">Governance Acknowledgments</h4>
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input 
                                            required
                                            type="checkbox" 
                                            checked={formData.originality_confirmed}
                                            onChange={e => setFormData({...formData, originality_confirmed: e.target.checked})}
                                            className="mt-1"
                                        />
                                        <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors">I confirm this work is original, unpublished, and my own literary creation.</span>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input 
                                            required
                                            type="checkbox" 
                                            checked={formData.rights_confirmed}
                                            onChange={e => setFormData({...formData, rights_confirmed: e.target.checked})}
                                            className="mt-1"
                                        />
                                        <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors">I confirm that I hold full rights to this work and authorize SufiPulse for editorial review.</span>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input 
                                            required
                                            type="checkbox" 
                                            checked={formData.governance_acknowledged}
                                            onChange={e => setFormData({...formData, governance_acknowledged: e.target.checked})}
                                            className="mt-1"
                                        />
                                        <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors">I acknowledge that editorial approval confirms literary acceptance only and does not constitute production authorization.</span>
                                    </label>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-neutral-800">
                                    <button
                                        disabled={submitting}
                                        type="submit"
                                        className="px-10 py-4 bg-linear-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all duration-300 flex items-center gap-2 uppercase text-sm tracking-widest disabled:opacity-50"
                                    >
                                        {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        {editingKalam ? 'Resubmit for Review' : 'Formal Submission'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <History className="w-4 h-4 text-amber-400" />
                                Submission History
                            </h3>
                            <button onClick={loadKalams} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-neutral-500">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-neutral-800" /></div>
                        ) : kalams.length === 0 ? (
                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-20 text-center">
                                <StickyNote className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                                <p className="text-neutral-500 text-sm">No submissions found in your registry history.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {kalams.map(k => (
                                    <div key={k.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-amber-400/30 transition-all group">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-neutral-950 flex items-center justify-center border border-neutral-800 shadow-inner group-hover:border-amber-400/20 transition-colors">
                                                    <FileText className="w-6 h-6 text-neutral-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">{k.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="font-mono text-[10px] text-amber-400/80">{k.referenceId}</span>
                                                        <button 
                                                            onClick={() => handleCopy(k.referenceId)}
                                                            className="p-1 hover:bg-white/5 rounded transition-colors"
                                                        >
                                                            {copiedId === k.referenceId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-600" />}
                                                        </button>
                                                        <span className="text-[10px] text-neutral-600">•</span>
                                                        <span className="text-[10px] text-neutral-600 uppercase font-bold tracking-widest">{new Date(k.submitted_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <StatusBadge status={k.status} />
                                                {k.status === 'revision_requested' && (
                                                    <button 
                                                        onClick={() => handleEditRevision(k)}
                                                        className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                                                    >
                                                        <PencilLine className="w-3.5 h-3.5" />
                                                        Edit & Resubmit
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Editorial Feedback Preview */}
                                        {(k.admin_notes || k.revision_notes) && (
                                            <div className="mt-6 pt-6 border-t border-neutral-800/50">
                                                <div className="flex items-start gap-3 bg-neutral-950 rounded-xl p-4 border border-neutral-800/50">
                                                    <MessageSquare className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Latest Editorial Note</p>
                                                        <p className="text-xs text-neutral-300 italic leading-relaxed">
                                                            &ldquo;{k.admin_notes || k.revision_notes}&rdquo;
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default function WriterDashboard() {
    return (
        <Suspense fallback={null}>
            <WriterDashboardInner />
        </Suspense>
    );
}
