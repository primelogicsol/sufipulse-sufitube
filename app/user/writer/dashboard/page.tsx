"use client";
import { useEffect, useState } from 'react';
import DOMPurify from "dompurify";
// import { supabase } from '../lib/supabase';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Bell, FileText, Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Eye, Loader, Settings, Search, User } from 'lucide-react';
import * as api from "../../../api/auth"
// import { WriterFormData } from '@/app/components/writers/WriterCredentialsForm';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RichTextEditor from "../../../components/ui/RichTextEditor"
// import { BtnBold, BtnClearFormatting, BtnItalic, Editor, EditorProvider, Toolbar } from 'react-simple-wysiwyg';
import Editor, {
  EditorProvider,
} from "react-simple-wysiwyg";
import UserDashboard from '@/app/components/dashboard/UserDashboard';
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
  revision_notes?: string;
  created_at?: any;
  updated_at?: any;
}

export interface Sada {
  title: string;
  user_id: string;
  id: string;
  vocalist_id: string;
  status: string;
  language: string;
  singing_style: string;
  link: string;
  revision_notes?: string;
  created_at?: any;
  updated_at?: any;
}

export default function UserDashboardWriter() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, profileStatus } = useAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'submissions' | 'my-content' | 'published'>('submissions');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [myContentSearch, setMyContentSearch] = useState('');
  const [myContentDate, setMyContentDate] = useState('');
  const [publishedSearch, setPublishedSearch] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
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
  // const [writerProfile,setWriterProfile] = useState()
  const [error, setError] = useState('');
  const router = useRouter()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      alert("Please fill all fields");
      return;
    }
    setPasswordLoading(true);
    try {
      await api.updatePassword(currentPassword, newPassword);
      alert("Password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved' || statusLower === 'published') return 'text-green-400';
    if (statusLower === 'rejected' || statusLower === 'declined') return 'text-red-400';
    if (statusLower === 'under_review') return 'text-blue-400';
    if (statusLower === 'revision_requested') return 'text-yellow-400';
    return 'text-neutral-400';
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved' || statusLower === 'published') return <CheckCircle className="w-5 h-5" />;
    if (statusLower === 'rejected' || statusLower === 'declined') return <XCircle className="w-5 h-5" />;
    if (statusLower === 'under_review') return <Eye className="w-5 h-5" />;
    if (statusLower === 'revision_requested') return <AlertCircle className="w-5 h-5" />;
    return <Clock className="w-5 h-5" />;
  };

  const formatSubmissionType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const [writer, setWriter] = useState({
    languages: [],
    writing_styles: [],
  })
  const [vocalist, setVocalist] = useState({
    languages_performed: [],
    performance_styles: [],
  })
  const [sadas, setSadas] = useState<Sada[]>([])
  const [sadaUnderDraft, setSadaUnderDraft] = useState({
    title: "",
    link: "",
    performance_style: "",
    language: "",
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
  const loadWriterProfile = async () => {
    try {
      const res: any = await api.readWriterProfile();
      // console.log(res)
      setStatus(res.data.profile_status)
      setWriter({
        languages: res.data.primary_languages,
        writing_styles: res.data.writing_styles
      })
    } catch (error) {
      console.log(error)
    }
  }
  const loadVocalistProfile = async () => {
    try {
      const res: any = await api.readVocalistProfile();
      // console.log(res)
      setStatus(res.data.status)
      setVocalist({
        languages_performed: res.data.primary_languages,
        performance_styles: res.data.performance_styles
      })
    } catch (error) {
      console.log(error)
    }
  }
  useEffect(() => {

    loadWriterProfile()
    loadWriterKalams()
    loadVocalistProfile()
    // loadWriterKalams()
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
      setActiveTab("my-content");

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
    // <Layout>
    //   <PageContainer>
    //     <div className="py-16">
    //       <div className="max-w-7xl mx-auto">
    //         <div className="mb-8">
    //           <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
    //           <p className="text-neutral-400 text-sm">
    //             Track your submissions and view notifications
    //           </p>
    //         </div>
    //         <div className="flex flex-col md:flex-row gap-8">
    //           {/* Sidebar Navigation */}
    //           <div className="w-full md:w-64 flex-shrink-0">

    //             <div className="flex flex-col gap-2">
    //               <button
    //                 onClick={() => setActiveTab('settings')}
    //                 className={`flex items-center w-full px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'settings'
    //                   ? 'bg-neutral-800 text-white shadow-sm'
    //                   : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
    //                   }`}
    //               >
    //                 <Settings className="w-5 h-5 mr-3" />
    //                 General Settings
    //               </button>
    //               <button
    //                 onClick={() => setActiveTab('submissions')}
    //                 className={`flex items-center w-full px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'submissions'
    //                   ? 'bg-neutral-800 text-white shadow-sm'
    //                   : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
    //                   }`}
    //               >
    //                 <FileText className="w-5 h-5 mr-3" />
    //                 Submissions
    //               </button>
    //               <button
    //                 onClick={() => setActiveTab('my-content')}
    //                 className={`flex items-center w-full px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'my-content'
    //                   ? 'bg-neutral-800 text-white shadow-sm'
    //                   : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
    //                   }`}
    //               >
    //                 <FileText className="w-5 h-5 mr-3" />
    //                 My Content
    //               </button>
    //               <button
    //                 onClick={() => setActiveTab('published')}
    //                 className={`flex items-center w-full px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'published'
    //                   ? 'bg-neutral-800 text-white shadow-sm'
    //                   : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
    //                   }`}
    //               >
    //                 <CheckCircle className="w-5 h-5 mr-3" />
    //                 Published
    //               </button>
    //             </div>
    //           </div>

    //           {/* Main Content Area */}
    //           <div className="flex-1 min-w-0">
    //             {loading ? (
    //               <div className="text-center py-12 bg-neutral-900/30 rounded-2xl border border-neutral-800/50 h-full flex flex-col items-center justify-center min-h-[400px]">
    //                 <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    //                 <p className="mt-4 text-neutral-400">Loading your dashboard...</p>
    //               </div>
    //             ) : (
    //               <div className="bg-neutral-900/40 rounded-3xl border border-neutral-800/50 p-6 md:p-8 min-h-[500px]">
    //                 {/* Settings Tab */}
    //                 {activeTab === 'settings' && (
    //                   <div className="max-w-md bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
    //                     <h3 className="text-xl font-semibold text-white mb-6">Update Password</h3>
    //                     <form onSubmit={handleUpdatePassword} className="space-y-4">
    //                       <div>
    //                         <label className="block text-sm font-semibold text-neutral-300 mb-2">Current Password</label>
    //                         <input
    //                           type="password"
    //                           required
    //                           value={currentPassword}
    //                           onChange={(e) => setCurrentPassword(e.target.value)}
    //                           className="w-full px-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white"
    //                           placeholder="••••••••"
    //                         />
    //                       </div>
    //                       <div>
    //                         <label className="block text-sm font-semibold text-neutral-300 mb-2">New Password</label>
    //                         <input
    //                           type="password"
    //                           required
    //                           value={newPassword}
    //                           onChange={(e) => setNewPassword(e.target.value)}
    //                           className="w-full px-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white"
    //                           placeholder="••••••••"
    //                         />
    //                       </div>
    //                       <button type="submit" disabled={passwordLoading} className="w-full bg-yellow-400 text-black font-semibold px-4 py-3 rounded-lg mt-4 disabled:opacity-50">
    //                         {passwordLoading ? <Loader className='animate-spin mx-auto' /> : "Update Password"}
    //                       </button>
    //                     </form>
    //                   </div>
    //                 )}

    //                 {/* Submissions Tab */}
    //                 {activeTab === 'submissions' && (
    //                   <div className="space-y-4">
    //                     {status !== "approved" && writer.languages.length === 0 ? (
    //                       <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-12 text-center">
    //                         <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
    //                         <h3 className="text-xl font-semibold text-white mb-2">Your Writer Profile hasn't approved yet</h3>
    //                         <p className="text-neutral-400">
    //                           You can submit your kalam once your profile is approved.
    //                         </p>
    //                       </div>
    //                     ) : (
    //                       <div>
    //                         {/* <RichTextEditor /> */}
    //                         <div className='mb-4'>
    //                           <div className="flex gap-4 mb-4">
    //                             <div>
    //                               <label className="block text-neutral-400 text-xs mb-2">Kalam Writing Style</label>
    //                               <div className="space-y-2">
    //                                 {writer.writing_styles.map(style => (
    //                                   <label key={style} className="flex items-center gap-2 text-neutral-300 text-sm">
    //                                     <input
    //                                       type="radio"
    //                                       value={style}
    //                                       checked={kalamUnderDraft.writing_style === style}
    //                                       onChange={(e) =>
    //                                         setkalamUnderDraft({ ...kalamUnderDraft, writing_style: e.target.value })
    //                                       }
    //                                       className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded"
    //                                     />
    //                                     {style}
    //                                   </label>
    //                                 ))}
    //                               </div>
    //                             </div>
    //                             <div>
    //                               <label className="block text-neutral-400 text-xs mb-2">Kalam Language</label>
    //                               <div className="space-y-2">
    //                                 {writer.languages.map(language => (
    //                                   <label key={language} className="flex items-center gap-2 text-neutral-300 text-sm">
    //                                     <input
    //                                       type="radio"
    //                                       value={language}
    //                                       checked={kalamUnderDraft.language === language}
    //                                       onChange={(e) =>
    //                                         setkalamUnderDraft({ ...kalamUnderDraft, language: e.target.value })
    //                                       }
    //                                       className="lowercase! w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded"
    //                                     />
    //                                     {language}
    //                                   </label>
    //                                 ))}
    //                               </div>
    //                             </div>
    //                           </div>
    //                           <label className="block text-sm font-semibold text-[var(--color-text-primary)]! mb-2">
    //                             Kalam Title <span className="text-red-500">*</span>
    //                           </label>
    //                           <input
    //                             type="text"
    //                             required
    //                             name='title'
    //                             value={kalamUnderDraft.title}
    //                             onChange={handleChange}
    //                             maxLength={100}
    //                             className="form-input w-full px-4 py-3 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)]"
    //                             placeholder="The name you wish to your kalam to be called"
    //                           />
    //                         </div>
    //                         <EditorProvider>
    //                           <Editor name='content' className='border border-white!' value={kalamUnderDraft.content} onChange={handleChange}
    //                             style={{ minHeight: "300px", maxHeight: "600px", overflowY: "auto" }}
    //                           >
    //                           </Editor>
    //                         </EditorProvider>
    //                         <div className="flex w-full justify-end">
    //                           <button className='bg-yellow-400 text-black px-4 py-2 rounded-lg mt-4' onClick={handleSubmit}>
    //                             {loading ? <Loader className='animate' /> : "Save & Submit"}
    //                           </button>
    //                         </div>
    //                         {/* <button onClick={handleSubmitKalam}>Save</button> */}
    //                       </div>
    //                     )}


    //                   </div>
    //                 )}

    //                 {/* Archive Tab */}

    //                 {contentModal && kalam ?
    //                   <div className="dashboard-modal-overlay">
    //                     <div className="dashboard-modal">
    //                       <div className="dashboard-modal-header">
    //                         <div className="flex items-center justify-between">
    //                           <h2 className="text-2xl font-bold text-[var(--dash-text-primary)]">Kalam Review</h2>
    //                           <button
    //                             onClick={() => {
    //                               // setSelectedKalam(null);
    //                               // setReviewNotes('');
    //                               setContentModal(false)
    //                             }}
    //                             className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text-secondary)]"
    //                           >
    //                             <XCircle className="w-6 h-6" />
    //                           </button>
    //                         </div>
    //                       </div>

    //                       <div className="dashboard-modal-body overflow-y-scroll scrollbar-hide">
    //                         <div className="space-y-4">

    //                           {kalam.revision_notes ?
    //                             <div>
    //                               <label className="dashboard-label">
    //                                 Admin Notes
    //                               </label>
    //                               <div className="bg-red-600 rounded p-4 max-h-60 overflow-y-auto border border-[var(--dash-border)]">
    //                                 <p className="text-[var(--dash-text-primary)] font-arabic text-lg leading-relaxed">
    //                                   {kalam.revision_notes}
    //                                 </p>
    //                               </div>
    //                             </div>
    //                             : ""}
    //                           <div>
    //                             <label className="dashboard-label">
    //                               Title
    //                             </label>
    //                             <div className="bg-[var(--dash-bg-primary)] rounded p-4 max-h-60 overflow-y-auto border border-[var(--dash-border)]">
    //                               <p className="text-[var(--dash-text-primary)] font-arabic text-lg leading-relaxed">
    //                                 {kalam.title}
    //                               </p>
    //                             </div>
    //                           </div>
    //                           <div>
    //                             <label className="dashboard-label">
    //                               Content
    //                             </label>
    //                             <div className="bg-[var(--dash-bg-primary)] rounded p-4 max-h-60 overflow-y-auto border border-[var(--dash-border)]">
    //                               <p className="text-[var(--dash-text-primary)] font-arabic text-lg leading-relaxed">
    //                                 {kalam.content}
    //                               </p>
    //                             </div>
    //                           </div>

    //                         </div>
    //                       </div>

    //                       <div className="dashboard-modal-footer">
    //                         <button
    //                           disabled={kalam.status !== "draft"}
    //                           onClick={() => handleUpdateStatus(kalam, 'under review')}
    //                           className="flex-1 disabled:opacity-50 bg-[var(--dash-status-approved)] hover:opacity-90 text-white rounded-lg px-4 py-3 transition-opacity flex items-center justify-center gap-2 font-medium"
    //                         >
    //                           {kalam.status === "draft" ? <CheckCircle className="w-5 h-5" /> : ""}
    //                           {kalam.status === "draft" ? "Submit Kalam" : kalam.status === "under review" ? "Under Review" : "Submitted"}
    //                         </button>
    //                         <button
    //                           disabled={kalam.status !== "draft"}
    //                           onClick={() => {
    //                             handleDelete(kalam.id)
    //                           }}
    //                           className="flex-1 disabled:opacity-50 dashboard-btn-danger flex items-center justify-center gap-2"
    //                         >
    //                           <XCircle className="w-5 h-5" />
    //                           Delete Kalam
    //                         </button>
    //                       </div>
    //                     </div>
    //                   </div>
    //                   : ""}

    //                 {activeTab === 'my-content' && writer.languages.length > 0 && (
    //                   <div className="space-y-6">
    //                     <div className="flex flex-wrap gap-4 items-center">
    //                       <div className="relative flex-1 min-w-[200px]">
    //                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
    //                         <input
    //                           type="text"
    //                           placeholder="Search unpublished kalams..."
    //                           value={myContentSearch}
    //                           onChange={(e) => setMyContentSearch(e.target.value)}
    //                           className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white"
    //                         />
    //                       </div>
    //                       <div className="w-48">
    //                         <input
    //                           type="date"
    //                           value={myContentDate}
    //                           onChange={(e) => setMyContentDate(e.target.value)}
    //                           className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white"
    //                           style={{ colorScheme: 'dark' }}
    //                         />
    //                       </div>
    //                     </div>
    //                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    //                       {kalams.filter(k => k.status !== "published" && (!myContentSearch || k.title.toLowerCase().includes(myContentSearch.toLowerCase())) && (!myContentDate || (k.created_at && new Date(k.created_at).toISOString().split('T')[0] === myContentDate))).length > 0 ? (
    //                         kalams.filter(k => k.status !== "published" && (!myContentSearch || k.title.toLowerCase().includes(myContentSearch.toLowerCase())) && (!myContentDate || (k.created_at && new Date(k.created_at).toISOString().split('T')[0] === myContentDate))).map((kalam: any) => (
    //                           <div key={kalam.id} className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-all flex flex-col h-full relative group shadow-lg">
    //                             <div className="flex justify-between items-start mb-4">
    //                               <h3 className="text-xl font-bold text-white line-clamp-2">{kalam.title}</h3>
    //                               <span className={`px-2.5 py-1 text-xs rounded-full font-semibold whitespace-nowrap ml-3 ${getStatusColor(kalam.status)} bg-opacity-10`}>
    //                                 {kalam.status}
    //                               </span>
    //                             </div>

    //                             <div className="space-y-2 mb-6 flex-1">
    //                               <div className="flex items-center text-sm text-neutral-400">
    //                                 <span className="w-24">Language:</span>
    //                                 <span className="text-neutral-200 capitalize font-medium">{kalam.language}</span>
    //                               </div>
    //                               <div className="flex items-center text-sm text-neutral-400">
    //                                 <span className="w-24">Style:</span>
    //                                 <span className="text-neutral-200 capitalize font-medium">{kalam.writing_style}</span>
    //                               </div>
    //                               <div className="flex items-center text-sm text-neutral-500 mt-2">
    //                                 <span className="w-24">ID:</span>
    //                                 <span className="truncate">{kalam.id}</span>
    //                               </div>
    //                             </div>

    //                             <div className="flex gap-3 pt-4 border-t border-neutral-800/50 mt-auto">
    //                               <button
    //                                 onClick={() => handleShowContent(kalam)}
    //                                 className="flex-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 py-2 rounded-lg text-sm font-semibold transition-colors"
    //                               >
    //                                 View
    //                               </button>
    //                               <button
    //                                 onClick={() => handleEdit(kalam)}
    //                                 className="flex-1 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 py-2 rounded-lg text-sm font-semibold transition-colors"
    //                               >
    //                                 Edit
    //                               </button>
    //                             </div>
    //                           </div>
    //                         ))
    //                       ) : (
    //                         <div className="col-span-full p-8 text-center text-neutral-500 border border-neutral-800 rounded-xl bg-neutral-900/50">
    //                           No matching kalams found.
    //                         </div>
    //                       )}
    //                     </div>
    //                   </div>
    //                 )}

    //                 {activeTab === 'published' && writer.languages.length > 0 && (
    //                   <div className="space-y-6">
    //                     <div className="flex flex-wrap gap-4 items-center">
    //                       <div className="relative flex-1 min-w-[200px]">
    //                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
    //                         <input
    //                           type="text"
    //                           placeholder="Search published kalams..."
    //                           value={publishedSearch}
    //                           onChange={(e) => setPublishedSearch(e.target.value)}
    //                           className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white"
    //                         />
    //                       </div>
    //                       <div className="w-48">
    //                         <input
    //                           type="date"
    //                           value={publishedDate}
    //                           onChange={(e) => setPublishedDate(e.target.value)}
    //                           className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white"
    //                           style={{ colorScheme: 'dark' }}
    //                         />
    //                       </div>
    //                     </div>
    //                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    //                       {kalams.filter(k => k.status === "published" && (!publishedSearch || k.title.toLowerCase().includes(publishedSearch.toLowerCase())) && (!publishedDate || (k.created_at && new Date(k.created_at).toISOString().split('T')[0] === publishedDate))).length > 0 ? (
    //                         kalams.filter(k => k.status === "published" && (!publishedSearch || k.title.toLowerCase().includes(publishedSearch.toLowerCase())) && (!publishedDate || (k.created_at && new Date(k.created_at).toISOString().split('T')[0] === publishedDate))).map((kalam: any) => (
    //                           <div key={kalam.id} className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-all flex flex-col h-full relative group shadow-lg">
    //                             <div className="flex justify-between items-start mb-4">
    //                               <h3 className="text-xl font-bold text-white line-clamp-2">{kalam.title}</h3>
    //                               <span className={`px-2.5 py-1 text-xs rounded-full font-semibold whitespace-nowrap ml-3 ${getStatusColor(kalam.status)} bg-opacity-10`}>
    //                                 {kalam.status}
    //                               </span>
    //                             </div>

    //                             <div className="space-y-2 mb-6 flex-1">
    //                               <div className="flex items-center text-sm text-neutral-400">
    //                                 <span className="w-24">Language:</span>
    //                                 <span className="text-neutral-200 capitalize font-medium">{kalam.language}</span>
    //                               </div>
    //                               <div className="flex items-center text-sm text-neutral-400">
    //                                 <span className="w-24">Style:</span>
    //                                 <span className="text-neutral-200 capitalize font-medium">{kalam.writing_style}</span>
    //                               </div>
    //                               <div className="flex items-center text-sm text-neutral-500 mt-2">
    //                                 <span className="w-24">ID:</span>
    //                                 <span className="truncate">{kalam.id.substring(0, 8)}...</span>
    //                               </div>
    //                             </div>

    //                             <div className="flex gap-3 pt-4 border-t border-neutral-800/50 mt-auto">
    //                               <button
    //                                 onClick={() => handleShowContent(kalam)}
    //                                 className="flex-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 py-2 rounded-lg text-sm font-semibold transition-colors"
    //                               >
    //                                 View
    //                               </button>
    //                               <button
    //                                 onClick={() => handleEdit(kalam)}
    //                                 className="flex-1 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 py-2 rounded-lg text-sm font-semibold transition-colors"
    //                               >
    //                                 Edit
    //                               </button>
    //                             </div>
    //                           </div>
    //                         ))
    //                       ) : (
    //                         <div className="col-span-full p-8 text-center text-neutral-500 border border-neutral-800 rounded-xl bg-neutral-900/50">
    //                           No matching kalams found.
    //                         </div>
    //                       )}
    //                     </div>
    //                   </div>
    //                 )}
    //               </div>
    //             )}
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   </PageContainer>
    // </Layout>
    <UserDashboard role='writer' />
  );
}
