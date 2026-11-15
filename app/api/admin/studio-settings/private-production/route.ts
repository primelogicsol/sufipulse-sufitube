import { NextResponse, NextRequest } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { privateProductionConnectionStorage, type PrivateProductionConnectionSettings } from '@/server/storage/private-production-connection-storage';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { isLocalSunoBrowserAvailable, ingestSunoBrowserAudio } from '@/server/integrations/suno-browser-export';
import { ingestAuthorizedAudio } from '@/server/integrations/ingest-authorized-audio';
import {
  getPrivateAudioConnection,
  isAudioStreamUrlTemplate,
  isPrivateAudioAlignmentConfigured,
  isPrivateAudioStreamConfigured,
} from '@/server/integrations/private-audio-connection-resolver';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const conn = getPrivateAudioConnection();
  const alignmentConfigured = isPrivateAudioAlignmentConfigured();
  const streamConfigured = isPrivateAudioStreamConfigured();
  const authConfigured = Boolean(conn.alignmentAuthorization || conn.streamAuthorization);
  const secureStorageReady = Boolean(process.env.PRIVATE_PRODUCTION_ENCRYPTION_KEY);

  // Do not expose secrets! Only return configuration boolean status.
  return NextResponse.json({
    alignmentConfigured,
    streamConfigured,
    localSunoBrowserAvailable: isLocalSunoBrowserAvailable(),
    authConfigured,
    secureStorageReady,
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
      const streamTemplate = incoming.streamUrlTemplate;
      if (streamTemplate != null && (typeof streamTemplate !== 'string' ||
        (streamTemplate.trim() && !isAudioStreamUrlTemplate(streamTemplate.trim())))) {
        return NextResponse.json({
          error: 'Enter an HTTPS audio provider endpoint containing {assetId}. Suno song links and the Suno MCP URL cannot be saved as audio providers.',
        }, { status: 400 });
      }
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
      const alignOk = isPrivateAudioAlignmentConfigured();
      const streamOk = isPrivateAudioStreamConfigured();
      const conn = getPrivateAudioConnection();
      const authOk = Boolean(conn.alignmentAuthorization || conn.streamAuthorization);
      const id = String(body.sourceAssetId || '').match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i)?.[0];
      const browserOk = isLocalSunoBrowserAvailable();
      if (!streamOk && !browserOk) return NextResponse.json({
        alignment: alignOk ? 'CONFIGURED_NOT_TESTED' : 'NOT_CONFIGURED',
        stream: 'NOT_CONFIGURED', auth: authOk ? 'CONFIGURED' : 'NOT_CONFIGURED',
        error: 'No audio import path is available. Configure an authorized provider or enable the local Suno browser exporter.',
      });
      if (!id) return NextResponse.json({
        alignment: alignOk ? 'CONFIGURED_NOT_TESTED' : 'NOT_CONFIGURED',
        stream: 'NOT_TESTED', auth: authOk ? 'CONFIGURED' : 'NOT_CONFIGURED',
        error: 'Enter a real Suno song link to perform a live media test.',
      });
      let testDirectory: string | undefined;
      try {
        testDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'sufipulse-audio-test-'));
        if (streamOk) await ingestAuthorizedAudio(id, path.join(testDirectory, 'test.wav'));
        else await ingestSunoBrowserAudio(id, path.join(testDirectory, 'test.wav'));
        return NextResponse.json({
          alignment: alignOk ? 'CONFIGURED_NOT_TESTED' : 'NOT_CONFIGURED',
          stream: streamOk ? 'PASS' : 'BROWSER_PASS', auth: authOk ? 'CONFIGURED' : 'NOT_CONFIGURED',
        });
      } catch (error: any) {
        return NextResponse.json({
          alignment: alignOk ? 'CONFIGURED_NOT_TESTED' : 'NOT_CONFIGURED',
          stream: 'FAIL', auth: authOk ? 'CONFIGURED' : 'NOT_CONFIGURED',
          error: String(error?.message || 'Audio stream test failed.').slice(0,250),
        });
      } finally {
        if (testDirectory) await fs.rm(testDirectory, { recursive: true, force: true }).catch(() => undefined);
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
