import { CMSRelease } from '@/lib/cms-storage';

export function toCanonicalCMSRelease(release: any): CMSRelease {
  if (!release) return release;
  
  // Clone to avoid mutating in-memory cache or DB row directly
  const canonical = { ...release };
  
  // Map legacy snake_case fields that were accidentally preserved during DB migration
  // and in the filesystem JSON, to ensure both backends output camelCase.
  if (canonical.created_at && !canonical.createdAt) canonical.createdAt = canonical.created_at;
  if (canonical.updated_at && !canonical.updatedAt) canonical.updatedAt = canonical.updated_at;
  if (canonical.published_at && !canonical.publishedAt) canonical.publishedAt = canonical.published_at;
  
  // Normalization logic for dynamically generated defaults
  canonical.visibility = canonical.visibility || 'public';
  canonical.format = canonical.format || 'video';
  canonical.releaseType = canonical.releaseType || 'studio-release';
  const effectiveDate = canonical.govType === 'native_governed' || canonical.governanceOrigin === 'native_governed'
    ? (canonical.publishedAt || canonical.published_at || canonical.releaseDate || canonical.createdAt || canonical.created_at)
    : (canonical.releaseDate || canonical.publishedAt || canonical.published_at || canonical.createdAt || canonical.created_at);
  
  canonical.publishedAt = effectiveDate;
  canonical.publishedDate = effectiveDate;

  if (canonical.youtube_id && !canonical.youtubeId) canonical.youtubeId = canonical.youtube_id;
  if (canonical.youtube_url && !canonical.youtubeUrl) canonical.youtubeUrl = canonical.youtube_url;
  if (canonical.view_count && !canonical.viewCount) canonical.viewCount = canonical.view_count;
  if (canonical.like_count && !canonical.likeCount) canonical.likeCount = canonical.like_count;
  if (canonical.enable_lyrics && canonical.enableLyrics === undefined) canonical.enableLyrics = canonical.enable_lyrics;
  if (canonical.enable_commentary && canonical.enableCommentary === undefined) canonical.enableCommentary = canonical.enable_commentary;
  if (canonical.enable_sponsors && canonical.enableSponsors === undefined) canonical.enableSponsors = canonical.enable_sponsors;
  if (canonical.enable_adoption && canonical.enableAdoption === undefined) canonical.enableAdoption = canonical.enable_adoption;
  if (canonical.enable_credits && canonical.enableCredits === undefined) canonical.enableCredits = canonical.enable_credits;
  if (canonical.show_views && canonical.showViews === undefined) canonical.showViews = canonical.show_views;
  if (canonical.show_likes && canonical.showLikes === undefined) canonical.showLikes = canonical.show_likes;

  delete canonical.created_at;
  delete canonical.updated_at;
  delete canonical.published_at;
  delete canonical.youtube_id;
  delete canonical.youtube_url;
  delete canonical.like_count;
  delete canonical.view_count;
  delete canonical.enable_lyrics;
  delete canonical.enable_credits;
  delete canonical.enable_adoption;
  delete canonical.enable_sponsors;
  delete canonical.enable_commentary;
  delete canonical.show_likes;
  delete canonical.show_views;
  
  // Strip transient resolution properties from DB mapper
  // Preserved A/B and canonical fields for architecture round-trip
  
  // Apply standard business defaults for missing fields deterministically
  if (canonical.status === 'published' && canonical.youtubeId && !canonical.format) {
    canonical.format = 'video';
  }
  if (!canonical.releaseType) {
    canonical.releaseType = 'studio-release';
  }
  if (canonical.visibility === undefined) {
    canonical.visibility = 'public';
  }
  
  if (!canonical.distribution) {
    canonical.distribution = {
      youtube: { platform: 'youtube', status: 'not_started', isVisible: true, isVerified: false },
      apple_music: { platform: 'apple_music', status: 'not_started', isVisible: true, isVerified: false },
      spotify: { platform: 'spotify', status: 'not_started', isVisible: true, isVerified: false },
      facebook: { platform: 'facebook', status: 'not_started', isVisible: true, isVerified: false },
      instagram: { platform: 'instagram', status: 'not_started', isVisible: true, isVerified: false },
      x: { platform: 'x', status: 'not_started', isVisible: true, isVerified: false },
      sufipulse_radio: { platform: 'sufipulse_radio', status: 'not_started', isVisible: true, isVerified: false }
    };
  }

  // Ensure dates that were previously initialized dynamically remain undefined if not in source data
  // (Handled by removing dynamic date fallback in lib/cms-storage.ts)

  // Attach deterministic tie-breaker for strict API parity
  if (typeof (release as any).registry_order === 'number') {
    (canonical as any).registryOrder = (release as any).registry_order;
    delete (canonical as any).registry_order;
  }
  if (typeof canonical.registryOrder === 'number') {
    // If it was already added as registryOrder (e.g. from FS), just keep it.
  }

  return canonical as CMSRelease;
}
