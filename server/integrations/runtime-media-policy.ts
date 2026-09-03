export type RuntimeMediaReleaseLike = {
  status?: string | null;
  visibility?: string | null;
  format?: string | null;
  youtubeId?: string | null;
};

export const hasFinalYoutubeVideo = (release: RuntimeMediaReleaseLike): boolean =>
  Boolean(String(release?.youtubeId || '').trim());

export const isPublicReleaseEligible = (release: RuntimeMediaReleaseLike): boolean =>
  release?.status === 'published' && release?.visibility === 'public';

export const isPublicTemporaryAudioEligible = (release: RuntimeMediaReleaseLike): boolean =>
  isPublicReleaseEligible(release) &&
  release?.format === 'audio' &&
  !hasFinalYoutubeVideo(release);
