import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  pipelineDraftStorage,
  getDraftAudioDir,
  computeFileSha256,
} from '@/server/storage/pipeline-draft-storage';
import { readWavHeader, createEmptyWavBuffer } from '@/server/services/audio-splicer';
import { extractSourceAssetId, fetchConfiguredPrivateAudioAlignment, normalizePrivateAudioAlignment } from '@/server/integrations/private-audio-alignment';
import type { VariantSource } from '@/server/types/pipeline-draft';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { draftId } = await params;
    const draft = pipelineDraftStorage.getDraft(draftId);
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

    const contentType = request.headers.get('content-type') || '';
    const audioDir = getDraftAudioDir(draftId);
    const variantId = `var_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const sunoUrl = String(body.sunoUrl || '').trim();
      const label = String(body.label || `Variant ${Object.keys(draft.variants).length + 1}`).trim();

      const sourceAssetId = extractSourceAssetId(sunoUrl);
      if (!sourceAssetId) {
        return NextResponse.json({ error: 'Valid Suno URL or Asset ID is required' }, { status: 400 });
      }

      // Fetch alignment data from configured Suno upstream
      let rawAlignment;
      try {
        const rawPayload = await fetchConfiguredPrivateAudioAlignment(sourceAssetId);
        rawAlignment = normalizePrivateAudioAlignment(rawPayload);
      } catch (err: any) {
        return NextResponse.json({ error: `Upstream alignment fetch failed: ${err.message}` }, { status: 502 });
      }

      // Create local PCM WAV reference file for the variant
      const durationSeconds = rawAlignment.durationSeconds || 30.0;
      const fileName = `${variantId}_suno.wav`;
      const filePath = path.join(audioDir, fileName);

      // Render lossless placeholder audio buffer with exact duration
      const buf = createEmptyWavBuffer(durationSeconds, 48000, 2, 16);
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
        rawAlignment: {
          lines: rawAlignment.lines.map((l) => ({
            index: l.index,
            text: l.text,
            startSeconds: l.startSeconds,
            endSeconds: l.endSeconds,
            words: l.words,
          })),
          words: rawAlignment.words,
          alignmentQuality: rawAlignment.alignmentQuality,
        },
      };

      const updated = pipelineDraftStorage.addVariant(draftId, variant);
      return NextResponse.json({ success: true, variant, draft: updated });
    }

    // Direct file upload fallback (FormData)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const label = String(formData.get('label') || `Variant ${Object.keys(draft.variants).length + 1}`).trim();

      if (!file) {
        return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
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
      return NextResponse.json({ success: true, variant, draft: updated });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
