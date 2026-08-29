import { CMSRelease } from '@/lib/cms-storage';

export type ShareContextType = 'release' | 'premiere' | 'teaser';

export interface ResolvedShareContext {
  title: string;
  shareUrl: string; // The primary URL to share
  youtubeUrl?: string; // Optional specific video URL if applicable
  shareText: string; // The accompanying text/caption
  socialShareKit?: any;
}

export function buildShareContext(
  release: Partial<CMSRelease>,
  context: ShareContextType,
  baseUrl: string = 'https://sufipulse.com'
): ResolvedShareContext {
  const canonicalTitle = release.canonicalTitle || release.title || '';
  const canonicalUrl = `${baseUrl}/release-detail/${release.slug}`;
  const youtubeUrl = release.youtubeUrl || (release.youtubeId ? `https://www.youtube.com/watch?v=${release.youtubeId}` : undefined);

  let title = canonicalTitle;
  let shareUrl = canonicalUrl;
  let shareText = canonicalTitle;

  if (context === 'premiere') {
    shareText = `Upcoming Premiere: ${canonicalTitle}`;
    shareUrl = canonicalUrl; // Premiere strictly uses canonical
  } else if (context === 'teaser') {
    shareText = `Premium Teaser Now Live: ${canonicalTitle}`;
    // Teasers can point to canonical where the teaser is embedded
    shareUrl = canonicalUrl;
  } else if (context === 'release') {
    // Legacy behavior for released videos prefers youtube URL for direct social sharing
    shareUrl = youtubeUrl || canonicalUrl;
    shareText = canonicalTitle;
  }

  return {
    title: canonicalTitle,
    shareUrl,
    youtubeUrl,
    shareText,
    socialShareKit: release.socialShareKit
  };
}
