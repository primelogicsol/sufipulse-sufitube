/**
 * server/services/video-renderer.ts
 *
 * Authoritative 1080p / 4K Two-Part Video Master Renderer.
 * Supports:
 * - Part A: Lyric Master (burned Nastaliq & Sufi English subtitles) or Clean Cinematic
 * - Part B: Canva Promotional Video integration (Canva design DAHa7eJOcbI / Part 2)
 * - Landscape (16:9 1920x1080) and Portrait (9:16 1080x1920) outputs
 * - Robust FFmpeg filter-complex multi-stream concatenation with automatic aspect-ratio scaling
 * - Resilient silence generation for silent Canva videos and crossfade audio mixing
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export function isFfmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn(getFfmpegPath(), ['-version']);
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
}
export interface MediaProbeResult {
  isValid: boolean;
  filePath: string;
  sizeBytes: number;
  formatName?: string;
  durationSeconds: number;
  hasVideo: boolean;
  hasAudio: boolean;
  width?: number;
  height?: number;
  aspectRatio?: string;
  orientation?: 'landscape' | 'portrait' | 'square';
  videoCodec?: string;
  audioCodec?: string;
  fps?: number;
  sampleRate?: number;
  channels?: number;
  error?: string;
}

export function getFfprobePath(): string {
  if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) {
    return process.env.FFPROBE_PATH;
  }
  const wingetLink = 'C:\\Users\\Fayaz\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffprobe.exe';
  if (fs.existsSync(wingetLink)) return wingetLink;
  const wingetFfprobe = 'C:\\Users\\Fayaz\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffprobe.exe';
  if (fs.existsSync(wingetFfprobe)) return wingetFfprobe;
  const shotcutFfprobe = 'C:\\Program Files\\Shotcut\\ffprobe.exe';
  if (fs.existsSync(shotcutFfprobe)) return shotcutFfprobe;
  return 'ffprobe';
}

export function probeMediaFile(filePath: string): Promise<MediaProbeResult> {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) {
      return resolve({
        isValid: false,
        filePath,
        sizeBytes: 0,
        durationSeconds: 0,
        hasVideo: false,
        hasAudio: false,
        error: `File does not exist on disk: ${filePath}`,
      });
    }

    let stat: fs.Stats;
    try {
      stat = fs.statSync(filePath);
    } catch (statErr: any) {
      return resolve({
        isValid: false,
        filePath,
        sizeBytes: 0,
        durationSeconds: 0,
        hasVideo: false,
        hasAudio: false,
        error: `Cannot read file stat: ${statErr.message}`,
      });
    }

    if (stat.size === 0) {
      return resolve({
        isValid: false,
        filePath,
        sizeBytes: 0,
        durationSeconds: 0,
        hasVideo: false,
        hasAudio: false,
        error: 'File is empty (0 bytes)',
      });
    }

    const ffprobeBin = getFfprobePath();
    const proc = spawn(ffprobeBin, [
      '-v', 'error',
      '-show_entries', 'format=duration,size,format_name,bit_rate',
      '-show_streams',
      '-of', 'json',
      filePath,
    ]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('error', (err) => {
      resolve({
        isValid: false,
        filePath,
        sizeBytes: stat.size,
        durationSeconds: 0,
        hasVideo: false,
        hasAudio: false,
        error: `Failed to spawn ffprobe (${ffprobeBin}): ${err.message}`,
      });
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        return resolve({
          isValid: false,
          filePath,
          sizeBytes: stat.size,
          durationSeconds: 0,
          hasVideo: false,
          hasAudio: false,
          error: `FFprobe exited with code ${code}. Stderr: ${stderr.slice(-300)}`,
        });
      }

      try {
        const data = JSON.parse(stdout);
        const streams = Array.isArray(data.streams) ? data.streams : [];
        const vStream = streams.find((s: any) => s.codec_type === 'video');
        const aStream = streams.find((s: any) => s.codec_type === 'audio');

        const formatDuration = parseFloat(data.format?.duration || '0');
        const vDuration = parseFloat(vStream?.duration || '0');
        const aDuration = parseFloat(aStream?.duration || '0');
        const rawDuration = formatDuration || vDuration || aDuration || 0;
        const durationSeconds = Math.round(rawDuration * 100) / 100;

        if (durationSeconds <= 0) {
          return resolve({
            isValid: false,
            filePath,
            sizeBytes: stat.size,
            durationSeconds: 0,
            hasVideo: !!vStream,
            hasAudio: !!aStream,
            error: 'No valid media duration detected (0.0s)',
          });
        }

        let width = vStream ? parseInt(vStream.width, 10) : undefined;
        let height = vStream ? parseInt(vStream.height, 10) : undefined;
        let orientation: 'landscape' | 'portrait' | 'square' | undefined = undefined;
        let aspectRatio: string | undefined = undefined;

        if (width && height) {
          if (width > height) orientation = 'landscape';
          else if (height > width) orientation = 'portrait';
          else orientation = 'square';
          aspectRatio = vStream.display_aspect_ratio || `${width}:${height}`;
        }

        let fps: number | undefined = undefined;
        if (vStream?.r_frame_rate) {
          const [num, den] = vStream.r_frame_rate.split('/').map(Number);
          if (num && den) fps = Math.round((num / den) * 100) / 100;
        }

        resolve({
          isValid: true,
          filePath,
          sizeBytes: stat.size,
          formatName: data.format?.format_name,
          durationSeconds,
          hasVideo: !!vStream,
          hasAudio: !!aStream,
          width,
          height,
          aspectRatio,
          orientation,
          videoCodec: vStream?.codec_name,
          audioCodec: aStream?.codec_name,
          fps,
          sampleRate: aStream?.sample_rate ? parseInt(aStream.sample_rate, 10) : undefined,
          channels: aStream?.channels ? parseInt(aStream.channels, 10) : undefined,
        });
      } catch (parseErr: any) {
        resolve({
          isValid: false,
          filePath,
          sizeBytes: stat.size,
          durationSeconds: 0,
          hasVideo: false,
          hasAudio: false,
          error: `Failed to parse ffprobe output: ${parseErr.message}`,
        });
      }
    });
  });
}

export interface VideoRenderOptions {
  draftId: string;
  outputPath: string;
  format: 'lyric_master' | 'clean_cinematic';
  orientation?: 'landscape' | 'portrait';
  durationSeconds?: number;
  // Part A: Thumbnail Introduction (New)
  partA?: {
    enabled?: boolean;
    durationSeconds?: number; // e.g. 5.0s
    imagePath?: string;
    audioPolicy?: 'silence' | 'ambient' | 'suno_starts_at_part_b' | 'suno_starts_at_part_a';
    playbackMode?: 'seamless_loop' | 'freeze_last_frame' | 'stretch' | 'custom_range';
    loopStartSeconds?: number;
    loopEndSeconds?: number;
    sourceDurationSeconds?: number;
  };
  // Part B: Main Suno Song (Former Part A)
  partB?: {
    enabled?: boolean;
    videoPath?: string; // Canva DAHa7St5CYs
    audioPath?: string; // Suno master WAV
    durationSeconds?: number; // e.g. 285.16s
    playbackMode?: 'seamless_loop' | 'freeze_last_frame' | 'stretch' | 'custom_range';
    loopStartSeconds?: number;
    loopEndSeconds?: number;
    sourceDurationSeconds?: number;
    subtitlesPath?: string;
    filePath?: string;
    hasAudio?: boolean;
    audioMode?: 'preserve_canva_audio' | 'crossfade' | 'mute';
    trimStartSeconds?: number;
    trimEndSeconds?: number;
  };
  // Part C: Canva Promotional Video (Former Part B)
  partC?: {
    enabled?: boolean;
    videoPath?: string; // Canva DAHa7eJOcbI (19 scenes, 608s)
    filePath?: string;
    durationSeconds?: number;
    hasAudio?: boolean;
    audioMode?: 'preserve_canva_audio' | 'crossfade' | 'mute';
    playbackMode?: 'full_19_scenes' | 'trimmed';
    trimStartSeconds?: number;
    trimEndSeconds?: number;
  };
  // Legacy backward-compatibility options
  audioPath?: string;
  artworkPath?: string;
  subtitlesPath?: string;
}

export interface VideoRenderResult {
  outputPath: string;
  format: 'lyric_master' | 'clean_cinematic';
  orientation: 'landscape' | 'portrait';
  durationSeconds: number;
  partASeconds?: number; // Thumbnail duration (e.g. 5.0s)
  partBSeconds?: number; // Song duration (e.g. 285.16s)
  partCSeconds?: number; // Promo duration (e.g. 608.0s)
  width: number;
  height: number;
  sha256: string;
  engineUsed: 'ffmpeg' | 'native_mp4_synth';
  hasBurnedSubtitles: boolean;
}

export function getFfmpegPath(): string {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  const wingetLink = 'C:\\Users\\Fayaz\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';
  if (fs.existsSync(wingetLink)) return wingetLink;
  const wingetFfmpeg = 'C:\\Users\\Fayaz\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
  if (fs.existsSync(wingetFfmpeg)) return wingetFfmpeg;
  const shotcutFfmpeg = 'C:\\Program Files\\Shotcut\\ffmpeg.exe';
  if (fs.existsSync(shotcutFfmpeg)) return shotcutFfmpeg;
  return 'ffmpeg';
}

/**
 * Creates a synthetic standard MP4 container file for testing environments
 * where FFmpeg is not installed on the host OS.
 */
function createSyntheticMp4(
  outputPath: string,
  durationSeconds: number,
  format: 'lyric_master' | 'clean_cinematic',
  orientation: 'landscape' | 'portrait' = 'landscape'
): VideoRenderResult {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const ftyp = Buffer.from([
    0x00, 0x00, 0x00, 0x20,
    0x66, 0x74, 0x79, 0x70,
    0x69, 0x73, 0x6f, 0x6d,
    0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6f, 0x6d,
    0x69, 0x73, 0x6f, 0x32,
    0x61, 0x76, 0x63, 0x31,
    0x6d, 0x70, 0x34, 0x31,
  ]);

  const payload = Buffer.alloc(1024 * 64, 0xee);
  const mdatHeader = Buffer.alloc(8);
  mdatHeader.writeUInt32BE(payload.length + 8, 0);
  mdatHeader.write('mdat', 4);

  const moov = Buffer.from([
    0x00, 0x00, 0x00, 0x20,
    0x6d, 0x6f, 0x6f, 0x76,
    0x00, 0x00, 0x00, 0x18,
    0x6d, 0x76, 0x68, 0x64,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x03, 0xe8,
  ]);

  const complete = Buffer.concat([ftyp, mdatHeader, payload, moov]);
  fs.writeFileSync(outputPath, complete);

  const sha256 = crypto.createHash('sha256').update(complete).digest('hex');
  const width = orientation === 'portrait' ? 1080 : 1920;
  const height = orientation === 'portrait' ? 1920 : 1080;

  return {
    outputPath,
    format,
    orientation,
    durationSeconds,
    partASeconds: durationSeconds,
    width,
    height,
    sha256,
    engineUsed: 'native_mp4_synth',
    hasBurnedSubtitles: format === 'lyric_master',
  };
}

export async function render1080pMusicVideo(
  options: VideoRenderOptions
): Promise<VideoRenderResult> {
  const hasFfmpeg = await isFfmpegAvailable();
  const orientation = options.orientation || 'landscape';
  const targetWidth = orientation === 'portrait' ? 1080 : 1920;
  const targetHeight = orientation === 'portrait' ? 1920 : 1080;

  if (hasFfmpeg) {
    try {
      fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });

      // Resolve Part A: Thumbnail Introduction (Default: 5.0s)
      const hasPartA = options.partA?.enabled !== false;
      const partADuration = hasPartA ? (options.partA?.durationSeconds ?? 5.0) : 0;
      let thumbnailPath = options.partA?.imagePath;
      if (!thumbnailPath || !fs.existsSync(thumbnailPath)) {
        if (options.artworkPath && !options.artworkPath.toLowerCase().endsWith('.mp4') && fs.existsSync(options.artworkPath)) {
          thumbnailPath = options.artworkPath;
        } else {
          thumbnailPath = path.join(process.cwd(), 'public', 'banner1.png');
        }
      }

      // Resolve Part B: Main Suno Song (Strict Authoritative Media Resolution - Zero Silent Fallbacks)
      const resolvedPartBVisual =
        options.partB?.videoPath ||
        (options.artworkPath?.toLowerCase().endsWith('.mp4') ? options.artworkPath : null) ||
        options.partB?.filePath;

      if (!resolvedPartBVisual || !fs.existsSync(resolvedPartBVisual)) {
        throw new Error('SOURCE VIDEO UNAVAILABLE: RECONNECT OR REPLACE PART B BACKGROUND');
      }
      const songVisualPath = resolvedPartBVisual;
      const songAudioPath = options.partB?.audioPath || options.audioPath;
      if (!songAudioPath || !fs.existsSync(songAudioPath)) {
        throw new Error('AUTHORITATIVE SUNO AUDIO MISSING: refusing to render a silent replacement track.');
      }
      const songDuration = options.partB?.durationSeconds || options.durationSeconds || 285.16;
      const songSubtitlesPath = options.partB?.subtitlesPath || (options.format === 'lyric_master' ? options.subtitlesPath : undefined);
      const songPlaybackMode = options.partB?.playbackMode || options.partA?.playbackMode || 'seamless_loop';
      const songSourceDuration = options.partB?.sourceDurationSeconds || options.partA?.sourceDurationSeconds || 4.0;

      // Resolve Part C: Canva Promotional Video
      let hasPartC = false;
      let promoVideoPath = '';
      let promoDuration = 0;
      let promoHasAudio = false;

      const candidatePromoPath =
        options.partC?.videoPath ||
        options.partC?.filePath ||
        (options.partB?.filePath?.includes('canva_part_b') ? options.partB.filePath : null);

      if (options.partC?.enabled !== false && (!candidatePromoPath || !fs.existsSync(candidatePromoPath))) {
        throw new Error('PART C MISSING: enabled promotional video has no valid source file.');
      }
      if (options.partC?.enabled !== false && candidatePromoPath && fs.existsSync(candidatePromoPath)) {
        promoVideoPath = candidatePromoPath;
        const probeC = await probeMediaFile(promoVideoPath);
        if (!probeC.isValid || !probeC.hasVideo || probeC.durationSeconds <= 0) {
          throw new Error('PART C INVALID: promotional file must decode as a real video with positive duration.');
        }
        hasPartC = true;
        promoDuration = probeC.durationSeconds;
        promoHasAudio = probeC.hasAudio;
      }

      const ffmpegArgs: string[] = [];
      const filterParts: string[] = [];
      let inputIdx = 0;

      let vSegmentRefs: string[] = [];
      let aSegmentRefs: string[] = [];

      // The master song begins at t=0 over Part A. Part B continues from the Part A cutoff.
      const songStartsAtPartA = options.partA?.audioPolicy === 'suno_starts_at_part_a';
      const songStartOffset = songStartsAtPartA && hasPartA
        ? Math.min(partADuration, Math.max(0, songDuration - 0.1))
        : 0;
      const songPartBDuration = Math.max(0.1, songDuration - songStartOffset);
      ffmpegArgs.push('-i', songAudioPath);
      const songAudioInputIdx = inputIdx++;

      // Prepare one authoritative caption file for both Part A and Part B.
      let burnedSubtitlePath: string | undefined;
      let escapedBurnedSubtitlePath: string | undefined;
      let escapedFontsDir: string | undefined;
      if (options.format === 'lyric_master') {
        if (!songSubtitlesPath || !fs.existsSync(songSubtitlesPath)) {
          throw new Error('LYRIC SUBTITLES MISSING: refusing to label an uncaptioned render a Lyric Master.');
        }
        let sourceAssPath = songSubtitlesPath;
        if (orientation === 'portrait') {
          const portraitCandidate = songSubtitlesPath.replace(/\.ass$/, '_portrait.ass');
          if (fs.existsSync(portraitCandidate)) sourceAssPath = portraitCandidate;
        }
        const rawAss = fs.readFileSync(sourceAssPath, 'utf8');
        const cleanAss = rawAss.replace(/\{\\k\d+\}/g, '');
        burnedSubtitlePath = sourceAssPath.replace(/(_burned)?\.ass$/, '_burned.ass');
        fs.writeFileSync(burnedSubtitlePath, cleanAss, 'utf8');
        escapedBurnedSubtitlePath = burnedSubtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:');
        escapedFontsDir = path.join(process.cwd(), 'public', 'fonts').replace(/\\/g, '/').replace(/:/g, '\\:');
      }

      // 1. SEGMENT 0: Part A - Thumbnail Introduction
      if (hasPartA && partADuration > 0) {
        ffmpegArgs.push('-loop', '1', '-t', String(partADuration), '-i', thumbnailPath);
        const partAInputIdx = inputIdx++;
        let partAFilter = `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30`;
        if (songStartsAtPartA && options.format === 'lyric_master' && escapedBurnedSubtitlePath && escapedFontsDir) {
          partAFilter += `,subtitles='${escapedBurnedSubtitlePath}':fontsdir='${escapedFontsDir}'`;
        }
        filterParts.push(`[${partAInputIdx}:v]${partAFilter}[v_part_a]`);
        if (songStartsAtPartA) {
          filterParts.push(`[${songAudioInputIdx}:a]atrim=start=0:end=${songStartOffset},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo[a_part_a]`);
        } else {
          filterParts.push(`aevalsrc=0:d=${partADuration}:s=48000:c=stereo[a_part_a]`);
        }
        vSegmentRefs.push('[v_part_a]');
        aSegmentRefs.push('[a_part_a]');
      }

      // 2. SEGMENT 1: Part B - Main Suno Song
      const isSongVideoVisual =
        songVisualPath.toLowerCase().endsWith('.mp4') ||
        songVisualPath.toLowerCase().endsWith('.mov') ||
        songVisualPath.toLowerCase().endsWith('.webm');

      let songBaseFilter = `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight},setsar=1`;

      if (isSongVideoVisual) {
        if (songPlaybackMode === 'freeze_last_frame') {
          ffmpegArgs.push('-i', songVisualPath);
          const holdDuration = Math.max(0, songPartBDuration - songSourceDuration);
          songBaseFilter += `,tpad=stop_mode=clone:stop_duration=${holdDuration.toFixed(2)},trim=duration=${songPartBDuration},fps=30`;
        } else if (songPlaybackMode === 'stretch') {
          ffmpegArgs.push('-i', songVisualPath);
          const stretchRatio = (songPartBDuration / Math.max(songSourceDuration, 0.1)).toFixed(4);
          songBaseFilter += `,setpts=${stretchRatio}*PTS,fps=30,trim=duration=${songPartBDuration}`;
        } else {
          // Seamless loop (Default)
          ffmpegArgs.push('-stream_loop', '-1', '-t', String(songPartBDuration), '-i', songVisualPath);
          songBaseFilter += `,fps=30`;
        }
      } else {
        ffmpegArgs.push('-loop', '1', '-t', String(songPartBDuration), '-i', songVisualPath);
        songBaseFilter += `,fps=30`;
      }
      const songVisualInputIdx = inputIdx++;

      // Burn the same global lyric timeline onto Part B, but advance its frame clock
      // by the Part A duration so captions continue rather than restart at t=0.
      if (options.format === 'lyric_master' && escapedBurnedSubtitlePath && escapedFontsDir) {
        songBaseFilter += `,setpts=PTS+${songStartOffset}/TB,subtitles='${escapedBurnedSubtitlePath}':fontsdir='${escapedFontsDir}',setpts=PTS-STARTPTS`;
      }

      filterParts.push(`[${songVisualInputIdx}:v]${songBaseFilter}[v_part_b]`);
      vSegmentRefs.push('[v_part_b]');

      // Continue the Suno master from the exact Part A cutoff.
      filterParts.push(`[${songAudioInputIdx}:a]atrim=start=${songStartOffset}:end=${songDuration},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo[a_part_b]`);
      aSegmentRefs.push('[a_part_b]');

      // 3. SEGMENT 2: Part C - Canva Promotional Video
      if (hasPartC && promoDuration > 0) {
        ffmpegArgs.push('-i', promoVideoPath);
        const promoInputIdx = inputIdx++;
        filterParts.push(
          `[${promoInputIdx}:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v_part_c]`
        );
        vSegmentRefs.push('[v_part_c]');

        if (promoHasAudio) {
          filterParts.push(`[${promoInputIdx}:a]aformat=sample_rates=48000:channel_layouts=stereo[a_part_c]`);
        } else {
          filterParts.push(`aevalsrc=0:d=${promoDuration}:s=48000:c=stereo[a_part_c]`);
        }
        aSegmentRefs.push('[a_part_c]');
      }

      // 4. Sequential Concatenation: Part A + Part B (+ Part C)
      const concatCount = vSegmentRefs.length;
      let concatPairs = '';
      for (let i = 0; i < concatCount; i++) {
        concatPairs += `${vSegmentRefs[i]}${aSegmentRefs[i]}`;
      }
      filterParts.push(`${concatPairs}concat=n=${concatCount}:v=1:a=1[v][a]`);

      ffmpegArgs.push(
        '-filter_complex', filterParts.join(';'),
        '-map', '[v]',
        '-map', '[a]'
      );

      // Output encoding: standard H.264 High Profile / AAC 48kHz stereo, faststart
      ffmpegArgs.push(
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '19',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '320k',
        '-ar', '48000',
        '-movflags', '+faststart',
        '-y',
        options.outputPath
      );

      const totalDuration = Math.round((partADuration + songPartBDuration + (hasPartC ? promoDuration : 0)) * 100) / 100;
      console.log(
        `[VideoRenderer] Executing Three-Part FFmpeg render: format=${options.format} orientation=${orientation} totalDuration=${totalDuration}s (Part A: ${partADuration}s + Part B: ${songPartBDuration}s + Part C: ${hasPartC ? promoDuration : 0}s; policy=${songStartsAtPartA ? 'song_starts_part_a' : 'silent_part_a'})`
      );

      await new Promise<void>((resolve, reject) => {
        const proc = spawn(getFfmpegPath(), ffmpegArgs);
        let stderr = '';
        proc.stderr.on('data', (d) => { stderr += d.toString(); });
        proc.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`FFmpeg video render exited with code ${code}. Stderr: ${stderr.slice(-600)}`));
        });
        proc.on('error', reject);
      });

      const buffer = fs.readFileSync(options.outputPath);
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

      return {
        outputPath: options.outputPath,
        format: options.format,
        orientation,
        durationSeconds: totalDuration,
        partASeconds: partADuration,
        partBSeconds: songPartBDuration,
        partCSeconds: hasPartC ? promoDuration : undefined,
        width: targetWidth,
        height: targetHeight,
        sha256,
        engineUsed: 'ffmpeg',
        hasBurnedSubtitles: options.format === 'lyric_master',
      };
    } catch (err: any) {
      // A fabricated video must never be presented as a successful music-video render.
      // Preserve the real FFmpeg failure for correction and retry.
      throw new Error(`Three-part video render failed: ${err.message}`);
    }
  }

  throw new Error('FFmpeg is unavailable. Cannot render a genuine three-part video.');
}
