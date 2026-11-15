/**
 * server/services/youtube-shorts-uploader.ts
 *
 * Ephemeral YouTube Shorts Generation and Direct Channel Syndication Engine.
 * 
 * Invariants:
 *  1. Zero Permanent Local Disk Footprint: All intermediate cutdowns, thumbnails,
 *     and extracted audio are written strictly to os.tmpdir() and deleted immediately
 *     after upload in a guaranteed finally block.
 *  2. Direct YouTube Shorts Indexing: Renders vertical 9:16 (1080x1920) with #Shorts
 *     and high-retention audio hooks directly to the official SufiPulse YouTube channel.
 *  3. Canonical Title Governance: Preserves canonical identity and embeds bidirectional
 *     links back to the master YouTube video and SufiPulse.com release page.
 */

import { google } from 'googleapis';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { getValidYTAnalyticsAccessToken, normalizeYTAnalyticsCredential } from '@/app/lib/server/youtube-analytics-oauth-store';
import { getFfmpegPath } from '@/server/services/video-renderer';
import { logger } from '@/app/lib/logger';

export type ShortAssetId = 'hook_15s' | 'chorus_30s' | 'climax_45s';

export interface ShortHookConfig {
  id: ShortAssetId;
  name: string;
  shortLabel: string;
  start: number;
  duration: number;
}

export const SHORT_HOOKS: Record<ShortAssetId, ShortHookConfig> = {
  hook_15s: {
    id: 'hook_15s',
    name: '15s Opening Viral Hook',
    shortLabel: '15s Viral Hook',
    start: 0,
    duration: 15,
  },
  chorus_30s: {
    id: 'chorus_30s',
    name: '30s High-Energy Chorus Drop',
    shortLabel: 'Chorus Drop',
    start: 30,
    duration: 30,
  },
  climax_45s: {
    id: 'climax_45s',
    name: '45s Philosophical Climax',
    shortLabel: 'Climax',
    start: 60,
    duration: 45,
  },
};

export interface UploadShortOptions {
  targetId: string; // CMS release ID or Pipeline Draft ID
  assetId: ShortAssetId;
  privacyStatus?: 'public' | 'unlisted' | 'private';
  customTitle?: string;
}

export interface UploadShortResult {
  success: boolean;
  targetId: string;
  assetId: ShortAssetId;
  shortId: string;
  shortUrl: string;
  title: string;
  uploadedAt: string;
  privacyStatus: string;
  durationSeconds: number;
}

function runCommand(bin: string, args: string[]): Promise<{ code: number; stderr: string; stdout: string }> {
  return new Promise((resolve) => {
    const proc = spawn(bin, args);
    let stderr = '';
    let stdout = '';

    proc.stdout?.on('data', (d) => {
      stdout += d.toString();
    });

    proc.stderr?.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      resolve({ code: code ?? 1, stderr, stdout });
    });

    proc.on('error', (err) => {
      resolve({ code: 1, stderr: err.message, stdout });
    });
  });
}

function getYtDlpPath(): string {
  const defaultWinget = 'C:\\Users\\Fayaz\\AppData\\Local\\Microsoft\\WinGet\\Links\\yt-dlp.exe';
  if (fs.existsSync(defaultWinget)) return defaultWinget;
  return 'yt-dlp';
}

/**
 * Uploads a vertical 9:16 cutdown as an official YouTube Short,
 * creating and deleting ephemeral files entirely in memory/os.tmpdir().
 */
export async function uploadShortToYouTube(options: UploadShortOptions): Promise<UploadShortResult> {
  const { targetId, assetId, privacyStatus = 'public', customTitle } = options;

  const hookConfig = SHORT_HOOKS[assetId];
  if (!hookConfig) {
    throw new Error(`Invalid asset ID: ${assetId}. Must be hook_15s, chorus_30s, or climax_45s.`);
  }

  // 1. Resolve Target (Pipeline Draft or CMS Catalog Release)
  const draft = pipelineDraftStorage.getDraft(targetId);
  const release = !draft ? cmsServerStorage.getRelease(targetId) : null;

  if (!draft && !release) {
    throw new Error(`Target ${targetId} not found in pipeline drafts or catalog releases.`);
  }

  const title = draft ? draft.title : (release?.title || 'Sacred Kalam');
  const slug = draft ? draft.slug : (release?.slug || targetId);
  const masterYoutubeId = draft ? ((draft as any).downstreamStatus?.publishedYoutubeId || '') : (release?.youtubeId || '');

  // 2. Prepare Ephemeral Temp Workspace in os.tmpdir()
  const ephemeralPrefix = path.join(os.tmpdir(), `sufipulse-short-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`);
  fs.mkdirSync(ephemeralPrefix, { recursive: true });

  const tempThumb = path.join(ephemeralPrefix, 'thumb.jpg');
  const tempAudio = path.join(ephemeralPrefix, 'audio.mp3');
  const tempVideo = path.join(ephemeralPrefix, `short_${assetId}.mp4`);

  try {
    // 3. Prepare Artwork / Thumbnail
    let hasThumb = false;
    const rawThumbUrl = draft
      ? ((draft as any).artwork?.selectedPath || (draft as any).artwork?.generatedVariants?.[0])
      : (release?.thumbnailUrl || (masterYoutubeId ? `https://i.ytimg.com/vi/${masterYoutubeId}/maxresdefault.jpg` : ''));

    if (rawThumbUrl) {
      if (rawThumbUrl.startsWith('http')) {
        try {
          const res = await fetch(rawThumbUrl);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(tempThumb, buf);
            hasThumb = true;
          }
        } catch {}
      } else {
        const localPath = path.isAbsolute(rawThumbUrl)
          ? rawThumbUrl
          : path.join(process.cwd(), 'public', rawThumbUrl.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          fs.copyFileSync(localPath, tempThumb);
          hasThumb = true;
        }
      }
    }

    // Fallback thumbnail from YouTube hqdefault if maxresdefault failed
    if (!hasThumb && masterYoutubeId) {
      try {
        const res = await fetch(`https://i.ytimg.com/vi/${masterYoutubeId}/hqdefault.jpg`);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(tempThumb, buf);
          hasThumb = true;
        }
      } catch {}
    }

    if (!hasThumb) {
      // Create minimal fallback image via ffmpeg if no artwork found
      const ffmpegBin = getFfmpegPath();
      await runCommand(ffmpegBin, [
        '-y',
        '-f', 'lavfi',
        '-i', 'color=c=#0f172a:s=1080x1920:d=1',
        '-frames:v', '1',
        tempThumb,
      ]);
      hasThumb = true;
    }

    // 4. Prepare Audio Hook
    let hasAudio = false;

    // A: Check if local audio file exists for draft
    const draftAudioPath = draft?.masterAudio?.filePath || (draft?.masterAudio as any)?.outputPath;
    if (draftAudioPath && fs.existsSync(draftAudioPath)) {
      fs.copyFileSync(draftAudioPath, tempAudio);
      hasAudio = true;
    }

    // B: Extract authentic YouTube master audio using yt-dlp
    if (!hasAudio && masterYoutubeId) {
      const ytdlpBin = getYtDlpPath();
      const ffmpegBin = getFfmpegPath();

      const ytRes = await runCommand(ytdlpBin, [
        '--ffmpeg-location', ffmpegBin,
        '-x',
        '--audio-format', 'mp3',
        '-o', tempAudio,
        `https://www.youtube.com/watch?v=${masterYoutubeId}`,
      ]);

      if (fs.existsSync(tempAudio)) {
        hasAudio = true;
      } else {
        logger.cms.warn(`[YouTubeShorts] yt-dlp audio note: ${ytRes.stderr}`);
      }
    }

    // 5. Render Vertical 9:16 Video (1080x1920) Ephemerally
    const ffmpegBin = getFfmpegPath();
    const filterComplex = [
      `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[bg]`,
      `[0:v]scale=960:-2[fg]`,
      `[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]`,
    ].join(';');

    const audioArgs = hasAudio
      ? ['-ss', String(hookConfig.start), '-t', String(hookConfig.duration), '-i', tempAudio]
      : ['-f', 'lavfi', '-t', String(hookConfig.duration), '-i', 'anullsrc=r=48000:cl=stereo'];

    const renderArgs = [
      '-y',
      '-loop', '1',
      '-t', String(hookConfig.duration),
      '-i', tempThumb,
      ...audioArgs,
      '-filter_complex', filterComplex,
      '-map', '[outv]',
      '-map', '1:a',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      tempVideo,
    ];

    const renderResult = await runCommand(ffmpegBin, renderArgs);
    if (renderResult.code !== 0 || !fs.existsSync(tempVideo)) {
      throw new Error(`FFmpeg rendering failed: ${renderResult.stderr}`);
    }

    // 6. Build YouTube Short Title and Description
    // YouTube title limit is 100 characters. Keep it crisp with #Shorts.
    const titleBase = customTitle || `${title} | ${hookConfig.shortLabel}`;
    const shortTitle = `${titleBase.slice(0, 91).trim()} #Shorts`;

    const description = [
      `Watch the full master film on YouTube:`,
      masterYoutubeId ? `https://www.youtube.com/watch?v=${masterYoutubeId}` : `https://www.sufipulse.com/release-detail/${slug}`,
      ``,
      `Listen to full audio, explore Nastaliq lyrics & translations on SufiPulse:`,
      `https://www.sufipulse.com/release-detail/${slug}`,
      ``,
      `Official YouTube Short from SufiPulse USA.`,
      `#Shorts #SufiPulse #Kashmir #SufiMusic #Kalam #Spiritual`,
    ].join('\n');

    // 7. Authenticate with YouTube Data API v3
    const accessToken = await getValidYTAnalyticsAccessToken();
    if (!accessToken) {
      throw new Error('Valid YouTube OAuth access token unavailable. Check YouTube credentials.');
    }

    const clientId = normalizeYTAnalyticsCredential(process.env.YOUTUBE_CLIENT_ID, 'YOUTUBE_CLIENT_ID');
    const clientSecret = normalizeYTAnalyticsCredential(process.env.YOUTUBE_CLIENT_SECRET, 'YOUTUBE_CLIENT_SECRET');
    const refreshToken = normalizeYTAnalyticsCredential(process.env.YOUTUBE_REFRESH_TOKEN, 'YOUTUBE_REFRESH_TOKEN');

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // 8. Upload Directly to YouTube
    logger.cms.info(`[YouTubeShorts] Uploading ${assetId} for "${title}" to YouTube...`);

    const uploadRes = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: shortTitle,
          description,
          tags: ['Shorts', 'SufiPulse', 'Kashmir', 'SufiMusic', 'Kalam', 'Spiritual', title.slice(0, 30)],
          categoryId: '10', // Music
          defaultLanguage: 'en',
        },
        status: {
          privacyStatus,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(tempVideo),
      },
    });

    const shortId = uploadRes.data.id;
    if (!shortId) {
      throw new Error('YouTube API succeeded but returned no video ID.');
    }

    const shortUrl = `https://www.youtube.com/shorts/${shortId}`;
    const uploadedAt = new Date().toISOString();

    logger.cms.info(`[YouTubeShorts] Successfully uploaded Short: ${shortUrl}`);

    // 9. Persist Shorts Reference in Release or Draft Metadata
    const shortMeta = {
      id: shortId,
      url: shortUrl,
      title: shortTitle,
      uploadedAt,
      privacyStatus,
    };

    if (release) {
      const existingShorts = release.youtubeShorts || {};
      existingShorts[assetId] = shortMeta;
      release.youtubeShorts = existingShorts;
      cmsServerStorage.saveRelease(release);
    } else if (draft) {
      const existingShorts = (draft as any).youtubeShorts || {};
      existingShorts[assetId] = shortMeta;
      (draft as any).youtubeShorts = existingShorts;
      pipelineDraftStorage.saveDraft(draft);
    }

    return {
      success: true,
      targetId,
      assetId,
      shortId,
      shortUrl,
      title: shortTitle,
      uploadedAt,
      privacyStatus,
      durationSeconds: hookConfig.duration,
    };
  } finally {
    // 10. GUARANTEE: Remove all ephemeral files and folders immediately from disk!
    try {
      if (fs.existsSync(ephemeralPrefix)) {
        fs.rmSync(ephemeralPrefix, { recursive: true, force: true });
        logger.cms.info(`[YouTubeShorts] Zero-disk cleanup complete for ephemeral folder: ${ephemeralPrefix}`);
      }
    } catch (cleanupErr: any) {
      logger.cms.warn(`[YouTubeShorts] Ephemeral cleanup note: ${cleanupErr?.message}`);
    }
  }
}

/**
 * Uploads all 3 vertical hooks (15s, 30s, 45s) in sequence as YouTube Shorts.
 */
export async function uploadAllShortsToYouTube(
  targetId: string,
  privacyStatus: 'public' | 'unlisted' | 'private' = 'public'
): Promise<UploadShortResult[]> {
  const assets: ShortAssetId[] = ['hook_15s', 'chorus_30s', 'climax_45s'];
  const results: UploadShortResult[] = [];

  for (const assetId of assets) {
    const res = await uploadShortToYouTube({
      targetId,
      assetId,
      privacyStatus,
    });
    results.push(res);
  }

  return results;
}
