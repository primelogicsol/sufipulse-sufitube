"use client";
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from '@/app/lib/notifications';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, FileText, Settings, CircleCheck as CheckCircle, Search, Circle as XCircle, Eye, CircleAlert as AlertCircle, Clock, CirclePlus as PlusCircle, Shield, LogOut, Loader, User, Bell, DollarSign, TrendingUp, Info, CalendarClock, CreditCard, ArrowRight } from 'lucide-react';
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
    const [submitSuccess, setSubmitSuccess] = useState<{ type: 'new' | 'revision'; term: string } | null>(null);

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
    const [profileSaveStatus, setProfileSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
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
    const [bankMessage, setBankMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

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

    const itemApiMap: Record<string, string> = {
        kalam: '/api/kalams',
        sada: '/api/sadas',
        article: '/api/articles',
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
                id: (profile as any)?.id || '',
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
                const itemApi = itemApiMap[config.typeKey];
                if (itemApi) {
                    const res = await fetch(itemApi);
                    const data = res.ok ? await res.json() : [];
                    setItems(Array.isArray(data) ? data : []);
                }
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
        setPasswordMessage(null);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
            });
            const data = await res.json();
            if (!res.ok) {
                setPasswordMessage({ type: 'error', text: data.error || 'Failed to update password.' });
            } else {
                setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
                setPasswordForm({ currentPassword: '', newPassword: '' });
            }
        } catch {
            setPasswordMessage({ type: 'error', text: 'Failed to update password. Please try again.' });
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileSaveStatus('saving');
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
        try {
            if (profileForm.name && profileForm.name !== (user?.full_name || '')) {
                await fetch('/api/user/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ full_name: profileForm.name }),
                });
            }
            setProfileSaveStatus('saved');
            setTimeout(() => setProfileSaveStatus('idle'), 1500);
        } catch {
            setProfileSaveStatus('error');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleDraftChange = (e: any) => {
        setDraftForm({ ...draftForm, [e.target.name]: e.target.value });
    };

    const handleDraftSubmit = async (e: any) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            if (editingItem) {
                const itemApi = itemApiMap[config.typeKey];
                const res = await fetch(`${itemApi}/${editingItem.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...draftForm }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error((err as any).error || 'Failed to resubmit');
                }
                setSubmitSuccess({ type: 'revision', term: config.term });
                setTimeout(() => setSubmitSuccess(null), 6000);
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
                const itemApi = itemApiMap[config.typeKey];
                const res = await fetch(itemApi, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...draftForm, ...authorMeta, email: user?.email }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error((err as any).error || 'Failed to submit');
                }
                setSubmitSuccess({ type: 'new', term: config.term });
                setTimeout(() => setSubmitSuccess(null), 6000);
                setDraftForm(config.draftDefaults);
            }
            setActiveTab("my-content");
            loadData();  // reloads and re-prefills form
        } catch (err: any) {
            setActionError(err?.message || "Error submitting. Please try again.");
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
            const itemApi = itemApiMap[config.typeKey];
            const res = await fetch(`${itemApi}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setContentModal(false);
            loadData();
        } catch {
            setActionError("Error deleting item. Please try again.");
        }
    };

    const handleUpdateStatus = async (item: any, newStatus: string) => {
        try {
            const itemApi = itemApiMap[config.typeKey];
            const res = await fetch(`${itemApi}/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error('Failed to update status');
            setContentModal(false);
            loadData();
        } catch {
            setActionError("Error updating status. Please try again.");
        }
    };

    const getStatusColor = (statusText: string) => {
        const s = statusText?.toLowerCase();
        if (s === 'approved' || s === 'published') return 'text-green-400 bg-green-400/10';
        if (s === 'rejected' || s === 'declined') return 'text-red-400 bg-red-400/10';
        if (s === 'under review' || s === 'under_review' || s === 'submitted') return 'text-blue-400 bg-blue-400/10';
        if (s === 'revision_requested' || s === 'revision requested') return 'text-yellow-400 bg-yellow-400/10';
        return 'text-neutral-400 bg-neutral-400/10';
    };

    const getStatusLabel = (statusText: string) => {
        const s = statusText?.toLowerCase();
        if (s === 'submitted' || s === 'under_review' || s === 'under review') return 'Under Review';
        return statusText.replace(/_/g, ' ');
    };

    const stats = {
        total: items.length,
        published: items.filter(i => i.status === 'published' || i.status === 'approved').length,
        pending: items.filter(i => i.status === 'submitted' || i.status === 'under_review' || i.status === 'under review').length,
        draft: items.filter(i => i.status === 'draft').length,
        revision_requested: items.filter(i => i.status === 'revision_requested' || i.status === 'revision requested').length,
        rejected: items.filter(i => i.status === 'rejected').length,
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

                            {actionError && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-lg flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                        <p className="text-sm font-medium text-red-400">{actionError}</p>
                                    </div>
                                    <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400 transition shrink-0 text-lg leading-none">×</button>
                                </div>
                            )}

                            {submitSuccess && (
                                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/25 rounded-lg flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-green-400">
                                                {submitSuccess.type === 'revision' ? `${submitSuccess.term} revision received` : `${submitSuccess.term} submitted`}
                                            </p>
                                            <p className="text-xs text-green-400/70">
                                                {submitSuccess.type === 'revision'
                                                    ? 'Your revision has been received and is under review. You will be notified when a decision is made.'
                                                    : 'Your submission is under review. You will be notified by email when a decision is made.'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSubmitSuccess(null)} className="text-green-400/50 hover:text-green-400 transition shrink-0 text-lg leading-none">×</button>
                                </div>
                            )}

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
                                            <option value="submitted">Pending Review</option>
                                            <option value="under_review">Under Review</option>
                                            <option value="revision_requested">Revision Requested</option>
                                            <option value="approved">Approved</option>
                                            <option value="published">Published</option>
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
                                                <div className="flex justify-between items-center mb-2">
                                                    <h3 className="text-lg font-bold text-[var(--dash-text-primary)] line-clamp-2 leading-tight flex-1 pr-4">{item.title}</h3>
                                                    <span className={`px-2.5 py-1 text-xs capitalize font-semibold rounded-full border border-current whitespace-nowrap ${getStatusColor(item.status)}`}>
                                                        {getStatusLabel(item.status)}
                                                    </span>
                                                </div>
                                                {(item.status === 'submitted' || item.status === 'under_review' || item.status === 'under review') && (
                                                    <p className="text-xs text-blue-400/80 mb-3">
                                                        Your submission is under review. You'll be notified once it's approved or if revisions are needed.
                                                    </p>
                                                )}
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
                                <div className="space-y-8">
                                    {/* Link to centralized payout configuration */}
                                    <div className="bg-amber-400/5 border border-amber-400/10 rounded-2xl p-10 flex flex-col items-center text-center gap-6 shadow-2xl">
                                        <div className="w-20 h-20 bg-amber-400/10 rounded-full flex items-center justify-center">
                                            <DollarSign className="w-10 h-10 text-amber-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-2">Institutional Royalties Hub</h3>
                                            <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
                                                Financial governance, payout configuration, and institutional revenue tracking have been consolidated into a dedicated secure portal.
                                            </p>
                                        </div>
                                        <Link 
                                            href="/user/royalties"
                                            className="px-10 py-4 bg-linear-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-black rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all duration-300 uppercase text-xs tracking-[0.2em] flex items-center gap-2"
                                        >
                                            Access Payout Portal
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>

                                    {/* Threshold notice */}
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex items-start gap-4">
                                        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-white mb-1">Royalty Activation Threshold</p>
                                            <p className="text-xs text-neutral-400 leading-relaxed">
                                                Royalties become payable once a release earns <strong className="text-white">USD 500</strong> in verified platform revenue. 
                                                Below this threshold, earnings accumulate in the institutional reserve pool and are disbursed in the next eligible quarterly cycle.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Split Model */}
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-amber-400" /> Revenue Distribution Model
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
                                                <div key={row.label} className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${row.highlight ? 'bg-amber-400/10 border border-amber-400/30' : 'hover:bg-neutral-800/50'}`}>
                                                    <div className="w-10 text-right shrink-0">
                                                        <span className={`text-sm font-bold ${row.highlight ? 'text-amber-400' : 'text-white'}`}>{row.pct}%</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-sm font-semibold ${row.highlight ? 'text-amber-400' : 'text-white'}`}>{row.label}</span>
                                                            {row.highlight && <span className="text-[10px] bg-amber-400 text-black font-bold px-1.5 py-0.5 rounded-full">YOU</span>}
                                                        </div>
                                                        <p className="text-xs text-neutral-500">{row.desc}</p>
                                                    </div>
                                                    <div className="w-28 shrink-0">
                                                        <div className="h-1.5 rounded-full bg-neutral-800">
                                                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${row.pct * 3.33}%`, backgroundColor: row.color }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Studio Sessions Tab */}
                            {activeTab === 'sessions' && (
                                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <h2 className="text-base font-semibold text-white">Session Requests</h2>
                                        <Link
                                            href="/studio-sessions"
                                            className="px-4 py-2 text-xs bg-amber-400 text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
                                        >
                                            Submit a Request
                                        </Link>
                                    </div>
                                    {sessionRequests.length === 0 ? (
                                        <div className="text-center py-10 space-y-3">
                                            <CalendarClock size={32} className="mx-auto text-neutral-700 opacity-20" />
                                            <p className="text-sm text-neutral-500">No session requests found.</p>
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-neutral-800">
                                            {[...sessionRequests].reverse().map((req) => (
                                                <li key={req.id} className="py-4 space-y-1">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-white">
                                                                {req.session_type || 'Session Request'}
                                                            </p>
                                                            <p className="text-xs text-neutral-500 mt-0.5">
                                                                Ref: {req.approval_reference_code || '—'}
                                                                {req.preferred_date_start ? ` · ${req.preferred_date_start}` : ''}
                                                            </p>
                                                        </div>
                                                        <span className={`shrink-0 px-2.5 py-1 rounded border text-xs font-medium ${getStatusColor(req.status)}`}>
                                                            {req.status.replace("_", " ")}
                                                        </span>
                                                    </div>
                                                    {req.additional_notes && (
                                                        <p className="text-xs text-neutral-400 italic">{req.additional_notes}</p>
                                                    )}
                                                    <p className="text-[11px] text-neutral-600 mt-1">
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
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 lg:p-8">
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                            <User className="w-5 h-5 text-amber-400" /> Profile Settings
                                        </h3>
                                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                                            <div className="flex flex-col sm:flex-row gap-8 items-start">
                                                {/* Avatar Column */}
                                                <div className="flex flex-col items-center gap-3 shrink-0">
                                                    <div className="relative w-28 h-28 rounded-full bg-neutral-950 border-2 border-dashed border-neutral-800 flex flex-col justify-center items-center overflow-hidden group">
                                                        {avatarUrl ? (
                                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-12 h-12 text-neutral-700 group-hover:text-amber-400 transition-colors" />
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
                                                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Profile Picture</span>
                                                </div>

                                                {/* Form Column */}
                                                <div className="flex-1 space-y-5 w-full">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-white mb-2">Display Name</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={profileForm.name}
                                                            onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                                            className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 outline-none transition-all"
                                                            placeholder="Enter your name"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end pt-2">
                                                        <button
                                                            type="submit"
                                                            disabled={profileLoading || profileSaveStatus === 'saved'}
                                                            className="cursor-pointer flex items-center justify-center gap-2 bg-linear-to-r from-[#D4AF37] to-[#aa8829] text-[#1a2332] px-8 py-3 rounded-md font-bold hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                                        >
                                                            {profileSaveStatus === 'saving' && <Loader className='w-4 h-4 animate-spin' />}
                                                            {profileSaveStatus === 'saving' ? 'Saving…' : profileSaveStatus === 'saved' ? 'Saved' : profileSaveStatus === 'error' ? 'Save Failed' : 'Save Changes'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Security Settings (Password) */}
                                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 lg:p-8">
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-amber-400" /> Security Preferences
                                        </h3>
                                        <form onSubmit={handlePasswordUpdate} className="space-y-5 max-w-md">
                                            <div>
                                                <label className="block text-sm font-semibold text-white mb-2">Current Password</label>
                                                <input type="password" required value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 outline-none transition-all" placeholder="••••••••" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-white mb-2">New Password</label>
                                                <input type="password" required value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 outline-none transition-all" placeholder="••••••••" />
                                            </div>
                                            <button type="submit" disabled={passwordLoading} className="w-full cursor-pointer flex items-center justify-center bg-transparent border border-neutral-700 text-white py-3 rounded-md font-bold hover:border-amber-400 hover:text-amber-400 mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                                                {passwordLoading ? <Loader className='w-4 h-4 animate-spin' /> : "Update Password"}
                                            </button>
                                            {passwordMessage && (
                                                <div className={`mt-3 p-3 rounded-lg text-sm flex items-center justify-between gap-2 ${passwordMessage.type === 'success' ? 'bg-green-500/10 border border-green-500/25 text-green-400' : 'bg-red-500/10 border border-red-500/25 text-red-400'}`}>
                                                    <span>{passwordMessage.text}</span>
                                                    <button type="button" onClick={() => setPasswordMessage(null)} className="shrink-0 opacity-50 hover:opacity-100 text-lg leading-none">×</button>
                                                </div>
                                            )}
                                        </form>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>

                    {/* View Modal */}
                    {contentModal && selectedItem && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                                <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {selectedItem.status === 'revision requested' || selectedItem.status === 'revision_requested' ? 'Revision Request' : 'Item Review'}
                                        </h2>
                                        <span className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full border border-current ${getStatusColor(selectedItem.status)}`}>{getStatusLabel(selectedItem.status)}</span>
                                    </div>
                                    <button onClick={() => { setContentModal(false); setSelectedItem(null); }} className="cursor-pointer text-neutral-500 hover:text-white transition-colors">
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
                                            <p className="text-white text-sm leading-relaxed">{selectedItem.revision_notes}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Title</label>
                                        <div className="bg-neutral-950 rounded-xl p-5 border border-neutral-800">
                                            <p className="text-white font-arabic text-lg">{selectedItem.title}</p>
                                        </div>
                                    </div>
                                    {selectedItem.content ? (
                                        <div>
                                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Content</label>
                                            <div className="bg-neutral-950 rounded-xl p-6 border border-neutral-800 prose prose-invert max-w-none">
                                                <div className="text-white text-base leading-relaxed whitespace-pre-wrap font-arabic">
                                                    {selectedItem.content}
                                                </div>
                                            </div>
                                        </div>
                                    ) : selectedItem.link ? (
                                        <div>
                                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Link</label>
                                            <div className="bg-neutral-950 rounded-xl p-5 border border-neutral-800">
                                                <a href={selectedItem.link} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all">{selectedItem.link}</a>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="p-6 border-t border-neutral-800 flex gap-4 bg-neutral-950/50 rounded-b-2xl">
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
                                                className="cursor-pointer px-6 py-3 border border-neutral-800 text-neutral-400 font-bold rounded-xl hover:border-amber-400 transition-colors"
                                            >
                                                Close
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                disabled={selectedItem.status !== "draft"}
                                                onClick={() => handleUpdateStatus(selectedItem, 'under review')}
                                                className="cursor-pointer flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex justify-center items-center gap-2"
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
