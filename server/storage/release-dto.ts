import { CMSRelease } from '@/lib/cms-storage';
import { resolveContributorPublicName } from '@/lib/entity-storage-server';

function safeResolve(idOrObj: any): string {
  if (!idOrObj) return 'Contributor information unavailable';
  if (typeof idOrObj === 'string') return resolveContributorPublicName(idOrObj, idOrObj);
  return idOrObj.public_name || idOrObj.professional_name || idOrObj.name || idOrObj.full_name || 'Contributor information unavailable';
}

export function toCanonicalCMSRelease(release: any): CMSRelease {
  if (!release) return release;
  
  const canonical = { ...release };
  
  if (canonical.created_at && !canonical.createdAt) canonical.createdAt = canonical.created_at;
  if (canonical.updated_at && !canonical.updatedAt) canonical.updatedAt = canonical.updated_at;
  if (canonical.published_at && !canonical.publishedAt) canonical.publishedAt = canonical.published_at;
  
  canonical.visibility = canonical.visibility || 'public';
  canonical.format = canonical.format || 'video';
  canonical.releaseType = canonical.releaseType || 'studio-release';
  const effectiveDate = canonical.govType === 'native_governed' || canonical.governanceOrigin === 'native_governed'
    ? (canonical.publishedAt || canonical.published_at || canonical.releaseDate || canonical.createdAt || canonical.created_at)
    : (canonical.releaseDate || canonical.publishedAt || canonical.published_at || canonical.createdAt || canonical.created_at);
  
  canonical.publishedAt = effectiveDate;

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
  delete canonical.enable_commentary;
  delete canonical.enable_sponsors;
  delete canonical.enable_adoption;
  delete canonical.enable_credits;
  delete canonical.show_views;
  delete canonical.show_likes;

  return canonical as CMSRelease;
}

export type PublicPremiereRelease = Pick<
  CMSRelease,
  | 'id'
  | 'title'
  | 'description'
  | 'vocalist'
  | 'slug'
  | 'canonicalTitle'
  | 'youtubeTitle'
  | 'thumbnailUrl'
  | 'canonicalThumbnail'
  | 'status'
  | 'visibility'
  | 'premiereVisibility'
  | 'releaseLifecycle'
  | 'officialReleaseAt'
  | 'premiereAnnouncedAt'
  | 'isFeaturedPremiere'
  | 'createdAt'
  | 'premiereEnabled'
  | 'premiereStatus'
  | 'premiereOrder'
  | 'premiereDate'
  | 'premiereDateTba'
  | 'premiereDescription'
  | 'premiereThumbnail'
  | 'premiereMobileThumbnail'
  | 'premiumTeaserAvailable'
  | 'commentaryAvailable'
  | 'lyricsTranslationsAvailable'
  | 'creditsNotesAvailable'
  | 'notifyEnabled'
  | 'premiereCtaLabel'
> & {
  preReleaseAssets?: Array<{
    type: string;
    url?: string;
    title?: string;
    status: string;
  }>;
};

export function toPublicPremiereRelease(release: CMSRelease): PublicPremiereRelease {
  const mapped: PublicPremiereRelease = {
    id: release.id,
    title: release.title,
    description: release.description,
    vocalist: safeResolve(release.vocalist),
    slug: release.slug,
    canonicalTitle: release.canonicalTitle,
    youtubeTitle: release.youtubeTitle,
    thumbnailUrl: release.thumbnailUrl,
    canonicalThumbnail: release.canonicalThumbnail,
    status: release.status,
    visibility: release.visibility,
    premiereVisibility: release.premiereVisibility,
    releaseLifecycle: release.releaseLifecycle,
    officialReleaseAt: release.officialReleaseAt,
    premiereAnnouncedAt: release.premiereAnnouncedAt,
    isFeaturedPremiere: release.isFeaturedPremiere,
    createdAt: release.createdAt,

    premiereEnabled: release.premiereEnabled,
    premiereStatus: release.premiereStatus,
    premiereOrder: release.premiereOrder,
    premiereDate: release.premiereDate,
    premiereDateTba: release.premiereDateTba,
    premiereDescription: release.premiereDescription,
    premiereThumbnail: release.premiereThumbnail,
    premiereMobileThumbnail: release.premiereMobileThumbnail,
    premiumTeaserAvailable: release.premiumTeaserAvailable,
    commentaryAvailable: release.commentaryAvailable,
    lyricsTranslationsAvailable: release.lyricsTranslationsAvailable,
    creditsNotesAvailable: release.creditsNotesAvailable,
    notifyEnabled: release.notifyEnabled,
    premiereCtaLabel: release.premiereCtaLabel,

    preReleaseAssets: release.preReleaseAssets?.filter((a) => a.status === 'live'),
  };
  return mapped;
}

export type PublicRelease = Omit<Pick<
  CMSRelease,
  | 'id'
  | 'title'
  | 'description'
  | 'vocalist'
  | 'slug'
  | 'canonicalTitle'
  | 'youtubeTitle'
  | 'thumbnailUrl'
  | 'canonicalThumbnail'
  | 'status'
  | 'visibility'
  | 'youtubeId'
  | 'durationSeconds'
  | 'durationFormatted'
  | 'viewCount'
  | 'source'
  | 'format'
  | 'govType'
  | 'governanceOrigin'
  | 'publishedAt'
  | 'releaseDate'
  | 'writer'
>, 'viewCount'> & {
  viewCount?: number;
  lyricist?: string;
  composer?: string;
  musicDirector?: string;
  producer?: string;
  publicCredits?: string;
  writerId?: string;
  lyricistId?: string;
  tags?: string[];
  publishedDate?: string;
};

export function toPublicRelease(release: any): PublicRelease {

  const rawViews = release.viewCount || release.views || release.youtubeDetails?.viewCount || release.youtube_details?.viewCount || release.statistics?.viewCount;
  const parsedViews = Number(rawViews);
  const finalViewCount = (!isNaN(parsedViews) && parsedViews > 0) ? parsedViews : undefined;

  return {
    id: release.id,
    title: release.title,
    description: release.description,
    vocalist: safeResolve(release.vocalist),
    slug: release.slug,
    canonicalTitle: release.canonicalTitle,
    youtubeTitle: release.youtubeTitle,
    thumbnailUrl: release.thumbnailUrl,
    canonicalThumbnail: release.canonicalThumbnail,
    status: release.status,
    visibility: release.visibility,
    youtubeId: release.youtubeId,
    durationSeconds: release.durationSeconds,
    durationFormatted: release.durationFormatted,
    viewCount: finalViewCount,
    source: release.source,
    format: release.format,
    govType: release.govType,
    governanceOrigin: release.governanceOrigin,
    publishedAt: release.publishedAt,
    publishedDate: release.publishedDate || release.publishedAt,
    releaseDate: release.releaseDate,
    writer: safeResolve(release.writer),
    lyricist: safeResolve(release.lyricist),
    composer: safeResolve(release.composer),
    musicDirector: safeResolve(release.musicDirector),
    producer: safeResolve(release.producer),
    publicCredits: safeResolve(release.publicCredits),
    writerId: safeResolve(release.writerId),
    lyricistId: safeResolve(release.lyricistId),
    tags: release.tags,
  };
}
