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
          {[['leadVocalist','Lead Vocalist'],['lyricist','Additional Lyricist (Override)'],['composer','Composer'],['musicProducer','Music Producer'],['backgroundVocals','Background Vocals']].map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>{label}</label>
              <input className="form-input w-full" placeholder={label} value={(form.publicCredits?.artistic as any)?.[key] || ''} onChange={(e) => updatePublicCredits('artistic', key, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Production Credits */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 pb-1" style={{color: 'var(--dash-accent)', borderBottom: '1px solid var(--dash-border)'}}>
          Production Credits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[['recordedAt','Recorded at'],['recordingEngineer','Recording Engineer'],['mixMaster','Mix & Master'],['soundDesign','Sound Design'],['productionSupervision','Production Supervision']].map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>{label}</label>
              <input className="form-input w-full" placeholder={label} value={(form.publicCredits?.production as any)?.[key] || ''} onChange={(e) => updatePublicCredits('production', key, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Visual Credits */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 pb-1" style={{color: 'var(--dash-accent)', borderBottom: '1px solid var(--dash-border)'}}>
          Visual Credits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[['videoDirection','Video Direction'],['editing','Editing'],['thumbnailDesign','Thumbnail Design'],['artwork','Artwork']].map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>{label}</label>
              <input className="form-input w-full" placeholder={label} value={(form.publicCredits?.visual as any)?.[key] || ''} onChange={(e) => updatePublicCredits('visual', key, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Literary & Language */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 pb-1" style={{color: 'var(--dash-accent)', borderBottom: '1px solid var(--dash-border)'}}>
          Literary &amp; Language
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[['romanTransliteration','Roman Transliteration'],['englishTranslation','English Translation'],['thematicInterpretation','Thematic Interpretation'],['proofreading','Proofreading']].map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>{label}</label>
              <input className="form-input w-full" placeholder={label} value={(form.publicCredits?.literary as any)?.[key] || ''} onChange={(e) => updatePublicCredits('literary', key, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Release & Rights */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 pb-1" style={{color: 'var(--dash-accent)', borderBottom: '1px solid var(--dash-border)'}}>
          Release &amp; Rights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[['publishedBy','Published by'],['platform','Platform'],['registeredReleaseId','Registered Release ID'],['releaseDateText','Release Date'],['copyrightHolder','Copyright Holder'],['licensingText','Licensing / Permissions']].map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>{label}</label>
              <input className="form-input w-full" placeholder={label} value={(form.publicCredits?.rights as any)?.[key] || ''} onChange={(e) => updatePublicCredits('rights', key, e.target.value)} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-muted)'}}>Licensing URL</label>
            <input className="form-input w-full" placeholder="https://sufipulse.com/contact" value={form.publicCredits?.rights?.licensingUrl || ''} onChange={(e) => updatePublicCredits('rights', 'licensingUrl', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
