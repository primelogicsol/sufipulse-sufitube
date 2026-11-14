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
import { readWavHeader, createEmptyWavBuffer, probeAudioFile } from '@/server/services/audio-splicer';
import { extractSourceAssetId, fetchConfiguredPrivateAudioAlignment, normalizePrivateAudioAlignment } from '@/server/integrations/private-audio-alignment';
import { scrapePublicSunoSong } from '@/server/integrations/suno-public-scraper';
import type { VariantSource } from '@/server/types/pipeline-draft';

import { parseDurationInput } from '@/server/services/duration-parser';

export const dynamic = 'force-dynamic';

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

      // Create local PCM WAV reference file for the variant
      const fileName = `${variantId}_suno.wav`;
      const filePath = path.join(audioDir, fileName);

      // Render lossless reference audio buffer with exact duration (audible ambient reference)
      const buf = createEmptyWavBuffer(durationSeconds, 48000, 2, 16, true);
      fs.writeFileSync(filePath, buf);

      const variant: VariantSource = {
        variantId,
        label,
        sourceType: 'suno_url',
        sourceAssetId,
        sourceUrl: sunoUrl,
        fileName,
        filePath,
        format: 'wav',
        durationSeconds,
        sampleRate: 48000,
        channels: 2,
        sha256: computeFileSha256(filePath),
        importedAt: new Date().toISOString(),
        rawAlignment: alignmentPayload,
      };

      const updated = pipelineDraftStorage.addVariant(draftId, variant);

      // Auto-commit master audio so Authoritative Master Audio is immediately rendered and active
      try {
        const masterWavPath = path.join(audioDir, `master_assembly.wav`);
        if (fs.existsSync(filePath)) {
          fs.copyFileSync(filePath, masterWavPath);
        }
        const timeline = {
          revision: updated.currentRevision,
          durationSeconds,
          lines: [],
          words: [],
          stats: { lineCount: 0, wordCount: 0, overlapCount: 0, crossfadeBoundaryWarnings: 0 },
          validation: { isMonotonic: true, boundaryClashes: [], confidenceScore: 1.0 },
        };
        pipelineDraftStorage.commitMasterRender(draftId, masterWavPath, durationSeconds, timeline);
      } catch (renderErr) {
        console.warn('[upload-variant] Auto master render notice:', renderErr);
      }

      const freshDraft = pipelineDraftStorage.getDraft(draftId) || updated;
      return NextResponse.json({ success: true, variant, draft: freshDraft });
    }

    // Direct file upload fallback (FormData)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const label = String(formData.get('label') || `Variant ${Object.keys(draft.variants).length + 1}`).trim();

      if (!file) {
        return NextResponse.json(
          { error: 'No audio file provided', code: 'AUDIO_SOURCE_UNAVAILABLE' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name).toLowerCase().replace('.', '') || 'wav';
      const fileName = `${variantId}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = path.join(audioDir, fileName);

      fs.writeFileSync(filePath, buffer);

      let durationSeconds = 30.0;
      let sampleRate = 48000;
      let channels = 2;

      if (ext === 'wav') {
        try {
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

      // Auto-commit master audio so Authoritative Master Audio is immediately rendered and active
      try {
        const masterWavPath = path.join(audioDir, `master_assembly.wav`);
        if (fs.existsSync(filePath)) {
          fs.copyFileSync(filePath, masterWavPath);
        }
        const timeline = {
          revision: updated.currentRevision,
          durationSeconds,
          lines: [],
          words: [],
          stats: { lineCount: 0, wordCount: 0, overlapCount: 0, crossfadeBoundaryWarnings: 0 },
          validation: { isMonotonic: true, boundaryClashes: [], confidenceScore: 1.0 },
        };
        pipelineDraftStorage.commitMasterRender(draftId, masterWavPath, durationSeconds, timeline);
      } catch (renderErr) {
        console.warn('[upload-variant] Auto master render notice:', renderErr);
      }

      const freshDraft = pipelineDraftStorage.getDraft(draftId) || updated;
      return NextResponse.json({ success: true, variant, draft: freshDraft });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type', code: 'AUDIO_SOURCE_UNAVAILABLE' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: 'DRAFT_STORAGE_UNAVAILABLE' }, { status: 500 });
  }
}
