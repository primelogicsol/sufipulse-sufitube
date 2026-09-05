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
}

export function VideoStructureSection({ durationSeconds, initialStructure, onUpdate }: VideoStructureProps) {
  const videoEndMs = durationSeconds ? durationSeconds * 1000 : 0;
  
  const [songEndInput, setSongEndInput] = useState(formatMsToTimecode(initialStructure.songEndMs));
  const [postSongInput, setPostSongInput] = useState(formatMsToTimecode(initialStructure.postSongStartMs));
  const [boundarySource, setBoundarySource] = useState(initialStructure.boundarySource || '');
  const [versionInput, setVersionInput] = useState(initialStructure.postSongExperienceVersion || '');
  const [status, setStatus] = useState('INCOMPLETE');

  useEffect(() => {
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
  }, [songEndInput, postSongInput, boundarySource, versionInput, videoEndMs]);

  return (
    <div className="bg-white border rounded-lg shadow-sm mt-8">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Video Structure & Timeline</h2>
      </div>
      <div className="p-4 space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Video Duration (Read Only)</label>
            <input disabled value={formatMsToTimecode(videoEndMs) || 'Unknown'} className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <input disabled value={status} className={`w-full px-3 py-2 border rounded-md font-semibold ${status.includes('INVALID') ? 'text-red-500 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'}`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Song Ends (MM:SS.mmm)</label>
            <input 
              placeholder="04:21.500" 
              value={songEndInput} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSongEndInput(e.target.value)} 
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Post-Song Experience Begins (MM:SS.mmm)</label>
            <input 
              placeholder="04:21.500" 
              value={postSongInput} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPostSongInput(e.target.value)} 
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Boundary Source</label>
            <select 
              value={boundarySource} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBoundarySource(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-white"
            >
              <option value="">Select Source...</option>
              <option value="EDITOR_VERIFIED">Editor Verified</option>
              <option value="PRODUCTION_TIMELINE">Production Timeline</option>
              <option value="IMPORTED">Imported</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Post-Song Experience Version</label>
            <input 
              placeholder="e.g. v1" 
              value={versionInput} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVersionInput(e.target.value)} 
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
