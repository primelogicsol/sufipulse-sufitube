"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Status = { state: 'not_started' | 'uploading' | 'completed'; offset: number; size: number; videoId?: string; cmsReleaseId?: string; captionTrackStatus?: Record<string, 'uploaded' | 'failed' | 'pending'>; uploadAuthorized?: boolean };
export function YouTubeUploadPanel({ draftId, cmsReleaseId, onLinked }: {
  draftId: string; cmsReleaseId: string; onLinked?: () => void;
}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [captionBusy, setCaptionBusy] = useState(false);
  const [captionError, setCaptionError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const stopped = useRef(false);
  const url = '/api/admin/pipeline/drafts/' + encodeURIComponent(draftId) + '/youtube-upload';
  useEffect(() => {
    stopped.current = false;
    fetch(url, { cache: 'no-store' }).then(r => r.json())
      .then(data => { if (data.state) setStatus(data); }).catch(() => {});
    return () => { stopped.current = true; };
  }, [url]);

  const invoke = async (action: string, confirmPrivateUpload = false): Promise<any> => {
    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, confirmPrivateUpload }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'YouTube upload failed');
    return result;
  };
  const connectYouTube = async () => {
    setConnecting(true); setError('');
    try {
      const response = await fetch('/api/admin/youtube-analytics/connect', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnTo: '/admin/pipeline/' + draftId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.authUrl) throw new Error(data.error || 'Could not start YouTube authorization');
      window.location.assign(data.authUrl);
    } catch (err: any) {
      setError(err.message || 'Could not connect to YouTube'); setConnecting(false);
    }
  };
  const begin = async () => {
    if (busy) return;
    if (status?.state === 'not_started' && !window.confirm(
      'Upload ONE complete A+B+C Studio master (14:53) to the official SufiPulse USA YouTube channel as PRIVATE? ' +
      'It will not become public, and the existing CMS record will remain private.')) return;
    setBusy(true); setError(''); stopped.current = false;
    try {
      let next = status?.state === 'uploading' ? status : await invoke('start', true);
      setStatus(next);
      while (!stopped.current && next.state === 'uploading') {
        next = await invoke('chunk');
        if (stopped.current) break;
        setStatus(next);
      }
      if (next.state === 'completed' && !stopped.current) onLinked?.();
    } catch (err: any) {
      if (!stopped.current) setError(err.message || 'Upload paused. You may resume safely.');
    } finally { if (!stopped.current) setBusy(false); }
  };
  const uploadCaptions = async () => {
    if (captionBusy || !status?.videoId) return;
    setCaptionBusy(true); setCaptionError('');
    try {
      for (const code of ['ur', 'en', 'en-rom', 'ur-deva']) {
        if (status.captionTrackStatus?.[code] === 'uploaded') continue;
        await fetchCaption(code);
      }
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) setStatus(await response.json());
    } catch (err: any) { setCaptionError(err?.message || 'Caption upload failed'); }
    finally { setCaptionBusy(false); }
  };
  const fetchCaption = async (code: string) => {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'captions', language: code }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(code + ': ' + (data.error || 'Upload failed'));
    setStatus(prev => prev ? { ...prev, captionTrackStatus: { ...(prev.captionTrackStatus || {}), [code]: 'uploaded' } } : prev);
  };
  const percent = status?.size ? Math.min(100, Math.round(100 * status.offset / status.size)) : 0;
  return (
    <div className="space-y-3 rounded-xl border border-red-500/30 bg-red-950/15 p-4">
      <div>
        <h4 className="font-bold text-sm text-white">Upload Complete A + B + C Master to YouTube</h4>
        <p className="text-xs text-white/60 mt-1">
          One complete 1920 × 1080 video: Part A intro + Part B song + Part C post-song. Private first. The real YouTube ID is linked to the existing CMS release,
          not imported as a second release. Subtitle delivery and public publishing remain separate steps.
        </p>
      </div>
      {status?.state === 'completed' ? (
        <div className="space-y-2">
          <p className="text-emerald-400 text-xs font-semibold">Private upload verified: {status.videoId}</p>
          <a className="block text-center rounded-lg bg-red-600 px-3 py-2 text-white text-xs font-bold"
            href={'https://studio.youtube.com/video/' + status.videoId + '/edit'} target="_blank" rel="noreferrer">
            Review Private Video in YouTube Studio
          </a>
          <div className="space-y-2 border-t border-white/10 pt-3">
            <p className="text-xs text-white/70">YouTube captions: {Object.values(status.captionTrackStatus || {}).filter(v => v === 'uploaded').length} of 4 uploaded</p>
            <button type="button" onClick={uploadCaptions} disabled={captionBusy}
              className="w-full rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-50">
              {captionBusy ? 'Uploading Caption Tracks...' : 'Upload / Verify All 4 Caption Tracks'}
            </button>
            {captionError && <p role="alert" className="text-xs text-amber-300">{captionError}</p>}
          </div>
          <Link className="block text-center rounded-lg border border-amber-400/50 px-3 py-2 text-amber-300 text-xs font-bold"
            href={'/admin/cms-releases/' + (status.cmsReleaseId || cmsReleaseId)}>
            Continue in CMS Editor
          </Link>
        </div>
      ) : (
        <>
          {status?.state === 'uploading' && (
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-red-500 transition-all" style={{ width: percent + '%' }} />
              </div>
              <p className="text-xs text-white/70 mt-1">{percent}% transferred to YouTube</p>
            </div>
          )}
          {status && !status.uploadAuthorized && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/30 p-3 space-y-2">
              <p className="text-xs text-amber-200">YouTube upload permission is not authorized. Reconnect your official SufiPulse channel before uploading. This will open Google’s authorization page.</p>
              <button type="button" onClick={connectYouTube} disabled={connecting}
                className="w-full rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-50">
                {connecting ? 'Opening Google authorization...' : 'Connect YouTube for Upload'}
              </button>
            </div>
          )}
          <button type="button" onClick={begin} disabled={busy || !status || !status.uploadAuthorized}
            className="w-full rounded-lg bg-red-600 hover:bg-red-500 px-3 py-3 text-xs text-white font-bold disabled:opacity-50">
            {busy ? 'Uploading to YouTube...' : status?.state === 'uploading' ? 'Resume Private YouTube Upload' : 'Upload Private to YouTube'}
          </button>
          {error && <p role="alert" className="text-xs text-amber-300">{error}</p>}
          <p className="text-[11px] text-white/50">If your connection stops, return and select Resume. Do not begin a second upload from YouTube Studio while a session is active.</p>
        </>
      )}
    </div>
  );
}
