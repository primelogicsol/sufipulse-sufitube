"use client";
import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
// import { supabase } from '../lib/supabase';
import { CircleCheck as CheckCircle, Circle as XCircle, Clock, Eye, User, CircleAlert as AlertCircle, RefreshCw, FileText } from 'lucide-react';
// import { notifyStatusChange, createSubmissionTracking } from '../services/notificationService';
import { useAuth } from '../../../contexts/AuthContext';
import * as api from "../../../api/auth";
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

    useEffect(() => {
        if (!authLoading) {
            loadApplications();
        }
    }, [authLoading]);

    async function loadApplications() {
        try {
            setLoading(true);

            console.log('[AdminWriterApplications] Current user:', user);
            console.log('[AdminWriterApplications] Auth loading:', authLoading);

            const res = await api.getAllWriter() as any
            console.log(res)
            setApplications(res.data?.writers || []);
        } catch (error) {
            console.error('[AdminWriterApplications] Error loading applications:', error);
            alert(`Failed to load applications. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        // if (!kalam) return;
        if (!id) return
        try {
            await api.updateWriterStatus(
                id,
                status,
            );

            alert("Status updated");
            setSelectedApp(null);
            loadApplications();

        } catch (err: any) {
            alert(err.response?.data?.error || err.message);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="dashboard-card">
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="relative flex-1">
                            <Eye className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search by pen name, email, or applicant name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="dashboard-input pl-10"
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
                                            <th>Status</th>
                                            <th>Submitted</th>
                                            <th>Reviewed</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredApplications.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-12 text-[var(--dash-text-muted)]">
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
                                                                    {app.pen_name}
                                                                </div>
                                                                {/* <div className="text-xs text-[var(--dash-text-muted)] line-clamp-1">
                                                                    {app.bio.substring(0, 50)}...
                                                                </div> */}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-2 text-[var(--dash-text-secondary)]">
                                                            <User className="w-4 h-4 text-[var(--dash-text-muted)]" />
                                                            <div>
                                                                <div>{app.full_name || app.email || 'No name'}</div>
                                                                <div className="text-xs text-[var(--dash-text-muted)]">
                                                                    {app.email || app.email || 'No email'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* <td>
                                                        <span className={`${getStatusBadgeClass(app.profile_status)} flex items-center gap-1 w-fit p-2 rounded-lg`}>
                                                            {getStatusIcon(app.profile_status)}
                                                            {app.profile_status.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="text-[var(--dash-text-secondary)]">
                                                        {new Date(app.created_at).toLocaleDateString()}
                                                    </td> */}
                                                    {/* <td className="text-[var(--dash-text-secondary)]">
                                                        {app.reviewed_at ? (
                                                            <div>
                                                                <div>{new Date(app.reviewed_at).toLocaleDateString()}</div>
                                                                {app.reviewer && (
                                                                    <div className="text-xs text-[var(--dash-text-muted)]">
                                                                        by {app.reviewer.full_name || app.reviewer.email}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[var(--dash-text-muted)]">Not reviewed</span>
                                                        )}
                                                    </td> */}
                                                    <td className="text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedApp(app);
                                                                // setAdminNotes(app.admin_notes || '');
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
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="dashboard-label">Applicant Email</label>
                                            <p className="text-[var(--dash-text-primary)]">{selectedApp.email}</p>
                                        </div>

                                        <div>
                                            <label className="dashboard-label">Full Name</label>
                                            <p className="text-[var(--dash-text-primary)]">
                                                {selectedApp.full_name || 'Not provided'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="dashboard-label">Sample Work</label>
                                        <div className="bg-[var(--dash-bg-secondary)] rounded-lg p-4 max-h-80 overflow-y-auto border border-[var(--dash-border)]">
                                            <p className="text-[var(--dash-text-secondary)] whitespace-pre-wrap">{selectedApp.sample_kalam}</p>
                                        </div>
                                    </div>

                                    {selectedApp.previous_publications && (
                                        <div>
                                            <label className="dashboard-label">Previous Publications</label>
                                            <div className="bg-[var(--dash-bg-secondary)] rounded-lg p-4 border border-[var(--dash-border)]">
                                                <p className="text-[var(--dash-text-secondary)] whitespace-pre-wrap">
                                                    {selectedApp.previous_publications}
                                                </p>
                                            </div>
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
                                        // onClick={() => updateApplicationStatus(selectedApp.id, 'under_review')}
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
