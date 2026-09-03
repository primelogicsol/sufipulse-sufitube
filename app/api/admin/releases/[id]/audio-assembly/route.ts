import { NextRequest, NextResponse } from 'next/server';

import { cmsServerStorage } from '@/lib/cms-storage-server';
import {
  extractSourceAssetId,
  fetchConfiguredPrivateAudioAlignment,
  normalizePrivateAudioAlignment,
} from '@/server/integrations/private-audio-alignment';
import {
  compilePrivateAudioAssembly,
  type PrivateAudioAssemblyDefinition,
  type PrivateAudioAssemblySegment,
  type PrivateAudioSourceRole,
} from '@/server/integrations/private-audio-assembly';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  privateProductionSourceStorage,
  type PrivateProductionSourceAsset,
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

const SOURCE_ROLES = new Set<PrivateAudioSourceRole>([
  'primary',
  'extension',
  'alternate',
  'correction',
  'other',
]);

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

const toFiniteNonNegative = (input: unknown, field: string): number => {
  const value = Number(input);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a finite non-negative number.`);
  }
  return value;
};

const sanitizeSegment = (input: any, index: number): PrivateAudioAssemblySegment => {
  const segmentId = String(input?.segmentId || `segment-${index + 1}`).trim();
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(segmentId)) {
    throw new Error(`Segment ${index + 1} has an invalid segmentId.`);
  }

  const sourceAssetId = extractSourceAssetId(String(input?.sourceAssetId || ''));
  if (!sourceAssetId) {
    throw new Error(`Segment ${segmentId} requires a valid sourceAssetId.`);
  }

  const roleRaw = String(input?.role || (index === 0 ? 'primary' : 'extension')).trim() as PrivateAudioSourceRole;
  if (!SOURCE_ROLES.has(roleRaw)) {
    throw new Error(`Segment ${segmentId} has an unsupported role.`);
  }

  const parentSourceAssetId = input?.parentSourceAssetId
    ? extractSourceAssetId(String(input.parentSourceAssetId)) || undefined
    : undefined;
  const sourceOutSeconds = input?.sourceOutSeconds === undefined || input?.sourceOutSeconds === null || input?.sourceOutSeconds === ''
    ? undefined
    : toFiniteNonNegative(input.sourceOutSeconds, `Segment ${segmentId} sourceOutSeconds`);

  const excludedSourceLineIndexes = Array.isArray(input?.excludedSourceLineIndexes)
    ? Array.from(new Set(
        input.excludedSourceLineIndexes
          .map((value: unknown) => Number(value))
          .filter((value: number) => Number.isInteger(value) && value > 0),
      )).slice(0, 10000)
    : undefined;

  const transitionType = String(input?.transition?.type || 'cut').trim();
  if (!['cut', 'crossfade'].includes(transitionType)) {
    throw new Error(`Segment ${segmentId} transition must be cut or crossfade.`);
  }

  return {
    segmentId,
    sourceAssetId,
    role: roleRaw,
    parentSourceAssetId,
    order: toFiniteNonNegative(input?.order ?? index + 1, `Segment ${segmentId} order`),
    sourceInSeconds: toFiniteNonNegative(input?.sourceInSeconds ?? 0, `Segment ${segmentId} sourceInSeconds`),
    sourceOutSeconds,
    destinationStartSeconds: toFiniteNonNegative(
      input?.destinationStartSeconds ?? 0,
      `Segment ${segmentId} destinationStartSeconds`,
    ),
    transition: transitionType === 'crossfade'
      ? {
          type: 'crossfade',
          durationSeconds: toFiniteNonNegative(
            input?.transition?.durationSeconds,
            `Segment ${segmentId} crossfade durationSeconds`,
          ),
        }
      : { type: 'cut' },
    excludedSourceLineIndexes,
    enabled: input?.enabled !== false,
  };
};

const summarizeSource = (source: PrivateProductionSourceAsset) => ({
  providerKey: source.providerKey,
  sourceAssetId: source.sourceAssetId,
  retrievedAt: source.retrievedAt,
  updatedAt: source.updatedAt,
  durationSeconds: source.alignment.durationSeconds,
  alignmentQuality: source.alignment.alignmentQuality,
  stats: source.alignment.stats,
});

const compileStoredAssembly = (releaseId: string, assembly?: PrivateAudioAssemblyDefinition) => {
  const sources = privateProductionSourceStorage.listSources(releaseId);
  if (!sources.length || !assembly?.segments?.length) return null;
  const alignments = Object.fromEntries(sources.map((source) => [source.sourceAssetId, source.alignment]));
  return compilePrivateAudioAssembly(assembly, alignments);
};

const assemblyResponse = (releaseId: string) => {
  const record = privateProductionSourceStorage.get(releaseId);
  if (!record) {
    return {
      releaseId,
      sources: [],
      assembly: null,
      compiled: null,
    };
  }

  const sources = privateProductionSourceStorage.listSources(releaseId);
  const compiled = compileStoredAssembly(releaseId, record.assembly);
  return {
    releaseId,
    primarySourceAssetId: record.sourceAssetId,
    sources: sources.map(summarizeSource),
    assembly: record.assembly || null,
    compiled: compiled
      ? {
          assemblyVersion: compiled.assemblyVersion,
          durationSeconds: compiled.durationSeconds,
          stats: compiled.stats,
          previewLines: compiled.lines.slice(0, 20).map((line) => ({
            segmentId: line.segmentId,
            sourceAssetId: line.sourceAssetId,
            sourceLineIndex: line.sourceLineIndex,
            sourceStartSeconds: line.sourceStartSeconds,
            sourceEndSeconds: line.sourceEndSeconds,
            startSeconds: line.startSeconds,
            endSeconds: line.endSeconds,
            text: line.text,
            section: line.section,
            isProductionDirection: line.isProductionDirection,
            clippedAtStart: line.clippedAtStart,
            clippedAtEnd: line.clippedAtEnd,
          })),
        }
      : null,
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const release = cmsServerStorage.getRelease(id);
  if (!release) return NextResponse.json({ error: 'Release not found' }, { status: 404 });

  try {
    return NextResponse.json(assemblyResponse(id), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: String(error?.message || error || 'Assembly state could not be read.') },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
          { status: 400 },
        );
      }
    }

    const action = String(body?.action || '').trim();

    if (action === 'import-source') {
      const sourceUrl = sanitizeSourceUrl(body.sourceUrl);
      const sourceAssetId = extractSourceAssetId(String(body.sourceAssetId || sourceUrl || ''));
      if (!sourceAssetId) {
        return NextResponse.json(
          { error: 'A valid private source asset ID or HTTPS source URL containing the asset ID is required.' },
          { status: 400 },
        );
      }

      const providerKey = sanitizeProviderKey(body.providerKey);
      const payload = body.payload ?? (await fetchConfiguredPrivateAudioAlignment(sourceAssetId));
      const alignment = normalizePrivateAudioAlignment(payload);
      const now = new Date().toISOString();
      const source: PrivateProductionSourceAsset = {
        providerKey,
        sourceAssetId,
        sourceUrl,
        retrievedAt: now,
        updatedAt: now,
        alignment,
      };

      const existing = privateProductionSourceStorage.get(id);
      if (existing) {
        privateProductionSourceStorage.upsertSource(id, source);
      } else {
        privateProductionSourceStorage.save({
          releaseId: id,
          providerKey,
          sourceAssetId,
          sourceUrl,
          retrievedAt: now,
          updatedAt: now,
          alignment,
        });
      }

      return NextResponse.json({
        imported: true,
        source: summarizeSource(source),
        ...assemblyResponse(id),
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (action === 'save-assembly' || action === 'compile') {
      const record = privateProductionSourceStorage.get(id);
      if (!record) {
        return NextResponse.json(
          { error: 'Import at least one private production source before creating an assembly.' },
          { status: 409 },
        );
      }

      const rawSegments = Array.isArray(body?.segments)
        ? body.segments
        : record.assembly?.segments;
      if (!Array.isArray(rawSegments) || !rawSegments.length) {
        return NextResponse.json(
          { error: 'Assembly requires at least one segment.' },
          { status: 400 },
        );
      }

      const version = action === 'save-assembly'
        ? Math.max(1, Number(record.assembly?.version || 0) + 1)
        : Math.max(1, Number(body?.version || record.assembly?.version || 1));
      const assembly: PrivateAudioAssemblyDefinition = {
        version,
        updatedAt: new Date().toISOString(),
        segments: rawSegments.map(sanitizeSegment),
      };

      const sources = privateProductionSourceStorage.listSources(id);
      const alignments = Object.fromEntries(sources.map((source) => [source.sourceAssetId, source.alignment]));
      const compiled = compilePrivateAudioAssembly(assembly, alignments);

      if (action === 'save-assembly') {
        privateProductionSourceStorage.setAssembly(id, assembly);
      }

      return NextResponse.json({
        saved: action === 'save-assembly',
        assembly,
        compiled: {
          assemblyVersion: compiled.assemblyVersion,
          durationSeconds: compiled.durationSeconds,
          stats: compiled.stats,
          previewLines: compiled.lines.slice(0, 50).map((line) => ({
            segmentId: line.segmentId,
            sourceAssetId: line.sourceAssetId,
            sourceLineIndex: line.sourceLineIndex,
            sourceStartSeconds: line.sourceStartSeconds,
            sourceEndSeconds: line.sourceEndSeconds,
            startSeconds: line.startSeconds,
            endSeconds: line.endSeconds,
            text: line.text,
            section: line.section,
            isProductionDirection: line.isProductionDirection,
            clippedAtStart: line.clippedAtStart,
            clippedAtEnd: line.clippedAtEnd,
          })),
        },
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json(
      { error: 'Unsupported action. Use import-source, compile, or save-assembly.' },
      { status: 400 },
    );
  } catch (error: any) {
    const message = error?.name === 'AbortError'
      ? 'Private audio alignment fetch timed out.'
      : String(error?.message || error || 'Private audio assembly request failed.');
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
