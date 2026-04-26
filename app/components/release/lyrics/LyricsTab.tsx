import React, { useMemo } from 'react';
import { ChevronDown, Share2, Copy, Bubbles as Subtitles, CircleAlert as AlertCircle, FileText } from 'lucide-react';
import { LYRIC_LANGUAGES, LanguageKey, LyricsTrack } from './lyricsData';

interface LyricsTabProps {
  selectedLanguage: LanguageKey;
  onLanguageChange: (key: LanguageKey) => void;
  currentTime: number;
  onSeekRequest: (time: number) => void;
  captionsEnabled: boolean;
  onToggleCaptions: () => void;
  tracks?: Partial<Record<LanguageKey, LyricsTrack>>;
}

export function LyricsTab({
  selectedLanguage,
  onLanguageChange,
  currentTime,
  onSeekRequest,
  captionsEnabled,
  onToggleCaptions,
  tracks = {},
}: LyricsTabProps) {
  const track = tracks[selectedLanguage] ?? tracks[Object.keys(tracks)[0] as LanguageKey] ?? null;
  const direction = track?.direction ?? 'ltr';

  const activeCue = useMemo(() => {
    return track?.cues.find(c => currentTime >= c.start && currentTime < c.end);
  }, [currentTime, track]);

  const handleLineClick = (stanzaIndex: number, lineIndex: number) => {
    const cue = track?.cues.find(c => c.stanza === stanzaIndex + 1 && c.line === lineIndex + 1);
    if (cue) onSeekRequest(cue.start);
  };

  const visibleKeys = [
    'roman_urdu', 'urdu', 'hindi', 'arabic', 'turkish', 'persian',
    'english', 'spanish', 'french', 'russian',
  ];

  const visibleLangs = LYRIC_LANGUAGES.filter(lang => visibleKeys.includes(lang.key));
  const overflowLangs = LYRIC_LANGUAGES.filter(lang => !visibleKeys.includes(lang.key));

  if (!track) {
    return (
      <div className="pt-8">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-12 text-center">
          <FileText className="w-10 h-10 text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-400 text-lg font-light">Lyrics not yet available for this release.</p>
          <p className="text-neutral-600 text-sm mt-2">Check back later or contact the editorial team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8">
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-neutral-800 pb-6">
          <div>
            <h3 className="text-3xl font-serif font-light text-neutral-100 flex items-center gap-3">
              <FileText className="w-6 h-6 text-amber-500" />
              Lyrics System
            </h3>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">Language:</span>
                <span className="font-medium text-neutral-200">{track.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">Type:</span>
                <span className="font-medium text-neutral-200 capitalize">{track.versionType || 'Standard'}</span>
              </div>
              {track.verified && (
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">Status:</span>
                  <span className="font-medium text-green-400">Verified</span>
                </div>
              )}
              {track.translator && (
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">Reviewed by:</span>
                  <span className="font-medium text-neutral-200">{track.translator}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors" title="Copy Lyrics">
              <Copy className="w-4 h-4" />
            </button>
            <button className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors" title="Share This Version">
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleCaptions}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${captionsEnabled ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-transparent'}`}
            >
              <Subtitles className="w-4 h-4" />
              {captionsEnabled ? 'CC On' : 'CC Off'}
            </button>
          </div>
        </div>

        {/* Language Selector */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-2 items-center">
            {visibleLangs.map((lang) => (
              <button
                key={lang.key}
                onClick={() => onLanguageChange(lang.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedLanguage === lang.key
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                  }`}
              >
                {lang.label}
              </button>
            ))}

            <div className="relative group/dropdown ml-auto">
              <button className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${overflowLangs.some(l => l.key === selectedLanguage)
                ? 'bg-neutral-100 text-neutral-900'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                }`}>
                {overflowLangs.find(l => l.key === selectedLanguage)?.label || 'More Languages'}
                <ChevronDown className="w-4 h-4" />
              </button>

              <div className="absolute top-full right-0 lg:left-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-20 overflow-hidden">
                <div className="py-2 max-h-64 overflow-y-auto scrollbar-hide">
                  {overflowLangs.map(lang => (
                    <button
                      key={lang.key}
                      onClick={() => onLanguageChange(lang.key)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedLanguage === lang.key ? 'bg-amber-500/20 text-amber-400' : 'text-neutral-300 hover:bg-neutral-700'
                        }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lyrics Body */}
        <div className={`space-y-6 min-h-[400px] ${direction === 'rtl' ? 'text-right font-urdu' : 'text-left'}`} dir={direction}>
          {track.fullLyrics.map((stanzaBlock, sIdx) => (
            <div key={sIdx} className="space-y-2">
              {stanzaBlock.lines.map((lineText, lIdx) => {
                const cueForLine = track.cues.find(c => c.stanza === stanzaBlock.stanza && c.line === lIdx + 1);
                const isActive = activeCue?.id && cueForLine?.id === activeCue.id;

                return (
                  <p
                    key={lIdx}
                    onClick={() => handleLineClick(sIdx, lIdx)}
                    className={`text-base sm:text-lg transition-all duration-300 cursor-pointer ${isActive
                      ? 'text-amber-400 font-medium scale-[1.02] origin-left drop-shadow-md'
                      : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                  >
                    {lineText}
                  </p>
                );
              })}
            </div>
          ))}
        </div>

        {/* Actions Row */}
        <div className="mt-12 pt-6 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4">
          <button className="text-sm text-neutral-500 hover:text-neutral-300 flex items-center gap-2 transition-colors">
            <AlertCircle className="w-4 h-4" /> Report Correction
          </button>
          <button className="text-sm text-amber-500 hover:text-amber-400 transition-colors font-medium">
            Compare Versions
          </button>
        </div>

      </div>
    </div>
  );
}
