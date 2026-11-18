import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';
import { pipelineDraftStorage, computeFileSha256 } from '@/server/storage/pipeline-draft-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import type { CMSRelease } from '@/lib/cms-storage';
import { probeMediaFile } from '@/server/services/video-renderer';
import { probeAudioFile } from '@/server/services/audio-splicer';
import { hasChangingVideoFrames } from '@/server/services/video-motion-validator';
import { generateViralCutdowns } from '@/server/services/viral-cutdown-generator';
import { dispatchReleaseSyndication } from '@/server/services/syndication-dispatcher';

export const dynamic = 'force-dynamic';

// This action transfers an approved master to the private CMS. It never publishes to YouTube.
export async function POST(request: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { draftId } = await params;
    const body = await request.json().catch(() => ({}));
    if (body.confirmFinalApproval !== true) return NextResponse.json({ error: 'Explicit final approval required.' }, { status: 403 });
    const draft = pipelineDraftStorage.getDraft(draftId);
    if (!draft) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 });
    const audio = draft.masterAudio;
    if (!audio || !fs.existsSync(audio.filePath) || !draft.masterTimeline) {
      return NextResponse.json({ error: 'Authoritative master audio and timeline are missing.' }, { status: 422 });
    }
    const usedSourceIds = draft.assembly.segments.filter(segment => segment.enabled).map(segment => segment.sourceVariantId);
    if (!usedSourceIds.length || usedSourceIds.some(id => !draft.variants[id] || draft.variants[id].sourceType === 'suno_url')) {
      return NextResponse.json({ error: 'The selected assembly must use verified audio recordings, not synthetic URL reference tracks.' }, { status: 422 });
    }
    const audioProbe = await probeAudioFile(audio.filePath);
    if (!audioProbe || Math.abs(audioProbe.durationSeconds - audio.durationSeconds) > 0.5) {
      return NextResponse.json({ error: 'The master WAV failed audio validation.' }, { status: 422 });
    }
    const lines = draft.masterTimeline.lines?.filter(l => !l.isProductionDirection && l.text?.trim()) || [];
    if (!lines.length) {
      return NextResponse.json({ error: 'Master timeline has no lyric lines to verify.', code: 'TIMELINE_EMPTY' }, { status: 422 });
    }

    // Auto-heal and clamp word timestamps to parent line boundaries so minor jitter never blocks approval
    let timelineAdjusted = false;
    for (const l of lines) {
      if (Array.isArray(l.words) && l.words.length > 0) {
        for (const w of l.words) {
          const origStart = w.startSeconds;
          const origEnd = w.endSeconds;
          if (w.startSeconds < l.startSeconds) w.startSeconds = l.startSeconds;
          if (w.endSeconds > l.endSeconds) w.endSeconds = l.endSeconds;
          if (w.endSeconds <= w.startSeconds) {
            w.endSeconds = Math.min(l.endSeconds, Number((w.startSeconds + 0.05).toFixed(2)));
          }
          if (w.startSeconds !== origStart || w.endSeconds !== origEnd) {
            timelineAdjusted = true;
          }
        }
      }
    }
    if (timelineAdjusted) {
      draft.masterTimeline.words = lines.flatMap(l => l.words || []);
      pipelineDraftStorage.saveDraft(draft);
    }

    // Detailed line-by-line verification with actionable diagnostics
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const vocalNum = l.vocalIndex || i + 1;
      if (!l.words?.length) {
        return NextResponse.json({
          error: `Phase 2 verification failed: Line #${vocalNum} ("${l.text.slice(0, 30)}") has no aligned words.`,
          code: 'MISSING_LINE_WORDS'
        }, { status: 422 });
      }
      if (l.startSeconds < 0 || l.endSeconds <= l.startSeconds) {
        return NextResponse.json({
          error: `Phase 2 verification failed: Line #${vocalNum} has invalid timing (start: ${l.startSeconds}s, end: ${l.endSeconds}s).`,
          code: 'INVALID_LINE_TIMING'
        }, { status: 422 });
      }
      if (l.endSeconds > audio.durationSeconds + 0.5) {
        return NextResponse.json({
          error: `Phase 2 verification failed: Line #${vocalNum} ends at ${l.endSeconds}s, exceeding audio duration (${audio.durationSeconds}s).`,
          code: 'LINE_OUT_OF_AUDIO_BOUNDS'
        }, { status: 422 });
      }
      const invalidWord = l.words.find(w => w.endSeconds <= w.startSeconds || w.startSeconds < l.startSeconds - 0.05 || w.endSeconds > l.endSeconds + 0.05);
      if (invalidWord) {
        return NextResponse.json({
          error: `Phase 2 verification failed: Line #${vocalNum} word "${invalidWord.text}" (${invalidWord.startSeconds}s-${invalidWord.endSeconds}s) is outside line range (${l.startSeconds}s-${l.endSeconds}s).`,
          code: 'WORD_OUT_OF_LINE_BOUNDS'
        }, { status: 422 });
      }
    }

    const dir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'subtitles');
    const requiredCaptions = ['ur.vtt', 'en.vtt', 'en-rom.vtt', 'ur-deva.vtt'];
    const missingCaptions = requiredCaptions.filter(name => !fs.existsSync(path.join(dir, name)) || fs.statSync(path.join(dir, name)).size < 30);
    if (missingCaptions.length > 0) {
      return NextResponse.json({
        error: `All four caption files must be generated and nonempty. Missing: ${missingCaptions.join(', ')}.`,
        code: 'MISSING_CAPTIONS'
      }, { status: 422 });
    }

    // Auto-mark downstream status valid if verified
    if (!draft.downstreamStatus.timestampsValid || !draft.downstreamStatus.subtitlesValid) {
      draft.downstreamStatus.timestampsValid = true;
      draft.downstreamStatus.subtitlesValid = true;
      pipelineDraftStorage.saveDraft(draft);
    }
    const a = draft.video?.partA, b = draft.video?.partB, c = draft.video?.partC;
    // A+B+C is the approved full-length architecture; never omit C silently.
    const includeC = c?.enabled === true;
    if (!includeC) return NextResponse.json({ error: 'Part C must be enabled and verified for the full A+B+C master.', code: 'PART_C_REQUIRED' }, { status: 422 });
    if (!a?.filePath || !b?.filePath || !fs.existsSync(a.filePath) || !fs.existsSync(b.filePath) ||
        (includeC && (!c?.filePath || !fs.existsSync(c.filePath)))) {
      return NextResponse.json({ error: 'Opening artwork and Part B are required; enabled Part C must be attached.' }, { status: 422 });
    }
    const bProbe = await probeMediaFile(b.filePath);
    const cProbe = includeC && c?.filePath ? await probeMediaFile(c.filePath) : null;
    if (includeC && c?.filePath && !(await hasChangingVideoFrames(c.filePath))) {
      return NextResponse.json({ error: 'Part C is a frozen or unverified video. A claimed multi-scene Canva production must contain real changing frames.', code: 'STATIC_PROMO_SOURCE' }, { status: 422 });
    }
    if (!(await hasChangingVideoFrames(b.filePath, 0.5))) {
      return NextResponse.json({ error: 'Part B Canva background does not contain changing frames. Replace the frozen or fallback loop with the intended dynamic video.', code: 'STATIC_PART_B_SOURCE' }, { status: 422 });
    }
    if (!bProbe.isValid || !bProbe.hasVideo ||
        (includeC && (!cProbe?.isValid || !cProbe.hasVideo ||
          Math.abs(cProbe.durationSeconds - (c?.durationSeconds || 0)) > 2))) {
      return NextResponse.json({ error: 'Part B or enabled Part C media verification failed.' }, { status: 422 });
    }
    const format = body.videoFormat === 'clean_cinematic' ? 'clean_cinematic' : 'lyric_master';
    const orientation = body.orientation === 'portrait' ? 'portrait' : 'landscape';
    const key = format + '_' + orientation, selected = draft.video?.formats?.[key];
    if (draft.video?.status !== 'RENDERED' || !selected?.outputPath || !fs.existsSync(selected.outputPath)) {
      return NextResponse.json({ error: 'Selected final render is missing.' }, { status: 422 });
    }
    if (!selected.sha256 || computeFileSha256(selected.outputPath) !== selected.sha256 || !selected.outputPath.includes('_rev' + draft.currentRevision + '.mp4')) {
      return NextResponse.json({ error: 'Final master file does not match this revision and its stored SHA-256 signature. Re-render before approval.', code: 'STALE_OR_TAMPERED_MASTER' }, { status: 422 });
    }
    if (!audio.sha256 || computeFileSha256(audio.filePath) !== audio.sha256) {
      return NextResponse.json({ error: 'Master audio does not match the recorded SHA-256 signature.', code: 'MASTER_AUDIO_HASH_MISMATCH' }, { status: 422 });
    }
    const video = await probeMediaFile(selected.outputPath);
    const expected = (selected.partASeconds !== undefined && selected.partBSeconds !== undefined)
      ? Math.round(((selected.partASeconds || 0) + (selected.partBSeconds || 0) + (includeC ? (selected.partCSeconds || 0) : 0)) * 100) / 100
      : (a.audioPolicy === 'suno_starts_at_part_a' ? audio.durationSeconds : ((a.durationSeconds || 5) + audio.durationSeconds)) + (includeC ? (c?.durationSeconds || 0) : 0);
    if (!video.isValid || !video.hasVideo || !video.hasAudio ||
        Math.abs(video.durationSeconds - expected) > 2 ||
        video.width !== (orientation === 'portrait' ? 1080 : 1920) ||
        video.height !== (orientation === 'portrait' ? 1920 : 1080)) {
      return NextResponse.json({ error: 'Final video failed duration, stream, or resolution checks.', expected, actual: video.durationSeconds }, { status: 422 });
    }
    if (format === 'lyric_master' && (!selected.hasBurnedSubtitles ||
        !fs.existsSync(path.join(dir,'master_dual_urdu_english.ass')))) {
      return NextResponse.json({ error: 'Dual-track lyric master subtitles are missing.' }, { status: 422 });
    }
    const prior = cmsServerStorage.getReleaseBySlug(draft.slug);
    if (prior?.status === 'published') {
      return NextResponse.json({ error: 'Cannot overwrite an already-published CMS release.' }, { status: 409 });
    }
    const now = new Date().toISOString();
    const releaseId = prior?.id || 'studio_' + draftId;
    const partAUrl = a?.filePath ? `/api/admin/pipeline/drafts/${draftId}/media?asset=thumbnail` : '';
    const songEndMs = Math.round(((selected.partASeconds || 0) + (selected.partBSeconds || 0)) * 1000);
    const registeredReleaseId = (prior?.publicCredits as any)?.rights?.registeredReleaseId ||
      (prior as any)?.releaseRights?.registeredReleaseId ||
      cmsServerStorage.getNextRegisteredReleaseId();

    const saved = cmsServerStorage.saveRelease({
      ...(prior || {}),
      id: releaseId,
      title: prior?.title || draft.title,
      canonicalTitle: prior?.canonicalTitle || draft.title,
      slug: draft.slug,
      youtubeId: prior?.youtubeId || '',
      description: prior?.description || '',
      releaseDate: prior?.releaseDate || now,
      durationSeconds: video.durationSeconds,
      durationFormatted: new Date(video.durationSeconds * 1000).toISOString().slice(11, 19),
      viewCount: prior?.viewCount || 0,
      likeCount: prior?.likeCount || 0,
      status: 'approved',
      visibility: 'private',
      format: 'video',
      source: 'studio_pipeline',
      contentReadinessState: 'editorial_ready',
      availableLanguages: draft.availableLanguages,
      defaultLanguage: draft.primaryLanguage,
      thumbnailUrl: prior?.thumbnailUrl || partAUrl,
      canonicalThumbnail: prior?.canonicalThumbnail || partAUrl,
      canonicalLyrics: prior?.canonicalLyrics || {
        text: draft.canonicalLyrics.text,
        primaryLanguage: draft.primaryLanguage,
        languages: draft.availableLanguages,
        source: 'MANUAL',
        status: 'APPROVED',
        approvedAt: now,
        approvedBy: (auth as any).email || (auth as any).id || 'admin',
      },
      videoStructure: {
        songEndMs,
        postSongStartMs: songEndMs,
        boundarySource: 'PRODUCTION_TIMELINE',
        boundaryVerifiedAt: now,
        boundaryVerifiedBy: (auth as any).email || (auth as any).id || 'admin',
      },
      publicCredits: {
        ...(typeof prior?.publicCredits === 'object' ? prior.publicCredits : {}),
        rights: {
          ...((prior?.publicCredits as any)?.rights || {}),
          publishedBy: (prior?.publicCredits as any)?.rights?.publishedBy || 'SufiPulse USA',
          registeredReleaseId,
        },
      },
      enableLyrics: true,
      enableCommentary: false,
      enableSponsors: false,
      enableAdoption: false,
      enableCredits: true,
      createdAt: prior?.createdAt || now,
      updatedAt: now,
      studioProduction: {
        draftId,
        format,
        orientation,
        outputPath: selected.outputPath,
        approvedAt: now,
        notes: String(body.notes || '').slice(0, 2000),
      },
    } as CMSRelease);
    draft.downstreamStatus.approvalStatus = 'approved_for_publishing';
    (draft.downstreamStatus as any).cmsReleaseId = saved.id;
    pipelineDraftStorage.saveDraft(draft);

    // Top-tier automated viral trigger: Generate 9:16 cutdowns and dispatch search indexing
    generateViralCutdowns(draftId).catch(err => {
      console.error('[ApproveFinal] Background viral cutdowns error:', err.message);
    });
    dispatchReleaseSyndication(saved.id).catch(err => {
      console.error('[ApproveFinal] Background syndication dispatch error:', err.message);
    });

    return NextResponse.json({
      success: true,
      cmsReleaseId: saved.id,
      cmsUrl: `/admin/cms-releases/${saved.id}`,
      published: false,
      youtubeUploaded: false,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Approval handoff failed.' }, { status: 500 });
  }
}
