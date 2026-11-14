import { NextResponse, NextRequest } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { privateProductionConnectionStorage, type PrivateProductionConnectionSettings } from '@/server/storage/private-production-connection-storage';
import { getPrivateAudioConnection, isPrivateAudioAlignmentConfigured, isPrivateAudioStreamConfigured } from '@/server/integrations/private-audio-connection-resolver';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  // Do not expose secrets! Only return configuration boolean status.
  return NextResponse.json({
    alignmentConfigured: isPrivateAudioAlignmentConfigured(),
    streamConfigured: isPrivateAudioStreamConfigured(),
    authConfigured: Boolean(getPrivateAudioConnection().alignmentAuthorization || getPrivateAudioConnection().streamAuthorization || getPrivateAudioConnection().alignmentExtraHeadersJson || getPrivateAudioConnection().streamExtraHeadersJson),
    secureStorageReady: Boolean(process.env.PRIVATE_PRODUCTION_ENCRYPTION_KEY?.trim()),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const action = String(body.action || '').trim();

    if (action === 'clear') {
      privateProductionConnectionStorage.clearSettings();
      return NextResponse.json({ success: true });
    }

    if (action === 'save') {
      const incoming = body.settings || {};
      const existing = privateProductionConnectionStorage.getSettings() || {};
      
      const updated: PrivateProductionConnectionSettings = {
        alignmentUrlTemplate: incoming.alignmentUrlTemplate?.trim() || existing.alignmentUrlTemplate,
        alignmentAuthorization: incoming.alignmentAuthorization?.trim() || existing.alignmentAuthorization,
        alignmentExtraHeadersJson: incoming.alignmentExtraHeadersJson?.trim() || existing.alignmentExtraHeadersJson,
        streamUrlTemplate: incoming.streamUrlTemplate?.trim() || existing.streamUrlTemplate,
        streamAuthorization: incoming.streamAuthorization?.trim() || existing.streamAuthorization,
        streamExtraHeadersJson: incoming.streamExtraHeadersJson?.trim() || existing.streamExtraHeadersJson,
        providerKey: incoming.providerKey?.trim() || existing.providerKey,
      };

      privateProductionConnectionStorage.saveSettings(updated);
      return NextResponse.json({ success: true });
    }

    if (action === 'test') {
      // A configured URL is not proof of network reachability or valid credentials.
      // Report this accurately until an authenticated, source-specific probe is implemented.
      const alignOk = isPrivateAudioAlignmentConfigured();
      const streamOk = isPrivateAudioStreamConfigured();
      const connection = getPrivateAudioConnection();
      const authConfigured = Boolean(
        connection.alignmentAuthorization || connection.streamAuthorization ||
        connection.alignmentExtraHeadersJson || connection.streamExtraHeadersJson
      );

      return NextResponse.json({
        alignment: alignOk ? 'NOT_TESTED' : 'NOT_CONFIGURED',
        stream: streamOk ? 'NOT_TESTED' : 'NOT_CONFIGURED',
        auth: authConfigured ? 'NOT_TESTED' : 'NOT_CONFIGURED',
        error: 'Configuration presence is not a live connectivity test. Use a source-specific audio probe to verify playback.',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
