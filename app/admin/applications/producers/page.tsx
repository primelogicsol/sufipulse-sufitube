"use client";

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { CircleCheck as CheckCircle, Circle as XCircle, Clock, Eye, User, CircleAlert as AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { ProducerProfileType } from '@/app/types/producer.types';
import { useAuth } from '@/app/contexts/AuthContext';

export default function AdminProducerApplications() {
    const { loading: authLoading } = useAuth();
    const [applications, setApplications] = useState<ProducerProfileType[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<ProducerProfileType | null>(null);
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
            const res = await fetch('/api/producers');
            const data = await res.json();
            setApplications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[AdminProducerApplications] Error loading:', error);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }

    const filteredApplications = applications.filter((app) => {
        const matchesSearch =
            (app.professional_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.email || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || (app.profile_status || 'pending') === filter;
        return matchesSearch && matchesFilter;
    });

    const statusCounts = {
        all: applications.length,
        pending: applications.filter((a) => (a.profile_status || 'pending') === 'pending').length,
        under_review: applications.filter((a) => a.profile_status === 'under_review').length,
        revision_requested: applications.filter((a) => a.profile_status === 'revision_requested').length,
        approved: applications.filter((a) => a.profile_status === 'approved').length,
        rejected: applications.filter((a) => a.profile_status === 'rejected').length,
    };

    function getStatusBadgeClass(status: string) {
        switch (status) {
            case 'approved': return 'dashboard-badge-success';
            case 'rejected': return 'dashboard-badge-danger';
            case 'pending': return 'dashboard-badge-pending';
            case 'revision_requested': return 'dashboard-badge-draft';
            default: return 'dashboard-badge-draft';
        }
    }

    function getStatusIcon(status: string) {
        switch (status) {
            case 'approved': return <CheckCircle className="w-3 h-3" />;
            case 'rejected': return <XCircle className="w-3 h-3" />;
            case 'pending': return <Clock className="w-3 h-3" />;
            case 'revision_requested': return <RefreshCw className="w-3 h-3" />;
            default: return <Clock className="w-3 h-3" />;
        }
    }

    const handleUpdateStatus = async (id: string | undefined, status: string) => {
        if (!id) return;
        try {
            setProcessingAction(true);
            const res = await fetch(`/api/producers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile_status: status }),
            });
            if (!res.ok) throw new Error('Failed to update status');
            setSelectedApp(null);
            loadApplications();
        } catch (err: any) {
            alert(err?.message || 'Failed to update status');
        } finally {
            setProcessingAction(false);
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
                                placeholder="Search by professional name, email, or applicant name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="dashboard-input has-icon"
                            />
                        </div>

                        <div className="dashboard-tabs">
                            <button onClick={() => setFilter('pending')} className={`dashboard-tab ${filter === 'pending' ? 'active' : ''}`}>
                                Pending ({statusCounts.pending})
                            </button>
                            <button onClick={() => setFilter('under_review')} className={`dashboard-tab ${filter === 'under_review' ? 'active' : ''}`}>
                                Under Review ({statusCounts.under_review})
                            </button>
                            <button onClick={() => setFilter('revision_requested')} className={`dashboard-tab ${filter === 'revision_requested' ? 'active' : ''}`}>
                                Revision ({statusCounts.revision_requested})
                            </button>
                            <button onClick={() => setFilter('approved')} className={`dashboard-tab ${filter === 'approved' ? 'active' : ''}`}>
                                Approved ({statusCounts.approved})
                            </button>
                            <button onClick={() => setFilter('rejected')} className={`dashboard-tab ${filter === 'rejected' ? 'active' : ''}`}>
                                Rejected ({statusCounts.rejected})
                            </button>
                            <button onClick={() => setFilter('all')} className={`dashboard-tab ${filter === 'all' ? 'active' : ''}`}>
                                All ({statusCounts.all})
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="dashboard-loading"><p>Loading producer applications...</p></div>
                    ) : (
                        <>
                            <div className="dashboard-table-container">
                                <table className="dashboard-table">
                                    <thead>
                                        <tr>
                                            <th>Professional Name</th>
                                            <th>Producer</th>
                                            <th>Experience</th>
                                            <th>Country</th>
                                            <th>Production Focus</th>
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
                                                                    {app.professional_name || app.full_name || '—'}
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
                                                        {Array.isArray(app.primary_production_focus)
                                                            ? app.primary_production_focus.slice(0, 2).join(', ') + (app.primary_production_focus.length > 2 ? '…' : '')
                                                            : '—'}
                                                    </td>
                                                    <td>
                                                        <span className={`${getStatusBadgeClass(app.profile_status || 'pending')} flex items-center gap-1 w-fit px-2 py-1 rounded-lg text-xs`}>
                                                            {getStatusIcon(app.profile_status || 'pending')}
                                                            {(app.profile_status || 'pending').replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="text-right">
                                                        <button
                                                            onClick={() => setSelectedApp(app)}
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
                                            Producer Application Review
                                        </h2>
                                        <p className="text-sm text-[var(--dash-text-secondary)]">
                                            {selectedApp.professional_name || selectedApp.full_name} • {selectedApp.email}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { if (!processingAction) setSelectedApp(null); }}
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
                                            <label className="dashboard-label">Professional Name</label>
                                            <p className="text-[var(--dash-text-primary)]">{selectedApp.professional_name || '—'}</p>
                                        </div>
                                        <div>
                                            <label className="dashboard-label">Email</label>
                                            <p className="text-[var(--dash-text-primary)]">{selectedApp.email}</p>
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
                                            <label className="dashboard-label">Primary Tools / DAW</label>
                                            <p className="text-[var(--dash-text-primary)]">{selectedApp.primary_tools || '—'}</p>
                                        </div>
                                        <div>
                                            <label className="dashboard-label">Worked in Structured Production</label>
                                            <p className="text-[var(--dash-text-primary)]">{selectedApp.worked_structured_production === true ? 'Yes' : selectedApp.worked_structured_production === false ? 'No' : '—'}</p>
                                        </div>
                                        <div>
                                            <label className="dashboard-label">Willing to Follow Sequence</label>
                                            <p className="text-[var(--dash-text-primary)]">{selectedApp.willing_defined_sequence === true ? 'Yes' : '—'}</p>
                                        </div>
                                    </div>

                                    {/* Production Focus */}
                                    {Array.isArray(selectedApp.primary_production_focus) && selectedApp.primary_production_focus.length > 0 && (
                                        <div>
                                            <label className="dashboard-label">Primary Production Focus</label>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {selectedApp.primary_production_focus.map((f: string) => (
                                                    <span key={f} className="dashboard-badge dashboard-badge-pending text-xs">{f}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Musical Background */}
                                    {selectedApp.musical_background && (
                                        <div>
                                            <label className="dashboard-label">Musical Background</label>
                                            <div className="bg-[var(--dash-bg-secondary)] rounded-lg p-4 border border-[var(--dash-border)]">
                                                <p className="text-[var(--dash-text-secondary)] whitespace-pre-wrap text-sm">{selectedApp.musical_background}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Portfolio */}
                                    {selectedApp.portfolio_link && (
                                        <div>
                                            <label className="dashboard-label">Portfolio Link</label>
                                            <a href={selectedApp.portfolio_link} target="_blank" rel="noopener noreferrer" className="text-[var(--dash-accent)] text-sm underline break-all">
                                                {selectedApp.portfolio_link}
                                            </a>
                                        </div>
                                    )}

                                    {/* Submission date */}
                                    {(selectedApp as any).submitted_at && (
                                        <div>
                                            <label className="dashboard-label">Submitted</label>
                                            <p className="text-[var(--dash-text-secondary)] text-sm">{new Date((selectedApp as any).submitted_at).toLocaleString()}</p>
                                        </div>
                                    )}

                                    {selectedApp.profile_status === 'approved' && (
                                        <div className="bg-[var(--dash-status-approved)]/10 border border-[var(--dash-status-approved)] rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-[var(--dash-status-approved)] flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-[var(--dash-status-approved)] mb-1">Application Approved</p>
                                                    <p className="text-sm text-[var(--dash-text-secondary)]">
                                                        This producer has been approved and the producer role has been assigned to their account.
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
                                        onClick={() => handleUpdateStatus(selectedApp.id, 'approved')}
                                        disabled={processingAction || selectedApp.profile_status === 'approved'}
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
                                        className="dashboard-btn-secondary flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Revision
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedApp.id, 'rejected')}
                                        disabled={processingAction || selectedApp.profile_status === 'rejected'}
                                        className="dashboard-btn-secondary flex items-center justify-center gap-2 text-[var(--dash-status-rejected)] hover:bg-[var(--dash-status-rejected)]/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
