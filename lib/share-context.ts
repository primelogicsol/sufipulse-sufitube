import { CMSRelease } from '@/lib/cms-storage';

export type ShareContextType = 'release' | 'premiere' | 'teaser';

export interface ResolvedShareContext {
  title: string;
  url: string; // The primary URL to share
  youtubeUrl?: string; // Optional specific video URL if applicable
  text: string; // The accompanying text/caption
  socialShareKit?: any;
}

export function buildShareContext(
  release: CMSRelease,
  context: ShareContextType,
  baseUrl: string = 'https://sufipulse.com'
): ResolvedShareContext {
  const canonicalTitle = release.canonicalTitle || release.title;
  const canonicalUrl = `${baseUrl}/release-detail/${release.slug}`;
  const youtubeUrl = release.youtubeUrl || (release.youtubeId ? `https://www.youtube.com/watch?v=${release.youtubeId}` : undefined);

  let title = canonicalTitle;
  let url = canonicalUrl;
  let text = canonicalTitle;

  if (context === 'premiere') {
    text = `Upcoming Premiere: ${canonicalTitle}`;
    url = canonicalUrl; // Premiere strictly uses canonical
  } else if (context === 'teaser') {
    text = `Premium Teaser Now Live: ${canonicalTitle}`;
    // Teasers can point to canonical where the teaser is embedded
    url = canonicalUrl;
  } else if (context === 'release') {
    // Legacy behavior for released videos prefers youtube URL for direct social sharing
    url = youtubeUrl || canonicalUrl;
    text = canonicalTitle;
  }

  return {
    title: canonicalTitle,
    url,
    youtubeUrl,
    text,
    socialShareKit: release.socialShareKit
  };
}
