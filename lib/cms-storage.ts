/**
 * CMS Storage Service
 * Manages releases in localStorage with CRUD operations
 * Can be swapped with Supabase when ready
 */

import { sortReleases } from './release-utils';

export type DistributionStatus =
  | 'not_started'
  | 'pending'
  | 'scheduled'
  | 'processing'
  | 'published'
  | 'partially_live'
  | 'unavailable'
  | 'failed'
  | 'archived';

export interface PlatformDistribution {
  platform: 'sufipulse_radio' | 'youtube' | 'spotify' | 'apple_music' | 'instagram' | 'x' | 'facebook';
  youtubeContentType?: 'SHORTS' | 'VIDEO_ON_DEMAND' | 'LIVE_STREAM' | 'UNSPECIFIED';
  formatClassificationSource?: 'youtube_analytics' | 'youtube_shorts_surface' | 'dashboard' | 'legacy' | 'inferred';
  status: DistributionStatus;
  url?: string;
  publishedAt?: string;
  lastCheckedAt?: string;
  notes?: string;
  isVerified: boolean;
  isVisible: boolean;
}

export type GovernanceOrigin = 'native_governed' | 'legacy_registry' | 'unresolved';

export interface CMSRelease {
  id: string;
  title: string; // Canonical Release Title (Registry Authority)
  canonicalTitle?: string;
  canonicalStatus?: 'verified' | 'inferred' | 'unresolved';
  governanceOrigin?: GovernanceOrigin;
  govType?: GovernanceOrigin;
  metadataStatus?: 'synced' | 'drift_detected' | 'overridden';
  subtitle?: string;
  slug: string;
  youtubeId: string;
  youtubeUrl?: string;
  youtubeChannelId?: string;
  youtubeChannelUrl?: string;
  youtubePlaylistId?: string;
  thumbnailUrl?: string; // Canonical Artwork (Registry Authority)
  canonicalThumbnail?: string;
  youtubeTitle?: string; // Current YouTube packaging title
    titleOverride?: boolean;
    titleOverrideAt?: string | null;
    titleOverrideBy?: string | null;
    descriptionOverride?: boolean;
    descriptionOverrideAt?: string | null;
    descriptionOverrideBy?: string | null;
  youtubeDescription?: string;
  youtubeTitleVariantA?: string;
  youtubeTitleVariantB?: string;
  youtubeTitleVariantC?: string;
  youtubeWinningVariant?: 'A' | 'B' | 'C' | 'pending';
  youtubeTitleLastSyncedAt?: string;
  youtubeContentType?: 'SHORTS' | 'VIDEO_ON_DEMAND' | 'LIVE_STREAM' | 'UNSPECIFIED';
  formatClassificationSource?: 'youtube_analytics' | 'youtube_shorts_surface' | 'dashboard' | 'legacy' | 'inferred';
  youtubeThumbnailUrl?: string; // Current YouTube thumbnail
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
  format?: 'video' | 'audio' | 'short' | 'live' | 'playlist';
  audioUrl?: string;
  webOnly?: boolean;
  source?: string;
  visibility?: 'public' | 'private' | 'unlisted';

  // Premiere Room & Pre-Release Lifecycle fields
  releaseLifecycle?: 'upcoming' | 'teaser_live' | 'premiere_scheduled' | 'released' | 'archived';
  officialReleaseAt?: string;
  premiereAnnouncedAt?: string;
  isFeaturedPremiere?: boolean;
  premiereVisibility?: 'private' | 'public';
  preReleaseAssets?: Array<{
    id: string;
    type: 'premium_teaser' | 'first_listen' | 'trailer' | 'premiere_announcement';
    title?: string;
    youtubeId?: string;
    youtubeUrl?: string;
    thumbnailUrl?: string;
    publishedAt?: string;
    scheduledAt?: string;
    status: 'draft' | 'scheduled' | 'live' | 'archived';
  }>;

  // Distribution state per platform
  distribution?: Record<string, PlatformDistribution>;
  
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
  
  // YouTube Operational Metadata (Cached)
  youtubeStats?: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    duration: string;
    durationSeconds: number;
    publishedAt: string;
    thumbnailUrl: string;
    title: string;
    liveBroadcastContent: string;
  };
  lastYoutubeSyncAt?: string;

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
  
  youtubeCategory?: {
    id?: string;
    name?: string;
  };
  youtubeLicense?: string;
  privacyStatus?: string;
  embeddable?: boolean;
  regionRestriction?: any;
  licensedContent?: boolean;
  recordingDate?: string;
  recordingLocation?: string;
  defaultAudioLanguage?: string;

  youtubeCaptionTracks?: Record<string, {
    captionCertification?: {
      youtubeStatus: string;
      youtubeTrackKind: string;
      sufipulseStatus: 'unreviewed' | 'verified' | 'needs_revision';
      verifiedBy?: string;
      verifiedAt?: string;
    };
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

  // Release Intelligence Fields
  targetRegions?: string[];
  targetDiaspora?: string[];
  targetLanguages?: string[];
  sufiConcepts?: string[];
  themes?: string[];
  moods?: string[];
  seoKeywords?: string[];
  relatedReleases?: string[];
  relatedPlaylists?: string[];
  intelligenceStatus?: 'draft' | 'reviewed' | 'approved';
  intelligenceUpdatedAt?: string;

  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface LyricsRequest {
  id: string;
  releaseId: string;
  releaseSlug: string;
  releaseTitle: string;
  youtubeId?: string;
  languageCode: string;
  languageName: string;
  requestType: 'lyrics_translation';
  requesterName?: string;
  requesterEmail?: string;
  userId?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'in_translation' | 'published' | 'rejected' | 'archived';
  priority: 'normal' | 'high' | 'urgent';
  requestedMessage?: string;
  adminNotes?: string;
  translatedLyrics?: string;
  translationNotes?: string;
  completedBy?: string;
  completedAt?: string;
  sentToUser: boolean;
  sentToUserAt?: string;
  notifyWhenPublished?: boolean;
  notificationSentAt?: string;
  publishedToRelease: boolean;
  publishedAt?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const PLATFORMS = [
  { id: 'sufipulse_radio', label: 'SufiPulse Radio' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'spotify', label: 'Spotify' },
  { id: 'apple_music', label: 'Apple Music' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'x', label: 'X' },
  { id: 'facebook', label: 'Facebook' },
] as const;

export function getDefaultDistribution(): Record<string, PlatformDistribution> {
  const dist: Record<string, PlatformDistribution> = {};
  PLATFORMS.forEach(p => {
    dist[p.id] = {
      platform: p.id as any,
      status: 'not_started',
      isVerified: false,
      isVisible: true,
    };
  });
  return dist;
}

const STORAGE_KEY = 'sufipulse_cms_releases';
const REQUESTS_STORAGE_KEY = 'sufipulse_lyrics_requests';

// Server-side in-memory storage for when localStorage isn't available
let serverSideReleases: Array<[string, CMSRelease]> | null = null;
let serverSideRequests: Array<[string, LyricsRequest]> | null = null;

class CMSStorage {
  private releases: Map<string, CMSRelease> = new Map();
  private requests: Map<string, LyricsRequest> = new Map();
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
      if (serverSideRequests) {
        this.requests = new Map(serverSideRequests);
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
      const storedReq = localStorage.getItem(REQUESTS_STORAGE_KEY);
      if (storedReq) {
        const data = JSON.parse(storedReq);
        this.requests = new Map(data);
      }
    } catch (error) {
      console.error('Failed to load CMS data from storage:', error);
    }
  }

  private saveToStorage(): void {
    const data = Array.from(this.releases.entries());
    const reqData = Array.from(this.requests.entries());
    
    if (typeof window === 'undefined') {
      // Server-side: save to in-memory storage
      serverSideReleases = data;
      serverSideRequests = reqData;
      return;
    }
    
    // Client-side: save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(reqData));
    } catch (error) {
      console.error('Failed to save CMS data to storage:', error);
    }
  }

  // Lyrics Requests
  saveLyricsRequest(request: LyricsRequest): LyricsRequest {
    const now = new Date().toISOString();
    const reqData: LyricsRequest = {
      ...request,
      updatedAt: now,
      createdAt: request.createdAt || now
    };

    this.requests.set(request.id, reqData);
    this.saveToStorage();
    return reqData;
  }

  getLyricsRequest(id: string): LyricsRequest | null {
    return this.requests.get(id) || null;
  }

  getAllLyricsRequests(): LyricsRequest[] {
    return Array.from(this.requests.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  deleteLyricsRequest(id: string): boolean {
    const deleted = this.requests.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  importLyricsRequests(reqs: LyricsRequest[]): void {
    for (const req of reqs) {
      this.requests.set(req.id, req);
    }
    this.saveToStorage();
  }

  exportLyricsRequests(): LyricsRequest[] {
    return Array.from(this.requests.values());
  }

  // Create or Update
  saveRelease(release: CMSRelease): CMSRelease {
    const now = new Date().toISOString();

    // ── YouTube ID validation ─────────────────────────────────────────────────
    // Rule: YouTube ID is required ONLY when a YouTube-backed asset is scheduled or live.
    // A release in any Premiere lifecycle (upcoming, teaser_live, premiere_scheduled)
    // is a valid public announcement WITHOUT a YouTube ID.
    // The presence of youtubeId controls whether a player renders — not whether the
    // record is allowed to be public. This is the SufiPulse editorial-first model.
    //
    // The old rule (YouTube ID required for any published release) is REMOVED.
    // It was wrong for the Premiere Room workflow.

    // Premiere announcement lifecycles — never require a YouTube ID
    const PREMIERE_ANNOUNCEMENT_LIFECYCLES = new Set([
      'upcoming', 'teaser_live', 'premiere_scheduled'
    ]);

    // Check if any pre-release asset requires a YouTube ID it doesn't have
    const invalidYouTubeAssets = (release.preReleaseAssets ?? []).filter(
      (a: any) =>
        a.source === 'youtube' &&
        ['scheduled', 'live'].includes(a.status ?? '') &&
        !a.youtubeId
    );
    if (invalidYouTubeAssets.length > 0) {
      const assetLabels = invalidYouTubeAssets.map((a: any) => a.type || 'asset').join(', ');
      throw new Error(
        `YouTube ID is required for scheduled/live YouTube-backed assets: ${assetLabels}. ` +
        `Add a YouTube ID or set the asset to draft status.`
      );
    }


    // Ensure distribution is initialized
    const distribution = release.distribution || getDefaultDistribution();
    
    // Sync YouTube if it's new or was legacy
    if (release.youtubeId && distribution.youtube && distribution.youtube.status === 'not_started') {
      distribution.youtube = {
        ...distribution.youtube,
        status: 'published',
        url: release.youtubeUrl || `https://www.youtube.com/watch?v=${release.youtubeId}`,
        publishedAt: release.publishedAt || release.releaseDate,
        isVerified: true
      };
    }

    const releaseData: CMSRelease = {
      ...release,
      distribution,
      updatedAt: release.updatedAt || (release as any).updated_at || now, // Keep existing updatedAt or set once
      ...(release.createdAt && { createdAt: release.createdAt }),
      ...(release.status === 'published' && release.publishedAt && { publishedAt: release.publishedAt })
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
    
    // Normalize fields for consistent filtering/rendering
    const normalized = releases.map((r, index) => ({
      ...r,
      status: r.status || 'published',
      visibility: r.visibility || 'public',
      format: r.format || 'video',
      releaseType: r.releaseType || 'studio-release',
      publishedAt: r.publishedAt || r.releaseDate || r.createdAt,
      registryOrder: index
    }));

    let filtered = normalized;

    if (filter?.status) {
      filtered = filtered.filter(r => r.status === filter.status);
    }
    if (filter?.category) {
      filtered = filtered.filter(r => r.category === filter.category);
    }

    return sortReleases(filtered, 'all');
  }

  getPublishedReleases(limit?: number): CMSRelease[] {
    return this.getPublicReleases(limit);
  }

  getPublicReleases(limit?: number): CMSRelease[] {
    const publicReleases = Array.from(this.releases.values())
      .map((r, index) => ({
        ...r,
        status: r.status || 'published',
        visibility: r.visibility || 'public',
        format: r.format || 'video',
        releaseType: r.releaseType || 'studio-release',
        // Ensure we have a valid date for sorting
        publishedAt: r.publishedAt || r.releaseDate || r.createdAt,
        registryOrder: index
      }))
      .filter(r => r.status === 'published' && r.visibility === 'public');

    const sorted = sortReleases(publicReleases, 'all');
    return limit ? sorted.slice(0, limit) : sorted;
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

    // Enforcement: Official governed releases MUST have a youtubeId to be published
    if (!release.youtubeId) {
      throw new Error('Cannot publish an official governed release without a valid YouTube ID.');
    }

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
