import fs from 'fs';
import path from 'path';

export type YouTubeReleaseCandidate = {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  publishedDate?: string;
  durationSeconds?: number;
  durationFormatted?: string;
  views?: number;
  detectedAt: string;
  lastSeenAt: string;
  status: 'pending';
};

const FILE = path.join(process.cwd(), '.data', 'youtube-release-candidates.json');

function ensureDir() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
}

export function readYouTubeReleaseCandidates(): YouTubeReleaseCandidate[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.youtubeId && item?.status === 'pending')
      : [];
  } catch (error) {
    console.error('[youtube-release-candidates] read failed', error);
    return [];
  }
}

export function upsertYouTubeReleaseCandidates(
  items: Omit<YouTubeReleaseCandidate, 'detectedAt' | 'lastSeenAt' | 'status'>[],
): YouTubeReleaseCandidate[] {
  ensureDir();
  const now = new Date().toISOString();
  const existing = readYouTubeReleaseCandidates();
  const byId = new Map(existing.map((item) => [item.youtubeId, item]));

  for (const item of items) {
    const prior = byId.get(item.youtubeId);
    byId.set(item.youtubeId, {
      ...prior,
      ...item,
      detectedAt: prior?.detectedAt || now,
      lastSeenAt: now,
      status: 'pending',
    });
  }

  const next = Array.from(byId.values()).sort((a, b) => {
    const aTime = new Date(a.publishedDate || a.detectedAt).getTime();
    const bTime = new Date(b.publishedDate || b.detectedAt).getTime();
    return bTime - aTime;
  });

  fs.writeFileSync(FILE, JSON.stringify(next, null, 2));
  return next;
}

export function removeYouTubeReleaseCandidate(youtubeId: string): void {
  ensureDir();
  const next = readYouTubeReleaseCandidates().filter((item) => item.youtubeId !== youtubeId);
  fs.writeFileSync(FILE, JSON.stringify(next, null, 2));
}
