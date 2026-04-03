const DEFAULT_THUMBNAIL_LABEL = 'SufiTube Release';

const buildInlinePlaceholder = (label: string) => {
  const safeLabel = label || DEFAULT_THUMBNAIL_LABEL;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#111827"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#e5e7eb" font-family="Arial" font-size="40">${safeLabel}</text></svg>`
  );
};

export const getYouTubeVideoId = (url?: string): string => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '').trim();
    }
    const fromQuery = parsed.searchParams.get('v');
    if (fromQuery) return fromQuery.trim();
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const shortsIndex = pathParts.indexOf('shorts');
    if (shortsIndex >= 0 && pathParts[shortsIndex + 1]) {
      return pathParts[shortsIndex + 1].trim();
    }
  } catch {
    const direct = url.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/);
    if (direct?.[1]) return direct[1];
  }
  return '';
};

export const buildYouTubeThumbnailCandidates = (
  videoId?: string,
  preferred: Array<string | undefined> = []
): string[] => {
  const ytCandidates = videoId
    ? [
        `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/default.jpg`,
      ]
    : [];

  const candidates = [...preferred, ...ytCandidates]
    .filter((url): url is string => Boolean(url))
    .filter((url, index, arr) => arr.indexOf(url) === index);

  return candidates;
};

export const advanceThumbnailFallback = (
  target: HTMLImageElement,
  candidates: string[],
  placeholderLabel: string = DEFAULT_THUMBNAIL_LABEL
) => {
  const currentIndex = parseInt(target.dataset.thumbIndex || '0', 10);
  const nextIndex = currentIndex + 1;
  if (nextIndex < candidates.length) {
    const nextThumb = candidates[nextIndex];
    if (nextThumb) {
      target.dataset.thumbIndex = String(nextIndex);
      target.src = nextThumb;
      return;
    }
  }

  target.onerror = null;
  target.src = buildInlinePlaceholder(placeholderLabel);
};
