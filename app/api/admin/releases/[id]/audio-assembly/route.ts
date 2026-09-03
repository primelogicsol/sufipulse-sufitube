import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

import { cmsServerStorage } from '@/lib/cms-storage-server';
import {
  extractSourceAssetId,
  fetchConfiguredPrivateAudioAlignment,
  isProductionDirection,
  normalizePrivateAudioAlignment,
} from '@/server/integrations/private-audio-alignment';
import {
  compilePrivateAudioAssembly,
  type CompiledPrivateAudioLine,
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

const secondsToTimestamp = (seconds: number): string => {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

const normalizeLanguage = (value: unknown): string => String(value || '').trim().toLowerCase();

const getApprovedLyricsStructureLines = (release: any, language: string): string[] => {
  const structures = release?.lyricsStructure || {};
  const normalizedLanguage = normalizeLanguage(language);
  const structureKey = Object.keys(structures).find((key) => normalizeLanguage(key) === normalizedLanguage);
  if (!structureKey || !Array.isArray(structures[structureKey])) return [];

  return [...structures[structureKey]]
    .sort((a: any, b: any) => Number(a?.order || 0) - Number(b?.order || 0))
    .flatMap((block: any) => Array.isArray(block?.lines) ? block.lines : [])
    .map((line: unknown) => String(line || '').trim())
    .filter((line: string) => Boolean(line) && !isProductionDirection(line));
};

const resolveCaptionText = (
  release: any,
  language: string,
  publishableLines: CompiledPrivateAudioLine[],
  allowProviderTextFallback: boolean,
): { textLines: string[]; textSource: 'cms_lyrics_structure' | 'provider_alignment_draft' } => {
  const approvedLines = getApprovedLyricsStructureLines(release, language);

  if (approvedLines.length > 0) {
    if (approvedLines.length !== publishableLines.length) {
      throw new Error(
        `Approved CMS lyrics contain ${approvedLines.length} publishable lines, but the compiled production assembly contains ${publishableLines.length}. ` +
        'Master timing was not changed. Adjust source in/out points or explicitly exclude repeated extension lines until the assembly maps one-to-one to the approved lyrics.',
      );
    }
    return { textLines: approvedLines, textSource: 'cms_lyrics_structure' };
  }

  if (!allowProviderTextFallback) {
    throw new Error(
      `No approved CMS lyrics structure was found for language "${language}". ` +
      'Provider transcription remains private. Add/approve the master lyrics first, or explicitly allow provider-text fallback only for a controlled internal draft.',
    );
  }

  return {
    textLines: publishableLines.map((line) => line.text),
    textSource: 'provider_alignment_draft',
  };
};

const cueIdForAssemblyLine = (
  releaseId: string,
  assemblyVersion: number,
  line: CompiledPrivateAudioLine,
): string => {
  const digest = createHash('sha1')
    .update(
      `${releaseId}|assembly:${assemblyVersion}|${line.segmentId}|${line.sourceAssetId}|${line.sourceLineIndex}|${line.startSeconds}|${line.endSeconds}`,
    )
    .digest('hex')
    .slice(0, 16);
  return `cue_assembly_${digest}`;
};

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

    if (action === 'apply-master-timing') {
      const record = privateProductionSourceStorage.get(id);
      if (!record?.assembly) {
        return NextResponse.json(
          { error: 'Save and review a private production assembly before applying master timing.' },
          { status: 409 },
        );
      }

      const compiled = compileStoredAssembly(id, record.assembly);
      if (!compiled) {
        return NextResponse.json({ error: 'The saved production assembly could not be compiled.' }, { status: 422 });
      }

      const publishableLines = compiled.lines.filter((line) => !line.isProductionDirection && line.text.trim());
      if (!publishableLines.length) {
        return NextResponse.json({ error: 'No publishable lyric lines remain after assembly filtering.' }, { status: 422 });
      }

      const language = normalizeLanguage(body.language || release.defaultLanguage || 'en');
      if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/i.test(language)) {
        return NextResponse.json({ error: 'language must be a valid language code such as en, ur, hi, or pa.' }, { status: 400 });
      }

      const existingCueCount = release.subtitleCues?.length || 0;
      if (existingCueCount > 0 && body.confirmReplace !== true) {
        return NextResponse.json(
          {
            error: 'Master timing already exists. Re-submit with confirmReplace=true only after reviewing the compiled assembly.',
            existingCueCount,
            appliedToMasterTiming: false,
          },
          { status: 409 },
        );
      }

      const existingTranslatedLanguages = Object.entries(release.subtitleTranslations || {})
        .filter(([code, map]) =>
          normalizeLanguage(code) !== language &&
          map &&
          typeof map === 'object' &&
          Object.keys(map).length > 0,
        )
        .map(([code]) => code);

      if (
        existingCueCount > 0 &&
        existingTranslatedLanguages.length > 0 &&
        body.confirmTranslationReset !== true
      ) {
        return NextResponse.json(
          {
            error:
              'This release already has translated caption tracks. Replacing master timing would invalidate their cue IDs. ' +
              'Master timing was not changed. Use a controlled translation-remap workflow, or explicitly confirm a translation reset only if those tracks may be discarded.',
            existingTranslatedLanguages,
            existingCueCount,
            appliedToMasterTiming: false,
            requiresTranslationResetConfirmation: true,
          },
          { status: 409 },
        );
      }

      let captionText: ReturnType<typeof resolveCaptionText>;
      try {
        captionText = resolveCaptionText(
          release,
          language,
          publishableLines,
          body.allowProviderTextFallback === true,
        );
      } catch (error: any) {
        return NextResponse.json(
          {
            error: String(error?.message || error),
            appliedToMasterTiming: false,
            approvedLyricsLineCount: getApprovedLyricsStructureLines(release, language).length,
            assemblyPublishableLineCount: publishableLines.length,
            assemblyVersion: record.assembly.version,
          },
          { status: 422 },
        );
      }

      privateProductionSourceStorage.setRollbackSnapshot(id, {
        capturedAt: new Date().toISOString(),
        masterTimingVersion: release.masterTimingVersion,
        subtitleCues: release.subtitleCues,
        subtitleTranslations: release.subtitleTranslations,
        subtitleLanguageStatuses: release.subtitleLanguageStatuses,
        subtitleCueMetadata: release.subtitleCueMetadata,
        availableLanguages: release.availableLanguages,
        defaultLanguage: release.defaultLanguage,
      });

      const subtitleCues = publishableLines.map((line, index) => ({
        id: cueIdForAssemblyLine(id, record.assembly!.version, line),
        cueNumber: index + 1,
        startTime: secondsToTimestamp(line.startSeconds),
        endTime: secondsToTimestamp(line.endSeconds),
        lineRef: `audio-assembly:${record.assembly!.version}:${line.segmentId}:${line.sourceLineIndex}`,
        sourceType: 'audio_alignment' as any,
        active: true,
      }));

      const sourceLanguageText: Record<string, string> = {};
      const subtitleCueMetadata: Record<string, any> = {};
      publishableLines.forEach((line, index) => {
        const cueId = subtitleCues[index].id;
        sourceLanguageText[cueId] = captionText.textLines[index];
        subtitleCueMetadata[cueId] = {
          ...(line.section ? {
            lineRole: ['verse', 'refrain', 'chorus', 'bridge', 'hook'].includes(line.section.toLowerCase())
              ? line.section.toLowerCase()
              : 'other',
          } : {}),
          sourceTextMode: captionText.textSource,
          timingSourceMode: 'private_audio_assembly',
          assemblyVersion: record.assembly!.version,
          assemblySegment: line.segmentId,
          sourceLineIndex: line.sourceLineIndex,
          clippedAtAssemblyStart: line.clippedAtStart,
          clippedAtAssemblyEnd: line.clippedAtEnd,
        };
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
        appliedToMasterTiming: true,
        releaseId: updated.id,
        masterTimingVersion: updated.masterTimingVersion,
        assemblyVersion: record.assembly.version,
        language,
        cueCount: subtitleCues.length,
        captionTextSource: captionText.textSource,
        filteredProductionDirections: compiled.stats.productionDirectionCount,
        explicitlyExcludedSourceLines: compiled.stats.excludedLineCount,
        clippedLines: compiled.stats.clippedLineCount,
        overlapCount: compiled.stats.overlapCount,
        subtitleStatus: 'draft',
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json(
      { error: 'Unsupported action. Use import-source, compile, save-assembly, or apply-master-timing.' },
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
