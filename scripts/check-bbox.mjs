import fs from 'node:fs';
import { execSync } from 'node:child_process';

const ffmpeg = 'C:\\Users\\Fayaz\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';

execSync(`"${ffmpeg}" -i public/test-frames/frame_4s.png -i public/test-frames/frame_12s.png -filter_complex "blend=difference" -y public/test-frames/diff_12s.png`);
console.log('Diff image size:', fs.statSync('public/test-frames/diff_12s.png').size);

try {
  execSync(`"${ffmpeg}" -i public/test-frames/diff_12s.png -vf "bbox=min_val=16" -f null -`, { stdio: 'inherit' });
} catch (e) {
  // ffmpeg outputs bbox to stderr
}
