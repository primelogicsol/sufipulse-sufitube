import { CMSRelease } from '@/lib/cms-storage';

export function toCanonicalCMSRelease(release: any): CMSRelease {
  if (!release) return release;
  
  // Clone to avoid mutating in-memory cache or DB row directly
  const canonical = { ...release };
  
  // Strip legacy snake_case fields that were accidentally preserved during DB migration
  // and in the filesystem JSON.
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
  delete canonical.youtubeTitle;
  delete canonical.canonicalTitle;
  delete canonical.metadataStatus;
  delete canonical.canonicalStatus;
  delete canonical.canonicalThumbnail;
  delete canonical.youtubeThumbnailUrl;
  
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

  return canonical as CMSRelease;
}
