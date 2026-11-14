import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ffmpeg = 'C:\\Users\\Fayaz\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const fontsDir = path.join(process.cwd(), 'public', 'fonts').replace(/\\/g, '/').replace(/:/g, '\\:');

const assContent = `[Script Info]
Title: SufiPulse Dual-Master Subtitle
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Urdu_Title,Noto Nastaliq Urdu,Arial,58,&H00FFFFFF,&H0000FFFF,&H000A0A0A,&H90000000,-1,0,0,0,100,100,0,0,1,3.5,2,2,60,60,115,1
Style: Eng_Subtitle,Georgia,Arial,34,&H0070D0FF,&H00FFFFFF,&H000A0A0A,&H90000000,0,0,0,0,100,100,0,0,1,2.5,1.5,2,80,80,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:08.50,0:00:16.50,Urdu_Title,,0,0,0,,رَبّ... میری راہ کھول دے
Dialogue: 1,0:00:08.50,0:00:16.50,Eng_Subtitle,,0,0,0,,O Lord, open the spiritual pathway for my soul
Dialogue: 0,0:00:16.50,0:00:24.50,Urdu_Title,,0,0,0,,رَبّ... میری راہ کھول دے
Dialogue: 1,0:00:16.50,0:00:24.50,Eng_Subtitle,,0,0,0,,O Lord, open the spiritual pathway for my soul
Dialogue: 0,0:00:24.50,0:00:32.00,Urdu_Title,,0,0,0,,میری راہ کھول دے
Dialogue: 1,0:00:24.50,0:00:32.00,Eng_Subtitle,,0,0,0,,Open the pathway for my longing soul
Dialogue: 0,0:00:32.00,0:00:40.00,Urdu_Title,,0,0,0,,میری راہ کھول دے
Dialogue: 1,0:00:32.00,0:00:40.00,Eng_Subtitle,,0,0,0,,Open the pathway for my longing soul
Dialogue: 0,0:00:40.00,0:00:48.50,Urdu_Title,,0,0,0,,دِل تھک گیا، سانس گراں ہے
Dialogue: 1,0:00:40.00,0:00:48.50,Eng_Subtitle,,0,0,0,,The weary heart tires, and every breath feels heavy
Dialogue: 0,0:00:48.50,0:00:56.50,Urdu_Title,,0,0,0,,تُو اپنی نگاہ کھول دے
Dialogue: 1,0:00:48.50,0:00:56.50,Eng_Subtitle,,0,0,0,,Cast upon me the gaze of Your Divine Grace
`;

const assPath = 'test_sample.ass';
fs.writeFileSync(assPath, assContent, 'utf8');

const escapedAss = path.resolve(assPath).replace(/\\/g, '/').replace(/:/g, '\\:');
const cmd = `"${ffmpeg}" -loop 1 -i ".data/pipeline-drafts/draft_1794685095942_19d6bbbe/audio/artwork_6a79ea36-a31d-45db-aae1-6862e99db69e.jpeg" -i ".data/pipeline-drafts/draft_1794685095942_19d6bbbe/audio/master_rev1.wav" -t 58 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,subtitles='${escapedAss}':fontsdir='${fontsDir}'" -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p -c:a aac -b:a 320k -y test_fixed_video.mp4`;

console.log('Rendering test video...');
execSync(cmd, { stdio: 'inherit' });
console.log('Render complete! Extracting verification frames at 4s, 12s, 28s, 44s, 52s...');

const outDir = 'public/test-frames';
fs.mkdirSync(outDir, { recursive: true });

[4, 12, 28, 44, 52].forEach(sec => {
  const fPath = `${outDir}/frame_${sec}s.png`;
  execSync(`"${ffmpeg}" -ss ${sec} -i test_fixed_video.mp4 -frames:v 1 -y "${fPath}"`);
  console.log(`Saved ${fPath} (${fs.statSync(fPath).size} bytes)`);
});
