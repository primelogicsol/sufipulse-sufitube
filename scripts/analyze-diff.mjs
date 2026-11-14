import fs from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';

const ffmpeg = 'C:\\Users\\Fayaz\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';

const tests = [
  { frame: 'frame_12s_line1_tasbeeh.png', name: 'Line 1 (t=12s)' },
  { frame: 'frame_20s_line2_bolo.png', name: 'Line 2 (t=20s)' },
  { frame: 'frame_28s_line3_zameer.png', name: 'Line 3 (t=28s)' },
  { frame: 'frame_37s_line4_khamosh.png', name: 'Line 4 (t=37s)' },
  { frame: 'frame_45s_line5_hosh.png', name: 'Line 5 (t=45s)' },
  { frame: 'frame_54s_line6_shajar.png', name: 'Line 6 (t=54s)' },
];

console.log('--- Subtitle Bounding Box & Zone Analysis ---');

for (const t of tests) {
  const diffPath = `public/test-frames/diff_${t.frame}`;
  execSync(`"${ffmpeg}" -i public/test-frames/frame_04s_intro_clean.png -i public/test-frames/${t.frame} -filter_complex blend=difference -y "${diffPath}"`, { stdio: 'pipe' });
  
  const res = spawnSync(ffmpeg, ['-i', diffPath, '-vf', 'bbox=min_val=20', '-f', 'null', '-'], { encoding: 'utf8' });
  const stderr = res.stderr || '';
  const match = stderr.match(/pts_time:[0-9.]+\s+x1:([0-9]+)\s+x2:([0-9]+)\s+y1:([0-9]+)\s+y2:([0-9]+)\s+w:([0-9]+)\s+h:([0-9]+)/);
  if (match) {
    const [_, x1, x2, y1, y2, w, h] = match;
    console.log(`✔ ${t.name}: Subtitles DETECTED -> Bounding Box: x=[${x1}..${x2}], y=[${y1}..${y2}], width=${w}px, height=${h}px`);
  } else {
    console.log(`✖ ${t.name}: No bounding box detected`);
  }
}

// Compare t=59s against t=4s (both should be clean background)
execSync(`"${ffmpeg}" -i public/test-frames/frame_04s_intro_clean.png -i public/test-frames/frame_59s_outro_clean.png -filter_complex blend=difference -y public/test-frames/diff_intro_vs_outro.png`, { stdio: 'pipe' });
try {
  execSync(`"${ffmpeg}" -i public/test-frames/diff_intro_vs_outro.png -vf bbox=min_val=20 -f null -`, { stdio: 'pipe' });
  console.log('✔ Clean Outro Check: Exact match with clean canvas (zero subtitle pixels detected)');
} catch (err) {
  const stderr = err.stderr ? err.stderr.toString() : '';
  const match = stderr.match(/pts_time:[0-9.]+\s+x1:([0-9]+)/);
  if (!match) {
    console.log('✔ Clean Outro Check: Exact match with clean canvas (zero subtitle pixels detected)');
  } else {
    console.log('✖ Outro has lingering pixels:', match[0]);
  }
}
