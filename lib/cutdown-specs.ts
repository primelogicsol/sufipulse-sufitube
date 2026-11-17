/**
 * lib/cutdown-specs.ts
 *
 * Content-Aware Strategic Viral Cutdown Specifications.
 * Pure logic defining 15s, 30s, and 45s cutdown target windows for YouTube Shorts,
 * Instagram Reels, and WhatsApp Status without native FFmpeg dependencies.
 */

export interface CutdownSpecTarget {
  id: string;
  name: string;
  hookType: 'hook_15s' | 'chorus_30s' | 'climax_45s';
  description: string;
  start: number;
  duration: number;
  fileName: string;
  onScreenTitle: string;
  publishingTitle: string;
  publishingDescription: string;
  relatedVideoId: string;
}

export function getContentAwareCutdownSpecs(
  draft: {
    id?: string;
    slug?: string;
    title?: string;
    masterTimeline?: { lines?: Array<{ section?: string; startSeconds: number; text?: string; isProductionDirection?: boolean }> } | null;
    downstreamStatus?: any;
    youtubeVideoId?: string;
    youtubeId?: string;
    [key: string]: any;
  },
  totalDuration = 300
): CutdownSpecTarget[] {
  const isFootprints =
    draft.id === 'draft_1794752884539_0eb391d5' ||
    draft.id === 'studio_draft_1794752884539_0eb391d5' ||
    draft.slug === 'footprints-behind' ||
    /footprints behind|کچھ لوگ نشاں/i.test(draft.title || '');

  if (isFootprints) {
    return [
      {
        id: 'hook_15s',
        name: 'Opening Short (Universal Emotional Hook)',
        hookType: 'hook_15s',
        onScreenTitle: 'SOME PEOPLE LEAVE FOOTPRINTS BEHIND',
        description: 'First strong vocal entry of main chorus: "Some people leave footprints behind, Not carved in stone, but into our lives."',
        start: 73.38,
        duration: 15.30,
        fileName: 'viral_cutdown_hook_15s.mp4',
        publishingTitle: 'Some People Leave Footprints Behind | A Life That Matters | SufiPulse USA #Shorts',
        publishingDescription: 'Some people leave footprints behind, not carved in stone, but in our lives.\n\nExperience the complete song by SufiPulse USA.\n\n#SufiPulseUSA #LifeAndLegacy #Shorts',
        relatedVideoId: 'G595CGkQ4jc',
      },
      {
        id: 'chorus_30s',
        name: "Craft Short (Kashmir's Artisans & Living Heritage)",
        hookType: 'chorus_30s',
        onScreenTitle: 'THE HANDS THAT KEEP KASHMIR ALIVE',
        description: 'Verse 2 leading into Craft Hook: "These are not just hands, These are stories of the land!"',
        start: 119.80,
        duration: 27.52,
        fileName: 'viral_cutdown_chorus_30s.mp4',
        publishingTitle: 'The Hands That Keep Kashmir Alive | SufiPulse USA #Shorts',
        publishingDescription: "Behind every handmade masterpiece is a person, a family and generations of inherited knowledge.\n\nA musical celebration of Kashmir's artisans.\n\nFull song: Some People Leave Footprints Behind.\n\n#KashmirCrafts #KashmirArtisans #SufiPulseUSA #Shorts",
        relatedVideoId: 'G595CGkQ4jc',
      },
      {
        id: 'climax_45s',
        name: 'Legacy Short (Philosophical Climax & Lasting Legacy)',
        hookType: 'climax_45s',
        onScreenTitle: 'WHAT WILL REMAIN OF YOUR LIFE?',
        description: 'Bridge and final chorus: "What matters isn\'t who we were, But what we helped the world become."',
        start: 308.52,
        duration: 38.24,
        fileName: 'viral_cutdown_climax_45s.mp4',
        publishingTitle: 'What Will Remain of Your Life? | SufiPulse USA #Shorts',
        publishingDescription: "What matters isn't who we were, but what we helped the world become.\n\nSome People Leave Footprints Behind.\n\nA reflection on kindness, legacy and human purpose.\n\n#LifePurpose #SufiPulseUSA #Shorts",
        relatedVideoId: 'G595CGkQ4jc',
      },
    ];
  }

  // Dynamic content-aware extraction for subsequent songs using lyric timeline cues
  const lines = (draft.masterTimeline?.lines || []).filter(l => !l.isProductionDirection && l.text?.trim());

  // Find chorus entry or first major vocal hook
  const chorusLine = lines.find(l => /chorus|مکھڑا|hook/i.test(l.section || '')) ||
    lines.find(l => l.startSeconds >= 40 && l.startSeconds <= 90) ||
    lines[0];
  const hook1Start = chorusLine ? Math.max(0, chorusLine.startSeconds) : 0;
  const hook1Dur = Math.min(15, Math.max(5, totalDuration - hook1Start));

  // Find rhythmic hook or verse 2 passage
  const secondSection = lines.find(l => l.startSeconds > hook1Start + 20 && l.startSeconds < totalDuration * 0.6) ||
    lines.find(l => l.startSeconds >= Math.min(60, totalDuration * 0.3));
  const chorusStart = secondSection ? secondSection.startSeconds : Math.min(60, Math.max(0, totalDuration - 35));
  const chorusDur = Math.min(30, totalDuration - chorusStart);

  // Find philosophical climax or bridge
  const bridgeLine = lines.find(l => /bridge|climax|خاتمہ|outro/i.test(l.section || '')) ||
    lines.find(l => l.startSeconds >= totalDuration * 0.65);
  const climaxStart = bridgeLine ? bridgeLine.startSeconds : Math.min(Math.round(totalDuration * 0.65), Math.max(0, totalDuration - 45));
  const climaxDur = Math.min(45, totalDuration - climaxStart);

  return [
    {
      id: 'hook_15s',
      name: '15s Universal Chorus Hook',
      hookType: 'hook_15s',
      onScreenTitle: (draft.title || '').toUpperCase(),
      description: 'First high-impact chorus vocal hook, capturing immediate interest.',
      start: hook1Start,
      duration: hook1Dur,
      fileName: 'viral_cutdown_hook_15s.mp4',
      publishingTitle: `${draft.title || 'Kalam'} | SufiPulse USA #Shorts`,
      publishingDescription: `Experience ${draft.title || 'this release'} by SufiPulse USA.\n\n#SufiPulseUSA #Shorts`,
      relatedVideoId: (draft as any).downstreamStatus?.publishedYoutubeId || '',
    },
    {
      id: 'chorus_30s',
      name: '30s Core Thematic Passage',
      hookType: 'chorus_30s',
      onScreenTitle: (draft.title || '').toUpperCase(),
      description: 'Central melodic and lyrical core, highlighting the song identity.',
      start: chorusStart,
      duration: chorusDur,
      fileName: 'viral_cutdown_chorus_30s.mp4',
      publishingTitle: `${draft.title || 'Kalam'} | The Essence | SufiPulse USA #Shorts`,
      publishingDescription: `The soul of ${draft.title || 'this release'}. Full release on SufiPulse USA.\n\n#SufiPulseUSA #Shorts`,
      relatedVideoId: (draft as any).downstreamStatus?.publishedYoutubeId || '',
    },
    {
      id: 'climax_45s',
      name: '45s Climax & Resolution',
      hookType: 'climax_45s',
      onScreenTitle: (draft.title || '').toUpperCase(),
      description: 'Philosophical resolution and climax, inspiring viewers to listen to the full master.',
      start: climaxStart,
      duration: climaxDur,
      fileName: 'viral_cutdown_climax_45s.mp4',
      publishingTitle: `${draft.title || 'Kalam'} | Full Journey | SufiPulse USA #Shorts`,
      publishingDescription: `Where will the journey lead? Experience the full masterpiece: ${draft.title || 'this release'}.\n\n#SufiPulseUSA #Shorts`,
      relatedVideoId: (draft as any).downstreamStatus?.publishedYoutubeId || '',
    },
  ];
}
