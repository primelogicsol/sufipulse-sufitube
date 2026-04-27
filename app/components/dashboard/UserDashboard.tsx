"use client";
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { storage } from '@/app/lib/storage';
import { getUserNotifications, markNotificationRead, markAllNotificationsRead, notifyAdmin } from '@/app/lib/notifications';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, FileText, Settings, CircleCheck as CheckCircle, Search, Circle as XCircle, Eye, CircleAlert as AlertCircle, Clock, CirclePlus as PlusCircle, Shield, LogOut, Loader, User, Bell, DollarSign, TrendingUp, Info, CalendarClock } from 'lucide-react';
import Editor, { EditorProvider } from "react-simple-wysiwyg";
import Link from 'next/link';

type RoleType = "writer" | "vocalist" | "producer" | "literary" | "studio";

interface UserDashboardProps {
    role: RoleType;
}

export default function UserDashboard({ role }: UserDashboardProps) {
    const { user, logout } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'my-content' | 'published' | 'royalties' | 'settings' | 'work-queue' | 'sessions'>('overview');
    const [loading, setLoading] = useState(true);

    // Data states
    const [items, setItems] = useState<any[]>([]);
    const [profileData, setProfileData] = useState<any>({});
    const [status, setStatus] = useState("");

    // UI states
    const [contentModal, setContentModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Form states
    const [draftForm, setDraftForm] = useState<any>({});
    const [submitLoading, setSubmitLoading] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Profile Settings States
    const [profileForm, setProfileForm] = useState({ name: '', avatar: null as File | null });
    const [profileLoading, setProfileLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Notification states
    const [notifications, setNotifications] = useState<any[]>([]);
    const [bellOpen, setBellOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    // Producer assignment states
    const [assignments, setAssignments] = useState<any[]>([]);

    // Studio session requests states
    const [sessionRequests, setSessionRequests] = useState<any[]>([]);

    // Royalty states
    const [royalties, setRoyalties] = useState<any[]>([]);
    const [bankInfo, setBankInfo] = useState<any>(null);
    const [bankFormOpen, setBankFormOpen] = useState(false);
    const [bankForm, setBankForm] = useState({
        holder_name: '', bank_name: '', account_number: '', iban_routing: '', swift_bic: '', account_type: 'savings', country: ''
    });

    const config = role === "writer" ? {
        title: "Writer Portal",
        subtitle: "Ahl-e-Qalam Control Center",
        term: "Kalam",
        termPlural: "Kalams",
        typeKey: 'kalam',
        profileType: 'writer',
        profileFields: {
            languages: 'primary_languages',
            styles: 'writing_styles',
            statusField: 'profile_status',
        },
        draftFields: [
            { name: "writing_style", label: "Writing Style", type: "radio", source: "styles" },
            { name: "language", label: "Language", type: "radio", source: "languages" },
            { name: "title", label: "Title", type: "text", placeholder: "The name you wish your kalam to be called" },
            { name: "content", label: "Content", type: "editor" }
        ],
        draftDefaults: { title: "", language: "", writing_style: "", content: "" }
    } : role === "vocalist" ? {
        title: "Vocalist Portal",
        subtitle: "Ahl-e-Sada Control Center",
        term: "Sada",
        termPlural: "Sadas",
        typeKey: 'sada',
        profileType: 'vocalist',
        profileFields: {
            languages: 'languages_performed',
            styles: 'performance_styles',
            statusField: 'status',
        },
        draftFields: [
            { name: "performance_style", label: "Performance Style", type: "radio", source: "styles" },
            { name: "language", label: "Language", type: "radio", source: "languages" },
            { name: "title", label: "Title", type: "text", placeholder: "The name you wish your sada to be called" },
            { name: "link", label: "Link", type: "url", placeholder: "URL to your sada" }
        ],
        draftDefaults: { title: "", language: "", performance_style: "", link: "" }
    } : role === "literary" ? {
        title: "Literary Contributor Portal",
        subtitle: "Ahl-e-Tahreer Control Center",
        term: "Article",
        termPlural: "Articles",
        typeKey: 'article',
        profileType: 'literary',
        profileFields: {
            languages: 'languages',
            styles: 'writing_focus',
            statusField: 'profile_status',
        },
        draftFields: [
            { name: "article_type", label: "Article Type", type: "radio", source: "styles" },
            { name: "language", label: "Language", type: "radio", source: "languages" },
            { name: "title", label: "Title", type: "text", placeholder: "Article title" },
            { name: "abstract", label: "Abstract", type: "textarea", placeholder: "Brief summary of the article (200–400 words)" },
            { name: "content", label: "Full Content", type: "editor" },
            { name: "author_name", label: "Author Name (as shown publicly)", type: "text", placeholder: "Your pen name or full name" },
            { name: "author_country", label: "Country", type: "text", placeholder: "e.g. United States" },
            { name: "author_city", label: "City", type: "text", placeholder: "e.g. New York" },
            { name: "author_domain", label: "Literary Domain / Topics", type: "text", placeholder: "e.g. Sufi Philosophy, Commentary, Research" },
        ],
        draftDefaults: { title: "", language: "", article_type: "", abstract: "", content: "", author_name: "", author_country: "", author_city: "", author_domain: "" }
    } : role === "studio" ? {
        title: "Studio Partner Portal",
        subtitle: "Karkhana-e-Sada Control Center",
        term: "Session Request",
        termPlural: "Sessions",
        typeKey: 'session_request',
        profileType: 'studio',
        profileFields: {
            languages: 'primary_services',
            styles: 'studio_capabilities',
            statusField: 'profile_status',
        },
        draftFields: [],
        draftDefaults: {}
    } : {
        title: "Producer Portal",
        subtitle: "Ahl-e-Naghma Control Center",
        term: "Track",
        termPlural: "Tracks",
        typeKey: 'performance_assignment',
        profileType: 'producer',
        profileFields: {
            languages: 'primary_production_focus',
            styles: 'primary_production_focus',
            statusField: 'profile_status',
        },
        draftFields: [],
        draftDefaults: {}
    };

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }
        setProfileForm(prev => ({ ...prev, name: user.full_name || '' }));
        // Load saved avatar from localStorage
        const savedAvatar = localStorage.getItem(`sufipulse_avatar_${user.id}`);
        if (savedAvatar) setAvatarUrl(savedAvatar);
        loadData();
        loadNotifications();
        loadRoyalties();
        loadBankInfo();
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const loadNotifications = () => {
        if (!user) return;
        setNotifications(getUserNotifications(user.id));
    };

    const loadRoyalties = async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/royalties');
            if (!res.ok) { setRoyalties([]); return; }
            const data = await res.json();
            setRoyalties(Array.isArray(data) ? data : []);
        } catch { setRoyalties([]); }
    };

    const loadBankInfo = async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/user/payout-account');
            if (!res.ok) { setBankInfo(null); return; }
            const data = await res.json();
            const account = data.account || null;
            setBankInfo(account);
            if (account) setBankForm({
                holder_name: account.account_holder_name || '',
                bank_name: account.bank_name || '',
                account_number: account.account_last4 ? `****${account.account_last4}` : '',
                iban_routing: account.routing_number || '',
                swift_bic: account.swift_bic || '',
                account_type: account.account_type || 'savings',
                country: account.country || ''
            });
        } catch { setBankInfo(null); }
    };

    const handleBankSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            const res = await fetch('/api/user/payout-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    account_holder_name: bankForm.holder_name,
                    bank_name: bankForm.bank_name,
                    account_number: bankForm.account_number,
                    routing_number: bankForm.iban_routing,
                    swift_bic: bankForm.swift_bic,
                    account_type: bankForm.account_type,
                    country: bankForm.country,
                }),
            });
            const data = await res.json();
            if (!res.ok) { alert(data.error || 'Failed to save. Please try again.'); return; }
            setBankFormOpen(false);
            await loadBankInfo();
            alert('Bank account saved successfully. Admin will verify before first payout.');
        } catch { alert('Failed to save. Please try again.'); }
    };

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setBellOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const profileApiMap: Record<string, string> = {
        writer: '/api/writers',
        vocalist: '/api/vocalists',
        producer: '/api/producers',
        literary: '/api/literary',
        studio: '/api/studio',
    };

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const profileApi = profileApiMap[config.profileType];
            const profileRes = await fetch(profileApi);
            const profileList = profileRes.ok ? await profileRes.json() : [];
            const profile = Array.isArray(profileList) ? (profileList[0] ?? null) : null;

            setStatus((profile as any)?.[config.profileFields.statusField] || 'pending');
            setProfileData({
                languages: (profile as any)?.[config.profileFields.languages] || [],
                styles: (profile as any)?.[config.profileFields.styles] || [],
                full_name: (profile as any)?.full_name || user.full_name || '',
                professional_name: (profile as any)?.professional_name || (profile as any)?.pen_name || (profile as any)?.performance_name || '',
                country: (profile as any)?.country || '',
                city: (profile as any)?.city || '',
                domain: Array.isArray((profile as any)?.[config.profileFields.styles]) ? ((profile as any)?.[config.profileFields.styles] || []).join(', ') : '',
            });

            if (role === 'producer') {
                const assignRes = await fetch('/api/performance-assignments');
                const allAssignments: any[] = assignRes.ok ? await assignRes.json() : [];
                setAssignments(allAssignments);
                setItems(allAssignments);
            } else if (role === 'studio') {
                const sessionRes = await fetch('/api/session-requests');
                const allRequests: any[] = sessionRes.ok ? await sessionRes.json() : [];
                setSessionRequests(allRequests);
                setItems(allRequests);
            } else {
                const allItems = await storage.getAll(config.typeKey);
                setItems(allItems.filter((i: any) => i.user_id === user.id));
            }

            if (role === 'literary') {
                const p = profile as any;
                setDraftForm({
                    title: '', language: '', article_type: '', abstract: '', content: '',
                    author_name: p?.professional_name || p?.full_name || user.full_name || '',
                    author_country: p?.country || '',
                    author_city: p?.city || '',
                    author_domain: Array.isArray(p?.writing_focus) ? p.writing_focus.join(', ') : '',
                });
            } else {
                setDraftForm(config.draftDefaults);
            }
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = () => {
        logout();
        router.push('/');
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordLoading(true);
        setTimeout(() => {
            alert("Password updated successfully!");
            setPasswordForm({ currentPassword: '', newPassword: '' });
            setPasswordLoading(false);
        }, 500);
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        // Save avatar to localStorage as data URL
        if (profileForm.avatar && user) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                localStorage.setItem(`sufipulse_avatar_${user.id}`, dataUrl);
                setAvatarUrl(dataUrl);
            };
            reader.readAsDataURL(profileForm.avatar);
        }
        setTimeout(() => {
            alert("Profile updated successfully!");
            setProfileLoading(false);
        }, 500);
    };

    const handleDraftChange = (e: any) => {
        setDraftForm({ ...draftForm, [e.target.name]: e.target.value });
    };

    const handleDraftSubmit = async (e: any) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            if (editingItem) {
                // On resubmit clear revision_notes and reset to under review
                await storage.update(config.typeKey, editingItem.id, { ...draftForm, status: 'under review', revision_notes: null });
                alert(`${config.term} revised and resubmitted for review!`);
                setEditingItem(null);
            } else {
                const authorMeta = role === 'literary' ? {
                    author_name: draftForm.author_name || profileData.professional_name || profileData.full_name || user?.full_name || '',
                    author_full_name: profileData.full_name || user?.full_name || '',
                    author_professional_name: profileData.professional_name || '',
                    author_country: draftForm.author_country || profileData.country || '',
                    author_city: draftForm.author_city || profileData.city || '',
                    author_domain: draftForm.author_domain || profileData.domain || '',
                    author_photo: (typeof window !== 'undefined' ? localStorage.getItem(`sufipulse_avatar_${user?.id}`) : null) || '',
                    slug: draftForm.title ? draftForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now() : `article-${Date.now()}`,
                    excerpt: draftForm.abstract || (draftForm.content || '').replace(/<[^>]*>/g, '').slice(0, 200) + '...'
                } : {};
                await storage.create(config.typeKey, { ...draftForm, ...authorMeta, status: 'under review' });
                // Notify admin of new content submission
                const adminRoutes: Record<string, string> = {
                    vocalist: '/admin/sadas',
                    literary: '/admin/articles',
                };
                const adminTitles: Record<string, string> = {
                    vocalist: `New Sada Submission`,
                    literary: `New Article Submission`,
                };
                if (role !== 'producer') {
                    notifyAdmin({
                        title: adminTitles[role] || `New ${config.term} Submission`,
                        message: `${user?.full_name || 'A contributor'} (${config.subtitle}) submitted "${draftForm.title || config.term}" for review.`,
                        event: 'application_received',
                        from_role: role,
                        from_name: user?.full_name,
                        action_url: adminRoutes[role] || `/admin/kalams`,
                    }).catch(console.error);
                }
                alert(`${config.term} submitted for review!`);
            }
            setActiveTab("my-content");
            loadData();  // reloads and re-prefills form
        } catch (err: any) {
            alert(err?.message || "Error submitting");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEditItem = (item: any) => {
        setEditingItem(item);
        const newDraft: any = {};
        Object.keys(config.draftDefaults).forEach(k => {
            newDraft[k] = item[k] || '';
        });
        setDraftForm(newDraft);
        setContentModal(false);
        setSelectedItem(null);
        setActiveTab("submissions");
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm(`Delete this ${config.term}?`)) return;
        try {
            await storage.delete(config.typeKey, id);
            alert("Deleted");
            setContentModal(false);
            loadData();
        } catch (err: any) {
            alert("Error deleting");
        }
    };

    const handleUpdateStatus = async (item: any, newStatus: string) => {
        try {
            await storage.update(config.typeKey, item.id, { status: newStatus });
            alert("Status updated");
            setContentModal(false);
            loadData();
        } catch (err: any) {
            alert("Error updating status");
        }
    };

    const getStatusColor = (statusText: string) => {
        const s = statusText?.toLowerCase();
        if (s === 'approved' || s === 'published') return 'text-green-400 bg-green-400/10';
        if (s === 'rejected' || s === 'declined') return 'text-red-400 bg-red-400/10';
        if (s === 'under review' || s === 'under_review') return 'text-blue-400 bg-blue-400/10';
        if (s === 'revision_requested' || s === 'revision requested') return 'text-yellow-400 bg-yellow-400/10';
        return 'text-neutral-400 bg-neutral-400/10';
    };

    const stats = {
        total: items.length,
        published: items.filter(i => i.status === 'published' || i.status === 'approved').length,
        pending: items.filter(i => i.status === 'under review').length,
        draft: items.filter(i => i.status === 'draft').length,
        revision_requested: items.filter(i => i.status === "revision requested").length,
        rejected: items.filter(i => i.status === "rejected").length
    };

    const navigationLinks = role === 'producer' ? [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'work-queue', label: 'Work Queue', icon: FileText },
        { id: 'royalties', label: 'Royalties', icon: DollarSign },
        { id: 'settings', label: 'General Settings', icon: Settings },
    ] : role === 'studio' ? [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'sessions', label: 'Session Requests', icon: CalendarClock },
        { id: 'royalties', label: 'Royalties', icon: DollarSign },
        { id: 'settings', label: 'General Settings', icon: Settings },
    ] : [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'my-content', label: role === 'literary' ? 'My Articles' : 'My Content', icon: FileText },
        { id: 'published', label: role === 'literary' ? 'Published Articles' : 'Published', icon: CheckCircle },
        { id: 'submissions', label: `Submit ${config.term}`, icon: PlusCircle },
        { id: 'royalties', label: 'Royalties', icon: DollarSign },
        { id: 'settings', label: 'General Settings', icon: Settings },
    ];

    const unreadCount = notifications.filter(n => !n.read).length;
    const userInitials = (user?.full_name || user?.email || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[var(--color-midnight)] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader className="w-10 h-10 text-[var(--color-gold)] animate-spin" />
                    <p className="mt-4 text-[var(--color-text-secondary)]">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    const filteredItems = items.filter(i => {
        const matchesSearch = !searchQuery || i.title?.toLowerCase().includes(searchQuery.toLowerCase());
        const dateMatch = !searchDate || (i.created_at && new Date(i.created_at).toISOString().split('T')[0] === searchDate);
        const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
        return matchesSearch && dateMatch && matchesStatus;
    });

    const activeItems = filteredItems.filter(i => activeTab === 'published' ? i.status === 'published' : i.status !== 'published');

    return (
        <div className="fixed inset-0 flex overflow-hidden bg-[var(--dash-bg-primary)]">
                    {/* Sidebar */}
                    <aside style={{ width: '224px' }} className="bg-[var(--dash-bg-secondary)] border-r border-[var(--dash-border)] hidden md:block shrink-0 overflow-y-auto">
                        <div className="p-4 border-b border-[var(--dash-border)]">
                            <div className="flex items-center gap-2 mb-3">
                                <a href="/" title="Back to SufiPulse" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                    <Image src="/sufipulse-logo-v5.png" alt="SufiPulse" width={36} height={36} className="rounded-lg shrink-0" />
                                    <span className="text-sm font-bold text-[var(--dash-text-primary)] leading-tight">SufiPulse</span>
                                </a>
                            </div>
                            <p className="text-[11px] font-semibold text-[var(--dash-accent)] uppercase tracking-wider">{config.title}</p>
                            <p className="text-[10px] text-[var(--dash-text-muted)] mt-0.5">{config.subtitle}</p>
                        </div>
                        <nav style={{ display: 'block', padding: '8px 0', width: '100%' }}>
                            {navigationLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = activeTab === link.id;
                                return (
                                    <button
                                        key={link.id}
                                        onClick={() => { setActiveTab(link.id as any); setSearchQuery(''); setSearchDate(''); }}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'flex-start',
                                            gap: '10px',
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '10px 16px',
                                            cursor: 'pointer',
                                            background: isActive ? 'rgba(var(--dash-accent-rgb,212,175,55),0.08)' : 'transparent',
                                            color: isActive ? 'var(--dash-accent)' : 'var(--dash-text-secondary)',
                                            boxSizing: 'border-box',
                                            margin: 0,
                                            border: 'none',
                                            borderRight: isActive ? '3px solid var(--dash-accent)' : '3px solid transparent',
                                        }}
                                        onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'var(--dash-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--dash-text-primary)'; } }}
                                        onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--dash-text-secondary)'; } }}
                                    >
                                        <Icon style={{ width: 16, height: 16, flexShrink: 0, display: 'block' }} />
                                        <span style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                        <header className="h-14 bg-[var(--dash-bg-secondary)] border-b border-[var(--dash-border)] flex items-center justify-between px-6 shrink-0 z-10">
                            <h2 className="text-sm font-semibold text-[var(--dash-text-primary)]">
                                {navigationLinks.find(l => l.id === activeTab)?.label}
                            </h2>
                            <div className="flex items-center gap-4">
                                {/* Notification Bell */}
                                <div className="relative" ref={bellRef}>
                                    <button
                                        onClick={() => { setBellOpen(b => !b); if (!bellOpen && unreadCount > 0) {} }}
                                        className="relative cursor-pointer p-2 rounded-lg text-[var(--dash-text-secondary)] hover:text-[var(--dash-text-primary)] hover:bg-[var(--dash-hover)] transition-colors"
                                    >
                                        <Bell className="w-5 h-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 w-4 h-4 bg-amber-400 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>
                                    {bellOpen && (
                                        <div className="absolute right-0 top-12 w-80 bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl shadow-2xl z-50 overflow-hidden">
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--dash-border)]">
                                                <span className="text-sm font-bold text-[var(--dash-text-primary)]">Notifications</span>
                                                {unreadCount > 0 && (
                                                    <button onClick={() => { if (user) { markAllNotificationsRead(user.id); loadNotifications(); } }} className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer">
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>
                                            <div className="max-h-72 overflow-y-auto divide-y divide-[var(--dash-border)]">
                                                {notifications.length === 0 ? (
                                                    <p className="text-center text-sm text-[var(--dash-text-muted)] py-6">No notifications</p>
                                                ) : notifications.slice(0, 15).map(n => (
                                                    <div
                                                        key={n.id}
                                                        onClick={() => { markNotificationRead(n.id); loadNotifications(); }}
                                                        className={`px-4 py-3 cursor-pointer hover:bg-[var(--dash-hover)] transition-colors ${!n.read ? 'bg-amber-400/5' : ''}`}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
                                                            <div className={!n.read ? '' : 'pl-4'}>
                                                                <p className="text-sm font-semibold text-[var(--dash-text-primary)] leading-snug">{n.title}</p>
                                                                <p className="text-xs text-[var(--dash-text-secondary)] mt-0.5 leading-snug">{n.message}</p>
                                                                <p className="text-[10px] text-[var(--dash-text-muted)] mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* User Avatar */}
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[var(--dash-accent)] flex items-center justify-center overflow-hidden shrink-0">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-black">{userInitials}</span>
                                        )}
                                    </div>
                                    <div className="hidden sm:block text-right">
                                        <p className="text-xs font-semibold text-[var(--dash-text-primary)] leading-none">{user?.full_name || user?.email}</p>
                                        <p className="text-[10px] text-[var(--dash-text-muted)] mt-0.5 capitalize">{role}</p>
                                    </div>
                                </div>

                                <button onClick={handleSignOut} className="cursor-pointer flex items-center gap-1.5 text-sm text-[var(--dash-text-secondary)] hover:text-[var(--dash-accent)] transition-colors">
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        </header>

                        <main className="flex-1 p-8 overflow-y-auto bg-[var(--dash-bg-primary)]">

                            {/* Overview Tab (Admin Grid Design) */}
                            {activeTab === 'overview' && (
                                <div>
                                    {/* ── Identity Card ── */}
                                    <div className="mb-6 bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-[var(--dash-text-muted)] uppercase tracking-widest mb-2">Your Reference IDs</p>
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <div>
                                                    <p className="text-[10px] text-[var(--dash-text-muted)] mb-0.5">Account ID</p>
                                                    <p className="font-mono text-sm text-[var(--dash-accent)] tracking-wide select-all">{user?.id || '—'}</p>
                                                </div>
                                                {profileData?.id && (
                                                    <div>
                                                        <p className="text-[10px] text-[var(--dash-text-muted)] mb-0.5">Profile ID</p>
                                                        <p className="font-mono text-sm text-[var(--dash-text-primary)] tracking-wide select-all">{profileData.id}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-[var(--dash-text-muted)] sm:text-right max-w-[200px]">
                                            Use your Profile ID as the reference when requesting studio access.
                                        </p>
                                    </div>

                                    {status !== "approved" && (
                                        <div className="mb-6 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg flex items-center gap-3">
                                            <AlertCircle className="w-5 h-5 text-yellow-400" />
                                            <div>
                                                <p className="text-sm font-semibold text-yellow-500">Profile Not Approved</p>
                                                <p className="text-xs text-yellow-400/80">Your profile is currently '{status}'. Limited actions available until approved.</p>
                                            </div>
                                        </div>
                                    )}

                                    {status === "approved" && items.length === 0 && (
                                        <div className="mb-6 p-5 bg-[var(--dash-accent)]/5 border border-[var(--dash-accent)]/20 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4">
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-[var(--dash-accent)] mb-1">Welcome — your profile is approved</p>
                                                <p className="text-xs text-[var(--dash-text-muted)]">You have no submissions yet. Start by submitting your first {config.term.toLowerCase()} — the team will review it and get back to you.</p>
                                            </div>
                                            {role !== 'producer' && role !== 'studio' && (
                                                <button
                                                    onClick={() => { setEditingItem(null); setDraftForm(config.draftDefaults); setActiveTab('submissions'); }}
                                                    className="cursor-pointer shrink-0 px-4 py-2 bg-[var(--dash-accent)] text-black font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity"
                                                >
                                                    Submit your first {config.term}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-12">
                                        {[
                                            { label: `Total ${config.termPlural}`, value: stats.total, meta: "All time records", icon: FileText, color: "text-orange-400" },
                                            { label: 'Approved', value: stats.published, meta: "Publicly visible", icon: CheckCircle, color: "text-green-400" },
                                            { label: 'Under Review', value: stats.pending, meta: "Awaiting approval", icon: Clock, color: "text-blue-400" },
                                            { label: 'Drafts', value: stats.draft, meta: "Unsubmitted", icon: LayoutDashboard, color: "text-neutral-400" },
                                            { label: 'Revision Request', value: stats.revision_requested, meta: "Awaiting revision", icon: AlertCircle, color: "text-yellow-400" },
                                            { label: 'Rejected', value: stats.rejected, meta: "Rejected", icon: XCircle, color: "text-red-400" },
                                        ].map(s => (
                                            <div key={s.label} className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6 hover:border-[var(--dash-accent)] transition-colors">
                                                <div className="flex justify-between items-start mb-4">
                                                    <p className="text-sm font-medium text-[var(--dash-text-secondary)]">{s.label}</p>
                                                    <s.icon className={`w-5 h-5 ${s.color}`} />
                                                </div>
                                                <div>
                                                    <p className="text-3xl font-bold text-[var(--dash-text-primary)]">{s.value}</p>
                                                    <p className="text-xs text-[var(--dash-text-muted)] mt-1">{s.meta}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <h2 className="text-lg font-bold text-[var(--dash-text-primary)] mb-6">Quick Actions</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {role === 'producer' ? (
                                            <>
                                                <div className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6">
                                                    <h3 className="font-semibold text-[var(--dash-text-primary)] mb-2">View Work Queue</h3>
                                                    <p className="text-sm text-[var(--dash-text-secondary)] mb-6">See all production assignments from the admin team.</p>
                                                    <button onClick={() => setActiveTab('work-queue')} className="cursor-pointer px-4 py-2 bg-[var(--dash-accent)] text-black font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity">
                                                        Open Work Queue
                                                    </button>
                                                </div>
                                                <div className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6">
                                                    <h3 className="font-semibold text-[var(--dash-text-primary)] mb-2">Royalties</h3>
                                                    <p className="text-sm text-[var(--dash-text-secondary)] mb-6">Track your royalty share and link your bank account.</p>
                                                    <button onClick={() => setActiveTab('royalties')} className="cursor-pointer px-4 py-2 border border-[var(--dash-accent)] text-[var(--dash-accent)] font-semibold rounded-lg text-sm hover:bg-[var(--dash-accent)]/10 transition-colors">
                                                        View Royalties
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6">
                                                    <h3 className="font-semibold text-[var(--dash-text-primary)] mb-2">Create New Submission</h3>
                                                    <p className="text-sm text-[var(--dash-text-secondary)] mb-6">Start a new draft for your next {config.term}.</p>
                                                    <button onClick={() => { setEditingItem(null); setDraftForm(config.draftDefaults); setActiveTab('submissions') }} className="cursor-pointer px-4 py-2 bg-[var(--dash-accent)] text-black font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity">
                                                        Submit New {config.term}
                                                    </button>
                                                </div>
                                                <div className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6">
                                                    <h3 className="font-semibold text-[var(--dash-text-primary)] mb-2">View Submissions</h3>
                                                    <p className="text-sm text-[var(--dash-text-secondary)] mb-6">Check the status of your existing items.</p>
                                                    <button onClick={() => setActiveTab('my-content')} className="cursor-pointer px-4 py-2 border border-[var(--dash-accent)] text-[var(--dash-accent)] font-semibold rounded-lg text-sm hover:bg-[var(--dash-accent)]/10 transition-colors">
                                                        Go to My Content
                                                    </button>
                                                </div>
                                                <div className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6">
                                                    <h3 className="font-semibold text-[var(--dash-text-primary)] mb-2">Royalties</h3>
                                                    <p className="text-sm text-[var(--dash-text-secondary)] mb-6">Track your royalty share and payment history.</p>
                                                    <button onClick={() => setActiveTab('royalties')} className="cursor-pointer px-4 py-2 border border-[var(--dash-accent)] text-[var(--dash-accent)] font-semibold rounded-lg text-sm hover:bg-[var(--dash-accent)]/10 transition-colors">
                                                        View Royalties
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Work Queue Tab — Producer only */}
                            {activeTab === 'work-queue' && role === 'producer' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-[var(--dash-text-primary)]">Work Queue</h2>
                                            <p className="text-xs text-[var(--dash-text-muted)] mt-1">Production assignments assigned to you by the admin team</p>
                                        </div>
                                        <button onClick={loadData} className="cursor-pointer text-xs text-[var(--dash-text-muted)] hover:text-[var(--dash-accent)] transition-colors">Refresh</button>
                                    </div>
                                    {assignments.length === 0 ? (
                                        <div className="text-center py-16 border border-dashed border-[var(--dash-border-hover)] rounded-xl">
                                            <FileText className="w-12 h-12 text-[var(--dash-text-muted)] mx-auto mb-4 opacity-30" />
                                            <p className="text-sm font-semibold text-[var(--dash-text-muted)]">No assignments yet</p>
                                            <p className="text-xs text-[var(--dash-text-muted)] mt-1">Production assignments will appear here once the admin assigns a track to you</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {assignments.map((a: any) => (
                                                <div key={a.id} className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6 hover:border-[var(--dash-accent)] transition-colors">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <h3 className="text-base font-bold text-[var(--dash-text-primary)] leading-tight flex-1 pr-3">{a.release_title || a.title || 'Untitled Track'}</h3>
                                                        <span className={`px-2.5 py-1 text-xs capitalize font-semibold rounded-full border border-current whitespace-nowrap ${getStatusColor(a.status || 'pending')}`}>
                                                            {(a.status || 'pending').replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5 text-xs mb-4">
                                                        {a.vocalist && (
                                                            <div className="flex"><span className="w-20 text-[var(--dash-text-muted)]">Vocalist:</span><span className="text-[var(--dash-text-secondary)]">{a.vocalist}</span></div>
                                                        )}
                                                        {a.writer && (
                                                            <div className="flex"><span className="w-20 text-[var(--dash-text-muted)]">Writer:</span><span className="text-[var(--dash-text-secondary)]">{a.writer}</span></div>
                                                        )}
                                                        {a.due_date && (
                                                            <div className="flex"><span className="w-20 text-[var(--dash-text-muted)]">Due:</span><span className="text-[var(--dash-text-secondary)]">{new Date(a.due_date).toLocaleDateString()}</span></div>
                                                        )}
                                                        {a.created_at && (
                                                            <div className="flex"><span className="w-20 text-[var(--dash-text-muted)]">Assigned:</span><span className="text-[var(--dash-text-secondary)]">{new Date(a.created_at).toLocaleDateString()}</span></div>
                                                        )}
                                                    </div>
                                                    {a.notes && (
                                                        <div className="mt-3 pt-3 border-t border-[var(--dash-border)]">
                                                            <p className="text-xs text-[var(--dash-text-muted)] mb-1">Admin notes:</p>
                                                            <p className="text-xs text-[var(--dash-text-secondary)]">{a.notes}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submissions form */}
                            {activeTab === 'submissions' && (
                                <div className="max-w-3xl bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6 lg:p-8 shadow-sm">
                                    {(status !== "approved" && profileData.languages?.length === 0) ? (
                                        <div className="text-center py-12">
                                            <Shield className="w-16 h-16 text-[var(--dash-border-hover)] mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold text-[var(--dash-text-primary)] mb-2">Profile Not Ready</h3>
                                            <p className="text-[var(--dash-text-secondary)]">Your profile must be approved before you can submit a {config.term}.</p>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleDraftSubmit} className="space-y-6">
                                            {/* Revision notes banner when addressing a revision request */}
                                            {editingItem?.revision_notes && (
                                                <div className="flex items-start gap-3 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-xl">
                                                    <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-1">Admin Revision Request</p>
                                                        <p className="text-sm text-[var(--dash-text-primary)] leading-relaxed">{editingItem.revision_notes}</p>
                                                    </div>
                                                </div>
                                            )}
                                            <h2 className="text-xl font-bold text-[var(--dash-text-primary)] mb-6">
                                                {editingItem ? (editingItem.revision_notes ? `Address Revision — ${config.term}` : `Edit ${config.term}`) : `Submit New ${config.term}`}
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {config.draftFields.filter(f => f.type === 'radio').map(field => (
                                                    <div key={field.name}>
                                                        <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] uppercase tracking-wider mb-3">{field.label}</label>
                                                        <div className="space-y-2 bg-[var(--dash-bg-primary)] p-4 rounded-lg border border-[var(--dash-border)]">
                                                            {(profileData[field.source!] || []).map((opt: string) => (
                                                                <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                                                                    <input
                                                                        type="radio"
                                                                        name={field.name}
                                                                        value={opt}
                                                                        checked={draftForm[field.name] === opt}
                                                                        onChange={handleDraftChange}
                                                                        className="w-4 h-4 text-[var(--dash-accent)] bg-transparent border-[var(--dash-border-hover)] focus:ring-[var(--dash-accent)] focus:ring-offset-0"
                                                                        required
                                                                    />
                                                                    <span className="text-sm text-[var(--dash-text-primary)] capitalize group-hover:text-[var(--dash-accent)] transition-colors">{opt}</span>
                                                                </label>
                                                            ))}
                                                            {(profileData[field.source!] || []).length === 0 && (
                                                                <span className="text-sm text-[var(--dash-text-muted)] italic">No options available</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {config.draftFields.filter(f => f.type !== 'radio').map(field => (
                                                <div key={field.name}>
                                                    <label className="block text-sm font-semibold text-[var(--dash-text-primary)] mb-2">
                                                        {field.label} <span className="text-red-500">*</span>
                                                    </label>
                                                    {field.type === 'editor' ? (
                                                        <div className="bg-[var(--dash-bg-primary)] border border-[var(--dash-border)] rounded-lg text-[var(--dash-text-primary)]" style={{ color: 'white' }}>
                                                            <EditorProvider>
                                                                <Editor
                                                                    name={field.name}
                                                                    value={draftForm[field.name]}
                                                                    onChange={handleDraftChange}
                                                                    style={{ minHeight: "300px", maxHeight: "600px", overflowY: "auto", background: 'transparent' }}
                                                                />
                                                            </EditorProvider>
                                                        </div>
                                                    ) : field.type === 'textarea' ? (
                                                        <textarea
                                                            name={field.name}
                                                            required
                                                            rows={5}
                                                            value={draftForm[field.name]}
                                                            onChange={handleDraftChange}
                                                            placeholder={field.placeholder}
                                                            className="w-full px-4 py-3 bg-[var(--dash-bg-primary)] border border-[var(--dash-border)] rounded-lg text-[var(--dash-text-primary)] focus:border-[var(--dash-accent)] focus:ring-1 focus:ring-[var(--dash-accent)] transition-colors outline-none resize-y"
                                                        />
                                                    ) : (
                                                        <input
                                                            type={field.type}
                                                            name={field.name}
                                                            required
                                                            value={draftForm[field.name]}
                                                            onChange={handleDraftChange}
                                                            placeholder={field.placeholder}
                                                            className="w-full px-4 py-3 bg-[var(--dash-bg-primary)] border border-[var(--dash-border)] rounded-lg text-[var(--dash-text-primary)] focus:border-[var(--dash-accent)] focus:ring-1 focus:ring-[var(--dash-accent)] transition-colors outline-none"
                                                        />
                                                    )}
                                                </div>
                                            ))}

                                            <div className="flex justify-end pt-4 border-t border-[var(--dash-border)]">
                                                <div className="flex w-full justify-end">
                                                    <button type="submit" className='w-full sm:w-auto cursor-pointer flex items-center justify-center bg-linear-to-r from-[#D4AF37] to-[#aa8829] text-[#1a2332] px-8 py-3 rounded-md font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-4' disabled={submitLoading}>
                                                        {submitLoading ? <Loader className='animate-spin' /> : "Save & Submit"}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* My Content & Published (Archives) */}
                            {(activeTab === 'my-content' || activeTab === 'published') && (
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
                                            <input
                                                type="text"
                                                placeholder={`Search ${config.termPlural}...`}
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="w-full has-icon pr-4 py-2.5 bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-lg text-[var(--dash-text-primary)] text-sm focus:border-[var(--dash-accent)] outline-none transition-colors"
                                            />
                                        </div>
                                        <input
                                            type="date"
                                            value={searchDate}
                                            onChange={e => setSearchDate(e.target.value)}
                                            className="px-4 py-2.5 bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-lg text-[var(--dash-text-primary)] text-sm focus:border-[var(--dash-accent)] outline-none transition-colors dark:color-scheme-dark"
                                        />
                                        <select
                                            value={statusFilter}
                                            onChange={e => setStatusFilter(e.target.value)}
                                            className="px-4 py-2.5 bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-lg text-[var(--dash-text-primary)] text-sm focus:border-[var(--dash-accent)] outline-none transition-colors cursor-pointer"
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="draft">Drafts</option>
                                            <option value="under review">Under Review</option>
                                            <option value="revision requested">Revision Requested</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {activeItems.length > 0 ? activeItems.map(item => {
                                            const isRevision = item.status === 'revision requested' || item.status === 'revision_requested';
                                            return (
                                            <div key={item.id} className={`bg-[var(--dash-bg-secondary)] border rounded-xl p-6 flex flex-col transition-all hover:border-[var(--dash-accent)] ${
                                                isRevision ? 'border-yellow-400/50' : 'border-[var(--dash-border)]'
                                            }`}>
                                                {isRevision && (
                                                    <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                                                        <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />
                                                        <p className="text-xs font-semibold text-yellow-400">Revision requested by admin</p>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-lg font-bold text-[var(--dash-text-primary)] line-clamp-2 leading-tight flex-1 pr-4">{item.title}</h3>
                                                    <span className={`px-2.5 py-1 text-xs capitalize font-semibold rounded-full border border-current whitespace-nowrap ${getStatusColor(item.status)}`}>
                                                        {item.status.replace("_", " ")}
                                                    </span>
                                                </div>
                                                <div className="space-y-1.5 mb-6 text-sm flex-1">
                                                    {Object.entries({
                                                        Language: item.language,
                                                        Style: item.writing_style || item.performance_style
                                                    }).map(([k, v]) => (
                                                        <div key={k} className="flex">
                                                            <span className="w-24 text-[var(--dash-text-muted)]">{k}:</span>
                                                            <span className="text-[var(--dash-text-secondary)] capitalize">{v || '-'}</span>
                                                        </div>
                                                    ))}
                                                    {isRevision && item.revision_notes && (
                                                        <div className="mt-3 pt-3 border-t border-[var(--dash-border)]">
                                                            <p className="text-xs text-yellow-400 font-semibold mb-1">Admin note:</p>
                                                            <p className="text-xs text-[var(--dash-text-secondary)] line-clamp-2">{item.revision_notes}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-3 pt-4 border-t border-[var(--dash-border)] mt-auto">
                                                    <button onClick={() => { setSelectedItem(item); setContentModal(true); }} className="cursor-pointer flex-1 py-2 bg-blue-500/10 text-blue-400 font-semibold text-sm rounded-lg hover:bg-blue-500/20 transition-colors">
                                                        View
                                                    </button>
                                                    {activeTab === 'my-content' && (item.status === 'draft' || isRevision) && (
                                                        <button
                                                            onClick={() => handleEditItem(item)}
                                                            className={`cursor-pointer flex-1 py-2 font-semibold text-sm rounded-lg transition-colors ${
                                                                isRevision
                                                                    ? 'bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30'
                                                                    : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                                                            }`}
                                                        >
                                                            {isRevision ? 'Address Revision' : 'Edit'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            );
                                        }) : (
                                            <div className="col-span-full border border-dashed border-[var(--dash-border-hover)] rounded-xl py-12 flex flex-col items-center justify-center text-[var(--dash-text-muted)]">
                                                <FileText className="w-12 h-12 mb-3 opacity-20" />
                                                <p>No results found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Royalties Tab */}
                            {activeTab === 'royalties' && (
                                <div className="space-y-6">

                                    {/* Bank Account Section */}
                                    {!bankInfo && !bankFormOpen && (
                                        <div className="bg-[var(--dash-bg-secondary)] border border-red-400/30 rounded-xl p-5 flex items-start gap-4">
                                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-red-400 mb-1">No Bank Account Linked</p>
                                                <p className="text-xs text-[var(--dash-text-secondary)] leading-relaxed mb-3">
                                                    You must link a bank account before any royalty payout can be processed. Payments will remain on hold until verified banking details are on file.
                                                </p>
                                                <button
                                                    onClick={() => setBankFormOpen(true)}
                                                    className="cursor-pointer px-4 py-2 bg-[var(--dash-accent)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
                                                >
                                                    + Link Bank Account
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {bankInfo && !bankFormOpen && (
                                        <div className="bg-[var(--dash-bg-secondary)] border border-green-400/30 rounded-xl p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-green-400/10 rounded-lg flex items-center justify-center">
                                                        <DollarSign className="w-4 h-4 text-green-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[var(--dash-text-primary)]">Bank Account Linked</p>
                                                        <p className="text-xs text-green-400 font-semibold">Pending admin verification</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setBankFormOpen(true)}
                                                    className="cursor-pointer text-xs text-[var(--dash-text-muted)] hover:text-[var(--dash-accent)] transition-colors"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                                {[
                                                    { label: 'Account Holder', value: bankInfo.holder_name },
                                                    { label: 'Bank Name', value: bankInfo.bank_name },
                                                    { label: 'Account Type', value: bankInfo.account_type },
                                                    { label: 'Account No.', value: bankInfo.account_number ? `••••${bankInfo.account_number.slice(-4)}` : '—' },
                                                    { label: 'IBAN / Routing', value: bankInfo.iban_routing ? `••••${bankInfo.iban_routing.slice(-6)}` : '—' },
                                                    { label: 'Country', value: bankInfo.country || '—' },
                                                ].map(f => (
                                                    <div key={f.label} className="p-3 bg-[var(--dash-bg-primary)] rounded-lg border border-[var(--dash-border)]">
                                                        <p className="text-[var(--dash-text-muted)] mb-1">{f.label}</p>
                                                        <p className="font-semibold text-[var(--dash-text-primary)] capitalize">{f.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {bankFormOpen && (
                                        <div className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6">
                                            <div className="flex items-center justify-between mb-5">
                                                <h3 className="text-sm font-bold text-[var(--dash-text-primary)] uppercase tracking-wider">
                                                    {bankInfo ? 'Update Bank Account' : 'Link Bank Account'}
                                                </h3>
                                                <button onClick={() => setBankFormOpen(false)} className="cursor-pointer text-[var(--dash-text-muted)] hover:text-white transition-colors text-xs">Cancel</button>
                                            </div>
                                            <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-3 mb-5 text-xs text-amber-300 leading-relaxed">
                                                <strong>Security note:</strong> Banking details are stored locally and submitted to SufiPulse administration for manual verification before any payout. Never share your account credentials.
                                            </div>
                                            <form onSubmit={handleBankSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {[
                                                    { key: 'holder_name', label: 'Account Holder Name', placeholder: 'Full legal name on account', required: true },
                                                    { key: 'bank_name', label: 'Bank Name', placeholder: 'e.g. JPMorgan Chase, Bank of America', required: true },
                                                    { key: 'account_number', label: 'Account Number', placeholder: 'Your account number', required: true },
                                                    { key: 'iban_routing', label: 'IBAN / Routing Number', placeholder: 'IBAN (international) or routing number', required: false },
                                                    { key: 'swift_bic', label: 'SWIFT / BIC Code', placeholder: 'e.g. CHASUS33', required: false },
                                                    { key: 'country', label: 'Country', placeholder: 'e.g. United States, United Kingdom', required: true },
                                                ].map(f => (
                                                    <div key={f.key}>
                                                        <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] mb-1.5">
                                                            {f.label} {f.required && <span className="text-red-400">*</span>}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required={f.required}
                                                            placeholder={f.placeholder}
                                                            value={(bankForm as any)[f.key]}
                                                            onChange={ev => setBankForm(prev => ({ ...prev, [f.key]: ev.target.value }))}
                                                            className="w-full px-3 py-2.5 bg-[var(--dash-bg-primary)] border border-[var(--dash-border)] rounded-lg text-sm text-[var(--dash-text-primary)] placeholder:text-[var(--dash-text-muted)] focus:outline-none focus:border-[var(--dash-accent)] transition-colors"
                                                        />
                                                    </div>
                                                ))}
                                                <div>
                                                    <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] mb-1.5">Account Type</label>
                                                    <select
                                                        value={bankForm.account_type}
                                                        onChange={ev => setBankForm(prev => ({ ...prev, account_type: ev.target.value }))}
                                                        className="w-full px-3 py-2.5 bg-[var(--dash-bg-primary)] border border-[var(--dash-border)] rounded-lg text-sm text-[var(--dash-text-primary)] focus:outline-none focus:border-[var(--dash-accent)] transition-colors"
                                                    >
                                                        <option value="savings">Savings</option>
                                                        <option value="current">Current / Checking</option>
                                                        <option value="business">Business</option>
                                                    </select>
                                                </div>
                                                <div className="sm:col-span-2 flex gap-3 pt-2">
                                                    <button
                                                        type="submit"
                                                        className="cursor-pointer flex-1 py-3 bg-[var(--dash-accent)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                                                    >
                                                        {bankInfo ? 'Update Account' : 'Save & Submit for Verification'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setBankFormOpen(false)}
                                                        className="cursor-pointer px-6 py-3 border border-[var(--dash-border)] text-[var(--dash-text-secondary)] font-bold rounded-xl hover:border-[var(--dash-accent)] transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {/* Threshold & Status Banner */}
                                    <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-5 flex items-start gap-4">
                                        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-amber-400 mb-1">Royalty Activation Threshold</p>
                                            <p className="text-xs text-[var(--dash-text-secondary)] leading-relaxed">
                                                Royalties become payable once a release earns <strong className="text-[var(--dash-text-primary)]">USD 500</strong> in verified platform revenue.
                                                Below this threshold, earnings accumulate in the Diwan-e-Amanat reserve pool and are disbursed in the next eligible cycle.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Split Model */}
                                    <div className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6">
                                        <h3 className="text-sm font-bold text-[var(--dash-text-primary)] uppercase tracking-wider mb-5 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-[var(--dash-accent)]" /> Revenue Distribution Model
                                        </h3>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'SufiPulse Institution', desc: 'Platform operations & governance', pct: 30, color: '#6366f1', highlight: false },
                                                { label: 'Writer — Ahl-e-Qalam', desc: 'Kalam / literary composition', pct: 20, color: '#f59e0b', highlight: role === 'writer' || role === 'literary' },
                                                { label: 'Vocalist — Ahl-e-Sada', desc: 'Performance & voice', pct: 20, color: '#10b981', highlight: role === 'vocalist' },
                                                { label: 'Producer — Ahl-e-Naghma', desc: 'Music production & arrangement', pct: 15, color: '#8b5cf6', highlight: role === 'producer' },
                                                { label: 'Distributor / Publisher', desc: 'Platform distribution & licensing', pct: 10, color: '#06b6d4', highlight: false },
                                                { label: 'Studio Engineer', desc: 'Recording & mixing', pct: 5, color: '#f43f5e', highlight: false },
                                            ].map(row => (
                                                <div key={row.label} className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${row.highlight ? 'bg-amber-400/10 border border-amber-400/30' : 'hover:bg-[var(--dash-hover)]'}`}>
                                                    <div className="w-10 text-right shrink-0">
                                                        <span className={`text-sm font-bold ${row.highlight ? 'text-amber-400' : 'text-[var(--dash-text-primary)]'}`}>{row.pct}%</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-sm font-semibold ${row.highlight ? 'text-amber-400' : 'text-[var(--dash-text-primary)]'}`}>{row.label}</span>
                                                            {row.highlight && <span className="text-[10px] bg-amber-400 text-black font-bold px-1.5 py-0.5 rounded-full">YOU</span>}
                                                        </div>
                                                        <p className="text-xs text-[var(--dash-text-muted)]">{row.desc}</p>
                                                    </div>
                                                    <div className="w-28 shrink-0">
                                                        <div className="h-1.5 rounded-full bg-[var(--dash-border)]">
                                                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${row.pct * 3.33}%`, backgroundColor: row.color }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-[var(--dash-text-muted)] mt-4 pt-4 border-t border-[var(--dash-border)]">
                                            Percentages apply to net platform revenue after applicable taxes and processing fees. Splits are fixed per the SufiPulse Royalty Policy and documented prior to each release.
                                        </p>
                                    </div>

                                    {/* Earnings Simulator */}
                                    <div className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6">
                                        <h3 className="text-sm font-bold text-[var(--dash-text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-[var(--dash-accent)]" /> Earnings Estimator
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {[
                                                { streams: '10K', revenue: 20, share: role === 'writer' ? 4 : 4 },
                                                { streams: '50K', revenue: 100, share: role === 'writer' ? 20 : 20 },
                                                { streams: '250K', revenue: 500, share: role === 'writer' ? 100 : 100 },
                                                { streams: '1M+', revenue: 2000, share: role === 'writer' ? 400 : 400 },
                                            ].map(est => {
                                                const yourPct = role === 'writer' || role === 'vocalist' ? 20 : role === 'producer' ? 15 : 10;
                                                const yourEarning = (est.revenue * yourPct / 100).toFixed(0);
                                                const unlocked = est.revenue >= 500;
                                                return (
                                                    <div key={est.streams} className={`p-4 rounded-xl border text-center transition-colors ${unlocked ? 'border-amber-400/30 bg-amber-400/5' : 'border-[var(--dash-border)]'}`}>
                                                        <p className="text-xs text-[var(--dash-text-muted)] mb-1">{est.streams} streams</p>
                                                        <p className="text-lg font-bold text-[var(--dash-text-primary)]">${yourEarning}</p>
                                                        <p className="text-[10px] text-[var(--dash-text-muted)] mt-0.5">your share</p>
                                                        {unlocked
                                                            ? <span className="text-[10px] text-amber-400 font-semibold mt-1 block">✓ Threshold met</span>
                                                            : <span className="text-[10px] text-[var(--dash-text-muted)] mt-1 block">In reserve pool</span>
                                                        }
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-xs text-[var(--dash-text-muted)] mt-3">Estimates based on ~$0.002/stream (streaming average). Actual rates vary by platform and region.</p>
                                    </div>

                                    {/* Personal Royalty Records */}
                                    <div className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-sm font-bold text-[var(--dash-text-primary)] uppercase tracking-wider">My Royalty Payments</h3>
                                            <button onClick={loadRoyalties} className="text-xs text-[var(--dash-text-muted)] hover:text-[var(--dash-accent)] transition-colors cursor-pointer">Refresh</button>
                                        </div>
                                        {royalties.length === 0 ? (
                                            <div className="text-center py-10 border border-dashed border-[var(--dash-border-hover)] rounded-xl">
                                                <DollarSign className="w-10 h-10 text-[var(--dash-text-muted)] mx-auto mb-3 opacity-30" />
                                                <p className="text-sm text-[var(--dash-text-muted)]">No royalty records yet</p>
                                                <p className="text-xs text-[var(--dash-text-muted)] mt-1">Payments appear here once a release crosses the earnings threshold</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {royalties.map((r: any) => (
                                                    <div key={r.id} className="flex items-center justify-between p-4 bg-[var(--dash-bg-primary)] border border-[var(--dash-border)] rounded-xl">
                                                        <div>
                                                            <p className="text-sm font-semibold text-[var(--dash-text-primary)]">{r.release_title || 'Release'}</p>
                                                            <p className="text-xs text-[var(--dash-text-muted)] mt-0.5">{r.due_date ? new Date(r.due_date).toLocaleDateString() : 'Pending date'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-base font-bold text-[var(--dash-accent)]">{r.currency || 'USD'} {Number(r.amount_due || 0).toLocaleString()}</p>
                                                            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                                                                r.payout_status === 'paid' ? 'bg-green-400/10 text-green-400' :
                                                                r.payout_status === 'approved' ? 'bg-blue-400/10 text-blue-400' :
                                                                r.payout_status === 'on_hold' ? 'bg-orange-400/10 text-orange-400' :
                                                                'bg-neutral-400/10 text-neutral-400'
                                                            }`}>{r.payout_status || 'pending'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between pt-3 border-t border-[var(--dash-border)] text-sm">
                                                    <span className="text-[var(--dash-text-secondary)]">Total earned</span>
                                                    <span className="font-bold text-[var(--dash-text-primary)]">
                                                        USD {royalties.reduce((s: number, r: any) => s + Number(r.amount_due || 0), 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Studio Sessions Tab */}
                            {activeTab === 'sessions' && (
                                <div className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <h2 className="text-base font-semibold text-[var(--dash-text-primary)]">Session Requests</h2>
                                        <Link
                                            href="/studio-sessions"
                                            className="px-4 py-2 text-xs bg-[var(--dash-accent)] text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                                        >
                                            Submit a Request
                                        </Link>
                                    </div>
                                    {sessionRequests.length === 0 ? (
                                        <div className="text-center py-10 space-y-3">
                                            <CalendarClock size={32} className="mx-auto text-[var(--dash-text-muted)] opacity-20" />
                                            <p className="text-sm text-[var(--dash-text-muted)]">No session requests found.</p>
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-[var(--dash-border)]">
                                            {[...sessionRequests].reverse().map((req) => (
                                                <li key={req.id} className="py-4 space-y-1">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-[var(--dash-text-primary)]">
                                                                {req.session_type || 'Session Request'}
                                                            </p>
                                                            <p className="text-xs text-[var(--dash-text-muted)] mt-0.5">
                                                                Ref: {req.approval_reference_code || '—'}
                                                                {req.preferred_date_start ? ` · ${req.preferred_date_start}` : ''}
                                                            </p>
                                                        </div>
                                                        <span className={`shrink-0 px-2.5 py-1 rounded border text-xs font-medium ${getStatusColor(req.status)}`}>
                                                            {req.status.replace("_", " ")}
                                                        </span>
                                                    </div>
                                                    {req.additional_notes && (
                                                        <p className="text-xs text-[var(--dash-text-secondary)] italic">{req.additional_notes}</p>
                                                    )}
                                                    <p className="text-[11px] text-[var(--dash-text-muted)] mt-1">
                                                        Submitted {req.created_at ? new Date(req.created_at).toLocaleDateString() : ''}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            {/* Settings Tab */}
                            {activeTab === 'settings' && (
                                <div className="max-w-4xl space-y-8">
                                    {/* Profile Settings */}
                                    <div className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6 lg:p-8">
                                        <h3 className="text-xl font-bold text-[var(--dash-text-primary)] mb-6 flex items-center gap-2">
                                            <User className="w-5 h-5 text-[var(--dash-accent)]" /> Profile Settings
                                        </h3>
                                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                                            <div className="flex flex-col sm:flex-row gap-8 items-start">
                                                {/* Avatar Column */}
                                                <div className="flex flex-col items-center gap-3 shrink-0">
                                                    <div className="relative w-28 h-28 rounded-full bg-[var(--dash-bg-primary)] border-2 border-dashed border-[var(--dash-border-hover)] flex flex-col justify-center items-center overflow-hidden group">
                                                        {profileForm.avatar ? (
                                                            <img src={URL.createObjectURL(profileForm.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-12 h-12 text-[var(--dash-text-muted)] group-hover:text-[var(--dash-accent)] transition-colors" />
                                                        )}
                                                        <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center transition-all cursor-pointer">
                                                            <span className="text-xs text-white font-medium tracking-wide">Change</span>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                            onChange={e => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    setProfileForm({ ...profileForm, avatar: e.target.files[0] });
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium text-[var(--dash-text-muted)] uppercase tracking-wider">Profile Picture</span>
                                                </div>

                                                {/* Form Column */}
                                                <div className="flex-1 space-y-5 w-full">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-[var(--dash-text-primary)] mb-2">Display Name</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={profileForm.name}
                                                            onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                                            className="w-full px-4 py-3 bg-[var(--dash-bg-primary)] border border-[var(--dash-border)] rounded-lg text-[var(--dash-text-primary)] focus:border-[var(--dash-accent)] focus:ring-1 focus:ring-[var(--dash-accent)] outline-none transition-all"
                                                            placeholder="Enter your name"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end pt-2">
                                                        <button
                                                            type="submit"
                                                            disabled={profileLoading}
                                                            className="cursor-pointer flex items-center justify-center bg-linear-to-r from-[#D4AF37] to-[#aa8829] text-[#1a2332] px-8 py-3 rounded-md font-bold hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                                        >
                                                            {profileLoading ? <Loader className='w-4 h-4 animate-spin' /> : "Save Changes"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Security Settings (Password) */}
                                    <div className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6 lg:p-8">
                                        <h3 className="text-xl font-bold text-[var(--dash-text-primary)] mb-6 flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-[var(--dash-accent)]" /> Security Preferences
                                        </h3>
                                        <form onSubmit={handlePasswordUpdate} className="space-y-5 max-w-md">
                                            <div>
                                                <label className="block text-sm font-semibold text-[var(--dash-text-primary)] mb-2">Current Password</label>
                                                <input type="password" required value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="w-full px-4 py-3 bg-[var(--dash-bg-primary)] border border-[var(--dash-border)] rounded-lg text-[var(--dash-text-primary)] focus:border-[var(--dash-accent)] focus:ring-1 focus:ring-[var(--dash-accent)] outline-none transition-all" placeholder="••••••••" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-[var(--dash-text-primary)] mb-2">New Password</label>
                                                <input type="password" required value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full px-4 py-3 bg-[var(--dash-bg-primary)] border border-[var(--dash-border)] rounded-lg text-[var(--dash-text-primary)] focus:border-[var(--dash-accent)] focus:ring-1 focus:ring-[var(--dash-accent)] outline-none transition-all" placeholder="••••••••" />
                                            </div>
                                            <button type="submit" disabled={passwordLoading} className="w-full cursor-pointer flex items-center justify-center bg-transparent border border-[var(--dash-border-hover)] text-[var(--dash-text-primary)] py-3 rounded-md font-bold hover:border-[var(--dash-accent)] hover:text-[var(--dash-accent)] mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                                                {passwordLoading ? <Loader className='w-4 h-4 animate-spin' /> : "Update Password"}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>

                            {/* View Modal */}
            {contentModal && selectedItem && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                            <div className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                                <div className="flex items-center justify-between p-6 border-b border-[var(--dash-border)]">
                                    <div>
                                        <h2 className="text-xl font-bold text-[var(--dash-text-primary)]">
                                            {selectedItem.status === 'revision requested' || selectedItem.status === 'revision_requested' ? 'Revision Request' : 'Item Review'}
                                        </h2>
                                        <span className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full border border-current ${getStatusColor(selectedItem.status)}`}>{selectedItem.status.replace('_', ' ')}</span>
                                    </div>
                                    <button onClick={() => { setContentModal(false); setSelectedItem(null); }} className="cursor-pointer text-[var(--dash-text-muted)] hover:text-white transition-colors">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                                    {selectedItem.revision_notes && (
                                        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertCircle className="w-4 h-4 text-yellow-400" />
                                                <label className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Admin Revision Notes</label>
                                            </div>
                                            <p className="text-[var(--dash-text-primary)] text-sm leading-relaxed">{selectedItem.revision_notes}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--dash-text-secondary)] uppercase tracking-widest mb-2">Title</label>
                                        <div className="bg-[var(--dash-bg-primary)] rounded-xl p-5 border border-[var(--dash-border)]">
                                            <p className="text-[var(--dash-text-primary)] font-arabic text-lg">{selectedItem.title}</p>
                                        </div>
                                    </div>
                                    {selectedItem.content ? (
                                        <div>
                                            <label className="block text-xs font-bold text-[var(--dash-text-secondary)] uppercase tracking-widest mb-2">Content</label>
                                            <div className="bg-[var(--dash-bg-primary)] rounded-xl p-5 border border-[var(--dash-border)] prose prose-invert max-w-none">
                                                <div dangerouslySetInnerHTML={{ __html: selectedItem.content }} />
                                            </div>
                                        </div>
                                    ) : selectedItem.link ? (
                                        <div>
                                            <label className="block text-xs font-bold text-[var(--dash-text-secondary)] uppercase tracking-widest mb-2">Link</label>
                                            <div className="bg-[var(--dash-bg-primary)] rounded-xl p-5 border border-[var(--dash-border)]">
                                                <a href={selectedItem.link} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all">{selectedItem.link}</a>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="p-6 border-t border-[var(--dash-border)] flex gap-4 bg-[var(--dash-bg-primary)] rounded-b-2xl">
                                    {(selectedItem.status === 'revision requested' || selectedItem.status === 'revision_requested') ? (
                                        <>
                                            <button
                                                onClick={() => handleEditItem(selectedItem)}
                                                className="cursor-pointer flex-1 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition-colors flex justify-center items-center gap-2"
                                            >
                                                <CheckCircle className="w-5 h-5" /> Address Revision
                                            </button>
                                            <button
                                                onClick={() => { setContentModal(false); setSelectedItem(null); }}
                                                className="cursor-pointer px-6 py-3 border border-[var(--dash-border)] text-[var(--dash-text-secondary)] font-bold rounded-xl hover:border-[var(--dash-accent)] transition-colors"
                                            >
                                                Close
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                disabled={selectedItem.status !== "draft"}
                                                onClick={() => handleUpdateStatus(selectedItem, 'under review')}
                                                className="cursor-pointer flex-1 py-3 bg-[var(--dash-status-approved)] text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex justify-center items-center gap-2"
                                            >
                                                {selectedItem.status === "draft" && <CheckCircle className="w-5 h-5" />}
                                                {selectedItem.status === "draft" ? "Submit for Review" : "Already Submitted"}
                                            </button>
                                            <button
                                                disabled={selectedItem.status !== "draft"}
                                                onClick={() => handleDeleteItem(selectedItem.id)}
                                                className="cursor-pointer flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                                            >
                                                <XCircle className="w-5 h-5" /> Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
        </div>
    );
}
