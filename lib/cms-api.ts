// lib/cms-api.ts
// Client-side CMS API - Only for browser use
"use client";

import * as cms from './cms-types';

// Mock data - will be replaced with real Supabase calls when configured
const MOCK_RELEASES: cms.Release[] = [
  {
    id: '1',
    title: 'Qawwali: The Soul\'s Journey',
    slug: 'qawwali-souls-journey',
    status: 'published',
    category: 'qawwali',
    youtube_id: 'LwnPXSEJJHI',
    duration_seconds: 480,
    duration_formatted: '8:00',
    view_count: 1823,
    like_count: 163,
    show_views: true,
    show_likes: true,
    enable_lyrics: true,
    enable_commentary: true,
    enable_sponsors: false,
    enable_adoption: true,
    enable_credits: true,
    description: 'Sufi Hacker enters the hidden system beneath your thoughts — revealing the source code of the heart, the firewalls of ego, and the quiet spiritual signals your soul has been sending.',
    published_at: '2025-12-09T08:46:21Z',
    created_at: '2025-12-09T08:46:21Z',
  },
  {
    id: '2',
    title: 'The Garden of Divine Love',
    slug: 'garden-divine-love',
    status: 'published',
    category: 'ghazal',
    youtube_id: 'be6GFwGpobw',
    duration_seconds: 420,
    duration_formatted: '7:00',
    view_count: 2137,
    like_count: 261,
    show_views: true,
    show_likes: true,
    enable_lyrics: true,
    enable_commentary: false,
    enable_sponsors: true,
    enable_adoption: false,
    enable_credits: true,
    description: 'Exploring themes of divine love through classical Ghazal poetry and music.',
    published_at: '2024-01-10T14:30:00Z',
    created_at: '2024-01-10T14:30:00Z',
  },
  {
    id: '3',
    title: 'Spiritual Journey: Voices of the Heart',
    slug: 'spiritual-journey-voices',
    status: 'draft',
    category: 'devotional',
    youtube_id: 'XPaJu3lHd5Y',
    duration_seconds: 720,
    duration_formatted: '12:00',
    view_count: 0,
    like_count: 0,
    show_views: false,
    show_likes: false,
    enable_lyrics: false,
    enable_commentary: false,
    enable_sponsors: false,
    enable_adoption: false,
    enable_credits: true,
    description: 'An upcoming devotional music release capturing spiritual voices.',
    created_at: '2024-01-20T09:15:00Z',
  },
];

// Release CRUD Operations
export async function getAllReleases(
  filters?: { status?: string; category?: string; search?: string }
): Promise<cms.Release[]> {
  try {
    // Try real Supabase call if configured
    const hasSupabase = typeof window !== 'undefined' && 
      localStorage.getItem('supabase_configured');
    
    if (hasSupabase) {
      // Would call real API here
      // const { data, error } = await supabase.from('releases').select('*');
      // if (error) throw error;
      // return data || [];
    }

    // Prefer persisted localStorage data (standalone mode).
    const stored = typeof window !== 'undefined' ? localStorage.getItem('cms_releases') : null;
    let results: cms.Release[] = stored ? JSON.parse(stored) : MOCK_RELEASES;

    // If there is no user-persisted data yet, initialize from mock data so updates work in same session.
    if (!stored && typeof window !== 'undefined') {
      localStorage.setItem('cms_releases', JSON.stringify(MOCK_RELEASES));
      results = MOCK_RELEASES;
    }

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
  } catch (error) {
    console.error('Error fetching releases:', error);
    return MOCK_RELEASES;
  }
}

export async function getPublishedReleases(): Promise<cms.Release[]> {
  return getAllReleases({ status: 'published' });
}

export async function getReleaseBySlug(slug: string): Promise<cms.Release | null> {
  const releases = await getAllReleases();
  return releases.find((r) => r.slug === slug) || null;
}

export async function getReleaseById(id: string): Promise<cms.Release | null> {
  const releases = await getAllReleases();
  return releases.find((r) => r.id === id) || null;
}

export async function createRelease(release: Partial<cms.Release>): Promise<cms.Release> {
  try {
    const newRelease: cms.Release = {
      id: `${Date.now()}`,
      title: release.title || 'Untitled',
      slug: release.slug || `release-${Date.now()}`,
      status: release.status || 'draft',
      youtube_id: release.youtube_id,
      duration_seconds: release.duration_seconds,
      view_count: release.view_count || 0,
      like_count: release.like_count || 0,
      show_views: release.show_views ?? false,
      show_likes: release.show_likes ?? false,
      enable_lyrics: release.enable_lyrics ?? false,
      enable_commentary: release.enable_commentary ?? false,
      enable_sponsors: release.enable_sponsors ?? false,
      enable_adoption: release.enable_adoption ?? false,
      enable_credits: release.enable_credits ?? false,
      description: release.description,
      category: release.category,
      created_at: new Date().toISOString(),
      ...release,
    };

    // Store in localStorage
    const releases = await getAllReleases();
    const stored = localStorage.getItem('cms_releases');
    const data = stored ? JSON.parse(stored) : releases;
    data.push(newRelease);
    localStorage.setItem('cms_releases', JSON.stringify(data));

    return newRelease;
  } catch (error) {
    console.error('Error creating release:', error);
    throw error;
  }
}

export async function updateRelease(id: string, updates: Partial<cms.Release>): Promise<cms.Release> {
  try {
    const releases = await getAllReleases();
    const index = releases.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new Error('Release not found');
    }

    const updated = { ...releases[index], ...updates, updated_at: new Date().toISOString() };
    releases[index] = updated;
    localStorage.setItem('cms_releases', JSON.stringify(releases));

    return updated;
  } catch (error) {
    console.error('Error updating release:', error);
    throw error;
  }
}

export async function deleteRelease(id: string): Promise<void> {
  try {
    const releases = await getAllReleases();
    const filtered = releases.filter((r) => r.id !== id);
    localStorage.setItem('cms_releases', JSON.stringify(filtered));
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
  const stored = localStorage.getItem(`cms_credits_${releaseId}`);
  return stored ? JSON.parse(stored) : [];
}

export async function saveReleaseCreds(
  releaseId: string,
  credits: cms.ReleaseCredit[],
  options?: { append?: boolean }
): Promise<cms.ReleaseCredit[]> {
  const append = options?.append !== false;
  const existing = append ? await getReleaseCreds(releaseId) : [];
  const merged = [...existing, ...credits];
  localStorage.setItem(`cms_credits_${releaseId}`, JSON.stringify(merged));
  return merged;
}

export async function getReleaseLyrics(releaseId: string): Promise<cms.ReleaseLyrics[]> {
  const stored = localStorage.getItem(`cms_lyrics_${releaseId}`);
  return stored ? JSON.parse(stored) : [];
}

export async function saveReleaseLyrics(
  releaseId: string,
  lyrics: cms.ReleaseLyrics[],
  options?: { append?: boolean }
): Promise<cms.ReleaseLyrics[]> {
  const append = options?.append !== false;
  const existing = append ? await getReleaseLyrics(releaseId) : [];
  const merged = [...existing, ...lyrics];
  localStorage.setItem(`cms_lyrics_${releaseId}`, JSON.stringify(merged));
  return merged;
}

// Bulk Import
export async function getBulkImports(): Promise<cms.BulkImport[]> {
  const stored = localStorage.getItem('cms_bulk_imports');
  return stored ? JSON.parse(stored) : [];
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

  const bulkImport: cms.BulkImport = {
    id: `${Date.now()}`,
    import_type: importType as any,
    status: options?.status || (failedItems > 0 ? 'failed' : 'completed'),
    file_name: fileName,
    total_items: totalItems,
    successful_items: successfulItems,
    failed_items: failedItems,
    error_log: options?.errorLog,
    created_at: new Date().toISOString(),
  };

  const imports = await getBulkImports();
  imports.push(bulkImport);
  localStorage.setItem('cms_bulk_imports', JSON.stringify(imports));

  return bulkImport;
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

// Version Control
export async function getReleaseVersions(releaseId: string): Promise<cms.ReleaseVersion[]> {
  const stored = localStorage.getItem(`cms_versions_${releaseId}`);
  return stored ? JSON.parse(stored) : [];
}

export async function logReleaseAction(
  releaseId: string,
  action: string,
  oldValue?: any,
  newValue?: any
): Promise<void> {
  const log: cms.ReleaseActionLog = {
    id: `${Date.now()}`,
    release_id: releaseId,
    action,
    old_value: oldValue,
    new_value: newValue,
    created_at: new Date().toISOString(),
  };

  const logs = JSON.parse(localStorage.getItem(`cms_logs_${releaseId}`) || '[]');
  logs.push(log);
  localStorage.setItem(`cms_logs_${releaseId}`, JSON.stringify(logs));
}
