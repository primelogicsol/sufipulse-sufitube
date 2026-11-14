import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ffmpeg = 'C:\\Users\\Fayaz\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const fontsDir = path.join(process.cwd(), 'public', 'fonts').replace(/\\/g, '/').replace(/:/g, '\\:');

const assContent = `[Script Info]
Title: SufiPulse Fixed Dual Subtitle
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Urdu_Title,Noto Nastaliq Urdu,68,&H00FFFFFF,&H0000FFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3.5,2.0,2,40,40,130,1
Style: Eng_Subtitle,Georgia,40,&H0050D0FF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2.5,1.5,2,50,50,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:10.00,Urdu_Title,,0,0,0,,رَبّ... میری راہ کھول دے
Dialogue: 1,0:00:00.00,0:00:10.00,Eng_Subtitle,,0,0,0,,O Lord, open the spiritual pathway for my soul
`;

fs.writeFileSync('test_clean.ass', assContent, 'utf8');
const escapedAss = path.resolve('test_clean.ass').replace(/\\/g, '/').replace(/:/g, '\\:');

const cmd = `"${ffmpeg}" -loop 1 -i ".data/pipeline-drafts/draft_1794685095942_19d6bbbe/audio/artwork_6a79ea36-a31d-45db-aae1-6862e99db69e.jpeg" -t 1 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,subtitles='${escapedAss}':fontsdir='${fontsDir}'" -frames:v 1 -y public/test-frames/verified_frame.png`;

console.log('Rendering 1 frame with corrected ASS styles...');
execSync(cmd, { stdio: 'inherit' });
console.log('Render complete! File size:', fs.statSync('public/test-frames/verified_frame.png').size);
