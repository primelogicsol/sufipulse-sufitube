import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  pipelineDraftStorage,
  isValidDraftId,
  BASE_DATA_DIR,
  getDraftAudioDir,
  computeFileSha256,
} from '@/server/storage/pipeline-draft-storage';
import { readWavHeader, probeAudioFile } from '@/server/services/audio-splicer';
import { extractSourceAssetId, fetchConfiguredPrivateAudioAlignment, normalizePrivateAudioAlignment } from '@/server/integrations/private-audio-alignment';
import { scrapePublicSunoSong } from '@/server/integrations/suno-public-scraper';
import { ingestAuthorizedAudio } from '@/server/integrations/ingest-authorized-audio';
import { isPrivateAudioStreamConfigured } from '@/server/integrations/private-audio-connection-resolver';
import { ingestSunoBrowserAudio, isLocalSunoBrowserAvailable } from '@/server/integrations/suno-browser-export';
import type { VariantSource } from '@/server/types/pipeline-draft';

import { parseDurationInput } from '@/server/services/duration-parser';

export const dynamic = 'force-dynamic';

function selectRecordingForReferenceAssembly(
  updated: ReturnType<typeof pipelineDraftStorage.addVariant>,
  variant: VariantSource,
) {
  const enabledSegments = updated.assembly.segments.filter(segment => segment.enabled);
  if (enabledSegments.length && enabledSegments.every(segment =>
    updated.variants[segment.sourceVariantId]?.sourceType === 'suno_url')) {
    updated.activeVariantId = variant.variantId;
    updated.assembly.segments = [{
      segmentId: "seg_recording_" + variant.variantId,
      sourceVariantId: variant.variantId,
      sourceInSeconds: 0,
      sourceOutSeconds: variant.durationSeconds,
      destinationStartSeconds: 0,
      transition: { type: "cut" },
      trackType: "full_mix",
      enabled: true,
    }];
    updated.assembly.updatedAt = new Date().toISOString();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { draftId } = await params;
    if (!isValidDraftId(draftId)) {
      return NextResponse.json(
        { error: `Invalid draft ID format: "${draftId}"`, code: 'INVALID_DRAFT_ID', draftId },
        { status: 400 }
      );
    }

    if (!fs.existsSync(BASE_DATA_DIR)) {
      return NextResponse.json(
        { error: 'Draft storage directory unavailable', code: 'DRAFT_STORAGE_UNAVAILABLE' },
        { status: 500 }
      );
    }

    const draft = pipelineDraftStorage.getDraft(draftId);
    if (!draft) {
      console.warn(`[upload-variant] Draft not found on disk: "${draftId}" in ${BASE_DATA_DIR}`);
      return NextResponse.json(
        { error: `Pipeline draft not found: ${draftId}`, code: 'DRAFT_NOT_FOUND', draftId },
        { status: 404 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    const audioDir = getDraftAudioDir(draftId);
    const variantId = `var_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const sunoUrl = String(body.sunoUrl || '').trim();
      const label = String(body.label || `Variant ${Object.keys(draft.variants).length + 1}`).trim();

      const sourceAssetId = extractSourceAssetId(sunoUrl);
      if (!sourceAssetId) {
        return NextResponse.json(
          { error: 'Valid Suno URL or 36-char Asset ID is required', code: 'AUDIO_SOURCE_UNAVAILABLE' },
          { status: 400 }
        );
      }

      // URL metadata must never be substituted for the actual music.
      if (body.rightsConfirmed !== true) {
        return NextResponse.json({
          error: 'Confirm that this song is yours or that you have authorization to import the recording.',
          code: 'RIGHTS_CONFIRMATION_REQUIRED',
        }, { status: 403 });
      }
      const useProvider = isPrivateAudioStreamConfigured();
      if (!useProvider && !isLocalSunoBrowserAvailable()) {
        return NextResponse.json({
          error: 'No authorized audio provider is connected. Configure the stream URL template in Studio Audio Settings, or use Upload Audio for an official Suno export.',
          code: 'AUDIO_PROVIDER_NOT_CONFIGURED',
          sourceAssetId,
        }, { status: 422 });
      }

      console.log(`[upload-variant] Ingesting Suno variant for draft ${draftId}: assetId=${sourceAssetId}`);

      // Fetch alignment data from configured Suno upstream, with graceful public scraper fallback
      let rawAlignment: any = null;
      let userDuration = parseDurationInput(body.duration);
      let durationSeconds = userDuration || 30.0;
      let alignmentPayload: any = undefined;

      try {
        const rawPayload = await fetchConfiguredPrivateAudioAlignment(sourceAssetId);
        rawAlignment = normalizePrivateAudioAlignment(rawPayload);
        durationSeconds = userDuration || rawAlignment.durationSeconds || 30.0;
        alignmentPayload = {
          lines: rawAlignment.lines.map((l: any) => ({
            index: l.index,
            text: l.text,
            startSeconds: l.startSeconds,
            endSeconds: l.endSeconds,
            words: l.words,
          })),
          words: rawAlignment.words,
          alignmentQuality: rawAlignment.alignmentQuality,
        };
      } catch (err: any) {
        console.warn(`[upload-variant] Private alignment notice: ${err.message}. Attempting public Suno metadata fallback.`);
        try {
          const scraped = await scrapePublicSunoSong(sourceAssetId);
          if (scraped) {
            if (scraped.durationSeconds > 0 && (!userDuration || (userDuration < 30 && scraped.durationSeconds >= 30))) {
              durationSeconds = scraped.durationSeconds;
            }
            if (scraped.title && (draft.title.startsWith('Suno Release') || draft.title.startsWith('Untitled'))) {
              draft.title = scraped.title;
            }
            if (scraped.lyrics && (!draft.canonicalLyrics.text || draft.canonicalLyrics.text.trim().length === 0)) {
              draft.canonicalLyrics.text = scraped.lyrics;
            }
            pipelineDraftStorage.saveDraft(draft);
          }
        } catch (scrapeErr: any) {
          console.warn(`[upload-variant] Public Suno scrape notice: ${scrapeErr.message}`);
        }
      }

      const fileName = `${variantId}_authorized.wav`;
      const filePath = path.join(audioDir, fileName);
      let retrieved;
      try {
        retrieved = useProvider
          ? await ingestAuthorizedAudio(sourceAssetId, filePath)
          : await ingestSunoBrowserAudio(sourceAssetId, filePath);
      } catch (error) {
        return NextResponse.json({
          error: error instanceof Error ? error.message : 'Suno export failed.',
          code: 'SUNO_EXPORT_FAILED',
        }, { status: 422 });
      }
      const sha256 = computeFileSha256(filePath);
      // Re-import of the same song is idempotent.
      const latestDraft = pipelineDraftStorage.getDraft(draftId) || draft;
      const duplicate = Object.values(latestDraft.variants).find(v =>
        v.sha256 === sha256 && v.sourceType === 'audio_upload' && fs.existsSync(v.filePath));
      if (duplicate) {
        fs.rmSync(filePath, { force: true });
        return NextResponse.json({ success: true, reused: true, variant: duplicate,
          needsMasterRender: !latestDraft.masterAudio && latestDraft.activeVariantId === duplicate.variantId &&
            latestDraft.assembly.segments.filter(segment => segment.enabled).length === 1 &&
            latestDraft.assembly.segments.some(segment => segment.enabled && segment.sourceVariantId === duplicate.variantId),
          draft: latestDraft,
        });
      }
      const variant: VariantSource = {
        variantId, label, sourceType: 'audio_upload',
        sourceAssetId, sourceUrl: sunoUrl, fileName, filePath,
        format: 'wav', durationSeconds: retrieved.durationSeconds,
        sampleRate: retrieved.sampleRate, channels: retrieved.channels,
        sha256, importedAt: new Date().toISOString(),
        rawAlignment: alignmentPayload,
      };
      const updated = pipelineDraftStorage.addVariant(draftId, variant);
      selectRecordingForReferenceAssembly(updated, variant);
      if (updated.activeVariantId !== variant.variantId || !updated.assembly.segments.some(segment =>
        segment.enabled && segment.sourceVariantId === variant.variantId)) {
        return NextResponse.json({ success: true, variant, needsMasterRender: false, draft: updated });
      }
      updated.masterAudio = null;
      updated.masterTimeline = null;
      updated.downstreamStatus.timestampsValid = false;
      updated.downstreamStatus.subtitlesValid = false;
      updated.downstreamStatus.videoValid = false;
      updated.downstreamStatus.approvalStatus = 'assembly_pending_review';
      if (updated.video) { updated.video.status = 'PENDING'; updated.video.formats = {}; }
      pipelineDraftStorage.saveDraft(updated);
      return NextResponse.json({ success: true, variant, needsMasterRender: true, draft: updated });

    }

    // Direct file upload fallback (FormData or direct binary stream)
    if (
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/octet-stream') ||
      contentType.includes('audio/')
    ) {
      let fileName = 'variant_audio.wav';
      let label = `Variant ${Object.keys(draft.variants).length + 1}`;
      const extFromMime = contentType.includes('mpeg') || contentType.includes('mp3') ? 'mp3' : 'wav';
      const targetFileName = `${variantId}_audio.${extFromMime}`;
      const filePath = path.join(audioDir, targetFileName);

      const labelHeader = request.headers.get('x-label');
      if (labelHeader) label = decodeURIComponent(labelHeader);
      const fileNameHeader = request.headers.get('x-file-name');
      if (fileNameHeader) fileName = decodeURIComponent(fileNameHeader);

      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) {
          return NextResponse.json(
            { error: 'No audio file provided', code: 'AUDIO_SOURCE_UNAVAILABLE' },
            { status: 400 }
          );
        }
        fileName = file.name;
        if (formData.get('label')) label = String(formData.get('label')).trim();
        const writeStream = fs.createWriteStream(filePath);
        const { pipeline: streamPipeline } = await import('node:stream/promises');
        const { Readable } = await import('node:stream');
        await streamPipeline(Readable.fromWeb(file.stream() as any), writeStream);
      } else if (request.body) {
        const writeStream = fs.createWriteStream(filePath);
        const { pipeline: streamPipeline } = await import('node:stream/promises');
        const { Readable } = await import('node:stream');
        await streamPipeline(Readable.fromWeb(request.body as any), writeStream);
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
        return NextResponse.json(
          { error: 'Empty audio file received', code: 'AUDIO_SOURCE_UNAVAILABLE' },
          { status: 400 }
        );
      }

      const ext = path.extname(fileName).toLowerCase().replace('.', '') || extFromMime;

      let durationSeconds = 30.0;
      let sampleRate = 48000;
      let channels = 2;

      if (ext === 'wav') {
        try {
          const buffer = fs.readFileSync(filePath);
          const meta = readWavHeader(buffer);
          durationSeconds = meta.durationSeconds;
          sampleRate = meta.sampleRate;
          channels = meta.channels;
        } catch {}
      }

      // If ffprobe is available, probe exact audio metrics for MP3, M4A, FLAC, AAC or WAV
      try {
        const probed = await probeAudioFile(filePath);
        if (probed && probed.durationSeconds > 0) {
          durationSeconds = Math.round(probed.durationSeconds * 100) / 100;
          sampleRate = probed.sampleRate || sampleRate;
          channels = probed.channels || channels;
        }
      } catch {}

      const variant: VariantSource = {
        variantId,
        label,
        sourceType: 'audio_upload',
        fileName,
        filePath,
        format: ext as any,
        durationSeconds,
        sampleRate,
        channels,
        sha256: computeFileSha256(filePath),
        importedAt: new Date().toISOString(),
      };

      const updated = pipelineDraftStorage.addVariant(draftId, variant);
      selectRecordingForReferenceAssembly(updated, variant);
      if (updated.activeVariantId !== variant.variantId || !updated.assembly.segments.some(segment =>
        segment.enabled && segment.sourceVariantId === variant.variantId)) {
        return NextResponse.json({ success: true, variant, needsMasterRender: false, draft: updated });
      }
      // Do not copy an unconverted MP3/FLAC or an unreviewed variant into the
      // authoritative WAV slot. A successful upload is NOT a rendered master.
      updated.masterAudio = null;
      updated.masterTimeline = null;
      updated.downstreamStatus.timestampsValid = false;
      updated.downstreamStatus.subtitlesValid = false;
      updated.downstreamStatus.videoValid = false;
      updated.downstreamStatus.approvalStatus = 'assembly_pending_review';
      if (updated.video) updated.video.status = 'PENDING';
      pipelineDraftStorage.saveDraft(updated);
      return NextResponse.json({ success: true, variant, needsMasterRender: true, draft: updated });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type', code: 'AUDIO_SOURCE_UNAVAILABLE' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: 'DRAFT_STORAGE_UNAVAILABLE' }, { status: 500 });
  }
}
