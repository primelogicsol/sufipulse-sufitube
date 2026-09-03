import 'server-only';

import { privateProductionSourceStorage } from '@/server/storage/private-production-source-storage';

export type RuntimeAudioFields = {
  audioUrl?: string;
  audioDownloadAllowed?: boolean;
  audioStorageMode?: 'stream_only';
};

export function attachRuntimeAudioFields<T extends Record<string, any>>(
  release: T,
  options: { isAdmin: boolean },
): T & RuntimeAudioFields {
  if (!release?.id || release?.format !== 'audio') return release;

  const source = privateProductionSourceStorage.get(String(release.id));
  if (!source) return release;

  const publicEligible =
    release.status === 'published' &&
    release.visibility === 'public' &&
    source.publicAudioPreviewEnabled === true;

  if (!options.isAdmin && !publicEligible) return release;

  return {
    ...release,
    audioUrl: `/api/releases/${encodeURIComponent(String(release.id))}/audio`,
    audioDownloadAllowed: false,
    audioStorageMode: 'stream_only',
  };
}
