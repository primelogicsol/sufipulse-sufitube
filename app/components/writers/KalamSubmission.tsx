"use client";
import { useEffect, useState } from 'react';
import DOMPurify from "dompurify";
// import { supabase } from '../lib/supabase';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Bell, FileText, Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Eye, Loader } from 'lucide-react';
import * as api from "../../api/auth"
// import { WriterFormData } from '@/app/components/writers/WriterCredentialsForm';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RichTextEditor from "../../components/ui/RichTextEditor"
// import { BtnBold, BtnClearFormatting, BtnItalic, Editor, EditorProvider, Toolbar } from 'react-simple-wysiwyg';
import Editor, {
  EditorProvider,
} from "react-simple-wysiwyg";
interface Submission {
  id: string;
  submission_reference: string;
  submission_type: string;
  current_status: string;
  submitter_name: string;
  submission_data: any;
  created_at: string;
  status_updated_at: string;
  admin_notes?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  submission_reference?: string;
}
export interface KalamUnderDraft {
  title: string,
  language: string,
  writing_style: string,
  content: string,
}

export interface Kalam {
  title: string;
  user_id: string;
  id: string;
  writer_id: string;
  status: string;
  language: string;
  writing_style: string;
  content: string;
  revision_notes?:string;
  created_at?:any;
  updated_at?:any;
}

export default function UserDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, profileStatus } = useAuth();
  const [activeTab, setActiveTab] = useState<'submissions' | 'notifications' | 'archives'>('submissions');
  const [status, setStatus] = useState("")
  const [editingKalam, setEditingKalam] = useState<Kalam | null>(null);
  const [kalam, setKalam] = useState<Kalam | null>(null);
  const [kalamUnderDraft, setkalamUnderDraft] = useState<KalamUnderDraft>({
    title: "",
    language: "",
    writing_style: "",
    content: "",
  })
  const [kalams, setKalams] = useState<Kalam[]>([])
  const [contentModal, setContentModal] = useState(false)
  const [writer, setWriter] = useState({
    languages: [],
    writing_styles: [],
  })
  const loadWriterKalams = async () => {
    try {
      const res: any = await api.getUserAllKalams();
      setKalams(res.data)
      console.log("Kalams fetched!")
    } catch (error) {
      console.log(error)
    }
  }
  useEffect(() => {
    const loadWriterProfile = async () => {
      try {
        const res: any = await api.readWriterProfile();
        setStatus(res.data.profile_status)
        setWriter({
          languages: res.data.primary_languages,
          writing_styles: res.data.writing_styles
        })
      } catch (error) {
        console.log(error)
      }
    }

    loadWriterProfile()
    loadWriterKalams()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this kalam?")) return;

    try {
      await api.deleteKalam(id);
      alert("Kalam deleted");
      loadWriterKalams();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleEdit = (kalam: Kalam) => {
    setEditingKalam(kalam);
    setkalamUnderDraft({
      title: kalam.title,
      language: kalam.language,
      writing_style: kalam.writing_style,
      content: kalam.content,
    });

    setActiveTab("submissions");
  };

  const handleShowContent = (kalam: any) => {
    setKalam(kalam)
    setContentModal(true)
    // console.log(showContent)
  }
  // const handleSubmit = async (e: any) => {
  //   console.log("kalam", kalams)
  //   e.preventDefault()
  //   setLoading(true)
  //   try {
  //     const res = await api.createKalam(kalamUnderDraft);
  //     loadWriterKalams()
  //     alert("Kalam submitted!")
  //     // router.push("/")
  //     setActiveTab("archives")
  //   } catch (err: any) {
  //     alert(err.response?.data?.error || err.message);
  //   }
  //   finally {
  //     setLoading(false)
  //   }
  // };

  const handleUpdateStatus = async (kalam: Kalam, status: string) => {
  if (!kalam) return;

  try {
    await api.updateKalamStatus(
      kalam.id,
      status,
      null
    );

    alert("Status updated");

    setKalam(null);
    setContentModal(false);

    loadWriterKalams(); // refresh table
  } catch (err: any) {
    alert(err.response?.data?.error || err.message);
  }
};

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {

      if (editingKalam) {
        await api.updateKalam(editingKalam.id, kalamUnderDraft);
        alert("Kalam updated!");
        setEditingKalam(null);
      } else {
        await api.createKalam(kalamUnderDraft);
        alert("Kalam submitted!");
      }

      loadWriterKalams();
      setActiveTab("archives");

    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setkalamUnderDraft(prev => ({
      ...prev,
      [name]: value
    }))

  }
  const unreadCount = notifications.filter(n => !n.read).length;
  //   const handleCheckboxChange = (value: string) => {
  //   setKalam(prev => ({
  //     ...prev,
  //     writing_styles: prev.writing_styles.includes(value)
  //       ? prev.writing_styles.filter(s => s !== value)
  //       : [...prev.writing_styles, value],
  //   }));
  // };
  return (
    <Layout>
      <PageContainer>
        <div className="py-16">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">My Dashboard</h1>
              <p className="text-neutral-400">
                Track your submissions and view notifications
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 mb-8 border-b border-neutral-800">
              <button
                onClick={() => setActiveTab('submissions')}
                className={`pb-4 px-4 font-semibold transition-colors relative ${activeTab === 'submissions'
                  ? 'text-white'
                  : 'text-neutral-400 hover:text-neutral-300'
                  }`}
              >
                <FileText className="w-5 h-5 inline-block mr-2" />
                My Submissions
                {activeTab === 'submissions' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('archives')}
                className={`pb-4 px-4 font-semibold transition-colors relative ${activeTab === 'archives'
                  ? 'text-white'
                  : 'text-neutral-400 hover:text-neutral-300'
                  }`}
              >
                {/* <Bell className="w-5 h-5 inline-block mr-2" /> */}
                <FileText className="w-5 h-5 inline-block mr-2" />
                Archives

              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="mt-4 text-neutral-400">Loading your dashboard...</p>
              </div>
            ) : (
              <>
                {/* Submissions Tab */}
                {activeTab === 'submissions' && (
                  <div className="space-y-4">
                    {status !== "approved" ? (
                      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-12 text-center">
                        <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Your Writer Profile hasn't approved yet</h3>
                        <p className="text-neutral-400">
                          You can submit your kalam once your profile is approved.
                        </p>

                      </div>
                    ) : (
                      <div>
                        {/* <RichTextEditor /> */}
                        <div className='mb-4'>
                          <div className="flex gap-4 mb-4">
                            <div>
                              <label className="block text-neutral-400 text-xs mb-2">Kalam Writing Style</label>
                              <div className="space-y-2">
                                {writer.writing_styles.map(style => (
                                  <label key={style} className="flex items-center gap-2 text-neutral-300 text-sm">
                                    <input
                                      type="radio"
                                      value={style}
                                      checked={kalamUnderDraft.writing_style === style}
                                      onChange={(e) =>
                                        setkalamUnderDraft({ ...kalamUnderDraft, writing_style: e.target.value })
                                      }
                                      className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded"
                                    />
                                    {style}
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-neutral-400 text-xs mb-2">Kalam Language</label>
                              <div className="space-y-2">
                                {writer.languages.map(language => (
                                  <label key={language} className="flex items-center gap-2 text-neutral-300 text-sm">
                                    <input
                                      type="radio"
                                      value={language}
                                      checked={kalamUnderDraft.language === language}
                                      onChange={(e) =>
                                        setkalamUnderDraft({ ...kalamUnderDraft, language: e.target.value })
                                      }
                                      className="lowercase! w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded"
                                    />
                                    {language}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                          <label className="block text-sm font-semibold text-[var(--color-text-primary)]! mb-2">
                            Kalam Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            name='title'
                            value={kalamUnderDraft.title}
                            onChange={handleChange}
                            maxLength={100}
                            className="form-input w-full px-4 py-3 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                            placeholder="The name you wish to your kalam to be called"
                          />
                        </div>
                        <EditorProvider>
                          <Editor name='content' className='border border-white!' value={kalamUnderDraft.content} onChange={handleChange}
                            style={{ minHeight: "300px", maxHeight: "600px", overflowY: "auto" }}
                          >
                          </Editor>
                        </EditorProvider>
                        <div className="flex w-full justify-end">
                          <button className='bg-yellow-400 text-black px-4 py-2 rounded-lg mt-4' onClick={handleSubmit}>
                            {loading ? <Loader className='animate' /> : "Save & Submit"}
                          </button>
                        </div>
                        {/* <button onClick={handleSubmitKalam}>Save</button> */}
                      </div>
                    )}
                  </div>
                )}
                {contentModal && kalam ?
                    <div className="dashboard-modal-overlay">
                      <div className="dashboard-modal">
                        <div className="dashboard-modal-header">
                          <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-[var(--dash-text-primary)]">Kalam Review</h2>
                            <button
                              onClick={() => {
                                // setSelectedKalam(null);
                                // setReviewNotes('');
                                setContentModal(false)
                              }}
                              className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text-secondary)]"
                            >
                              <XCircle className="w-6 h-6" />
                            </button>
                          </div>
                        </div>

                        <div className="dashboard-modal-body overflow-y-scroll scrollbar-hide">
                          <div className="space-y-4">

                            {kalam.revision_notes ?
                              <div>
                                <label className="dashboard-label">
                                  Admin Notes
                                </label>
                                <div className="bg-red-600 rounded p-4 max-h-60 overflow-y-auto border border-[var(--dash-border)]">
                                  <p className="text-[var(--dash-text-primary)] font-arabic text-lg leading-relaxed">
                                    {kalam.revision_notes}
                                  </p>
                                </div>
                              </div>
                              : ""}
                            <div>
                              <label className="dashboard-label">
                                Title
                              </label>
                              <div className="bg-[var(--dash-bg-primary)] rounded p-4 max-h-60 overflow-y-auto border border-[var(--dash-border)]">
                                <p className="text-[var(--dash-text-primary)] font-arabic text-lg leading-relaxed">
                                  {kalam.title}
                                </p>
                              </div>
                            </div>
                            <div>
                              <label className="dashboard-label">
                                Content
                              </label>
                              <div className="bg-[var(--dash-bg-primary)] rounded p-4 max-h-60 overflow-y-auto border border-[var(--dash-border)]">
                                <p className="text-[var(--dash-text-primary)] font-arabic text-lg leading-relaxed">
                                  {kalam.content}
                                </p>
                              </div>
                            </div>

                          </div>
                        </div>

                        <div className="dashboard-modal-footer">
                          <button
                            disabled={kalam.status !== "draft"}
                            onClick={() => handleUpdateStatus(kalam, 'under review')}
                            className="flex-1 disabled:opacity-50 bg-[var(--dash-status-approved)] hover:opacity-90 text-white rounded-lg px-4 py-3 transition-opacity flex items-center justify-center gap-2 font-medium"
                          >
                            {kalam.status === "draft" ? <CheckCircle className="w-5 h-5" /> : ""}
                            {kalam.status === "draft" ? "Submit Kalam" : kalam.status === "under review" ? "Under Review" : "Submitted"}
                          </button>
                          <button
                            disabled={kalam.status !== "draft"}
                            onClick={() => {
                              handleDelete(kalam.id)
                            }}
                            className="flex-1 disabled:opacity-50 dashboard-btn-danger flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-5 h-5" />
                            Delete Kalam
                          </button>
                        </div>
                      </div>
                    </div>
                  

                  : ""}

                {activeTab === 'archives' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                      <thead className="">
                        <tr>
                          <th className="p-3 border">ID</th>
                          <th className="p-3 border">Title</th>
                          {/* <th className="p-3 border">User ID</th> */}
                          {/* <th className="p-3 border">Writer ID</th> */}
                          <th className="p-3 border">Language</th>
                          <th className="p-3 border">Writing Style</th>
                          <th className="p-3 border">Status</th>
                          <th className="p-3 border">Content</th>
                        </tr>
                      </thead>

                      <tbody>
                        {kalams.map((kalam: any) => (
                          <>
                            <tr key={kalam.id} className="text-center">
                              <td className="p-3 border">{kalam.id}</td>
                              <td className="p-3 border">{kalam.title}</td>
                              <td className="p-3 border">{kalam.language}</td>
                              <td className="p-3 border">{kalam.writing_style}</td>
                              <td className="p-3 border capitalize">{kalam.status}</td>
                              <td className="p-3 border flex gap-3 justify-center">
                                <button
                                  onClick={() => handleShowContent(kalam)}
                                  className="bg-blue-500 text-black rounded-lg px-4 py-2"
                                >
                                  View
                                </button>

                                <button
                                  onClick={() => handleEdit(kalam)}
                                  className="bg-yellow-500 text-black rounded-lg px-4 py-2"
                                >
                                  Edit
                                </button>



                              </td>
                            </tr>





                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </PageContainer>
    </Layout>
  );
}
