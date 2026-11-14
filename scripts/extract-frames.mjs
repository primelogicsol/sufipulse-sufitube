import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ffmpeg = 'C:\\Users\\Fayaz\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const videoPath = path.join(process.cwd(), '.data', 'pipeline-drafts', 'draft_1794685095942_19d6bbbe', 'video', 'lyric_master.mp4');
const outDir = path.join(process.cwd(), 'public', 'test-frames');
fs.mkdirSync(outDir, { recursive: true });

const timestamps = [
  { t: 4, name: 'frame_04s_intro_clean.png', desc: 'Instrumental Intro (Clean - No Subtitles)' },
  { t: 12, name: 'frame_12s_line1_tasbeeh.png', desc: 'Line 1: Rab Ki Tasbeeh' },
  { t: 20, name: 'frame_20s_line2_bolo.png', desc: 'Line 2: Bolo Ab Toh Bolo' },
  { t: 28, name: 'frame_28s_line3_zameer.png', desc: 'Line 3: Apne Zameer Ke Parde Kholo' },
  { t: 37, name: 'frame_37s_line4_khamosh.png', desc: 'Line 4: Kab Tak Khamosh' },
  { t: 45, name: 'frame_45s_line5_hosh.png', desc: 'Line 5: Kab Jagega Tera Soya Hosh' },
  { t: 54, name: 'frame_54s_line6_shajar.png', desc: 'Line 6: Ya Rab Kya Shajar Tera Zikr Karein' },
  { t: 59, name: 'frame_59s_outro_clean.png', desc: 'Instrumental Outro (Clean - No Subtitles)' }
];

console.log('Extracting verification frames from rendered lyric_master.mp4...');

for (const item of timestamps) {
  const outPath = path.join(outDir, item.name);
  execSync(`"${ffmpeg}" -ss ${item.t} -i "${videoPath}" -frames:v 1 -y "${outPath}"`, { stdio: 'pipe' });
  const stat = fs.statSync(outPath);
  console.log(`✔ Extracted ${item.name} at t=${item.t}s (${stat.size} bytes) - ${item.desc}`);
}
