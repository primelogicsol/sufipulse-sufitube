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
  thumbnailUrl?: string;
  posterUrl?: string;
  description: string;
  releaseDate: string;
  durationSeconds: number;
  durationFormatted: string;
  viewCount: number;
  likeCount: number;
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'unpublished' | 'archived';
  category?: string;
  releaseType?: string;
  
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
    sourceType?: 'manual' | 'srt' | 'vtt' | 'ass';
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
    lastUploadedAt?: string;
    lastFormat?: 'srt' | 'vtt';
    lastStatus?: 'synced' | 'unchanged' | 'failed';
    lastError?: string;
  }>;
  
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
    // On server-side, ensure we have seed data
    if (this.isServerSide && this.releases.size === 0) {
      this.initializeServerSideData();
    }
  }

  private initializeServerSideData(): void {
    // Seed with demo releases on server side
    const demoReleases: CMSRelease[] = [
      {
        id: 'sufipulse-001',
        title: "Qawwali: The Soul's Journey",
        slug: 'qawwali-souls-journey',
        youtubeId: 'lJIrF4E69e8',
        description: 'A powerful Sufi qawwali performance showcasing traditional devotional music.',
        releaseDate: '2025-02-15',
        durationSeconds: 525,
        durationFormatted: '8:45',
        viewCount: 15420,
        likeCount: 892,
        status: 'published' as const,
        category: 'Qawwali',
        releaseType: 'Live Performance',
        vocalist: { name: 'Nusrat Fateh Ali Khan', nameUrdu: 'نصرت فتح علی خان' },
        writer: { name: 'Amir Khusrow', nameUrdu: 'امیر خسرو' },
        producer: { name: 'SufiPulse USA' },
        enableLyrics: true,
        enableCommentary: true,
        enableSponsors: false,
        enableAdoption: true,
        enableCredits: true,
        availableLanguages: ['en', 'ur'],
        defaultLanguage: 'en',
        lyrics: {},
        subtitleCues: [],
        subtitleTranslations: { en: {}, ur: {} },
        subtitleStylePacks: {},
        createdAt: new Date('2025-02-15').toISOString(),
        updatedAt: new Date('2025-02-15').toISOString(),
        publishedAt: new Date('2025-02-15').toISOString(),
      },
      {
        id: 'sufipulse-002',
        title: 'The Garden of Divine Love',
        slug: 'garden-divine-love',
        youtubeId: 'LS8qPHGjQZU',
        description: "Exploring the mystical dimensions of divine love through Rumi's poetry and traditional Sufi music.",
        releaseDate: '2025-02-10',
        durationSeconds: 750,
        durationFormatted: '12:30',
        viewCount: 22150,
        likeCount: 1450,
        status: 'published' as const,
        category: 'Sufi Poetry',
        releaseType: 'Studio Recording',
        vocalist: { name: 'Abida Parveen', nameUrdu: 'عابدہ پروین' },
        writer: { name: 'Rumi', nameUrdu: 'روم' },
        producer: { name: 'SufiPulse USA' },
        enableLyrics: true,
        enableCommentary: true,
        enableSponsors: false,
        enableAdoption: true,
        enableCredits: true,
        availableLanguages: ['en', 'ur'],
        defaultLanguage: 'en',
        lyrics: {},
        subtitleCues: [],
        subtitleTranslations: { en: {}, ur: {} },
        subtitleStylePacks: {},
        createdAt: new Date('2025-02-10').toISOString(),
        updatedAt: new Date('2025-02-10').toISOString(),
        publishedAt: new Date('2025-02-10').toISOString(),
      },
      {
        id: 'sufipulse-003',
        title: 'Spiritual Journey: Voices of the Heart',
        slug: 'spiritual-journey-voices-heart',
        youtubeId: 'kJQP7kiOvtQ',
        description: 'A collection of Sufi spiritual performances featuring master musicians.',
        releaseDate: '2025-02-05',
        durationSeconds: 900,
        durationFormatted: '15:00',
        viewCount: 18800,
        likeCount: 1200,
        status: 'published' as const,
        category: 'Compilation',
        releaseType: 'Live Session',
        vocalist: { name: 'Rahat Fateh Ali Khan', nameUrdu: 'راہت فتح علی خان' },
        writer: { name: 'Hafiz', nameUrdu: 'حافظ' },
        producer: { name: 'SufiPulse USA' },
        enableLyrics: true,
        enableCommentary: true,
        enableSponsors: false,
        enableAdoption: true,
        enableCredits: true,
        availableLanguages: ['en', 'ur'],
        defaultLanguage: 'en',
        lyrics: {},
        subtitleCues: [],
        subtitleTranslations: { en: {}, ur: {} },
        subtitleStylePacks: {},
        createdAt: new Date('2025-02-05').toISOString(),
        updatedAt: new Date('2025-02-05').toISOString(),
        publishedAt: new Date('2025-02-05').toISOString(),
      },
    ];

    for (const release of demoReleases) {
      this.releases.set(release.id, release);
    }
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
