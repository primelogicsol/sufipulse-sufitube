import React, { useState, useEffect } from 'react';
import { formatMsToTimecode, parseTimecodeToMs } from '@/lib/time-utils';

interface VideoStructureProps {
  durationSeconds: number;
  initialStructure: {
    songEndMs?: number | null;
    postSongStartMs?: number | null;
    boundarySource?: string;
    postSongExperienceVersion?: string;
    boundaryVerifiedAt?: string;
    boundaryVerifiedBy?: string;
  };
  onUpdate: (structure: any) => void;
  isLocked?: boolean;
}

export function VideoStructureSection({ durationSeconds, initialStructure, onUpdate, isLocked = false }: VideoStructureProps) {
  const videoEndMs = durationSeconds ? durationSeconds * 1000 : 0;
  
  const [songEndInput, setSongEndInput] = useState(formatMsToTimecode(initialStructure.songEndMs));
  const [postSongInput, setPostSongInput] = useState(formatMsToTimecode(initialStructure.postSongStartMs));
  const [boundarySource, setBoundarySource] = useState(initialStructure.boundarySource || '');
  const [versionInput, setVersionInput] = useState(initialStructure.postSongExperienceVersion || '');
  const [status, setStatus] = useState('INCOMPLETE');
  const displayStatus = isLocked
    ? (initialStructure.songEndMs != null && initialStructure.postSongStartMs != null &&
       initialStructure.songEndMs >= 0 && initialStructure.postSongStartMs >= initialStructure.songEndMs &&
       initialStructure.postSongStartMs <= videoEndMs
        ? (initialStructure.songEndMs === initialStructure.postSongStartMs ? 'VERIFIED CONTIGUOUS' : 'VERIFIED WITH GAP')
        : 'INCOMPLETE')
    : status;

  useEffect(() => {
    if (isLocked) return;
    const songEndMs = parseTimecodeToMs(songEndInput);
    const postSongStartMs = parseTimecodeToMs(postSongInput);
    
    let currentStatus = 'INCOMPLETE';
    
    if (songEndInput && songEndMs === null) {
      currentStatus = 'INVALID (Malformed Song End)';
    } else if (postSongInput && postSongStartMs === null) {
      currentStatus = 'INVALID (Malformed Post Song Start)';
    } else if (songEndMs !== null && postSongStartMs !== null) {
      if (songEndMs < 0 || postSongStartMs < 0) {
         currentStatus = 'INVALID (Negative)';
      } else if (songEndMs > postSongStartMs) {
         currentStatus = 'INVALID (Reversed Boundary)';
      } else if (videoEndMs > 0 && (songEndMs > videoEndMs || postSongStartMs > videoEndMs)) {
         currentStatus = 'INVALID (Exceeds Duration)';
      } else if (songEndMs === postSongStartMs) {
         currentStatus = 'VERIFIED CONTIGUOUS';
      } else {
         currentStatus = 'VERIFIED WITH GAP';
      }
    } else if (songEndMs === null && postSongStartMs !== null) {
      currentStatus = 'INVALID (Missing Song End)';
    }

    setStatus(currentStatus);
    const isModified = songEndMs !== initialStructure.songEndMs || 
                       postSongStartMs !== initialStructure.postSongStartMs || 
                       boundarySource !== initialStructure.boundarySource;

    onUpdate({
      songEndMs,
      postSongStartMs,
      boundarySource: boundarySource || undefined,
      postSongExperienceVersion: versionInput || undefined,
      boundaryVerifiedAt: (currentStatus.startsWith('VERIFIED') && boundarySource === 'EDITOR_VERIFIED' && !isModified) 
        ? initialStructure.boundaryVerifiedAt
        : undefined,
      boundaryVerifiedBy: (currentStatus.startsWith('VERIFIED') && boundarySource === 'EDITOR_VERIFIED' && !isModified)
        ? initialStructure.boundaryVerifiedBy
        : undefined,
    });
  }, [songEndInput, postSongInput, boundarySource, versionInput, videoEndMs, isLocked]);

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6 space-y-5 mb-8 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          Video Structure & Timeline
        </h2>
        {isLocked && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Locked to Studio Master
          </span>
        )}
      </div>

      <div className="space-y-4">
        {isLocked && (
          <div className="p-3.5 bg-purple-950/30 border border-purple-500/30 rounded-xl text-xs text-purple-200/90 leading-relaxed">
            <strong>Timeline Locked:</strong> Video duration, song end, and post-song boundaries are authoritatively calculated from the rendered Hybrid Studio master. Changes require a new Studio revision.
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Full Video Duration (Read Only)
            </label>
            <input
              disabled
              value={formatMsToTimecode(videoEndMs) || 'Unknown'}
              className="w-full px-3 py-2.5 border rounded-lg text-sm bg-neutral-950/70 border-white/10 text-neutral-400 cursor-not-allowed font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Status
            </label>
            <input
              disabled
              value={displayStatus}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm font-semibold font-mono ${
                displayStatus.includes('INVALID')
                  ? 'text-rose-300 bg-rose-950/30 border-rose-500/30'
                  : 'text-emerald-300 bg-emerald-950/30 border-emerald-500/30'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Song Ends (MM:SS.mmm)
            </label>
            <input 
              placeholder="04:21.500" 
              value={isLocked ? formatMsToTimecode(initialStructure.songEndMs) : songEndInput} 
              disabled={isLocked}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSongEndInput(e.target.value)} 
              className={`w-full px-3 py-2.5 border rounded-lg text-sm font-mono ${
                isLocked
                  ? 'bg-neutral-950/70 border-white/10 text-neutral-300 cursor-not-allowed'
                  : 'bg-neutral-950 border-white/10 text-white focus:border-amber-400'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Post-Song Experience Begins (MM:SS.mmm)
            </label>
            <input 
              placeholder="04:21.500" 
              value={isLocked ? formatMsToTimecode(initialStructure.postSongStartMs) : postSongInput} 
              disabled={isLocked}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPostSongInput(e.target.value)} 
              className={`w-full px-3 py-2.5 border rounded-lg text-sm font-mono ${
                isLocked
                  ? 'bg-neutral-950/70 border-white/10 text-neutral-300 cursor-not-allowed'
                  : 'bg-neutral-950 border-white/10 text-white focus:border-amber-400'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Boundary Source
            </label>
            {isLocked ? (
              <div
                className="w-full px-3 py-2.5 border rounded-lg bg-neutral-950/70 border-white/10 text-neutral-300 text-sm"
                aria-label="Verified boundary source"
              >
                {initialStructure.boundarySource === 'PRODUCTION_TIMELINE' ? 'Production Timeline' :
                  initialStructure.boundarySource === 'EDITOR_VERIFIED' ? 'Editor Verified' :
                  initialStructure.boundarySource === 'IMPORTED' ? 'Imported' : 'Not specified'}
              </div>
            ) : (
              <select
                value={boundarySource}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBoundarySource(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg bg-neutral-950 border-white/10 text-white text-sm focus:border-amber-400"
              >
                <option value="">Select Source...</option>
                <option value="EDITOR_VERIFIED">Editor Verified</option>
                <option value="PRODUCTION_TIMELINE">Production Timeline</option>
                <option value="IMPORTED">Imported</option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Post-Song Experience Version
            </label>
            <input 
              placeholder="e.g. v1" 
              value={isLocked ? initialStructure.postSongExperienceVersion || 'Not assigned' : versionInput} 
              disabled={isLocked}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVersionInput(e.target.value)} 
              className={`w-full px-3 py-2.5 border rounded-lg text-sm ${
                isLocked
                  ? 'bg-neutral-950/70 border-white/10 text-neutral-300 cursor-not-allowed'
                  : 'bg-neutral-950 border-white/10 text-white focus:border-amber-400'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
