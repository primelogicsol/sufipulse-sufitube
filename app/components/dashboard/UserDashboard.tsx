"use client";
import { useEffect, useState } from 'react';
import * as api from "../../api/auth";
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, CircleCheck as CheckCircle, Search, Circle as XCircle, Eye, CircleAlert as AlertCircle, Clock, CirclePlus as PlusCircle, Shield, LogOut, Loader, User } from 'lucide-react';
import Editor, { EditorProvider } from "react-simple-wysiwyg";
import { Layout } from '../layout/Layout';
import { PageContainer } from '../layout/PageContainer';

type RoleType = "writer" | "vocalist";

interface UserDashboardProps {
    role: RoleType;
}

export default function UserDashboard({ role }: UserDashboardProps) {
    const { user, logout } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'my-content' | 'published' | 'settings'>('overview');
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

    const config = role === "writer" ? {
        title: "Writer Portal",
        subtitle: "Ahl-e-Qalam Control Center",
        term: "Kalam",
        termPlural: "Kalams",
        fetchProfile: api.readWriterProfile,
        fetchItems: api.getUserAllKalams,
        createItem: api.createKalam,
        updateItem: api.updateKalam,
        deleteItem: api.deleteKalam,
        updateStatus: api.updateKalamStatus,
        profileFields: {
            languages: 'primary_languages',
            styles: 'writing_styles'
        },
        draftFields: [
            { name: "writing_style", label: "Writing Style", type: "radio", source: "styles" },
            { name: "language", label: "Language", type: "radio", source: "languages" },
            { name: "title", label: "Title", type: "text", placeholder: "The name you wish your kalam to be called" },
            { name: "content", label: "Content", type: "editor" }
        ],
        draftDefaults: { title: "", language: "", writing_style: "", content: "" }
    } : {
        title: "Vocalist Portal",
        subtitle: "Ahl-e-Naghma Control Center",
        term: "Sada",
        termPlural: "Sadas",
        fetchProfile: api.readVocalistProfile,
        fetchItems: api.getUserAllSadas,
        createItem: api.createSada,
        updateItem: api.updateSada,
        deleteItem: api.deleteSada,
        updateStatus: api.updateSadaStatus,
        profileFields: {
            languages: 'languages_performed',
            styles: 'performance_styles'
        },
        draftFields: [
            { name: "performance_style", label: "Performance Style", type: "radio", source: "styles" },
            { name: "language", label: "Language", type: "radio", source: "languages" },
            { name: "title", label: "Title", type: "text", placeholder: "The name you wish your sada to be called" },
            { name: "link", label: "Link", type: "url", placeholder: "URL to your sada" }
        ],
        draftDefaults: { title: "", language: "", performance_style: "", link: "" }
    };

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }
        setProfileForm(prev => ({ ...prev, name: user.full_name || '' }));
        loadData();
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const profileRes = await config.fetchProfile() as any;
            setStatus(profileRes.data?.profile_status || profileRes.data?.status);
            setProfileData({
                languages: profileRes.data?.[config.profileFields.languages] || [],
                styles: profileRes.data?.[config.profileFields.styles] || []
            });
            const itemsRes = await config.fetchItems() as any;
            setItems(itemsRes.data || []);
            setDraftForm(config.draftDefaults);
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
        try {
            await api.updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
            alert("Password updated");
            setPasswordForm({ currentPassword: '', newPassword: '' });
        } catch (err: any) {
            alert(err.response?.data?.error || "Error");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        // Simulate API call since endpoint isn't defined yet
        setTimeout(() => {
            alert("Profile updated successfully!");
            setProfileLoading(false);
        }, 1000);
    };

    const handleDraftChange = (e: any) => {
        setDraftForm({ ...draftForm, [e.target.name]: e.target.value });
    };

    const handleDraftSubmit = async (e: any) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            if (editingItem) {
                await config.updateItem(editingItem.id, draftForm);
                alert(`${config.term} updated`);
                setEditingItem(null);
            } else {
                await config.createItem(draftForm);
                alert(`${config.term} created`);
            }
            setDraftForm(config.draftDefaults);
            setActiveTab("my-content");
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.error || "Error");
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
        setActiveTab("submissions");
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm(`Delete this ${config.term}?`)) return;
        try {
            await config.deleteItem(id);
            alert("Deleted");
            setContentModal(false);
            loadData();
        } catch (err: any) {
            alert("Error");
        }
    };

    const handleUpdateStatus = async (item: any, newStatus: string) => {
        try {
            if (role === "writer") {
                await (config.updateStatus as any)(item.id, newStatus, null);
            } else {
                await (config.updateStatus as any)(item.id, newStatus);
            }
            alert("Status updated");
            setContentModal(false);
            loadData();
        } catch (err: any) {
            alert("Error");
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

    const navigationLinks = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'my-content', label: 'My Content', icon: FileText },
        { id: 'published', label: 'Published', icon: CheckCircle },
        { id: 'submissions', label: `Submit ${config.term}`, icon: PlusCircle },
        { id: 'settings', label: 'General Settings', icon: Settings },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-midnight)] flex items-center justify-center">
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
        <Layout>
            <PageContainer className='max-w-[1600px]'>
                <div className="min-h-screen bg-[var(--dash-bg-primary)] flex">
                    {/* Sidebar copied from the Admin layout logic */}
                    <aside className="w-64 bg-[var(--dash-bg-secondary)] border-r border-[var(--dash-border)] flex flex-col hidden md:flex">
                        <div className="p-6 border-b border-[var(--dash-border)]">
                            <div className="flex items-center gap-3">
                                <Shield className="w-8 h-8 text-[var(--dash-accent)]" />
                                <div>
                                    <h1 className="text-lg! font-bold text-[var(--dash-text-primary)] leading-tight">{config.title}</h1>
                                    <p className="text-xs text-[var(--dash-text-muted)] mt-1">{config.subtitle}</p>
                                </div>
                            </div>
                        </div>
                        <nav className="py-4 flex-1">
                            {navigationLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = activeTab === link.id;
                                return (
                                    <button
                                        key={link.id}
                                        onClick={() => { setActiveTab(link.id as any); setSearchQuery(''); setSearchDate(''); }}
                                        className={`w-full cursor-pointer flex items-center gap-3 px-6 py-3 transition-colors text-left ${isActive
                                            ? 'bg-[var(--dash-accent)]/10 text-[var(--dash-accent)] border-r-2 border-[var(--dash-accent)]'
                                            : 'text-[var(--dash-text-secondary)] hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text-primary)]'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="font-medium text-sm">{link.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <header className="h-16 bg-[var(--dash-bg-secondary)] border-b border-[var(--dash-border)] flex items-center justify-between px-8 sticky top-0 z-10">
                            <h2 className="text-sm font-semibold text-[var(--dash-text-primary)]">
                                {navigationLinks.find(l => l.id === activeTab)?.label}
                            </h2>
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    {/* <p className="text-sm font-medium text-[var(--dash-text-primary)] uppercase">{user?.email}</p> */}
                                    <p className="text-xs text-[var(--dash-text-muted)] capitalize">{role}</p>
                                </div>
                                <button onClick={handleSignOut} className="cursor-pointer flex items-center gap-2 text-sm text-[var(--dash-text-secondary)] hover:text-[var(--dash-accent)] transition-colors">
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </header>

                        <main className="flex-1 p-8 overflow-y-auto bg-[var(--dash-bg-primary)]">

                            {/* Overview Tab (Admin Grid Design) */}
                            {activeTab === 'overview' && (
                                <div>
                                    {status !== "approved" && (
                                        <div className="mb-6 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg flex items-center gap-3">
                                            <AlertCircle className="w-5 h-5 text-yellow-400" />
                                            <div>
                                                <p className="text-sm font-semibold text-yellow-500">Profile Not Approved</p>
                                                <p className="text-xs text-yellow-400/80">Your profile is currently '{status}'. Limited actions available until approved.</p>
                                            </div>
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
                                    </div>
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
                                            <h2 className="text-xl font-bold text-[var(--dash-text-primary)] mb-6">
                                                {editingItem ? `Edit ${config.term}` : `Submit New ${config.term}`}
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
                                                className="w-full pl-10 pr-4 py-2.5 bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-lg text-[var(--dash-text-primary)] text-sm focus:border-[var(--dash-accent)] outline-none transition-colors"
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
                                        {activeItems.length > 0 ? activeItems.map(item => (
                                            <div key={item.id} className="bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl p-6 flex flex-col hover:border-[var(--dash-accent)] transition-all">
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
                                                    {/* <div className="flex mt-3">
                                                        <span className="w-24 text-[var(--dash-text-muted)] text-xs">ID:</span>
                                                        <span className="text-[var(--dash-text-muted)] text-xs truncate">{item.id.substring(0, 8)}</span>
                                                    </div> */}
                                                </div>
                                                <div className="flex gap-3 pt-4 border-t border-[var(--dash-border)] mt-auto">
                                                    <button onClick={() => { setSelectedItem(item); setContentModal(true) }} className="cursor-pointer flex-1 py-2 bg-blue-500/10 text-blue-400 font-semibold text-sm rounded-lg hover:bg-blue-500/20 transition-colors">
                                                        View
                                                    </button>
                                                    {activeTab === 'my-content' && (item.status === 'draft' || item.status === 'revision requested' || item.status === 'request revision') && (
                                                        <button onClick={() => handleEditItem(item)} className="cursor-pointer flex-1 py-2 bg-yellow-500/10 text-yellow-500 font-semibold text-sm rounded-lg hover:bg-yellow-500/20 transition-colors">
                                                            Edit
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-span-full border border-dashed border-[var(--dash-border-hover)] rounded-xl py-12 flex flex-col items-center justify-center text-[var(--dash-text-muted)]">
                                                <FileText className="w-12 h-12 mb-3 opacity-20" />
                                                <p>No results found</p>
                                            </div>
                                        )}
                                    </div>
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
                                    <h2 className="text-xl font-bold text-[var(--dash-text-primary)]">Item Review</h2>
                                    <button onClick={() => { setContentModal(false); setSelectedItem(null); }} className="cursor-pointer text-[var(--dash-text-muted)] hover:text-white transition-colors">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                                    {selectedItem.revision_notes && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
                                            <label className="block text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Admin Notes</label>
                                            <p className="text-[var(--dash-text-primary)] font-arabic text-lg leading-relaxed">{selectedItem.revision_notes}</p>
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
                                    <button
                                        disabled={selectedItem.status !== "draft"}
                                        onClick={() => handleUpdateStatus(selectedItem, 'under review')}
                                        className="cursor-pointer flex-1 py-3 bg-[var(--dash-status-approved)] text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex justify-center items-center gap-2"
                                    >
                                        {selectedItem.status === "draft" && <CheckCircle className="w-5 h-5" />}
                                        {selectedItem.status === "draft" ? "Submit Review" : "Submitted"}
                                    </button>
                                    <button
                                        disabled={selectedItem.status !== "draft"}
                                        onClick={() => handleDeleteItem(selectedItem.id)}
                                        className="cursor-pointer flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                                    >
                                        <XCircle className="w-5 h-5" /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </PageContainer>
        </Layout>
    );
}
