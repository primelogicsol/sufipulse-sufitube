'use client';
import { useState } from 'react';
import { videoFileToParsedCues } from '@/lib/subtitle-ingest/video-file-to-cues';

export default function TestOcrPage() {
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [cuesCount, setCuesCount] = useState<number>(-1);
  const [progress, setProgress] = useState<any>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDiagnostic(null);
    setCuesCount(-1);
    setProgress(null);

    try {
      const cues = await videoFileToParsedCues(file, {
        fps: 2,
        subtitleZone: 0.25,
        
        onProgress: (stage, pct, detail) => setProgress({ stage, pct, detail })
      });
      setCuesCount(cues.length);
      setDiagnostic({ success: true, cues: cues.length, message: 'OCR finished' });
    } catch (err: any) {
      console.error(err);
      if (err.diagnostic) {
        setDiagnostic(err.diagnostic);
      } else {
        setDiagnostic({ error: err.message, stack: err.stack });
      }
    }
  };

  return (
    <div className="p-10" style={{ color: 'white' }}>
      <h1>OCR Test Public Page</h1>
      <input type="file" accept=".mp4" id="file-input" onChange={onFileChange} />
      
      <div id="progress-output" style={{ marginTop: '20px' }}>
        {progress ? JSON.stringify(progress) : 'No progress'}
      </div>

      <pre id="diagnostic-output" style={{ marginTop: '20px', border: '1px solid gray', padding: '10px' }}>
        {JSON.stringify(diagnostic, null, 2)}
      </pre>
      
      <div id="cues-count" style={{ display: 'none' }}>{cuesCount}</div>
    </div>
  );
}
