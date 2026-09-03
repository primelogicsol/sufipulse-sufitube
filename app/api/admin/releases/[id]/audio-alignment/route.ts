import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  extractSourceAssetId,
  fetchConfiguredPrivateAudioAlignment,
  normalizePrivateAudioAlignment,
  type PrivateAlignedLine,
} from '@/server/integrations/private-audio-alignment';
import {
  privateProductionSourceStorage,
  type PrivateProductionSourceRecord,
} from '@/server/storage/private-production-source-storage';

export const dynamic = 'force-dynamic';

const PROHIBITED_REQUEST_SECRET_KEYS = [
  'authorization',
  'bearerToken',
  'accessToken',
  'cookie',
  'headers',
  'deviceId',
  'browserToken',
];

const secondsToTimestamp = (seconds: number): string => {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

const cueIdForLine = (releaseId: string, sourceAssetId: string, line: PrivateAlignedLine): string => {
  const digest = createHash('sha1')
    .update(`${releaseId}|${sourceAssetId}|${line.index}|${line.startSeconds}|${line.endSeconds}`)
    .digest('hex')
    .slice(0, 16);
  return `cue_audio_${digest}`;
};

const publicSummary = (record: PrivateProductionSourceRecord) => ({
  releaseId: record.releaseId,
  providerKey: record.providerKey,
  sourceAssetId: record.sourceAssetId,
  sourceUrl: record.sourceUrl,
  retrievedAt: record.retrievedAt,
  updatedAt: record.updatedAt,
  durationSeconds: record.alignment.durationSeconds,
  alignmentQuality: record.alignment.alignmentQuality,
  isStreamed: record.alignment.isStreamed,
  payloadHash: record.alignment.payloadHash,
  stats: record.alignment.stats,
  hasRollbackSnapshot: Boolean(record.rollbackSnapshot),
  rollbackCapturedAt: record.rollbackSnapshot?.capturedAt,
});

const sanitizeProviderKey = (input: unknown): string => {
  const value = String(input || process.env.PRIVATE_AUDIO_PROVIDER_KEY || 'configured_private_audio_source').trim();
  if (!/^[A-Za-z0-9._-]{2,80}$/.test(value)) {
    throw new Error('providerKey contains unsupported characters.');
  }
  return value;
};

const sanitizeSourceUrl = (input: unknown): string | undefined => {
  const value = String(input || '').trim();
  if (!value) return undefined;
  if (value.length > 2048) throw new Error('sourceUrl is too long.');

  const parsed = new URL(value);
  if (parsed.protocol !== 'https:') throw new Error('sourceUrl must use HTTPS.');
  return parsed.toString();
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const release = cmsServerStorage.getRelease(id);
  if (!release) return NextResponse.json({ error: 'Release not found' }, { status: 404 });

  const record = privateProductionSourceStorage.get(id);
  if (!record) {
    return NextResponse.json({
      releaseId: id,
      configured: Boolean(process.env.PRIVATE_AUDIO_ALIGNMENT_URL_TEMPLATE),
      source: null,
    });
  }

  const full = new URL(request.url).searchParams.get('full') === '1';
  return NextResponse.json({
    configured: Boolean(process.env.PRIVATE_AUDIO_ALIGNMENT_URL_TEMPLATE),
    source: full ? record : publicSummary(record),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const release = cmsServerStorage.getRelease(id);
  if (!release) return NextResponse.json({ error: 'Release not found' }, { status: 404 });

  try {
    const body = await request.json().catch(() => ({}));

    for (const key of PROHIBITED_REQUEST_SECRET_KEYS) {
      if (body?.[key] !== undefined) {
        return NextResponse.json(
          { error: `Do not send ${key} in this request. Provider credentials must remain server-side environment secrets.` },
          { status: 400 }
        );
      }
    }

    const sourceUrl = sanitizeSourceUrl(body.sourceUrl);
    const sourceAssetId = extractSourceAssetId(String(body.sourceAssetId || sourceUrl || ''));
    if (!sourceAssetId) {
      return NextResponse.json(
        { error: 'A valid private source asset ID or HTTPS source URL containing the asset ID is required.' },
        { status: 400 }
      );
    }

    const providerKey = sanitizeProviderKey(body.providerKey);
    const payload = body.payload ?? (await fetchConfiguredPrivateAudioAlignment(sourceAssetId));
    const alignment = normalizePrivateAudioAlignment(payload);
    const now = new Date().toISOString();

    let record = privateProductionSourceStorage.save({
      releaseId: id,
      providerKey,
      sourceAssetId,
      sourceUrl,
      retrievedAt: now,
      updatedAt: now,
      alignment,
      rollbackSnapshot: privateProductionSourceStorage.get(id)?.rollbackSnapshot,
    });

    const applyToMasterTiming = body.applyToMasterTiming === true;
    if (!applyToMasterTiming) {
      return NextResponse.json({
        imported: true,
        appliedToMasterTiming: false,
        source: publicSummary(record),
        previewLines: alignment.lines.slice(0, 12).map((line) => ({
          index: line.index,
          startSeconds: line.startSeconds,
          endSeconds: line.endSeconds,
          text: line.text,
          section: line.section,
          isProductionDirection: line.isProductionDirection,
        })),
      });
    }

    const existingCueCount = release.subtitleCues?.length || 0;
    if (existingCueCount > 0 && body.confirmReplace !== true) {
      return NextResponse.json(
        {
          error: 'Master timing already exists. Re-submit with confirmReplace=true only after reviewing the imported alignment.',
          existingCueCount,
          imported: true,
          appliedToMasterTiming: false,
          source: publicSummary(record),
        },
        { status: 409 }
      );
    }

    const publishableLines = alignment.lines.filter((line) => !line.isProductionDirection && line.text.trim());
    if (!publishableLines.length) {
      return NextResponse.json({ error: 'No publishable timed lyric lines remain after direction filtering.' }, { status: 422 });
    }

    const language = String(body.language || release.defaultLanguage || 'en').trim().toLowerCase();
    if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/i.test(language)) {
      return NextResponse.json({ error: 'language must be a valid language code such as en, ur, hi, or pa.' }, { status: 400 });
    }

    record = privateProductionSourceStorage.setRollbackSnapshot(id, {
      capturedAt: new Date().toISOString(),
      masterTimingVersion: release.masterTimingVersion,
      subtitleCues: release.subtitleCues,
      subtitleTranslations: release.subtitleTranslations,
      subtitleLanguageStatuses: release.subtitleLanguageStatuses,
      subtitleCueMetadata: release.subtitleCueMetadata,
      availableLanguages: release.availableLanguages,
      defaultLanguage: release.defaultLanguage,
    }) || record;

    const subtitleCues = publishableLines.map((line, index) => {
      const cueId = cueIdForLine(id, sourceAssetId, line);
      return {
        id: cueId,
        cueNumber: index + 1,
        startTime: secondsToTimestamp(line.startSeconds),
        endTime: secondsToTimestamp(line.endSeconds),
        lineRef: `audio-alignment:${line.index}`,
        sourceType: 'audio_alignment' as any,
        active: true,
      };
    });

    const sourceLanguageText: Record<string, string> = {};
    const subtitleCueMetadata: Record<string, any> = {};
    publishableLines.forEach((line, index) => {
      const cueId = subtitleCues[index].id;
      sourceLanguageText[cueId] = line.text;
      if (line.section) {
        subtitleCueMetadata[cueId] = {
          lineRole: ['verse', 'refrain', 'chorus', 'bridge', 'hook'].includes(line.section.toLowerCase())
            ? line.section.toLowerCase()
            : 'other',
        };
      }
    });

    const updated = cmsServerStorage.saveRelease({
      ...release,
      masterTimingVersion: (release.masterTimingVersion || 0) + 1,
      subtitleCues,
      subtitleTranslations: { [language]: sourceLanguageText },
      subtitleLanguageStatuses: { [language]: 'draft' },
      subtitleCueMetadata,
      availableLanguages: Array.from(new Set([...(release.availableLanguages || []), language])),
      defaultLanguage: release.defaultLanguage || language,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      imported: true,
      appliedToMasterTiming: true,
      source: publicSummary(record),
      releaseId: updated.id,
      masterTimingVersion: updated.masterTimingVersion,
      language,
      cueCount: subtitleCues.length,
      filteredProductionDirections: alignment.stats.productionDirectionCount,
      overlapCount: alignment.stats.overlapCount,
      subtitleStatus: 'draft',
    });
  } catch (error: any) {
    const message = error?.name === 'AbortError'
      ? 'Private audio alignment fetch timed out.'
      : String(error?.message || error || 'Private audio alignment import failed.');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const release = cmsServerStorage.getRelease(id);
  if (!release) return NextResponse.json({ error: 'Release not found' }, { status: 404 });

  const deleted = privateProductionSourceStorage.delete(id);
  return NextResponse.json({ releaseId: id, deleted });
}
