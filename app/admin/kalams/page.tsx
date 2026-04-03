"use client"
import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
// import { supabase } from '../lib/supabase';
import { CircleCheck as CheckCircle, Circle as XCircle, Clock, Eye, User, File, MessageSquareDashed, BookA } from 'lucide-react';
import * as api from "../../api/auth"
import { Kalam } from '@/app/user/writer/dashboard/page';
import { notifyStatusChange, lookupUserFromStorage, mapKalamStatusToEvent } from '@/app/lib/notifications';
// interface Kalam {
//   id: string;
//   writer_id: string;
//   user_id:stringl
//   title: string;
//   arabic_text: string;
//   transliteration: string | null;
//   translation: string | null;
//   theme: string | null;
//   language: string;
//   submitted_at: string;
//   status: 'submitted' | 'under_review' | 'revision_requested' | 'approved' | 'rejected';
//   reviewer_id: number | null;
//   reviewed_at: string | null;
//   review_notes: string | null;
//   revision_notes: string | null;
//   revision_count: number;
//   version: number;
//   users: {
//     email: string;
//     full_name: string | null;
//   } | null;
// }

// interface Kalam {
//   title: string;
//   user_id: string;
//   id: string;
//   writer_id: string;
//   status: 'submitted' | 'under review' | 'revision_requested' | 'approved' | 'rejected' | 'draft';
//   language: string;
//   writing_style: string;
//   content: string;
// }

export default function AdminKalams() {
  const [kalams, setKalams] = useState<Kalam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKalam, setSelectedKalam] = useState<Kalam | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('submitted');

  useEffect(() => {
    loadKalams();
  }, []);

  async function loadKalams() {
    try {
      setLoading(true);
      const res = await api.getAllKalams() as any
      setKalams(res.data)
      console.log("Kalams Fetched!", res.data)
      // setKalams(data || []);
    } catch (error) {
      console.error('Error loading kalams:', error);
    } finally {
      setLoading(false);
    }
  }

  // async function updateKalamStatus(
  //   kalamId: string,
  //   status: 'approved' | 'rejected' | 'under_review' | 'revision_requested'
  // ) {
  //   try {
  //     const { error } = await supabase
  //       .from('kalams')
  //       .update({
  //         status,
  //         review_notes: reviewNotes || null,
  //         reviewed_at: new Date().toISOString(),
  //       })
  //       .eq('id', kalamId);

  //     if (error) throw error;

  //     alert(`Kalam ${status} successfully`);
  //     setSelectedKalam(null);
  //     setReviewNotes('');
  //     loadKalams();
  //   } catch (error) {
  //     console.error('Error updating kalam:', error);
  //     alert('Failed to update kalam');
  //   }
  // }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.updateKalamStatus(id, status, reviewNotes);
      alert("Status updated");

      // Notify the writer
      const kalam = selectedKalam;
      if (kalam?.user_id) {
        const storedUser = lookupUserFromStorage(kalam.user_id);
        if (storedUser) {
          notifyStatusChange({
            user_id: kalam.user_id,
            email: storedUser.email,
            name: storedUser.name,
            role: 'writer',
            status: mapKalamStatusToEvent(status),
            reference: kalam.title,
          }).catch(console.error);
        }
      }

      setSelectedKalam(null);
      loadKalams();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };



  const filteredKalams = kalams.filter((kalam) => {
    if (filter === 'all') return true;
    return kalam.status === filter;
  });

  const statusCounts = {
    submitted: kalams.filter((k) => k.status === 'submitted').length,
    approved: kalams.filter((k) => k.status === 'approved').length,
    rejected: kalams.filter((k) => k.status === 'rejected').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="dashboard-card">
          <div className="dashboard-tabs">
            <button
              onClick={() => setFilter('submitted')}
              className={`dashboard-tab ${filter === 'submitted' ? 'active' : ''}`}
            >
              New Submissions ({statusCounts.submitted})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`dashboard-tab ${filter === 'all' ? 'active' : ''}`}
            >
              All
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
          </div>

          {loading ? (
            <div className="dashboard-loading">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[var(--dash-accent)] border-t-transparent"></div>
              <p className="mt-4">Loading submissions...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredKalams.length === 0 ? (
                <div className="text-center py-12 text-[var(--dash-text-muted)]">No submissions found</div>
              ) : (
                filteredKalams.map((kalam) => (
                  <div
                    key={kalam.id}
                    className="dashboard-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-[var(--dash-text-primary)]">{kalam.title}</h3>
                          {kalam.language && (
                            <span className="px-2 py-1 bg-[var(--dash-bg-hover)] text-[var(--dash-text-secondary)] rounded text-xs font-medium border border-[var(--dash-border)]">
                              {kalam.language}
                            </span>
                          )}
                          <span
                            className={`dashboard-badge ${kalam.status === 'approved'
                              ? 'dashboard-badge-approved'
                              : kalam.status === 'rejected'
                                ? 'dashboard-badge-rejected'
                                : kalam.status === 'under review'
                                  ? 'dashboard-badge-pending'
                                  : 'dashboard-badge-pending'
                              }`}
                          >
                            {kalam.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-[var(--dash-text-secondary)] mb-2">
                          <User className="w-4 h-4" />
                          {kalam.writer_id || 'Unknown writer'}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-[var(--dash-text-secondary)] mb-2">
                          <BookA className="w-4 h-4" />
                          {kalam.writing_style}
                        </div>

                        {kalam.revision_notes && <div className="flex items-center gap-2 text-sm text-[var(--dash-text-secondary)] mb-2">
                          <MessageSquareDashed className="w-4 h-4" />
                          {kalam.revision_notes || 'Unknown writer'}
                        </div>}


                        <div className="flex items-center gap-4 text-xs text-[var(--dash-text-muted)]">
                          <span>Submitted: {new Date(kalam.updated_at).toLocaleDateString()}</span>
                          {/* <span>Version: {kalam.version}</span> */}
                          {/* {kalam.revision_count > 0 && (
                            <span>Revisions: {kalam.revision_count}</span>
                          )} */}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedKalam(kalam);
                          setReviewNotes(kalam.revision_notes || '');
                        }}
                        className="dashboard-btn-primary flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {selectedKalam && (
          <div className="dashboard-modal-overlay">
            <div className="dashboard-modal">
              <div className="dashboard-modal-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[var(--dash-text-primary)]">Kalam Review</h2>
                  <button
                    onClick={() => {
                      setSelectedKalam(null);
                      setReviewNotes('');
                    }}
                    className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text-secondary)]"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="dashboard-modal-body">
                <div className="space-y-4">
                  <div>
                    <label className="dashboard-label">Title</label>
                    <p className="text-[var(--dash-text-primary)]">{selectedKalam.title}</p>
                  </div>

                  {/* <div>
                    <label className="dashboard-label">Writer</label>
                    <p className="text-[var(--dash-text-primary)]">{selectedKalam.users?.email}</p>
                  </div> */}

                  {/* {selectedKalam.theme && (
                    <div>
                      <label className="dashboard-label">Theme</label>
                      <p className="text-[var(--dash-text-primary)]">{selectedKalam.theme}</p>
                    </div>
                  )} */}

                  <div>
                    <label className="dashboard-label">
                      Content
                    </label>
                    <div className="bg-[var(--dash-bg-primary)] rounded p-4 max-h-60 overflow-y-auto border border-[var(--dash-border)]">
                      <p className="text-[var(--dash-text-primary)] font-arabic text-lg leading-relaxed">
                        {selectedKalam.content}
                      </p>
                    </div>
                  </div>

                  {/* {selectedKalam.transliteration && (
                    <div>
                      <label className="dashboard-label">
                        Transliteration
                      </label>
                      <div className="bg-[var(--dash-bg-primary)] rounded p-4 border border-[var(--dash-border)]">
                        <p className="text-[var(--dash-text-secondary)] whitespace-pre-wrap">
                          {selectedKalam.transliteration}
                        </p>
                      </div>
                    </div>
                  )} */}

                  {/* {selectedKalam.revision_notes && (
                    <div>
                      <label className="dashboard-label">
                        Revision Notes
                      </label>
                      <div className="bg-[var(--dash-bg-primary)] rounded p-4 border border-[var(--dash-border)]">
                        <p className="text-[var(--dash-text-secondary)] whitespace-pre-wrap">
                          {selectedKalam.revision_notes}
                        </p>
                      </div>
                    </div>
                  )} */}

                  <div>
                    <label className="dashboard-label">
                      Review Notes
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={4}
                      className="dashboard-textarea"
                      placeholder="Add review notes..."
                    />
                  </div>
                </div>
              </div>

              <div className="dashboard-modal-footer">
                <button
                  onClick={() => handleUpdateStatus(selectedKalam.id, 'approved')}
                  className="flex-1 bg-[var(--dash-status-approved)] hover:opacity-90 text-white rounded-lg px-4 py-3 transition-opacity flex items-center justify-center gap-2 font-medium"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedKalam.id, 'under review')}
                  className="flex-1 dashboard-btn-secondary flex items-center justify-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  Under Review
                </button>
                <button
                  disabled={reviewNotes.length === 0}
                  onClick={() => handleUpdateStatus(selectedKalam.id, 'revision requested')}
                  className="flex-1 bg-[var(--dash-status-pending)] hover:opacity-90 text-[var(--dash-bg-primary)] rounded-lg px-4 py-3 transition-opacity flex items-center justify-center gap-2 font-medium"
                >
                  Request Revision
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to reject this kalam?')) {
                      handleUpdateStatus(selectedKalam.id, 'rejected');
                    }
                  }}
                  className="flex-1 dashboard-btn-danger flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
