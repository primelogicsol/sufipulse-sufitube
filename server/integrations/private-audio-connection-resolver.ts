import { privateProductionConnectionStorage } from '@/server/storage/private-production-connection-storage';

export interface PrivateAudioConnection {
  alignmentUrlTemplate: string | null;
  alignmentAuthorization: string | null;
  alignmentExtraHeadersJson: string | null;
  streamUrlTemplate: string | null;
  streamAuthorization: string | null;
  streamExtraHeadersJson: string | null;
  providerKey: string | null;
}

export function getPrivateAudioConnection(): PrivateAudioConnection {
  const secureSettings = privateProductionConnectionStorage.getSettings();

  return {
    alignmentUrlTemplate: secureSettings?.alignmentUrlTemplate || process.env.PRIVATE_AUDIO_ALIGNMENT_URL_TEMPLATE?.trim() || null,
    alignmentAuthorization: secureSettings?.alignmentAuthorization || process.env.PRIVATE_AUDIO_ALIGNMENT_AUTHORIZATION?.trim() || null,
    alignmentExtraHeadersJson: secureSettings?.alignmentExtraHeadersJson || process.env.PRIVATE_AUDIO_ALIGNMENT_EXTRA_HEADERS_JSON?.trim() || null,
    streamUrlTemplate: secureSettings?.streamUrlTemplate || process.env.PRIVATE_AUDIO_STREAM_URL_TEMPLATE?.trim() || null,
    streamAuthorization: secureSettings?.streamAuthorization || process.env.PRIVATE_AUDIO_STREAM_AUTHORIZATION?.trim() || null,
    streamExtraHeadersJson: secureSettings?.streamExtraHeadersJson || process.env.PRIVATE_AUDIO_STREAM_EXTRA_HEADERS_JSON?.trim() || null,
    providerKey: secureSettings?.providerKey || process.env.PRIVATE_AUDIO_PROVIDER_KEY?.trim() || null,
  };
}

export function isPrivateAudioAlignmentConfigured(): boolean {
  const conn = getPrivateAudioConnection();
  return Boolean(conn.alignmentUrlTemplate && conn.alignmentUrlTemplate.includes('{assetId}'));
}

export function isAudioStreamUrlTemplate(value?: string | null): boolean {
  if (!value?.includes('{assetId}')) return false;
  try {
    const url = new URL(value.replaceAll('{assetId}', '00000000-0000-4000-8000-000000000000'));
    const isSunoPage = /^(www\.)?suno\.com$/i.test(url.hostname);
    const isSunoMcp = url.hostname === 'api.suno.com' && /^\/mcp\/?$/.test(url.pathname);
    return url.protocol === 'https:' && !url.username && !url.password && !isSunoPage && !isSunoMcp;
  } catch {
    return false;
  }
}

export function isPrivateAudioStreamConfigured(): boolean {
  return isAudioStreamUrlTemplate(getPrivateAudioConnection().streamUrlTemplate);
}
