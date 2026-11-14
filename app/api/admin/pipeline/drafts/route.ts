import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  pipelineDraftStorage,
  BASE_DATA_DIR,
  getDraftAudioDir,
  computeFileSha256,
} from '@/server/storage/pipeline-draft-storage';
import { createEmptyWavBuffer } from '@/server/services/audio-splicer';
import {
  extractSourceAssetId,
  fetchConfiguredPrivateAudioAlignment,
  normalizePrivateAudioAlignment,
} from '@/server/integrations/private-audio-alignment';
import type { VariantSource } from '@/server/types/pipeline-draft';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const drafts = pipelineDraftStorage.listDrafts();
    return NextResponse.json({ drafts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: 'DRAFT_STORAGE_UNAVAILABLE' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    let title = String(body.title || '').trim();
    const sunoUrl = String(body.sunoUrl || '').trim();

    // If title was omitted but sunoUrl provided, or vice-versa
    if (!title && !sunoUrl) {
      return NextResponse.json(
        { error: 'Canonical Title or Suno Song URL is required', code: 'TITLE_REQUIRED' },
        { status: 400 }
      );
    }

    const detectedAssetId = extractSourceAssetId(sunoUrl || title);

    const draft = pipelineDraftStorage.createDraft({
      title: title || (detectedAssetId ? `Suno Release (${detectedAssetId.slice(0, 8)})` : 'New Release'),
      slug: body.slug,
      lyricsText: body.lyricsText,
      primaryLanguage: body.primaryLanguage || 'ur',
      initialSourceAssetId: detectedAssetId || undefined,
    });

    // If Suno URL / Asset ID was provided, automatically ingest Variant 1
    const effectiveSunoUrl = sunoUrl || (title.includes('suno.com') ? title : '');
    if (detectedAssetId) {
      try {
        const audioDir = getDraftAudioDir(draft.draftId);
        const variantId = `var_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        const fileName = `${variantId}_suno.wav`;
        const filePath = path.join(audioDir, fileName);

        let durationSeconds = 30.0;
        let alignmentPayload: any = null;

        try {
          const rawPayload = await fetchConfiguredPrivateAudioAlignment(detectedAssetId);
          const normalized = normalizePrivateAudioAlignment(rawPayload);
          durationSeconds = normalized.durationSeconds || 30.0;
          alignmentPayload = {
            lines: normalized.lines.map((l) => ({
              index: l.index,
              text: l.text,
              startSeconds: l.startSeconds,
              endSeconds: l.endSeconds,
              words: l.words,
            })),
            words: normalized.words,
            alignmentQuality: normalized.alignmentQuality,
          };
        } catch (alignErr: any) {
          console.warn(`[pipeline-create] Upstream alignment fetch skipped: ${alignErr.message}`);
        }

        const buf = createEmptyWavBuffer(durationSeconds, 48000, 2, 16);
        fs.writeFileSync(filePath, buf);

        const variant: VariantSource = {
          variantId,
          label: 'Variant A (Primary Suno)',
          sourceType: 'suno_url',
          sourceAssetId: detectedAssetId,
          sourceUrl: effectiveSunoUrl || `https://suno.com/song/${detectedAssetId}`,
          fileName,
          filePath,
          format: 'wav',
          durationSeconds,
          sampleRate: 48000,
          channels: 2,
          sha256: computeFileSha256(filePath),
          importedAt: new Date().toISOString(),
          rawAlignment: alignmentPayload || undefined,
        };

        pipelineDraftStorage.addVariant(draft.draftId, variant);
      } catch (ingestErr: any) {
        console.error(`[pipeline-create] Auto-variant ingestion error:`, ingestErr);
      }
    }

    const freshDraft = pipelineDraftStorage.getDraft(draft.draftId) || draft;
    return NextResponse.json({ success: true, draft: freshDraft });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: 'DRAFT_STORAGE_UNAVAILABLE' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const clearedCount = pipelineDraftStorage.clearAllDrafts();
    return NextResponse.json({ success: true, clearedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: 'DRAFT_STORAGE_UNAVAILABLE' }, { status: 500 });
  }
}
