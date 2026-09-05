import React, { useState, useEffect } from 'react';

interface CanonicalLyricsProps {
  initialLyrics?: {
    text: string;
    primaryLanguage: string;
    languages: string[];
    source: string;
    status: 'DRAFT' | 'REVIEWED' | 'APPROVED';
    reviewedAt?: string;
    reviewedBy?: string;
    approvedAt?: string;
    approvedBy?: string;
  };
  onUpdate: (lyrics: any) => void;
}

export function CanonicalLyricsSection({ initialLyrics, onUpdate }: CanonicalLyricsProps) {
  const [text, setText] = useState(initialLyrics?.text || '');
  const [primaryLanguage, setPrimaryLanguage] = useState(initialLyrics?.primaryLanguage || 'ur');
  const [status, setStatus] = useState<'DRAFT' | 'REVIEWED' | 'APPROVED'>(initialLyrics?.status || 'DRAFT');
  const [reviewedAt, setReviewedAt] = useState(initialLyrics?.reviewedAt || '');
  const [approvedAt, setApprovedAt] = useState(initialLyrics?.approvedAt || '');

  // If editor modifies text or language, demote to DRAFT.
  useEffect(() => {
    const isModified = text !== (initialLyrics?.text || '') || primaryLanguage !== (initialLyrics?.primaryLanguage || '');
    
    let currentStatus = status;
    let currentReviewedAt = reviewedAt;
    let currentApprovedAt = approvedAt;
    
    if (isModified && (status === 'APPROVED' || status === 'REVIEWED')) {
      currentStatus = 'DRAFT';
      currentReviewedAt = '';
      currentApprovedAt = '';
      setStatus('DRAFT');
      setReviewedAt('');
      setApprovedAt('');
    }

    if (text.trim() === '') {
      onUpdate(undefined); // Remove canonicalLyrics if empty
    } else {
      onUpdate({
        text,
        primaryLanguage,
        languages: initialLyrics?.languages || [primaryLanguage],
        source: initialLyrics?.source || 'cms_input',
        status: currentStatus,
        reviewedAt: currentReviewedAt || undefined,
        reviewedBy: currentReviewedAt ? initialLyrics?.reviewedBy : undefined,
        approvedAt: currentApprovedAt || undefined,
        approvedBy: currentApprovedAt ? initialLyrics?.approvedBy : undefined,
      });
    }
  }, [text, primaryLanguage, status, reviewedAt, approvedAt, initialLyrics]);

  const handleReview = () => {
    setStatus('REVIEWED');
    setReviewedAt(new Date().toISOString());
  };

  const handleApprove = () => {
    setStatus('APPROVED');
    setApprovedAt(new Date().toISOString());
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm mt-8">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Canonical Original Lyrics (Phase 2B)</h2>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status === 'APPROVED' ? 'bg-green-100 text-green-800' : status === 'REVIEWED' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {status}
        </span>
      </div>
      <div className="p-4 space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Language</label>
          <select 
            value={primaryLanguage} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPrimaryLanguage(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-white max-w-xs"
          >
            <option value="ur">Urdu (Roman / Native)</option>
            <option value="pa">Punjabi</option>
            <option value="ks">Kashmiri</option>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lyrics Text</label>
          <textarea 
            rows={12}
            placeholder="Paste canonical original lyrics here..." 
            value={text} 
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)} 
            className="w-full px-3 py-2 border rounded-md font-mono text-sm"
          />
        </div>

        <div className="flex justify-end space-x-2">
          {status === 'DRAFT' && text.trim().length > 0 && (
            <button 
              onClick={handleReview}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              Mark as Reviewed
            </button>
          )}
          {status === 'REVIEWED' && (
            <button 
              onClick={handleApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors"
            >
              Approve Canonical Lyrics
            </button>
          )}
        </div>
        
        {status === 'APPROVED' && approvedAt && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-100">
            ✓ Lyrics have been editorially verified and approved. Modifying the text will revoke approval.
          </div>
        )}
      </div>
    </div>
  );
}