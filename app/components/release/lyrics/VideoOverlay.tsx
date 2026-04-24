import React, { useMemo } from 'react';
import { LyricsTrack } from './lyricsData';

interface VideoOverlayProps {
  track: LyricsTrack;
  currentTime: number;
  captionsEnabled: boolean;
  fontSizeScale?: number;
}

export function VideoOverlay({ track, currentTime, captionsEnabled, fontSizeScale = 1 }: VideoOverlayProps) {
  const assColorToCss = (value?: string, fallback?: string) => {
    const source = String(value || '').trim();
    if (!source) return fallback;
    if (source.startsWith('#')) return source;

    const match = source.match(/&?H([0-9A-Fa-f]{8})/);
    if (!match) return fallback;

    const hex = match[1].toUpperCase();
    const bb = hex.slice(2, 4);
    const gg = hex.slice(4, 6);
    const rr = hex.slice(6, 8);
    return `#${rr}${gg}${bb}`;
  };

  const resolveAnchor = (alignment?: number) => {
    const safe = Number.isFinite(alignment as number) ? Number(alignment) : 2;
    if ([1, 4, 7].includes(safe)) return { x: 'left', y: safe >= 7 ? 'top' : safe >= 4 ? 'middle' : 'bottom' } as const;
    if ([3, 6, 9].includes(safe)) return { x: 'right', y: safe >= 7 ? 'top' : safe >= 4 ? 'middle' : 'bottom' } as const;
    return { x: 'center', y: safe >= 7 ? 'top' : safe >= 4 ? 'middle' : 'bottom' } as const;
  };

  const activeCue = useMemo(() => {
    if (!captionsEnabled) return null;
    return track.cues.find(c => currentTime >= c.start && currentTime < c.end);
  }, [currentTime, track.cues, captionsEnabled]);

  if (!captionsEnabled || !activeCue) return null;

  const anchor = resolveAnchor(activeCue.alignment);
  const hasCustomPosition = Number.isFinite(activeCue.positionX) && Number.isFinite(activeCue.positionY);

  const overlayPlacementClass = hasCustomPosition
    ? 'absolute inset-0 pointer-events-none z-10 transition-all duration-300'
    : `absolute ${anchor.y === 'top' ? 'top-8 sm:top-12' : anchor.y === 'middle' ? 'top-1/2 -translate-y-1/2' : 'bottom-16 sm:bottom-20'} left-0 right-0 w-full px-4 sm:px-12 flex pointer-events-none z-10 transition-all duration-300 ${anchor.x === 'left' ? 'justify-start' : anchor.x === 'right' ? 'justify-end' : 'justify-center'}`;

  const containerStyle: React.CSSProperties = hasCustomPosition
    ? {
        position: 'absolute',
        left: `${Math.max(0, Math.min(100, Number(activeCue.positionX)))}%`,
        top: `${Math.max(0, Math.min(100, Number(activeCue.positionY)))}%`,
        transform: `translate(${anchor.x === 'left' ? '0%' : anchor.x === 'right' ? '-100%' : '-50%'}, ${anchor.y === 'top' ? '0%' : anchor.y === 'bottom' ? '-100%' : '-50%'})`,
      }
    : {};

  const captionBoxStyle: React.CSSProperties = {
    maxWidth: `${Math.max(40, Math.min(100, Number(activeCue.maxWidthPercent || 82)))}%`,
    backgroundColor: assColorToCss(activeCue.backColor, 'rgba(23, 23, 23, 0.5)'),
    borderColor: assColorToCss(activeCue.outlineColor, 'rgba(64, 64, 64, 0.5)'),
    boxShadow: `0 8px 30px rgba(0,0,0,${activeCue.shadow ? 0.42 : 0.3})`,
  };

  // Dynamically calculate base font size for responsiveness.
  // Using clamped viewport units guarantees it is big enough on larger screens.
  const responsiveBaseFontSize = `clamp(16px, 2vw + 10px, 48px)`;
  const rawSize = activeCue.fontSize ? `${Math.max(12, Math.min(84, activeCue.fontSize))}px` : responsiveBaseFontSize;

  const textStyle: React.CSSProperties = {
    color: assColorToCss(activeCue.primaryColor, '#FFFFFF'),
    fontFamily: activeCue.fontFamily || undefined,
    fontSize: `calc(${rawSize} * ${fontSizeScale})`,
    fontWeight: activeCue.bold ? 700 : 500,
    fontStyle: activeCue.italic ? 'italic' : 'normal',
    textShadow: `0 0 ${Math.max(1, Math.min(6, Number(activeCue.outline || 2)))}px ${assColorToCss(activeCue.outlineColor, '#222222')}`,
  };

  return (
    <div className={overlayPlacementClass} style={containerStyle}>
      <div
        className="backdrop-blur-md rounded-xl text-center w-full"
        style={{
            ...captionBoxStyle,
            // Use 'em' inside inline styles to ensure the container scales padding proportionately to font-size chosen
            padding: '0.6em 1.25em',
            fontSize: textStyle.fontSize // Apply font size to parent so 'em' works flawlessly for padding
        }}
        dir={track.direction}
      >
        <p className={`tracking-wide leading-[1.3] ${track.direction === 'rtl' ? 'font-urdu' : ''}`} style={{ ...textStyle, fontSize: '1em' }}>
          {activeCue.text}
        </p>
      </div>
    </div>
  );
}
