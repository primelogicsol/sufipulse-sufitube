import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ffmpeg = 'C:\\Users\\Fayaz\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const fontsDir = path.join(process.cwd(), 'public', 'fonts').replace(/\\/g, '/').replace(/:/g, '\\:');

const ass1 = `[Script Info]
Title: Test RTL
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Mystic_Primary,Noto Nastaliq Urdu,68,&H00FFFFFF,&H0000FFFF,&H00000000,&H90000000,-1,0,0,0,100,100,0,0,1,4.0,3.0,2,40,40,140,1
Style: Mystic_Secondary,Georgia,40,&H0050D0FF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,3.0,2.0,2,50,50,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:05.00,Mystic_Primary,,0,0,0,,{\\k130}پکاریں! {\\k70}اشجار {\\k150}میں {\\k80}تسبیح {\\k170}کی {\\k200}رَب
Dialogue: 1,0:00:00.00,0:00:05.00,Mystic_Secondary,,0,0,0,,In the Divine Tasbeeh, the sacred trees call out!
`;

fs.writeFileSync('test_rtl_reversed.ass', ass1, 'utf8');
const escapedAss = path.resolve('test_rtl_reversed.ass').replace(/\\/g, '/').replace(/:/g, '\\:');

execSync(`"${ffmpeg}" -loop 1 -i ".data/pipeline-drafts/draft_1794685095942_19d6bbbe/audio/artwork_6a79ea36-a31d-45db-aae1-6862e99db69e.jpeg" -t 1 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,subtitles='${escapedAss}':fontsdir='${fontsDir}'" -frames:v 1 -y public/test-frames/test_rtl_reversed.png`, { stdio: 'pipe' });
console.log('Reversed RTL rendered');
