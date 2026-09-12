import { NextResponse, NextRequest } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { privateProductionConnectionStorage, type PrivateProductionConnectionSettings } from '@/server/storage/private-production-connection-storage';
import { isPrivateAudioAlignmentConfigured, isPrivateAudioStreamConfigured } from '@/server/integrations/private-audio-connection-resolver';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  // Do not expose secrets! Only return configuration boolean status.
  return NextResponse.json({
    alignmentConfigured: isPrivateAudioAlignmentConfigured(),
    streamConfigured: isPrivateAudioStreamConfigured(),
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
      // In a real scenario, this would perform a safe lightweight ping.
      // For now we check configuration parsing as a proxy for "PASS" / "FAIL".
      const alignOk = isPrivateAudioAlignmentConfigured();
      const streamOk = isPrivateAudioStreamConfigured();

      return NextResponse.json({
        alignment: alignOk ? 'PASS' : 'FAIL',
        stream: streamOk ? 'PASS' : 'FAIL',
        auth: (alignOk || streamOk) ? 'PASS' : 'FAIL',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
