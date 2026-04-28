"use client";
import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
// import { supabase } from '../lib/supabase';
import { CircleCheck as CheckCircle, Circle as XCircle, Clock, Eye, User, CircleAlert as AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { notifyStatusChange } from '@/app/lib/notifications';
import { useAuth } from '../../../contexts/AuthContext';
import { WriterFormData } from '@/app/types/writer.types';
// import { WriterFormData } from '@/app/components/writers/WriterCredentialsForm';

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

export default function AdminWriterApplications() {
    const { user, loading: authLoading } = useAuth();
    const [applications, setApplications] = useState<WriterFormData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<WriterFormData | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'under_review' | 'revision_requested'>('pending');
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
            const res = await fetch('/api/writers');
            const data = await res.json();
            setApplications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[AdminWriterApplications] Error loading applications:', error);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }
    const filteredApplications = applications.filter((app) => {
        const matchesSearch =
            app.pen_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = filter === 'all' || app.profile_status === filter;

        return matchesSearch && matchesFilter;
    });

    const statusCounts = {
        all: applications.length,
        pending: applications.filter((a) => a.profile_status === 'pending').length,
        under_review: applications.filter((a) => a.profile_status === 'under_review').length,
        revision_requested: applications.filter((a) => a.profile_status === 'revision_requested').length,
        approved: applications.filter((a) => a.profile_status === 'approved').length,
        rejected: applications.filter((a) => a.profile_status === 'rejected').length,
    };

    function getStatusBadgeClass(status: string) {
        switch (status) {
            case 'approved':
                return 'dashboard-badge-success';
            case 'rejected':
                return 'dashboard-badge-danger';
            case 'pending':
                return 'dashboard-badge-pending';
            case 'revision_requested':
                return 'dashboard-badge-draft';
            default:
                return 'dashboard-badge-draft';
        }
    }

    function getStatusIcon(status: string) {
        switch (status) {
            case 'approved':
                return <CheckCircle className="w-3 h-3" />;
            case 'rejected':
                return <XCircle className="w-3 h-3" />;
            case 'pending':
                return <Clock className="w-3 h-3" />;
            case 'revision_requested':
                return <RefreshCw className="w-3 h-3" />;
            default:
                return <Clock className="w-3 h-3" />;
        }
    }
    const handleUpdateStatus = async (id: string | undefined, status: string) => {
        if (!id) return;
        const app = applications.find(a => (a as any).id === id);
        try {
            setProcessingAction(true);
            const res = await fetch(`/api/writers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile_status: status }),
            });
            if (!res.ok) throw new Error('Failed to update status');

            // In-app notification
            if (app) {
                notifyStatusChange({
                    user_id: (app as any).user_id,
                    email: app.email,
                    name: app.pen_name || app.full_name || app.email,
                    role: 'writer',
                    status: status as any,
                }).catch(console.error);
            }
            setSelectedApp(null);
            await loadApplications();
        } catch (err: any) {
            setActionError(err?.message || 'Failed to update status');
        } finally {
            setProcessingAction(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {actionError && (
                    <div className="p-3 rounded-lg text-sm flex items-center justify-between gap-2 bg-red-500/10 border border-red-500/25 text-red-400">
                        <span>{actionError}</span>
                        <button type="button" onClick={() => setActionError(null)} className="shrink-0 opacity-50 hover:opacity-100 text-lg leading-none">×</button>
                    </div>
                )}
                <div className="dashboard-card">
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="relative flex-1">
                            <Eye className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search by pen name, email, or applicant name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="dashboard-input has-icon"
                            />
                        </div>

                        <div className="dashboard-tabs">
                            <button
                                onClick={() => setFilter('pending')}
                                className={`dashboard-tab ${filter === 'pending' ? 'active' : ''}`}
                            >
                                Pending ({statusCounts.pending})
                            </button>
                            <button
                                onClick={() => setFilter('under_review')}
                                className={`dashboard-tab ${filter === 'under_review' ? 'active' : ''}`}
                            >
                                Under Review ({statusCounts.under_review})
                            </button>
                            <button
                                onClick={() => setFilter('revision_requested')}
                                className={`dashboard-tab ${filter === 'revision_requested' ? 'active' : ''}`}
                            >
                                Revision ({statusCounts.revision_requested})
                            </button>
                            <button
                                onClick={() => setFilter('approved')}
                                className={`dashboard-tab ${filter === 'approved' ? 'active' : ''}`}
                            >
                                Approved ({statusCounts.approved})
                            </button>
                            <button
                                onClick={() => setFilter('rejected')}
                                className={`dashboard-tab ${filter === 'rejected' ? 'active' : ''}`}
                            >
                                Rejected ({statusCounts.rejected})
                            </button>
                            <button
                                onClick={() => setFilter('all')}
                                className={`dashboard-tab ${filter === 'all' ? 'active' : ''}`}
                            >
                                All ({statusCounts.all})
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="dashboard-loading">
                            <p>Loading applications...</p>
                        </div>
                    ) : (
                        <>
                            <div className="dashboard-table-container">
                                <table className="dashboard-table">
                                    <thead>
                                        <tr>
                                            <th>Pen Name</th>
                                            <th>Applicant</th>
                                            <th>Experience</th>
                                            <th>Country</th>
                                            <th>Languages</th>
                                            <th>Status</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredApplications.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-12 text-[var(--dash-text-muted)]">
                                                    {searchQuery ? 'No applications match your search' : 'No applications found'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredApplications.map((app) => (
                                                <tr key={app.id}>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-[var(--dash-bg-secondary)] flex items-center justify-center">
                                                                <FileText className="w-5 h-5 text-[var(--dash-accent)]" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-[var(--dash-text-primary)]">
                                                                    {app.pen_name || '—'}
                                                                </div>
                                                                <div className="text-xs text-[var(--dash-text-muted)]">
                                                                    {app.city ? `${app.city}, ` : ''}{app.country || ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-2 text-[var(--dash-text-secondary)]">
                                                            <User className="w-4 h-4 text-[var(--dash-text-muted)]" />
                                                            <div>
                                                                <div>{app.full_name || '—'}</div>
                                                                <div className="text-xs text-[var(--dash-text-muted)]">{app.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-[var(--dash-text-secondary)]">
                                                        {app.years_experience ? `${app.years_experience} yrs` : '—'}
                                                    </td>
                                                    <td className="text-[var(--dash-text-secondary)]">
                                                        {app.country || '—'}
                                                    </td>
                                                    <td className="text-[var(--dash-text-secondary)]">
                                                        {Array.isArray(app.primary_languages)
                                                            ? app.primary_languages.join(', ')
                                                            : app.primary_languages || '—'}
                                                    </td>
                                                    <td>
                                                        <span className={`${getStatusBadgeClass(app.profile_status || 'pending')} flex items-center gap-1 w-fit px-2 py-1 rounded-lg text-xs`}>
                                                            {getStatusIcon(app.profile_status || 'pending')}
                                                            {(app.profile_status || 'pending').replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedApp(app);
                                                            }}
                                                            className="dashboard-btn-primary text-sm flex items-center gap-2 ml-auto"
                                                            disabled={processingAction}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Review
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 text-sm text-[var(--dash-text-muted)]">
                                Showing {filteredApplications.length} of {applications.length} applications
                            </div>
                        </>
                    )}
                </div>

                {selectedApp && selectedApp.id && (
                    <div className="dashboard-modal-overlay" onClick={() => !processingAction && setSelectedApp(null)}>
                        <div className="dashboard-modal max-w-4xl relative" onClick={(e) => e.stopPropagation()}>
                            <div className="dashboard-modal-header">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-[var(--dash-accent)]" />
                                    <div>
                                        <h2 className="text-xl! mb-0! font-bold text-[var(--dash-text-primary)]">
                                            Writer Application Review
                                        </h2>
                                        <p className="text-sm text-[var(--dash-text-secondary)]">
                                            {selectedApp.pen_name} • {selectedApp.email}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (!processingAction) {
                                            setSelectedApp(null);
                                            setAdminNotes('');
                                        }
                                    }}
                                    className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text-primary)]"
                                    disabled={processingAction}
                                >
                                    <XCircle className="w-6 h-6 absolute right-4 top-4" />
                                </button>
                            </div>

                            <div className="dashboard-modal-body max-h-[60vh] overflow-y-auto">
                                <div className="space-y-6">
                                    {/* Identity */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="dashboard-label">Full Name</label>
                                            <p className="text-[var(--dash-text-primary)]">{selectedApp.full_name || '—'}</p>
                                        </div>
                                        <div>
                                            <label className="dashboard-label">Email</label>
                                            <p className="text-[var(--dash-text-primary)]">{selectedApp.email}</p>
                                        </div>
                                        <div>
                                            <label className="dashboard-label">Pen Name</label>
                                            <p className="text-[var(--dash-text-primary)]">{selectedApp.pen_name || '—'}</p>
                                        </div>
                                        <div>
                                            <label className="dashboard-label">Location</label>
                                            <p className="text-[var(--dash-text-primary)]">{selectedApp.city ? `${selectedApp.city}, ` : ''}{selectedApp.country || '—'}</p>
                                        </div>
                                        <div>
                                            <label className="dashboard-label">Experience</label>
                                            <p className="text-[var(--dash-text-primary)]">{selectedApp.years_experience ? `${selectedApp.years_experience} years` : '—'}</p>
                                        </div>
                                        <div>
                                            <label className="dashboard-label">Languages</label>
                                            <p className="text-[var(--dash-text-primary)]">
                                                {Array.isArray(selectedApp.primary_languages)
                                                    ? selectedApp.primary_languages.join(', ')
                                                    : selectedApp.primary_languages || '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Writing styles */}
                                    {Array.isArray(selectedApp.writing_styles) && selectedApp.writing_styles.length > 0 && (
                                        <div>
                                            <label className="dashboard-label">Writing Styles</label>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {selectedApp.writing_styles.map((s: string) => (
                                                    <span key={s} className="dashboard-badge dashboard-badge-pending text-xs">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Literary background */}
                                    {selectedApp.literary_background && (
                                        <div>
                                            <label className="dashboard-label">Literary Background</label>
                                            <div className="bg-[var(--dash-bg-secondary)] rounded-lg p-4 border border-[var(--dash-border)]">
                                                <p className="text-[var(--dash-text-secondary)] whitespace-pre-wrap text-sm">{selectedApp.literary_background}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Thematic focus */}
                                    {selectedApp.thematic_focus && (
                                        <div>
                                            <label className="dashboard-label">Thematic Focus</label>
                                            <div className="bg-[var(--dash-bg-secondary)] rounded-lg p-4 border border-[var(--dash-border)]">
                                                <p className="text-[var(--dash-text-secondary)] whitespace-pre-wrap text-sm">{selectedApp.thematic_focus}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sample Kalam */}
                                    <div>
                                        <label className="dashboard-label">Sample Kalam</label>
                                        <div className="bg-[var(--dash-bg-secondary)] rounded-lg p-4 max-h-80 overflow-y-auto border border-[var(--dash-border)]">
                                            <p className="text-[var(--dash-text-secondary)] whitespace-pre-wrap font-mono text-sm">{selectedApp.sample_kalam || '—'}</p>
                                        </div>
                                    </div>

                                    {/* Previous publications */}
                                    {selectedApp.previous_publications && (
                                        <div>
                                            <label className="dashboard-label">Previous Publications</label>
                                            <div className="bg-[var(--dash-bg-secondary)] rounded-lg p-4 border border-[var(--dash-border)]">
                                                <p className="text-[var(--dash-text-secondary)] whitespace-pre-wrap text-sm">
                                                    {selectedApp.previous_publications}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submission date */}
                                    {(selectedApp as any).submitted_at && (
                                        <div>
                                            <label className="dashboard-label">Submitted</label>
                                            <p className="text-[var(--dash-text-secondary)] text-sm">{new Date((selectedApp as any).submitted_at).toLocaleString()}</p>
                                        </div>
                                    )}

                                    {/* <div>
                                        <label className="dashboard-label">
                                            Admin Notes
                                            {selectedApp.admin_notes && (
                                                <span className="text-xs text-[var(--dash-text-muted)] ml-2">(Previous notes saved)</span>
                                            )}
                                        </label>
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            rows={4}
                                            className="dashboard-textarea"
                                            placeholder="Add notes for this application (visible to other admins)..."
                                            disabled={processingAction}
                                        />
                                    </div> */}

                                    {selectedApp.profile_status === 'approved' && (
                                        <div className="bg-[var(--dash-status-approved)]/10 border border-[var(--dash-status-approved)] rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-[var(--dash-status-approved)] flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-[var(--dash-status-approved)] mb-1">
                                                        Application Approved
                                                    </p>
                                                    <p className="text-sm text-[var(--dash-text-secondary)]">
                                                        This writer has been approved and the writer role has been assigned to their account.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="dashboard-modal-footer">
                                <div className="grid grid-cols-4 gap-3 w-full">
                                    <button

                                        disabled={processingAction || selectedApp.profile_status === 'approved'}
                                        onClick={() => handleUpdateStatus(selectedApp.id, 'approved')}
                                        className="dashboard-btn-primary bg-[var(--dash-status-approved)] hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedApp.id, 'under_review')}
                                        disabled={processingAction}
                                        className="dashboard-btn-secondary flex items-center justify-center gap-2"
                                    >
                                        <Clock className="w-4 h-4" />
                                        Under Review
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedApp.id, 'revision_requested')}
                                        disabled={processingAction}
                                        className="dashboard-btn-secondary whitespace-nowrap flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Request Revision
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to reject this application? This action cannot be undone.')) {
                                                handleUpdateStatus(selectedApp.id, 'rejected');
                                            }
                                        }}
                                        disabled={processingAction}
                                        className="dashboard-btn-danger flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
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
