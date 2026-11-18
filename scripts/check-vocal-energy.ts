import fs from 'fs';
import path from 'path';

// Read the isolated vocal WAV and compute RMS per second between 98s and 128s
const wavPath = path.resolve('.data/pipeline-drafts/draft_1794752884539_0eb391d5/alignment/vocals/master_rev1_(Vocals)_UVR-MDX-NET-Voc_FT.wav');
const fd = fs.openSync(wavPath, 'r');

// Read header
const header = Buffer.alloc(44);
fs.readSync(fd, header, 0, 44, 0);

const sampleRate = header.readUInt32LE(24);
const numChannels = header.readUInt16LE(22);
const bitsPerSample = header.readUInt16LE(34);
const bytesPerSample = bitsPerSample / 8;

console.log({ sampleRate, numChannels, bitsPerSample });

// Each second of audio
const bytesPerSec = sampleRate * numChannels * bytesPerSample;

console.log('\n--- Isolated Vocal Energy (RMS) from 98s to 128s ---');
for (let sec = 98; sec <= 128; sec++) {
  const buf = Buffer.alloc(bytesPerSec);
  const pos = 44 + sec * bytesPerSec;
  const bytesRead = fs.readSync(fd, buf, 0, bytesPerSec, pos);
  if (bytesRead < bytesPerSec) break;

  let sumSq = 0;
  const sampleCount = bytesRead / 2; // 16-bit
  for (let i = 0; i < bytesRead; i += 2) {
    const val = buf.readInt16LE(i);
    sumSq += val * val;
  }
  const rms = Math.sqrt(sumSq / sampleCount);
  const db = 20 * Math.log10(Math.max(1, rms) / 32768);
  const isSinging = db > -32;
  console.log(`[${sec}s - ${sec+1}s] RMS: ${rms.toFixed(0)} | dB: ${db.toFixed(1)} dB | ${isSinging ? 'VOICE SINGING 🗣️' : 'SILENCE / NO VOCAL 🔇'}`);
}

fs.closeSync(fd);
