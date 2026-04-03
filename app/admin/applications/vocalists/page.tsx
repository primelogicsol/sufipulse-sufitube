"use client";
import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
// import { supabase } from '../lib/supabase';
import { CircleCheck as CheckCircle, Circle as XCircle, Clock, Eye, User, CircleAlert as AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { notifyStatusChange } from '@/app/lib/notifications';
import { useAuth } from '../../../contexts/AuthContext';
import * as api from "../../../api/auth";
import { WriterFormData } from '@/app/types/writer.types';
import { VocalistProfileType } from '@/app/types/vocalist.types';
import { storage } from '@/app/lib/storage';
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

export default function AdminVocalistApplications() {
    const { user, loading: authLoading } = useAuth();
    const [applications, setApplications] = useState<VocalistProfileType[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<VocalistProfileType | null>(null);
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

            const response = await api.getAllVocalists();
            let payload: any = null;

            if (response && typeof (response as any).json === 'function') {
                payload = await (response as any).json();
            } else {
                payload = response;
            }

            const apiApplications =
                payload?.data?.vocalists ||
                payload?.vocalists ||
                payload?.data ||
                [];

            if (Array.isArray(apiApplications) && apiApplications.length > 0) {
                setApplications(apiApplications);
            } else {
                const localApplications = await storage.getAll('vocalist');
                setApplications(Array.isArray(localApplications) ? localApplications : []);
            }
        } catch (error) {
            console.error('[AdminWriterApplications] Error loading applications:', error);
            const localApplications = await storage.getAll('vocalist');
            setApplications(Array.isArray(localApplications) ? localApplications : []);
        } finally {
            setLoading(false);
        }
    }

    const filteredApplications = applications.filter((app) => {
        const matchesSearch =
            app.performance_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = filter === 'all' || app.status === filter;

        return matchesSearch && matchesFilter;
    });

    const statusCounts = {
        all: applications.length,
        pending: applications.filter((a) => a.status === 'pending').length,
        under_review: applications.filter((a) => a.status === 'under_review').length,
        revision_requested: applications.filter((a) => a.status === 'revision_requested').length,
        approved: applications.filter((a) => a.status === 'approved').length,
        rejected: applications.filter((a) => a.status === 'rejected').length,
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
            try {
                await api.updateVocalistStatus(id, status);
            } catch {
                await storage.update('vocalist', id, {
                    status,
                    profile_status: status,
                    reviewed_at: new Date().toISOString(),
                });
            }
            if (app) {
                await notifyStatusChange({
                    user_id: (app as any).user_id,
                    email: (app as any).email,
                    name: (app as any).performance_name || (app as any).full_name || (app as any).email,
                    role: 'vocalist',
                    status: status as any,
                });
            }
            setSelectedApp(null);
            loadApplications();
        } catch (err: any) {
            alert(err?.message || 'Failed to update status');
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
                                            <th>Performance Name</th>
                                            <th>Vocalist</th>
                                            <th>Experience</th>
                                            <th>Country</th>
                                            <th>Languages</th>
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
                                                <tr key={app.email}>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-[var(--dash-bg-secondary)] flex items-center justify-center">
                                                                <FileText className="w-5 h-5 text-[var(--dash-accent)]" />
                                                            </div>

                                                            <div>
                                                                <div className="font-medium text-[var(--dash-text-primary)]">
                                                                    {app.performance_name}
                                                                </div>
                                                                <div className="text-xs text-[var(--dash-text-muted)]">
                                                                    {app.city}, {app.country}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div className="flex items-center gap-2 text-[var(--dash-text-secondary)]">
                                                            <User className="w-4 h-4 text-[var(--dash-text-muted)]" />
                                                            <div>
                                                                <div>{app.full_name}</div>
                                                                <div className="text-xs text-[var(--dash-text-muted)]">
                                                                    {app.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="text-[var(--dash-text-secondary)]">
                                                        {app.years_experience} years
                                                    </td>

                                                    <td className="text-[var(--dash-text-secondary)]">
                                                        {app.country}
                                                    </td>

                                                    <td className="text-[var(--dash-text-secondary)]">
                                                        {Array.isArray(app.languages_performed)
                                                            ? app.languages_performed.join(", ")
                                                            : app.languages_performed}
                                                    </td>

                                                    <td className="text-right">
                                                        <button
                                                            onClick={() => setSelectedApp(app)}
                                                            className="dashboard-btn-primary text-sm flex items-center gap-2 ml-auto"
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

                {selectedApp && (
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
                                            {selectedApp.performance_name} • {selectedApp.email}
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
                                            <label className="dashboard-label">Full Name</label>
                                            <p className="text-[var(--dash-text-primary)]">{selectedApp.full_name}</p>
                                        </div>

                                        <div>
                                            <label className="dashboard-label">Performance Name</label>
                                            <p className="text-[var(--dash-text-primary)]">{selectedApp.performance_name}</p>
                                        </div>

                                        <div>
                                            <label className="dashboard-label">Location</label>
                                            <p className="text-[var(--dash-text-primary)]">
                                                {selectedApp.city}, {selectedApp.country}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="dashboard-label">Years Experience</label>
                                            <p className="text-[var(--dash-text-primary)]">
                                                {selectedApp.years_experience}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="dashboard-label">Vocal Range</label>
                                            <p className="text-[var(--dash-text-primary)]">
                                                {selectedApp.vocal_range}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="dashboard-label">Studio Experience</label>
                                            <p className="text-[var(--dash-text-primary)]">
                                                {selectedApp.worked_in_studio ? "Yes" : "No"}
                                            </p>
                                        </div>

                                    </div>
                                    <div>
                                        <label className="dashboard-label">Sample Work</label>
                                        <div className="bg-[var(--dash-bg-secondary)] rounded-lg p-4 max-h-80 overflow-y-auto border border-[var(--dash-border)]">
                                            <p className="text-[var(--dash-text-secondary)] whitespace-pre-wrap">{selectedApp.sample_link}</p>
                                        </div>
                                    </div>



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

                                    {selectedApp.status === 'approved' && (
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

                            {selectedApp.id ? <div className="dashboard-modal-footer">
                                <div className="grid grid-cols-4 gap-3 w-full">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedApp.id, 'approved')}
                                        disabled={processingAction || selectedApp.status === 'approved'}
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
                            </div> : ""}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
