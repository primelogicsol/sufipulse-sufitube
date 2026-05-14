"use client";

import { useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

import { LyricsStructureSection } from '../lyrics-structure-section';
import { useReleaseForm } from '../use-release-form';
import DashboardLayout from '../../../../components/layout/DashboardLayout';

export default function LyricsEditorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const releaseId = params.id as string;
  const isAdmin = user?.role.includes('admin') ?? false;

  useEffect(() => {
    if (!isAdmin) router.push('/admin');
  }, [user]);

  const isNew = releaseId === 'new';

  const {
    form,
    loading, notFound,
    saving,
    hasUnsavedChanges,
    errorMessage, setErrorMessage,
    successMessage, setSuccessMessage,
    selectedLyricsStructureLanguage, setSelectedLyricsStructureLanguage,
    getLyricsBlocks,
    addLyricsBlock,
    updateLyricsBlock,
    removeLyricsBlock,
    getLanguageLabel,
    handleSave,
  } = useReleaseForm({
    releaseId,
    isNew,
    ready: isAdmin,
    onNavigate: (path) => router.push(path),
  });

  if (!isAdmin) return <DashboardLayout><div className="p-8 text-center">Unauthorized</div></DashboardLayout>;

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-24">
        <div className="text-sm" style={{ color: 'var(--dash-text-muted)' }}>Loading lyrics editor…</div>
      </div>
    </DashboardLayout>
  );

  if (notFound) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-lg font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Release not found</p>
        <Link href="/admin/cms-releases">
          <button className="dashboard-btn-primary px-5 py-2 rounded-lg text-sm font-medium">Back to Releases</button>
        </Link>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/admin/cms-releases/${releaseId}`} className="shrink-0 p-2 rounded-lg transition hover:opacity-70" style={{ backgroundColor: 'var(--dash-bg-secondary)', color: 'var(--dash-text-secondary)' }}>
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate" style={{ color: 'var(--dash-text-primary)' }}>
                Lyrics Editor
              </h1>
              {form.title && (
                <p className="text-sm truncate" style={{ color: 'var(--dash-text-muted)' }}>{form.title}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !hasUnsavedChanges}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg transition font-medium disabled:opacity-60 shrink-0 ${hasUnsavedChanges ? 'dashboard-btn-primary' : 'dashboard-btn-secondary'}`}
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Lyrics'}
          </button>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg text-sm flex items-start justify-between gap-2" style={{ backgroundColor: 'var(--dash-status-rejected-bg)', color: 'var(--dash-status-rejected)', border: '1px solid var(--dash-status-rejected)' }}>
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} className="shrink-0 font-bold">✕</button>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded-lg text-sm flex items-start justify-between gap-2" style={{ backgroundColor: 'var(--dash-status-approved-bg)', color: 'var(--dash-status-approved)', border: '1px solid var(--dash-status-approved)' }}>
            <span>{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} className="shrink-0 font-bold">✕</button>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); void handleSave(); }}>
          <LyricsStructureSection
            form={form}
            selectedLyricsStructureLanguage={selectedLyricsStructureLanguage}
            setSelectedLyricsStructureLanguage={setSelectedLyricsStructureLanguage}
            addLyricsBlock={addLyricsBlock}
            updateLyricsBlock={updateLyricsBlock}
            removeLyricsBlock={removeLyricsBlock}
            getLyricsBlocks={getLyricsBlocks}
            getLanguageLabel={getLanguageLabel}
          />
        </form>

      </div>
    </DashboardLayout>
  );
}
