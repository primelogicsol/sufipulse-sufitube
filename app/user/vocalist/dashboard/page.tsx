"use client";
import { useState, useEffect, Suspense } from 'react';
import { 
    Mic, 
    Music, 
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
    Play
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';

type PerformanceStatus = 
    | 'assigned' 
    | 'pre-production' 
    | 'recording' 
    | 'raw_vocals_received' 
    | 'mixing' 
    | 'mastering' 
    | 'published';

export interface PerformanceAssignment {
    id: string;
    referenceId: string;
    kalam_id: string;
    kalam_title: string;
    kalam_content: string;
    status: PerformanceStatus;
    assigned_at: string;
    producer_notes?: string;
    technical_guidelines?: string;
}

function VocalistDashboardInner() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [profileApproved, setProfileApproved] = useState<boolean | null>(null);
    const [assignments, setAssignments] = useState<PerformanceAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'performances'>('overview');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [vocalistProfile, setVocalistProfile] = useState<any>(null);

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
            const res = await fetch('/api/vocalists');
            const data = await res.json();
            const profile = Array.isArray(data) ? data.find((p: any) => p.user_id === user?.id || p.email === user?.email) : null;
            if (profile) {
                setVocalistProfile(profile);
                setProfileApproved(profile.profile_status === 'approved' || profile.profile_status === 'approved_as_vocalist');
            } else {
                setProfileApproved(false);
            }
        } catch {
            setProfileApproved(false);
        }
    };

    const loadAssignments = async () => {
        try {
            // Placeholder: eventually fetch from /api/performance-assignments
            // For now, simulating empty state or mock assignments
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

    const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
        'assigned': { label: 'Assigned', color: 'blue', icon: Clock },
        'pre-production': { label: 'Pre-Production', color: 'amber', icon: RefreshCw },
        'recording': { label: 'Recording', color: 'purple', icon: Mic },
        'raw_vocals_received': { label: 'Raw Vocals Received', color: 'emerald', icon: ShieldCheck },
        'mixing': { label: 'Mixing', color: 'cyan', icon: Music },
        'published': { label: 'Published', color: 'emerald', icon: CheckCircle2 },
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mb-6" />
                <p className="text-neutral-500 font-bold uppercase tracking-[0.2em] text-xs">Accessing Performance Registry...</p>
            </div>
        );
    }

    if (profileApproved === false) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center">
                <div className="w-20 h-20 bg-amber-400/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-400/20">
                    <ShieldCheck className="w-10 h-10 text-amber-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Ahl-e-Sada Registration Required</h1>
                <p className="text-neutral-400 mb-10 leading-relaxed">
                    Access to the Vocalist Dashboard is reserved for authorized Ahl-e-Sada contributors. Please complete the institutional performance intake to begin.
                </p>
                <button 
                    onClick={() => router.push('/vocalists/apply')}
                    className="px-10 py-4 bg-amber-400 text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-amber-300 transition-all shadow-lg shadow-amber-900/20"
                >
                    Apply for Performance Registry
                </button>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-10 pb-20">
                
                {/* Header Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-400/10 rounded-lg">
                                <Mic size={20} className="text-amber-400" />
                            </div>
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">Authorized Ahl-e-Sada</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tighter mb-2">Performance Hub</h1>
                        <p className="text-neutral-500 text-sm max-w-xl">Welcome, {vocalistProfile?.performance_name || user?.full_name}. Monitor your sacred performance assignments and production lifecycle.</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">Registry ID</p>
                            <p className="text-sm font-mono text-white font-bold tracking-wider">{vocalistProfile?.referenceId || 'SP-VOC-PENDING'}</p>
                        </div>
                        <button 
                            onClick={() => vocalistProfile?.referenceId && handleCopy(vocalistProfile.referenceId)}
                            className="p-3 bg-white/5 border border-white/10 rounded-xl text-neutral-400 hover:text-white transition-all"
                        >
                            {copiedId === vocalistProfile?.referenceId ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left: Navigation & Quick Actions */}
                    <div className="lg:col-span-3 space-y-4">
                        <nav className="space-y-1">
                            {[
                                { id: 'overview', label: 'Hub Overview', icon: LayoutDashboard },
                                { id: 'assignments', label: 'Kalam Assignments', icon: Music, count: assignments.filter(a => a.status === 'assigned').length },
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
                            <h3 className="px-5 text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em]">Quick Resources</h3>
                            <a href="/production-guide" className="block px-5 py-3 text-[10px] font-bold text-neutral-500 hover:text-amber-400 transition-colors uppercase tracking-widest">
                                Recording Guidelines →
                            </a>
                            <a href="/legal/performer-rights" className="block px-5 py-3 text-[10px] font-bold text-neutral-500 hover:text-amber-400 transition-colors uppercase tracking-widest">
                                Performer Rights →
                            </a>
                        </div>
                    </div>

                    {/* Right: Content Area */}
                    <div className="lg:col-span-9">
                        {activeTab === 'overview' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-neutral-900 border border-white/5 rounded-3xl p-8 group hover:border-amber-400/20 transition-all">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                                            <Music size={24} />
                                        </div>
                                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Active Assignments</p>
                                        <p className="text-3xl font-bold text-white">0</p>
                                    </div>
                                    <div className="bg-neutral-900 border border-white/5 rounded-3xl p-8 group hover:border-emerald-400/20 transition-all">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                                            <Play size={24} />
                                        </div>
                                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Published Works</p>
                                        <p className="text-3xl font-bold text-white">0</p>
                                    </div>
                                    <div className="bg-neutral-900 border border-white/5 rounded-3xl p-8 group hover:border-amber-400/20 transition-all">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
                                            <Star size={24} />
                                        </div>
                                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Elite Rank</p>
                                        <p className="text-3xl font-bold text-white">Fellow</p>
                                    </div>
                                </div>

                                {/* Active Task Notification */}
                                <div className="bg-linear-to-r from-amber-400/10 to-transparent border border-amber-400/20 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex items-start gap-6 text-center md:text-left">
                                        <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-black shrink-0 mx-auto md:mx-0">
                                            <Sparkles size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-2">Ready for Assignment</h3>
                                            <p className="text-neutral-400 text-sm max-w-md leading-relaxed">
                                                Your performance profile is fully institutionalized. You are now eligible to receive assigned kalam from the SufiPulse editorial library.
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setActiveTab('assignments')}
                                        className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all whitespace-nowrap"
                                    >
                                        View Opportunities
                                    </button>
                                </div>

                                {/* Profile Snapshot */}
                                <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden">
                                    <div className="px-8 py-5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Institutional Profile Snapshot</h3>
                                        <button className="text-[9px] font-black text-amber-400 uppercase tracking-widest hover:underline">Update Credentials</button>
                                    </div>
                                    <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-12">
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-2">Performance Base</p>
                                                <div className="flex items-center gap-3">
                                                    <Globe size={16} className="text-blue-400" />
                                                    <p className="text-sm font-bold text-white">{vocalistProfile?.country || 'Not specified'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-2">Vocal Range</p>
                                                <div className="flex items-center gap-3">
                                                    <Mic size={16} className="text-pink-400" />
                                                    <p className="text-sm font-bold text-white uppercase tracking-widest">{vocalistProfile?.vocal_range || 'General'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-6">
                                            <div>
                                                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-2">Technical Proficiency</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {vocalistProfile?.worked_in_studio && (
                                                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-widest rounded-lg">Studio Ready</span>
                                                    )}
                                                    <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-widest rounded-lg">Authorized</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-2">Languages Performed</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(vocalistProfile?.languages_performed || []).map((l: string) => (
                                                        <span key={l} className="px-3 py-1 bg-white/5 border border-white/5 text-neutral-400 text-[10px] font-bold uppercase tracking-widest rounded-lg">{l}</span>
                                                    ))}
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
                                        <Music className="w-10 h-10 text-neutral-700" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No Active Assignments</h3>
                                    <p className="text-neutral-500 text-sm max-w-sm mx-auto leading-relaxed">
                                        You do not have any pending performance assignments at this time. Our production board will notify you when a kalam matches your vocal profile.
                                    </p>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-3xl p-10">
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                        <MessageSquare size={16} className="text-amber-400" /> Performance Pipeline
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Upcoming Cycles</p>
                                            <p className="text-sm text-neutral-300 font-medium leading-relaxed">We are currently in the mid-stage review for the 'Mystical Meta' cycle. New assignments will begin in 10-15 days.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Eligibility Notice</p>
                                            <p className="text-sm text-neutral-300 font-medium leading-relaxed">Ensure your performance sample link is active. If your technical status has changed, please contact the coordinator.</p>
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
                                    <h3 className="text-xl font-bold text-white mb-2">Performance History Empty</h3>
                                    <p className="text-neutral-500 text-sm max-w-sm mx-auto leading-relaxed">
                                        Once you begin recording and submitting master vocals, your performance history and production lifecycle will appear here.
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

export default function VocalistDashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
            </div>
        }>
            <VocalistDashboardInner />
        </Suspense>
    );
}
