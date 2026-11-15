"use client";

import type { CMSRelease } from '@/lib/cms-storage';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Props = {
  form: Partial<CMSRelease>;
  updatePublicCredits: (
    section: 'artistic' | 'production' | 'visual' | 'literary' | 'rights',
    field: string,
    value: string
  ) => void;
  setForm?: React.Dispatch<React.SetStateAction<Partial<CMSRelease>>>;
};

export function ReleaseCreditsSection({ form, updatePublicCredits, setForm }: Props) {
  const [writers, setWriters] = useState<any[]>([]);
  const [creditLibrary, setCreditLibrary] = useState<{
    sources: Array<{ id: string; title: string; youtubeId: string; credits: Record<string, Record<string, string>> }>;
    options: Record<string, Record<string, string[]>>;
    creditedReleases: number;
    nextRegisteredReleaseId?: string;
  }>({ sources: [], options: {}, creditedReleases: 0 });
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [creditLibraryError, setCreditLibraryError] = useState('');

  useEffect(() => {
    fetch('/api/admin/credit-library', { cache: 'no-store' })
      .then(async res => {
        if (!res.ok) throw new Error('Could not load existing CMS release credits');
        return res.json();
      })
      .then(data => {
        setCreditLibrary(data);
        const legacyRights = (form as any).releaseRights || {};
        const currentRegId = (form.publicCredits as any)?.rights?.registeredReleaseId || legacyRights.registeredReleaseId;
        if (!currentRegId && data.nextRegisteredReleaseId) {
          updatePublicCredits('rights', 'registeredReleaseId', data.nextRegisteredReleaseId);
        }
      })
      .catch(err => setCreditLibraryError(err.message));
  }, []);

  const applySourceCredits = () => {
    const source = creditLibrary.sources.find(item => item.id === selectedSourceId);
    if (!source || !setForm) return;
    if (!window.confirm('Copy existing credits from ' + source.title + '? This will replace matching credit fields on the current release. Verify every attribution before saving.')) return;
    setForm(prev => {
      const updated: Record<string, any> = { ...(prev.publicCredits || {}) };
      for (const section of ['artistic', 'production', 'visual', 'literary', 'rights']) {
        const sourceFields = { ...(source.credits?.[section] || {}) };
        // Release-specific IDs and dates must not be copied between different videos.
        if (section === 'rights' && source.id !== prev.id) {
          delete sourceFields.registeredReleaseId;
          delete sourceFields.releaseDate;
          delete sourceFields.releaseDateText;
        }
        updated[section] = { ...(updated[section] || {}), ...sourceFields };
      }
      return { ...prev, publicCredits: updated as CMSRelease['publicCredits'] };
    });
  };

  const creditInput = (section: 'artistic' | 'production' | 'visual' | 'literary' | 'rights', key: string, label: string) => {
    if (key === 'registeredReleaseId') {
      const legacyRights = (form as any).releaseRights || {};
      const value = String((form.publicCredits as any)?.rights?.registeredReleaseId ?? legacyRights.registeredReleaseId ?? '');
      const existingIds = creditLibrary.options?.rights?.registeredReleaseId || [];
      const isDuplicate = value && existingIds.includes(value) && creditLibrary.sources.some(s => s.id !== form.id && s.credits?.rights?.registeredReleaseId === value);
      const nextId = creditLibrary.nextRegisteredReleaseId || 'SP-KS-2026-023';

      return (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium" style={{ color: 'var(--dash-text-muted)' }}>{label}</label>
            <button
              type="button"
              onClick={() => updatePublicCredits('rights', 'registeredReleaseId', nextId)}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
            >
              Auto-Assign ({nextId})
            </button>
          </div>
          <input
            className="form-input w-full font-mono text-sm"
            placeholder={nextId}
            value={value}
            onChange={e => updatePublicCredits('rights', 'registeredReleaseId', e.target.value)}
          />
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/40">Canonical format: SP-KS-YYYY-NNN</span>
            {isDuplicate ? (
              <span className="text-rose-400 font-bold">Duplicate ID detected</span>
            ) : value ? (
              <span className="text-emerald-400 font-medium">Unique ID assigned</span>
            ) : null}
          </div>
        </div>
      );
    }

    if (key === 'releaseDateText') {
      const legacyRights = (form as any).releaseRights || {};
      const rawVal = String((form.publicCredits as any)?.rights?.releaseDateText ?? legacyRights.releaseDate ?? form.releaseDate ?? '');
      const dateVal = rawVal ? rawVal.slice(0, 10) : '';

      return (
        <div key={key} className="space-y-1">
          <label className="block text-xs font-medium" style={{ color: 'var(--dash-text-muted)' }}>{label}</label>
          <div className="flex gap-2">
            <input
              type="date"
              className="form-input flex-1"
              value={dateVal}
              onChange={(e) => {
                const val = e.target.value;
                updatePublicCredits('rights', 'releaseDateText', val);
                if (setForm) {
                  setForm((prev) => ({ ...prev, releaseDate: val }));
                }
              }}
            />
            {dateVal && (
              <button
                type="button"
                onClick={() => {
                  updatePublicCredits('rights', 'releaseDateText', '');
                  if (setForm) setForm((prev) => ({ ...prev, releaseDate: '' }));
                }}
                className="px-2 text-xs text-white/40 hover:text-rose-400"
                title="Clear date"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-[10px] text-white/40">Select official release date from calendar picker</p>
        </div>
      );
    }

    const listId = 'credit-options-' + section + '-' + key;
    const legacyRights = (form as any).releaseRights || {};
    const legacyKey = key === 'releaseDateText' ? 'releaseDate' : key === 'licensingText' ? 'licensingPermissions' : key;
    const fallback = section === 'rights' ? legacyRights[legacyKey] : '';
    const value = String((form.publicCredits as any)?.[section]?.[key] ?? fallback ?? '');
    const suggestions = creditLibrary.options[section]?.[key] || [];
    return (
      <div key={key}>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--dash-text-muted)' }}>{label}</label>
        <input className="form-input w-full" list={listId} placeholder="Choose existing or type a new value" value={value}
          onChange={e => updatePublicCredits(section, key, e.target.value)} />
        <datalist id={listId}>{suggestions.map(option => <option key={option} value={option} />)}</datalist>
        <p className="text-[10px] mt-1 text-white/40">{suggestions.length} existing option{suggestions.length === 1 ? '' : 's'}; manual entry allowed</p>
      </div>
    );
  };

  useEffect(() => {
    fetch('/api/writers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Only show active approved writers in dropdown
          setWriters(data.filter(w => w.profile_status === 'approved_as_writer' || w.profile_status === 'approved' || w.public_name));
        }
      })
      .catch((err) => console.error('Failed to load writers', err));
  }, []);

  const handleCanonicalWriterChange = (writerId: string) => {
    if (!setForm) return;
    setForm(prev => ({ ...prev, writer: writerId, lyricist: writerId }));
  };

  const selectedWriter = writers.find(w => w.id === form.writer);

  return (
    <div id="credits-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
      <h2 className="text-xl font-semibold mb-6" style={{color: 'var(--dash-text-primary)'}}>Official Credits</h2>
      <div className="mb-6 p-4 rounded-lg border border-white/10 bg-black/20">
        <label className="block text-xs font-semibold mb-2" style={{color: 'var(--dash-accent)'}}>Reuse saved credits from an existing SufiPulse / YouTube-linked CMS release</label>
        <div className="flex flex-wrap gap-2">
          <select className="form-input flex-1 min-w-[220px]" value={selectedSourceId} onChange={e => setSelectedSourceId(e.target.value)}>
            <option value="">Select an existing release ({creditLibrary.creditedReleases} with saved credits)</option>
            {creditLibrary.sources.map(source => <option key={source.id} value={source.id}>
              {source.title}{source.youtubeId ? ' (YouTube: ' + source.youtubeId + ')' : ''}
            </option>)}
          </select>
          <button type="button" className="px-4 py-2 rounded bg-amber-500 text-black font-semibold disabled:opacity-40"
            onClick={applySourceCredits} disabled={!selectedSourceId || !setForm}>Copy selected credits</button>
        </div>
        <p className="text-xs text-white/50 mt-2">Each field below also offers existing values. You can type a completely new name or value at any time. Reused credits are suggestions, not independent verification of attribution.</p>
        {creditLibraryError && <p className="text-xs text-red-400 mt-2">{creditLibraryError}</p>}
      </div>

      {/* Artistic Credits */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 pb-1" style={{color: 'var(--dash-accent)', borderBottom: '1px solid var(--dash-border)'}}>
          Artistic Credits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="md:col-span-2 p-3 rounded-lg border border-white/10 bg-black/20">
            <label className="block text-xs font-semibold mb-2" style={{color: 'var(--dash-accent)'}}>Canonical Writer / Lyricist</label>
            <div className="flex items-center gap-3">
              <select 
                className="form-input flex-1"
                value={typeof form.writer === 'string' ? form.writer : ''}
                onChange={(e) => handleCanonicalWriterChange(e.target.value)}
              >
                <option value="">-- Select Canonical Writer --</option>
                {writers.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.public_credit || w.public_name || w.name} ({w.pen_name || 'No Pen Name'})
                  </option>
                ))}
              </select>
              {selectedWriter && (
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    APPROVED
                  </span>
                  <Link href="/admin/applications/writers" className="text-xs text-amber-400 hover:underline">
                    View Profile
                  </Link>
                </div>
              )}
            </div>
            <p className="text-[10px] mt-2 text-white/40">
              Select an approved contributor. The system will automatically generate standard public metadata from their profile.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[['leadVocalist','Lead Vocalist'],['lyricist','Additional Lyricist (Override)'],['composer','Composer'],['musicProducer','Music Producer'],['backgroundVocals','Background Vocals']].map(([key, label]) => creditInput('artistic', key, label))}
        </div>
      </div>

      {/* Production Credits */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 pb-1" style={{color: 'var(--dash-accent)', borderBottom: '1px solid var(--dash-border)'}}>
          Production Credits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[['recordedAt','Recorded at'],['recordingEngineer','Recording Engineer'],['mixMaster','Mix & Master'],['soundDesign','Sound Design'],['productionSupervision','Production Supervision']].map(([key, label]) => creditInput('production', key, label))}
        </div>
      </div>

      {/* Visual Credits */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 pb-1" style={{color: 'var(--dash-accent)', borderBottom: '1px solid var(--dash-border)'}}>
          Visual Credits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[['videoDirection','Video Direction'],['editing','Editing'],['thumbnailDesign','Thumbnail Design'],['artwork','Artwork']].map(([key, label]) => creditInput('visual', key, label))}
        </div>
      </div>

      {/* Literary & Language */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 pb-1" style={{color: 'var(--dash-accent)', borderBottom: '1px solid var(--dash-border)'}}>
          Literary &amp; Language
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[['romanTransliteration','Roman Transliteration'],['englishTranslation','English Translation'],['thematicInterpretation','Thematic Interpretation'],['proofreading','Proofreading']].map(([key, label]) => creditInput('literary', key, label))}
        </div>
      </div>

      {/* Release & Rights */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 pb-1" style={{color: 'var(--dash-accent)', borderBottom: '1px solid var(--dash-border)'}}>
          Release &amp; Rights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[['publishedBy','Published by'],['platform','Platform'],['registeredReleaseId','Registered Release ID'],['releaseDateText','Release Date'],['copyrightHolder','Copyright Holder'],['licensingText','Licensing / Permissions']].map(([key, label]) => creditInput('rights', key, label))}
          {creditInput('rights', 'licensingUrl', 'Licensing URL')}
        </div>
      </div>
    </div>
  );
}
