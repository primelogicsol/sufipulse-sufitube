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

export function isPrivateAudioStreamConfigured(): boolean {
  const conn = getPrivateAudioConnection();
  return Boolean(conn.streamUrlTemplate && conn.streamUrlTemplate.includes('{assetId}'));
}
