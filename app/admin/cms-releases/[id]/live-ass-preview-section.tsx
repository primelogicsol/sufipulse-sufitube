import { useRef, useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { CMSRelease } from '@/lib/cms-storage';
import { assColorToRgba, getAlignmentLabel, normalizeHexColor, secondsToCueTime } from './subtitle-utils';

type Props = {
  form: Partial<CMSRelease>;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  previewCanvasRef: React.RefObject<HTMLDivElement | null>;
  previewYouTubeIframeRef: React.RefObject<HTMLIFrameElement | null>;
  previewStyleName: string;
  previewAlignment: number;
  previewPlaying: boolean;
  setPreviewPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  previewHasYouTube: boolean;
  previewTime: number;
  setPreviewTime: React.Dispatch<React.SetStateAction<number>>;
  setPreviewVideoDuration?: (d: number) => void;
  sendPreviewYouTubeCommand: (command: string, args?: any[]) => void;
  previewDuration: number;
  handleTimelineClick: (event: React.MouseEvent<HTMLDivElement>, duration: number) => void;
  handleTimelinePointerDown: (event: React.PointerEvent<HTMLDivElement>, duration: number) => void;
  formatPreviewSeconds: (value: number) => string;
  showSafeGuides: boolean;
  setShowSafeGuides: React.Dispatch<React.SetStateAction<boolean>>;
  previewCue: any;
  setPreviewCueId: (id: string) => void;
  previewYouTubeId: string;
  previewOrigin: string;
  bootstrapPreviewYouTubePlayer: () => void;
  handlePreviewInfoDrag: (event: React.PointerEvent<HTMLDivElement>) => void;
  previewInfoPosition: { x: number; y: number };
  previewInfoWidth: number;
  handlePreviewInfoResize: (event: React.PointerEvent<HTMLDivElement>, edge: 'left' | 'right') => void;
  selectedSubtitleLanguage: string;
  handlePreviewDrag: (event: React.PointerEvent<HTMLDivElement>, cueId?: string) => void;
  previewPosition: { x: number; y: number } | null;
  previewAnchor: { x: 'left' | 'center' | 'right'; y: 'top' | 'middle' | 'bottom' };
  previewCanvasWidth: number;
  previewStyle: any;
  previewTextLines: string[];
  handlePreviewResize: (event: React.PointerEvent<HTMLDivElement>, styleName: string, edge: 'left' | 'right') => void;
  previewCueMetadata: any;
  lockAllCuePositions: boolean;
  setLockAllCuePositions: React.Dispatch<React.SetStateAction<boolean>>;
  applyCueMetadataToAllCues: (patch: Record<string, any>, options?: any) => void;
  updateCue: (cueId: string, field: string, value: any) => void;
  autoAdvanceAfterStamp: boolean;
  setAutoAdvanceAfterStamp: (val: boolean) => void;
};

export function LiveAssPreviewSection({
  form,
  timelineRef,
  previewCanvasRef,
  previewYouTubeIframeRef,
  previewStyleName,
  previewAlignment,
  previewPlaying,
  setPreviewPlaying,
  previewHasYouTube,
  previewTime,
  setPreviewTime,
  setPreviewVideoDuration,
  sendPreviewYouTubeCommand,
  previewDuration,
  handleTimelineClick,
  handleTimelinePointerDown,
  formatPreviewSeconds,
  showSafeGuides,
  setShowSafeGuides,
  previewCue,
  setPreviewCueId,
  previewYouTubeId,
  previewOrigin,
  bootstrapPreviewYouTubePlayer,
  handlePreviewInfoDrag,
  previewInfoPosition,
  previewInfoWidth,
  handlePreviewInfoResize,
  selectedSubtitleLanguage,
  handlePreviewDrag,
  previewPosition,
  previewAnchor,
  previewCanvasWidth,
  previewStyle,
  previewTextLines,
  handlePreviewResize,
  previewCueMetadata,
  lockAllCuePositions,
  setLockAllCuePositions,
  applyCueMetadataToAllCues,
  updateCue,
  autoAdvanceAfterStamp,
  setAutoAdvanceAfterStamp,
}: Props) {

  const audioRef = useRef<HTMLAudioElement>(null);
  const isAudioRelease = !previewHasYouTube && !!form.audioUrl;

  // Sync play/pause
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !isAudioRelease) return;
    if (previewPlaying) { el.play().catch(() => {}); }
    else { el.pause(); }
  }, [previewPlaying, isAudioRelease]);

  // Seek when previewTime jumps (external seek, not from timeupdate)
  const lastAudioTime = useRef(0);
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !isAudioRelease) return;
    if (Math.abs(el.currentTime - previewTime) > 0.5) {
      el.currentTime = previewTime;
    }
  }, [previewTime, isAudioRelease]);

  const stampStart = () => {
    if (!previewCue) return;
    updateCue(previewCue.id, 'startTime', secondsToCueTime(previewTime));
  };

  const stampEnd = () => {
    if (!previewCue) return;
    updateCue(previewCue.id, 'endTime', secondsToCueTime(previewTime));
    
    if (autoAdvanceAfterStamp && nextCue) {
      setPreviewCueId(nextCue.id);
    }
  };

  const jumpToCueStart = () => {
    if (!previewCue) return;
    const parts = (previewCue.startTime || '00:00:00.000').split(':');
    const secs = Number(parts[0] || 0) * 3600 + Number(parts[1] || 0) * 60 + parseFloat(parts[2] || '0');
    setPreviewTime(secs);
    if (previewHasYouTube) {
      sendPreviewYouTubeCommand('seekTo', [secs, true]);
    }
  };

  const cues = form.subtitleCues || [];
  const currentCueIndex = cues.findIndex(c => c.id === previewCue?.id);
  const nextCue = cues[currentCueIndex + 1] ?? null;
  const prevCue = cues[currentCueIndex - 1] ?? null;

  return (
    <div className="mb-6 rounded-lg p-4 space-y-4" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-primary)' }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Live ASS Preview</h3>
          <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>Select a cue, drag the caption box on the frame, and save. This writes cue-level XY position overrides.</p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
          <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--dash-bg-secondary)' }}>Style: {previewStyleName}</span>
          <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--dash-bg-secondary)' }}>Align: {getAlignmentLabel(previewAlignment)}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (previewHasYouTube) {
                if (previewPlaying) {
                  sendPreviewYouTubeCommand('pauseVideo');
                  setPreviewPlaying(false);
                } else {
                  sendPreviewYouTubeCommand('seekTo', [Math.max(0, previewTime), true]);
                  sendPreviewYouTubeCommand('playVideo');
                  setPreviewPlaying(true);
                }
                return;
              }
              setPreviewPlaying((current) => !current);
            }}
            className="dashboard-btn-secondary inline-flex items-center gap-2 px-3 py-2 disabled:opacity-50"
          >
            {previewPlaying ? <Pause size={14} /> : <Play size={14} />}
            {previewPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={() => {
              setPreviewPlaying(false);
              setPreviewTime(0);
              if (previewHasYouTube) {
                sendPreviewYouTubeCommand('pauseVideo');
                sendPreviewYouTubeCommand('seekTo', [0, true]);
              }
            }}
            className="dashboard-btn-secondary px-3 py-2 text-sm"
          >
            Reset
          </button>
        </div>
        <div className="flex-1">
          <div
            ref={timelineRef}
            onClick={(e) => handleTimelineClick(e, previewDuration)}
            onPointerDown={(e) => handleTimelinePointerDown(e, previewDuration)}
            className="relative w-full h-8 rounded cursor-pointer transition"
            style={{ border: '1px solid var(--dash-border)', background: 'linear-gradient(to right, var(--dash-bg-primary), var(--dash-bg-secondary))' }}
          >
            {cues.map((cue) => {
              if (!previewDuration) return null;
              const parseS = (t: string) => {
                const p = (t || '0').split(':');
                return Number(p[0]||0)*3600 + Number(p[1]||0)*60 + parseFloat(p[2]||'0');
              };
              const startPct = Math.max(0, Math.min(100, (parseS(cue.startTime) / previewDuration) * 100));
              const endPct = Math.max(0, Math.min(100, (parseS(cue.endTime) / previewDuration) * 100));
              const isActive = previewCue?.id === cue.id;
              return (
                <div
                  key={cue.id}
                  className="absolute top-0 h-full pointer-events-none"
                  style={{
                    left: `${startPct}%`,
                    width: `${Math.max(0.3, endPct - startPct)}%`,
                    backgroundColor: isActive ? 'rgba(212,175,55,0.45)' : 'rgba(212,175,55,0.12)',
                    borderLeft: isActive ? '2px solid var(--dash-accent)' : '1px solid rgba(212,175,55,0.4)',
                  }}
                />
              );
            })}
            <div
              className="absolute top-0 h-full w-1 rounded-full pointer-events-none"
              style={{ left: `${previewDuration > 0 ? (previewTime / previewDuration) * 100 : 0}%`, transform: 'translateX(-50%)', backgroundColor: 'var(--dash-accent)' }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs pointer-events-none" style={{ color: 'var(--dash-text-muted)' }}>
              Click to scrub - {formatPreviewSeconds(previewTime)} / {formatPreviewSeconds(previewDuration)}
            </div>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--dash-text-primary)' }}>
          <input
            type="checkbox"
            checked={showSafeGuides}
            onChange={(e) => setShowSafeGuides(e.target.checked)}
            style={{ accentColor: 'var(--dash-accent)' }}
          />
          Safe guides
        </label>
      </div>

      <div
        className="rounded-lg px-4 py-3 flex flex-wrap items-center gap-3"
        style={{ border: '1px solid var(--dash-accent)', backgroundColor: 'rgba(212,175,55,0.06)' }}
      >
        <div className="flex flex-col items-center mr-2">
          <span className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--dash-text-muted)' }}>Current Time</span>
          <span
            className="font-mono font-bold text-xl tabular-nums"
            style={{ color: 'var(--dash-accent)', letterSpacing: '0.05em' }}
          >
            {formatPreviewSeconds(previewTime)}
          </span>
        </div>

        <div className="h-8 w-px" style={{ backgroundColor: 'var(--dash-border)' }} />

        <div className="flex flex-col items-start gap-1">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Active Cue</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title="Previous cue"
              disabled={!prevCue}
              onClick={() => prevCue && setPreviewCueId(prevCue.id)}
              className="dashboard-btn-secondary px-2 py-1 text-xs disabled:opacity-40"
            >◀</button>
            <span className="text-sm font-semibold" style={{ color: 'var(--dash-text-primary)', minWidth: '60px', textAlign: 'center' }}>
              {previewCue ? `Cue ${previewCue.cueNumber}` : '—'}
            </span>
            <button
              type="button"
              title="Next cue"
              disabled={!nextCue}
              onClick={() => nextCue && setPreviewCueId(nextCue.id)}
              className="dashboard-btn-secondary px-2 py-1 text-xs disabled:opacity-40"
            >▶</button>
          </div>
        </div>

        <div className="h-8 w-px" style={{ backgroundColor: 'var(--dash-border)' }} />

        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Lip-Sync Stamp</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!previewCue}
              onClick={stampStart}
              title="Set cue START time to current video position ([)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition disabled:opacity-40"
              style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.35)' }}
            >
              ▶| Set Start
            </button>
            <button
              type="button"
              disabled={!previewCue}
              onClick={stampEnd}
              title="Set cue END time to current video position (])"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition disabled:opacity-40"
              style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              |◀ Set End
            </button>
          </div>
        </div>

        <div className="h-8 w-px" style={{ backgroundColor: 'var(--dash-border)' }} />

        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Jump To</span>
          <button
            type="button"
            disabled={!previewCue}
            onClick={jumpToCueStart}
            title="Seek video to the currently selected cue's start time (Alt+Home)"
            className="dashboard-btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
          >
            ⏩ Cue Start
          </button>
        </div>

        <div className="h-8 w-px" style={{ backgroundColor: 'var(--dash-border)' }} />

        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Fine-Tune Seek</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const nt = Math.max(0, previewTime - 0.05);
                setPreviewTime(nt);
                if (previewHasYouTube) sendPreviewYouTubeCommand('seekTo', [nt, true]);
              }}
              title="Back 0.05s (Ctrl+Left)"
              className="p-1.5 rounded hover:bg-white/10 transition"
              style={{ color: 'var(--dash-text-secondary)', border: '1px solid var(--dash-border)' }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                const nt = previewTime + 0.05;
                setPreviewTime(nt);
                if (previewHasYouTube) sendPreviewYouTubeCommand('seekTo', [nt, true]);
              }}
              title="Forward 0.05s (Ctrl+Right)"
              className="p-1.5 rounded hover:bg-white/10 transition"
              style={{ color: 'var(--dash-text-secondary)', border: '1px solid var(--dash-border)' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="h-8 w-px" style={{ backgroundColor: 'var(--dash-border)' }} />

        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>Options</span>
          <label className="inline-flex items-center gap-2 text-[10px] cursor-pointer" style={{ color: 'var(--dash-text-primary)' }}>
            <input
              type="checkbox"
              checked={autoAdvanceAfterStamp}
              onChange={(e) => setAutoAdvanceAfterStamp(e.target.checked)}
              style={{ accentColor: 'var(--dash-accent)' }}
            />
            Auto-next
          </label>
        </div>

        {previewCue && (
          <div className="ml-auto text-right">
            <span className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--dash-text-muted)' }}>Cue {previewCue.cueNumber} Times</span>
            <div className="flex gap-2 font-mono text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
              <span className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                ▶ {previewCue.startTime || '—'}
              </span>
              <span className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                ■ {previewCue.endTime || '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      {(form.subtitleCues || []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(form.subtitleCues || []).map((cue: any) => (
            <button
              key={`preview-tab-${cue.id}`}
              type="button"
              onClick={() => setPreviewCueId(cue.id)}
              className={previewCue?.id === cue.id ? 'dashboard-btn-primary px-2 py-1 rounded text-xs' : 'dashboard-btn-secondary px-2 py-1 rounded text-xs'}
            >
              Cue {cue.cueNumber}
            </button>
          ))}
        </div>
      )}

      <div
        ref={previewCanvasRef}
        className="relative w-full overflow-hidden rounded-xl"
        style={{ aspectRatio: '16 / 9', border: '1px solid var(--dash-border)', backgroundColor: '#1a1a1a' }}
      >
        {previewHasYouTube ? (
          <iframe
            ref={previewYouTubeIframeRef}
            src={`https://www.youtube.com/embed/${previewYouTubeId}?enablejsapi=1&playsinline=1&controls=1&rel=0&modestbranding=1${previewOrigin ? `&origin=${encodeURIComponent(previewOrigin)}` : ''}`}
            title="YouTube preview player"
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            onLoad={bootstrapPreviewYouTubePlayer}
          />
        ) : form.thumbnailUrl ? (
          <img
            src={form.thumbnailUrl}
            alt="Release preview"
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#334155,transparent_55%),linear-gradient(135deg,#111827,#020617)]" />
        )}
        {isAudioRelease && (
          <audio
            ref={audioRef}
            src={form.audioUrl}
            preload="metadata"
            className="hidden"
            onTimeUpdate={() => {
              const el = audioRef.current;
              if (!el) return;
              lastAudioTime.current = el.currentTime;
              setPreviewTime(el.currentTime);
            }}
            onLoadedMetadata={() => {
              const el = audioRef.current;
              if (!el) return;
              if (el.duration && Number.isFinite(el.duration)) setPreviewVideoDuration?.(el.duration);
            }}
            onEnded={() => setPreviewPlaying(false)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/45" />
        {showSafeGuides && (
          <>
            <div className="absolute inset-[8%] border border-dashed border-white/35 pointer-events-none" />
            <div className="absolute left-1/2 top-[8%] bottom-[8%] border-l border-dashed border-white/20 pointer-events-none" />
            <div className="absolute top-1/2 left-[8%] right-[8%] border-t border-dashed border-white/20 pointer-events-none" />
          </>
        )}
        <div
          onPointerDown={handlePreviewInfoDrag}
          className="absolute z-30 rounded px-3 py-2 text-[11px] text-white backdrop-blur-sm touch-none select-none cursor-grab active:cursor-grabbing pointer-events-auto"
          style={{
            left: `${previewInfoPosition.x}%`,
            top: `${previewInfoPosition.y}%`,
            transform: 'translate(-50%, -50%)',
            width: `${previewInfoWidth}px`,
            maxWidth: '100%',
            backgroundColor: 'rgba(0,0,0,0.45)',
          }}
        >
          <div
            onPointerDown={(event) => handlePreviewInfoResize(event, 'left')}
            className="absolute left-[-8px] top-1/2 h-8 w-4 -translate-y-1/2 rounded-full border border-white/40 bg-white/20 backdrop-blur-sm cursor-ew-resize"
            title="Drag to resize info width (left edge)"
          />
          <div
            onPointerDown={(event) => handlePreviewInfoResize(event, 'right')}
            className="absolute right-[-8px] top-1/2 h-8 w-4 -translate-y-1/2 rounded-full border border-white/40 bg-white/20 backdrop-blur-sm cursor-ew-resize"
            title="Drag to resize info width (right edge)"
          />
          <div>{form.title || 'Untitled release'}</div>
          <div className="text-white/70">{selectedSubtitleLanguage.toUpperCase()} subtitle preview</div>
        </div>

        <div
          className={`absolute inset-0 z-20 pointer-events-none ${previewPosition ? '' : previewAnchor.y === 'top' ? 'pt-10' : previewAnchor.y === 'middle' ? 'flex items-center' : 'flex items-end pb-10'} ${previewPosition ? '' : previewAnchor.x === 'left' ? 'justify-start pl-8' : previewAnchor.x === 'right' ? 'justify-end pr-8' : 'justify-center px-8'}`}
        >
          <div
            onPointerDown={(event) => handlePreviewDrag(event, previewCue?.id)}
            className="absolute touch-none select-none cursor-grab active:cursor-grabbing pointer-events-auto"
            style={previewPosition ? {
              left: `${previewPosition.x}%`,
              top: `${previewPosition.y}%`,
              transform: 'translate(-50%, -50%)',
            } : {
              left: previewAnchor.x === 'left' ? '2rem' : previewAnchor.x === 'right' ? 'calc(100% - 2rem)' : '50%',
              top: previewAnchor.y === 'top' ? '2.5rem' : previewAnchor.y === 'middle' ? '50%' : 'calc(100% - 2.5rem)',
              transform: `translate(${previewAnchor.x === 'left' ? '0%' : previewAnchor.x === 'right' ? '-100%' : '-50%'}, ${previewAnchor.y === 'top' ? '0%' : previewAnchor.y === 'bottom' ? '-100%' : '-50%'})`,
            }}
          >
            <div
              className="relative rounded-xl border px-5 py-3 text-center backdrop-blur-md shadow-2xl"
              style={{
                width: `${Math.max(120, (previewCanvasWidth || 1280) * (Math.max(30, Math.min(200, Number(previewStyle.maxWidthPercent || 82))) / 200))}px`,
                maxWidth: 'none',
                backgroundColor: assColorToRgba(previewStyle.backColor, 'rgba(0,0,0,0.55)'),
                borderColor: assColorToRgba(previewStyle.outlineColor, 'rgba(255,255,255,0.2)'),
              }}
            >
              <div
                className="leading-snug tracking-wide"
                style={{
                  color: normalizeHexColor(previewStyle.primaryColor, '#FFFFFF'),
                  fontFamily: previewStyle.fontFamily || 'Arial',
                  fontSize: `${Math.max(16, Math.min(72, Number(previewStyle.fontSize || 42)))}px`,
                  fontWeight: previewStyle.bold ? 700 : 500,
                  fontStyle: previewStyle.italic ? 'italic' : 'normal',
                  textShadow: `0 0 ${Math.max(1, Number(previewStyle.outline || 2))}px ${normalizeHexColor(previewStyle.outlineColor, '#202020')}`,
                }}
              >
                {previewTextLines.map((line, index) => (
                  <div key={`preview-line-${index}`}>{line}</div>
                ))}
              </div>
              <div
                onPointerDown={(event) => handlePreviewResize(event, previewStyleName, 'left')}
                className="absolute left-[-8px] top-1/2 h-12 w-4 -translate-y-1/2 rounded-full border border-white/40 bg-white/20 backdrop-blur-sm cursor-ew-resize"
                title="Drag to resize subtitle width (left edge)"
              />
              <div
                onPointerDown={(event) => handlePreviewResize(event, previewStyleName, 'right')}
                className="absolute right-[-8px] top-1/2 h-12 w-4 -translate-y-1/2 rounded-full border border-white/40 bg-white/20 backdrop-blur-sm cursor-ew-resize"
                title="Drag to resize subtitle width (right edge)"
              />
            </div>
          </div>
        </div>
      </div>

      {previewCue && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
          <div className="rounded px-3 py-2" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)' }}>Cue: {previewCue.cueNumber}</div>
          <div className="rounded px-3 py-2" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)' }}>X: {Number.isFinite(previewCueMetadata.positionX) ? `${previewCueMetadata.positionX}%` : 'auto'}</div>
          <div className="rounded px-3 py-2" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)' }}>Y: {Number.isFinite(previewCueMetadata.positionY) ? `${previewCueMetadata.positionY}%` : 'auto'}</div>
          <div className="rounded px-3 py-2" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)' }}>Width: {previewStyle.maxWidthPercent || 82}%</div>
        </div>
      )}

      {previewCue && Number.isFinite(previewCueMetadata.positionX) && Number.isFinite(previewCueMetadata.positionY) && (
        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--dash-text-secondary)' }}>
            <input
              type="checkbox"
              checked={lockAllCuePositions}
              onChange={(e) => setLockAllCuePositions(e.target.checked)}
              style={{ accentColor: 'var(--dash-accent)' }}
            />
            Lock drag position for all cues (move once, updates every cue)
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                applyCueMetadataToAllCues(
                  {
                    positionX: Number(previewCueMetadata.positionX),
                    positionY: Number(previewCueMetadata.positionY),
                    alignment: Number(previewCueMetadata.alignment || previewStyle.alignment || 2),
                  },
                  {
                    successMessage: `Applied cue ${previewCue.cueNumber} position to all cues.`,
                  },
                )
              }
              className="dashboard-btn-secondary px-3 py-1.5 text-xs"
            >
              Copy This Position To All Cues (One-Time)
            </button>
          </div>
        </div>
      )}

      {!previewCue && (
        <div className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>
          No cues yet. Style and alignment changes are shown on this sample preview box. Add cues to enable drag positioning and cue-level overrides.
        </div>
      )}
    </div>
  );
}
