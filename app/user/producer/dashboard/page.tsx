"use client";
import { useState, useEffect, Suspense } from 'react';
import { 
    Music2, 
    Layers, 
    Clock, 
    CheckCircle2, 
    CircleAlert as AlertCircle, 
    ShieldCheck, 
    History, 
    Globe, 
    Languages, 
    Video, 
    FileText,
    Copy,
    Check,
    RefreshCw,
    MessageSquare,
    Sparkles,
    Star,
    LayoutDashboard,
    User,
    ArrowRight,
    Play,
    Cpu,
    Disc3
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PerformanceStatus as ProductionStatus, PerformanceAssignment as ProductionAssignment } from '@/app/types/contributor.types';

function ProducerDashboardInner() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [profileApproved, setProfileApproved] = useState<boolean | null>(null);
    const [assignments, setAssignments] = useState<ProductionAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'performances'>('overview');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [producerProfile, setProducerProfile] = useState<any>(null);

    useEffect(() => {
        const tab = searchParams?.get('tab');
        if (tab === 'assignments' || tab === 'performances' || tab === 'overview') {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!authLoading && user) {
            checkProfileStatus();
            loadAssignments();
        } else if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user]);

    const checkProfileStatus = async () => {
        try {
            const res = await fetch('/api/producers');
            const data = await res.json();
            const profile = Array.isArray(data) ? data.find((p: any) => p.user_id === user?.id || p.email === user?.email) : null;
            if (profile) {
                setProducerProfile(profile);
                setProfileApproved(profile.profile_status === 'approved' || profile.profile_status === 'approved_as_producer');
            } else {
                setProfileApproved(false);
            }
        } catch {
            setProfileApproved(false);
        }
    };

    const loadAssignments = async () => {
        try {
            // Placeholder for production-assignments API
            setAssignments([]);
        } catch (error) {
            console.error('Error loading assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mb-6" />
                <p className="text-neutral-500 font-bold uppercase tracking-[0.2em] text-xs">Accessing Production Registry...</p>
            </div>
        );
    }

    if (profileApproved === false) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center">
                <div className="w-20 h-20 bg-amber-400/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-400/20">
                    <ShieldCheck className="w-10 h-10 text-amber-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Ahl-e-Naghma Registration Required</h1>
                <p className="text-neutral-400 mb-10 leading-relaxed">
                    Access to the Producer Dashboard is reserved for authorized Ahl-e-Naghma contributors. Please complete the institutional production intake to begin.
                </p>
                <button 
                    onClick={() => router.push('/producers/apply')}
                    className="px-10 py-4 bg-amber-400 text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-amber-300 transition-all shadow-lg shadow-amber-900/20"
                >
                    Apply for Production Registry
                </button>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-10 pb-20">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-400/10 rounded-lg">
                                <Music2 size={20} className="text-amber-400" />
                            </div>
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">Authorized Ahl-e-Naghma</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tighter mb-2">Production Hub</h1>
                        <p className="text-neutral-500 text-sm max-w-xl">Welcome, {producerProfile?.professional_name || user?.full_name}. Direct and monitor your sacred production cycles.</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">Registry ID</p>
                            <p className="text-sm font-mono text-white font-bold tracking-wider">{producerProfile?.referenceId || 'SP-PRD-PENDING'}</p>
                        </div>
                        <button 
                            onClick={() => producerProfile?.referenceId && handleCopy(producerProfile.referenceId)}
                            className="p-3 bg-white/5 border border-white/10 rounded-xl text-neutral-400 hover:text-white transition-all"
                        >
                            {copiedId === producerProfile?.referenceId ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Rail: Navigation */}
                    <div className="lg:col-span-3 space-y-4">
                        <nav className="space-y-1">
                            {[
                                { id: 'overview', label: 'Hub Overview', icon: LayoutDashboard },
                                { id: 'assignments', label: 'Curated Assignments', icon: Disc3, count: assignments.length },
                                { id: 'performances', label: 'Production History', icon: History },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${
                                            activeTab === tab.id 
                                                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' 
                                                : 'text-neutral-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <Icon size={18} className={activeTab === tab.id ? 'text-black' : 'group-hover:text-amber-400 transition-colors'} />
                                            <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                                        </div>
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${activeTab === tab.id ? 'bg-black/20' : 'bg-amber-400/20 text-amber-400'}`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="pt-8 space-y-4">
                            <h3 className="px-5 text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em]">Institutional Access</h3>
                            <a href="/production-framework" className="block px-5 py-3 text-[10px] font-bold text-neutral-500 hover:text-amber-400 transition-colors uppercase tracking-widest">
                                Production Standards →
                            </a>
                            <a href="/legal/producer-rights" className="block px-5 py-3 text-[10px] font-bold text-neutral-500 hover:text-amber-400 transition-colors uppercase tracking-widest">
                                Rights & Governance →
                            </a>
                        </div>
                    </div>

                    {/* Right Rail: Viewport */}
                    <div className="lg:col-span-9">
                        {activeTab === 'overview' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Stats Cluster */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-neutral-900 border border-white/5 rounded-3xl p-8 group hover:border-amber-400/20 transition-all">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                                            <Layers size={24} />
                                        </div>
                                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Active Cycles</p>
                                        <p className="text-3xl font-bold text-white">0</p>
                                    </div>
                                    <div className="bg-neutral-900 border border-white/5 rounded-3xl p-8 group hover:border-emerald-400/20 transition-all">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                                            <Play size={24} />
                                        </div>
                                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Mastered Works</p>
                                        <p className="text-3xl font-bold text-white">0</p>
                                    </div>
                                    <div className="bg-neutral-900 border border-white/5 rounded-3xl p-8 group hover:border-amber-400/20 transition-all">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
                                            <Star size={24} />
                                        </div>
                                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Elite Rank</p>
                                        <p className="text-3xl font-bold text-white">Associate</p>
                                    </div>
                                </div>

                                {/* Active Pipeline Notice */}
                                <div className="bg-linear-to-r from-amber-400/10 to-transparent border border-amber-400/20 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex items-start gap-6 text-center md:text-left">
                                        <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-black shrink-0 mx-auto md:mx-0">
                                            <Sparkles size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-2">Eligible for Curation</h3>
                                            <p className="text-neutral-400 text-sm max-w-md leading-relaxed">
                                                Your production credentials are now active. You will be matched with approved kalam and authorized vocalists for upcoming creative cycles.
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setActiveTab('assignments')}
                                        className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all whitespace-nowrap"
                                    >
                                        Browse Pipeline
                                    </button>
                                </div>

                                {/* Production Environment Snapshot */}
                                <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden">
                                    <div className="px-8 py-5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Technical Environment</h3>
                                        <button className="text-[9px] font-black text-amber-400 uppercase tracking-widest hover:underline">Update Technical Profile</button>
                                    </div>
                                    <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-12">
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-2">DAW / Primary Tools</p>
                                                <div className="flex items-center gap-3">
                                                    <Cpu size={16} className="text-blue-400" />
                                                    <p className="text-sm font-bold text-white uppercase tracking-wider">{producerProfile?.primary_tools || 'Not specified'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-2">Production Base</p>
                                                <div className="flex items-center gap-3">
                                                    <Globe size={16} className="text-emerald-400" />
                                                    <p className="text-sm font-bold text-white">{producerProfile?.country || 'Remote'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-6">
                                            <div>
                                                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-2">Authorized Focus Areas</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(producerProfile?.primary_production_focus || []).map((f: string) => (
                                                        <span key={f} className="px-3 py-1 bg-white/5 border border-white/5 text-neutral-400 text-[10px] font-bold uppercase tracking-widest rounded-lg">{f}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-2">Institutional Status</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Active Registry Member</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'assignments' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-neutral-900 border border-white/5 rounded-3xl p-16 text-center">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
                                        <Disc3 className="w-10 h-10 text-neutral-700" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No Active Curation</h3>
                                    <p className="text-neutral-500 text-sm max-w-sm mx-auto leading-relaxed">
                                        You do not have any pending production cycles assigned at this time. The board will notify you once a creative match is authorized.
                                    </p>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-3xl p-10">
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                        <MessageSquare size={16} className="text-amber-400" /> Production Pipeline
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Upcoming Cycles</p>
                                            <p className="text-sm text-neutral-300 font-medium leading-relaxed">Stage 3 Production Consideration is currently finalizing the 'Vocal Assignment' phase.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Workflow Notice</p>
                                            <p className="text-sm text-neutral-300 font-medium leading-relaxed">Ensure your portfolio link remains active for board evaluation during matching cycles.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'performances' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-neutral-900 border border-white/5 rounded-3xl p-16 text-center">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
                                        <History className="w-10 h-10 text-neutral-700" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Registry History Empty</h3>
                                    <p className="text-neutral-500 text-sm max-w-sm mx-auto leading-relaxed">
                                        Your institutional production history and master audit trail will appear here once assignments are initiated.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
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

export default function ProducerDashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
            </div>
        }>
            <ProducerDashboardInner />
        </Suspense>
    );
}
