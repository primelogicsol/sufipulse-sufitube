"use client";
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Shield, 
  User, 
  Globe, 
  Languages,
  History,
  MessageSquare,
  RefreshCw,
  FileText
} from 'lucide-react';
import Link from 'next/link';

function ApplicationStatusContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id as string;
  const rawToken = searchParams?.get('token');
  const token = rawToken === 'null' ? null : rawToken;
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && token) {
      loadApplication();
    } else if (id && !token) {
      setError('Secure tracking token required for access.');
      setLoading(false);
    }
  }, [id, token]);

  async function loadApplication() {
    try {
      setLoading(true);
      const res = await fetch(`/api/applications/${id}?token=${token}`);
      if (res.status === 403) throw new Error('Access denied: Invalid or missing tracking token.');
      if (!res.ok) throw new Error('Application record not found in registry.');
      const data = await res.json();
      setApp(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const timeline = [
    { key: 'submitted', label: 'Submitted', icon: Clock },
    { key: 'registry_validation', label: 'Registry Validation', icon: Shield },
    { key: 'editorial_screening', label: 'Editorial Screening', icon: EyeIcon },
    { key: 'linguistic_review', label: 'Linguistic & Thematic Review', icon: BookOpenIcon },
    { key: 'governance_alignment', label: 'Governance Alignment Review', icon: ShieldCheckIcon },
    { key: 'decision', label: 'Decision', icon: CheckCircle2 }
  ];

  function EyeIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>;
  }

  function BookOpenIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
  }

  function ShieldCheckIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>;
  }

  const getStatusIndex = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'approved_as_writer') return 5;
    if (s === 'rejected' || s === 'archived') return 5;
    if (s === 'under_editorial_review') return 3;
    if (s === 'revision_requested') return 3;
    if (s === 'pending_review') return 1;
    return 0;
  };

  if (loading) {
    return (
      <div className="py-32 text-center">
        <RefreshCw className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-4" />
        <p className="text-neutral-500 font-medium">Fetching Registry Records...</p>
      </div>
    );
  }

  if (error || !app) {
    const isAccessDenied = error?.toLowerCase().includes('token') || error?.toLowerCase().includes('denied');
    return (
      <div className="py-32 text-center max-w-md mx-auto">
        {isAccessDenied ? (
          <Shield className="w-16 h-16 text-amber-500/50 mx-auto mb-6" />
        ) : (
          <AlertCircle className="w-16 h-16 text-red-500/50 mx-auto mb-6" />
        )}
        <h1 className="text-2xl font-bold text-white mb-4">
          {isAccessDenied ? 'Registry Access Denied' : 'Registry Record Not Found'}
        </h1>
        <p className="text-neutral-400 mb-8">
          {error || "The application reference provided does not match any current institutional intake record."}
        </p>
        <Link href="/writers">
          <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/5 uppercase text-xs font-bold tracking-widest">
            Return to Registry Portal
          </button>
        </Link>
      </div>
    );
  }


  const statusIdx = getStatusIndex(app.status);
  const isApproved = app.status === 'approved' || app.status === 'approved_as_writer';
  const isRevision = app.status === 'revision_requested';
  const isRejected = app.status === 'rejected' || app.status === 'archived';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/10 pb-8">
        <div>
          <Badge variant="gold" className="mb-4">Status Monitoring</Badge>
          <h1 className="text-3xl font-bold text-white mb-2">Application Progress</h1>
          <p className="text-neutral-500 font-mono text-sm tracking-widest uppercase">{app.id}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Current Standing</p>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
            isApproved ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            isRevision ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
            isRejected ? 'bg-red-500/10 border-red-500/20 text-red-400' :
            'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isApproved ? 'bg-emerald-500' : 
              isRevision ? 'bg-orange-500' : 
              isRejected ? 'bg-red-500' : 
              'bg-amber-500 animate-pulse'
            }`} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {app.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6">
            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-6">Applicant Data</h3>
            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-[10px] text-neutral-600 uppercase font-bold tracking-widest mb-1">
                  <User size={12} className="text-amber-400" /> Full Name
                </label>
                <p className="text-sm text-white font-medium">{app.fullName}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-[10px] text-neutral-600 uppercase font-bold tracking-widest mb-1">
                  <Globe size={12} className="text-blue-400" /> Location
                </label>
                <p className="text-sm text-white font-medium">{app.country}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-[10px] text-neutral-600 uppercase font-bold tracking-widest mb-1">
                  <Languages size={12} className="text-pink-400" /> Languages
                </label>
                <p className="text-sm text-white font-medium">
                  {Array.isArray(app.primaryLanguages) ? app.primaryLanguages.join(', ') : app.primaryLanguages}
                </p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-[10px] text-neutral-600 uppercase font-bold tracking-widest mb-1">
                  <History size={12} className="text-neutral-500" /> Submitted
                </label>
                <p className="text-sm text-white font-medium">
                  {new Date(app.submittedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6">
            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">Mandate Type</h3>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-widest">{app.type}</span>
            </div>
          </div>
        </div>

        {/* Middle & Right Column: Progress & Actions */}
        <div className="md:col-span-2 space-y-8">
          {/* Decision Block */}
          {isApproved && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Approved as Ahl-e-Qalam</h2>
              <p className="text-neutral-400 text-sm mb-8 max-w-md mx-auto">
                Your profile has been formally institutionalized. You may now activate your operational hub to begin kalam submissions.
              </p>
              <Link href="/dashboard/writer">
                <button className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 mx-auto">
                  Go to Writer Dashboard
                  <ArrowRight size={14} />
                </button>
              </Link>
            </div>
          )}

          {isRevision && (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Revision Required</h2>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mt-1">Majlis-e-Nazr Feedback</p>
                </div>
              </div>
              <div className="bg-neutral-950 border border-white/5 rounded-xl p-6 mb-8 italic text-neutral-300 text-sm leading-relaxed">
                &ldquo;{app.adminNote || "Please review your sample kalam for thematic alignment with our institutional framework."}&rdquo;
              </div>
              <Link href={`/writers/apply?ref=${app.id}&token=${token}`}>
                <button className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                  <RefreshCw size={14} />
                  Submit Revised Profile
                </button>
              </Link>
            </div>
          )}

          {isRejected && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500/30 mx-auto mb-6" />
              <h2 className="text-xl font-bold text-white mb-2">Not Approved at This Stage</h2>
              <p className="text-neutral-400 text-sm max-w-md mx-auto leading-relaxed">
                Your submission was reviewed by the editorial board but not selected for current institutional consideration. We appreciate your interest in the Ahl-e-Qalam framework.
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-8">Intake Timeline</h3>
            <div className="space-y-0">
              {timeline.map((step, idx) => {
                const isPast = idx < statusIdx;
                const isCurrent = idx === statusIdx && !isApproved && !isRejected;
                const isComplete = idx === statusIdx && (isApproved || isRejected);
                const Icon = step.icon;

                return (
                  <div key={step.key} className="relative flex gap-6 pb-8 last:pb-0">
                    {idx < timeline.length - 1 && (
                      <div className={`absolute left-[11px] top-8 bottom-0 w-[2px] ${isPast ? 'bg-amber-400' : 'bg-neutral-800'}`} />
                    )}
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isPast || isComplete ? 'bg-amber-400 border-amber-400' : 
                      isCurrent ? 'bg-amber-400/20 border-amber-400' : 
                      'bg-neutral-900 border-neutral-800'
                    }`}>
                      {isPast || isComplete ? (
                        <Check size={10} className="text-black stroke-[4]" />
                      ) : (
                        <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-amber-400 animate-pulse' : 'bg-neutral-700'}`} />
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isPast || isComplete || isCurrent ? 'text-white' : 'text-neutral-600'}`}>
                        <Icon size={12} className={isPast || isComplete || isCurrent ? 'text-amber-400' : 'text-neutral-700'} />
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-[10px] text-amber-400/70 mt-1 font-medium">Phase in progress...</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationStatus() {
  return (
    <Layout>
      <Section background="midnight" spacing="spacious">
        <PageContainer>
          <Suspense fallback={
            <div className="py-32 text-center flex flex-col items-center gap-4">
              <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
              <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Accessing Registry...</p>
            </div>
          }>
            <ApplicationStatusContent />
          </Suspense>
        </PageContainer>
      </Section>
    </Layout>
  );
}

function Check(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
