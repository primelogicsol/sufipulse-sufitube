/**
 * CMS Storage Service
 * Manages releases in localStorage with CRUD operations
 * Can be swapped with Supabase when ready
 */

export interface CMSRelease {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  youtubeId: string;
  youtubeUrl?: string;
  youtubeChannelId?: string;
  youtubeChannelUrl?: string;
  youtubePlaylistId?: string;
  thumbnailUrl?: string;
  posterUrl?: string;
  description: string;
  releaseDate: string;
  durationSeconds: number;
  durationFormatted: string;
  viewCount: number;
  likeCount: number;
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'unpublished' | 'archived';
  contentReadinessState?: 'draft' | 'editorial_ready' | 'web_published' | 'youtube_delivery_in_progress' | 'fully_delivered' | 'delivery_attention_required';
  category?: string;
  releaseType?: string;
  
  // Streaming platforms
  streamingPlatforms?: Array<{
    platform: string;
    url?: string;
    status: string;
  }>;
  
  // Credits
  writer?: { name: string; nameUrdu?: string };
  vocalist?: { name: string; nameUrdu?: string };
  chorusVocalists?: string[];
  producer?: { name: string };
  
  // Features
  enableLyrics: boolean;
  enableCommentary: boolean;
  enableSponsors: boolean;
  enableAdoption: boolean;
  enableCredits: boolean;

  // Public page managed content
  publicCommentary?: Array<{
    id: string;
    title: string;
    content: string;
    isPublished?: boolean;
  }>;
  publicSponsorsIntro?: string;
  publicSponsors?: Array<{
    id: string;
    name: string;
    role?: string;
    logoUrl?: string;
    isPublished?: boolean;
  }>;
  publicCredits?: {
    artistic?: {
      leadVocalist?: string;
      lyricist?: string;
      composer?: string;
      musicProducer?: string;
      backgroundVocals?: string;
    };
    production?: {
      recordedAt?: string;
      recordingEngineer?: string;
      mixMaster?: string;
      soundDesign?: string;
      productionSupervision?: string;
    };
    visual?: {
      videoDirection?: string;
      editing?: string;
      thumbnailDesign?: string;
      artwork?: string;
    };
    literary?: {
      romanTransliteration?: string;
      englishTranslation?: string;
      thematicInterpretation?: string;
      proofreading?: string;
    };
    rights?: {
      publishedBy?: string;
      platform?: string;
      registeredReleaseId?: string;
      releaseDateText?: string;
      copyrightHolder?: string;
      licensingText?: string;
      licensingUrl?: string;
    };
  };
  
  // Metadata
  availableLanguages: string[];
  defaultLanguage: string;
  lyrics: Record<string, Array<{
    urdu: string;
    transliteration: string;
    translation: string;
    timestamp: string;
  }>>;
  lyricsStructure?: Record<string, Array<{
    id: string;
    type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'hook' | 'refrain' | 'outro' | 'other';
    heading?: string;
    lines: string[];
    order?: number;
    isPublished?: boolean;
  }>>;

  // Subtitle CMS model (master timing + per-language cue text)
  masterTimingVersion?: number;
  subtitleCues?: Array<{
    id: string;
    cueNumber: number;
    startTime: string; // HH:MM:SS.mmm
    endTime: string; // HH:MM:SS.mmm
    lineRef?: string;
    sourceType?: 'manual' | 'srt' | 'vtt' | 'ass' | 'youtube_captions' | 'video_ocr';
    active?: boolean;
  }>;
  subtitleTranslations?: Record<string, Record<string, string>>;
  subtitleLanguageStatuses?: Record<string, 'draft' | 'in_translation' | 'under_review' | 'verified' | 'published' | 'archived'>;
  subtitleLanguageAssignments?: Record<string, { translator?: string; reviewer?: string }>;
  masterAssSource?: string;
  subtitleCueMetadata?: Record<string, {
    stanzaId?: string;
    lineRole?: 'verse' | 'refrain' | 'chorus' | 'bridge' | 'hook' | 'other';
    toneTag?: string;
    emphasisTag?: string;
    styleName?: string;
    alignment?: number;
    positionX?: number;
    positionY?: number;
    marginL?: number;
    marginR?: number;
    marginV?: number;
    karaokeEffect?: 'none' | 'k' | 'kf' | 'ko';
    karaokeDurationsMs?: string;
    meaningNote?: string;
    glossaryTerms?: string[];
  }>;
  subtitleStylePacks?: Record<string, {
    fontFamily?: string;
    fontSize?: number;
    primaryColor?: string;
    secondaryColor?: string;
    outlineColor?: string;
    backColor?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    scaleX?: number;
    scaleY?: number;
    spacing?: number;
    angle?: number;
    outline?: number;
    shadow?: number;
    alignment?: number;
    marginL?: number;
    marginR?: number;
    marginV?: number;
    maxWidthPercent?: number;
  }>;
  // Custom / extended language definitions beyond the 17 presets
  customLanguages?: Array<{code: string; label: string}>;
  // Label overrides for any language (preset or custom)
  languageLabels?: Record<string, string>;
  // Per-language translation tone preference
  translationTone?: Record<string, string>;
  // Per-language, per-cue review status after auto-translation
  translationReviewStatus?: Record<string, Record<string, 'ai' | 'manual' | 'accepted'>>;

  languageStyleOverrides?: Record<string, {
    rtl?: boolean;
    scriptType?: string;
    stylePack?: string;
  }>;
  translationPolicy?: {
    globalToneRules?: string[];
    languageProfiles?: Record<string, string>;
    glossary?: Record<string, {
      mode: 'keep' | 'transliterate' | 'literal' | 'interpretive' | 'annotate';
      note?: string;
    }>;
  };
  subtitleReviewLogs?: Array<{
    id: string;
    language: string;
    status: 'draft' | 'in_translation' | 'under_review' | 'verified' | 'published' | 'archived';
    comment?: string;
    actor?: string;
    createdAt: string;
  }>;

  // YouTube captions sync state
  youtubeSubtitleAutoSync?: boolean;
  youtubeCaptionTracks?: Record<string, {
    captionId?: string;
    language?: string;
    lastSyncHash?: string;
    lastSyncAttemptAt?: string;
    lastUploadedAt?: string;
    lastExportedAt?: string;
    lastFormat?: 'srt' | 'vtt';
    lastStatus?: 'synced' | 'unchanged' | 'failed';
    deliveryState?: 'web_only' | 'synced_to_youtube' | 'manual_upload_pending' | 'manual_upload_completed' | 'sync_failed';
    manualUploadActor?: string;
    manualUploadAt?: string;
    manualUploadNotes?: string;
    lastError?: string;
  }>;
  
  socialShareKit?: {
    generatedAt: string;
    whatsapp: string;
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    telegram: string;
  };

  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

const STORAGE_KEY = 'sufipulse_cms_releases';

// Server-side in-memory storage for when localStorage isn't available
let serverSideReleases: Array<[string, CMSRelease]> | null = null;

class CMSStorage {
  private releases: Map<string, CMSRelease> = new Map();
  private isServerSide: boolean = typeof window === 'undefined';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') {
      // Server-side: use in-memory storage if available
      if (serverSideReleases) {
        this.releases = new Map(serverSideReleases);
      }
      return;
    }
    
    // Client-side: use localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.releases = new Map(data);
      }
    } catch (error) {
      console.error('Failed to load CMS releases from storage:', error);
    }
  }

  private saveToStorage(): void {
    const data = Array.from(this.releases.entries());
    
    if (typeof window === 'undefined') {
      // Server-side: save to in-memory storage
      serverSideReleases = data;
      return;
    }
    
    // Client-side: save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save CMS releases to storage:', error);
    }
  }

  // Create or Update
  saveRelease(release: CMSRelease): CMSRelease {
    const now = new Date().toISOString();
    const releaseData: CMSRelease = {
      ...release,
      updatedAt: now,
      createdAt: release.createdAt || now,
      ...(release.status === 'published' && { publishedAt: release.publishedAt || now })
    };

    this.releases.set(release.id, releaseData);
    this.saveToStorage();
    return releaseData;
  }

  // Read
  getRelease(id: string): CMSRelease | null {
    return this.releases.get(id) || null;
  }

  getReleaseBySlug(slug: string): CMSRelease | null {
    for (const release of this.releases.values()) {
      if (release.slug === slug) {
        return release;
      }
    }
    return null;
  }

  getReleaseByYoutubeId(youtubeId: string): CMSRelease | null {
    for (const release of this.releases.values()) {
      if (release.youtubeId === youtubeId) {
        return release;
      }
    }
    return null;
  }

  getAllReleases(filter?: { status?: string; category?: string }): CMSRelease[] {
    let releases = Array.from(this.releases.values());

    if (filter?.status) {
      releases = releases.filter(r => r.status === filter.status);
    }
    if (filter?.category) {
      releases = releases.filter(r => r.category === filter.category);
    }

    return releases.sort((a, b) => 
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );
  }

  getPublishedReleases(limit?: number): CMSRelease[] {
    const releases = this.getAllReleases({ status: 'published' });
    return limit ? releases.slice(0, limit) : releases;
  }

  // Delete
  deleteRelease(id: string): boolean {
    const deleted = this.releases.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  // Archive
  archiveRelease(id: string): CMSRelease | null {
    const release = this.releases.get(id);
    if (!release) return null;

    const archived: CMSRelease = {
      ...release,
      status: 'archived',
      updatedAt: new Date().toISOString()
    };

    this.releases.set(id, archived);
    this.saveToStorage();
    return archived;
  }

  // Publish
  publishRelease(id: string): CMSRelease | null {
    const release = this.releases.get(id);
    if (!release) return null;

    const published: CMSRelease = {
      ...release,
      status: 'published',
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.releases.set(id, published);
    this.saveToStorage();
    return published;
  }

  // Unpublish
  unpublishRelease(id: string): CMSRelease | null {
    const release = this.releases.get(id);
    if (!release) return null;

    const unpublished: CMSRelease = {
      ...release,
      status: 'unpublished',
      updatedAt: new Date().toISOString()
    };

    this.releases.set(id, unpublished);
    this.saveToStorage();
    return unpublished;
  }

  // Bulk operations
  importReleases(releases: CMSRelease[]): CMSRelease[] {
    const imported: CMSRelease[] = [];
    for (const release of releases) {
      imported.push(this.saveRelease(release));
    }
    return imported;
  }

  exportReleases(): CMSRelease[] {
    return Array.from(this.releases.values());
  }

  clearAll(): void {
    this.releases.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  getStats(): { total: number; published: number; draft: number; archived: number } {
    const releases = Array.from(this.releases.values());
    return {
      total: releases.length,
      published: releases.filter(r => r.status === 'published').length,
      draft: releases.filter(r => r.status === 'draft').length,
      archived: releases.filter(r => r.status === 'archived').length
    };
  }
}

// Export singleton
export const cmsStorage = new CMSStorage();
