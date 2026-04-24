import { CheckCircle2 } from 'lucide-react';
import type { CMSRelease } from '@/lib/cms-storage';

type Props = {
  form: Partial<CMSRelease>;
  selectedSubtitleLanguage: string;
  reviewActor: string;
  setReviewActor: (value: string) => void;
  reviewComment: string;
  setReviewComment: (value: string) => void;
  addReviewLog: () => void;
};

export function ReviewLogSection({
  form,
  selectedSubtitleLanguage,
  reviewActor,
  setReviewActor,
  reviewComment,
  setReviewComment,
  addReviewLog,
}: Props) {
  return (
    <div className="mt-6 rounded-lg p-4" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--dash-text-primary)' }}>
        Review Log ({selectedSubtitleLanguage.toUpperCase()})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <input
          type="text"
          value={reviewActor}
          onChange={(e) => setReviewActor(e.target.value)}
          className="form-input"
          placeholder="Reviewer / Editor"
        />
        <input
          type="text"
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          className="form-input md:col-span-2"
          placeholder="Review note (optional)"
        />
      </div>
      <button
        type="button"
        onClick={addReviewLog}
        className="dashboard-btn-primary inline-flex items-center gap-2 px-3 py-2 text-sm"
      >
        <CheckCircle2 size={16} /> Add Review Entry
      </button>

      <div className="mt-3 max-h-44 overflow-auto space-y-2">
        {(form.subtitleReviewLogs || [])
          .filter((log) => log.language === selectedSubtitleLanguage)
          .slice()
          .reverse()
          .map((log) => (
            <div key={log.id} className="text-xs rounded px-3 py-2" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-primary)' }}>
              <div className="flex justify-between" style={{ color: 'var(--dash-text-secondary)' }}>
                <span>{log.actor || 'Editorial Admin'}</span>
                <span>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <div className="font-medium mt-1" style={{ color: 'var(--dash-text-primary)' }}>Status: {log.status}</div>
              {log.comment && <div className="mt-1" style={{ color: 'var(--dash-text-primary)' }}>{log.comment}</div>}
            </div>
          ))}
      </div>
    </div>
  );
}
