// lib/cms-api.ts
// Client-side CMS API - Only for browser use
"use client";

import * as cms from './cms-types';

const LEGACY_RELEASES_KEY = 'cms_releases';
const CANONICAL_RELEASES_KEY = 'sufipulse_cms_releases';
const RELEASE_MIGRATION_MARKER = 'cms_releases_migrated_to_canonical_v1';
const DEMO_PURGE_MARKER = 'cms_demo_purge_v1';

// Seed/demo release IDs that should never appear in the CMS
const DEMO_RELEASE_IDS = new Set(['sufipulse-001', 'sufipulse-002', 'sufipulse-003']);
const DEMO_RELEASE_SLUGS = new Set([
  'qawwali-souls-journey',
  'garden-divine-love',
  'spiritual-journey-voices-heart',
]);

const purgeDemoReleases = () => {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(DEMO_PURGE_MARKER) === '1') return;

  // Remove from canonical localStorage mirror
  const map = new Map<string, Record<string, any>>(readCanonicalEntries());
  let changed = false;
  for (const [id, val] of map.entries()) {
    if (DEMO_RELEASE_IDS.has(id) || DEMO_RELEASE_SLUGS.has(String(val?.slug || ''))) {
      map.delete(id);
      changed = true;
    }
  }
  if (changed) writeCanonicalEntries(Array.from(map.entries()));

  // Also wipe the legacy key so the old cmsStorage localStorage entry is gone
  try {
    const rawLegacy = localStorage.getItem(LEGACY_RELEASES_KEY);
    if (rawLegacy) {
      const legacy = JSON.parse(rawLegacy);
      if (Array.isArray(legacy)) {
        const cleaned = legacy.filter(
          (r: any) => !DEMO_RELEASE_IDS.has(r.id) && !DEMO_RELEASE_SLUGS.has(r.slug)
        );
        if (cleaned.length !== legacy.length) {
          localStorage.setItem(LEGACY_RELEASES_KEY, JSON.stringify(cleaned));
        }
      }
    }
  } catch { /* ignore */ }

  // Wipe the old cmsStorage canonical key that seed-cms-data.ts writes to
  try {
    const rawOld = localStorage.getItem('sufipulse_cms_releases');
    if (rawOld) {
      const entries: [string, any][] = JSON.parse(rawOld);
      if (Array.isArray(entries)) {
        const cleaned = entries.filter(
          ([id, val]) => !DEMO_RELEASE_IDS.has(id) && !DEMO_RELEASE_SLUGS.has(String(val?.slug || ''))
        );
        if (cleaned.length !== entries.length) {
          localStorage.setItem('sufipulse_cms_releases', JSON.stringify(cleaned));
        }
      }
    }
  } catch { /* ignore */ }

  localStorage.setItem(DEMO_PURGE_MARKER, '1');
};

type CanonicalStorageEntry = [string, Record<string, any>];

const mapAnyToRelease = (value: any): cms.Release => {
  const status = String(value?.status || 'draft') as cms.Release['status'];
  return {
    id: String(value?.id || `${Date.now()}`),
    title: String(value?.title || 'Untitled'),
    subtitle: value?.subtitle,
    slug: String(value?.slug || `release-${Date.now()}`),
    status,
    content_readiness_state: value?.content_readiness_state || value?.contentReadinessState,
    category: value?.category,
    release_type: value?.release_type || value?.releaseType,
    release_date: value?.release_date || value?.releaseDate,
    description: value?.description,
    youtube_id: value?.youtube_id || value?.youtubeId,
    youtube_url: value?.youtube_url || value?.youtubeUrl,
    youtube_channel_id: value?.youtube_channel_id || value?.youtubeChannelId,
    youtube_channel_url: value?.youtube_channel_url || value?.youtubeChannelUrl,
    thumbnail_url: value?.thumbnail_url || value?.thumbnailUrl,
    poster_url: value?.poster_url || value?.posterUrl,
    chorus_vocalists: value?.chorus_vocalists || value?.chorusVocalists || [],
    duration_seconds: Number(value?.duration_seconds ?? value?.durationSeconds ?? 0),
    duration_formatted: value?.duration_formatted || value?.durationFormatted || '0:00',
    view_count: Number(value?.view_count ?? value?.viewCount ?? 0),
    like_count: Number(value?.like_count ?? value?.likeCount ?? 0),
    show_views: value?.show_views ?? true,
    show_likes: value?.show_likes ?? true,
    enable_lyrics: value?.enable_lyrics ?? value?.enableLyrics ?? true,
    enable_commentary: value?.enable_commentary ?? value?.enableCommentary ?? true,
    enable_sponsors: value?.enable_sponsors ?? value?.enableSponsors ?? false,
    enable_adoption: value?.enable_adoption ?? value?.enableAdoption ?? true,
    enable_credits: value?.enable_credits ?? value?.enableCredits ?? true,
    subtitle_cues: value?.subtitle_cues || value?.subtitleCues || [],
    subtitle_translations: value?.subtitle_translations || value?.subtitleTranslations || {},
    subtitle_language_statuses: value?.subtitle_language_statuses || value?.subtitleLanguageStatuses || {},
    master_timing_version: value?.master_timing_version || value?.masterTimingVersion || 1,
    lyrics_structure: value?.lyrics_structure || value?.lyricsStructure || {},
    published_at: value?.published_at || value?.publishedAt,
    created_at: value?.created_at || value?.createdAt,
    updated_at: value?.updated_at || value?.updatedAt,
  };
};

const mapReleaseToCanonical = (release: cms.Release): Record<string, any> => {
  const now = new Date().toISOString();
  return {
    id: release.id,
    title: release.title,
    subtitle: release.subtitle,
    slug: release.slug,
    youtubeId: release.youtube_id || '',
    youtubeUrl: release.youtube_url,
    youtubeChannelId: release.youtube_channel_id,
    youtubeChannelUrl: release.youtube_channel_url,
    thumbnailUrl: release.thumbnail_url,
    posterUrl: release.poster_url,
    description: release.description || '',
    releaseDate: release.release_date || now.split('T')[0],
    durationSeconds: Number(release.duration_seconds || 0),
    durationFormatted: release.duration_formatted || '0:00',
    viewCount: Number(release.view_count || 0),
    likeCount: Number(release.like_count || 0),
    status: release.status || 'draft',
    contentReadinessState: release.content_readiness_state || 'draft',
    category: release.category,
    releaseType: release.release_type,
    chorusVocalists: release.chorus_vocalists || [],
    enableLyrics: release.enable_lyrics !== false,
    enableCommentary: release.enable_commentary !== false,
    enableSponsors: !!release.enable_sponsors,
    enableAdoption: release.enable_adoption !== false,
    enableCredits: release.enable_credits !== false,
    availableLanguages: ['en', 'ur'],
    defaultLanguage: 'en',
    lyrics: {},
    subtitleCues: Array.isArray(release.subtitle_cues)
      ? release.subtitle_cues.map((cue) => ({
          id: cue.id,
          cueNumber: cue.cue_number,
          startTime: cue.start_time,
          endTime: cue.end_time,
          lineRef: cue.line_ref,
          sourceType: cue.source_type,
          active: cue.active,
        }))
      : [],
    subtitleTranslations: release.subtitle_translations || {},
    subtitleLanguageStatuses: release.subtitle_language_statuses || {},
    lyricsStructure: release.lyrics_structure || {},
    youtubeSubtitleAutoSync: true,
    youtubeCaptionTracks: {},
    createdAt: release.created_at || now,
    updatedAt: release.updated_at || now,
    publishedAt: release.published_at,
  };
};

const mapReleaseToApiPayload = (release: Partial<cms.Release>): Record<string, any> => {
  const payload: Record<string, any> = {};

  if (release.id !== undefined) payload.id = release.id;
  if (release.title !== undefined) payload.title = release.title;
  if (release.subtitle !== undefined) payload.subtitle = release.subtitle;
  if (release.slug !== undefined) payload.slug = release.slug;
  if (release.status !== undefined) payload.status = release.status;
  if (release.content_readiness_state !== undefined) payload.contentReadinessState = release.content_readiness_state;
  if (release.category !== undefined) payload.category = release.category;
  if (release.release_type !== undefined) payload.releaseType = release.release_type;
  if (release.release_date !== undefined) payload.releaseDate = release.release_date;
  if (release.description !== undefined) payload.description = release.description;
  if (release.youtube_id !== undefined) payload.youtubeId = release.youtube_id;
  if (release.youtube_url !== undefined) payload.youtubeUrl = release.youtube_url;
  if (release.youtube_channel_id !== undefined) payload.youtubeChannelId = release.youtube_channel_id;
  if (release.youtube_channel_url !== undefined) payload.youtubeChannelUrl = release.youtube_channel_url;
  if (release.thumbnail_url !== undefined) payload.thumbnailUrl = release.thumbnail_url;
  if (release.poster_url !== undefined) payload.posterUrl = release.poster_url;
  if (release.chorus_vocalists !== undefined) payload.chorusVocalists = release.chorus_vocalists;
  if (release.duration_seconds !== undefined) payload.durationSeconds = release.duration_seconds;
  if (release.duration_formatted !== undefined) payload.durationFormatted = release.duration_formatted;
  if (release.view_count !== undefined) payload.viewCount = release.view_count;
  if (release.like_count !== undefined) payload.likeCount = release.like_count;
  if (release.enable_lyrics !== undefined) payload.enableLyrics = release.enable_lyrics;
  if (release.enable_commentary !== undefined) payload.enableCommentary = release.enable_commentary;
  if (release.enable_sponsors !== undefined) payload.enableSponsors = release.enable_sponsors;
  if (release.enable_adoption !== undefined) payload.enableAdoption = release.enable_adoption;
  if (release.enable_credits !== undefined) payload.enableCredits = release.enable_credits;
  if (release.subtitle_cues !== undefined) {
    payload.subtitleCues = (release.subtitle_cues || []).map((cue) => ({
      id: cue.id,
      cueNumber: cue.cue_number,
      startTime: cue.start_time,
      endTime: cue.end_time,
      lineRef: cue.line_ref,
      sourceType: cue.source_type,
      active: cue.active,
    }));
  }
  if (release.subtitle_translations !== undefined) payload.subtitleTranslations = release.subtitle_translations;
  if (release.subtitle_language_statuses !== undefined) payload.subtitleLanguageStatuses = release.subtitle_language_statuses;
  if (release.lyrics_structure !== undefined) payload.lyricsStructure = release.lyrics_structure;
  if (release.created_at !== undefined) payload.createdAt = release.created_at;

  const youtubeId = String(release.youtube_id || '').trim();
  if (!youtubeId) {
    payload.webOnly = true;
  }

  return payload;
};

const readCanonicalEntries = (): CanonicalStorageEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CANONICAL_RELEASES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CanonicalStorageEntry[]) : [];
  } catch {
    return [];
  }
};

const writeCanonicalEntries = (entries: CanonicalStorageEntry[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CANONICAL_RELEASES_KEY, JSON.stringify(entries));
};

const upsertCanonicalMirror = (release: cms.Release) => {
  if (typeof window === 'undefined') return;
  const map = new Map<string, Record<string, any>>(readCanonicalEntries());
  map.set(release.id, mapReleaseToCanonical(release));
  writeCanonicalEntries(Array.from(map.entries()));
};

const removeCanonicalMirror = (id: string) => {
  if (typeof window === 'undefined') return;
  const map = new Map<string, Record<string, any>>(readCanonicalEntries());
  map.delete(id);
  writeCanonicalEntries(Array.from(map.entries()));
};

const readCanonicalFallback = (): cms.Release[] => {
  const entries = readCanonicalEntries();
  return entries.map(([, value]) => mapAnyToRelease(value));
};

const ensureCanonicalReleaseMigration = () => {
  if (typeof window === 'undefined') return;

  const alreadyMigrated = localStorage.getItem(RELEASE_MIGRATION_MARKER) === '1';
  if (alreadyMigrated) return;

  const map = new Map<string, Record<string, any>>(readCanonicalEntries());

  try {
    const rawLegacy = localStorage.getItem(LEGACY_RELEASES_KEY);
    const legacy = rawLegacy ? JSON.parse(rawLegacy) : [];
    if (Array.isArray(legacy)) {
      for (const row of legacy) {
        const release = mapAnyToRelease(row);
        if (!map.has(release.id)) {
          map.set(release.id, mapReleaseToCanonical(release));
        }
      }
    }
  } catch {
    // ignore legacy parse failures and continue
  }

  if (map.size > 0) {
    writeCanonicalEntries(Array.from(map.entries()));
  }

  localStorage.setItem(RELEASE_MIGRATION_MARKER, '1');
};

const applyReleaseFilters = (
  rows: cms.Release[],
  filters?: { status?: string; category?: string; search?: string }
): cms.Release[] => {
  let results = [...rows];

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }

  if (filters?.status && filters.status !== 'all') {
    results = results.filter((r) => r.status === filters.status);
  }

  if (filters?.category && filters.category !== 'all') {
    results = results.filter((r) => r.category === filters.category);
  }

  return results;
};

const stripDemo = (releases: cms.Release[]) =>
  releases.filter(r => !DEMO_RELEASE_IDS.has(r.id) && !DEMO_RELEASE_SLUGS.has(r.slug));

// Release CRUD Operations
export async function getAllReleases(
  filters?: { status?: string; category?: string; search?: string }
): Promise<cms.Release[]> {
  purgeDemoReleases();
  ensureCanonicalReleaseMigration();

  try {
    const statusParam = filters?.status && filters.status !== 'all' ? `?status=${encodeURIComponent(filters.status)}` : '';
    const response = await fetch(`/api/releases${statusParam}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch releases (${response.status})`);
    }
    const data = await response.json();
    const apiRows = Array.isArray(data) ? data : [];
    const mapped = stripDemo(apiRows.map(mapAnyToRelease));

    for (const row of mapped) {
      upsertCanonicalMirror(row);
    }

    return applyReleaseFilters(mapped, filters);
  } catch (error) {
    console.error('Error fetching releases:', error);
    const fallback = stripDemo(readCanonicalFallback());
    return applyReleaseFilters(fallback, filters);
  }
}

export async function getPublishedReleases(): Promise<cms.Release[]> {
  return getAllReleases({ status: 'published' });
}

export async function getReleaseBySlug(slug: string): Promise<cms.Release | null> {
  ensureCanonicalReleaseMigration();
  try {
    const response = await fetch(`/api/releases?slug=${encodeURIComponent(slug)}`);
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Failed to fetch release by slug (${response.status})`);
    }
    const data = await response.json();
    const mapped = mapAnyToRelease(data);
    upsertCanonicalMirror(mapped);
    return mapped;
  } catch {
    const releases = await getAllReleases();
    return releases.find((r) => r.slug === slug) || null;
  }
}

export async function getReleaseById(id: string): Promise<cms.Release | null> {
  ensureCanonicalReleaseMigration();
  try {
    const response = await fetch(`/api/releases/${encodeURIComponent(id)}`);
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Failed to fetch release by id (${response.status})`);
    }
    const data = await response.json();
    const mapped = mapAnyToRelease(data);
    upsertCanonicalMirror(mapped);
    return mapped;
  } catch {
    const releases = await getAllReleases();
    return releases.find((r) => r.id === id) || null;
  }
}

export async function createRelease(release: Partial<cms.Release>): Promise<cms.Release> {
  try {
    const normalized: Partial<cms.Release> = {
      ...release,
      title: release.title || 'Untitled',
      slug: release.slug || `release-${Date.now()}`,
      status: release.status || 'draft',
      view_count: release.view_count ?? 0,
      like_count: release.like_count ?? 0,
      show_views: release.show_views ?? true,
      show_likes: release.show_likes ?? true,
      enable_lyrics: release.enable_lyrics ?? true,
      enable_commentary: release.enable_commentary ?? true,
      enable_sponsors: release.enable_sponsors ?? false,
      enable_adoption: release.enable_adoption ?? true,
      enable_credits: release.enable_credits ?? true,
      created_at: release.created_at || new Date().toISOString(),
    };

    const response = await fetch('/api/releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapReleaseToApiPayload(normalized)),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Error creating release');
    }

    const mapped = mapAnyToRelease(data);
    upsertCanonicalMirror(mapped);
    return mapped;
  } catch (error) {
    console.error('Error creating release:', error);
    throw error;
  }
}

export async function updateRelease(id: string, updates: Partial<cms.Release>): Promise<cms.Release> {
  try {
    const response = await fetch(`/api/releases/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapReleaseToApiPayload({ ...updates, updated_at: new Date().toISOString() })),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Error updating release');
    }

    const mapped = mapAnyToRelease(data);
    upsertCanonicalMirror(mapped);
    return mapped;
  } catch (error) {
    console.error('Error updating release:', error);
    throw error;
  }
}

export async function deleteRelease(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/releases/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error || 'Error deleting release');
    }

    removeCanonicalMirror(id);
  } catch (error) {
    console.error('Error deleting release:', error);
    throw error;
  }
}

export async function publishRelease(id: string): Promise<cms.Release> {
  return updateRelease(id, {
    status: 'published',
    published_at: new Date().toISOString(),
  });
}

export async function unpublishRelease(id: string): Promise<cms.Release> {
  return updateRelease(id, {
    status: 'unpublished',
    unpublished_at: new Date().toISOString(),
  });
}

export async function archiveRelease(id: string): Promise<cms.Release> {
  return updateRelease(id, {
    status: 'archived',
    archived_at: new Date().toISOString(),
  });
}

// Related Data Operations
export async function getReleaseCreds(releaseId: string): Promise<cms.ReleaseCredit[]> {
  try {
    const res = await fetch(`/api/releases/${encodeURIComponent(releaseId)}/credits`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function saveReleaseCreds(
  releaseId: string,
  credits: cms.ReleaseCredit[],
  options?: { append?: boolean }
): Promise<cms.ReleaseCredit[]> {
  const append = options?.append !== false;
  const res = await fetch(`/api/releases/${encodeURIComponent(releaseId)}/credits`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credits, append }),
  });
  if (!res.ok) throw new Error(`Failed to save credits (${res.status})`);
  return res.json();
}

export async function getReleaseLyrics(releaseId: string): Promise<cms.ReleaseLyrics[]> {
  try {
    const res = await fetch(`/api/releases/${encodeURIComponent(releaseId)}/lyrics`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function saveReleaseLyrics(
  releaseId: string,
  lyrics: cms.ReleaseLyrics[],
  options?: { append?: boolean }
): Promise<cms.ReleaseLyrics[]> {
  const append = options?.append !== false;
  const res = await fetch(`/api/releases/${encodeURIComponent(releaseId)}/lyrics`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lyrics, append }),
  });
  if (!res.ok) throw new Error(`Failed to save lyrics (${res.status})`);
  return res.json();
}

// Bulk Import
export async function getBulkImports(): Promise<cms.BulkImport[]> {
  try {
    const res = await fetch('/api/cms/bulk-imports');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createBulkImport(
  importType: string,
  fileName: string,
  items: any[],
  options?: {
    successfulItems?: number;
    failedItems?: number;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    errorLog?: string;
  }
): Promise<cms.BulkImport> {
  const successfulItems = options?.successfulItems ?? items.length;
  const failedItems = options?.failedItems ?? 0;
  const totalItems = successfulItems + failedItems;

  const res = await fetch('/api/cms/bulk-imports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      import_type: importType,
      status: options?.status || (failedItems > 0 ? 'failed' : 'completed'),
      file_name: fileName,
      total_items: totalItems,
      successful_items: successfulItems,
      failed_items: failedItems,
      error_log: options?.errorLog,
    }),
  });

  if (!res.ok) throw new Error(`Failed to log bulk import (${res.status})`);
  return res.json();
}

// Media Library
export async function getMediaLibrary(): Promise<cms.MediaLibrary[]> {
  const stored = localStorage.getItem('cms_media_library');
  return stored ? JSON.parse(stored) : [];
}

export async function uploadMedia(
  fileName: string,
  fileType: 'image' | 'video' | 'audio' | 'document',
  fileSize: number
): Promise<cms.MediaLibrary> {
  const media: cms.MediaLibrary = {
    id: `${Date.now()}`,
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize,
    file_url: `/media/${fileName}`,
    created_at: new Date().toISOString(),
  };

  const library = await getMediaLibrary();
  library.push(media);
  localStorage.setItem('cms_media_library', JSON.stringify(library));

  return media;
}

export async function deleteMedia(id: string): Promise<void> {
  const library = await getMediaLibrary();
  const filtered = library.filter((m) => m.id !== id);
  localStorage.setItem('cms_media_library', JSON.stringify(filtered));
}

