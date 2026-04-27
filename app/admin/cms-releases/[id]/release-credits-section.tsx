"use client";

import type { CMSRelease } from '@/lib/cms-storage';

type Props = {
  form: Partial<CMSRelease>;
  updatePublicCredits: (
    section: 'artistic' | 'production' | 'visual' | 'literary' | 'rights',
    field: string,
    value: string
  ) => void;
};

export function ReleaseCreditsSection({ form, updatePublicCredits }: Props) {
  return (
    <div id="credits-section" className="mb-8 pb-8" style={{borderBottom: '1px solid var(--dash-border)'}}>
      <h2 className="text-xl font-semibold mb-6" style={{color: 'var(--dash-text-primary)'}}>Official Credits</h2>

      {/* Artistic Credits */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 pb-1" style={{color: 'var(--dash-accent)', borderBottom: '1px solid var(--dash-border)'}}>
          Artistic Credits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[['leadVocalist','Lead Vocalist'],['lyricist','Lyricist'],['composer','Composer'],['musicProducer','Music Producer'],['backgroundVocals','Background Vocals']].map(([key, label]) => (
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
          {[['recordedAt','Recorded at'],['recordingEngineer','Recording Engineer'],['mixMaster','Mix & Master'],['soundDesign','Sound Design']].map(([key, label]) => (
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
