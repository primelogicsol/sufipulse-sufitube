/**
 * server/services/viral-cutdown-generator.ts
 *
 * Automated 9:16 Vertical Viral Cutdown Engine.
 * Extracts high-retention 15s, 30s, and 45s clips formatted specifically for
 * Instagram Reels, YouTube Shorts, WhatsApp Status, and TikTok.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { getFfmpegPath, probeMediaFile } from '@/server/services/video-renderer';
import { logger } from '@/app/lib/logger';

export interface ViralCutdown {
  id: string;
  name: string;
  hookType: 'hook_15s' | 'chorus_30s' | 'climax_45s';
  description: string;
  startSeconds: number;
  durationSeconds: number;
  aspectRatio: '9:16';
  resolution: { width: number; height: number };
  filePath: string;
  fileSizeBytes: number;
  downloadUrl: string;
  generatedAt: string;
  publishingTitle?: string;
  publishingDescription?: string;
  relatedVideoId?: string;
  onScreenTitle?: string;
}

export interface ViralCutdownResult {
  draftId: string;
  cutdowns: ViralCutdown[];
  sourceVideoUsed: string;
  sourceOrientation: 'portrait' | 'landscape';
}

function runFfmpeg(args: string[]): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve) => {
    const ffmpegBin = getFfmpegPath();
    const proc = spawn(ffmpegBin, args);
    let stderr = '';

    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      resolve({ code: code ?? 1, stderr });
    });

    proc.on('error', (err) => {
      resolve({ code: 1, stderr: err.message });
    });
  });
}

export { type CutdownSpecTarget, getContentAwareCutdownSpecs } from '@/lib/cutdown-specs';
import { getContentAwareCutdownSpecs } from '@/lib/cutdown-specs';

/**
 * Automatically produces 3 vertical cutdown videos from the approved master video.
 */
export async function generateViralCutdowns(draftId: string): Promise<ViralCutdownResult> {
  const draft = pipelineDraftStorage.getDraft(draftId);
  if (!draft) {
    throw new Error(`Draft ${draftId} not found`);
  }

  // 1. Identify best source video
  const draftDir = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId);
  // Zero local disk footprint: render to OS temporary directory
  const outDir = path.join(os.tmpdir(), 'sufipulse-cutdowns', draftId);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const formats = draft.video?.formats || {};
  let sourcePath = '';
  let isSourcePortrait = false;

  // Prefer portrait lyric master if already rendered
  const portraitMaster = path.join(draftDir, 'video', `video_lyric_master_portrait_rev${draft.currentRevision || 1}.mp4`);
  const portraitGeneric = path.join(draftDir, 'video', 'lyric_master_portrait.mp4');
  const landscapeMaster = path.join(draftDir, 'video', `video_lyric_master_landscape_rev${draft.currentRevision || 1}.mp4`);
  const landscapeGeneric = path.join(draftDir, 'video', 'lyric_master.mp4');

  if (fs.existsSync(portraitMaster)) {
    sourcePath = portraitMaster;
    isSourcePortrait = true;
  } else if (formats['lyric_master_portrait']?.outputPath && fs.existsSync(formats['lyric_master_portrait'].outputPath)) {
    sourcePath = formats['lyric_master_portrait'].outputPath;
    isSourcePortrait = true;
  } else if (fs.existsSync(portraitGeneric)) {
    sourcePath = portraitGeneric;
    isSourcePortrait = true;
  } else if (fs.existsSync(landscapeMaster)) {
    sourcePath = landscapeMaster;
    isSourcePortrait = false;
  } else if (formats['lyric_master_landscape']?.outputPath && fs.existsSync(formats['lyric_master_landscape'].outputPath)) {
    sourcePath = formats['lyric_master_landscape'].outputPath;
    isSourcePortrait = false;
  } else if (fs.existsSync(landscapeGeneric)) {
    sourcePath = landscapeGeneric;
    isSourcePortrait = false;
  } else {
    throw new Error('No rendered master video found for this draft to create viral cutdowns.');
  }

  const probe = await probeMediaFile(sourcePath);
  const totalDuration = probe.durationSeconds || 300;

  // 2. Define Content-Aware Strategic Cut Windows
  const targets = getContentAwareCutdownSpecs(draft, totalDuration);

  const cutdowns: ViralCutdown[] = [];

  for (const t of targets) {
    const outFile = path.join(outDir, t.fileName);

    let ffmpegArgs: string[] = [];

    if (isSourcePortrait) {
      // Source is already 1080x1920 with subtitles: fast seek & stream copy or clean re-encode
      ffmpegArgs = [
        '-y',
        '-ss', String(t.start),
        '-t', String(t.duration),
        '-i', sourcePath,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '22',
        '-c:a', 'aac',
        '-b:a', '192k',
        outFile,
      ];
    } else {
      // Source is landscape 16:9: apply 9:16 vertical composite with Gaussian blurred wings
      const filterComplex = [
        `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:5[bg]`,
        `[0:v]scale=1080:-2[fg]`,
        `[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]`,
      ].join(';');

      ffmpegArgs = [
        '-y',
        '-ss', String(t.start),
        '-t', String(t.duration),
        '-i', sourcePath,
        '-filter_complex', filterComplex,
        '-map', '[outv]',
        '-map', '0:a?',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '22',
        '-c:a', 'aac',
        '-b:a', '192k',
        outFile,
      ];
    }

    logger.cms.info(`[ViralCutdown] Rendering ${t.id} from ${sourcePath} (${t.start}s to ${t.start + t.duration}s)`);
    const { code, stderr } = await runFfmpeg(ffmpegArgs);

    if (code !== 0 || !fs.existsSync(outFile)) {
      logger.cms.error(`[ViralCutdown] Failed to render ${t.id}: ${stderr}`);
      continue;
    }

    const stat = fs.statSync(outFile);
    cutdowns.push({
      id: t.id,
      name: t.name,
      hookType: t.hookType,
      description: t.description,
      startSeconds: t.start,
      durationSeconds: t.duration,
      aspectRatio: '9:16',
      resolution: { width: 1080, height: 1920 },
      filePath: outFile,
      fileSizeBytes: stat.size,
      downloadUrl: `/api/admin/pipeline/drafts/${draftId}/viral-cutdowns?asset=${t.id}`,
      generatedAt: new Date().toISOString(),
      publishingTitle: t.publishingTitle,
      publishingDescription: t.publishingDescription,
      relatedVideoId: t.relatedVideoId,
      onScreenTitle: t.onScreenTitle,
    });
  }

  // Record cutdown metadata in draft
  (draft as any).viralCutdowns = {
    generatedAt: new Date().toISOString(),
    items: cutdowns,
  };
  pipelineDraftStorage.saveDraft(draft);

  return {
    draftId,
    cutdowns,
    sourceVideoUsed: sourcePath,
    sourceOrientation: isSourcePortrait ? 'portrait' : 'landscape',
  };
}

/**
 * Automatically produces 9:16 vertical viral promotional cutdowns for catalog releases
 * using their artwork and metadata.
 */
export async function generateCatalogCutdowns(releaseId: string): Promise<ViralCutdown[]> {
  const release = cmsServerStorage.getRelease(releaseId);
  if (!release) {
    throw new Error(`Release ${releaseId} not found in catalog`);
  }

  // Zero local disk footprint: render strictly to OS temporary directory
  const outDir = path.join(os.tmpdir(), 'sufipulse-cutdowns', releaseId);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const thumbPath = path.join(outDir, 'thumb.jpg');
  if (!fs.existsSync(thumbPath)) {
    const rawUrl = release.thumbnailUrl || (release.youtubeId ? `https://i.ytimg.com/vi/${release.youtubeId}/hqdefault.jpg` : '');
    if (rawUrl) {
      if (rawUrl.startsWith('http')) {
        try {
          const res = await fetch(rawUrl);
          const buf = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(thumbPath, buf);
        } catch {}
      } else {
        const localPath = path.join(process.cwd(), 'public', rawUrl.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          fs.copyFileSync(localPath, thumbPath);
        }
      }
    }
  }

  // Extract authentic audio from YouTube if available
  const audioPath = path.join(outDir, 'audio.mp3');
  if (!fs.existsSync(audioPath) && release.youtubeId) {
    const ytdlpBin = 'C:\\Users\\Fayaz\\AppData\\Local\\Microsoft\\WinGet\\Links\\yt-dlp.exe';
    if (fs.existsSync(ytdlpBin)) {
      try {
        const ffmpegBin = getFfmpegPath();
        const proc = spawn(ytdlpBin, [
          '--ffmpeg-location', ffmpegBin,
          '-x',
          '--audio-format', 'mp3',
          '-o', audioPath,
          `https://www.youtube.com/watch?v=${release.youtubeId}`,
        ]);
        await new Promise((resolve) => {
          proc.on('close', resolve);
          proc.on('error', resolve);
        });
      } catch (err: any) {
        logger.cms.warn(`[ViralCutdowns] yt-dlp audio extraction note: ${err?.message}`);
      }
    }
  }

  const targets = [
    {
      id: 'hook_15s',
      name: '15s Opening Viral Hook',
      hookType: 'hook_15s' as const,
      start: 0,
      duration: 15,
      fileName: 'viral_cutdown_hook_15s.mp4',
    },
    {
      id: 'chorus_30s',
      name: '30s High-Energy Chorus Drop',
      hookType: 'chorus_30s' as const,
      start: 30,
      duration: 30,
      fileName: 'viral_cutdown_chorus_30s.mp4',
    },
    {
      id: 'climax_45s',
      name: '45s Philosophical Climax',
      hookType: 'climax_45s' as const,
      start: 60,
      duration: 45,
      fileName: 'viral_cutdown_climax_45s.mp4',
    },
  ];

  const results: ViralCutdown[] = [];
  const hasAudio = fs.existsSync(audioPath);

  for (const t of targets) {
    const outFile = path.join(outDir, t.fileName);

    if (!fs.existsSync(outFile) && fs.existsSync(thumbPath)) {
      const filterComplex = [
        `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[bg]`,
        `[0:v]scale=960:-2[fg]`,
        `[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]`,
      ].join(';');

      const audioArgs = hasAudio
        ? ['-ss', String(t.start), '-t', String(t.duration), '-i', audioPath]
        : ['-f', 'lavfi', '-t', String(t.duration), '-i', 'anullsrc=r=48000:cl=stereo'];

      const ffmpegArgs = [
        '-y',
        '-loop', '1',
        '-t', String(t.duration),
        '-i', thumbPath,
        ...audioArgs,
        '-filter_complex', filterComplex,
        '-map', '[outv]',
        '-map', '1:a',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        outFile,
      ];

      await runFfmpeg(ffmpegArgs);
    }

    if (fs.existsSync(outFile)) {
      const stat = fs.statSync(outFile);
      results.push({
        id: t.id,
        name: t.name,
        hookType: t.hookType,
        description: `${t.duration}s 9:16 vertical promotional reel generated for this catalog release.`,
        startSeconds: 0,
        durationSeconds: t.duration,
        aspectRatio: '9:16',
        resolution: { width: 1080, height: 1920 },
        filePath: outFile,
        fileSizeBytes: stat.size,
        downloadUrl: `/api/admin/pipeline/drafts/${releaseId}/viral-cutdowns?asset=${t.id}`,
        generatedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}
