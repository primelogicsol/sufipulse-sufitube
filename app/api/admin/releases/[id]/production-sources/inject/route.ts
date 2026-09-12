import { NextResponse, NextRequest } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { extractSourceAssetId, fetchConfiguredPrivateAudioAlignment, normalizePrivateAudioAlignment } from '@/server/integrations/private-audio-alignment';
import { privateProductionSourceStorage, type PrivateProductionSourceAsset, type PrivateProductionSourceRecord } from '@/server/storage/private-production-source-storage';
import { isPrivateAudioAlignmentConfigured } from '@/server/integrations/private-audio-connection-resolver';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: releaseId } = await params;
    if (!releaseId) {
      return NextResponse.json({ error: 'Missing releaseId', state: 'INVALID_REQUEST' }, { status: 400 });
    }

    if (!isPrivateAudioAlignmentConfigured()) {
      return NextResponse.json({ error: 'Private production connection is not configured', state: 'CONNECTION_NOT_CONFIGURED' }, { status: 400 });
    }

    const body = await request.json();
    const { providerKey = 'suno', source, role = 'primary' } = body;

    const sourceAssetId = extractSourceAssetId(source);
    if (!sourceAssetId) {
      return NextResponse.json({ error: 'Could not extract source asset ID from input', state: 'SOURCE_NOT_FOUND' }, { status: 400 });
    }

    let rawPayload;
    try {
      rawPayload = await fetchConfiguredPrivateAudioAlignment(sourceAssetId);
    } catch (err: any) {
      if (err.message.includes('401') || err.message.includes('403')) {
        return NextResponse.json({ error: 'Upstream authentication failed', state: 'AUTHENTICATION_FAILED' }, { status: 401 });
      }
      if (err.message.includes('timeout')) {
        return NextResponse.json({ error: 'Upstream fetch timed out', state: 'TIMEOUT' }, { status: 504 });
      }
      return NextResponse.json({ error: `Upstream fetch failed: ${err.message}`, state: 'ALIGNMENT_UNAVAILABLE' }, { status: 502 });
    }

    let alignment;
    try {
      alignment = normalizePrivateAudioAlignment(rawPayload);
    } catch (err: any) {
      return NextResponse.json({ error: `Failed to normalize alignment payload: ${err.message}`, state: 'PAYLOAD_CHANGED' }, { status: 500 });
    }

    const now = new Date().toISOString();
    const asset: PrivateProductionSourceAsset = {
      providerKey,
      sourceAssetId,
      retrievedAt: now,
      updatedAt: now,
      alignment,
    };

    const existingRecord = privateProductionSourceStorage.get(releaseId);
    
    if (!existingRecord || role === 'primary') {
      const record: PrivateProductionSourceRecord = {
        releaseId,
        providerKey,
        sourceAssetId,
        retrievedAt: now,
        updatedAt: now,
        alignment,
        sources: {
          ...(existingRecord?.sources || {}),
          [sourceAssetId]: asset
        },
        assembly: existingRecord?.assembly,
        assemblyHistory: existingRecord?.assemblyHistory,
        rollbackSnapshot: existingRecord?.rollbackSnapshot,
      };
      privateProductionSourceStorage.save(record);
    } else {
      privateProductionSourceStorage.upsertSource(releaseId, asset);
    }

    // Return safe summary only, never exposing upstream secrets
    return NextResponse.json({
      state: 'SUCCESS',
      summary: {
        providerKey,
        sourceAssetId,
        role,
        durationSeconds: alignment.durationSeconds,
        alignmentQuality: alignment.alignmentQuality,
        stats: alignment.stats,
        retrievedAt: now,
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message, state: 'ERROR' }, { status: 500 });
  }
}
