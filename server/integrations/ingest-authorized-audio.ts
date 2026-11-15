import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { spawn } from 'node:child_process';
import { fetchConfiguredPrivateAudioStream } from '@/server/integrations/private-audio-stream';
import { getFfmpegPath } from '@/server/services/video-renderer';
import { probeAudioFile } from '@/server/services/audio-splicer';

const MAX_BYTES = 250 * 1024 * 1024;

/** Fetch an authorized provider stream, decode the REAL source, and write 48kHz stereo PCM WAV. */
export async function ingestAuthorizedAudio(
  sourceAssetId: string,
  outputWavPath: string,
  fetchAudio: (assetId: string) => Promise<Response> = fetchConfiguredPrivateAudioStream,
) {
  const compressedPath = outputWavPath + '.incoming';
  fs.mkdirSync(path.dirname(outputWavPath), { recursive: true });
  let bytes = 0;
  try {
    const response = await fetchAudio(sourceAssetId);
    if (!response.ok || !response.body) {
      throw new Error('Authorized media source returned HTTP ' + response.status + '. Check your Studio Audio Settings connection and access permissions.');
    }
    const mime = (response.headers.get('content-type') || '').toLowerCase();
    if (mime.includes('text/html') || mime.includes('application/json') || mime.includes('text/plain')) {
      throw new Error('Provider returned a webpage or JSON instead of audio. Check the media URL template.');
    }
    const announced = Number(response.headers.get('content-length') || 0);
    if (announced > MAX_BYTES) throw new Error('Audio source exceeds the 250 MB import limit.');

    const limited = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        bytes += chunk.length;
        if (bytes > MAX_BYTES) callback(new Error('Audio exceeds the 250 MB import limit.'));
        else callback(null, chunk);
      },
    });
    await pipeline(Readable.fromWeb(response.body as any), limited, fs.createWriteStream(compressedPath));
    if (bytes < 8192) throw new Error('Downloaded audio is too small to be a recording.');

    await new Promise<void>((resolve, reject) => {
      const args = ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', compressedPath,
        '-map', '0:a:0', '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', '-f', 'wav', outputWavPath];
      const proc = spawn(getFfmpegPath(), args);
      let stderr = '';
      proc.stderr.on('data', d => { stderr = (stderr + d.toString()).slice(-2000); });
      proc.on('error', reject);
      proc.on('close', code => code === 0 ? resolve() : reject(new Error('FFmpeg could not decode provider audio: ' + stderr)));
    });

    const probe = await probeAudioFile(outputWavPath);
    if (!probe || !Number.isFinite(probe.durationSeconds) || probe.durationSeconds < 2 ||
        !Number.isFinite(probe.sampleRate) || probe.sampleRate !== 48000 || probe.channels !== 2) {
      throw new Error('Decoded WAV failed audio verification.');
    }
    return { filePath: outputWavPath, durationSeconds: Math.round(probe.durationSeconds * 1000) / 1000,
      sampleRate: probe.sampleRate, channels: probe.channels, inputBytes: bytes };
  } catch (error) {
    if (fs.existsSync(outputWavPath)) fs.rmSync(outputWavPath, { force: true });
    throw error;
  } finally {
    if (fs.existsSync(compressedPath)) fs.rmSync(compressedPath, { force: true });
  }
}
